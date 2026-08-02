"use client";

import { useEffect, useState } from "react";
import PostMedia from "./PostMedia";

export default function PostViewer({ post, hasPrev, hasNext, onPrev, onNext, onClose }) {
  const [revealNsfw, setRevealNsfw] = useState(false);

  useEffect(() => {
    setRevealNsfw(false);
  }, [post?.id]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasPrev) onPrev();
      else if (e.key === "ArrowRight" && hasNext) onNext();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [hasPrev, hasNext, onPrev, onNext, onClose]);

  if (!post) return null;

  return (
    <div className="viewer-backdrop" onClick={onClose}>
      <div className="viewer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-header">
          <div className="post-meta">
            <a className="post-sub" href={`/r/${post.subreddit}`}>
              r/{post.subreddit}
            </a>
            {post.author && <span>u/{post.author}</span>}
          </div>
          <button className="viewer-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="viewer-body">
          <div className="post-title viewer-title">{post.title}</div>

          <PostMedia
            post={post}
            blurred={post.over18 && !revealNsfw}
            onReveal={() => setRevealNsfw(true)}
            variant="viewer"
            revealable
          />

          <div className="post-footer">
            {post.domain && <span className="post-domain">{post.domain}</span>}
            <a href={post.permalink} target="_blank" rel="noreferrer">
              View & comment on Reddit &rarr;
            </a>
          </div>
        </div>

        <div className="viewer-nav">
          <button className="nav-btn" onClick={onPrev} disabled={!hasPrev}>
            &larr; Prev
          </button>
          <button className="nav-btn" onClick={onNext} disabled={!hasNext}>
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
