import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Compass,
  Download,
  Ellipsis,
  Eye,
  Flag,
  FolderPlus,
  History,
  Home,
  Image,
  Leaf,
  ListVideo,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  MonitorPlay,
  Play,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react";

type User = {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  role: string;
  onboarded: boolean;
};
type Channel = {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  subscribers: number;
  description?: string;
  banner?: string;
  subscribed?: boolean;
};
type VideoItem = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  playbackUrl?: string;
  duration: number;
  views: number;
  likes: number;
  dislikes: number;
  createdAt: string;
  visibility: string;
  status: string;
  commentsEnabled: boolean;
  channel: Channel;
  chapters?: any[];
  captions?: any[];
  reaction?: number;
};
type Session = {
  user: User | null;
  csrfToken: string;
  googleConfigured: boolean;
  registrationOpen: boolean;
  settings?: any;
};
type Context = {
  session: Session;
  refresh: () => Promise<void>;
  api: (url: string, options?: any) => Promise<any>;
  notify: (text: string) => void;
  requireAuth: () => boolean;
  signIn: () => void;
};
const Ctx = createContext<Context>(null!);
const useApp = () => useContext(Ctx);
const count = (n: number = 0) =>
  Intl.NumberFormat("en", {
    notation: n >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n);
const duration = (seconds: number = 0) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const relative = (date: string) => {
  const n = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  return n < 60
    ? "Just now"
    : n < 3600
      ? `${Math.floor(n / 60)} minutes ago`
      : n < 86400
        ? `${Math.floor(n / 3600)} hours ago`
        : n < 86400 * 30
          ? `${Math.floor(n / 86400)} days ago`
          : new Date(date).toLocaleDateString("en-IE", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
};
function Avatar({
  name = "",
  src,
  small = false,
}: {
  name?: string;
  src?: string;
  small?: boolean;
}) {
  return src ? (
    <img
      className={`avatar ${small ? "small" : ""}`}
      src={src}
      alt=""
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className={`avatar ${small ? "small" : ""}`} aria-hidden="true">
      {name.slice(0, 1).toUpperCase() || "L"}
    </span>
  );
}
function Empty({
  icon: Icon = Video,
  title,
  children,
  action,
}: {
  icon?: any;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={32} strokeWidth={1.4} />
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
function Loading() {
  return (
    <div className="loading" role="status">
      <Loader2 size={20} className="spin" />
      Loading Leafster…
    </div>
  );
}
function useLoad(url: string) {
  const { api } = useApp();
  const [data, setData] = useState<any>(null),
    [error, setError] = useState("");
  const requestId = useRef(0),
    controller = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    controller.current?.abort();
    const id = ++requestId.current;
    const next = new AbortController();
    controller.current = next;
    setError("");
    try {
      const result = await api(url, { signal: next.signal });
      if (id === requestId.current && !next.signal.aborted) setData(result);
    } catch (e: any) {
      if (id === requestId.current && !next.signal.aborted) setError(e.message);
    }
  }, [api, url]);
  useEffect(() => {
    setData(null);
    void load();
    return () => {
      requestId.current++;
      controller.current?.abort();
    };
  }, [load]);
  return { data, error, load };
}
function ErrorBox({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <div className="error-box" role="alert">
      <strong>We couldn’t load this.</strong>
      <p>{error}</p>
      {retry && <button onClick={retry}>Try again</button>}
    </div>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const list = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
        );
        if (!list?.length) return;
        const first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    setTimeout(
      () => ref.current?.querySelector<HTMLElement>("button,input")?.focus(),
      0,
    );
    return () => {
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, [close]);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session>({
    user: null,
    csrfToken: "",
    googleConfigured: false,
    registrationOpen: false,
  });
  const [sessionLoaded, setSessionLoaded] = useState(false),
    [signIn, setSignIn] = useState(false),
    [notice, setNotice] = useState(""),
    [collapsed, setCollapsed] = useState(false),
    [mobileNav, setMobileNav] = useState(false),
    [accountOpen, setAccountOpen] = useState(false),
    [notifications, setNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 800px)").matches,
  );
  const token = useRef("");
  const location = useLocation(),
    navigate = useNavigate();
  useEffect(() => {
    const query = window.matchMedia("(max-width: 800px)");
    const change = () => {
      setIsMobile(query.matches);
      setMobileNav(false);
    };
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mobileNav) {
        setMobileNav(false);
        document.querySelector<HTMLButtonElement>(".nav-toggle")?.focus();
      }
      if (accountOpen) {
        setAccountOpen(false);
        document.querySelector<HTMLButtonElement>(".avatar-button")?.focus();
      }
      if (notifications) setNotifications(false);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [mobileNav, accountOpen, notifications]);
  const api = useCallback(async (url: string, options: any = {}) => {
    const isForm = options.body instanceof FormData;
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        ...(options.body && !isForm
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.method && options.method !== "GET"
          ? { "x-csrf-token": token.current }
          : {}),
        ...options.headers,
      },
      body:
        options.body && !isForm && typeof options.body !== "string"
          ? JSON.stringify(options.body)
          : options.body,
    });
    if (!response.ok) {
      let message = "Request failed. Please try again.";
      try {
        message = (await response.json()).error || message;
      } catch {}
      throw new Error(message);
    }
    if (response.status === 204) return {};
    return response.json();
  }, []);
  const refresh = useCallback(async () => {
    try {
      const next = await api("/api/session");
      token.current = next.csrfToken;
      setSession(next);
    } catch (e: any) {
      setNotice(e.message);
    } finally {
      setSessionLoaded(true);
    }
  }, [api]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    setMobileNav(false);
    setAccountOpen(false);
    setNotifications(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  const ctx = {
    session,
    refresh,
    api,
    notify: setNotice,
    requireAuth: () => {
      if (!session.user) {
        setSignIn(true);
        return false;
      }
      if (!session.user.onboarded) {
        navigate("/onboarding");
        return false;
      }
      return true;
    },
    signIn: () => setSignIn(true),
  };
  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
      await refresh();
      setAccountOpen(false);
      navigate("/");
    } catch (e: any) {
      setNotice(e.message);
    }
  };
  const sidebarGroups = [
    [
      [Home, "Home", "/"],
      [TrendingUp, "Trending", "/trending"],
      [Users, "Subscriptions", "/subscriptions"],
    ],
    [
      [Leaf, "Leaves", "/leaves"],
      [Clock3, "Stories", "/stories"],
    ],
    [
      [History, "History", "/history"],
      [Bookmark, "Watch Later", "/watch-later"],
      [ThumbsUp, "Liked Videos", "/liked"],
      [ListVideo, "Playlists", "/playlists"],
    ],
    [
      [
        MonitorPlay,
        "Your Channel",
        session.user?.handle
          ? `/channel/${session.user.handle}`
          : "/onboarding",
      ],
      [SlidersHorizontal, "Creator Studio", "/studio"],
      [Settings, "Settings", "/settings"],
    ],
  ];
  return (
    <Ctx.Provider value={ctx}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="brand-area">
          <button
            className="icon-button nav-toggle"
            aria-label="Toggle navigation"
            aria-expanded={isMobile ? mobileNav : !collapsed}
            onClick={() =>
              isMobile ? setMobileNav((v) => !v) : setCollapsed((v) => !v)
            }
          >
            <Menu size={22} />
          </button>
          <Link className="wordmark" to="/" aria-label="Leafster home">
            <img src="/brand/leafster-logo.png" alt="Leafster" />
            <span className="stage-label">STAGING</span>
          </Link>
        </div>
        <SearchBar />
        <div className="header-actions">
          <button
            className="create-button"
            aria-label="Upload video"
            onClick={() => ctx.requireAuth() && navigate("/studio?upload=1")}
          >
            <Upload size={19} />
            <span>Upload</span>
          </button>
          <div className="popover-parent">
            <button
              aria-label="Notifications"
              aria-expanded={notifications}
              className="icon-button"
              onClick={() =>
                session.user
                  ? setNotifications(!notifications)
                  : setSignIn(true)
              }
            >
              <Bell size={21} />
            </button>
            {notifications && (
              <div className="popover notifications">
                <h3>Notifications</h3>
                <NotificationList />
              </div>
            )}
          </div>
          <div className="popover-parent">
            {session.user ? (
              <button
                className="avatar-button"
                aria-label="Account menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen(!accountOpen)}
              >
                <Avatar
                  name={session.user.name}
                  src={session.user.avatar}
                  small
                />
              </button>
            ) : (
              <button
                className="sign-in-button"
                onClick={() => setSignIn(true)}
              >
                <LogIn size={17} />
                <span>Sign in</span>
              </button>
            )}
            {accountOpen && (
              <div className="popover account">
                <strong>{session.user?.name}</strong>
                <span className="muted">@{session.user?.handle}</span>
                <Link to={`/channel/${session.user?.handle}`}>
                  <MonitorPlay size={17} />
                  Your channel
                </Link>
                <Link to="/studio">
                  <SlidersHorizontal size={17} />
                  Leafster Studio
                </Link>
                <Link to="/settings">
                  <Settings size={17} />
                  Settings
                </Link>
                {["admin", "moderator"].includes(session.user?.role || "") && (
                  <Link to="/moderation">
                    <ShieldCheck size={17} />
                    Moderation
                  </Link>
                )}
                <button onClick={logout}>
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {mobileNav && (
        <button
          aria-label="Close navigation"
          className="nav-scrim"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside
        className={`sidebar ${!isMobile && collapsed ? "collapsed" : ""} ${mobileNav ? "mobile-open" : ""}`}
      >
        <nav aria-label="Main navigation">
          {sidebarGroups.map((group, i) => (
            <div className="nav-group" key={i}>
              {group.map(([Icon, label, path]: any) => (
                <NavLink
                  key={label}
                  to={path}
                  end={path === "/"}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? "active" : ""}`
                  }
                  title={collapsed ? label : undefined}
                  onClick={(e) => {
                    if (
                      ["Your Channel", "Creator Studio"].includes(label) &&
                      !session.user
                    ) {
                      e.preventDefault();
                      setSignIn(true);
                    }
                  }}
                >
                  <Icon size={20} strokeWidth={1.7} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p>Leafster · A EuroLoot project</p>
          <div>
            <Link to="/policies/privacy">Privacy</Link>
            <Link to="/policies/terms">Terms</Link>
            <Link to="/policies/safety">Safety</Link>
            <Link to="/notices">Report illegal content</Link>
          </div>
          <p className="staging-footnote">Restricted development staging</p>
        </div>
      </aside>
      <main
        id="main"
        className={`main ${collapsed ? "wide" : ""}`}
        tabIndex={-1}
      >
        {!sessionLoaded ? (
          <Loading />
        ) : (
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/trending" element={<Feed kind="trending" />} />
            <Route
              path="/subscriptions"
              element={<Feed kind="subscriptions" />}
            />
            <Route path="/search" element={<Feed kind="search" />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/channel/:handle" element={<ChannelPage />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/leaves" element={<LeavesPage />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/history" element={<Library kind="history" />} />
            <Route
              path="/watch-later"
              element={<Library kind="watch-later" />}
            />
            <Route path="/liked" element={<Library kind="liked" />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/moderation" element={<Moderation />} />
            <Route path="/policies/:kind" element={<Policies />} />
            <Route path="/notices" element={<LegalNotice />} />
            <Route
              path="*"
              element={
                <Empty
                  title="This page isn’t here"
                  action={
                    <Link className="button primary" to="/">
                      Back to home
                    </Link>
                  }
                >
                  The link may be out of date.
                </Empty>
              }
            />
          </Routes>
        )}
      </main>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {signIn && (
        <Modal title="Welcome to Leafster" close={() => setSignIn(false)}>
          <p className="modal-intro">
            Sign in to create a channel, share videos, and join public
            conversations.
          </p>
          <div className="google-signin">
            {session.googleConfigured ? (
              <a className="button google-button" href="/api/auth/google">
                <span className="google-g">G</span>Continue with Google
              </a>
            ) : (
              <>
                <button className="button google-button" disabled>
                  <span className="google-g">G</span>Continue with Google
                </button>
                <p className="form-note">
                  Google Sign-In is awaiting the project’s OAuth credentials.
                  Account creation is unavailable until it is configured.
                </p>
              </>
            )}
          </div>
          <div className="notice-box">
            <ShieldCheck size={21} />
            <div>
              <strong>Restricted staging</strong>
              <p>
                Access is limited to approved adult testers. Public registration
                is closed.
              </p>
            </div>
          </div>
          <p className="form-note">
            Leafster requests only your basic Google identity. Connecting a
            YouTube channel will require separate consent.
          </p>
          <div className="modal-footer-links">
            <Link to="/policies/privacy" onClick={() => setSignIn(false)}>
              Privacy notice
            </Link>
            <Link to="/policies/terms" onClick={() => setSignIn(false)}>
              Terms
            </Link>
          </div>
        </Modal>
      )}
    </Ctx.Provider>
  );
}

function SearchBar() {
  const [value, setValue] = useState(""),
    [suggest, setSuggest] = useState<string[]>([]);
  const navigate = useNavigate();
  const { api } = useApp();
  useEffect(() => {
    setSuggest([]);
    if (value.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api(`/api/videos?q=${encodeURIComponent(value)}`, {
        signal: controller.signal,
      })
        .then((d) => {
          if (!controller.signal.aborted)
            setSuggest((d.videos || []).slice(0, 5).map((v: any) => v.title));
        })
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, api]);
  const submit = (text = value) => {
    if (!text.trim()) return;
    navigate(`/search?q=${encodeURIComponent(text.trim())}`);
    setSuggest([]);
  };
  return (
    <form
      className="search-area"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="search-input-wrap">
        <input
          aria-label="Search Leafster"
          placeholder="Search videos and creators"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {value && (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => setValue("")}
          >
            <X size={15} />
          </button>
        )}
        {suggest.length > 0 && (
          <div className="search-suggestions">
            {suggest.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setValue(s);
                  submit(s);
                }}
              >
                <Search size={16} />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <button aria-label="Search" className="search-submit">
        <Search size={20} />
      </button>
    </form>
  );
}
function NotificationList() {
  const { data, error } = useLoad("/api/notifications");
  return error ? (
    <p className="muted">{error}</p>
  ) : !data ? (
    <Loading />
  ) : data.notifications?.length ? (
    <div>
      {data.notifications.map((n: any) => (
        <p key={n.id}>{n.body || n.text || n.message}</p>
      ))}
    </div>
  ) : (
    <div className="notification-empty">
      <Bell size={24} />
      <p>You’re all caught up.</p>
    </div>
  );
}

function VideoCard({ video }: { video: VideoItem }) {
  return (
    <article className="video-card">
      <Link
        className="thumbnail"
        to={`/watch/${video.id}`}
        aria-label={`Watch ${video.title}`}
      >
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <div className="thumb-placeholder">
            <Video size={35} strokeWidth={1.3} />
          </div>
        )}
        <span className="duration">{duration(video.duration)}</span>
      </Link>
      <div className="video-card-details">
        <div>
          <Link className="video-title" to={`/watch/${video.id}`}>
            {video.title}
          </Link>
          <Link
            className="channel-link"
            to={`/channel/${video.channel.handle}`}
          >
            {video.channel.name}
          </Link>
          <p className="video-meta">
            {count(video.views)} {video.views === 1 ? "view" : "views"}{" "}
            <span>·</span> {relative(video.createdAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
function Grid({ videos }: { videos: VideoItem[] }) {
  return (
    <div className="video-grid">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}
function Feed({ kind = "home" }: { kind?: string }) {
  const { session, requireAuth, signIn } = useApp();
  const [feed, setFeed] = useState("recommended"),
    [sort, setSort] = useState("newest"),
    [length, setLength] = useState("all");
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const selectedFeed =
    kind === "subscriptions"
      ? "subscriptions"
      : kind === "trending"
        ? "trending"
        : feed;
  const { data, error, load } = useLoad(
    `/api/videos?feed=${selectedFeed}&sort=${kind === "trending" ? "views" : sort}&q=${encodeURIComponent(query)}${length !== "all" ? `&duration=${length}` : ""}`,
  );
  const fresh = useLoad("/api/videos?feed=fresh");
  const title =
    kind === "trending"
      ? "Trending"
      : kind === "subscriptions"
        ? "Subscriptions"
        : kind === "search"
          ? `Search results for “${query}”`
          : "Videos";
  const videos: VideoItem[] = data?.videos || [];
  const shelves =
    kind === "home" &&
    feed === "recommended" &&
    !query &&
    length === "all" &&
    sort === "newest";
  const featured = videos.slice(0, 4),
    used = new Set(featured.map((v) => v.id));
  const groups = new Map<string, VideoItem[]>();
  if (shelves)
    for (const v of videos.slice(4)) {
      const list = groups.get(v.channel.id) || [];
      list.push(v);
      groups.set(v.channel.id, list);
    }
  const channelShelves = Array.from(groups.values())
    .filter((v) => v.length >= 2)
    .slice(0, 3);
  for (const list of channelShelves) for (const v of list) used.add(v.id);
  const freshVideos = (fresh.data?.videos || [])
    .filter((v: VideoItem) => !used.has(v.id))
    .slice(0, 4);
  for (const v of freshVideos) used.add(v.id);
  const remaining = videos.slice(4).filter((v) => !used.has(v.id));
  const upload = (
    <Link
      className="button primary"
      to="/studio"
      onClick={(e) => {
        if (!requireAuth()) e.preventDefault();
      }}
    >
      Upload a video
    </Link>
  );
  return (
    <div className="feed-page">
      <nav className="discovery-nav" aria-label="Discovery">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/trending">Trending</NavLink>
      </nav>
      <div className="feed-board">
        <div className="feed-toolbar">
          {kind === "home" ? (
            <nav className="feed-choice" aria-label="Feed order">
              {["recommended", "subscriptions", "latest", "fresh"].map((f) => (
                <button
                  key={f}
                  className={f === feed ? "selected" : ""}
                  onClick={() => setFeed(f)}
                >
                  {f === "fresh"
                    ? "Fresh Finds"
                    : f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </nav>
          ) : (
            <h1>{title}</h1>
          )}
          <div className="feed-filters">
            {kind !== "trending" && (
              <select
                aria-label="Sort videos"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="views">Most viewed</option>
              </select>
            )}
            <select
              aria-label="Video length"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            >
              <option value="all">All lengths</option>
              <option value="short">Short videos</option>
              <option value="long">Long videos</option>
            </select>
          </div>
        </div>
        {selectedFeed === "subscriptions" && !session.user ? (
          <div className="plain-feed-empty">
            <h2>Subscriptions</h2>
            <p>Sign in to see videos from your subscribed channels.</p>
            <button className="button primary" onClick={signIn}>
              Sign in
            </button>
          </div>
        ) : error ? (
          <ErrorBox error={error} retry={load} />
        ) : !data ? (
          <Loading />
        ) : videos.length ? (
          <>
            <VideoShelf
              title={
                shelves
                  ? "Recently uploaded"
                  : kind === "home"
                    ? feed === "fresh"
                      ? "Fresh Finds"
                      : feed === "subscriptions"
                        ? "Subscriptions"
                        : "Latest videos"
                    : title
              }
              videos={shelves ? featured : videos}
              subtitle={
                kind === "trending"
                  ? "Most watched in the last 7 days"
                  : undefined
              }
            />
            {shelves &&
              channelShelves.map((list) => (
                <VideoShelf
                  key={list[0].channel.id}
                  title={list[0].channel.name}
                  handle={list[0].channel.handle}
                  subtitle="Creator channel"
                  videos={list.slice(0, 4)}
                />
              ))}
            {shelves && freshVideos.length > 0 && (
              <VideoShelf
                title="Fresh Finds"
                subtitle="Smaller creators · recent uploads"
                videos={freshVideos}
              />
            )}
            {shelves && session.user && (
              <SubscribedShelf excluded={Array.from(used)} />
            )}
            {shelves && remaining.length > 0 && (
              <VideoShelf title="More videos" videos={remaining} />
            )}
          </>
        ) : (
          <section className="plain-feed-empty">
            <h2>
              {kind === "search"
                ? "Search results"
                : selectedFeed === "fresh"
                  ? "Fresh Finds"
                  : title}
            </h2>
            <p>
              {query
                ? "No videos matched your search."
                : length !== "all"
                  ? "No public videos match this length."
                  : selectedFeed === "trending"
                    ? "No videos have counted views in the last 7 days."
                    : selectedFeed === "subscriptions"
                      ? "No public uploads from your subscriptions yet."
                      : "No public videos yet."}
            </p>
            {query ? (
              <Link className="button" to="/">
                Browse videos
              </Link>
            ) : (
              upload
            )}
          </section>
        )}
        {data?.feedInfo?.criteria && (
          <p className="feed-criteria">{data.feedInfo.criteria}</p>
        )}
      </div>
      <footer className="feed-footer">
        <span>Leafster · A EuroLoot project</span>
        <Link to="/policies/terms">Terms</Link>
        <Link to="/policies/privacy">Privacy</Link>
        <Link to="/policies/safety">Safety</Link>
        <Link to="/notices">Report illegal content</Link>
      </footer>
    </div>
  );
}
function VideoShelf({
  title,
  subtitle,
  handle,
  videos,
}: {
  title: string;
  subtitle?: string;
  handle?: string;
  videos: VideoItem[];
}) {
  return (
    <section className="video-shelf">
      <div className="shelf-heading">
        <h2>
          {handle ? <Link to={`/channel/${handle}`}>{title}</Link> : title}
        </h2>
        {subtitle && <span>{subtitle}</span>}
      </div>
      <Grid videos={videos} />
    </section>
  );
}
function SubscribedShelf({ excluded }: { excluded: string[] }) {
  const { data } = useLoad("/api/videos?feed=subscriptions");
  const videos = (data?.videos || [])
    .filter((v: VideoItem) => !excluded.includes(v.id))
    .slice(0, 4);
  return videos.length ? (
    <VideoShelf title="From your subscriptions" videos={videos} />
  ) : null;
}

function AuthRequired({ children }: { children: React.ReactNode }) {
  const { session, signIn } = useApp();
  return session.user ? (
    <>{children}</>
  ) : (
    <Empty
      icon={LogIn}
      title="Sign in to continue"
      action={
        <button className="button primary" onClick={signIn}>
          Continue with Google
        </button>
      }
    >
      Your channel, library, and settings belong to your account.
    </Empty>
  );
}

function Watch() {
  const { id } = useParams();
  const { data, error, load } = useLoad(`/api/videos/${id}`);
  const { session, api, requireAuth, notify } = useApp();
  const [theatre, setTheatre] = useState(false),
    [expanded, setExpanded] = useState(false),
    [comment, setComment] = useState(""),
    [reply, setReply] = useState<string | null>(null),
    [report, setReport] = useState<any>(null),
    [note, setNote] = useState(false),
    [save, setSave] = useState(false),
    [sort, setSort] = useState("newest");
  const player = useRef<HTMLVideoElement>(null),
    lastSaved = useRef(0);
  const video: VideoItem | undefined = data?.video;
  useEffect(() => {
    lastSaved.current = 0;
  }, [id]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        document.querySelector('[role="dialog"]') ||
        (e.target as HTMLElement).isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(
          (e.target as HTMLElement).tagName,
        ) ||
        !player.current
      )
        return;
      const p = player.current;
      if (e.code === "Space" || e.key === "k") {
        e.preventDefault();
        p.paused ? void p.play() : p.pause();
      }
      if (e.key === "ArrowRight")
        p.currentTime = Math.min(p.duration, p.currentTime + 5);
      if (e.key === "ArrowLeft") p.currentTime = Math.max(0, p.currentTime - 5);
      if (e.key === "m") p.muted = !p.muted;
      if (e.key === "f") void p.requestFullscreen();
      if (e.key === "t") setTheatre((t) => !t);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  const action = async (url: string, body: any = {}, method = "POST") => {
    if (!requireAuth()) return;
    try {
      await api(url, { method, body });
      await load();
    } catch (e: any) {
      notify(e.message);
    }
  };
  if (error) return <ErrorBox error={error} retry={load} />;
  if (!video) return <Loading />;
  const comments = [...(data.comments || [])].sort((a: any, b: any) =>
    sort === "oldest"
      ? a.createdAt.localeCompare(b.createdAt)
      : b.createdAt.localeCompare(a.createdAt),
  );
  return (
    <div className={`watch-layout ${theatre ? "theatre" : ""}`}>
      <section className="watch-main">
        <div className="player-wrap">
          {video.status === "ready" ? (
            <video
              ref={player}
              controls
              playsInline
              preload="metadata"
              poster={video.thumbnailUrl}
              src={video.playbackUrl}
              onLoadedMetadata={() => {
                if ((video as any).progress && player.current)
                  player.current.currentTime = (video as any).progress;
              }}
              onTimeUpdate={() => {
                const p = player.current;
                if (
                  session.user &&
                  p &&
                  p.currentTime - lastSaved.current >= 10
                ) {
                  lastSaved.current = p.currentTime;
                  void api(`/api/videos/${id}/progress`, {
                    method: "POST",
                    body: { seconds: p.currentTime, watchedSeconds: 10 },
                  }).catch(() => {});
                }
              }}
            >
              {video.captions?.map((c: any, i: number) => (
                <track
                  key={i}
                  src={c.url}
                  label={c.label}
                  kind="captions"
                  srcLang={c.language}
                />
              ))}
            </video>
          ) : (
            <div className="player-processing">
              <Loader2 className="spin" size={30} />
              <h2>
                {video.status === "failed"
                  ? "Video processing failed"
                  : "Your video is processing"}
              </h2>
              <p>Check Leafster Studio for its current status.</p>
              <button className="button" onClick={load}>
                Refresh status
              </button>
            </div>
          )}
        </div>
        <div className="player-tools">
          <span>
            Original upload{video.status === "ready" ? " · MP4 playback" : ""}
          </span>
          <div>
            <label>
              Speed{" "}
              <select
                aria-label="Playback speed"
                defaultValue="1"
                onChange={(e) => {
                  if (player.current)
                    player.current.playbackRate = Number(e.target.value);
                }}
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((v) => (
                  <option key={v} value={v}>
                    {v}×
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => setTheatre(!theatre)} aria-pressed={theatre}>
              Theatre
            </button>
            <button
              onClick={() => {
                if (player.current?.requestPictureInPicture)
                  void player.current
                    .requestPictureInPicture()
                    .catch(() =>
                      notify(
                        "Picture-in-picture is unavailable in this browser.",
                      ),
                    );
                else
                  notify("Picture-in-picture is unavailable in this browser.");
              }}
            >
              Picture in picture
            </button>
          </div>
        </div>
        <h1 className="watch-title">{video.title}</h1>
        <div className="watch-summary">
          <span>
            {count(video.views)} views ·{" "}
            {new Date(video.createdAt).toLocaleDateString("en-IE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <div className="watch-actions">
            <button
              aria-label="Like video"
              aria-pressed={video.reaction === 1}
              className={video.reaction === 1 ? "chosen" : ""}
              onClick={() =>
                action(`/api/videos/${id}/reaction`, {
                  value: video.reaction === 1 ? 0 : 1,
                })
              }
            >
              <ThumbsUp size={19} />
              {count(video.likes)}
            </button>
            <button
              aria-label="Dislike video"
              aria-pressed={video.reaction === -1}
              className={video.reaction === -1 ? "chosen" : ""}
              onClick={() =>
                action(`/api/videos/${id}/reaction`, {
                  value: video.reaction === -1 ? 0 : -1,
                })
              }
            >
              <ThumbsDown size={19} />
              {count(video.dislikes)}
            </button>
            <button
              onClick={async () => {
                try {
                  if (navigator.share)
                    await navigator.share({
                      title: video.title,
                      url: location.href,
                    });
                  else {
                    await navigator.clipboard.writeText(location.href);
                    notify("Video link copied.");
                  }
                } catch {}
              }}
            >
              <ArrowRight size={19} />
              Share
            </button>
            <button onClick={() => requireAuth() && setSave(true)}>
              <ListVideo size={20} />
              Save
            </button>
            <button
              aria-label="Report video"
              onClick={() =>
                requireAuth() &&
                setReport({ targetType: "video", targetId: id })
              }
            >
              <Flag size={19} />
            </button>
          </div>
        </div>
        <div className="watch-channel">
          <Link to={`/channel/${video.channel.handle}`}>
            <Avatar name={video.channel.name} src={video.channel.avatar} />
            <div>
              <strong>{video.channel.name}</strong>
              <p>{count(video.channel.subscribers)} subscribers</p>
            </div>
          </Link>
          <button
            disabled={session.user?.id === (video.channel as any).userId}
            className={`button ${(video as any).subscribed ? "subscribed" : "primary"}`}
            onClick={() =>
              action(
                `/api/channels/${video.channel.id}/subscribe`,
                {},
                (video as any).subscribed ? "DELETE" : "POST",
              )
            }
          >
            {session.user?.id === (video.channel as any).userId ? (
              "Your channel"
            ) : (video as any).subscribed ? (
              <>
                <Check size={16} />
                Subscribed
              </>
            ) : (
              "Subscribe"
            )}
          </button>
        </div>
        <div className={`video-description ${expanded ? "expanded" : ""}`}>
          <p>{video.description || "No description provided."}</p>
          {video.chapters && video.chapters.length > 0 && (
            <div className="chapters">
              {video.chapters.map((c: any, i: number) => (
                <button
                  key={i}
                  onClick={() => {
                    if (player.current) player.current.currentTime = c.seconds;
                  }}
                >
                  {duration(c.seconds)} {c.title}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="text-button expand-description"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
        <section className="notes-section">
          <div className="section-heading">
            <h2>
              <ShieldCheck size={18} />
              Community Notes
            </h2>
            <button
              className="text-button"
              onClick={() => requireAuth() && setNote(true)}
            >
              Add context
            </button>
          </div>
          {data.notes?.length ? (
            data.notes.map((n: any) => (
              <div key={n.id} className="accepted-note">
                <p>{n.body}</p>
                {n.sources?.map((s: string) => (
                  <a key={s} href={s} target="_blank" rel="noreferrer">
                    {new URL(s).hostname}
                  </a>
                ))}
                <div>
                  <button
                    className="text-button"
                    onClick={() =>
                      action(`/api/notes/${n.id}/rate`, { helpful: true })
                    }
                  >
                    Helpful
                  </button>
                  <button
                    className="text-button"
                    onClick={() =>
                      action(`/api/notes/${n.id}/rate`, { helpful: false })
                    }
                  >
                    Not helpful
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="muted small-text">
              No accepted notes on this video. Notes add sourced context after
              moderation review.
            </p>
          )}
        </section>
        <section className="comments-section">
          <div className="section-heading">
            <h2>{comments.length} comments</h2>
            <select
              aria-label="Sort comments"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
          {video.commentsEnabled !== false ? (
            <>
              <form
                className="comment-composer"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!requireAuth()) return;
                  try {
                    await api(`/api/videos/${id}/comments`, {
                      method: "POST",
                      body: { body: comment, parentId: reply || undefined },
                    });
                    setComment("");
                    setReply(null);
                    await load();
                  } catch (e: any) {
                    notify(e.message);
                  }
                }}
              >
                <Avatar
                  name={session.user?.name}
                  src={session.user?.avatar}
                  small
                />
                <div>
                  {reply && (
                    <div className="reply-indicator">
                      Replying to a comment
                      <button type="button" onClick={() => setReply(null)}>
                        <X size={13} />
                      </button>
                    </div>
                  )}
                  <textarea
                    aria-label="Write a public comment"
                    placeholder={
                      session.user
                        ? "Add a public comment…"
                        : "Sign in to join the conversation"
                    }
                    value={comment}
                    maxLength={2000}
                    onFocus={() => !session.user && requireAuth()}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="composer-actions">
                    <span>Keep it respectful. Comments are public.</span>
                    <button
                      className="button primary"
                      disabled={!comment.trim()}
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </form>
              {comments.map((c: any) => (
                <article
                  key={c.id}
                  className={`comment ${c.parentId ? "is-reply" : ""}`}
                >
                  <Avatar name={c.author.name} src={c.author.avatar} small />
                  <div>
                    <Link to={`/channel/${c.author.handle}`}>
                      <strong>{c.author.name}</strong>
                    </Link>
                    <span className="comment-date">
                      {relative(c.createdAt)}
                    </span>
                    <p>{c.body}</p>
                    <div className="comment-actions">
                      <button
                        onClick={() => {
                          if (requireAuth()) {
                            setReply(c.id);
                            document
                              .querySelector<HTMLTextAreaElement>(
                                ".comment-composer textarea",
                              )
                              ?.focus();
                          }
                        }}
                      >
                        Reply
                      </button>
                      <button
                        aria-label="Report comment"
                        onClick={() =>
                          requireAuth() &&
                          setReport({ targetType: "comment", targetId: c.id })
                        }
                      >
                        <Flag size={13} />
                      </button>
                      {session.user?.id === c.author.id && (
                        <button
                          aria-label="Delete comment"
                          onClick={() =>
                            action(`/api/comments/${c.id}`, {}, "DELETE")
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </>
          ) : (
            <p className="muted">The creator has turned comments off.</p>
          )}
        </section>
      </section>
      <aside className="related">
        <div className="section-heading">
          <h2>Up next</h2>
          <span className="muted small-text">Autoplay off</span>
        </div>
        {data.related?.length ? (
          data.related.map((v: VideoItem) => <VideoCard key={v.id} video={v} />)
        ) : (
          <p className="muted small-text">
            More videos will appear as the catalogue grows.
          </p>
        )}
        <div className="keyboard-tip">
          <strong>At your pace.</strong>
          <p>
            Space to play or pause. ← / → to seek. M to mute. F for fullscreen.
          </p>
          <p>Dislike counts are public, just like likes.</p>
        </div>
      </aside>
      {report && <Report target={report} close={() => setReport(null)} />}{" "}
      {note && (
        <NoteForm
          target={{ targetType: "video", targetId: id }}
          close={() => setNote(false)}
        />
      )}{" "}
      {save && <SaveDialog videoId={id!} close={() => setSave(false)} />}
    </div>
  );
}
function Report({ target, close }: { target: any; close: () => void }) {
  const { api, notify } = useApp();
  const [reason, setReason] = useState("Harassment or abuse"),
    [details, setDetails] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title="Report content" close={close}>
      <p className="modal-intro">
        Reports are confidential and reviewed by the moderation team. Include
        only information relevant to this content.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/api/reports", {
              method: "POST",
              body: { ...target, reason, details },
            });
            notify("Report submitted for review.");
            close();
          } catch (e: any) {
            notify(e.message);
            setBusy(false);
          }
        }}
      >
        <label>
          Reason
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {[
              "Harassment or abuse",
              "Child safety concern",
              "Sexual content",
              "Hate or violence",
              "Spam or scams",
              "Copyright concern",
              "Privacy or personal information",
              "Other",
            ].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Additional details
          <textarea
            value={details}
            maxLength={2000}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Help us understand the concern…"
          />
        </label>
        <div className="form-actions">
          <button type="button" className="button" onClick={close}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            Submit report
          </button>
        </div>
      </form>
    </Modal>
  );
}
function NoteForm({ target, close }: { target: any; close: () => void }) {
  const { api, notify } = useApp();
  const [body, setBody] = useState(""),
    [sources, setSources] = useState("");
  return (
    <Modal title="Propose a Community Note" close={close}>
      <p className="modal-intro">
        Add factual context with reliable sources. Notes stay pending until
        reviewed. Votes alone do not establish accuracy.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/notes", {
              method: "POST",
              body: {
                ...target,
                body,
                sources: sources
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            });
            notify("Your note was submitted for moderation review.");
            close();
          } catch (e: any) {
            notify(e.message);
          }
        }}
      >
        <label>
          Context
          <textarea
            required
            value={body}
            maxLength={1500}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <label>
          Supporting sources
          <textarea
            required
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            placeholder="One HTTPS URL per line"
          />
        </label>
        <p className="form-note">
          Do not include private information. New accounts cannot rate notes
          until eligible.
        </p>
        <div className="form-actions">
          <button className="button primary">Submit note</button>
        </div>
      </form>
    </Modal>
  );
}
function SaveDialog({
  videoId,
  leafId,
  close,
}: {
  videoId?: string;
  leafId?: string;
  close: () => void;
}) {
  const { data, error, load } = useLoad("/api/playlists");
  const { api, notify } = useApp();
  const [title, setTitle] = useState("");
  return (
    <Modal title="Save to a collection" close={close}>
      {error ? (
        <ErrorBox error={error} retry={load} />
      ) : !data ? (
        <Loading />
      ) : (
        <div className="playlist-choices">
          {data.playlists?.length ? (
            data.playlists.map((p: any) => (
              <button
                key={p.id}
                onClick={async () => {
                  try {
                    await api(`/api/playlists/${p.id}/items`, {
                      method: "POST",
                      body: { videoId, leafId },
                    });
                    notify(`Saved to ${p.title}.`);
                    close();
                  } catch (e: any) {
                    notify(e.message);
                  }
                }}
              >
                <ListVideo size={20} />
                <span>
                  {p.title}
                  <small>
                    {p.visibility} · {p.itemCount} items
                  </small>
                </span>
                <Plus size={18} />
              </button>
            ))
          ) : (
            <p className="muted">Create your first collection below.</p>
          )}
        </div>
      )}
      <form
        className="inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/playlists", {
              method: "POST",
              body: { title, visibility: "private" },
            });
            setTitle("");
            await load();
          } catch (e: any) {
            notify(e.message);
          }
        }}
      >
        <input
          required
          aria-label="New collection name"
          placeholder="New private collection"
          value={title}
          maxLength={100}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="button">Create</button>
      </form>
    </Modal>
  );
}

function ChannelPage() {
  const { handle } = useParams();
  const { data, error, load } = useLoad(`/api/channels/${handle}`);
  const { session, api, notify, requireAuth } = useApp();
  const [tab, setTab] = useState("Videos"),
    [edit, setEdit] = useState(false);
  if (error) return <ErrorBox error={error} retry={load} />;
  if (!data) return <Loading />;
  const c = data.channel;
  const own = session.user?.id === c.userId;
  return (
    <div className="channel-page">
      <div className="channel-banner">
        {c.banner ? (
          <img src={c.banner} alt="" />
        ) : (
          <div>
            <Leaf size={52} strokeWidth={0.9} />
            <span>@{c.handle}</span>
          </div>
        )}
      </div>
      <div className="channel-header">
        <Avatar name={c.name} src={c.avatar} />
        <div>
          <h1>{c.name}</h1>
          <p>
            @{c.handle} <span>·</span> {count(c.subscribers)} subscribers{" "}
            <span>·</span> {data.videos.length} videos
          </p>
          <p className="channel-description-short">
            {c.description || "This creator hasn’t added a description yet."}
          </p>
        </div>
        {own ? (
          <button className="button" onClick={() => setEdit(true)}>
            Edit channel
          </button>
        ) : (
          <button
            className={`button ${c.subscribed ? "" : "primary"}`}
            onClick={async () => {
              if (!requireAuth()) return;
              try {
                await api(`/api/channels/${c.id}/subscribe`, {
                  method: c.subscribed ? "DELETE" : "POST",
                  body: {},
                });
                await load();
              } catch (e: any) {
                notify(e.message);
              }
            }}
          >
            {c.subscribed ? "Subscribed" : "Subscribe"}
          </button>
        )}
      </div>
      <div className="channel-tabs">
        {["Videos", "Leaves", "Stories", "About"].map((t) => (
          <button
            className={t === tab ? "selected" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="channel-content">
        {tab === "Videos" ? (
          data.videos.length ? (
            <Grid videos={data.videos} />
          ) : (
            <Empty title="No public videos yet">
              Published videos will appear here.
            </Empty>
          )
        ) : tab === "Leaves" ? (
          data.leaves?.length ? (
            data.leaves.map((l: any) => (
              <LeafCard key={l.id} leaf={l} refresh={load} />
            ))
          ) : (
            <Empty icon={Leaf} title="No Leaves yet">
              Public updates from this creator will appear here.
            </Empty>
          )
        ) : tab === "About" ? (
          <div className="about-channel">
            <h2>About {c.name}</h2>
            <p>{c.description || "No description added."}</p>
            {c.links?.map((l: any, i: number) => (
              <a key={i} href={l.url || l} rel="noreferrer" target="_blank">
                {l.title || l.url || l}
              </a>
            ))}
            <button
              className="text-button danger"
              onClick={async () => {
                if (!requireAuth()) return;
                try {
                  await api("/api/blocks", {
                    method: "POST",
                    body: { userId: c.userId },
                  });
                  notify("Creator blocked. You can manage blocks in Settings.");
                } catch (e: any) {
                  notify(e.message);
                }
              }}
            >
              Block this creator
            </button>
          </div>
        ) : tab === "Stories" ? (
          <ChannelStories userId={c.userId} />
        ) : (
          <Empty icon={ListVideo} title="Creator playlists">
            Use your Library to create and manage collections.
          </Empty>
        )}
      </div>
      {edit && (
        <ChannelEdit channel={c} close={() => setEdit(false)} saved={load} />
      )}
    </div>
  );
}
function ChannelEdit({
  channel,
  close,
  saved,
}: {
  channel: any;
  close: () => void;
  saved: () => void;
}) {
  const [name, setName] = useState(channel.name),
    [description, setDescription] = useState(channel.description || "");
  const { api, notify } = useApp();
  return (
    <Modal title="Edit your channel" close={close}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/channel", {
              method: "PATCH",
              body: { name, description },
            });
            saved();
            close();
            notify("Channel updated.");
          } catch (e: any) {
            notify(e.message);
          }
        }}
      >
        <label>
          Display name
          <input
            value={name}
            required
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            maxLength={2000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <p className="form-note">
          Google profile photos are used as channel avatars. Custom image
          branding is not yet available.
        </p>
        <div className="form-actions">
          <button className="button primary">Save changes</button>
        </div>
      </form>
    </Modal>
  );
}

function Studio() {
  return (
    <AuthRequired>
      <StudioContent />
    </AuthRequired>
  );
}
function StudioContent() {
  const { data, error, load } = useLoad("/api/studio");
  const { api, notify, session } = useApp();
  const [params, setParams] = useSearchParams();
  const [upload, setUpload] = useState(params.get("upload") === "1"),
    [edit, setEdit] = useState<VideoItem | null>(null),
    [tab, setTab] = useState("Content");
  useEffect(() => {
    if (
      !data?.videos?.some((v: VideoItem) =>
        ["processing", "queued"].includes(v.status),
      )
    )
      return;
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [data, load]);
  return (
    <div className="page studio-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CREATOR WORKSPACE</p>
          <h1>
            <Leaf size={25} />
            Leafster Studio
          </h1>
        </div>
        <button className="button primary" onClick={() => setUpload(true)}>
          <Upload size={17} />
          Upload video
        </button>
      </div>
      <div className="studio-tabs">
        {["Content", "Analytics", "Comments", "Migration"].map((t) => (
          <button
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      {error ? (
        <ErrorBox error={error} retry={load} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <div className="analytics-row">
            {[
              [Eye, "Channel views", data.analytics.views],
              [Users, "Subscribers", data.analytics.subscribers],
              [
                Clock3,
                "Watch time",
                `${Math.round(data.analytics.watchSeconds / 60)} min`,
              ],
              [Video, "Uploads", data.analytics.uploads],
            ].map(([Icon, label, value]: any) => (
              <div className="metric" key={label}>
                <Icon size={20} />
                <span>{label}</span>
                <strong>
                  {typeof value === "number" ? count(value) : value}
                </strong>
              </div>
            ))}
          </div>
          {tab === "Content" ? (
            <>
              <div className="section-heading">
                <h2>Channel content</h2>
                <span className="muted small-text">
                  {data.quota
                    ? `${(data.quota.usedBytes / 1024 / 1024).toFixed(1)} MB of ${Math.floor(data.quota.maxBytes / 1024 / 1024)} MB used`
                    : ""}
                </span>
              </div>
              {data.videos.length ? (
                <div className="table-scroll">
                  <table className="content-table">
                    <thead>
                      <tr>
                        <th>Video</th>
                        <th>Visibility</th>
                        <th>Status</th>
                        <th>Views</th>
                        <th>Published</th>
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.videos.map((v: VideoItem) => (
                        <tr key={v.id}>
                          <td>
                            <Link
                              to={`/watch/${v.id}`}
                              className="studio-video"
                            >
                              {v.thumbnailUrl ? (
                                <img src={v.thumbnailUrl} alt="" />
                              ) : (
                                <span>
                                  <Video size={22} />
                                </span>
                              )}
                              <div>
                                <strong>{v.title}</strong>
                                <small>{duration(v.duration)}</small>
                              </div>
                            </Link>
                          </td>
                          <td>
                            <span className="visibility-label">
                              {v.visibility}
                            </span>
                          </td>
                          <td>
                            <span className={`status-label ${v.status}`}>
                              {v.status}
                            </span>
                          </td>
                          <td>{count(v.views)}</td>
                          <td>
                            {new Date(v.createdAt).toLocaleDateString("en-IE")}
                          </td>
                          <td>
                            <button
                              className="text-button"
                              onClick={() => setEdit(v)}
                            >
                              Edit
                            </button>
                            <button
                              className="icon-button danger"
                              aria-label={`Delete ${v.title}`}
                              onClick={async () => {
                                if (
                                  !confirm(
                                    `Delete “${v.title}” and its uploaded file? This cannot be undone.`,
                                  )
                                )
                                  return;
                                try {
                                  await api(`/api/videos/${v.id}`, {
                                    method: "DELETE",
                                    body: {},
                                  });
                                  await load();
                                  notify("Video deleted.");
                                } catch (e: any) {
                                  notify(e.message);
                                }
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  icon={Upload}
                  title="Your first upload belongs here"
                  action={
                    <button
                      className="button primary"
                      onClick={() => setUpload(true)}
                    >
                      Select a video
                    </button>
                  }
                >
                  Upload an original video, review it, and choose when to
                  publish.
                </Empty>
              )}
              <div className="studio-help">
                <ShieldCheck size={21} />
                <div>
                  <strong>Your channel, your choices.</strong>
                  <p>
                    Videos start private. Publish only after processing
                    finishes. Uploads are limited to 100 MB each and a 500 MB
                    account quota.
                  </p>
                </div>
              </div>
            </>
          ) : tab === "Analytics" ? (
            <div className="analytics-details">
              <h2>Your actual platform activity</h2>
              <p>
                These totals are calculated from Leafster’s own stored
                engagement and playback events. No synthetic traffic is
                included.
              </p>
              <div className="notice-box">
                <Eye size={20} />
                <p>
                  Views count eligible playback sessions. Watch time is measured
                  in player progress intervals. Detailed retention, geography,
                  and time-series reports are not available in this build.
                </p>
              </div>
            </div>
          ) : tab === "Comments" ? (
            data.comments?.length ? (
              <div className="studio-comments">
                {data.comments.map((c: any) => (
                  <article className="comment" key={c.id}>
                    <Avatar
                      name={c.author?.name}
                      src={c.author?.avatar}
                      small
                    />
                    <div>
                      <strong>{c.author?.name}</strong>
                      <p>{c.body}</p>
                      <button
                        className="text-button danger"
                        onClick={async () => {
                          try {
                            await api(`/api/comments/${c.id}`, {
                              method: "DELETE",
                              body: {},
                            });
                            load();
                          } catch (e: any) {
                            notify(e.message);
                          }
                        }}
                      >
                        Remove comment
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty icon={MessageCircle} title="No comments to review">
                Comments on your videos will appear here.
              </Empty>
            )
          ) : (
            <div className="migration-panel">
              <h2>Bring your originals to Leafster</h2>
              <p>
                Upload your original files or files from a lawful export. Choose
                titles, descriptions, and visibility for each upload. Every
                video remains under your control.
              </p>
              <button
                className="button primary"
                onClick={() => setUpload(true)}
              >
                <Upload size={17} />
                Upload an original file
              </button>
              <div className="notice-box">
                <ShieldCheck size={21} />
                <div>
                  <strong>YouTube connection is not available yet.</strong>
                  <p>
                    Channel verification and metadata import need separate OAuth
                    configuration and consent. Direct transfers from YouTube are
                    unavailable; Leafster does not download YouTube videos.
                  </p>
                </div>
              </div>
              <p className="form-note">
                File hashes help prevent duplicate uploads in your own account.
                Batch migration and metadata matching are planned.
              </p>
            </div>
          )}
        </>
      )}
      {upload && (
        <UploadDialog
          close={() => {
            setUpload(false);
            setParams({});
          }}
          uploaded={() => {
            setUpload(false);
            setParams({});
            load();
          }}
        />
      )}
      {edit && (
        <VideoEdit video={edit} close={() => setEdit(null)} saved={load} />
      )}
    </div>
  );
}
function UploadDialog({
  close,
  uploaded,
}: {
  close: () => void;
  uploaded: () => void;
}) {
  const { session, notify } = useApp();
  const [file, setFile] = useState<File | null>(null),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [progress, setProgress] = useState<number | null>(null),
    [error, setError] = useState("");
  const request = useRef<XMLHttpRequest | null>(null);
  return (
    <Modal
      title="Upload a video"
      close={() => {
        if (progress !== null) {
          if (!confirm("Cancel this upload?")) return;
          request.current?.abort();
        }
        close();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!file) return;
          if (file.size > 100 * 1024 * 1024) {
            setError("This video exceeds the 100 MB upload limit.");
            return;
          }
          setError("");
          setProgress(0);
          const body = new FormData();
          body.append("file", file);
          body.append("title", title);
          body.append("description", description);
          body.append("visibility", "private");
          const xhr = new XMLHttpRequest();
          request.current = xhr;
          xhr.open("POST", "/api/uploads");
          xhr.setRequestHeader("x-csrf-token", session.csrfToken);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable)
              setProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => {
            let result: any = {};
            try {
              result = JSON.parse(xhr.responseText);
            } catch {}
            if (xhr.status >= 200 && xhr.status < 300) {
              notify("Upload received. Processing will continue in Studio.");
              uploaded();
            } else {
              setError(result.error || "Upload failed. Please try again.");
              setProgress(null);
            }
          };
          xhr.onerror = () => {
            setError(
              "The connection was interrupted. Please try the upload again.",
            );
            setProgress(null);
          };
          xhr.onabort = () => setProgress(null);
          xhr.send(body);
        }}
      >
        <label className={`file-drop ${file ? "has-file" : ""}`}>
          <Upload size={30} />
          <strong>{file ? file.name : "Select your original video"}</strong>
          <span>MP4, WebM or MOV · up to 100 MB</span>
          <input
            required
            disabled={progress !== null}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f);
                if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
              }
            }}
          />
        </label>
        <label>
          Title
          <input
            required
            disabled={progress !== null}
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            disabled={progress !== null}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="notice-box">
          <ShieldCheck size={20} />
          <p>
            New uploads are private. Review the processed video in Studio before
            publishing. Only upload content you own or have permission to share.
          </p>
        </div>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {progress !== null && (
          <div className="upload-progress" role="status">
            <progress max={100} value={progress} />
            <span>
              {progress < 100
                ? `Uploading ${progress}%`
                : "Upload received. Validating video…"}
            </span>
          </div>
        )}
        <div className="form-actions">
          <button
            className="button primary"
            disabled={!file || !title.trim() || progress !== null}
          >
            {progress !== null ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <Upload size={16} />
            )}
            Upload privately
          </button>
        </div>
      </form>
    </Modal>
  );
}
function VideoEdit({
  video,
  close,
  saved,
}: {
  video: VideoItem;
  close: () => void;
  saved: () => void;
}) {
  const { api, notify } = useApp();
  const [title, setTitle] = useState(video.title),
    [description, setDescription] = useState(video.description),
    [visibility, setVisibility] = useState(video.visibility),
    [comments, setComments] = useState(
      (video as any).commentsEnabled !== false,
    );
  return (
    <Modal title="Video details" close={close}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api(`/api/videos/${video.id}`, {
              method: "PATCH",
              body: {
                title,
                description,
                visibility,
                commentsEnabled: comments,
              },
            });
            saved();
            close();
            notify("Video updated.");
          } catch (e: any) {
            notify(e.message);
          }
        }}
      >
        <label>
          Title
          <input
            required
            value={title}
            maxLength={150}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            maxLength={5000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label>
          Visibility
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="private">Private — only you</option>
            <option value="unlisted">Unlisted — anyone with the link</option>
            <option value="public">Public — visible in discovery</option>
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={comments}
            onChange={(e) => setComments(e.target.checked)}
          />
          Allow public comments
        </label>
        <div className="form-actions">
          <button className="button primary">Save changes</button>
        </div>
      </form>
    </Modal>
  );
}

function LeavesPage() {
  const { data, error, load } = useLoad("/api/leaves");
  const { session, signIn } = useApp();
  return (
    <div className="page social-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PUBLIC CONVERSATIONS</p>
          <h1>
            <Leaf size={25} />
            Leaves
          </h1>
        </div>
        <span className="muted small-text">Latest first</span>
      </div>
      <div className="social-layout">
        <section>
          {session.user ? (
            <LeafComposer posted={load} />
          ) : (
            <div className="signin-prompt">
              <Avatar name="L" small />
              <p>Share an update with your community.</p>
              <button className="button" onClick={signIn}>
                Sign in
              </button>
            </div>
          )}
          {error ? (
            <ErrorBox error={error} retry={load} />
          ) : !data ? (
            <Loading />
          ) : data.leaves.length ? (
            data.leaves
              .filter((l: any) => !l.parentId)
              .map((leaf: any) => (
                <LeafCard leaf={leaf} key={leaf.id} refresh={load} />
              ))
          ) : (
            <Empty icon={Leaf} title="No Leaves yet">
              Updates, ideas, and conversations from creators will appear here.
            </Empty>
          )}
        </section>
        <aside className="social-aside">
          <Leaf size={25} />
          <h2>A public place to catch up.</h2>
          <p>Share a thought, link a Leafster video, or reply to a creator.</p>
          <div className="aside-rule" />
          <ShieldCheck size={20} />
          <h3>Keep conversations safe</h3>
          <p>
            Leaves are public. Avoid posting personal contact details. Report
            abuse or block an account at any time.
          </p>
          <Link className="text-button" to="/policies/safety">
            Read the community guidelines
            <ChevronRight size={14} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
function LeafComposer({
  posted,
  parentId,
}: {
  posted: () => void;
  parentId?: string;
}) {
  const { api, notify, session } = useApp();
  const [body, setBody] = useState(""),
    [videoId, setVideoId] = useState(""),
    [attach, setAttach] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="leaf-composer"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api("/api/leaves", {
            method: "POST",
            body: { body, videoId: videoId || undefined, parentId },
          });
          setBody("");
          setVideoId("");
          posted();
        } catch (e: any) {
          notify(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="composer-top">
        <Avatar name={session.user?.name} src={session.user?.avatar} small />
        <textarea
          required
          aria-label={parentId ? "Write a public reply" : "Write a Leaf"}
          value={body}
          maxLength={1000}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            parentId ? "Write a public reply…" : "What would you like to share?"
          }
        />
      </div>
      {attach && (
        <input
          className="attached-video-input"
          value={videoId}
          aria-label="Leafster video ID"
          onChange={(e) => setVideoId(e.target.value)}
          placeholder="Leafster video ID"
        />
      )}
      <div className="composer-bottom">
        <button
          type="button"
          className="text-button"
          onClick={() => setAttach(!attach)}
        >
          <Video size={17} />
          Link a video
        </button>
        <span className="muted small-text">{body.length}/1,000</span>
        <button className="button primary" disabled={!body.trim() || busy}>
          {busy ? <Loader2 className="spin" size={16} /> : <Leaf size={16} />}{" "}
          {parentId ? "Reply" : "Post a Leaf"}
        </button>
      </div>
    </form>
  );
}
function LeafCard({ leaf, refresh }: { leaf: any; refresh: () => void }) {
  const { session, requireAuth, api, notify } = useApp();
  const [reply, setReply] = useState(false),
    [report, setReport] = useState(false),
    [note, setNote] = useState(false),
    [save, setSave] = useState(false),
    [editing, setEditing] = useState(false),
    [body, setBody] = useState(leaf.body);
  const act = async (path: string, method = "POST", payload: any = {}) => {
    if (!requireAuth()) return;
    try {
      await api(path, { method, body: payload });
      refresh();
    } catch (e: any) {
      notify(e.message);
    }
  };
  return (
    <article className="leaf-card">
      <div className="leaf-heading">
        <Link to={`/channel/${leaf.author.handle}`}>
          <Avatar name={leaf.author.name} src={leaf.author.avatar} small />
          <div>
            <strong>{leaf.author.name}</strong>
            <span>
              @{leaf.author.handle} · {relative(leaf.createdAt)}
            </span>
          </div>
        </Link>
        <details className="content-menu">
          <summary aria-label="Leaf actions">
            <Ellipsis size={20} />
          </summary>
          <div>
            <button onClick={() => requireAuth() && setReport(true)}>
              <Flag size={15} />
              Report Leaf
            </button>
            <button onClick={() => requireAuth() && setNote(true)}>
              <ShieldCheck size={15} />
              Add context
            </button>
            <button
              onClick={() =>
                act("/api/blocks", "POST", { userId: leaf.author.id })
              }
            >
              <Users size={15} />
              Block account
            </button>
            {session.user?.id === leaf.author.id && (
              <>
                <button onClick={() => setEditing(!editing)}>Edit Leaf</button>
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm("Delete this Leaf?"))
                      void act(`/api/leaves/${leaf.id}`, "DELETE");
                  }}
                >
                  Delete Leaf
                </button>
              </>
            )}
          </div>
        </details>
      </div>
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void act(`/api/leaves/${leaf.id}`, "PATCH", { body });
            setEditing(false);
          }}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
          />
          <button className="button">Save edit</button>
        </form>
      ) : (
        <p className="leaf-body">{leaf.body}</p>
      )}
      {leaf.videoId && (
        <Link className="linked-video" to={`/watch/${leaf.videoId}`}>
          <Video size={22} />
          <span>Watch the linked Leafster video</span>
          <ChevronRight size={16} />
        </Link>
      )}
      <div className="leaf-actions">
        <button
          aria-label="Reply to Leaf"
          onClick={() => requireAuth() && setReply(!reply)}
        >
          <MessageCircle size={17} />
          {leaf.replies?.length || 0}
        </button>
        <button
          aria-label="Repost Leaf"
          className={leaf.reposted ? "chosen" : ""}
          onClick={() => act(`/api/leaves/${leaf.id}/repost`)}
        >
          <ArrowRight size={17} />
          {leaf.reposts || 0}
        </button>
        <button
          aria-label="Like Leaf"
          className={leaf.liked ? "chosen" : ""}
          onClick={() => act(`/api/leaves/${leaf.id}/like`)}
        >
          <ThumbsUp size={17} />
          {leaf.likes || 0}
        </button>
        <button
          aria-label="Bookmark Leaf"
          onClick={() => requireAuth() && setSave(true)}
        >
          <Bookmark size={17} />
        </button>
      </div>
      {reply && (
        <div className="leaf-replies">
          <LeafComposer parentId={leaf.id} posted={refresh} />
          {leaf.replies?.map((r: any) => (
            <div className="leaf-reply" key={r.id}>
              <Avatar name={r.author.name} src={r.author.avatar} small />
              <div>
                <strong>{r.author.name}</strong>
                <p>{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {report && (
        <Report
          target={{ targetType: "leaf", targetId: leaf.id }}
          close={() => setReport(false)}
        />
      )}{" "}
      {note && (
        <NoteForm
          target={{ targetType: "leaf", targetId: leaf.id }}
          close={() => setNote(false)}
        />
      )}{" "}
      {save && <SaveDialog leafId={leaf.id} close={() => setSave(false)} />}
    </article>
  );
}

function StoriesPage() {
  const { data, error, load } = useLoad("/api/stories");
  const { requireAuth } = useApp();
  const [create, setCreate] = useState(false),
    [view, setView] = useState<any>(null);
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SMALL MOMENTS FROM CREATORS</p>
          <h1>Stories</h1>
        </div>
        <button
          className="button primary"
          onClick={() => requireAuth() && setCreate(true)}
        >
          <Plus size={17} />
          Add a Story
        </button>
      </div>
      <p className="page-description">
        Images and short clips, available for 24 hours. Open a Story at your own
        pace.
      </p>
      {error ? (
        <ErrorBox error={error} retry={load} />
      ) : !data ? (
        <Loading />
      ) : data.stories.length ? (
        <div className="story-grid">
          {data.stories.map((s: any) => (
            <button
              className="story-card"
              key={s.id}
              onClick={() => setView(s)}
            >
              {s.kind === "image" ? (
                <img src={s.mediaUrl} alt={s.caption || "Creator Story"} />
              ) : (
                <video src={s.mediaUrl} preload="metadata" muted />
              )}
              <span>
                <Avatar name={s.author.name} src={s.author.avatar} small />
                <strong>{s.author.name}</strong>
                <small>{relative(s.createdAt)}</small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <Empty icon={Clock3} title="No active Stories">
          Stories from creators will appear here and expire after 24 hours.
        </Empty>
      )}
      <div className="story-safety">
        <ShieldCheck size={18} />
        <p>
          Stories have no private replies. Use reporting and blocking controls
          if something feels wrong.
        </p>
      </div>
      {create && (
        <StoryUpload
          close={() => setCreate(false)}
          uploaded={() => {
            setCreate(false);
            load();
          }}
        />
      )}
      {view && (
        <StoryView story={view} close={() => setView(null)} refresh={load} />
      )}
    </div>
  );
}
function ChannelStories({ userId }: { userId: string }) {
  const { data, error } = useLoad("/api/stories");
  const [view, setView] = useState<any>(null);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const list = data.stories.filter((s: any) => s.author.id === userId);
  return (
    <>
      {list.length ? (
        <div className="story-grid">
          {list.map((s: any) => (
            <button
              className="story-card"
              key={s.id}
              onClick={() => setView(s)}
            >
              {s.kind === "image" ? (
                <img src={s.mediaUrl} alt={s.caption || "Story"} />
              ) : (
                <video src={s.mediaUrl} preload="metadata" />
              )}
              <span>{s.caption || "Story"}</span>
            </button>
          ))}
        </div>
      ) : (
        <Empty icon={Clock3} title="No active Stories">
          This creator has no Stories available right now.
        </Empty>
      )}
      {view && (
        <StoryView
          story={view}
          close={() => setView(null)}
          refresh={() => {}}
        />
      )}
    </>
  );
}
function StoryUpload({
  close,
  uploaded,
}: {
  close: () => void;
  uploaded: () => void;
}) {
  const { api, notify } = useApp();
  const [file, setFile] = useState<File | null>(null),
    [caption, setCaption] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title="Add a Story" close={close}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!file) return;
          setBusy(true);
          const form = new FormData();
          form.append("file", file);
          form.append("caption", caption);
          try {
            await api("/api/stories", { method: "POST", body: form });
            uploaded();
            notify("Story published for 24 hours.");
          } catch (e: any) {
            notify(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="file-drop">
          <Image size={27} />
          <strong>{file?.name || "Choose an image or short clip"}</strong>
          <span>Image or video up to 30 seconds</span>
          <input
            required
            type="file"
            accept="image/jpeg,image/png,video/mp4,video/webm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <label>
          Caption & accessible description
          <textarea
            required
            value={caption}
            maxLength={300}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe the moment for everyone…"
          />
        </label>
        <p className="form-note">
          Your Story is public and expires after 24 hours. Publishing does not
          open private replies.
        </p>
        <div className="form-actions">
          <button disabled={busy || !file} className="button primary">
            {busy ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
            Publish Story
          </button>
        </div>
      </form>
    </Modal>
  );
}
function StoryView({
  story,
  close,
  refresh,
}: {
  story: any;
  close: () => void;
  refresh: () => void;
}) {
  const { api, session, notify, requireAuth } = useApp();
  const [report, setReport] = useState(false),
    [note, setNote] = useState(false);
  return (
    <Modal title={`${story.author.name}’s Story`} close={close}>
      <div className="story-view">
        {story.kind === "image" ? (
          <img src={story.mediaUrl} alt={story.caption} />
        ) : (
          <video src={story.mediaUrl} controls playsInline preload="metadata" />
        )}
        <p>{story.caption}</p>
      </div>
      <p className="form-note">
        Expires {new Date(story.expiresAt).toLocaleString("en-IE")}
      </p>
      <div className="form-actions">
        <button
          className="text-button"
          onClick={() => requireAuth() && setNote(true)}
        >
          <ShieldCheck size={16} />
          Add context
        </button>
        <button
          className="text-button"
          onClick={() => requireAuth() && setReport(true)}
        >
          <Flag size={16} />
          Report
        </button>
        {session.user?.id === story.author.id && (
          <button
            className="text-button danger"
            onClick={async () => {
              try {
                await api(`/api/stories/${story.id}`, {
                  method: "DELETE",
                  body: {},
                });
                refresh();
                close();
                notify("Story deleted.");
              } catch (e: any) {
                notify(e.message);
              }
            }}
          >
            Delete
          </button>
        )}
      </div>
      {report && (
        <Report
          target={{ targetType: "story", targetId: story.id }}
          close={() => setReport(false)}
        />
      )}{" "}
      {note && (
        <NoteForm
          target={{ targetType: "story", targetId: story.id }}
          close={() => setNote(false)}
        />
      )}
    </Modal>
  );
}

function Library({ kind }: { kind: string }) {
  return (
    <AuthRequired>
      <LibraryContent kind={kind} />
    </AuthRequired>
  );
}
function LibraryContent({ kind }: { kind: string }) {
  const { api, notify } = useApp();
  const title =
    kind === "history"
      ? "Watch history"
      : kind === "liked"
        ? "Liked Videos"
        : "Watch Later";
  const { data, error, load } = useLoad(
    kind === "history"
      ? "/api/history"
      : kind === "liked"
        ? "/api/videos?feed=liked"
        : "/api/playlists",
  );
  const [videos, setVideos] = useState<VideoItem[] | null>(null);
  useEffect(() => {
    if (kind !== "watch-later" || !data) return;
    const list = data.playlists?.find((p: any) => p.title === "Watch Later");
    if (!list) {
      setVideos([]);
      return;
    }
    api(`/api/playlists/${list.id}`)
      .then((d) => setVideos(d.videos || []))
      .catch((e) => notify(e.message));
  }, [kind, data, api, notify]);
  const list = kind === "watch-later" ? videos : data?.videos;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR LIBRARY</p>
          <h1>{title}</h1>
        </div>
        {kind === "history" && (
          <button
            className="button"
            onClick={async () => {
              if (!confirm("Clear all watch history and saved progress?"))
                return;
              try {
                await api("/api/history", { method: "DELETE", body: {} });
                await load();
                notify("Watch history cleared.");
              } catch (e: any) {
                notify(e.message);
              }
            }}
          >
            <Trash2 size={16} />
            Clear history
          </button>
        )}
      </div>
      {error ? (
        <ErrorBox error={error} retry={load} />
      ) : !list ? (
        <Loading />
      ) : list.length ? (
        <Grid videos={list} />
      ) : (
        <Empty
          icon={
            kind === "history"
              ? History
              : kind === "liked"
                ? ThumbsUp
                : Bookmark
          }
          title={
            kind === "history"
              ? "Your history is empty"
              : kind === "liked"
                ? "No liked videos yet"
                : "Nothing saved for later"
          }
        >
          {kind === "watch-later"
            ? "Create a private collection called “Watch Later” and save videos to it."
            : kind === "history"
              ? "Videos you watch with history enabled appear here."
              : "Videos you like will appear here."}
        </Empty>
      )}
    </div>
  );
}
function Playlists() {
  return (
    <AuthRequired>
      <PlaylistsContent />
    </AuthRequired>
  );
}
function PlaylistsContent() {
  const { data, error, load } = useLoad("/api/playlists");
  const { api, notify } = useApp();
  const [create, setCreate] = useState(false),
    [title, setTitle] = useState(""),
    [visibility, setVisibility] = useState("private"),
    [chosen, setChosen] = useState<any>(null);
  const open = async (id: string) => {
    try {
      setChosen(await api(`/api/playlists/${id}`));
    } catch (e: any) {
      notify(e.message);
    }
  };
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">LEAFSTER COLLECTIONS</p>
          <h1>Playlists & collections</h1>
        </div>
        <button className="button primary" onClick={() => setCreate(true)}>
          <FolderPlus size={17} />
          New collection
        </button>
      </div>
      <p className="page-description">
        Keep videos and Leaves together. Private by default, public when you
        choose.
      </p>
      {error ? (
        <ErrorBox error={error} retry={load} />
      ) : !data ? (
        <Loading />
      ) : data.playlists.length ? (
        <div className="collections-grid">
          {data.playlists.map((p: any) => (
            <article className="collection-card" key={p.id}>
              <button className="collection-cover" onClick={() => open(p.id)}>
                <ListVideo size={38} strokeWidth={1.2} />
                <span>{p.itemCount} items</span>
              </button>
              <h2>
                <button onClick={() => open(p.id)}>{p.title}</button>
              </h2>
              <p>{p.visibility}</p>
              <button
                className="text-button danger"
                onClick={async () => {
                  if (
                    !confirm(
                      `Delete collection “${p.title}”? Saved content will not be deleted.`,
                    )
                  )
                    return;
                  try {
                    await api(`/api/playlists/${p.id}`, {
                      method: "DELETE",
                      body: {},
                    });
                    await load();
                  } catch (e: any) {
                    notify(e.message);
                  }
                }}
              >
                Delete collection
              </button>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          icon={ListVideo}
          title="A place for your favourites"
          action={
            <button
              className="button"
              onClick={() => {
                setTitle("Watch Later");
                setCreate(true);
              }}
            >
              Create Watch Later
            </button>
          }
        >
          Start a collection, then save videos and Leaves as you explore.
        </Empty>
      )}
      {create && (
        <Modal title="Create a collection" close={() => setCreate(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/api/playlists", {
                  method: "POST",
                  body: { title, visibility },
                });
                setTitle("");
                setCreate(false);
                load();
              } catch (e: any) {
                notify(e.message);
              }
            }}
          >
            <label>
              Name
              <input
                required
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              Visibility
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </label>
            <div className="form-actions">
              <button className="button primary">Create collection</button>
            </div>
          </form>
        </Modal>
      )}
      {chosen && (
        <Modal title={chosen.playlist.title} close={() => setChosen(null)}>
          {chosen.videos?.length ? (
            chosen.videos.map((v: VideoItem) => (
              <div key={v.id} onClick={() => setChosen(null)}>
                <VideoCard video={v} />
              </div>
            ))
          ) : (
            <p className="muted">No saved videos.</p>
          )}
          {chosen.leaves?.map((l: any) => (
            <LeafCard
              key={l.id}
              leaf={l}
              refresh={() => open(chosen.playlist.id)}
            />
          ))}
        </Modal>
      )}
    </div>
  );
}
function SettingsPage() {
  return (
    <AuthRequired>
      <SettingsContent />
    </AuthRequired>
  );
}
function SettingsContent() {
  const { data, error, load } = useLoad("/api/settings");
  const { api, notify, session, refresh } = useApp();
  const [tab, setTab] = useState("Privacy & playback"),
    [deleting, setDeleting] = useState(false),
    [confirmation, setConfirmation] = useState("");
  const navigate = useNavigate();
  const update = async (key: string, value: boolean) => {
    try {
      await api("/api/settings", { method: "PATCH", body: { [key]: value } });
      load();
      notify("Preference saved.");
    } catch (e: any) {
      notify(e.message);
    }
  };
  return (
    <div className="page settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR LEAFSTER</p>
          <h1>Settings</h1>
        </div>
      </div>
      <div className="settings-layout">
        <nav aria-label="Settings sections">
          {[
            "Privacy & playback",
            "Safety & blocking",
            "Connections",
            "Account & data",
          ].map((t) => (
            <button
              className={tab === t ? "selected" : ""}
              key={t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
        <section>
          {error ? (
            <ErrorBox error={error} retry={load} />
          ) : !data ? (
            <Loading />
          ) : tab === "Privacy & playback" ? (
            <>
              <h2>Privacy & playback</h2>
              <p className="muted">Choose how Leafster works for you.</p>
              <SettingToggle
                title="Save watch history"
                text="Remember watched videos and your playback position."
                value={data.settings.historyEnabled}
                change={(v) => update("historyEnabled", v)}
              />
              <SettingToggle
                title="Autoplay preference"
                text="Saved for future continuous playback support. Videos currently start only when you choose."
                value={data.settings.autoplay}
                change={(v) => update("autoplay", v)}
              />
              <SettingToggle
                title="New upload notifications"
                text="Receive in-app notifications from subscribed creators."
                value={data.settings.notifyUploads}
                change={(v) => update("notifyUploads", v)}
              />
              <div className="notice-box">
                <ShieldCheck size={20} />
                <p>
                  Leafster uses a light theme. No advertising trackers or
                  private messaging are included.
                </p>
              </div>
            </>
          ) : tab === "Safety & blocking" ? (
            <>
              <h2>Safety & blocking</h2>
              <p className="muted">
                Block an account from its channel or Leaf menu. Reports are
                confidential.
              </p>
              <h3>Blocked accounts</h3>
              {data.blocks?.length ? (
                data.blocks.map((b: any) => (
                  <div className="blocked-user" key={b.id || b.userId}>
                    <strong>{b.name || b.handle || b.userId}</strong>
                    <button
                      className="button"
                      onClick={async () => {
                        try {
                          await api(`/api/blocks/${b.id || b.userId}`, {
                            method: "DELETE",
                            body: {},
                          });
                          load();
                        } catch (e: any) {
                          notify(e.message);
                        }
                      }}
                    >
                      Unblock
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-inline">
                  You haven’t blocked any accounts.
                </p>
              )}
              <Link className="text-button" to="/policies/safety">
                Safety & community guidelines
                <ChevronRight size={15} />
              </Link>
              <h3>Appeal a moderation decision</h3>
              <AppealForm />
            </>
          ) : tab === "Connections" ? (
            <>
              <h2>Connections</h2>
              <div className="connection-row">
                <span className="google-g">G</span>
                <div>
                  <strong>Google</strong>
                  <p>
                    Used for secure sign-in. Leafster never receives your Google
                    password.
                  </p>
                </div>
                <span className="status-label ready">Connected</span>
              </div>
              <div className="connection-row">
                <Video size={25} />
                <div>
                  <strong>YouTube</strong>
                  <p>
                    Separate consent is required to connect a channel. This
                    integration is awaiting OAuth configuration.
                  </p>
                </div>
                <span className="status-label">Unavailable</span>
              </div>
              <p className="form-note">
                You can revoke Google access in your Google Account’s
                third-party connections settings.
              </p>
              <a
                className="text-button"
                href="https://myaccount.google.com/connections"
                target="_blank"
                rel="noreferrer"
              >
                Manage Google connections
                <ArrowRight size={15} />
              </a>
            </>
          ) : (
            <>
              <h2>Account & data</h2>
              <div className="account-identity">
                <Avatar name={session.user?.name} src={session.user?.avatar} />
                <div>
                  <strong>{session.user?.name}</strong>
                  <p>@{session.user?.handle}</p>
                </div>
              </div>
              <div className="settings-section">
                <h3>Export your data</h3>
                <p>
                  Download your profile and platform records as JSON. Uploaded
                  media remains available from your own content.
                </p>
                <button
                  className="button"
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/account/export");
                      if (!response.ok) throw new Error("Export failed.");
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = "leafster-account-export.json";
                      link.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    } catch (e: any) {
                      notify(e.message);
                    }
                  }}
                >
                  <Download size={17} />
                  Export account data
                </button>
              </div>
              <div className="settings-section danger-zone">
                <h3>Delete your account</h3>
                <p>
                  Permanently delete your account, channel, uploaded media, and
                  associated platform data. This cannot be undone.
                </p>
                <button
                  className="button danger"
                  onClick={() => setDeleting(true)}
                >
                  Delete account
                </button>
              </div>
            </>
          )}
        </section>
      </div>
      {deleting && (
        <Modal
          title="Permanently delete your account?"
          close={() => setDeleting(false)}
        >
          <p className="modal-intro">
            This will delete your channel, uploads, and account data. Download
            an export first if you need a copy.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/api/account", {
                  method: "DELETE",
                  body: { confirm: confirmation },
                });
                await refresh();
                setDeleting(false);
                navigate("/");
                notify("Your account has been deleted.");
              } catch (e: any) {
                notify(e.message);
              }
            }}
          >
            <label>
              Type DELETE to confirm
              <input
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
            <div className="form-actions">
              <button
                className="button danger"
                disabled={confirmation !== "DELETE"}
              >
                Delete permanently
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
function SettingToggle({
  title,
  text,
  value,
  change,
}: {
  title: string;
  text: string;
  value: boolean;
  change: (v: boolean) => void;
}) {
  return (
    <div className="setting-row">
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <button
        role="switch"
        aria-checked={!!value}
        aria-label={title}
        className={`toggle ${value ? "on" : ""}`}
        onClick={() => change(!value)}
      >
        <span />
      </button>
    </div>
  );
}
function AppealForm() {
  const { api, notify } = useApp();
  const [id, setId] = useState(""),
    [body, setBody] = useState("");
  return (
    <form
      className="appeal-form"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api("/api/appeals", {
            method: "POST",
            body: { actionId: id, body },
          });
          setId("");
          setBody("");
          notify("Appeal submitted for review.");
        } catch (e: any) {
          notify(e.message);
        }
      }}
    >
      <label>
        Moderation action ID
        <input required value={id} onChange={(e) => setId(e.target.value)} />
      </label>
      <label>
        Why should the decision be reviewed?
        <textarea
          required
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <button className="button">Submit appeal</button>
    </form>
  );
}
function Onboarding() {
  const { session, api, notify, refresh, signIn } = useApp();
  const [name, setName] = useState(session.user?.name || ""),
    [handle, setHandle] = useState(session.user?.handle || ""),
    [adult, setAdult] = useState(false),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  if (!session.user)
    return (
      <Empty
        icon={LogIn}
        title="Create your Leafster channel"
        action={
          <button className="button primary" onClick={signIn}>
            Continue with Google
          </button>
        }
      >
        Start with a securely connected Google account.
      </Empty>
    );
  if (session.user.onboarded)
    return (
      <Empty
        icon={Check}
        title="Your channel is ready"
        action={
          <Link
            className="button primary"
            to={`/channel/${session.user.handle}`}
          >
            Open your channel
          </Link>
        }
      >
        You can customise your channel and upload from Studio.
      </Empty>
    );
  return (
    <div className="onboarding">
      <p className="eyebrow">WELCOME TO LEAFSTER</p>
      <h1>Make your channel yours.</h1>
      <p>Choose a name and a unique handle for public interactions.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/api/onboarding", {
              method: "POST",
              body: { name, handle, adultConfirmed: adult },
            });
            await refresh();
            navigate(`/channel/${handle}`);
          } catch (e: any) {
            notify(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Channel name
          <input
            required
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Unique handle
          <div className="handle-input">
            <span>@</span>
            <input
              required
              value={handle}
              pattern="[a-z0-9_]{3,30}"
              minLength={3}
              maxLength={30}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
            />
          </div>
          <small>3–30 lowercase letters, numbers, or underscores.</small>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            required
            checked={adult}
            onChange={(e) => setAdult(e.target.checked)}
          />
          I confirm that I am at least 18 and have been approved as a staging
          tester.
        </label>
        <div className="notice-box">
          <ShieldCheck size={20} />
          <p>
            This self-declaration is not age verification. Access is restricted
            to an approved adult tester list while launch safeguards are
            prepared.
          </p>
        </div>
        <p className="form-note">
          By creating a channel, you agree to the draft{" "}
          <Link to="/policies/terms">Terms</Link> and{" "}
          <Link to="/policies/safety">Community guidelines</Link>.
        </p>
        <button className="button primary" disabled={busy || !adult}>
          {busy ? <Loader2 className="spin" size={17} /> : <Check size={17} />}
          Create channel
        </button>
      </form>
    </div>
  );
}
function Moderation() {
  const { session } = useApp();
  if (!session.user || !["admin", "moderator"].includes(session.user.role))
    return (
      <Empty icon={ShieldCheck} title="Restricted access">
        Moderation is available only to authorised moderators.
      </Empty>
    );
  return <ModerationContent />;
}
function ModerationContent() {
  const { data, error, load } = useLoad("/api/moderation");
  const { api, notify } = useApp();
  const [tab, setTab] = useState("Reports");
  const action = async (
    targetType: string,
    targetId: string,
    action: string,
  ) => {
    const reason = prompt("Record the reason for this moderation action:");
    if (!reason?.trim()) return;
    try {
      await api("/api/moderation/action", {
        method: "POST",
        body: { targetType, targetId, action, reason },
      });
      load();
      notify("Moderation action recorded.");
    } catch (e: any) {
      notify(e.message);
    }
  };
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">AUTHORISED TEAM ONLY</p>
          <h1>
            <ShieldCheck size={25} />
            Moderation
          </h1>
        </div>
      </div>
      <div className="studio-tabs">
        {["Reports", "Community Notes", "Audit log"].map((t) => (
          <button
            className={t === tab ? "selected" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {error ? (
        <ErrorBox error={error} retry={load} />
      ) : !data ? (
        <Loading />
      ) : tab === "Reports" ? (
        data.reports?.length ? (
          data.reports.map((r: any) => (
            <article className="moderation-card" key={r.id}>
              <span className="status-label">{r.status || "Pending"}</span>
              <h2>{r.reason}</h2>
              <p>{r.details}</p>
              <p className="muted small-text">
                {r.target_type} · {r.target_id}
              </p>
              {(r.contentPreview || r.content) && (
                <details className="moderation-review">
                  <summary>Review reported content</summary>
                  <blockquote>{r.contentPreview || r.content}</blockquote>
                  {r.mediaReviewUrl &&
                    (r.mediaKind === "image" ? (
                      <img
                        src={r.mediaReviewUrl}
                        alt="Reported Story image for moderation review"
                      />
                    ) : (
                      <video
                        controls
                        preload="metadata"
                        src={r.mediaReviewUrl}
                      />
                    ))}
                </details>
              )}
              {r.target_type === "video" && (
                <Link className="text-button" to={`/watch/${r.target_id}`}>
                  Open reported video
                  <ArrowRight size={14} />
                </Link>
              )}
              <div className="form-actions">
                {r.target_type !== "notice" && (
                  <button
                    className="button danger"
                    onClick={() =>
                      action(
                        r.target_type,
                        r.target_id,
                        r.target_type === "user" ? "suspend" : "remove",
                      )
                    }
                  >
                    {r.target_type === "user"
                      ? "Suspend account"
                      : "Remove content"}
                  </button>
                )}
                {r.target_type === "notice" && (
                  <span className="muted small-text">
                    Operator legal review required.
                  </span>
                )}
              </div>
            </article>
          ))
        ) : (
          <Empty icon={ShieldCheck} title="No reports in the queue">
            Submitted reports will appear here.
          </Empty>
        )
      ) : tab === "Community Notes" ? (
        data.notes?.length ? (
          data.notes.map((n: any) => (
            <article className="moderation-card" key={n.id}>
              <span className="status-label">{n.status}</span>
              <p>{n.body}</p>
              {n.sources?.map((s: string) => (
                <p key={s}>
                  <a href={s} rel="noreferrer" target="_blank">
                    {s}
                  </a>
                </p>
              ))}
              <p className="muted small-text">
                {n.targetType} · {n.targetId}
              </p>
              <div className="form-actions">
                <button
                  className="button"
                  onClick={() => action("note", n.id, "reject_note")}
                >
                  Reject with reason
                </button>
                <button
                  className="button primary"
                  onClick={() => action("note", n.id, "accept_note")}
                >
                  Accept after review
                </button>
              </div>
            </article>
          ))
        ) : (
          <Empty icon={MessageCircle} title="No notes awaiting review">
            Source verification and moderator judgement are required.
          </Empty>
        )
      ) : (
        <div className="audit-list">
          {data.actions?.length ? (
            data.actions.map((a: any) => (
              <article key={a.id}>
                <strong>{a.action}</strong>
                <p>{a.reason}</p>
                <small>
                  {a.target_type} · {a.target_id} ·{" "}
                  {new Date(a.created_at).toLocaleString("en-IE")}
                </small>
              </article>
            ))
          ) : (
            <p className="muted">No moderation actions recorded.</p>
          )}
        </div>
      )}
    </div>
  );
}
function Policies() {
  const { kind } = useParams();
  const safety = kind === "safety",
    privacy = kind === "privacy";
  return (
    <article className="policy page">
      <p className="eyebrow">RESTRICTED STAGING · DRAFT POLICY</p>
      <h1>
        {safety
          ? "Safety & community guidelines"
          : privacy
            ? "Privacy notice"
            : "Terms of use"}
      </h1>
      <p className="policy-status">
        Draft for approved adult testers. Legal and operational review is
        required before a public launch.
      </p>
      {safety ? (
        <>
          <h2>Public interactions, clear boundaries</h2>
          <p>
            Leafster has no private messages, calls, private story replies, or
            contact-finding tools. Comments, Leaves, and Stories are public. Do
            not post private contact information or encourage unwanted private
            contact.
          </p>
          <h2>What is prohibited</h2>
          <p>
            Child sexual exploitation, grooming, threats, harassment, hate,
            coercion, scams, and non-consensual sexual content are prohibited.
            Do not share private information, impersonate people, or evade
            account sanctions.
          </p>
          <h2>Report and block</h2>
          <p>
            Use the Report control on a video, comment, Leaf, or Story. Reports
            are confidential and accessible only to authorised moderators.
            Blocking limits interactions and hides blocked accounts from
            supported feeds. Reports are reviewed by people; emergencies require
            appropriate emergency services.
          </p>
          <h2>Community Notes</h2>
          <p>
            Notes provide sourced context without changing the creator’s
            content. New accounts have limited rating access. Moderators review
            sources and abuse concerns before accepting a note. Majority voting
            alone does not establish truth.
          </p>
          <h2>Moderation and appeals</h2>
          <p>
            Moderators can remove content or suspend accounts, record reasons,
            and review appeals. Use Settings to appeal a decision using its
            action ID. Moderation staffing, escalation procedures, child-safety
            reporting arrangements, and launch age-assurance controls remain
            required before public access.
          </p>
        </>
      ) : privacy ? (
        <>
          <h2>Who operates this service</h2>
          <p>
            Leafster is a EuroLoot project. The legal controller’s identity,
            contact address, retention schedule, and processor arrangements must
            be confirmed before public launch. No incorporated or nonprofit
            status is asserted.
          </p>
          <h2>Information used</h2>
          <p>
            Google Sign-In supplies a basic identity identifier, name, email,
            and profile image to the server. Leafster stores your chosen channel
            profile, uploads, public posts, engagement, optional watch progress,
            reports, and moderation records. Google passwords are never
            requested or stored.
          </p>
          <h2>Purpose and visibility</h2>
          <p>
            Account data supports sign-in and operation of the service.
            Published content and channel profiles are public within the staging
            audience; private videos and collections are accessible only to
            their owner. Reports and enforcement details are restricted to
            authorised staff.
          </p>
          <h2>Your choices</h2>
          <p>
            Disable watch history in Settings, clear history, export account
            records, or delete your account. Deletion removes active account
            data and uploaded files; backup retention and any lawful
            preservation process require a defined operational policy before
            launch.
          </p>
          <h2>Cookies and tracking</h2>
          <p>
            Essential cookies maintain secure sessions and request protection.
            No advertising trackers or location profiling are included. Uploaded
            content is stored on the configured application infrastructure.
            Processor locations and international transfer safeguards require
            review for the chosen hosting setup.
          </p>
          <h2>Your rights</h2>
          <p>
            Applicable data-protection rights may include access, correction,
            erasure, restriction, portability, objection, and a complaint to
            Ireland’s Data Protection Commission. Controller contact details,
            lawful bases, and response procedures must be finalised before
            production.
          </p>
        </>
      ) : (
        <>
          <h2>Access and eligibility</h2>
          <p>
            This build is a restricted service for approved testers aged 18 or
            over. Public registration is closed. Google Sign-In does not verify
            age.
          </p>
          <h2>Your content remains yours</h2>
          <p>
            You retain rights in original uploads. By publishing, you permit
            Leafster to store, process, display, and deliver the content for the
            operation of the service, subject to the final hosting licence and
            applicable law.
          </p>
          <h2>Upload responsibly</h2>
          <p>
            Only upload content you own or are authorised to share. Do not
            upload illegal material or violate the community guidelines. Do not
            use Leafster to download content from YouTube. Upload and storage
            quotas apply.
          </p>
          <h2>Copyright concerns</h2>
          <p>
            Use the public notice form to identify content and provide evidence
            of rights and the specific alleged infringement. The form is
            available without signing in. Do not include unnecessary personal
            information in public content. A designated legal contact, notice
            and counter-notice procedure, and retention rules must be
            established before public launch.
          </p>
          <h2>Availability</h2>
          <p>
            Staging is provided for testing, may have defects, and has no
            availability guarantee. Export important original files yourself. No
            payments or mandatory donations are collected.
          </p>
          <h2>Before public launch</h2>
          <p>
            These draft terms require legal review for Irish and EU
            requirements, including the Digital Services Act, data protection,
            copyright processes, accessibility, and age-appropriate access.
          </p>
        </>
      )}
      <div className="policy-links">
        <Link to="/policies/privacy">Privacy</Link>
        <Link to="/policies/terms">Terms</Link>
        <Link to="/policies/safety">Safety</Link>
        <Link to="/notices">Report illegal content</Link>
      </div>
    </article>
  );
}

function LegalNotice() {
  const { api } = useApp();
  const [category, setCategory] = useState("copyright"),
    [url, setUrl] = useState(""),
    [reason, setReason] = useState(""),
    [contact, setContact] = useState(""),
    [goodFaith, setGoodFaith] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState("");
  return (
    <section className="page public-notice-form">
      <p className="eyebrow">CONFIDENTIAL OPERATOR REVIEW</p>
      <h1>Report illegal content</h1>
      <p className="modal-intro">
        Submit a copyright, illegal-content, or child-safety notice without
        creating an account. The details you provide are kept in the restricted
        operator review queue.
      </p>
      {receipt ? (
        <div className="notice-receipt" role="status">
          <ShieldCheck size={27} />
          <h2>Your notice has been recorded</h2>
          <p>
            Reference: <code>{receipt}</code>
          </p>
          <p>
            Save this reference for your records. Submission records a notice;
            it does not mean a legal decision has been made.
          </p>
          <button
            className="button"
            onClick={() => {
              setReceipt("");
              setReason("");
              setUrl("");
              setGoodFaith(false);
            }}
          >
            Submit another notice
          </button>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
              const result = await api("/api/legal/notices", {
                method: "POST",
                body: { category, url, reason, contact, goodFaith },
              });
              setReceipt(result.id);
            } catch (e: any) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Type of concern
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="copyright">Copyright infringement</option>
              <option value="illegal-content">Other illegal content</option>
              <option value="child-safety">Child-safety concern</option>
            </select>
          </label>
          <label>
            Leafster content URL
            <input
              required
              type="url"
              maxLength={2048}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <label>
            Explain the concern
            <textarea
              required
              minLength={10}
              maxLength={4000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Identify the content and explain why you believe it infringes your rights or is unlawful. For copyright concerns, describe your rights and the original work."
            />
          </label>
          <label>
            Contact email <span className="muted">Optional</span>
            <input
              type="email"
              maxLength={254}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              autoComplete="email"
            />
            <small>
              Include this only if you want to provide a way for the operator to
              contact you.
            </small>
          </label>
          <label className="check-label">
            <input
              required
              type="checkbox"
              checked={goodFaith}
              onChange={(e) => setGoodFaith(e.target.checked)}
            />
            I confirm that this notice is accurate to the best of my knowledge
            and submitted in good faith.
          </label>
          <p className="form-note">
            Include only information needed to review the concern. Details are
            not published. This staging build still requires a designated legal
            contact, staffed review arrangements, and final legal procedures
            before public launch.
          </p>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="button primary" disabled={busy || !goodFaith}>
              {busy ? (
                <Loader2 className="spin" size={16} />
              ) : (
                <Flag size={16} />
              )}
              Submit notice
            </button>
          </div>
        </form>
      )}
      <div className="policy-links">
        <Link to="/policies/privacy">Privacy notice</Link>
        <Link to="/policies/terms">Draft terms</Link>
      </div>
    </section>
  );
}
