"use client";

import Image from "next/image";
import { useState } from "react";

const loadedSrcs = new Set<string>();

export function prefetchMoodSrc(src: string) {
  if (loadedSrcs.has(src) || typeof window === "undefined") return;
  const img = new window.Image();
  img.decoding = "async";
  img.onload = () => loadedSrcs.add(src);
  img.src = src;
}

export function prefetchMoodSrcs(srcs: string[]) {
  for (const src of srcs) prefetchMoodSrc(src);
}

type MoodMediaProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export function MoodMedia({ src, alt, sizes, priority = false, className }: MoodMediaProps) {
  const [loaded, setLoaded] = useState(() => loadedSrcs.has(src));

  return (
    <>
      <div
        className={loaded ? "mood-skeleton is-done" : "mood-skeleton"}
        aria-hidden="true"
      />
      <Image
        key={src}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        decoding="async"
        className={loaded ? `mood-media is-loaded${className ? ` ${className}` : ""}` : `mood-media${className ? ` ${className}` : ""}`}
        onLoad={() => {
          loadedSrcs.add(src);
          setLoaded(true);
        }}
      />
    </>
  );
}
