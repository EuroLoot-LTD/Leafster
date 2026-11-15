# Feature implementation and verification status

Snapshot: 15 November 2026. This is a substantial **local development implementation**, not a production-ready public platform. No hosted URL or live Google sign-in is verified. Source is proprietary; the owner reports the requested EuroLoot repository was created private. Consult the final test report and verified repository state for the release commit.

## Reading the matrix

- **Local** means implemented against the real local SQLite database/filesystem, not a simulated provider.
- **Partial** means only the stated subset exists. An endpoint or visible control does not establish that the complete requested workflow works.
- **Absent / blocked** means unavailable and must not be presented as a working feature.
- **API verified** refers to actual automated HTTP tests. **UI present** means source inspection found the interface; browser verification must be reported separately.

The currently reviewed automated suite contains 15 passing tests: two backend integration/environment tests, one discovery/feed test and twelve independent security tests. A complete `npm test` run passed all 15 during this review. Its broad integration test generates actual media with FFmpeg and uses an isolated test-only identity endpoint. These fixtures are not Google authentication and never populate the normal catalogue. Security tests use some directly seeded records to isolate access-control cases. No test count should be read as exhaustive browser, load or adversarial assurance.

## Foundation, brand and navigation

| Brief area | Implemented scope | Status / verification |
| --- | --- | --- |
| Original product/source | Independent React/TypeScript interface and Express/SQLite server; reference research separate | Local; process provenance documented, no independent similarity audit |
| Official logo and favicon | Owner located official Canva design, exported unchanged logo and derived favicon | Assets integrated; final responsive visual QA belongs in browser report |
| White/orange light-only design | White/neutrals, #E57D09 accent; no dark-mode switch | UI present |
| Desktop navigation | Header search, create, notifications, account menu; grouped collapsible sidebar | UI present; all requested main destinations represented |
| Mobile navigation | Responsive grid/layout and drawer/scrim controls | UI present; final browser/device coverage pending |
| Accessible interaction | Skip link, named controls, focus styles, modal Escape/focus handling, native media controls | Partial; not a WCAG certification or screen-reader/browser audit |
| Empty/loading/errors | Honest empty catalogue, loading/error/retry states, form errors | UI present; invalid-media denial API verified |
| Fake activity | No seeded catalogue, invented creators or fabricated engagement in normal operation | Local data starts empty; isolated tests use labelled fixtures |

## Identity, profiles and channels

| Brief area | Implemented scope | Status / verification |
| --- | --- | --- |
| Google authentication | Official library; code exchange, PKCE, state, nonce and ID-token validation | Implemented but blocked by real EuroLoot OAuth credentials/configuration; no live provider test |
| Minimal login grant | openid/email/profile only; no Google password form/storage or YouTube grant | Code inspected; actual consent screen not verified |
| Closed registration | Approved email allowlist and adult-staging declaration; Google sessions revoked when removed from allowlist | Local gating; declaration is not age assurance; host must also restrict anonymous viewing |
| Account creation/channel | Unique handle and display name; channel created transactionally | API verified using test-only identities |
| Avatar/profile branding | Basic Google avatar import and channel identity | Partial; custom avatar/banner upload and extensive appearance controls absent |
| Channel page | Video/Leaves/Stories/About views, name/description/links, stored subscriber counts | Local + UI present; channel Playlists tab is an explanatory state, not a public playlist listing |
| Channel edit | Name/description and HTTPS links through server | Local; complete appearance flow not browser verified |
| Featured video/trailer | No selection/editor | Absent |
| Subscribe/unsubscribe | Database-backed subscription endpoints and controls | Subscribe/persistence count API verified; full browser/relogin workflow pending |
| Session management | Opaque hashed sessions, HttpOnly/SameSite, Secure in production, CSRF, listing/revocation endpoints | Listing API verified; revocation endpoint present, UI coverage limited |
| Sign out | Session invalidation and cookie removal | API verified; actual Google recovery/revocation remains provider setup |
| Account export | JSON profile/platform records with internal media paths removed | API verified; originals archive and complete data-subject-request process absent |
| Account deletion | Local account relationships and uploaded files removed | API verified for account lifecycle; backup/processor/legal-hold handling remains operational work |

