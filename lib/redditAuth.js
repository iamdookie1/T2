export const REDDIT_UA = "web:reddit-scroller:v1.0 (by /u/reddit-scroller-app)";

let cached = { token: null, expiresAt: 0 };

// "Installed app" application-only OAuth: only a client ID is needed, no
// secret, since installed apps can't safely keep a secret confidential.
// https://github.com/reddit-archive/reddit/wiki/OAuth2#application-only-oauth
export async function getAccessToken() {
  const clientId = process.env.REDDIT_CLIENT_ID;

  if (!clientId) {
    throw new Error("Missing REDDIT_CLIENT_ID environment variable");
  }

  if (cached.token && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const basicAuth = Buffer.from(`${clientId}:`).toString("base64");

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": REDDIT_UA,
    },
    body: "grant_type=https%3A%2F%2Foauth.reddit.com%2Fgrants%2Finstalled_client&device_id=DEFAULT",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Reddit auth failed with ${res.status}`);
  }

  const data = await res.json();
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cached.token;
}
