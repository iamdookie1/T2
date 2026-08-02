# scroller

A simple, ad-free Reddit scroller: subreddit explorer, sort tabs (hot/new/top/rising),
infinite scroll, inline images/video, and NSFW blur-to-reveal. Nothing runs on your
device — Reddit is fetched entirely from this app's own serverless API route
(`app/api/reddit/route.js`), using Reddit's free "installed app" OAuth so cloud-hosted
requests (Vercel, etc.) aren't blocked the way unauthenticated ones are.

## One-time setup: get a free Reddit client ID

Reddit blocks unauthenticated JSON requests from most cloud/server IP ranges,
so this app needs one free credential — just a client ID, no secret or password:

1. Go to https://www.reddit.com/prefs/apps (log in first)
2. Click **create app** (or **create another app**) at the bottom
3. Name it anything (e.g. "scroller")
4. Choose type **installed app**
5. Set "redirect uri" to anything valid, e.g. `http://localhost:3000` (required but unused)
6. Click **create app**
7. Under the app name you'll see a short string — that's your **client ID**.
   There's no secret to copy for this app type.

## Deploy to Vercel

1. Import this repo in Vercel
2. In the project's **Settings > Environment Variables**, add:
   - `REDDIT_CLIENT_ID` = the client ID from above
3. Deploy (or redeploy if you added the env var after the first deploy)

## Run locally

```bash
npm install
# create a .env.local with REDDIT_CLIENT_ID
npm run dev
```
