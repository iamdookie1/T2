"use client";

import { useState } from "react";

function timeAgo(unixSeconds) {
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
  const [revealNsfw, setRevealNsfw] = useState(false);

  return (
    <article className="post-card">
      <div className="post-meta">
        <a href={`/r/${post.subreddit}`}>r/{post.subreddit}</a>
        <span>&middot;</span>
        <span>u/{post.author}</span>
        <span>&middot;</span>
        <span>{timeAgo(post.createdUtc)}</span>
      </div>

      <a href={post.permalink} target="_blank" rel="noreferrer">
        <div className="post-title">
          {post.title}
          {post.spoiler ? " (Spoiler)" : ""}
        </div>
      </a>

      {post.isSelf && post.selftext && (
        <div className="post-body">{post.selftext}</div>
      )}

      {post.video && (
        <div className="media-wrap">
          {post.over18 && <span className="nsfw-badge">NSFW</span>}
          <video
            className="post-media"
            src={post.video}
            controls
            playsInline
            preload="metadata"
          />
        </div>
      )}

      {!post.video && post.image && (
        <div className="media-wrap">
          {post.over18 && <span className="nsfw-badge">NSFW</span>}
          <a href={post.permalink} target="_blank" rel="noreferrer">
            <img
              className={`post-media${
                post.over18 && !revealNsfw ? " nsfw" : ""
              }`}
              src={post.image}
              alt=""
              loading="lazy"
              onClick={(e) => {
                if (post.over18 && !revealNsfw) {
                  e.preventDefault();
                  setRevealNsfw(true);
                }
              }}
            />
          </a>
        </div>
      )}

      <div className="post-footer">
        <span className="score">&uarr; {post.score.toLocaleString()}</span>
        <a href={post.permalink} target="_blank" rel="noreferrer">
          {post.numComments.toLocaleString()} comments
        </a>
        <span>{post.domain}</span>
      </div>
    </article>
  );
}
