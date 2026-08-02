# scroller

A simple, ad-free Reddit scroller: subreddit explorer, sort tabs (hot/new/top/rising),
infinite scroll, inline images/video, and NSFW blur-to-reveal. No API keys, no
external server to run yourself — Reddit's public JSON endpoints are called from
this app's own serverless API route (`app/api/reddit/route.js`).

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

Import this repo in Vercel and deploy — no environment variables or extra
configuration needed. `app/api/reddit/route.js` becomes a Vercel serverless
function that fetches from Reddit on Vercel's servers, not your device.