## Video publishing, watch and discovery

| Brief area | Implemented scope | Status / verification |
| --- | --- | --- |
| Original video upload/storage | Multipart upload to private local disk; server MIME/signature/probe checks | Actual generated MP4 upload API verified; no remote bucket/resumable transfer |
| Private default/creator publish | UI submits private; creator can edit public/unlisted/private visibility | API public/private transitions and private denial verified |
| Processing | Persisted queue/status; local FFmpeg creates fast-start H.264/AAC MP4 and JPEG thumbnail | Actual processing output and byte-range media delivery API verified |
| Processing quotas | 100 MB file; 30 minute video; 500 MB account; bounded uploads and site storage setting; one local video worker | Local implementation; no distributed/load/resource-isolation verification |
| Failure/retry | Validation errors, failed jobs, bounded retry endpoint; interrupted processing requeued | Invalid-file API test; retry/restart/network-interruption scenarios not fully tested |
| Thumbnail generation | Automatic JPEG derivative | Actual pipeline API verified; custom thumbnail upload/editor absent |
| Multiple qualities/HLS/adaptation | One output up to 720p | Absent: adaptive bitrate, resolution menu, multiple encodings |
| Real player | Native HTML video with controls, seeking, volume, fullscreen, speed UI, theatre and PiP where supported | Media/range API verified; every browser player mode not independently verified |
| Captions/chapters | Conditional rendering hooks exist in UI | Absent end-to-end: no schema/upload/editor/API furnishing tracks/chapters |
| Playback shortcuts | Space/K play/pause, arrows seek, M mute, F fullscreen, T theatre | UI code present; comprehensive keyboard/focus/browser checks pending |
| Progress/history | Authenticated progress records, history list/clear, setting to disable saving | Progress/resume value API verified; final browser resume/short-clip timing coverage incomplete |
| Public counts | Stored reactions, subscriptions and recorded playback events | API verified for like/view/subscriber totals; client-reported signals are not fraud-proof measurement |
| Dislikes policy | Public count alongside likes | UI states policy; dislike endpoint implemented, broad abuse resistance absent |
| Description/share/save | Expandable description; native share/clipboard; collection-saving dialog | Local/UI present; browser share support and copy fallback coverage pending |
| Comments/replies | Stored public comments, one reply level, newest/oldest UI sorting, deletion and creator comment-off setting | Comment persistence and block/cross-video reply denial API verified; no top/helpful sorting |
| Pinned comments | Channel-owner-only pin endpoint, one top-level pin per video | API present; UI pin control/visual ordering verification incomplete |
| Related videos | Other public ready videos, basic recency | Partial; no sophisticated relevance model |
| Search/suggestions | Titles, descriptions and channel names matched; returned videos suggest titles | Search API verified; distinct channel/playlist/Leaf results absent |
| Sort/duration filters | Newest, oldest, most viewed; short and long duration filters | Search/oldest basic API case verified; all combinations not tested |
| Feed choice | Subscription filter, real liked feed, distinct Trending/Fresh Finds and recency ordering; criteria explicitly returned | Eligibility/ordering API verified; Recommended transparently uses basic ordering rather than a personalised recommender |
| Trending/Fresh Finds | Trending ranks counted daily viewers over seven calendar days; Fresh Finds selects the newest public upload per channel under 1,000 subscribers within 30 days | Eligibility/ordering API verified; criteria returned to UI; no mature manipulation-resistant discovery system |
| Liked videos | Actual positive reactions, excluding inaccessible/private-to-others, removed and blocked content | Distinct liked-feed eligibility API verified |
| Pagination | Offset/hasMore API | Partial; homepage initial grid does not yet expose complete pagination flow |
| Watch Later | Private collection convention named Watch Later | Local; requires creating/selecting collection, not a separate automatic library service |
| Creator Spotlights | No curation workflow | Absent |
| Discovery preference controls | Blocking hides supported logged-in discovery/interactions | Partial; not-interested, hidden-channel-only, reduced-topic and recommendation-management controls absent |

