# Deployment runbook — restricted staging only

## Verified access as of 15 November 2026

The requested EuroLoot-LTD organisation exists. The local GitHub CLI reports active administrator membership, and `EuroLoot-LTD/Leafster` was created and verified private. The GitHub connector itself exposes only the personal installation; CLI authorisation was used to create the organisation repository. No personal repository was created.

The visible Vercel team is personal and the visible Supabase organisation is Rook with unrelated projects. They were inspected read-only and not modified. No verified EuroLoot cloud host or Google OAuth web-client credentials were available. No hosted URL, remote database, bucket, OAuth consent change, paid plan, domain purchase, public registration or live deployment is claimed. A later Pages activation attempt from a compiled-assets-only private gh-pages branch was explicitly rejected by GitHub with HTTP422 because of the current plan; see PAGES-READINESS.md.

## Locally reproduce

Requirements: Node 24+, npm, macOS/Linux/Windows compatible FFmpeg/FFprobe; first install needs network for locked packages and convenience development media binaries.

```
npm ci
cp .env.example .env
npm run dev
```

Open `http://127.0.0.1:5173`. The API binds loopback on port 3001. Set `APP_ORIGIN` exactly to the browser origin; localhost and 127.0.0.1 are different. No populated catalogue is seeded. Add real original uploads after configuring Google; automated tests use isolated generated media and fixture identities instead.

```
npm run build
npm test
npm start
```

`npm start` serves the compiled API and built frontend at port 3001. For a single-origin local production-build check, set `APP_ORIGIN=http://127.0.0.1:3001` while keeping NODE_ENV development; real production requires HTTPS. Keep the data directory across restarts. Back up SQLite with its supported backup mechanism or stop the app and copy the complete consistent database with media; copying an actively written .sqlite file alone can lose WAL transactions.

## Configure real Google Sign-In

Use an owner-controlled EuroLoot Google Cloud project and official Web application OAuth client. The owner must configure consent/terms, permitted testers and project credentials directly; never send secrets through chat or commit them. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_ORIGIN` and the exact approved email allowlist. Local callback is `http://127.0.0.1:5173/api/auth/callback`; restricted hosted callback is `https://<approved-host>/api/auth/callback`. Scopes are openid, email, profile only. No YouTube grant is required or requested. Configure correct OAuth redirect URL before sign-in; test allowlisted success, denial, cancel, expired state, repeat callback, session rotation, sign-out and token revocation using actual Google accounts. These live checks were blocked by missing credentials, not passed by test identities.

## Host prerequisite and approval

Choose a EuroLoot-authorised persistent host with an EU data location, signed processor terms, off-host backups and a restricted HTTPS staging origin. Obtain approval for any cost or binding agreement. Do not deploy to the visible unrelated personal Vercel team or Rook Supabase projects. Do not enable public registration or a publicly accessible production launch without the owner's explicit approval and the safety gates in PRIVACY-AND-SAFETY.md.

Provision bounded persistent disk for `LEAFSTER_DATA_DIR`; run as a dedicated non-root user. Supply maintained external executables with `FFMPEG_PATH` and `FFPROBE_PATH`; development binary packages are omitted by production dependency installation. Set NODE_ENV=production, HTTPS APP_ORIGIN, HOST only as needed behind the approved proxy, and LEAFSTER_TEST_AUTH=false (or omit). Use `npm ci`, `npm run build`, then production dependencies and `npm start`. Source/binary redistribution must undergo THIRD-PARTY.md review before publishing any container image. A Docker image was not published.

Restrict the origin in hosting controls; application allowlisting now protects all member content and media, while policies and legal notices remain public. Configure TLS, secure secret injection, process restarts, upload/body timeouts, request and disk limits, resource isolation for FFmpeg, daily backups and restore testing. The current local worker is not a hostile-file sandbox. A single-process pilot must not be horizontally replicated or deployed on ephemeral disk.

## Moderator bootstrap

No public request can set role. Once an approved user has signed in, an operator with private database access can grant a moderator role by exact user ID. Audit that change, require a second authorised operator for administrator access, and keep database/backups inaccessible to the web. Do not promote arbitrary emails or create a default admin password. Moderation staffing, contacts, statement-of-reason delivery, suspension appeals access and emergency escalation must be operationally reviewed before accepting any external users.

## Release checks

Run locked installation, TypeScript/build, isolated API tests, media validation and browser QA; inspect actual deployment health, protected-origin access, Google callback, upload/processing/byte-range seeking, private media denial, moderation removal and Story expiry on the final environment. Verify account export/deletion and backup policy. Review provider quotas and hard-spend limits. Save the tested commit, protect the release branch and retain a tested rollback/restore plan. The supplied validation workflow is manual-dispatch only until EuroLoot confirms its hosted-compute allowance and budget. No hosted Actions run, auto-deploy or public registration is enabled by a push. Local checks run normally.

## Troubleshooting

- Google unavailable: verify owner OAuth configuration and allowlist; no password or mock Google login exists.
- Sign-in or mutations rejected: APP_ORIGIN, cookie hostname, reverse proxy and CSRF token must match. Reload after session changes.
- Processing failed: inspect Studio failure, executable permissions/paths, actual file signature/codec, free disk and quota. Retry only within the stated cap; repair invalid source rather than retry indefinitely.
- Data disappears on deploy: the chosen host was ephemeral or volume path changed; restore only from a verified backup. Do not use serverless local storage.
- No videos: the catalogue genuinely starts empty; processing/private/removed files do not populate the public feed.
- Closed registration: intentional launch gate; changing it requires age-assurance and safety readiness, not merely a frontend flag.
