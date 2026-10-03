"use client";

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  title?: string;
  detail?: string;
  compact?: boolean;
  progress?: number;
  progressLabel?: string;
  active?: boolean;
  children?: ReactNode;
};

/** Shared loading language for page, viewer and progressive detail states. */
export function LoadingState({ title = "Loading your 3D house", detail = "Downloading the viewer and preparing the full house. The first visit can take longer on your phone.", compact = false, progress, progressLabel, active = true, children }: Props) {
  const value = progress === undefined ? undefined : Math.max(0, Math.min(100, Math.floor(progress)));
  const [elapsed, setElapsed] = useState(0);
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (!active) return;
    const started = performance.now();
    const connection = () => setOnline(navigator.onLine);
    const reset = setTimeout(() => { setElapsed(0); connection(); }, 0);
    const timer = setInterval(() => setElapsed(Math.floor((performance.now() - started) / 1000)), 1000);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    return () => { clearTimeout(reset); clearInterval(timer); window.removeEventListener("online", connection); window.removeEventListener("offline", connection); };
  }, [active]);
  const caption = progressLabel ?? (value === undefined ? "Loading · please wait" : `${value}% of the current files loaded`);
  const waitNote = !active ? "" : !online ? "You are offline. Reconnect to continue loading, or open the 2D plan."
    : elapsed >= 8 ? `Loading for ${elapsed}s. Large 3D views take longer on mobile; keep this tab open.` : "";
  return (
    <div className={compact ? "loading-state is-compact" : "loading-state"}>
      <div className="loading-card">
        <div className="loading-drawing" aria-hidden="true">
          <span className="loading-drawing-caption">A STUDY IN SPACE</span>
          <svg className="loading-mark" viewBox="0 0 96 96" fill="none">
            <path className="loading-mark-guide" d="M12 8v80M84 8v80M5 16h86M5 80h86" />
            <path className="loading-mark-outline" d="M34 16h28v29h22v35H12V48h22V16Z" />
            <path className="loading-mark-inner" d="M34 48h28v32M62 45V33M12 62h22" />
            <path className="loading-mark-dimensions" d="M12 87h72M12 84v6M84 84v6" />
          </svg>
          <span className="loading-drawing-caption">VILLA NEHAMA · 01</span>
        </div>
        <div className="loading-copy" role="status" aria-live="polite" aria-atomic="true">
          {!compact && <span className="loading-eyebrow">Preparing your view</span>}
          <p className="loading-title">{title}</p>
          <p className="loading-detail">{detail}</p>
        </div>
        <div className={`loading-track${value === undefined ? " is-indeterminate" : ""}`} role="progressbar" aria-label="Loading progress" aria-valuetext={caption} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
          <span style={value === undefined ? undefined : { width: `${value}%` }} />
        </div>
        <p className="loading-progress-caption">{caption}</p>
        {(!compact || waitNote) && <p className="loading-wait-note" role={!online ? "status" : undefined}>{waitNote}</p>}
        {children}
      </div>
    </div>
  );
}
