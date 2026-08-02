import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { resolveRedgifs } from "@/lib/redgifs";

// Reddit's unauthenticated www.reddit.com/*.json endpoints (and OAuth app
// registration) now require going through Reddit's manual, often-rejected
// approval process. Its .rss feeds are a separate, long-standing feature
// that was never part of that gate and remain open with no key or signup —
// so we fetch and parse those directly instead.
export const runtime = "edge";

const REDDIT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const VALID_SORTS = new Set(["hot", "new", "top", "rising"]);
const DIRECT_IMAGE_RE = /\.(jpe?g|png|gif)$/i;
const DIRECT_VIDEO_RE = /\.(mp4|webm)$/i;
const REDDIT_VIDEO_HEIGHTS = [1080, 720, 480, 360, 240];

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function textOf(node) {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  return node["#text"] ?? "";
}

function firstOf(node) {
  return Array.isArray(node) ? node[0] : node;
}

function decodeEntities(str) {
  return (str || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function firstImage(html) {
  const match = /<img[^>]+src="([^"]+)"/i.exec(html || "");
  return match ? decodeEntities(match[1]) : null;
}

function externalLink(html) {
  const match = /<a href="([^"]+)">\[link\]<\/a>/i.exec(html || "");
  return match ? decodeEntities(match[1]) : null;
}

// Best-effort only: Reddit strips/filters real NSFW media for logged-out
// RSS requests rather than flagging it cleanly, so this can't be fully
// reliable. It catches the common conventions (title tags, marked-up text).
function looksNsfw(title, html) {
  return /\bnsfw\b/i.test(title) || /\bnsfw\b/i.test(html || "");
}

// The RSS content's embedded thumbnail is always tiny (Reddit's own CDN
// preview, ~140px). The external "[link]" URL is usually the real source —
// this resolves the common hosting patterns to actual playable/full-res
// files without needing Reddit's gated JSON/OAuth API. Anything else (plain
// article links, imgur albums, etc.) falls back to the small thumbnail.
async function resolveMedia(link) {
  if (!link) return null;

  let url;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  const segments = url.pathname.split("/").filter(Boolean);

  // Reddit/self-hosted direct files are already full quality as-is.
  if (DIRECT_VIDEO_RE.test(link)) return { type: "video", urls: [link] };
  if (/\.gifv$/i.test(link)) return { type: "video", urls: [link.replace(/\.gifv$/i, ".mp4")] };
  if (DIRECT_IMAGE_RE.test(link)) return { type: "image", urls: [link] };

  // Reddit-hosted video: no direct file URL is given, but the fallback DASH
  // files follow a predictable pattern — try common resolutions in order.
  if (host === "v.redd.it" && segments[0]) {
    return {
      type: "video",
      urls: REDDIT_VIDEO_HEIGHTS.map((h) => `https://v.redd.it/${segments[0]}/DASH_${h}.mp4`),
    };
  }

  // Imgur's single-image pages resolve to a direct file at i.imgur.com by ID;
  // albums/galleries don't map to a single file, so leave those alone.
  if (host === "imgur.com" && segments.length === 1 && segments[0] !== "a" && segments[0] !== "gallery") {
    const id = segments[0];
    return { type: "image", urls: [`https://i.imgur.com/${id}.jpg`, `https://i.imgur.com/${id}.png`, `https://i.imgur.com/${id}.gif`] };
  }

  // Gfycat now redirects to Redgifs; both use the same ID-based lookup.
  if (host === "redgifs.com" || host === "gfycat.com") {
    const id = segments[segments.length - 1];
    if (id) {
      const resolved = await resolveRedgifs(id);
      if (resolved) return { type: "video", urls: [resolved] };
    }
  }

  return null;
}

async function fetchFeed(path, params) {
  const url = `https://www.reddit.com${path}?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": REDDIT_UA,
      Accept: "application/atom+xml, application/xml, text/xml",
    },
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`Reddit responded with ${res.status}`);
  }
  return parser.parse(await res.text());
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const subreddit = (searchParams.get("subreddit") || "popular").replace(
    /[^a-zA-Z0-9_+]/g,
    ""
  );
  let sort = searchParams.get("sort") || "hot";
  if (!VALID_SORTS.has(sort)) sort = "hot";
  const after = searchParams.get("after") || "";
  const t = searchParams.get("t") || "";

  const params = new URLSearchParams();
  params.set("limit", "25");
  if (after) params.set("after", after);
  if (sort === "top" && t) params.set("t", t);

  try {
    const data = await fetchFeed(`/r/${subreddit}/${sort}.rss`, params);
    const rawEntries = data?.feed?.entry;
    const entries = rawEntries ? (Array.isArray(rawEntries) ? rawEntries : [rawEntries]) : [];

    const posts = await Promise.all(
      entries.map(async (entry) => {
        const html = textOf(entry.content);
        const author = textOf(entry.author?.name).replace(/^\/u\//, "");
        const permalink = firstOf(entry.link)?.["@_href"] || "";
        const category = firstOf(entry.category);
        const publishedRaw = textOf(entry.published) || textOf(entry.updated);
        const createdUtc = publishedRaw
          ? Math.floor(new Date(publishedRaw).getTime() / 1000)
          : null;
        const title = textOf(entry.title);
        const link = externalLink(html);
        const media = await resolveMedia(link);
        const image = media ? null : firstImage(html);

        let domain = null;
        try {
          if (link) domain = new URL(link).hostname.replace(/^www\./, "");
        } catch {
          domain = null;
        }

        return {
          id: textOf(entry.id),
          title,
          subreddit: category?.["@_term"] || subreddit,
          author,
          createdUtc,
          permalink,
          image,
          media,
          domain,
          over18: looksNsfw(title, html),
        };
      })
    );

    return NextResponse.json(
      {
        posts,
        after: posts.length ? posts[posts.length - 1].id : null,
      },
      { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=120" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch from Reddit" },
      { status: 502 }
    );
  }
}
