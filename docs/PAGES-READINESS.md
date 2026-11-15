# GitHub Pages readiness

Initial read-only assessment: 15 November 2026. A subsequent authorised activation attempt and its exact rejection are recorded below. No public repository, paid trial, subscription, visibility change or successful Pages deployment was created.

## Verified account/repository state

| Check | Observed result |
| --- | --- |
| Organisation | `EuroLoot-LTD`, type `Organization` |
| Organisation plan | GitHub REST response `plan.name = free` |
| Repository | `EuroLoot-LTD/Leafster`, ID `1458921376` |
| Repository visibility | `private = true`, `visibility = private` |
| Repository Pages flag | `has_pages = false` |
| Pages endpoint | `GET /repos/EuroLoot-LTD/Leafster/pages` returned HTTP 404, “Not Found” |
| Available repository permission | `admin`, `maintain`, `push` and `pull` true |
| Organisation membership | Active, role `admin` |
| Local and remote main commit checked | `617c098206d3fe98f9ccbb1979a302e396bbac4b` |

These facts were read through the authorised GitHub CLI/API. A Pages endpoint 404 alone does not prove a plan restriction: no site is configured. The plan restriction is established separately by the observed Free organisation plan and GitHub's published eligibility rules.

## Precise hosting blocker

GitHub states that a Pages source repository owned by a Free organisation must be public. Private organisation repositories can supply Pages on GitHub Team or Enterprise plans. A personal Pro subscription does not upgrade an organisation's entitlement. Therefore the current combination of **GitHub Pages + Free organisation plan + private Leafster repository** is unsupported. Repository administrator permission does not remove the plan requirement. [GitHub Pages creation requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [GitHub organisation plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans).

A private source repository also does not mean a private website. A public Pages site built from private source still exposes its deployed browser assets. Private-audience Pages requires the relevant Enterprise Cloud configuration. [Organisation Pages controls](https://docs.github.com/en/organizations/managing-organization-settings/managing-the-publication-of-github-pages-sites-for-your-organization).

The repository must remain private. No upgrade, public-source workaround or trial is authorised by this assessment. A plan decision requires the owner's explicit spending/terms approval.

## Independent technical blocker

Pages serves static HTML, CSS and browser JavaScript. It does not execute this project's Express server, SQLite database, FFmpeg jobs, private upload handlers or server OAuth callback. Deploying only `dist/` would not deliver the requested working video platform. The current frontend expects a same-origin API; its development proxy is not a deployed backend. [What GitHub Pages hosts](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [server-side limitations](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

The present Vite build uses root-relative asset/API paths and BrowserRouter. A project-path Pages build additionally needs a correct asset base and a tested deep-link strategy. A successful static build does not resolve API hosting, sessions or OAuth.

## Viable choices preserving private source

1. **Preferred for the current application:** deploy frontend and API together on an approved EuroLoot persistent host behind HTTPS. This preserves the current same-origin security model and supports SQLite/media/FFmpeg. Keep the repository private. A real owner-authorised host, safe capacity limits and any spending approval remain necessary.
2. **If Pages remains required:** first obtain an eligible organisation plan, then host only the static frontend on Pages and deploy the actual API/database/media processor elsewhere. This is an engineering change, not a configuration toggle. Use a nonsecret API URL, exact-origin CORS and CSRF validation, a properly designed secure session flow, approved media authorisation and tested redirect/deep-link behaviour. Cross-site cookies may be restricted by browsers; prefer an approved domain arrangement that avoids relying on third-party cookies. Never place OAuth client secrets, private database files or uploaded originals in the Pages artifact.

GitHub Pages has a 1 GB published-site limit and a soft 100 GB/month bandwidth limit; it is not an upload/video-storage service. Its restrictions concerning commercial services and sensitive transactions must also be checked against the final operating model. [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

## Real Google sign-in requirements

Use an authorised EuroLoot Google Cloud project and a Web application OAuth client, correct branding/audience/testing configuration and the exact real server callback URI. Set server-only `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` through approved secret handling. This application uses the supported server flow and basic `openid email profile` identity scopes; a YouTube connection is separate. Verify actual state/nonce/PKCE, allowlist, successful callback and sign-out on the deployed origin. A signed-in browser profile alone does not configure the application's OAuth client. [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect), [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server).

The Google web-server documentation states a newly created client secret is shown at creation rather than being retrievable later. Keep any secret out of chat, source, logs and static artifacts. No credentials or provider-flow success are asserted in this assessment.

**Current outcome:** Pages is not configured, no live Pages URL has been verified, and no proposed URL is presented as an existing deployment.

## Prepared build and actual activation result

`npm run build:pages` produces `dist-pages/` with base `/Leafster/`, local assets and HashRouter routes. The build checks for source, environment, database, source-map and video files and refuses to package them. The included browser JavaScript is necessarily visible to website visitors; this is not a claim of secret frontend code. It has no connected API and clearly explains that sign-in/member features and notice submission are unavailable; it never fabricates authentication success.

A compiled-assets-only gh-pages branch (906cb1e) was pushed to the existing **private** repository. `POST /repos/EuroLoot-LTD/Leafster/pages` with source `gh-pages:/` was attempted under the owner’s explicit publication request. GitHub returned **HTTP422**, exactly: “Your current plan does not support GitHub Pages for this repository.” No site was activated and no live URL was asserted. The private source and compiled branch were retained without changing the plan or billing.

The owner’s EuroLoot Google account reached a “Verify it’s you” challenge and the required phone is unavailable. OAuth remains unconfigured; the supported passkey/backup/account-recovery path belongs to the account owner. No verification bypass, credential extraction or disabled MFA is included.
