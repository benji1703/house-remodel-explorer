"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/** Reserved image slots reveal independently, including cached and failed loads. */
export function LoadingImage({ onLoad, onError, style, alt, className, ...props }: ImageProps) {
  const source = typeof props.src === "string" ? props.src : "src" in props.src ? props.src.src : props.src.default.src;
  const [loaded, setLoaded] = useState("");
  const [failed, setFailed] = useState("");
  const ready = loaded === source;
  return <>
    {!ready && <span className="image-loading-placeholder" aria-hidden="true" />}
    {failed === source && <span className="image-load-error" role="status">Image unavailable</span>}
    <Image {...props} alt={alt} className={`loading-image${className ? ` ${className}` : ""}`} style={{ ...style, opacity: ready ? style?.opacity ?? 1 : 0 }}
      onLoad={(event) => { setLoaded(source); onLoad?.(event); }}
      onError={(event) => { setLoaded(source); setFailed(source); onError?.(event); }}
    />
  </>;
}
