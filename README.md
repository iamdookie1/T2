# scroller

A simple, ad-free Reddit scroller: subreddit explorer, sort tabs (hot/new/top/rising),
infinite scroll, inline images/video, and NSFW blur-to-reveal. Nothing runs on your
device — Reddit is fetched entirely from this app's own serverless API route
(`app/api/reddit/route.js`), using Reddit's free "app-only" OAuth so cloud-hosted
requests (Vercel, etc.) aren't blocked the way unauthenticated ones are.

## One-time setup: get free Reddit API credentials

Reddit blocks unauthenticated JSON requests from most cloud/server IP ranges,
so this app needs a free Reddit app registration:

1. Go to https://www.reddit.com/prefs/apps (log in first)
2. Click **create app** (or **create another app**) at the bottom
3. Name it anything (e.g. "scroller")
4. Choose type **script**
5. Set "redirect uri" to anything valid, e.g. `http://localhost:3000` (required but unused)
6. Click **create app**
7. You'll see two values: a short string under the app name — that's your
   **client ID** — and a **secret** field next to it

## Deploy to Vercel

1. Import this repo in Vercel
2. In the project's **Settings > Environment Variables**, add:
   - `REDDIT_CLIENT_ID` = the client ID from above
   - `REDDIT_CLIENT_SECRET` = the secret from above
3. Deploy (or redeploy if you added the env vars after the first deploy)

## Run locally

```bash
npm install
# create a .env.local with REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET
npm run dev
```
