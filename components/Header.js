"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/reddit?mode=search&q=${encodeURIComponent(q)}`
        );
        const data = await res.json();
        setSuggestions(data.subreddits || []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function goToSubreddit(name) {
    setOpen(false);
    setQuery("");
    router.push(`/r/${name}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const q = query.trim().replace(/^r\//, "");
    if (q) goToSubreddit(q);
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="logo" href="/">
          scroller
        </a>
        <form className="search-wrap" ref={wrapRef} onSubmit={handleSubmit}>
          <input
            className="search-input"
            placeholder="Jump to a subreddit..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length && setOpen(true)}
          />
          {open && suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((s) => (
                <div
                  key={s.name}
                  className="suggestion-item"
                  onClick={() => goToSubreddit(s.name)}
                >
                  {s.icon ? (
                    <img className="suggestion-icon" src={s.icon} alt="" />
                  ) : (
                    <div className="suggestion-icon" />
                  )}
                  <div>
                    <div className="suggestion-name">r/{s.name}</div>
                    <div className="suggestion-subs">
                      {s.subscribers?.toLocaleString() || 0} members
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </header>
  );
}
