import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

// Reddit's unauthenticated www.reddit.com/*.json endpoints (and OAuth app
// registration) now require going through Reddit's manual, often-rejected
// approval process. Its .rss feeds are a separate, long-standing feature
// that was never part of that gate and remain open with no key or signup —
// so we fetch and parse those directly instead.
export const runtime = "edge";

const REDDIT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const VALID_SORTS = new Set(["hot", "new", "top", "rising"]);
const DIRECT_IMAGE_RE = /\.(jpe?g|png|gif|gifv)$/i;
const DIRECT_VIDEO_RE = /\.(mp4|webm)$/i;

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

function detectMedia(url) {
  if (!url) return null;
  if (DIRECT_IMAGE_RE.test(url)) {
    return { type: url.endsWith(".gifv") ? "video" : "image", url: url.replace(/\.gifv$/i, ".mp4") };
  }
  if (DIRECT_VIDEO_RE.test(url)) {
    return { type: "video", url };
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

    const posts = entries.map((entry) => {
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
      const media = detectMedia(link);
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
    });

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
