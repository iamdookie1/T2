"use client";

export default function PostMedia({
  post,
  blurred,
  onReveal,
  videoControls = true,
  variant = "card",
  revealable = false,
}) {
  const hasMedia = Boolean(post.media || post.image);
  if (!hasMedia) return null;

  const displayUrl = post.media?.url || post.image;
  const isGif = displayUrl?.endsWith(".gif");

  function handleClick(e) {
    if (revealable && blurred) {
      e.preventDefault();
      e.stopPropagation();
      onReveal?.();
    }
  }

  return (
    <div className={`media-wrap media-wrap--${variant}`} onClick={handleClick}>
      {post.over18 && <span className="badge badge-nsfw">NSFW</span>}
      {!post.over18 && post.media?.type === "video" && (
        <span className="badge badge-media">VIDEO</span>
      )}
      {!post.over18 && post.media?.type !== "video" && isGif && (
        <span className="badge badge-media">GIF</span>
      )}

      {post.media?.type === "video" ? (
        <video
          className={`post-media${blurred ? " nsfw" : ""}`}
          src={post.media.url}
          controls={videoControls && !blurred}
          loop
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          className={`post-media${blurred ? " nsfw" : ""}`}
          src={displayUrl}
          alt=""
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
