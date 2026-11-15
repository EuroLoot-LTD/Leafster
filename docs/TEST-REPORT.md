# Verification report

15 November 2026. Local macOS ARM64, Node 24.11.1, Chrome. No hosted URL or live Google account login was tested.

## Automated checks

The final run is recorded below after final source preparation. The suite includes meaningful HTTP/database checks rather than treating compilation as product validation.

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
- Mobile390×844: no document horizontal overflow (document/body scroll width390), mobile menu opened/closed and responsive feed inspected. Final readability/accessibility corrections documented in source; limited keyboard checks do not constitute WCAG certification.

Browser-controlled upload stopped at the extension's file-URL permission. The clip was then uploaded through the real same-origin API to the same isolated test channel, processed and verified in the browser. Therefore full file-selection-to-submit browser coverage is **not** claimed. No extension permissions were changed. Story upload/expiry and moderation role tests were performed by the automated API suite, not falsely reported as browser-complete.

## Defects found and corrected

Initial review found session issuance without request bounds, cache responses that could outlive a visibility change, suspended-creator discovery leakage, cross-author reply gaps, processing/removal races and upload-reservation/output-size issues. Server fixes and regression tests were added. A misleading Liked feed initially returned all videos; actual like filters and separate discovery criteria were implemented and tested. UI field lengths, progress names, notification fields and moderation snake_case identifiers were aligned with the API. Unsupported formats and silently ignored categories were removed or rejected. Mobile readability, hidden-navigation focus and dialog keyboard handling received a final pass.

## Not verified / required before launch

Actual Google consent/callback/allowlisted login; final cloud deployment/TLS/domain; real remote database/storage; crash/load/concurrency/long-duration encoding stress; network-interrupted/resumable upload (unimplemented); Safari/Firefox; comprehensive assistive technology audit; deletion across future backups/processors; hosted monitoring/recovery; full child-safety/legal readiness. Moderation staffing, age assurance and mature Community Notes reliability are not established by these tests. Production release remains closed.
