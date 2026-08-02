# scroller

A simple, ad-free Reddit scroller: subreddit explorer, sort tabs (hot/new/top/rising),
infinite scroll, and a card grid with inline images/GIFs/video. Posts open in an
in-app viewer with Prev/Next navigation instead of redirecting to Reddit. No API
keys, no Reddit developer signup, no external server to run yourself. Reddit's own
public `.rss` feeds (a long-standing, unrestricted feature, separate from its gated
JSON/OAuth API) are fetched and parsed entirely inside this app's own serverless
route (`app/api/reddit/route.js`), running on Vercel's Edge Runtime.

Notes on data limits:
- RSS doesn't carry vote scores or comment counts, so those aren't shown.
- Media resolution: `i.redd.it`-style direct file links play at full quality
  as-is; `v.redd.it` (Reddit-hosted video) and single-image `imgur.com` links
  are resolved by guessing their real CDN URLs and trying a few candidates
  client-side until one loads; `redgifs.com`/`gfycat.com` links are resolved
  server-side via Redgifs' free public API. Anything else (albums, article
  links, etc.) falls back to Reddit's small RSS thumbnail or just links out.
- NSFW detection is best-effort (title/content text matching) since Reddit strips
  the reliable flag from logged-out RSS requests — flagged posts are blurred until
  tapped.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

Import this repo in Vercel and deploy — no environment variables or extra
configuration needed.