## Leafster Studio and analytics

| Brief area | Implemented scope | Status / verification |
| --- | --- | --- |
| Content management | Actual upload list, processing status, edit title/description/visibility/comments and delete | Core upload/edit ownership and studio totals API verified; final UI interactions require browser checks |
| Studio summary | Recorded uploads/views/subscribers/watch time, quota and recent comments | Actual stored totals API verified |
| Comment moderation | Creator may delete comments on own videos | Endpoint/UI present; moderation workflow not comprehensively tested |
| Metadata extensions | No tags/categories/scheduling/chapters/captions editor | Absent |
| Time-series analytics | No daily views/watch-time/subscriber series | Absent; aggregate totals only |
| Retention, geography, traffic sources, comparisons | No collection/aggregation/report implementation | Absent; no fabricated charts |
| Measurement quality | Bounded authenticated client progress signals and one user/video/day view row | Partial; abuse resistance, retention methodology and privacy aggregation need further engineering |
| Large/batch/resumable uploads | Single-file local transfer | Absent |

## Leaves, Stories and collections

| Brief area | Implemented scope | Status / verification |
| --- | --- | --- |
| Text Leaves/replies | Public text and one reply level, own edit/delete, linked Leafster video IDs | Text/reply/like persistence API verified; full UI editing/deletion coverage pending |
| Leaf likes/reposts | Database-backed toggle/count | Likes API verified; repost is partial: no complete redistribution/quote/repost feed |
| Leaf bookmarks | Save into collections | Endpoint/UI present; not independently tested with Leaf item |
| Leaf images/video uploads/polls/quote | No media attachment or poll schema/workflow | Absent; existing Leafster video linking only |
| Reply permissions | No per-Leaf reply audience setting | Absent; blocks and public moderation apply |
| Stories media | Sanitised JPEG/PNG images and short video up to 30s; text caption | Actual image upload/sanitised retrieval API verified; video Story pipeline not independently tested |
| Story expiry | Server denies expired direct media URLs; feed excludes expired Stories; periodic local cleanup | Direct URL expiry API verified; automatic cleanup/backup erasure not completely tested |
| Story viewer | Click to open, native video controls, report/context submission; no private replies | UI present; no compulsive continuous-feed mechanism |
| Story overlays/captions | Accessible description/text caption | Partial; no editable visual text overlay or subtitle-file workflow |
| Subscribed Stories | Dedicated/all-active view and channel filtering | Partial; subscription-only feed absent |
| Collections | Public/private mixed video/Leaf collections, add/remove/delete endpoints | Video collection creation/private denial API verified; complete public sharing/channel listing absent |
| Creator announcements | Public Leaves | Local; no separate community/poll publishing system |

## Community Notes and trust/safety

| Brief area | Implemented scope | Status / verification |
| --- | --- | --- |
| Note submission | Video/Leaf/Story targets; 1–5 HTTPS sources; one note per author/target; pending by default | Video submission/pending state API verified |
| Helpfulness ratings | Account at least 30 days old, no recorded sanctions, cannot self-rate | New-account denial and mature-account denial on newly private target API verified; full mature reviewer workflow and coordinated manipulation not exhaustively tested |
| Note approval | Explicit moderator acceptance/rejection with reason; no automatic majority publication | Moderator acceptance, self-approval denial, accepted video display and audit reason API verified; factual/source judgement remains a human responsibility |
| Accepted note display | Watch page displays accepted video notes | Partial; accepted Leaf/Story note display, author status/appeals and comprehensive note-report UI incomplete |
| Cross-viewpoint/reputation | No mature diversity/reliability consensus algorithm | Absent; human review is a launch/operational dependency |
| Confidential reports | Report table/queue, server-controlled moderator/admin role | Submission + unauthorised read/action denial API verified; staffing is not established by a table |
| External legal notices | Anonymous CSRF-enabled copyright/illegal-content/child-safety endpoint | API present; easy-to-find public form/contact and monitored procedure remain launch work |
| Content removal/account sanctions | Moderator endpoints remove supported content/suspend users, record reason/audit | API present; broad authorised sanctions/restore tests incomplete |
| Decision delivery | Audit records exist | Partial; complete affected-user statement-of-reasons delivery/status UI absent |
| Appeals | Active users can submit own-content appeals into queue | Partial; suspension blocks account access; alternate verified appeal contact, independent decision/restore workflow absent |
| Blocking | Symmetric logged-in discovery/interaction denial, unsubscribe and settings unblock | Blocked-comment reply test passed; comprehensive all-target coverage and signed-out privacy guarantees not claimed |
| Spam/contact safeguards | Rate limits, email/phone exposure rejection, safe URL protocols, account restrictions | Partial; regex checks are not grooming detection; contextual/behavioural abuse and link reputation system absent |
| No private messaging | No DM/inbox/private calls/private Story replies/live chat implemented | Source inspection; no guarantee against all off-platform contact |
| Minor safety | Closed adult allowlist/declaration; no public registration | Blocked for youth/public launch: verified age assurance, child-specific defaults and safeguarding operations |
| Emergency escalation | Requirements documented | Absent operational staffing and approved lawful reporting process |

