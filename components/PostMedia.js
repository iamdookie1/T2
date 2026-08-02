"use client";

import { useEffect, useState } from "react";

export default function PostMedia({
  post,
  blurred,
  onReveal,
  videoControls = true,
  variant = "card",
  revealable = false,
}) {
  // Some hosts (v.redd.it, imgur, ...) don't give us a confirmed-working
  // direct URL, only a best-guess list — cascade through them on error.
  const candidates = post.media?.urls || (post.image ? [post.image] : []);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
  }, [post.id]);

  if (candidates.length === 0 || attempt >= candidates.length) return null;

  const displayUrl = candidates[attempt];
  const isVideo = post.media?.type === "video";
  const isGif = !isVideo && displayUrl.endsWith(".gif");

  function handleClick(e) {
    if (revealable && blurred) {
      e.preventDefault();
      e.stopPropagation();
      onReveal?.();
    }
  }

  function handleError() {
    setAttempt((i) => i + 1);
  }

  return (
    <div className={`media-wrap media-wrap--${variant}`} onClick={handleClick}>
      {post.over18 && <span className="badge badge-nsfw">NSFW</span>}
      {!post.over18 && isVideo && <span className="badge badge-media">VIDEO</span>}
      {!post.over18 && isGif && <span className="badge badge-media">GIF</span>}

      {isVideo ? (
        <video
          key={displayUrl}
          className={`post-media${blurred ? " nsfw" : ""}`}
          src={displayUrl}
          controls={videoControls && !blurred}
          loop
          muted
          playsInline
          preload="metadata"
          onError={handleError}
        />
      ) : (
        <img
          key={displayUrl}
          className={`post-media${blurred ? " nsfw" : ""}`}
          src={displayUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={handleError}
        />
      )}
    </div>
  );
}
