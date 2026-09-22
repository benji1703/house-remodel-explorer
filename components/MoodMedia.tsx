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

function MoodMediaContent({ src, alt, sizes, priority = false, className, backdrop = false }: MoodMediaProps) {
  const [failed, setFailed] = useState(false);
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
          style={{ filter: "blur(46px) saturate(0.78) brightness(0.82)", transform: "scale(1.2)", zIndex: 0 }}
        />
      )}
      <div
        className={loaded ? "mood-skeleton is-done" : "mood-skeleton"}
        aria-hidden="true"
      />
      {failed && <span className="image-load-error" role="status">Image unavailable</span>}
      <Image
        onError={() => { setFailed(true); setLoaded(true); }}
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

/** Reset loading state when a gallery reuses its image slot. */
export function MoodMedia(props: MoodMediaProps) {
  return <MoodMediaContent key={props.src} {...props} />;
}
