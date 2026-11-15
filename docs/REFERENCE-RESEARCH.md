# Reference research and independent implementation

Reviewed 15 November 2026. Research material lives outside the application in `work/reference`; do not distribute it with Leafster.

## SlopTube: primary reference

Repository: [myfilehero/sloptube](https://github.com/myfilehero/sloptube), observed main commit `7dc252811d8601e7cac463035cae747b0e161070`. The public repository was available and reports the MIT licence. No repository code, components, artwork, logos, text or test data was copied into Leafster. The implementation team receives product and architecture findings rather than source excerpts. This is an implementation-process statement, not a legal opinion or independent similarity audit.

Inspection covered repository structure, README, feature and launch documentation, package manifest, home/watch screenshots, and representative upload, processing, feed, search, engagement, comments, account, subscription, analytics, moderation, database-policy and worker files. This is a substantive targeted review, not a claim that every source file was read or that SlopTube was security-audited or executed.

### Findings

SlopTube separates the web application, identity/database, video object storage and media encoder. This is the key engineering lesson: a successful frontend build cannot establish that uploading, transcoding or playback works. Each stage requires independent configuration and verification.

Its documentation explicitly describes a learning resource, warns it is not security-audited, and distinguishes its invented demo catalogue from real operation. Leafster should preserve that honesty while using real stored user content and actual engagement records. Its sample videos and fabricated audience figures are unsuitable for Leafster.

At the product level, the useful concepts are a persistent channel identity, a searchable catalogue, a prominent watch experience, creator-managed content states, and public interactions subject to reporting and moderation. Leafster adds its own integrated Leaves, Stories and contextual notes. It omits the reference's dark theme and vertical short-video experience.

### Original engineering recommendations

- Use separate upload, validation, processing, ready and failure states. Keep new uploads private until the creator deliberately publishes.
- Keep originals and derivatives outside the public web root. Authorise every media request against current content visibility and moderation state.
- Run bounded media processing separately from request handling. Enforce disk, duration, file-size, execution-time and concurrency limits; persist job errors and retries.
- Persist subscriptions, reactions, comments and history server-side. Never infer success from a button colour or an optimistic state alone.
- Define view and watch-time measurement explicitly. Show missing analytics as unavailable or zero according to the actual records, without invented historical trends.
- Treat settings and moderation as enforcement rules in the server, not frontend presentation. Apply ownership and suspension checks to reads as well as writes.
- Fail closed when identity or storage is unavailable. A polished catalogue cannot replace the minimum working upload-and-watch flow.

## YouTube 2018–2019: evidence and interpretation

Primary historical evidence includes YouTube's [August 2017 redesign announcement](https://blog.youtube/news-and-events/a-new-youtube-look-that-works-for-you/), [March 2018 Studio announcement](https://blog.youtube/news-and-events/youtube-studio-better-insights-new/), and [November 2019 homepage announcement](https://blog.youtube/news-and-events/introducing-fresh-new-look-for-youtube/). Historical stills attributed to YouTube.com were visually inspected through [Version Museum's design-history collection](https://www.versionmuseum.com/history-of/youtube-website). Those stills are research references only; they are not Leafster assets. Archive captures differ with account, country, experiment and date, so no single screenshot is a universal specification.

The 2017 announcement establishes the white, content-first header, simplified desktop presentation and controls that adapt across devices. The 2018 Studio announcement establishes a creator hub that connects uploads, channel management, community and measured performance. In November 2019, YouTube announced larger thumbnails, longer titles, fewer shelves, channel icons, a queue and channel recommendation controls. Therefore “2018–2019” is not one fixed layout: the brief's preference for density is better matched by the earlier period than by reproducing late-2019 thumbnail expansion.

### Visual observations and Leafster decisions

| Area | Observed pattern | Independent Leafster direction |
| --- | --- | --- |
| Desktop home | Persistent left guide, centred rectangular search, compact 16:9 thumbnails in shelves; five across in the wide 2019 still | Collapsible grouped sidebar, clear search, dense responsive grid, orange active states |
| Cards | Duration overlay; title and channel/date/views below; thumbnail carries the visual weight | Original typography and spacing, actual counts only, explicit empty catalogue |
| Watch | Large left player; compact related list to the right; title, engagement, channel/subscribe and description underneath | Native working playback first; understated orange controls; no forced autoplay |
| Channels | Shallow wide banner, identity/subscriber row, underline tabs and upload shelves | Creator branding, original tab design and Leaves/Stories integrated under one identity |
| Social interaction | Public comments, creator replies and subscribe affordances near content | Moderated public interaction, block/report and clear restrictions; no private contact pathway |
| Studio | Recent-video performance and important creator information beside content controls | Real processing/content state and recorded metrics; no decorative invented charts |
| Mobile | Primary content retained while navigation and player adapt | Drawer navigation, readable metadata, usable touch targets and unobstructed playback |
| Discovery | Search, subscriptions, trending, permanent Watch Later and feed controls | Explicit Recommended/Subscriptions/Latest choice; transparent Fresh Finds criteria |

Account menus, upload flows, comments, search filters, playlists and notification behaviour were considered through repository documentation, representative implementation files and YouTube's historical descriptions. Exact 2018 layouts for every secondary flow were not independently reconstructed. Leafster should use familiar accessible behaviours without claiming pixel-for-pixel historical fidelity.

## Google identity and YouTube migration boundaries

[Google's official OpenID Connect documentation](https://developers.google.com/identity/openid-connect/openid-connect) requires a registered OAuth client and redirect configuration, token validation, and anti-forgery state. Use a supported library; the basic login should request only basic identity scopes. Missing real credentials must remain an explicit configuration blocker rather than a simulated Google success.

A separate YouTube connection must obtain separate consent. [Channels.list](https://developers.google.com/youtube/data/reference/rest/v3/channels/list) supports `mine=true` for an authorised account. Its `managedByMe` facility is limited to eligible content partners, so the product must not promise that every ordinary account can enumerate every delegated channel.

The [YouTube API developer policies](https://developers.google.com/youtube/terms/developer-policies) govern consent, data use, retention/deletion and audiovisual downloads. Do not build a YouTube downloader as migration. Support lawful creator-supplied originals/exports and permitted metadata; require a creator review before publishing. API-derived metadata requires an appropriate freshness/deletion implementation and policy disclosures before enabling the integration. Direct audiovisual transfer remains unavailable unless the relevant permission has actually been secured.

## Branding provenance

The pasted attachment itself contained only the task text. During the build, the owner agent located the user’s official Leafster logo in the user’s open Canva design and exported it unchanged to `public/brand/leafster-logo.png`; the favicon was derived from that asset. The actual supplied branding supersedes the provisional-wordmark limitation recorded during initial research. Preserve its proportions and use it as the navigation/authentication identity rather than copying any reference-platform artwork.
