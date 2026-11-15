# Infrastructure and cost model

Researched 15 November 2026. USD, monthly, excluding tax. Nothing paid was provisioned. Quotes and terms must be rechecked before purchase.

## What runs now

One Node 24 process, SQLite and private local disk, plus FFmpeg. No cloud account or billing API is called by the application. This is a single-host restricted development architecture. The existing computer has electricity, bandwidth, disk and maintenance costs; it is not free production infrastructure. Cloud object storage, Postgres and hosted workers are not implemented adapters yet.

## Provider evaluation

| Service | Verified allowance / price | Suitability |
| --- | --- | --- |
| Supabase Free | 500 MB database; 1 GB objects; 50,000 MAU; 5 GB uncached plus 5 GB cached egress; two active projects; pause after one inactive week | Potential pilot identity/metadata service. Video storage and bandwidth are far too small for a platform. Existing unrelated projects were not changed. |
| Supabase Pro | Starts $25; 100,000 MAU; 8 GB database disk, 100 GB objects; 250 GB uncached and 250 GB cached egress, overage priced separately | A future database/auth option, not currently connected. Compute, data growth, backups and activity matter more than registered-user counts alone. |
| Vercel Hobby | Personal, non-commercial use; 100 GB fast transfer on documented allowance | Do not assume EuroLoot qualifies. Not selected for persistent SQLite or on-host FFmpeg. No unrelated personal team deployment. |
| Cloudflare R2 Standard | 10 GB-month storage, 1m Class A and 10m Class B requests free monthly; $0.015/GB-month, $4.50/m A, $0.36/m B thereafter; direct R2 egress free | Attractive future object origin. Not an encoder, not a zero-cost video platform. Other metered services can add charges; terms/security review required. |
| Cloudflare Stream | $5/1,000 stored minutes in capacity increments; $1/1,000 delivered minutes, encoding included | Simpler managed transcoding, clearly paid. Not enabled. Buffering and downloads may count as delivery. |
| GitHub / GitHub Pages | Source owner must be EuroLoot and repository private | A private EuroLoot-LTD/Leafster repository was created and its owner/visibility verified. Pages is static hosting, unsuitable for this backend and Google sessions. |

Sources: [Supabase pricing](https://supabase.com/pricing), [Supabase egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress), [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Vercel terms](https://vercel.com/legal/terms), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Stream pricing](https://developers.cloudflare.com/stream/pricing/). Free allowance availability does not approve billing activation or provider terms on the owner's behalf.

## Reproducible scenario

These are workload assumptions, not forecasts: N monthly active users, 10% upload one ten-minute video each month; retain six months (6N minutes). Every active user watches two hours per month (120N delivered minutes). Average delivery 2 Mbps = 0.015 GB/minute. Originals and encoded variants combined assumed 3x that size = 0.045 GB/minute; actual source bitrates can greatly exceed it. Steady-state storage 0.27N GB; delivery 1.8N GB/month. This model exceeds the current restricted pilot file quotas; capacity must be redesigned before permitting these workloads.

| Active users | Retained video min | Stored GB | Delivered GB/mo | R2 storage only* | Stream storage + delivery** |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 600 | 27 | 180 | $0.26 | $17 |
| 1,000 | 6,000 | 270 | 1,800 | $3.90 | $150 |
| 10,000 | 60,000 | 2,700 | 18,000 | $40.35 | $1,500 |
| 100,000 | 600,000 | 27,000 | 180,000 | $404.85 | $15,000 |

*R2 subtotal = max(0, GB−10) × $0.015, rounded cents. Does NOT include encoding, API compute, database, backups, thumbnails, observability, operations or request overages. At 4-second segments the scenario produces about 1,800N media reads/month before caching; at 100,000 users that alone could mean 170m billable Class B reads (~$61.20), ignoring browser caches and other requests. MP4 range patterns differ. Stored derivatives, high resolution, retention and abuse change all figures.

**Stream = ceil(retained minutes/1,000) × $5 + delivered minutes/1,000 × $1. Alternative to R2/own encoder; do not add both storage totals for the same media.

Whole-platform planning allowances with R2 plus own encoding could be approximately $15–75 / $40–150 / $150–800 / $600–4,000 per month across those four usage levels. These are engineering contingencies, not vendor quotes or verified capacity. They include rough compute/database/backup headroom but exclude salaries, human moderation, legal advice, incident response and taxes. At large scale those exclusions can exceed infrastructure costs. Load tests and provider quotes are necessary before any commitment. A viral upload or malicious traffic can invalidate this scenario overnight.

## Cost controls and migration

Keep registration allowlisted. Enforce file, duration, account storage and total-host quota server-side before processing; serialize encoding jobs; private-by-default uploads; no autoplay. Alert at 50/75/90% of disk and delivery budget, reject new uploads before exhausted, and cap per-user daily uploads. Confirm provider hard limits: alerts are not spending caps. Do not add a billing method, remove a spend cap or enable usage billing without explicit approval.

For deployment after approval: create a verified EuroLoot-owned private repository, a EuroLoot-authorised host, EU-region persistent storage, off-host encrypted backups with restore tests, restricted Google OAuth credentials. Then replace filesystem media access with private object storage + expiring signed delivery, and port repository SQL to PostgreSQL with tested RLS. Move FFmpeg to a bounded worker using a durable queue and retry/idempotency semantics. Resumable direct uploads and HLS require explicit implementation, not a hosting toggle. Keep moderation and deletion consistent across storage, CDN and backups. Obtain separate consent for any future YouTube read-only integration. Never scrape/download YouTube audiovisual files.

Community funding and grants could offset expenses but do not remove them. No donation, payment, advertising or registered nonprofit claims are included.
