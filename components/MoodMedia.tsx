"use client";

import Image from "next/image";
import { useRef, useState } from "react";

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
  backdrop?: boolean;
};

export function MoodMedia({ src, alt, sizes, priority = false, className, backdrop = false }: MoodMediaProps) {
  const [loaded, setLoaded] = useState(() => loadedSrcs.has(src));
  const mediaRef = useRef<HTMLImageElement | null>(null);

  return (
    <>
      {backdrop && (
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          unoptimized
          aria-hidden="true"
          className={loaded ? "mood-media-backdrop is-visible" : "mood-media-backdrop"}
        />
      )}
      <div
        className={loaded ? "mood-skeleton is-done" : "mood-skeleton"}
        aria-hidden="true"
      />
      <Image
        key={src}
        ref={mediaRef}
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
