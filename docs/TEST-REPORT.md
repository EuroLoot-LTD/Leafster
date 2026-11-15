# Verification report

15 November 2026. Local macOS ARM64, Node 24.11.1, Chrome. No hosted URL or live Google account login was tested.

## Automated checks

All 18 automated tests passed after source preparation. The dependency audit reported zero known vulnerabilities in the checked production dependencies. The suite includes meaningful HTTP/database checks rather than treating compilation as product validation.

- Actual generated MP4 accepted, queued and transcoded with FFmpeg; thumbnail and decoded duration verified; HTTP byte ranges return206.
- A deliberately invalid MP4 signature rejected. Ownership prevents another account editing content and reading private media/collections.
- Subscriptions, reactions, comments, history, collections, Leaves/replies/likes, pending notes, reports and Studio aggregates persist in actual SQLite records.
- Actual JPEG Story accepted and sanitised, delivered, then denied through its retained URL after forced expiry.
- Anonymous and ordinary accounts cannot access private reported media; a moderator can review it through a report-scoped role-protected endpoint.
- CSRF and cross-origin writes denied; no session allocation on arbitrary reads; anonymous session creation rate bounded.
- Suspended creators excluded from history/saved videos/Leaves; blocked parent and cross-video replies rejected.
- New-account Note ratings denied; mature reviewer denied once target is private; separate moderator approval and audit trail verified; self-approval denied.
- Liked feeds exclude unliked/disliked content; Subscriptions excludes others/unlisted; Fresh Finds tests newest-per-channel/30-day/under1000-subscriber boundaries; Trending excludes old views and uses real view records.
- Export, deletion and sign-out verified; test login absent without the test-auth flag.
- Anonymous legal notice receipt/confidentiality, database/session persistence across a server restart, and refusal of unsafe production configuration verified.

`npm run build` checks frontend/server types and produces both Vite assets and compiled Node server. The built single-origin server is checked separately for HTML, health, headers and absence of the test login. Dependency audit is recorded after locked installation. These checks do not certify an absence of vulnerabilities.

## Browser checks performed

An isolated database outside the source checkout and explicit test-process login harness were used. The harness is not shipped or enabled in the normal application. Its test identities are not a substitute for Google authentication.

Verified in the actual interface:

- Empty homepage, supplied logo rendering, navigation and sign-in modal accurately identifying missing Google credentials.
- Unique-handle onboarding and channel creation; Studio zero-state and real stored upload status.
- Creator edit dialog changing the processed clip from private to public in isolated test data.
- Native HTML video decoding: readyState4, duration18seconds, no media error, paused=false during playback. Playback speed selection1.5x, keyboard play/pause, persisted history and counted playback signal confirmed in database.
- Comment submitted and visible; reaction still selected after navigation/reload; Leaf posted and persisted after reload.
- Private collection created and actual video saved to it; sourced note submitted for pending review.
- Mobile390×844: no horizontal document overflow, mobile menu opened and dismissed with Escape, closed drawer links excluded from the accessibility tree. The revised single-column feed and compact desktop1280×900 layout were inspected. Limited keyboard checks do not constitute WCAG certification.
- Sign-out restored the anonymous interface. The public legal-notice form rendered while signed out; notice submission/confidentiality were verified by the API suite.

Browser-controlled upload stopped at the extension's file-URL permission. The clip was then uploaded through the real same-origin API to the same isolated test channel, processed and verified in the browser. Therefore full file-selection-to-submit browser coverage is **not** claimed. No extension permissions were changed. Story upload/expiry and moderation role tests were performed by the automated API suite, not falsely reported as browser-complete.

## Defects found and corrected

Initial review found session issuance without request bounds, cache responses that could outlive a visibility change, suspended-creator discovery leakage, cross-author reply gaps, processing/removal races and upload-reservation/output-size issues. Server fixes and regression tests were added. A misleading Liked feed initially returned all videos; actual like filters and separate discovery criteria were implemented and tested. UI field lengths, progress names, notification fields and moderation snake_case identifiers were aligned with the API. Unsupported formats and silently ignored categories were removed or rejected. Mobile readability, hidden-navigation focus and dialog keyboard handling received a final pass.

## Not verified / required before launch

Actual Google consent/callback/allowlisted login; final cloud deployment/TLS/domain; real remote database/storage; crash/load/concurrency/long-duration encoding stress; network-interrupted/resumable upload (unimplemented); Safari/Firefox; comprehensive assistive technology audit; deletion across future backups/processors; hosted monitoring/recovery; full child-safety/legal readiness. Moderation staffing, age assurance and mature Community Notes reliability are not established by these tests. Production release remains closed.

## Design revision

The owner supplied a more specific historical screenshot during verification and rejected the first interface as too modern. The final frontend was aligned to that supplied reference: compact header/rail, grey page canvas, centred white shelves and smaller blue-link video cards, using original Leafster branding. [Desktop evidence](screenshots/desktop-reference-revision.jpg) and [mobile evidence](screenshots/mobile-reference-revision.jpg) show the revised interface using one real generated clip in isolated QA data. The normal catalogue remains empty. No screenshot or media from YouTube is included as application content.

## Follow-up verification: member access, vintage icons and square UI

The latest complete suite passed **20/20 tests** after enforcing sign-in for content/discovery/community/media. Previous anonymous media playback observations above describe the earlier policy, not the current one. New tests cover signed-out routes, anonymous-cookie attempts, direct media, URL case and trailing-slash variants, incomplete profiles and logout. Anonymous confidential legal notices remain permitted.

Both the full-stack production build and static Pages build passed. Browser checks verified the signed-out gate and disabled search, then the actual member interface with isolated fixture identity. Computed styles reported avatar radius `0px` and **zero rounded DOM elements**. [Latest square interface](screenshots/classic-square-interface.jpg). The Pages build was tested at `/Leafster/` with hash-route policy navigation and reload. It truthfully reports no application server and does not simulate a session or Google authentication.

The private compiled-only gh-pages branch was pushed. An authorised Pages activation request was rejected with HTTP422: “Your current plan does not support GitHub Pages for this repository.” No paid upgrade or repository visibility change followed. Live Google authentication is blocked by the account owner’s Google verification challenge; no attempt was made to bypass it.
