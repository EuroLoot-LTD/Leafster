import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import request from "supertest";
import { createApp } from "../server/app.js";
process.env.NODE_ENV = "test";
process.env.LEAFSTER_TEST_AUTH = "true";
const origin = "http://localhost:5173";
async function fixture(t: test.TestContext) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "leafster-security-")),
    f = createApp({ dataDir, origin });
  await new Promise((r) => setImmediate(r));
  t.after(() => {
    f.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  });
  const login = async (handle: string) => {
    const agent = request.agent(f.app),
      s = await agent.get("/api/session").expect(200);
    const l = await agent
      .post("/api/test/login")
      .set("Origin", origin)
      .set("x-csrf-token", s.body.csrfToken)
      .send({ email: `${handle}@example.test` })
      .expect(200);
    const csrf = l.body.csrfToken,
      p = await agent
        .post("/api/onboarding")
        .set("Origin", origin)
        .set("x-csrf-token", csrf)
        .send({ name: handle, handle, adultConfirmed: true })
        .expect(200);
    const userId = p.body.user.id,
      c = f.db
        .prepare("SELECT id FROM channels WHERE user_id=?")
        .get(userId) as any;
    const mutate = (
      method: "post" | "patch" | "delete",
      route: string,
      body: object,
    ) =>
      agent[method](route)
        .set("Origin", origin)
        .set("x-csrf-token", csrf)
        .send(body);
    return { agent, csrf, userId, channelId: c.id, mutate };
  };
  const video = (channelId: string, visibility = "public") => {
    const id = crypto.randomUUID(),
      file = path.join(dataDir, "media", `${id}.mp4`);
    fs.writeFileSync(file, "bounded test media");
    f.db
      .prepare(
        "INSERT INTO videos(id,channel_id,title,description,visibility,status,media_path,source_hash,bytes,duration,created_at) VALUES(?,?,?,?,?,'ready',?,?,?,?,?)",
      )
      .run(
        id,
        channelId,
        "Security fixture",
        "Fixture metadata",
        visibility,
        file,
        id,
        18,
        15,
        new Date().toISOString(),
      );
    return { id, file };
  };
  return { ...f, login, video };
}
test("ordinary reads and unknown routes do not allocate sessions", async (t) => {
  const f = await fixture(t);
  for (const route of ["/api/health", "/api/videos", "/api/unknown"]) {
    const r = await request(f.app).get(route);
    assert.equal(r.headers["set-cookie"], undefined);
    assert.match(r.headers["cache-control"], /no-store/);
  }
  assert.equal(
    (f.db.prepare("SELECT count(*) n FROM sessions").get() as any).n,
    0,
  );
  await request(f.app).get("/api/session").expect(200);
  assert.equal(
    (f.db.prepare("SELECT count(*) n FROM sessions").get() as any).n,
    1,
  );
});
test("anonymous session issuance has a source-address bound", async (t) => {
  const f = await fixture(t);
  for (let i = 0; i < 60; i++)
    await request(f.app).get("/api/session").expect(200);
  await request(f.app).get("/api/session").expect(429);
  assert.equal(
    (f.db.prepare("SELECT count(*) n FROM sessions").get() as any).n,
    60,
  );
});
test("mutations reject missing sessions, invalid CSRF and cross-origin requests", async (t) => {
  const f = await fixture(t),
    u = await f.login("creator");
  await request(f.app)
    .post("/api/leaves")
    .send({ body: "Forged Leaf" })
    .expect(403);
  await u.agent
    .post("/api/leaves")
    .set("Origin", origin)
    .set("x-csrf-token", "invalid")
    .send({ body: "Forged Leaf" })
    .expect(403);
  await u.agent
    .post("/api/leaves")
    .set("Origin", "https://unrelated.example")
    .set("x-csrf-token", u.csrf)
    .send({ body: "Forged Leaf" })
    .expect(403);
  assert.equal(
    (f.db.prepare("SELECT count(*) n FROM leaves").get() as any).n,
    0,
  );
});
test("media ownership, range serving and visibility changes use private no-store responses", async (t) => {
  const f = await fixture(t),
    a = await f.login("owner"),
    b = await f.login("viewer"),
    v = f.video(a.channelId, "private");
  await b.agent.get(`/api/videos/${v.id}`).expect(404);
  await request(f.app).get(`/api/media/${v.id}/video`).expect(404);
  assert.match(
    (await a.agent.get(`/api/media/${v.id}/video`).expect(200)).headers[
      "cache-control"
    ],
    /private.*no-store/,
  );
  f.db.prepare("UPDATE videos SET visibility='public' WHERE id=?").run(v.id);
  assert.match(
    (
      await b.agent
        .get(`/api/media/${v.id}/video`)
        .set("Range", "bytes=0-3")
        .expect(206)
    ).headers["cache-control"],
    /private.*no-store/,
  );
  f.db.prepare("UPDATE videos SET visibility='private' WHERE id=?").run(v.id);
  await b.agent.get(`/api/media/${v.id}/video`).expect(404);
});
test("suspended creators are excluded from history and saved-video collections", async (t) => {
  const f = await fixture(t),
    a = await f.login("owner"),
    b = await f.login("viewer"),
    v = f.video(a.channelId);
  f.db
    .prepare("INSERT INTO history VALUES(?,?,?,?)")
    .run(b.userId, v.id, 5, new Date().toISOString());
  const p = await b
    .mutate("post", "/api/playlists", { title: "Saved" })
    .expect(201);
  await b
    .mutate("post", `/api/playlists/${p.body.playlist.id}/items`, {
      videoId: v.id,
    })
    .expect(200);
  f.db.prepare("UPDATE users SET status='suspended' WHERE id=?").run(a.userId);
  assert.deepEqual(
    (await b.agent.get("/api/history").expect(200)).body.videos,
    [],
  );
  assert.deepEqual(
    (await b.agent.get(`/api/playlists/${p.body.playlist.id}`).expect(200)).body
      .videos,
    [],
  );
  await b.agent.get(`/api/videos/${v.id}`).expect(404);
});
test("blocked parent authors and cross-video comment replies are rejected", async (t) => {
  const f = await fixture(t),
    a = await f.login("owner"),
    b = await f.login("viewer"),
    c = await f.login("commenter"),
    v = f.video(a.channelId),
    other = f.video(a.channelId);
  const p = await c
    .mutate("post", `/api/videos/${v.id}/comments`, {
      body: "Ordinary public comment",
    })
    .expect(201);
  await b
    .mutate("post", `/api/videos/${other.id}/comments`, {
      body: "Wrong video",
      parentId: p.body.comment.id,
    })
    .expect(400);
  await b.mutate("post", "/api/blocks", { userId: c.userId }).expect(200);
  await b
    .mutate("post", `/api/videos/${v.id}/comments`, {
      body: "Prohibited interaction",
      parentId: p.body.comment.id,
    })
    .expect(403);
  assert.equal(
    (await b.agent.get(`/api/videos/${v.id}`).expect(200)).body.comments.some(
      (x: any) => x.id === p.body.comment.id,
    ),
    false,
  );
});
test("expired stories cannot be read through a retained media URL", async (t) => {
  const f = await fixture(t),
    a = await f.login("owner"),
    id = crypto.randomUUID(),
    file = path.join(f.dataDir, "media", `${id}.jpg`);
  fs.writeFileSync(file, Buffer.from([255, 216, 255, 217]));
  f.db
    .prepare("INSERT INTO stories VALUES(?,?,?,?,?,?,?,?,?)")
    .run(
      id,
      a.userId,
      "Fixture",
      "image",
      file,
      4,
      "visible",
      new Date().toISOString(),
      new Date(Date.now() + 60000).toISOString(),
    );
  assert.match(
    (await request(f.app).get(`/api/story-media/${id}`).expect(200)).headers[
      "cache-control"
    ],
    /no-store/,
  );
  f.db
    .prepare("UPDATE stories SET expires_at=? WHERE id=?")
    .run(new Date(Date.now() - 1000).toISOString(), id);
  await request(f.app).get(`/api/story-media/${id}`).expect(404);
  assert.equal(
    (await request(f.app).get("/api/stories").expect(200)).body.stories.some(
      (s: any) => s.id === id,
    ),
    false,
  );
});
test("ordinary users cannot read confidential moderation data or remove another creator content", async (t) => {
  const f = await fixture(t),
    a = await f.login("owner"),
    b = await f.login("viewer"),
    v = f.video(a.channelId);
  await b.agent.get("/api/moderation").expect(403);
  await b
    .mutate("post", "/api/moderation/action", {
      targetType: "video",
      targetId: v.id,
      action: "remove",
      reason: "Unauthorised removal attempt",
    })
    .expect(403);
  await b
    .mutate("patch", `/api/videos/${v.id}`, { title: "Hijacked" })
    .expect(404);
  assert.equal(
    (f.db.prepare("SELECT status FROM videos WHERE id=?").get(v.id) as any)
      .status,
    "ready",
  );
  assert.equal(
    (f.db.prepare("SELECT count(*) n FROM moderation_actions").get() as any).n,
    0,
  );
  const p = await a
    .mutate("post", "/api/playlists", { title: "Private collection" })
    .expect(201);
  await b.agent.get(`/api/playlists/${p.body.playlist.id}`).expect(404);
});
test("new accounts cannot influence Community Note ratings", async (t) => {
  const f = await fixture(t),
    a = await f.login("owner"),
    b = await f.login("viewer"),
    v = f.video(a.channelId);
  const n = await a
    .mutate("post", "/api/notes", {
      targetType: "video",
      targetId: v.id,
      body: "Additional factual context supplied for review.",
      sources: ["https://example.org/evidence"],
    })
    .expect(201);
  await b
    .mutate("post", `/api/notes/${n.body.note.id}/rate`, { helpful: true })
    .expect(403);
  assert.equal(
    (f.db.prepare("SELECT count(*) n FROM note_ratings").get() as any).n,
    0,
  );
});
test("eligible note reviewers still cannot rate context on now-private target content", async (t) => {
  const f = await fixture(t),
    a = await f.login("owner"),
    b = await f.login("reviewer"),
    v = f.video(a.channelId);
  const n = await a
    .mutate("post", "/api/notes", {
      targetType: "video",
      targetId: v.id,
      body: "Sourced factual context for this particular upload.",
      sources: ["https://example.org/source"],
    })
    .expect(201);
  f.db
    .prepare("UPDATE users SET created_at=? WHERE id=?")
    .run(new Date(Date.now() - 90 * 86400000).toISOString(), b.userId);
  f.db.prepare("UPDATE videos SET visibility='private' WHERE id=?").run(v.id);
  await b
    .mutate("post", `/api/notes/${n.body.note.id}/rate`, { helpful: true })
    .expect(404);
  assert.equal(
    (f.db.prepare("SELECT count(*) n FROM note_ratings").get() as any).n,
    0,
  );
});
test("moderation approval records a reason while self-approval remains forbidden", async (t) => {
  const f = await fixture(t),
    a = await f.login("owner"),
    m = await f.login("moderator"),
    v = f.video(a.channelId);
  const n = await a
    .mutate("post", "/api/notes", {
      targetType: "video",
      targetId: v.id,
      body: "Additional verifiable context for the fixture upload.",
      sources: ["https://example.org/context"],
    })
    .expect(201);
  f.db
    .prepare("UPDATE users SET role='moderator' WHERE id IN (?,?)")
    .run(a.userId, m.userId);
  await a
    .mutate("post", "/api/moderation/action", {
      targetType: "note",
      targetId: n.body.note.id,
      action: "accept_note",
      reason: "Attempted review of my own note",
    })
    .expect(403);
  await m
    .mutate("post", "/api/moderation/action", {
      targetType: "note",
      targetId: n.body.note.id,
      action: "accept_note",
      reason: "Independent fixture review completed",
    })
    .expect(200);
  const read = await m.agent.get(`/api/videos/${v.id}`).expect(200);
  assert.equal(read.body.notes[0].id, n.body.note.id);
  const audit = f.db
    .prepare(
      "SELECT reason,moderator_id FROM moderation_actions WHERE target_id=?",
    )
    .get(n.body.note.id) as any;
  assert.equal(audit.moderator_id, m.userId);
  assert.equal(audit.reason, "Independent fixture review completed");
});
test("saved Leaves authored by a suspended account are hidden from collections", async (t) => {
  const f = await fixture(t),
    a = await f.login("owner"),
    b = await f.login("viewer");
  const l = await a
    .mutate("post", "/api/leaves", { body: "An ordinary creator update" })
    .expect(201);
  const p = await b
    .mutate("post", "/api/playlists", { title: "Saved Leaves" })
    .expect(201);
  await b
    .mutate("post", `/api/playlists/${p.body.playlist.id}/items`, {
      leafId: l.body.leaf.id,
    })
    .expect(200);
  f.db.prepare("UPDATE users SET status='suspended' WHERE id=?").run(a.userId);
  assert.deepEqual(
    (await b.agent.get(`/api/playlists/${p.body.playlist.id}`).expect(200)).body
      .leaves,
    [],
  );
});
