import { NextResponse } from "next/server";
import { getAccessToken, REDDIT_UA } from "@/lib/redditAuth";

const VALID_SORTS = new Set(["hot", "new", "top", "rising"]);

// Reddit's unauthenticated www.reddit.com/*.json endpoints return 403 for most
// cloud/datacenter IP ranges (including Vercel's), so we go through Reddit's
// free "application-only" OAuth flow and hit oauth.reddit.com instead. This
// still runs entirely server-side in this route — nothing to host separately.
async function fetchReddit(path, params) {
  const token = await getAccessToken();
  const url = `https://oauth.reddit.com${path}?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": REDDIT_UA,
    },
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`Reddit responded with ${res.status}`);
  }
  return res.json();
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "listing";

  try {
    if (mode === "search") {
      const q = (searchParams.get("q") || "").trim();
      if (!q) return NextResponse.json({ subreddits: [] });

      const searchParamsOut = new URLSearchParams({
        q,
        limit: "8",
        include_over_18: "off",
      });
      const data = await fetchReddit("/subreddits/search", searchParamsOut);
      const subreddits = (data?.data?.children || []).map((c) => ({
        name: c.data.display_name,
        title: c.data.title,
        subscribers: c.data.subscribers,
        icon: c.data.community_icon?.split("?")[0] || c.data.icon_img || null,
      }));
      return NextResponse.json({ subreddits });
    }

    // mode === "listing"
    const subreddit = (searchParams.get("subreddit") || "popular").replace(
      /[^a-zA-Z0-9_+]/g,
      ""
    );
    let sort = searchParams.get("sort") || "hot";
    if (!VALID_SORTS.has(sort)) sort = "hot";
    const after = searchParams.get("after") || "";
    const t = searchParams.get("t") || ""; // time window, only used for "top"

    const params = new URLSearchParams();
    params.set("limit", "25");
    params.set("raw_json", "1");
    if (after) params.set("after", after);
    if (sort === "top" && t) params.set("t", t);

    const data = await fetchReddit(`/r/${subreddit}/${sort}`, params);

    const children = data?.data?.children || [];
    const posts = children
      .filter((c) => c.kind === "t3" && !c.data.promoted)
      .map((c) => {
        const d = c.data;
        let image = null;
        let video = null;

        if (d.is_video && d.media?.reddit_video?.fallback_url) {
          video = d.media.reddit_video.fallback_url;
        }

        const previewImg = d.preview?.images?.[0];
        if (previewImg) {
          image = previewImg.source?.url?.replace(/&amp;/g, "&") || null;
        } else if (
          d.post_hint === "image" ||
          /\.(jpg|jpeg|png|gif)$/i.test(d.url || "")
        ) {
          image = d.url;
        } else if (
          d.thumbnail &&
          d.thumbnail.startsWith("http") &&
          !["self", "default", "nsfw", "spoiler"].includes(d.thumbnail)
        ) {
          image = d.thumbnail;
        }

        return {
          id: d.id,
          title: d.title,
          subreddit: d.subreddit,
          author: d.author,
          score: d.score,
          numComments: d.num_comments,
          createdUtc: d.created_utc,
          permalink: `https://www.reddit.com${d.permalink}`,
          url: d.url,
          isSelf: d.is_self,
          selftext: d.is_self ? (d.selftext || "").slice(0, 500) : "",
          over18: d.over_18,
          spoiler: d.spoiler,
          stickied: d.stickied,
          image,
          video,
          domain: d.domain,
        };
      });

    return NextResponse.json({
      posts,
      after: data?.data?.after || null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch from Reddit" },
      { status: 502 }
    );
  }
}
