# Architecture and boundaries

## Executable system

React + TypeScript with Vite serves the light-only interface. The browser calls same-origin `/api` routes. Express 5 owns authorisation, validation, OAuth state, sessions and all database access. Node 24's SQLite implementation stores records with foreign keys, unique constraints, indexes and WAL. `migrations/001-initial.sql` is the executable baseline, applied idempotently on boot. This is not a Supabase/PostgreSQL migration and no remote RLS policies are deployed: the database is a private server file with no client-facing SQL/Data API. It must not be exposed or put in the static folder.

Google uses the official OAuth library, authorisation-code exchange, PKCE, nonce/state and validated identity tokens. Only basic OpenID identity scopes are requested. Hashed opaque sessions use HttpOnly, SameSite cookies, Secure in production and per-session CSRF tokens. The empty allowlist denies new sign-ins. Google credentials and live OAuth verification remain external setup requirements.

Users complete a unique handle and adult-staging declaration; a channel is created transactionally. This declaration is not verified age assurance and does not permit public registration. Roles are server-controlled database values, never request metadata. No public signup, password form or private messaging is offered.

Video uploads go to private temporary disk, validated by file signatures and FFprobe. Bounded background processing invokes FFmpeg as a separate executable, creates one fast-start H.264/AAC MP4 (up to 720p) and a thumbnail, then releases the original. The database keeps processing state and duplicate SHA-256. Failed jobs can be retried within limits; interrupted jobs are requeued on restart. This is a serialized local worker, not a distributed queue or adaptive streaming service. Sources are not permanent backups. The file endpoint authorises each request and Express handles HTTP byte ranges for actual seeking.

All public counts are queries on Leafster records. Views/watch time are bounded authenticated client-reported playback signals, not independently verified audience measurement. No anonymous view fingerprinting, advertising pixels or fabricated seed activity. Recommendations currently use explicit basic feed ordering; no ML ranking or concealed personalisation. Richer analytics/retention/geography are not implemented.

Public interactions include video reactions and comments, channel subscriptions, text Leaves and replies, collections, and short-lived image/video Stories. Public video discovery, search, video profiles, thumbnails and playback now allow anonymous reads; private/removed/suspended media remain protected. Publishing, community features and personal tools require an approved completed account. Blocks apply to signed-in viewing; public viewing while signed out does not inherit an account’s blocks. Public policies and confidential legal notices remain accessible without an account. Private video/collection ownership is checked server-side. Story visibility expires server-side after 24 hours, with periodic local-file cleanup; this is not a promise to erase screenshots, recipients' copies or future backups instantly.

Reports and legal notices are confidential. Moderator/admin roles can review reports/notes, remove content and suspend ordinary accounts, with an audit trail. Community Note ratings are age-of-account gated and cannot automatically publish a note; human review is required. No claim of a mature cross-viewpoint reputation algorithm or reliable automated grooming detection is made.

## Staging host requirements

Use one persistent process/volume and a reverse proxy with HTTPS. The default listener is loopback. Raw media lives outside the web root. Run with a dedicated OS user, restrictive directory permissions, resource bounds, encrypted disks/backups and monitored disk headroom. Restrict the entire staging origin at the host/proxy in addition to the application allowlist. `NODE_ENV=production` requires HTTPS origin and refuses the test-auth flag. The isolated test-login endpoint exists only with both test flags; it is never a Google substitute.

Multiple replicas cannot safely share this local queue/volume. Do not deploy this server unchanged to ephemeral serverless storage. Do not claim that a frontend-only Vercel build includes persistence, encoding or authentication.

## Next architecture stage

Introduce repository interfaces with PostgreSQL migrations + tested RLS, private object storage with expiring media authorisation, a durable bounded encoding queue, resumable direct upload sessions, idempotent processing callbacks and HLS quality variants. Add moderation evidence retention separate from ordinary expiry; reliable notification delivery; aggregate daily analytics; structured redacted logs; backups/restore drills; retention purge jobs; anti-spam and coordinated-abuse review signals. Account deletion must extend to every future processor and backup policy.

A separately consented YouTube connection should use narrowly justified read-only scopes, encrypted revocable tokens, channel selection/ownership verification and API metadata refresh/deletion rules. Import creators' original/exported files through a batch manifest with checksums, duplicate detection, private draft matching and explicit publish confirmation. No YouTube downloader, OAuth YouTube scopes or pretend transfer is implemented. The settings screen describes the unavailable integration honestly.

## Scope discipline

The status matrix and test report distinguish operational local features from partial and unavailable ones. Production suitability requires operational safety staffing, lawful notices, age assurance, security review, load testing, recovery exercises and a verified EuroLoot deployment—not just a passing build.
