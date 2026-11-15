import express from "express";
import helmet from "helmet";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { openDatabase } from "./db.js";
import {
  probe,
  transcode,
  safeUnlink,
  validateMagic,
  sanitizeImage,
} from "./media.js";

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const hash = (s: string | Buffer) =>
  crypto.createHash("sha256").update(s).digest("hex");
const text = (v: unknown, max = 2000, min = 0) => {
  if (typeof v !== "string" || v.trim().length < min || v.length > max)
    throw Object.assign(
      new Error(`Text must contain ${min}–${max} characters.`),
      { status: 400 },
    );
  return v.trim();
};
const fail = (status: number, message: string): never => {
  throw Object.assign(new Error(message), { status });
};
const bool = (v: unknown) => v === true || v === 1;
const visibility = (v: unknown) =>
  ["public", "private", "unlisted"].includes(String(v))
    ? String(v)
    : fail(400, "Choose a valid visibility.");
const noContact = (body: string) => {
  if (
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(body) ||
    /(?:\+?\d[\s().-]*){9,}/.test(body)
  )
    fail(
      400,
      "Please remove personal contact information. Keep conversations public on Leafster.",
    );
  return body;
};

export function createApp(options: { dataDir?: string; origin?: string } = {}) {
  const dataDir = path.resolve(
    options.dataDir || process.env.LEAFSTER_DATA_DIR || "./data",
  );
  const appOrigin =
    options.origin || process.env.APP_ORIGIN || "http://127.0.0.1:5173";
  const production = process.env.NODE_ENV === "production";
  if (
    production &&
    (!appOrigin.startsWith("https://") ||
      process.env.LEAFSTER_TEST_AUTH === "true")
  )
    throw new Error(
      "Production requires HTTPS and test authentication disabled.",
    );
  const mediaDir = path.join(dataDir, "media"),
    tmpDir = path.join(dataDir, "tmp");
  fs.mkdirSync(mediaDir, { recursive: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  const db = openDatabase(dataDir);
  const get = (sql: string, ...p: any[]) => db.prepare(sql).get(...p) as any;
  const all = (sql: string, ...p: any[]) => db.prepare(sql).all(...p) as any[];
  const exec = (sql: string, ...p: any[]) => db.prepare(sql).run(...p);
  const app = express();
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com"],
          mediaSrc: ["'self'", "blob:"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: "64kb" }));
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    next();
  });
  app.use((req: any, res, next) => {
    const cookie = String(req.headers.cookie || "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("leafster_session="))
      ?.slice(17);
    let session =
      cookie && /^[a-f0-9]{64}$/.test(cookie)
        ? get(
            "SELECT * FROM sessions WHERE hash=? AND expires_at>?",
            hash(cookie),
            now(),
          )
        : null;
    const startsSession =
      req.method === "GET" &&
      ["/api/session", "/api/auth/google"].includes(req.path);
    if (!session && startsSession) {
      rate(req, "session-issuance", 60, 3600000);
      exec("DELETE FROM sessions WHERE expires_at<?", now());
      if (get("SELECT count(*) n FROM sessions").n >= 20000)
        fail(503, "Sign-in capacity is temporarily full. Please try later.");
      const token = crypto.randomBytes(32).toString("hex");
      session = {
        hash: hash(token),
        csrf: crypto.randomBytes(32).toString("hex"),
        user_id: null,
        expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
        created_at: now(),
      };
      exec(
        "INSERT INTO sessions(hash,user_id,csrf,expires_at,created_at) VALUES(?,?,?,?,?)",
        session.hash,
        null,
        session.csrf,
        session.expires_at,
        session.created_at,
      );
      res.cookie("leafster_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: production,
        maxAge: 86400000 * 7,
        path: "/",
      });
    }
    req.session = session;
    req.user = session?.user_id
      ? get(
          "SELECT * FROM users WHERE id=? AND status='active'",
          session.user_id,
        )
      : null;
    if (
      req.user?.google_sub &&
      !(process.env.LEAFSTER_ALLOWED_EMAILS || "")
        .toLowerCase()
        .split(",")
        .map((x) => x.trim())
        .includes(req.user.email.toLowerCase())
    ) {
      exec("DELETE FROM sessions WHERE user_id=?", req.user.id);
      req.user = null;
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (!session)
        return res
          .status(403)
          .json({ error: "Refresh the page before trying again." });
      if (req.headers.origin && req.headers.origin !== appOrigin)
        return res.status(403).json({ error: "Request origin was rejected." });
      const token = req.headers["x-csrf-token"];
      if (
        typeof token !== "string" ||
        token.length !== session.csrf.length ||
        !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(session.csrf))
      )
        return res
          .status(403)
          .json({ error: "Refresh the page before trying again." });
    }
    next();
  });
  const asyncRoute = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve()
      .then(() => fn(req, res))
      .catch(next);
  const auth = (req: any) => {
    if (!req.user) fail(401, "Sign in to continue.");
    if (!req.user.adult_confirmed_at || !req.user.handle)
      fail(403, "Complete your adult-only staging profile first.");
    return req.user;
  };
  const signed = (req: any) => req.user || fail(401, "Sign in to continue.");
  const rate = (req: any, scope: string, max = 30, window = 60000) => {
    const key = `${scope}:${req.user?.id || req.socket.remoteAddress}`;
    const n = Date.now();
    const r = get("SELECT * FROM rate_limits WHERE key=?", key);
    if (!r || r.reset_at < n)
      exec(
        "INSERT OR REPLACE INTO rate_limits VALUES(?,?,?)",
        key,
        1,
        n + window,
      );
    else {
      if (r.hits >= max) fail(429, "Please wait before trying again.");
      exec("UPDATE rate_limits SET hits=hits+1 WHERE key=?", key);
    }
  };
  const blocked = (a: string, b: string) =>
    !!get(
      "SELECT 1 FROM blocks WHERE (user_id=? AND blocked_id=?) OR (user_id=? AND blocked_id=?)",
      a,
      b,
      b,
      a,
    );
  const userShape = (u: any) =>
    u
      ? {
          id: u.id,
          name: u.name,
          handle: u.handle,
          avatar: u.avatar,
          role: u.role,
          onboarded: !!(u.handle && u.adult_confirmed_at),
        }
      : null;
  const author = (uid: string) =>
    userShape(get("SELECT * FROM users WHERE id=?", uid));
  const channelShape = (c: any) => {
    const u = get("SELECT * FROM users WHERE id=?", c.user_id);
    return {
      id: c.id,
      userId: c.user_id,
      name: c.name,
      handle: u.handle,
      avatar: u.avatar,
      description: c.description,
      links: JSON.parse(c.links),
      subscribers: get(
        "SELECT count(*) n FROM subscriptions WHERE channel_id=?",
        c.id,
      ).n,
      uploads: get(
        "SELECT count(*) n FROM videos WHERE channel_id=? AND status='ready' AND visibility='public'",
        c.id,
      ).n,
    };
  };
  const canVideo = (v: any, req: any) => {
    if (!v || v.status === "removed") return false;
    const owner = get(
      "SELECT u.id,u.status FROM users u JOIN channels c ON c.user_id=u.id WHERE c.id=?",
      v.channel_id,
    );
    return (
      !!owner &&
      owner.status === "active" &&
      (v.visibility !== "private" || owner.id === req.user?.id) &&
      (!req.user || !blocked(req.user.id, owner.id))
    );
  };
  const requireVideo = (vid: string, req: any) => {
    const v = get(
      "SELECT v.* FROM videos v JOIN channels c ON c.id=v.channel_id JOIN users u ON u.id=c.user_id WHERE v.id=? AND u.status='active'",
      vid,
    );
    if (!canVideo(v, req)) fail(404, "Video not found.");
    return v;
  };
  const ownedVideo = (vid: string, req: any) => {
    auth(req);
    const v = get(
      "SELECT v.* FROM videos v JOIN channels c ON c.id=v.channel_id WHERE v.id=? AND c.user_id=?",
      vid,
      req.user.id,
    );
    return v || fail(404, "Video not found.");
  };
  const videoShape = (v: any, req: any) => ({
    ...{
      id: v.id,
      title: v.title,
      description: v.description,
      visibility: v.visibility,
      status: v.status,
      duration: v.duration,
      createdAt: v.created_at,
      commentsEnabled: !!v.comments_enabled,
      error: v.error,
    },
    thumbnailUrl: v.thumbnail_path ? `/api/media/${v.id}/thumbnail` : null,
    playbackUrl: v.status === "ready" ? `/api/media/${v.id}/video` : null,
    views: get("SELECT count(*) n FROM video_views WHERE video_id=?", v.id).n,
    likes: get(
      "SELECT count(*) n FROM reactions WHERE video_id=? AND value=1",
      v.id,
    ).n,
    dislikes: get(
      "SELECT count(*) n FROM reactions WHERE video_id=? AND value=-1",
      v.id,
    ).n,
    reaction: req.user
      ? get(
          "SELECT value FROM reactions WHERE video_id=? AND user_id=?",
          v.id,
          req.user.id,
        )?.value || 0
      : 0,
    subscribed: !!(
      req.user &&
      get(
        "SELECT 1 FROM subscriptions WHERE channel_id=? AND user_id=?",
        v.channel_id,
        req.user.id,
      )
    ),
    progress: req.user
      ? get(
          "SELECT seconds FROM history WHERE video_id=? AND user_id=?",
          v.id,
          req.user.id,
        )?.seconds || 0
      : 0,
    channel: channelShape(
      get("SELECT * FROM channels WHERE id=?", v.channel_id),
    ),
  });
  const commentShape = (c: any) => ({
    id: c.id,
    body: c.body,
    parentId: c.parent_id,
    pinned: !!c.pinned,
    createdAt: c.created_at,
    author: author(c.user_id),
  });
  const leafShape = (l: any, req: any, withReplies = true): any => ({
    id: l.id,
    body: l.body,
    parentId: l.parent_id,
    videoId: l.video_id,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    author: author(l.user_id),
    likes: get("SELECT count(*) n FROM leaf_likes WHERE leaf_id=?", l.id).n,
    reposts: get("SELECT count(*) n FROM leaf_reposts WHERE leaf_id=?", l.id).n,
    liked: !!(
      req.user &&
      get(
        "SELECT 1 FROM leaf_likes WHERE user_id=? AND leaf_id=?",
        req.user.id,
        l.id,
      )
    ),
    reposted: !!(
      req.user &&
      get(
        "SELECT 1 FROM leaf_reposts WHERE user_id=? AND leaf_id=?",
        req.user.id,
        l.id,
      )
    ),
    replies: withReplies
      ? all(
          "SELECT l.* FROM leaves l JOIN users u ON u.id=l.user_id WHERE l.parent_id=? AND l.status='visible' AND u.status='active' ORDER BY l.created_at LIMIT 100",
          l.id,
        )
          .filter((r) => !req.user || !blocked(req.user.id, r.user_id))
          .map((r) => leafShape(r, req, false))
      : [],
  });
  const noteShape = (n: any) => ({
    id: n.id,
    body: n.body,
    sources: JSON.parse(n.sources),
    status: n.status,
    targetType: n.target_type,
    targetId: n.target_id,
    createdAt: n.created_at,
    author: n.user_id ? author(n.user_id) : null,
  });
  const playlistShape = (p: any) => ({
    id: p.id,
    title: p.title,
    visibility: p.visibility,
    itemCount: get(
      "SELECT count(*) n FROM playlist_items WHERE playlist_id=?",
      p.id,
    ).n,
  });
  const getSettings = (uid: string) => {
    const s = get("SELECT * FROM settings WHERE user_id=?", uid);
    return {
      historyEnabled: !!s?.history_enabled,
      autoplay: !!s?.autoplay,
      notifyUploads: !!s?.notify_uploads,
    };
  };
  const quota = (uid: string) => ({
    usedBytes:
      get(
        "SELECT coalesce(sum(bytes),0) n FROM videos WHERE channel_id IN (SELECT id FROM channels WHERE user_id=?)",
        uid,
      ).n +
      get("SELECT coalesce(sum(bytes),0) n FROM stories WHERE user_id=?", uid)
        .n,
    maxBytes: 500 * 1024 * 1024,
    maxUploadBytes: 100 * 1024 * 1024,
  });
  // Browsing and media require an approved, completed profile. Legal notices
  // remain available to non-account holders through their anonymous CSRF session.
  const publicApiPaths = new Set([
    "/api/health",
    "/api/session",
    "/api/auth/google",
    "/api/auth/callback",
    "/api/auth/logout",
    "/api/onboarding",
    "/api/legal/notices",
    // The handler exists only inside an explicitly isolated test process.
    "/api/test/login",
  ]);
  app.use((req: any, _res, next) => {
    if (
      !req.path.toLowerCase().startsWith("/api/") ||
      publicApiPaths.has(req.path)
    )
      return next();
    try {
      auth(req);
      next();
    } catch (error) {
      next(error);
    }
  });
  const googleConfigured = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const google = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${appOrigin}/api/auth/callback`,
  );
  const makeSession = (req: any, res: any, userId: string) => {
    exec("DELETE FROM sessions WHERE hash=?", req.session.hash);
    const token = crypto.randomBytes(32).toString("hex"),
      csrf = crypto.randomBytes(32).toString("hex");
    exec(
      "INSERT INTO sessions VALUES(?,?,?,?,?)",
      hash(token),
      userId,
      csrf,
      new Date(Date.now() + 86400000 * 7).toISOString(),
      now(),
    );
    res.cookie("leafster_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: production,
      path: "/",
      maxAge: 86400000 * 7,
    });
    return csrf;
  };
  app.get("/api/session", (req: any, res) =>
    res.json({
      user: userShape(req.user),
      csrfToken: req.session.csrf,
      googleConfigured,
      registrationOpen: false,
    }),
  );
  app.get("/api/health", (_req, res) =>
    res.json({
      status: "ok",
      registrationOpen: false,
      videoProcessing: "local-worker",
    }),
  );
  app.get(
    "/api/auth/google",
    asyncRoute(async (req: any, res: any) => {
      rate(req, "oauth", 10);
      if (!googleConfigured)
        fail(503, "Google sign-in is awaiting EuroLoot OAuth configuration.");
      const verifier = crypto.randomBytes(32).toString("base64url"),
        challenge = crypto
          .createHash("sha256")
          .update(verifier)
          .digest("base64url"),
        state = crypto.randomBytes(32).toString("hex"),
        nonce = crypto.randomBytes(32).toString("hex");
      exec(
        "INSERT INTO oauth_states VALUES(?,?,?,?,?)",
        state,
        req.session.hash,
        verifier,
        nonce,
        new Date(Date.now() + 600000).toISOString(),
      );
      res.redirect(
        google.generateAuthUrl({
          scope: ["openid", "email", "profile"],
          state,
          nonce,
          code_challenge: challenge,
          code_challenge_method: "S256" as any,
          access_type: "online",
          prompt: "select_account",
        }),
      );
    }),
  );
  app.get(
    "/api/auth/callback",
    asyncRoute(async (req: any, res: any) => {
      rate(req, "oauth", 10);
      const state = text(req.query.state, 128, 1),
        st = get(
          "SELECT * FROM oauth_states WHERE state=? AND session_hash=? AND expires_at>?",
          state,
          req.session?.hash || "",
          now(),
        );
      if (!st) fail(400, "Your sign-in request expired. Start again.");
      exec("DELETE FROM oauth_states WHERE state=?", state);
      if (req.query.error) return res.redirect("/?authError=cancelled");
      const { tokens } = await google.getToken({
        code: text(req.query.code, 4096, 1),
        codeVerifier: st.verifier,
      });
      if (!tokens.id_token)
        fail(401, "Google did not return an identity token.");
      const ticket = await google.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const p = ticket.getPayload() as any;
      if (!p?.sub || !p.email_verified || p.nonce !== st.nonce)
        fail(401, "Identity verification failed.");
      const allowed = (process.env.LEAFSTER_ALLOWED_EMAILS || "")
        .toLowerCase()
        .split(",")
        .map((x) => x.trim());
      if (!allowed.includes(String(p.email).toLowerCase()))
        fail(
          403,
          "This staging service is invitation only. Public registration is closed.",
        );
      let u = get("SELECT * FROM users WHERE google_sub=?", p.sub);
      if (!u) {
        const uid = id();
        exec(
          "INSERT INTO users(id,google_sub,email,name,avatar,created_at) VALUES(?,?,?,?,?,?)",
          uid,
          p.sub,
          p.email,
          p.name || "Creator",
          /^https:\/\/lh3\.googleusercontent\.com\//.test(p.picture || "")
            ? p.picture
            : "",
          now(),
        );
        exec("INSERT INTO settings(user_id) VALUES(?)", uid);
        u = get("SELECT * FROM users WHERE id=?", uid);
      }
      if (u.status !== "active")
        fail(
          403,
          "This account is restricted. Contact the operator to appeal.",
        );
      makeSession(req, res, u.id);
      res.redirect(u.handle ? "/" : "/onboarding");
    }),
  );
  app.post("/api/auth/logout", (req: any, res) => {
    exec("DELETE FROM sessions WHERE hash=?", req.session.hash);
    res.clearCookie("leafster_session", { path: "/" });
    res.json({ ok: true });
  });
  app.post(
    "/api/onboarding",
    asyncRoute((req: any, res: any) => {
      const u = signed(req);
      rate(req, "onboard", 5);
      if (u.handle) fail(409, "Profile already created.");
      if (req.body.adultConfirmed !== true)
        fail(
          400,
          "This restricted staging service is for adults aged 18 and over.",
        );
      const handle = text(req.body.handle, 30, 3).toLowerCase();
      if (!/^[a-z0-9_]{3,30}$/.test(handle))
        fail(400, "Use 3–30 lowercase letters, digits or underscores.");
      if (get("SELECT 1 FROM users WHERE handle=?", handle))
        fail(409, "This handle is already taken.");
      const name = text(req.body.name, 80, 1);
      db.exec("BEGIN");
      try {
        exec(
          "UPDATE users SET handle=?,name=?,adult_confirmed_at=? WHERE id=?",
          handle,
          name,
          now(),
          u.id,
        );
        exec(
          "INSERT INTO channels(id,user_id,name,created_at) VALUES(?,?,?,?)",
          id(),
          u.id,
          name,
          now(),
        );
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
      res.json({
        user: userShape(get("SELECT * FROM users WHERE id=?", u.id)),
      });
    }),
  );
  const feedInfo = (feed: string) =>
    Object.getOwnPropertyDescriptor(
      {
        recommended: {
          label: "Recommended",
          criteria:
            "Public uploads, newest first unless you explicitly choose another sort. This initial feed does not use personalised tracking.",
        },
        latest: {
          label: "Latest",
          criteria:
            "Public uploads in publication order, newest first unless you explicitly choose another sort.",
        },
        subscriptions: {
          label: "Subscriptions",
          criteria:
            "Public uploads from channels you subscribe to, in publication order unless you explicitly choose another sort.",
        },
        liked: {
          label: "Liked Videos",
          criteria:
            "Accessible videos you have liked. Disliked and removed videos are excluded.",
        },
        trending: {
          label: "Most watched this week",
          criteria:
            "Videos with at least one counted view in the last seven calendar days, ranked by signed-in daily viewers. Counts are deduplicated per account, video and day.",
        },
        fresh: {
          label: "Fresh Finds",
          criteria:
            "The newest public upload from each channel with fewer than 1,000 subscribers, published within the last 30 days. Newest first; no paid placement.",
        },
      },
      feed || "recommended",
    )?.value;
  const listVideos = (req: any, extra = "", params: any[] = []) => {
    const feed =
      typeof req.query.feed === "string" ? req.query.feed : "recommended";
    if (!feedInfo(feed)) fail(400, "Choose a supported video feed.");
    if (req.query.category !== undefined)
      fail(
        400,
        "Topic categories are not available in the initial catalogue. Use duration or search filters.",
      );
    if (["liked", "subscriptions"].includes(feed) && !req.user) return [];
    const q = typeof req.query.q === "string" ? req.query.q.slice(0, 200) : "";
    let where = "v.status='ready' AND u.status='active'" + extra;
    const p = [...params];
    if (feed === "liked") {
      where +=
        " AND (v.visibility<>'private' OR c.user_id=?) AND EXISTS(SELECT 1 FROM reactions r WHERE r.video_id=v.id AND r.user_id=? AND r.value=1)";
      p.push(req.user.id, req.user.id);
    } else where += " AND v.visibility='public'";
    if (q) {
      where +=
        " AND (v.title LIKE ? ESCAPE '\\' OR v.description LIKE ? ESCAPE '\\' OR c.name LIKE ? ESCAPE '\\')";
      const pattern = "%" + q.replace(/[\\%_]/g, "\\$&") + "%";
      p.push(pattern, pattern, pattern);
    }
    if (req.user) {
      where +=
        " AND NOT EXISTS(SELECT 1 FROM blocks b WHERE (b.user_id=? AND b.blocked_id=u.id) OR (b.blocked_id=? AND b.user_id=u.id))";
      p.push(req.user.id, req.user.id);
    }
    if (feed === "subscriptions") {
      where +=
        " AND EXISTS(SELECT 1 FROM subscriptions s WHERE s.channel_id=c.id AND s.user_id=?)";
      p.push(req.user.id);
    }
    if (req.query.duration === "short") where += " AND v.duration<240";
    else if (req.query.duration === "long") where += " AND v.duration>=1200";
    else if (req.query.duration !== undefined)
      fail(400, "Choose a supported duration filter.");
    const requestedSort = req.query.sort || "newest";
    if (!["newest", "oldest", "views"].includes(requestedSort))
      fail(400, "Choose a supported sort order.");
    let sort =
      requestedSort === "oldest"
        ? "coalesce(v.published_at,v.created_at) ASC"
        : requestedSort === "views"
          ? "(SELECT count(*) FROM video_views WHERE video_id=v.id) DESC,coalesce(v.published_at,v.created_at) DESC"
          : "coalesce(v.published_at,v.created_at) DESC";
    if (feed === "trending") {
      const cutoff = new Date(Date.now() - 6 * 86400000)
        .toISOString()
        .slice(0, 10);
      where +=
        " AND EXISTS(SELECT 1 FROM video_views w WHERE w.video_id=v.id AND w.day>=?)";
      p.push(cutoff);
      sort = `(SELECT count(*) FROM video_views w WHERE w.video_id=v.id AND w.day>='${cutoff}') DESC,coalesce(v.published_at,v.created_at) DESC`;
    }
    if (feed === "fresh") {
      where +=
        " AND v.published_at>=? AND (SELECT count(*) FROM subscriptions s WHERE s.channel_id=c.id)<1000 AND NOT EXISTS(SELECT 1 FROM videos newer WHERE newer.channel_id=v.channel_id AND newer.visibility='public' AND newer.status='ready' AND (newer.published_at>v.published_at OR (newer.published_at=v.published_at AND newer.id>v.id)))";
      p.push(new Date(Date.now() - 30 * 86400000).toISOString());
      sort = "v.published_at DESC";
    }
    const offset = Math.max(
      0,
      Math.min(10000, Math.floor(Number(req.query.offset) || 0)),
    );
    return all(
      `SELECT v.* FROM videos v JOIN channels c ON c.id=v.channel_id JOIN users u ON u.id=c.user_id WHERE ${where} ORDER BY ${sort} LIMIT 25 OFFSET ?`,
      ...p,
      offset,
    ).map((v) => videoShape(v, req));
  };
  app.get(
    "/api/videos",
    asyncRoute((req: any, res: any) => {
      const videos = listVideos(req);
      res.json({
        videos: videos.slice(0, 24),
        hasMore: videos.length > 24,
        feedInfo: feedInfo(req.query.feed),
      });
    }),
  );
  app.get(
    "/api/videos/:id",
    asyncRoute((req: any, res: any) => {
      const v = requireVideo(req.params.id, req);
      const comments = all(
        "SELECT c.* FROM comments c JOIN users u ON u.id=c.user_id WHERE c.video_id=? AND c.status='visible' AND u.status='active' ORDER BY c.pinned DESC,c.created_at DESC LIMIT 200",
        v.id,
      )
        .filter((c) => !req.user || !blocked(req.user.id, c.user_id))
        .map(commentShape);
      res.json({
        video: videoShape(v, req),
        comments,
        notes: all(
          "SELECT * FROM notes WHERE target_type='video' AND target_id=? AND status='accepted'",
          v.id,
        ).map(noteShape),
        related: listVideos({ ...req, query: {} }, " AND v.id<>?", [
          v.id,
        ]).slice(0, 8),
      });
    }),
  );
  const upload = multer({
    dest: tmpDir,
    limits: {
      fileSize: 100 * 1024 * 1024,
      files: 1,
      fields: 12,
      fieldSize: 8000,
    },
  });
  let activeUploads = 0;
  const uploadingUsers = new Set<string>();
  const uploadGate = (req: any, res: any, next: any) => {
    try {
      auth(req);
      if (activeUploads >= 2 || uploadingUsers.has(req.user.id))
        fail(429, "Another upload is in progress. Please wait.");
      const reserved =
        get("SELECT coalesce(sum(bytes),0) n FROM videos").n +
        get("SELECT coalesce(sum(bytes),0) n FROM stories").n;
      const max = Number(
        process.env.LEAFSTER_TOTAL_STORAGE_BYTES || 2147483648,
      );
      if (reserved + 262144000 > max)
        fail(413, "Staging storage is at its safe capacity.");
      activeUploads++;
      uploadingUsers.add(req.user.id);
      let released = false;
      const release = () => {
        if (!released) {
          released = true;
          activeUploads--;
          uploadingUsers.delete(req.user.id);
        }
      };
      res.once("finish", release);
      res.once("close", release);
      next();
    } catch (e) {
      next(e);
    }
  };
  let processing = false,
    stopped = false;
  const worker = async () => {
    if (processing || stopped) return;
    processing = true;
    try {
      for (;;) {
        const job = get(
          "SELECT j.*,v.source_path FROM processing_jobs j JOIN videos v ON v.id=j.video_id WHERE j.status='queued' AND v.status='queued' ORDER BY j.updated_at LIMIT 1",
        );
        if (!job || stopped) break;
        const v = get("SELECT * FROM videos WHERE id=?", job.video_id);
        exec(
          "UPDATE processing_jobs SET status='processing',attempts=attempts+1,updated_at=? WHERE id=?",
          now(),
          job.id,
        );
        exec(
          "UPDATE videos SET status='processing',error=NULL WHERE id=?",
          v.id,
        );
        const dest = path.join(mediaDir, `${v.id}.mp4`),
          thumb = path.join(mediaDir, `${v.id}.jpg`);
        try {
          const result = await transcode(v.source_path, dest, thumb);
          const existing = get(
            "SELECT v.*,u.status owner_status FROM videos v JOIN channels c ON c.id=v.channel_id JOIN users u ON u.id=c.user_id WHERE v.id=?",
            v.id,
          );
          if (
            !existing ||
            existing.status !== "processing" ||
            existing.owner_status !== "active"
          ) {
            safeUnlink(dest);
            safeUnlink(thumb);
            safeUnlink(v.source_path);
            if (existing) {
              exec(
                "UPDATE videos SET status='removed',source_path=NULL WHERE id=?",
                v.id,
              );
              exec(
                "UPDATE processing_jobs SET status='cancelled' WHERE id=?",
                job.id,
              );
            }
            continue;
          }
          exec(
            "UPDATE videos SET status='ready',media_path=?,thumbnail_path=?,duration=?,width=?,height=?,bytes=?,source_path=NULL,published_at=CASE WHEN visibility='public' THEN ? ELSE NULL END WHERE id=?",
            dest,
            thumb,
            result.duration,
            result.width,
            result.height,
            result.bytes,
            now(),
            v.id,
          );
          exec(
            "UPDATE processing_jobs SET status='ready',updated_at=? WHERE id=?",
            now(),
            job.id,
          );
          safeUnlink(v.source_path);
          if (existing.visibility === "public") {
            for (const s of all(
              "SELECT s.user_id FROM subscriptions s JOIN settings st ON st.user_id=s.user_id WHERE s.channel_id=? AND st.notify_uploads=1",
              v.channel_id,
            )) {
              exec(
                "INSERT INTO notifications VALUES(?,?,?,?,?,?,?)",
                id(),
                s.user_id,
                "upload",
                `New upload: ${v.title}`,
                `/watch/${v.id}`,
                0,
                now(),
              );
            }
          }
        } catch (e: any) {
          safeUnlink(dest);
          safeUnlink(thumb);
          exec(
            "UPDATE videos SET status='failed',error=? WHERE id=? AND status='processing'",
            String(e.message).slice(0, 250),
            v.id,
          );
          exec(
            "UPDATE processing_jobs SET status='failed',error=?,updated_at=? WHERE id=?",
            String(e.message).slice(0, 250),
            now(),
            job.id,
          );
        }
      }
    } finally {
      processing = false;
    }
  };
  exec("UPDATE processing_jobs SET status='queued' WHERE status='processing'");
  exec("UPDATE videos SET status='queued' WHERE status='processing'");
  app.post(
    "/api/uploads",
    (req: any, res, next) => {
      try {
        auth(req);
        rate(req, "uploads", 5, 3600000);
        const q = quota(req.user.id);
        if (q.usedBytes >= q.maxBytes)
          fail(413, "Your staging storage quota is full.");
        next();
      } catch (e) {
        next(e);
      }
    },
    uploadGate,
    upload.single("file"),
    asyncRoute(async (req: any, res: any) => {
      const file = req.file;
      if (!file) fail(400, "Choose a video file.");
      let movedSource: string | null = null;
      try {
        const title = text(req.body.title, 150, 1),
          description = text(req.body.description || "", 5000),
          vis = visibility(req.body.visibility || "private");
        if (
          !["video/mp4", "video/quicktime", "video/webm"].includes(
            file.mimetype,
          )
        )
          fail(400, "Use MP4, MOV or WebM video.");
        validateMagic(file.path);
        const info = await probe(file.path);
        if (info.duration > 1800)
          fail(400, "Staging videos must be 30 minutes or shorter.");
        const q = quota(req.user.id);
        if (q.usedBytes + file.size + 157286400 > q.maxBytes)
          fail(413, "This upload exceeds your 500 MB staging storage quota.");
        const digest = hash(fs.readFileSync(file.path)),
          channel = get("SELECT * FROM channels WHERE user_id=?", req.user.id);
        if (
          get(
            "SELECT 1 FROM videos WHERE channel_id=? AND source_hash=?",
            channel.id,
            digest,
          )
        )
          fail(409, "This original file is already in your channel.");
        const vid = id(),
          original = path.join(mediaDir, `${vid}.source`);
        fs.renameSync(file.path, original);
        movedSource = original;
        exec(
          "INSERT INTO videos(id,channel_id,title,description,visibility,status,source_path,source_hash,bytes,duration,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
          vid,
          channel.id,
          title,
          description,
          vis,
          "queued",
          original,
          digest,
          file.size + 157286400,
          info.duration,
          now(),
        );
        exec(
          "INSERT INTO processing_jobs(id,video_id,updated_at) VALUES(?,?,?)",
          id(),
          vid,
          now(),
        );
        res.status(202).json({
          video: videoShape(get("SELECT * FROM videos WHERE id=?", vid), req),
        });
        setImmediate(worker);
      } catch (e) {
        safeUnlink(file.path);
        safeUnlink(movedSource);
        throw e;
      }
    }),
  );
  app.post(
    "/api/videos/:id/retry",
    asyncRoute((req: any, res: any) => {
      const v = ownedVideo(req.params.id, req);
      rate(req, "retry", 5, 3600000);
      if (v.status !== "failed" || !v.source_path)
        fail(400, "Only failed uploads can be retried.");
      if (
        get("SELECT attempts FROM processing_jobs WHERE video_id=?", v.id)
          .attempts >= 3
      )
        fail(400, "Retry limit reached. Upload a repaired original file.");
      exec(
        "UPDATE processing_jobs SET status='queued',error=NULL WHERE video_id=?",
        v.id,
      );
      exec("UPDATE videos SET status='queued',error=NULL WHERE id=?", v.id);
      res.json({ ok: true });
      setImmediate(worker);
    }),
  );
  app.patch(
    "/api/videos/:id",
    asyncRoute((req: any, res: any) => {
      const v = ownedVideo(req.params.id, req);
      const title =
          req.body.title === undefined ? v.title : text(req.body.title, 150, 1),
        description =
          req.body.description === undefined
            ? v.description
            : text(req.body.description, 5000),
        vis =
          req.body.visibility === undefined
            ? v.visibility
            : visibility(req.body.visibility);
      exec(
        "UPDATE videos SET title=?,description=?,visibility=?,comments_enabled=?,published_at=CASE WHEN ?='public' AND status='ready' THEN coalesce(published_at,?) ELSE published_at END WHERE id=?",
        title,
        description,
        vis,
        req.body.commentsEnabled === undefined
          ? v.comments_enabled
          : Number(bool(req.body.commentsEnabled)),
        vis,
        now(),
        v.id,
      );
      res.json({
        video: videoShape(get("SELECT * FROM videos WHERE id=?", v.id), req),
      });
    }),
  );
  const deleteVideo = (v: any) => {
    safeUnlink(v.source_path);
    safeUnlink(v.media_path);
    safeUnlink(v.thumbnail_path);
    exec("DELETE FROM videos WHERE id=?", v.id);
  };
  app.delete(
    "/api/videos/:id",
    asyncRoute((req: any, res: any) => {
      deleteVideo(ownedVideo(req.params.id, req));
      res.json({ ok: true });
    }),
  );
  app.get(
    "/api/media/:id/:kind",
    asyncRoute((req: any, res: any) => {
      const v = requireVideo(req.params.id, req);
      const file =
        req.params.kind === "video"
          ? v.media_path
          : req.params.kind === "thumbnail"
            ? v.thumbnail_path
            : null;
      if (!file || !fs.existsSync(file))
        fail(404, "Media is not available yet.");
      res.set("Cache-Control", "private, no-store");
      res.type(req.params.kind === "video" ? "video/mp4" : "image/jpeg");
      res.sendFile(file);
    }),
  );
  app.post(
    "/api/videos/:id/reaction",
    asyncRoute((req: any, res: any) => {
      const u = auth(req),
        v = requireVideo(req.params.id, req);
      rate(req, "reaction", 60);
      const value = Number(req.body.value);
      if (![-1, 0, 1].includes(value)) fail(400, "Invalid reaction.");
      if (value === 0)
        exec(
          "DELETE FROM reactions WHERE user_id=? AND video_id=?",
          u.id,
          v.id,
        );
      else
        exec(
          "INSERT OR REPLACE INTO reactions VALUES(?,?,?)",
          u.id,
          v.id,
          value,
        );
      const shape = videoShape(v, req);
      res.json({
        likes: shape.likes,
        dislikes: shape.dislikes,
        reaction: shape.reaction,
      });
    }),
  );
  app.post(
    "/api/videos/:id/comments",
    asyncRoute((req: any, res: any) => {
      const u = auth(req),
        v = requireVideo(req.params.id, req);
      rate(req, "comment", 10);
      if (v.status !== "ready" || !v.comments_enabled)
        fail(403, "Comments are unavailable on this video.");
      const body = noContact(text(req.body.body, 2000, 1));
      let parent = null;
      if (req.body.parentId) {
        parent = get(
          "SELECT * FROM comments WHERE id=? AND video_id=? AND status='visible'",
          String(req.body.parentId),
          v.id,
        );
        if (!parent || parent.parent_id)
          fail(400, "Reply to a top-level comment.");
        if (blocked(u.id, parent.user_id))
          fail(403, "This interaction is unavailable.");
      }
      const cid = id();
      exec(
        "INSERT INTO comments(id,video_id,user_id,parent_id,body,created_at) VALUES(?,?,?,?,?,?)",
        cid,
        v.id,
        u.id,
        parent?.id || null,
        body,
        now(),
      );
      res.status(201).json({
        comment: commentShape(get("SELECT * FROM comments WHERE id=?", cid)),
      });
    }),
  );
  app.patch(
    "/api/comments/:id",
    asyncRoute((req: any, res: any) => {
      const u = auth(req),
        c = get(
          "SELECT c.*,ch.user_id owner_id FROM comments c JOIN videos v ON v.id=c.video_id JOIN channels ch ON ch.id=v.channel_id WHERE c.id=?",
          req.params.id,
        );
      if (!c || c.owner_id !== u.id || c.parent_id)
        fail(404, "Top-level comment not found.");
      if (typeof req.body.pinned !== "boolean")
        fail(400, "Choose a pinned state.");
      db.exec("BEGIN");
      try {
        if (req.body.pinned)
          exec("UPDATE comments SET pinned=0 WHERE video_id=?", c.video_id);
        exec(
          "UPDATE comments SET pinned=? WHERE id=?",
          Number(req.body.pinned),
          c.id,
        );
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
      res.json({ ok: true });
    }),
  );
  app.delete(
    "/api/comments/:id",
    asyncRoute((req: any, res: any) => {
      const u = auth(req),
        c = get(
          "SELECT c.*,ch.user_id owner_id FROM comments c JOIN videos v ON v.id=c.video_id JOIN channels ch ON ch.id=v.channel_id WHERE c.id=?",
          req.params.id,
        );
      if (!c || (c.user_id !== u.id && c.owner_id !== u.id))
        fail(404, "Comment not found.");
      exec("DELETE FROM comments WHERE id=?", c.id);
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/videos/:id/progress",
    asyncRoute((req: any, res: any) => {
      const u = auth(req),
        v = requireVideo(req.params.id, req);
      rate(req, "progress", 60);
      const seconds = Number(req.body.seconds);
      if (!Number.isFinite(seconds) || seconds < 0 || seconds > v.duration + 1)
        fail(400, "Invalid playback position.");
      if (getSettings(u.id).historyEnabled)
        exec(
          "INSERT INTO history VALUES(?,?,?,?) ON CONFLICT(user_id,video_id) DO UPDATE SET seconds=excluded.seconds,updated_at=excluded.updated_at",
          u.id,
          v.id,
          seconds,
          now(),
        );
      const watched = Math.max(
        0,
        Math.min(15, Number(req.body.watchedSeconds) || 0),
      );
      if (watched > 0) {
        const day = now().slice(0, 10);
        exec(
          "INSERT INTO video_views VALUES(?,?,?,?,?,?) ON CONFLICT(video_id,user_id,day) DO UPDATE SET watch_seconds=min(watch_seconds+excluded.watch_seconds,?)",
          id(),
          v.id,
          u.id,
          day,
          watched,
          now(),
          Math.max(v.duration, 15),
        );
      }
      res.json({ ok: true });
    }),
  );
  app.get(
    "/api/history",
    asyncRoute((req: any, res: any) => {
      auth(req);
      res.json({
        videos: all(
          "SELECT v.* FROM videos v JOIN history h ON h.video_id=v.id WHERE h.user_id=? ORDER BY h.updated_at DESC LIMIT 100",
          req.user.id,
        )
          .filter((v) => canVideo(v, req))
          .map((v) => videoShape(v, req)),
      });
    }),
  );
  app.delete(
    "/api/history",
    asyncRoute((req: any, res: any) => {
      auth(req);
      exec("DELETE FROM history WHERE user_id=?", req.user.id);
      res.json({ ok: true });
    }),
  );
  app.get(
    "/api/channels/:handle",
    asyncRoute((req: any, res: any) => {
      const c = get(
        "SELECT c.* FROM channels c JOIN users u ON u.id=c.user_id WHERE u.handle=? AND u.status='active'",
        req.params.handle,
      );
      if (!c || (req.user && blocked(req.user.id, c.user_id)))
        fail(404, "Channel not found.");
      res.json({
        channel: {
          ...channelShape(c),
          subscribed: !!(
            req.user &&
            get(
              "SELECT 1 FROM subscriptions WHERE user_id=? AND channel_id=?",
              req.user.id,
              c.id,
            )
          ),
        },
        videos: listVideos({ ...req, query: {} }, " AND c.id=?", [c.id]),
        leaves: all(
          "SELECT * FROM leaves WHERE user_id=? AND status='visible' AND parent_id IS NULL ORDER BY created_at DESC LIMIT 50",
          c.user_id,
        ).map((l) => leafShape(l, req)),
      });
    }),
  );
  app.patch(
    "/api/channel",
    asyncRoute((req: any, res: any) => {
      auth(req);
      const c = get("SELECT * FROM channels WHERE user_id=?", req.user.id),
        name =
          req.body.name === undefined ? c.name : text(req.body.name, 80, 1),
        description =
          req.body.description === undefined
            ? c.description
            : noContact(text(req.body.description, 2000));
      let links = JSON.parse(c.links);
      if (req.body.links !== undefined) {
        if (!Array.isArray(req.body.links) || req.body.links.length > 5)
          fail(400, "Choose at most 5 channel links.");
        links = req.body.links.map((l: any) => {
          try {
            const url = new URL(String(l));
            if (url.protocol !== "https:") throw Error();
            return url.href;
          } catch {
            fail(400, "Channel links must use HTTPS.");
          }
        });
      }
      exec(
        "UPDATE channels SET name=?,description=?,links=? WHERE id=?",
        name,
        description,
        JSON.stringify(links),
        c.id,
      );
      res.json({
        channel: channelShape(get("SELECT * FROM channels WHERE id=?", c.id)),
      });
    }),
  );
  app.post(
    "/api/channels/:id/subscribe",
    asyncRoute((req: any, res: any) => {
      const u = auth(req),
        c = get("SELECT * FROM channels WHERE id=?", req.params.id);
      rate(req, "subscribe", 30);
      if (!c || blocked(u.id, c.user_id)) fail(404, "Channel not found.");
      if (c.user_id === u.id)
        fail(400, "You cannot subscribe to your own channel.");
      exec(
        "INSERT OR IGNORE INTO subscriptions VALUES(?,?,?)",
        u.id,
        c.id,
        now(),
      );
      res.json({ subscribed: true, subscribers: channelShape(c).subscribers });
    }),
  );
  app.delete(
    "/api/channels/:id/subscribe",
    asyncRoute((req: any, res: any) => {
      auth(req);
      exec(
        "DELETE FROM subscriptions WHERE user_id=? AND channel_id=?",
        req.user.id,
        req.params.id,
      );
      res.json({
        subscribed: false,
        subscribers: get(
          "SELECT count(*) n FROM subscriptions WHERE channel_id=?",
          req.params.id,
        ).n,
      });
    }),
  );
  app.get(
    "/api/studio",
    asyncRoute((req: any, res: any) => {
      auth(req);
      const c = get("SELECT * FROM channels WHERE user_id=?", req.user.id);
      res.json({
        videos: all(
          "SELECT * FROM videos WHERE channel_id=? ORDER BY created_at DESC LIMIT 200",
          c.id,
        ).map((v) => videoShape(v, req)),
        analytics: {
          views: get(
            "SELECT count(*) n FROM video_views WHERE video_id IN (SELECT id FROM videos WHERE channel_id=?)",
            c.id,
          ).n,
          subscribers: channelShape(c).subscribers,
          watchSeconds: get(
            "SELECT coalesce(sum(watch_seconds),0) n FROM video_views WHERE video_id IN (SELECT id FROM videos WHERE channel_id=?)",
            c.id,
          ).n,
          uploads: get("SELECT count(*) n FROM videos WHERE channel_id=?", c.id)
            .n,
        },
        comments: all(
          "SELECT c.* FROM comments c JOIN videos v ON v.id=c.video_id WHERE v.channel_id=? AND c.status='visible' ORDER BY c.created_at DESC LIMIT 50",
          c.id,
        ).map(commentShape),
        quota: quota(req.user.id),
      });
    }),
  );
  app.get(
    "/api/playlists",
    asyncRoute((req: any, res: any) => {
      auth(req);
      res.json({
        playlists: all(
          "SELECT * FROM playlists WHERE user_id=? ORDER BY created_at DESC",
          req.user.id,
        ).map(playlistShape),
      });
    }),
  );
  app.post(
    "/api/playlists",
    asyncRoute((req: any, res: any) => {
      const u = auth(req);
      rate(req, "playlist", 10);
      const title = text(req.body.title, 100, 1),
        vis = req.body.visibility === "public" ? "public" : "private",
        pid = id();
      exec(
        "INSERT INTO playlists VALUES(?,?,?,?,?)",
        pid,
        u.id,
        title,
        vis,
        now(),
      );
      res.status(201).json({
        playlist: playlistShape(get("SELECT * FROM playlists WHERE id=?", pid)),
      });
    }),
  );
  app.get(
    "/api/playlists/:id",
    asyncRoute((req: any, res: any) => {
      const p = get("SELECT * FROM playlists WHERE id=?", req.params.id);
      if (!p || (p.visibility === "private" && req.user?.id !== p.user_id))
        fail(404, "Collection not found.");
      res.json({
        playlist: playlistShape(p),
        videos: all(
          "SELECT v.*,i.id itemId FROM videos v JOIN playlist_items i ON i.video_id=v.id WHERE i.playlist_id=? ORDER BY i.created_at",
          p.id,
        )
          .filter((v) => canVideo(v, req))
          .map((v) => ({ ...videoShape(v, req), itemId: v.itemId })),
        leaves: all(
          "SELECT l.*,i.id itemId FROM leaves l JOIN playlist_items i ON i.leaf_id=l.id WHERE i.playlist_id=? AND l.status='visible' ORDER BY i.created_at",
          p.id,
        )
          .filter(
            (l) =>
              get(
                "SELECT 1 FROM users WHERE id=? AND status='active'",
                l.user_id,
              ) &&
              (!req.user || !blocked(req.user.id, l.user_id)),
          )
          .map((l) => ({ ...leafShape(l, req), itemId: l.itemId })),
      });
    }),
  );
  app.post(
    "/api/playlists/:id/items",
    asyncRoute((req: any, res: any) => {
      const u = auth(req),
        p = get(
          "SELECT * FROM playlists WHERE id=? AND user_id=?",
          req.params.id,
          u.id,
        );
      if (!p) fail(404, "Collection not found.");
      let vid = null,
        lid = null;
      if (req.body.videoId && !req.body.leafId) {
        vid = requireVideo(String(req.body.videoId), req).id;
      } else if (req.body.leafId && !req.body.videoId) {
        const l = get(
          "SELECT * FROM leaves WHERE id=? AND status='visible'",
          String(req.body.leafId),
        );
        if (!l || blocked(u.id, l.user_id)) fail(404, "Leaf not found.");
        lid = l.id;
      } else fail(400, "Choose one video or Leaf.");
      exec(
        "INSERT OR IGNORE INTO playlist_items VALUES(?,?,?,?,?)",
        id(),
        p.id,
        vid,
        lid,
        now(),
      );
      res.json({ ok: true });
    }),
  );
  app.delete(
    "/api/playlists/:id/items/:itemId",
    asyncRoute((req: any, res: any) => {
      auth(req);
      if (
        !get(
          "SELECT 1 FROM playlists WHERE id=? AND user_id=?",
          req.params.id,
          req.user.id,
        )
      )
        fail(404, "Collection not found.");
      exec(
        "DELETE FROM playlist_items WHERE id=? AND playlist_id=?",
        req.params.itemId,
        req.params.id,
      );
      res.json({ ok: true });
    }),
  );
  app.delete(
    "/api/playlists/:id",
    asyncRoute((req: any, res: any) => {
      auth(req);
      exec(
        "DELETE FROM playlists WHERE id=? AND user_id=?",
        req.params.id,
        req.user.id,
      );
      res.json({ ok: true });
    }),
  );
  const requireLeaf = (lid: string, req: any) => {
    const l = get(
      "SELECT l.* FROM leaves l JOIN users u ON u.id=l.user_id WHERE l.id=? AND l.status='visible' AND u.status='active'",
      lid,
    );
    if (!l || (req.user && blocked(req.user.id, l.user_id)))
      fail(404, "Leaf not found.");
    return l;
  };
  app.get(
    "/api/leaves",
    asyncRoute((req: any, res: any) => {
      const leaves = all(
        "SELECT l.* FROM leaves l JOIN users u ON u.id=l.user_id WHERE l.status='visible' AND l.parent_id IS NULL AND u.status='active' ORDER BY l.created_at DESC LIMIT 100",
      ).filter((l) => !req.user || !blocked(req.user.id, l.user_id));
      res.json({ leaves: leaves.map((l) => leafShape(l, req)) });
    }),
  );
  app.post(
    "/api/leaves",
    asyncRoute((req: any, res: any) => {
      const u = auth(req);
      rate(req, "leaf", 8);
      const body = noContact(text(req.body.body, 1000, 1));
      let vid = null,
        parent = null;
      if (req.body.videoId)
        vid = requireVideo(String(req.body.videoId), req).id;
      if (req.body.parentId) {
        parent = requireLeaf(String(req.body.parentId), req);
        if (parent.parent_id) fail(400, "Reply to a top-level Leaf.");
      }
      const lid = id();
      exec(
        "INSERT INTO leaves(id,user_id,body,video_id,parent_id,created_at) VALUES(?,?,?,?,?,?)",
        lid,
        u.id,
        body,
        vid,
        parent?.id || null,
        now(),
      );
      res.status(201).json({
        leaf: leafShape(get("SELECT * FROM leaves WHERE id=?", lid), req),
      });
    }),
  );
  app.patch(
    "/api/leaves/:id",
    asyncRoute((req: any, res: any) => {
      const u = auth(req);
      const l = get(
        "SELECT * FROM leaves WHERE id=? AND user_id=?",
        req.params.id,
        u.id,
      );
      if (!l) fail(404, "Leaf not found.");
      exec(
        "UPDATE leaves SET body=?,updated_at=? WHERE id=?",
        noContact(text(req.body.body, 1000, 1)),
        now(),
        l.id,
      );
      res.json({
        leaf: leafShape(get("SELECT * FROM leaves WHERE id=?", l.id), req),
      });
    }),
  );
  app.delete(
    "/api/leaves/:id",
    asyncRoute((req: any, res: any) => {
      auth(req);
      exec(
        "DELETE FROM leaves WHERE id=? AND user_id=?",
        req.params.id,
        req.user.id,
      );
      res.json({ ok: true });
    }),
  );
  for (const [route, table] of [
    ["like", "leaf_likes"],
    ["repost", "leaf_reposts"],
  ])
    app.post(
      `/api/leaves/:id/${route}`,
      asyncRoute((req: any, res: any) => {
        const u = auth(req),
          l = requireLeaf(req.params.id, req);
        rate(req, "leafreaction", 60);
        if (
          get(
            `SELECT 1 FROM ${table} WHERE user_id=? AND leaf_id=?`,
            u.id,
            l.id,
          )
        )
          exec(
            `DELETE FROM ${table} WHERE user_id=? AND leaf_id=?`,
            u.id,
            l.id,
          );
        else exec(`INSERT INTO ${table} VALUES(?,?)`, u.id, l.id);
        res.json({ leaf: leafShape(l, req) });
      }),
    );
  const storyShape = (s: any) => ({
    id: s.id,
    caption: s.caption,
    kind: s.kind,
    mediaUrl: `/api/story-media/${s.id}`,
    createdAt: s.created_at,
    expiresAt: s.expires_at,
    author: author(s.user_id),
  });
  app.get(
    "/api/stories",
    asyncRoute((req: any, res: any) => {
      res.json({
        stories: all(
          "SELECT s.* FROM stories s JOIN users u ON u.id=s.user_id WHERE s.expires_at>? AND s.status='visible' AND u.status='active' ORDER BY s.created_at DESC LIMIT 100",
          now(),
        )
          .filter((s) => !req.user || !blocked(req.user.id, s.user_id))
          .map(storyShape),
      });
    }),
  );
  app.post(
    "/api/stories",
    (req: any, res, next) => {
      try {
        auth(req);
        rate(req, "story", 6, 3600000);
        next();
      } catch (e) {
        next(e);
      }
    },
    uploadGate,
    upload.single("file"),
    asyncRoute(async (req: any, res: any) => {
      const file = req.file;
      if (!file) fail(400, "Choose an image or short video.");
      const sid = id(),
        isImage = ["image/jpeg", "image/png"].includes(file.mimetype),
        dest = path.join(mediaDir, `${sid}.${isImage ? "jpg" : "mp4"}`),
        thumb = path.join(tmpDir, `${sid}.jpg`);
      try {
        const caption = noContact(text(req.body.caption || "", 300));
        const q = quota(req.user.id);
        if (q.usedBytes + file.size + 157286400 > q.maxBytes)
          fail(413, "Staging storage quota exceeded.");
        if (isImage) {
          if (file.size > 10 * 1024 * 1024)
            fail(413, "Images are limited to 10 MB.");
          await sanitizeImage(file.path, dest);
        } else {
          if (
            !["video/mp4", "video/quicktime", "video/webm"].includes(
              file.mimetype,
            )
          )
            fail(400, "Use JPEG, PNG, MP4 or WebM.");
          validateMagic(file.path);
          if ((await probe(file.path)).duration > 30)
            fail(400, "Stories are limited to 30 seconds.");
          await transcode(file.path, dest, thumb);
        }
        const expires = new Date(Date.now() + 86400000).toISOString();
        exec(
          "INSERT INTO stories VALUES(?,?,?,?,?,?,?,?,?)",
          sid,
          req.user.id,
          caption,
          isImage ? "image" : "video",
          dest,
          fs.statSync(dest).size,
          "visible",
          now(),
          expires,
        );
        res.status(201).json({
          story: storyShape(get("SELECT * FROM stories WHERE id=?", sid)),
        });
      } catch (e) {
        safeUnlink(dest);
        throw e;
      } finally {
        safeUnlink(file.path);
        safeUnlink(thumb);
      }
    }),
  );
  app.get(
    "/api/story-media/:id",
    asyncRoute((req: any, res: any) => {
      const s = get(
        "SELECT s.* FROM stories s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>? AND s.status='visible' AND u.status='active'",
        req.params.id,
        now(),
      );
      if (!s || (req.user && blocked(req.user.id, s.user_id)))
        fail(404, "Story has expired or is unavailable.");
      res.set("Cache-Control", "private, no-store");
      res.type(s.kind === "image" ? "image/jpeg" : "video/mp4");
      res.sendFile(s.media_path);
    }),
  );
  app.delete(
    "/api/stories/:id",
    asyncRoute((req: any, res: any) => {
      auth(req);
      const s = get(
        "SELECT * FROM stories WHERE id=? AND user_id=?",
        req.params.id,
        req.user.id,
      );
      if (!s) fail(404, "Story not found.");
      safeUnlink(s.media_path);
      exec("DELETE FROM stories WHERE id=?", s.id);
      res.json({ ok: true });
    }),
  );
  const targetExists = (type: string, target: string, req: any) => {
    if (type === "video") return requireVideo(target, req);
    if (type === "leaf") return requireLeaf(target, req);
    if (type === "story") {
      const s = get(
        "SELECT s.* FROM stories s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.status='visible' AND s.expires_at>? AND u.status='active'",
        target,
        now(),
      );
      if (s && (!req.user || !blocked(req.user.id, s.user_id))) return s;
    }
    if (type === "comment") {
      const c = get(
        "SELECT * FROM comments WHERE id=? AND status='visible'",
        target,
      );
      if (
        c &&
        get("SELECT 1 FROM users WHERE id=? AND status='active'", c.user_id) &&
        (!req.user || !blocked(req.user.id, c.user_id))
      ) {
        requireVideo(c.video_id, req);
        return c;
      }
    }
    if (type === "note") {
      const n = get(
        "SELECT * FROM notes WHERE id=? AND status='accepted'",
        target,
      );
      if (n) {
        targetExists(n.target_type, n.target_id, req);
        return n;
      }
    }
    if (type === "user") {
      const u = get(
        "SELECT * FROM users WHERE id=? AND status='active'",
        target,
      );
      if (u) return u;
    }
    fail(404, "Content not found.");
  };
  app.post(
    "/api/reports",
    asyncRoute((req: any, res: any) => {
      const u = auth(req);
      rate(req, "report", 10, 3600000);
      const type = text(req.body.targetType, 20, 1),
        target = text(req.body.targetId, 64, 1);
      targetExists(type, target, req);
      const rid = id();
      exec(
        "INSERT INTO reports VALUES(?,?,?,?,?,?,?,?)",
        rid,
        u.id,
        type,
        target,
        text(req.body.reason, 100, 1),
        text(req.body.details || "", 4000),
        "pending",
        now(),
      );
      res.status(201).json({ id: rid });
    }),
  );
  app.post(
    "/api/legal/notices",
    asyncRoute((req: any, res: any) => {
      rate(req, "legal", 5, 3600000);
      if (req.body.goodFaith !== true)
        fail(
          400,
          "Confirm that your report is accurate and submitted in good faith.",
        );
      const category = text(req.body.category, 100, 1);
      if (!["copyright", "illegal-content", "child-safety"].includes(category))
        fail(400, "Choose a supported notice category.");
      const target = text(req.body.url || req.body.targetId, 2048, 1),
        reason = text(req.body.reason, 4000, 10),
        contact = text(req.body.contact || "", 254);
      const rid = id();
      exec(
        "INSERT INTO reports VALUES(?,?,?,?,?,?,?,?)",
        rid,
        req.user?.id || null,
        "notice",
        target,
        category,
        JSON.stringify({ reason, contact, goodFaith: true }),
        "pending",
        now(),
      );
      res.status(201).json({
        id: rid,
        message: "Notice recorded in the confidential operator review queue.",
      });
    }),
  );
  app.get(
    "/api/blocks",
    asyncRoute((req: any, res: any) => {
      auth(req);
      res.json({
        blocks: all(
          "SELECT u.id,u.name,u.handle FROM users u JOIN blocks b ON b.blocked_id=u.id WHERE b.user_id=?",
          req.user.id,
        ),
      });
    }),
  );
  app.post(
    "/api/blocks",
    asyncRoute((req: any, res: any) => {
      const u = auth(req),
        bid = text(req.body.userId, 64, 1);
      if (bid === u.id || !get("SELECT 1 FROM users WHERE id=?", bid))
        fail(400, "Choose another account.");
      exec("INSERT OR IGNORE INTO blocks VALUES(?,?,?)", u.id, bid, now());
      exec(
        "DELETE FROM subscriptions WHERE (user_id=? AND channel_id IN (SELECT id FROM channels WHERE user_id=?)) OR (user_id=? AND channel_id IN (SELECT id FROM channels WHERE user_id=?))",
        u.id,
        bid,
        bid,
        u.id,
      );
      res.json({ ok: true });
    }),
  );
  app.delete(
    "/api/blocks/:id",
    asyncRoute((req: any, res: any) => {
      auth(req);
      exec(
        "DELETE FROM blocks WHERE user_id=? AND blocked_id=?",
        req.user.id,
        req.params.id,
      );
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/notes",
    asyncRoute((req: any, res: any) => {
      const u = auth(req);
      rate(req, "note", 3, 3600000);
      const type = text(req.body.targetType, 20, 1),
        target = text(req.body.targetId, 64, 1);
      if (!["video", "leaf", "story"].includes(type))
        fail(400, "Unsupported note target.");
      targetExists(type, target, req);
      const body = noContact(text(req.body.body, 1500, 20));
      if (
        !Array.isArray(req.body.sources) ||
        req.body.sources.length < 1 ||
        req.body.sources.length > 5
      )
        fail(400, "Supply 1–5 supporting HTTPS sources.");
      const sources = req.body.sources.map((s: any) => {
        try {
          const url = new URL(text(s, 2048, 1));
          if (url.protocol !== "https:" || url.username || url.password)
            throw Error();
          return url.href;
        } catch {
          fail(400, "Sources must be valid HTTPS links.");
        }
      });
      if (
        get(
          "SELECT 1 FROM notes WHERE user_id=? AND target_type=? AND target_id=?",
          u.id,
          type,
          target,
        )
      )
        fail(409, "You already submitted a note for this content.");
      const nid = id();
      exec(
        "INSERT INTO notes VALUES(?,?,?,?,?,?,?,?)",
        nid,
        u.id,
        type,
        target,
        body,
        JSON.stringify(sources),
        "pending",
        now(),
      );
      res
        .status(201)
        .json({ note: noteShape(get("SELECT * FROM notes WHERE id=?", nid)) });
    }),
  );
  app.post(
    "/api/notes/:id/rate",
    asyncRoute((req: any, res: any) => {
      const u = auth(req);
      rate(req, "noterating", 20);
      const note = get(
        "SELECT * FROM notes WHERE id=? AND status IN ('pending','accepted')",
        req.params.id,
      );
      if (!note) fail(404, "Note not found.");
      targetExists(note.target_type, note.target_id, req);
      if (note.user_id === u.id) fail(403, "You cannot rate your own note.");
      if (
        Date.now() - Date.parse(u.created_at) < 30 * 86400000 ||
        get("SELECT count(*) n FROM moderation_actions WHERE target_id=?", u.id)
          .n > 0
      )
        fail(
          403,
          "Reviewing requires an account at least 30 days old with no recorded sanctions. Ratings inform human review; they never publish notes automatically.",
        );
      if (typeof req.body.helpful !== "boolean")
        fail(400, "Choose a helpfulness rating.");
      exec(
        "INSERT OR REPLACE INTO note_ratings VALUES(?,?,?,?)",
        u.id,
        note.id,
        Number(req.body.helpful),
        now(),
      );
      res.json({ ok: true });
    }),
  );
  app.get(
    "/api/notifications",
    asyncRoute((req: any, res: any) => {
      auth(req);
      res.json({
        notifications: all(
          "SELECT id,kind,body,url,read,created_at createdAt FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100",
          req.user.id,
        ),
      });
    }),
  );
  app.post(
    "/api/notifications/read",
    asyncRoute((req: any, res: any) => {
      auth(req);
      exec("UPDATE notifications SET read=1 WHERE user_id=?", req.user.id);
      res.json({ ok: true });
    }),
  );
  app.get(
    "/api/settings",
    asyncRoute((req: any, res: any) => {
      auth(req);
      res.json({
        settings: getSettings(req.user.id),
        blocks: all(
          "SELECT u.id,u.name,u.handle FROM users u JOIN blocks b ON b.blocked_id=u.id WHERE b.user_id=?",
          req.user.id,
        ),
      });
    }),
  );
  app.patch(
    "/api/settings",
    asyncRoute((req: any, res: any) => {
      auth(req);
      const s = getSettings(req.user.id);
      for (const k of ["historyEnabled", "autoplay", "notifyUploads"])
        if (req.body[k] !== undefined && typeof req.body[k] !== "boolean")
          fail(400, "Settings must be true or false.");
      exec(
        "UPDATE settings SET history_enabled=?,autoplay=?,notify_uploads=? WHERE user_id=?",
        Number(req.body.historyEnabled ?? s.historyEnabled),
        Number(req.body.autoplay ?? s.autoplay),
        Number(req.body.notifyUploads ?? s.notifyUploads),
        req.user.id,
      );
      res.json({ settings: getSettings(req.user.id) });
    }),
  );
  const moderator = (req: any) => {
    const u = auth(req);
    if (!["moderator", "admin"].includes(u.role))
      fail(403, "Moderator access is required.");
    return u;
  };
  const reportContent = (report: any) => {
    let targetAuthorId: string | null = null,
      contentPreview = "This content is no longer available.",
      mediaReviewUrl: string | null = null,
      mediaKind: string | null = null;
    if (report.target_type === "video") {
      const v = get(
        "SELECT v.*,c.user_id FROM videos v JOIN channels c ON c.id=v.channel_id WHERE v.id=?",
        report.target_id,
      );
      if (v) {
        targetAuthorId = v.user_id;
        contentPreview = `[${v.visibility}; ${v.status}] ${v.title}\n${v.description}`;
        if (v.media_path && fs.existsSync(v.media_path)) {
          mediaReviewUrl = `/api/moderation/media/${report.id}`;
          mediaKind = "video";
        }
      }
    } else if (report.target_type === "story") {
      const story = get("SELECT * FROM stories WHERE id=?", report.target_id);
      if (story) {
        targetAuthorId = story.user_id;
        contentPreview = `[${story.status}; expires ${story.expires_at}] ${story.caption}`;
        if (fs.existsSync(story.media_path)) {
          mediaReviewUrl = `/api/moderation/media/${report.id}`;
          mediaKind = story.kind;
        }
      }
    } else if (["leaf", "comment", "note"].includes(report.target_type)) {
      const table = (
          { leaf: "leaves", comment: "comments", note: "notes" } as Record<
            string,
            string
          >
        )[report.target_type],
        content = get(`SELECT * FROM ${table} WHERE id=?`, report.target_id);
      if (content) {
        targetAuthorId = content.user_id;
        contentPreview = `[${content.status}] ${content.body}`;
      }
    } else if (report.target_type === "user") {
      const u = get(
        "SELECT id,name,handle,status FROM users WHERE id=?",
        report.target_id,
      );
      if (u) {
        targetAuthorId = u.id;
        contentPreview = `${u.name} (@${u.handle}) — ${u.status}`;
      }
    } else if (report.target_type === "notice")
      contentPreview =
        "Confidential legal notice. Review the supplied URL, category and statement; operator-led legal handling is required.";
    return {
      contentPreview: contentPreview.slice(0, 6000),
      targetAuthorId,
      mediaReviewUrl,
      mediaKind,
    };
  };
  app.get(
    "/api/moderation/media/:reportId",
    asyncRoute((req: any, res: any) => {
      moderator(req);
      const report = get(
        "SELECT * FROM reports WHERE id=?",
        req.params.reportId,
      );
      if (!report) fail(404, "Report not found.");
      let file: string | null = null,
        kind = "video/mp4";
      if (report.target_type === "video")
        file = get(
          "SELECT media_path FROM videos WHERE id=?",
          report.target_id,
        )?.media_path;
      if (report.target_type === "story") {
        const story = get(
          "SELECT media_path,kind FROM stories WHERE id=?",
          report.target_id,
        );
        file = story?.media_path;
        kind = story?.kind === "image" ? "image/jpeg" : "video/mp4";
      }
      if (!file || !fs.existsSync(file))
        fail(404, "Reported media is unavailable.");
      res.set("Cache-Control", "private, no-store");
      res.type(kind);
      res.sendFile(file);
    }),
  );
  app.get(
    "/api/moderation",
    asyncRoute((req: any, res: any) => {
      moderator(req);
      res.json({
        reports: all(
          "SELECT * FROM reports ORDER BY created_at DESC LIMIT 200",
        ).map((r) => ({ ...r, ...reportContent(r) })),
        notes: all(
          "SELECT * FROM notes ORDER BY created_at DESC LIMIT 200",
        ).map(noteShape),
        actions: all(
          "SELECT * FROM moderation_actions ORDER BY created_at DESC LIMIT 100",
        ),
        appeals: all(
          "SELECT * FROM appeals ORDER BY created_at DESC LIMIT 100",
        ),
      });
    }),
  );
  app.post(
    "/api/moderation/action",
    asyncRoute((req: any, res: any) => {
      const m = moderator(req),
        type = text(req.body.targetType, 20, 1),
        target = text(req.body.targetId, 64, 1),
        action = text(req.body.action, 20, 1),
        reason = text(req.body.reason, 2000, 10);
      rate(req, "moderation", 40);
      if (action === "suspend") {
        if (type !== "user") fail(400, "Suspend applies to accounts.");
        const u = get("SELECT * FROM users WHERE id=?", target);
        if (!u || u.role === "admin" || u.id === m.id)
          fail(403, "This account cannot be suspended here.");
        exec("UPDATE users SET status='suspended' WHERE id=?", target);
        exec("DELETE FROM sessions WHERE user_id=?", target);
      } else if (action === "accept_note" || action === "reject_note") {
        if (type !== "note") fail(400, "Choose a Community Note.");
        const n = get("SELECT * FROM notes WHERE id=?", target);
        if (!n) fail(404, "Note not found.");
        if (n.user_id === m.id)
          fail(403, "A different moderator must review your note.");
        exec(
          "UPDATE notes SET status=? WHERE id=?",
          action === "accept_note" ? "accepted" : "rejected",
          target,
        );
      } else if (action === "remove") {
        const tables: Record<string, string> = {
          video: "videos",
          leaf: "leaves",
          story: "stories",
          comment: "comments",
          note: "notes",
        };
        const table = tables[type];
        if (!table || !get(`SELECT 1 FROM ${table} WHERE id=?`, target))
          fail(404, "Content not found.");
        exec(`UPDATE ${table} SET status='removed' WHERE id=?`, target);
        if (type === "video")
          exec(
            "UPDATE processing_jobs SET status='cancelled' WHERE video_id=?",
            target,
          );
      } else fail(400, "Choose a valid moderation action.");
      const aid = id();
      exec(
        "INSERT INTO moderation_actions VALUES(?,?,?,?,?,?,?)",
        aid,
        m.id,
        type,
        target,
        action,
        reason,
        now(),
      );
      exec(
        "UPDATE reports SET status='reviewed' WHERE target_type=? AND target_id=?",
        type,
        target,
      );
      res.json({ ok: true, id: aid });
    }),
  );
  app.post(
    "/api/appeals",
    asyncRoute((req: any, res: any) => {
      const u = auth(req);
      rate(req, "appeal", 3, 86400000);
      const a = get(
        "SELECT * FROM moderation_actions WHERE id=?",
        text(req.body.actionId, 64, 1),
      );
      if (!a) fail(404, "Moderation decision not found.");
      let owner: string | undefined;
      if (a.target_type === "user") owner = a.target_id;
      else if (a.target_type === "video")
        owner = get(
          "SELECT c.user_id FROM channels c JOIN videos v ON v.channel_id=c.id WHERE v.id=?",
          a.target_id,
        )?.user_id;
      else {
        const table = (
          {
            leaf: "leaves",
            story: "stories",
            comment: "comments",
            note: "notes",
          } as any
        )[a.target_type];
        if (table)
          owner = get(
            `SELECT user_id FROM ${table} WHERE id=?`,
            a.target_id,
          )?.user_id;
      }
      if (owner !== u.id)
        fail(403, "You can appeal decisions about your own content.");
      const aid = id();
      exec(
        "INSERT INTO appeals VALUES(?,?,?,?,?,?)",
        aid,
        u.id,
        a.id,
        text(req.body.body, 4000, 20),
        "pending",
        now(),
      );
      res.status(201).json({ id: aid });
    }),
  );
  app.get(
    "/api/account/sessions",
    asyncRoute((req: any, res: any) => {
      auth(req);
      res.json({
        sessions: all(
          "SELECT hash id,created_at createdAt,expires_at expiresAt FROM sessions WHERE user_id=? ORDER BY created_at DESC",
          req.user.id,
        ).map((s) => ({ ...s, current: s.id === req.session.hash })),
      });
    }),
  );
  app.delete(
    "/api/account/sessions/:id",
    asyncRoute((req: any, res: any) => {
      auth(req);
      exec(
        "DELETE FROM sessions WHERE hash=? AND user_id=?",
        req.params.id,
        req.user.id,
      );
      if (req.params.id === req.session.hash)
        res.clearCookie("leafster_session", { path: "/" });
      res.json({ ok: true });
    }),
  );
  app.get(
    "/api/account/export",
    asyncRoute((req: any, res: any) => {
      const u = auth(req);
      rate(req, "export", 3, 3600000);
      const result: any = {
        exportedAt: now(),
        profile: { ...userShape(u), email: u.email, createdAt: u.created_at },
        settings: getSettings(u.id),
        channel: get("SELECT * FROM channels WHERE user_id=?", u.id),
      };
      for (const table of [
        "subscriptions",
        "reactions",
        "comments",
        "history",
        "leaves",
        "leaf_likes",
        "leaf_reposts",
        "playlists",
        "stories",
        "blocks",
        "reports",
        "notes",
        "note_ratings",
        "appeals",
        "notifications",
      ])
        result[table] = all(`SELECT * FROM ${table} WHERE user_id=?`, u.id).map(
          (row) => {
            const safe = { ...row };
            delete safe.media_path;
            return safe;
          },
        );
      result.videos = all(
        "SELECT * FROM videos WHERE channel_id IN (SELECT id FROM channels WHERE user_id=?)",
        u.id,
      ).map((v) => {
        const safe = { ...v };
        delete safe.source_path;
        delete safe.media_path;
        delete safe.thumbnail_path;
        return safe;
      });
      result.playlistItems = all(
        "SELECT i.* FROM playlist_items i JOIN playlists p ON p.id=i.playlist_id WHERE p.user_id=?",
        u.id,
      );
      res.set(
        "Content-Disposition",
        'attachment; filename="leafster-data.json"',
      );
      res.json(result);
    }),
  );
  app.delete(
    "/api/account",
    asyncRoute((req: any, res: any) => {
      const u = auth(req);
      if (req.body.confirm !== "DELETE")
        fail(400, "Type DELETE to confirm account deletion.");
      for (const v of all(
        "SELECT * FROM videos WHERE channel_id IN (SELECT id FROM channels WHERE user_id=?)",
        u.id,
      ))
        deleteVideo(v);
      for (const s of all("SELECT * FROM stories WHERE user_id=?", u.id))
        safeUnlink(s.media_path);
      exec("DELETE FROM users WHERE id=?", u.id);
      res.clearCookie("leafster_session", { path: "/" });
      res.json({ ok: true });
    }),
  );
  // Test authentication is absent outside an explicitly isolated test process.
  if (
    process.env.NODE_ENV === "test" &&
    process.env.LEAFSTER_TEST_AUTH === "true"
  ) {
    app.post(
      "/api/test/login",
      asyncRoute((req: any, res: any) => {
        const email = text(req.body.email, 254, 3);
        let u = get("SELECT * FROM users WHERE email=?", email);
        if (!u) {
          const uid = id();
          exec(
            "INSERT INTO users(id,email,name,created_at) VALUES(?,?,?,?)",
            uid,
            email,
            "Test creator",
            now(),
          );
          exec("INSERT INTO settings(user_id) VALUES(?)", uid);
          u = get("SELECT * FROM users WHERE id=?", uid);
        }
        res.json({
          user: userShape(u),
          csrfToken: makeSession(req, res, u.id),
        });
      }),
    );
  }
  const cleanup = () => {
    if (stopped) return;
    exec("DELETE FROM sessions WHERE expires_at<?", now());
    exec("DELETE FROM oauth_states WHERE expires_at<?", now());
    exec("DELETE FROM rate_limits WHERE reset_at<?", Date.now());
    for (const s of all(
      "SELECT id,media_path FROM stories WHERE expires_at<?",
      now(),
    )) {
      safeUnlink(s.media_path);
      exec("DELETE FROM stories WHERE id=?", s.id);
    }
    for (const f of fs.readdirSync(tmpDir)) {
      const p = path.join(tmpDir, f);
      try {
        if (Date.now() - fs.statSync(p).mtimeMs > 3600000) safeUnlink(p);
      } catch {}
    }
  };
  const timer = setInterval(cleanup, 60000);
  timer.unref();
  setImmediate(() => {
    cleanup();
    void worker();
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Endpoint not found." }),
  );
  const publicDir = path.resolve("dist");
  if (fs.existsSync(path.join(publicDir, "index.html"))) {
    app.use(express.static(publicDir, { index: false }));
    app.use((req, res, next) => {
      if (req.method === "GET")
        res.sendFile(path.join(publicDir, "index.html"));
      else next();
    });
  }
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (res.headersSent) return;
    const status =
      err.code === "LIMIT_FILE_SIZE"
        ? 413
        : err.code?.startsWith("LIMIT_")
          ? 400
          : err.status || (/UNIQUE constraint/.test(err.message) ? 409 : 500);
    if (status === 500 && process.env.NODE_ENV !== "test")
      console.error("[leafster] Request failed:", err.name);
    res.status(status).json({
      error:
        status === 500
          ? "Something went wrong. Please try again."
          : err.code === "LIMIT_FILE_SIZE"
            ? "Files are limited to 100 MB."
            : /UNIQUE constraint/.test(err.message)
              ? "This item already exists."
              : err.message,
    });
  });
  return {
    app,
    db,
    worker,
    close: () => {
      stopped = true;
      clearInterval(timer);
      db.close();
    },
    dataDir,
  };
}
