"use client";

import { memo } from "react";
import PostMedia from "./PostMedia";

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

function PostCard({ post, onOpen }) {
  return (
    <article className="post-card">
      <button className="post-card-hit" onClick={onOpen}>
        <div className="post-meta">
          <span className="post-sub">r/{post.subreddit}</span>
          {post.author && <span>u/{post.author}</span>}
          {post.createdUtc && <span>{timeAgo(post.createdUtc)}</span>}
        </div>

        <div className="post-title">{post.title}</div>

        <PostMedia post={post} blurred={post.over18} videoControls={false} />

        <div className="post-footer">
          {post.domain && <span className="post-domain">{post.domain}</span>}
          <span className="post-cta">Open post &rarr;</span>
        </div>
      </button>
    </article>
  );
}

export default memo(PostCard);
