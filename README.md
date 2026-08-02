# scroller

A simple, ad-free Reddit scroller: subreddit explorer, sort tabs (hot/new/top/rising),
infinite scroll, and post thumbnails. No API keys, no Reddit developer signup, no
external server to run yourself. Reddit's own public `.rss` feeds (a long-standing,
unrestricted feature, separate from its gated JSON/OAuth API) are fetched and parsed
entirely inside this app's own serverless route (`app/api/reddit/route.js`).

Note: since RSS doesn't carry vote scores or comment counts, post cards show title,
subreddit, author, time, and a thumbnail when available, with a link to view and
comment on the actual Reddit post.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

Import this repo in Vercel and deploy — no environment variables or extra
configuration needed.
