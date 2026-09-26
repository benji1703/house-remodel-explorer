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
          {!compact && <span className="loading-eyebrow">The architectural explorer</span>}
          <p className="loading-title">{title}</p>
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
