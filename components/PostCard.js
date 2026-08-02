"use client";

function timeAgo(unixSeconds) {
  if (!unixSeconds) return "";
  const seconds = Math.floor(Date.now() / 1000 - unixSeconds);
  const units = [
    ["y", 31536000],
    ["mo", 2592000],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];
  for (const [label, secs] of units) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val}${label} ago`;
  }
  return "just now";
}

export default function PostCard({ post }) {
  return (
    <article className="post-card">
      <div className="post-meta">
        <a href={`/r/${post.subreddit}`}>r/{post.subreddit}</a>
        {post.author && (
          <>
            <span>&middot;</span>
            <span>u/{post.author}</span>
          </>
        )}
        {post.createdUtc && (
          <>
            <span>&middot;</span>
            <span>{timeAgo(post.createdUtc)}</span>
          </>
        )}
      </div>

      <a href={post.permalink} target="_blank" rel="noreferrer">
        <div className="post-title">{post.title}</div>
      </a>

      {post.image && (
        <a href={post.permalink} target="_blank" rel="noreferrer">
          <img className="post-media" src={post.image} alt="" loading="lazy" />
        </a>
      )}

      <div className="post-footer">
        <a href={post.permalink} target="_blank" rel="noreferrer">
          View & comment on Reddit &rarr;
        </a>
      </div>
    </article>
  );
}
