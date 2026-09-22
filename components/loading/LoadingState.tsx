import type { ReactNode } from "react";

type Props = {
  title?: string;
  detail?: string;
  compact?: boolean;
  progress?: number;
  children?: ReactNode;
};

/** Shared loading language for page, viewer and progressive detail states. */
export function LoadingState({ title = "Opening your house", detail = "A little closer to home.", compact = false, progress, children }: Props) {
  const value = progress === undefined ? undefined : Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div className={compact ? "loading-state is-compact" : "loading-state"}>
      <div className="loading-card">
        <svg className="loading-mark" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M23 8h18v24h17v24H6V35h17V8Z" />
          <path className="loading-mark-inner" d="M23 35h18v21M41 32v-9M6 45h17" />
        </svg>
        <div className="loading-copy" role="status" aria-live="polite" aria-atomic="true">
          {!compact && <span className="loading-eyebrow">Villa Nehama</span>}
          <p className="loading-title">{title}<span aria-hidden="true">…</span></p>
          <p className="loading-detail">{detail}</p>
        </div>
        <div className={`loading-track${value === undefined ? " is-indeterminate" : ""}`} role="progressbar" aria-label="Loading assets" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
          <span style={value === undefined ? undefined : { width: `${value}%` }} />
        </div>
        {children}
      </div>
    </div>
  );
}
