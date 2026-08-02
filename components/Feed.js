"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PostCard from "./PostCard";
import PostViewer from "./PostViewer";
import SortBar from "./SortBar";

export default function Feed({ subreddit = "popular", title }) {
  const [sort, setSort] = useState("hot");
  const [posts, setPosts] = useState([]);
  const [after, setAfter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const sentinelRef = useRef(null);
  const requestId = useRef(0);
  const abortRef = useRef(null);

  const loadPage = useCallback(
    async (reset) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const currentRequest = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ subreddit, sort });
        if (!reset && after) params.set("after", after);
        const res = await fetch(`/api/reddit?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (currentRequest !== requestId.current) return;
        if (!res.ok) throw new Error(data.error || "Failed to load");

        setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
        setAfter(data.after);
        setDone(!data.after);
      } catch (err) {
        if (err.name === "AbortError") return;
        if (currentRequest === requestId.current) {
          setError(err.message || "Something went wrong");
        }
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    },
    [subreddit, sort, after]
  );

  // Reset and reload whenever subreddit or sort changes
  useEffect(() => {
    setPosts([]);
    setAfter(null);
    setDone(false);
    setActiveIndex(null);
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subreddit, sort]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !done) {
          loadPage(false);
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadPage, loading, done]);

  async function goNext() {
    if (activeIndex === null) return;
    if (activeIndex < posts.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (!done && !loading) {
      await loadPage(false);
      setActiveIndex((i) => (i !== null && i < posts.length ? i + 1 : i));
    }
  }

  function goPrev() {
    setActiveIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }

  const activePost = activeIndex !== null ? posts[activeIndex] : null;

  return (
    <>
      <SortBar title={title} sort={sort} onChange={setSort} />
      <div className="container">
        <div className="post-grid">
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} onOpen={() => setActiveIndex(i)} />
          ))}
        </div>

        {error && <div className="state-msg">{error}</div>}
        {loading && <div className="spinner" />}
        {done && posts.length > 0 && (
          <div className="state-msg">You've reached the end.</div>
        )}
        {!loading && posts.length === 0 && !error && (
          <div className="state-msg">No posts found.</div>
        )}

        <div ref={sentinelRef} className="sentinel" />
      </div>

      {activePost && (
        <PostViewer
          post={activePost}
          hasPrev={activeIndex > 0}
          hasNext={activeIndex < posts.length - 1 || !done}
          onPrev={goPrev}
          onNext={goNext}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  );
}
