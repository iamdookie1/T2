export const REDDIT_UA = "web:reddit-scroller:v1.0 (by /u/reddit-scroller-app)";

let cached = { token: null, expiresAt: 0 };

export async function getAccessToken() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET environment variables"
    );
  }

  if (cached.token && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": REDDIT_UA,
    },
    body: "grant_type=client_credentials",
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
