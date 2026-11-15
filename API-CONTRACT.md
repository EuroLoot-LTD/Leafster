# Leafster local API contract

**Current access policy:** A completed, approved signed-in adult staging profile is required for all community and content endpoints, including catalogue search, channel pages, Leaves, Stories, public collections, thumbnails, and direct playback URLs. Signed-out requests return401; signed-in accounts awaiting onboarding return403. A video marked `public` is discoverable to eligible signed-in members under this access policy. Account controls retain their ownership and moderator checks.

Only health, session bootstrap, official Google authentication, sign-out, onboarding, and confidential legal notice submission remain reachable without a completed profile; onboarding itself requires sign-in. Privacy, terms, safety pages and static interface assets remain accessible. Legal notices from non-account holders require an anonymous CSRF session. The test-login handler exists only in an explicitly isolated test process and is absent from normal operation.
All responses JSON, failures `{error:string}`. All unsafe methods require same origin and `x-csrf-token` from GET /api/session. Cookies sent same origin. JSON request unless specified. Dates ISO.

- GET /api/session -> {user:null|{id,name,handle,avatar,role,onboarded},csrfToken,googleConfigured,registrationOpen:false}
- GET /api/auth/google -> real OIDC redirect or 503; GET /api/auth/callback handled server-side
- POST /api/auth/logout {}
- POST /api/onboarding {handle,name,adultConfirmed:true} -> {user}; channel automatically created
- GET /api/videos?q=&feed=recommended|latest|subscriptions|liked|trending|fresh&sort=newest|oldest|views&duration=short|long&offset=0 -> {videos,hasMore}
- GET /api/videos/:id -> {video,comments,notes,related}
- POST /api/uploads multipart field `file`, `title`, `description`, `visibility` public|unlisted|private -> {video} 202 (poll detail or studio for processing)
- PATCH /api/videos/:id {title?,description?,visibility?,commentsEnabled?} -> {video}; DELETE /api/videos/:id
- POST /api/videos/:id/reaction {value:1|-1|0} -> {likes,dislikes,reaction}
- POST /api/videos/:id/comments {body,parentId?} -> {comment}; DELETE /api/comments/:id
- POST /api/videos/:id/progress {seconds,watchedSeconds?} -> {ok}; GET /api/history -> {videos}; DELETE /api/history
- POST /api/channels/:id/subscribe {} -> {subscribed,subscribers}; DELETE same unsubscribes
- GET /api/channels/:handle -> {channel,videos,leaves}; PATCH /api/channel {name,description,links?} -> {channel}
- GET /api/studio -> {videos,analytics:{views,subscribers,watchSeconds,uploads},comments,quota:{usedBytes,maxBytes,maxUploadBytes}}
- GET /api/playlists -> {playlists}; POST /api/playlists {title,visibility:private|public} -> {playlist}; GET /api/playlists/:id -> {playlist,videos,leaves}; POST /api/playlists/:id/items {videoId?|leafId?}; DELETE /api/playlists/:id/items/:itemId; DELETE /api/playlists/:id
- GET /api/leaves -> {leaves}; POST /api/leaves {body,videoId?,parentId?} -> {leaf}; PATCH /api/leaves/:id {body}; DELETE /api/leaves/:id; POST /api/leaves/:id/like {} toggles; POST /api/leaves/:id/repost {} toggles
- GET /api/stories -> {stories}; POST /api/stories multipart `file`, `caption` -> {story} (image or max30sec video); DELETE /api/stories/:id
- POST /api/reports {targetType:video|leaf|story|comment|note|user,targetId,reason,details?} -> {id}
- GET /api/blocks -> {blocks}; POST /api/blocks {userId}; DELETE /api/blocks/:id
- POST /api/notes {targetType:video|leaf|story,targetId,body,sources:[https://...]} -> {note}; POST /api/notes/:id/rate {helpful:boolean}; notes initially pending, account maturity gates ratings.
- GET /api/notifications -> {notifications}; POST /api/notifications/read {}
- GET /api/settings -> {settings:{historyEnabled,autoplay,notifyUploads},blocks:[]}; PATCH /api/settings same settings fields -> {settings}
- GET /api/account/export -> JSON attachment; DELETE /api/account {confirm:'DELETE'}
- GET /api/moderation -> {reports,notes,actions}; POST /api/moderation/action {targetType,targetId,action:remove|suspend|accept_note|reject_note,reason}; moderator role server verified
- POST /api/appeals {actionId,body} -> {id}

Video {id,title,description,thumbnailUrl,playbackUrl,duration,views,likes,dislikes,createdAt,visibility,status,commentsEnabled,reaction,subscribed,channel:{id,userId,name,handle,avatar,description,subscribers}}. Comments {id,body,parentId,createdAt,author:{id,name,handle,avatar}}. Leaf {id,body,parentId,createdAt,author:{id,name,handle,avatar},likes,reposts,liked,reposted,videoId,replies:[]}. Story {id,caption,mediaUrl,kind:image|video,createdAt,expiresAt,author}. Playlist {id,title,visibility,itemCount}. Notes {id,body,sources,status,createdAt,author}. No seeded catalogue, counts derived from DB.

Additional implemented routes:
- PATCH /api/comments/:id {pinned:boolean} channel owner only, top-level comments, one pin/video
- GET /api/account/sessions -> {sessions:[{id,createdAt,expiresAt,current}]}; DELETE /api/account/sessions/:id revokes an owned session
- POST /api/videos/:id/retry failed uploads, maximum 3 processing attempts
- POST /api/legal/notices (anonymous CSRF session allowed): {category:copyright|illegal-content|child-safety,url,reason,contact?,goodFaith:true}; confidential moderation queue

Runtime environment: NODE_ENV, HOST(default127.0.0.1), PORT(default3001), APP_ORIGIN(defaulthttp://127.0.0.1:5173), LEAFSTER_DATA_DIR(default./data), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, LEAFSTER_ALLOWED_EMAILS(comma separated), FFMPEG_PATH, FFPROBE_PATH, LEAFSTER_TOTAL_STORAGE_BYTES(default2147483648). Existing Google sessions are revoked when removed from allowlist. Test sign-in only exists with both NODE_ENV=test and LEAFSTER_TEST_AUTH=true.

Official implementation references: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect), [Express Multer](https://expressjs.com/en/resources/middleware/multer/). Google credentials are required before real provider sign-in can be verified; no Google account/password simulation is implemented.

Feed responses include `feedInfo:{label,criteria}`. Trending ranks deduplicated signed-in daily viewers over seven calendar days and excludes zero-view videos. Fresh Finds includes only the newest public upload per channel with <1,000 subscribers published in the last30days, newest first. Recommended is initially chronological without tracking. Liked includes only your positive reactions to currently accessible videos. Unsupported topic categories fail400; duration filters are real.
