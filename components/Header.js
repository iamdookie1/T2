"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const q = query.trim().replace(/^r\//, "");
    if (q) {
      router.push(`/r/${q}`);
      setQuery("");
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="logo" href="/">
          scroller
        </a>
        <form className="search-wrap" onSubmit={handleSubmit}>
          <input
            className="search-input"
            placeholder="Jump to a subreddit..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>
    </header>
  );
}
