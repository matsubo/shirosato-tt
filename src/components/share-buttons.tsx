"use client";

import { useEffect, useState } from "react";

export function ShareButtons() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
    setTitle(document.title);
  }, []);

  if (!url) return null;

  const xUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const hatenaUrl = `https://b.hatena.ne.jp/entry/s/${url.replace(/^https?:\/\//, "")}`;

  return (
    <div className="flex items-center gap-2">
      {/* X (Twitter) Share */}
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-black"
        aria-label="Share on X"
      >
        <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Post
      </a>

      {/* Hatena Bookmark */}
      <a
        href={hatenaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-md bg-[#00A4DE] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-80"
        aria-label="Hatena Bookmark"
      >
        <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.47 2H3.53A1.45 1.45 0 0 0 2 3.38v17.24A1.45 1.45 0 0 0 3.53 22h16.94A1.45 1.45 0 0 0 22 20.62V3.38A1.45 1.45 0 0 0 20.47 2zM8.61 17.44a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0-4.94H7.11V6h1.5v6.5zm7.78 4.94h-4.5v-1.5h1.5v-5h-1.5V9.44h3v6h1.5v1.5z" />
        </svg>
        Bookmark
      </a>
    </div>
  );
}
