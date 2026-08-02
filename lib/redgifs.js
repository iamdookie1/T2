// Redgifs (which gfycat now redirects to) hosts most Reddit-linked gifs and
// doesn't expose a direct file URL from its watch-page link — resolving one
// needs their own free public API (a guest token, no signup, unrelated to
// Reddit's gated one). Failures here should just mean "skip embedding," never
// break the post.
let cached = { token: null, expiresAt: 0 };

async function getGuestToken() {
  if (cached.token && Date.now() < cached.expiresAt) return cached.token;

  const res = await fetch("https://api.redgifs.com/v2/auth/temporary", {
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`redgifs auth ${res.status}`);
  const data = await res.json();
  cached = {
    token: data.token,
    expiresAt: Date.now() + ((data.expires || 3600) - 60) * 1000,
  };
  return cached.token;
}

export async function resolveRedgifs(id) {
  try {
    const token = await getGuestToken();
    const res = await fetch(`https://api.redgifs.com/v2/gifs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const urls = data?.gif?.urls;
    return urls?.hd || urls?.sd || null;
  } catch {
    return null;
  }
}
