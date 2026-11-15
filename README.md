# Leafster

An original video-sharing and public community platform for the EuroLoot project. This repository contains a **working, restricted local implementation**, not a completed public production service. Source remains private and proprietary.

## Run it

Use Node 24 or newer. From this directory:

```sh
npm ci
cp .env.example .env
npm run dev
```

Open `http://127.0.0.1:5173`. Configure the owner-controlled Google OAuth web client and approved adult tester emails in `.env` to sign in. The catalogue starts empty. Credentials are not included; sign-in honestly reports unavailable without them. Never use test identities as evidence of working Google authentication.

```sh
npm run build
npm test
npm start
```

The compiled application serves on loopback port 3001. For single-origin local built-app use, set APP_ORIGIN=http://127.0.0.1:3001. Normal development uses the Vite proxy on port 5173. Real production must use an approved HTTPS origin. Data lives under `data/` unless configured otherwise, and must persist across restarts.

## Working foundation

- White/orange responsive interface with the existing Leafster logo, compact navigation, search and distinct feed choices.
- Server-side Google OIDC implementation, invitation allowlist, unique handles/channels, hashed sessions, CSRF protection and server-enforced roles.
- Real private video upload, signature/probe validation, duplicate detection, bounded FFmpeg processing, thumbnails, MP4 playback/byte ranges and creator publishing controls.
- Persistent subscriptions, reactions, public comments/replies, watch progress, private/public collections, text Leaves and image/short-video Stories.
- Studio content management and actual platform-record metrics; reports, blocking, moderation audit trails, sourced pending Community Notes, account export and deletion.

The implementation is a single-host pilot using React, TypeScript, Express, SQLite and private disk. It has no live Supabase adapter or deployed RLS, no adaptive encoding service, and no distributed worker. See the status matrix for exact API/UI boundaries and absent advanced features.

## Verified and blocked

Production builds and isolated API/security tests pass. Browser QA exercised actual local screens and decoded media playback; the detailed report distinguishes API upload testing from the browser extension's blocked file picker.

The private repository is [EuroLoot-LTD/Leafster](https://github.com/EuroLoot-LTD/Leafster). No hosted deployment is claimed. The visible cloud accounts were unrelated to EuroLoot and were not changed. Live Google sign-in requires project credentials. Public registration stays closed pending age-assurance, legal, security and moderation readiness. No paid service, domain, payment collection or public source release was enabled.

## Read before operating

| Document | Purpose |
| --- | --- |
| [Feature status](docs/FEATURE-STATUS.md) | Implemented, partial and unavailable scope |
| [Test report](docs/TEST-REPORT.md) | Actual checks, fixes and verification limits |
| [Architecture](docs/ARCHITECTURE.md) | Data flow, safety boundaries and scaling plan |
| [Deployment](docs/DEPLOYMENT.md) | Local setup, OAuth and restricted hosting runbook |
| [API contract](API-CONTRACT.md) | Request/response fields and quotas |
| [Reference research](docs/REFERENCE-RESEARCH.md) | Historical interface and SlopTube research |
| [Costs](docs/INFRASTRUCTURE-COSTS.md) | Current free tiers and 100–100,000-user models |
| [Privacy and safety](docs/PRIVACY-AND-SAFETY.md) | Irish/EU research and launch obligations |
| [Policy drafts](docs/POLICY-DRAFTS.md) | Unpublished drafts requiring legal review |
| [Third party record](docs/THIRD-PARTY.md) | Originality, logo provenance and FFmpeg obligations |

No default administrator or public password login exists. The isolated test route is available only when both NODE_ENV=test and LEAFSTER_TEST_AUTH=true; production rejects that flag. Do not expose test servers or publish their fixture accounts. Original media fixtures and browser test databases are outside this repository.

Leafster · A EuroLoot project. This attribution makes no claim about incorporation or nonprofit registration.