## Infrastructure, security and release

| Brief area | Implemented scope | Status / verification |
| --- | --- | --- |
| Database/migration | Real SQLite tables, constraints/indexes/foreign keys, idempotent initial migration | Exercised by API suite; not PostgreSQL/Supabase or remote RLS |
| Server authorisation | Ownership, role, active status and block checks before protected reads/writes | Representative denial tests passed; not a penetration-test certification |
| CSRF/origin/session protection | Per-session token, request-origin rejection, bounded anonymous session issuance, no-store API/media | Independent security tests passed |
| Upload security | MIME/signature/probe validation, generated paths, capped sizes, bounded processing | Actual valid/invalid upload cases passed; hostile-file isolation/resource stress remain incomplete |
| Secrets | Environment example/ignore rules; server-only OAuth secrets | Source setup present; live secret management not configured |
| Security headers/logging | Helmet/CSP and generic server errors | Code present; structured incident/access audit and production monitoring incomplete |
| CI/production build | See actual final build/CI files and test report | Do not infer deployed CI success from local scripts |
| Private EuroLoot repository | Created private under requested owner according to owner-agent verification | Confirm URL/pushed release commit in final delivery; no public source publication authorised |
| Remote host/database/storage | Existing connected cloud owners did not establish authorised EuroLoot environment | Blocked; unrelated projects left untouched |
| Hosted Google/HTTPS/domain | No eligible deployment and credentials configured | Blocked; no verified live URL or redirect flow |
| Costs/quotas | Current-provider research, assumptions and staged usage estimates documented | Estimates, not an activated free/paid infrastructure promise; no spending authorised |
| Backup/restore/observability | Runbook/requirements | No verified off-host backup, restoration drill, incident staffing or load test |
| YouTube connection | Explicit unavailable settings/Studio explanation | Absent implementation: separate consent/token storage/channel enumeration/disconnect/ownership verification |
| Compliant migration | Original-file upload and per-channel duplicate hashing | Partial; no batch/import history/metadata matching/YouTube API metadata import/direct transfer |
| Legal/accessibility policies | Researched readiness notes and unpublished drafts | Operator identity/contacts/legal review/accessibility audit remain launch blockers |

## Important unresolved limits

The public catalogue must remain genuinely empty until creators publish real content. This build must remain local or behind an approved whole-origin staging gate. Account allowlisting does not alone restrict anonymous browsing of public pages/media. No production host was provisioned, no payment was enabled, and no guarantee of unlimited free video delivery is made.

SQLite/private disk and one process are an intentional working pilot architecture, not a distributed production platform. Production requires persistent approved infrastructure, resource isolation, remote backups, monitored safety/legal processes, tested age policy and actual Google/browser end-to-end verification. See `ARCHITECTURE.md`, `DEPLOYMENT.md`, `PRIVACY-AND-SAFETY.md` and `INFRASTRUCTURE-COSTS.md`.
