"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { geometryApprovalItems } from "@/data/house";
import { ArchitecturalPlan } from "./ArchitecturalPlan";

type OverlayMode = "vector" | "measured" | "proof";
type ProofLayout = "side-by-side" | "stacked";

function ProofPane({ children, label }: { children: ReactNode; label: string }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panEnabled, setPanEnabled] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const drag = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || (event.pointerType === "touch" && !panEnabled)) return;
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    setPan({ x: drag.current.panX + event.clientX - drag.current.x, y: drag.current.panY + event.clientY - drag.current.y });
  };
  const reset = () => { setZoom(1); setRotation(0); setPan({ x: 0, y: 0 }); };
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const onWheel = (event: WheelEvent) => {
      // Leave page scrolling and browser pinch-to-zoom available until the
      // user explicitly focuses this drawing. React wheel listeners are passive.
      if (document.activeElement !== pane || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      setZoom((value) => Math.max(0.55, Math.min(4, value * (event.deltaY > 0 ? 0.92 : 1.08))));
    };
    pane.addEventListener("wheel", onWheel, { passive: false });
    return () => pane.removeEventListener("wheel", onWheel);
  }, []);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const step = event.shiftKey ? 60 : 20;
    const offset = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (offset) {
      event.preventDefault();
      setPan((value) => ({ x: value.x + offset[0], y: value.y + offset[1] }));
    } else if (["+", "=", "-", "Home"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "Home") reset();
      else setZoom((value) => Math.max(0.55, Math.min(4, value + (event.key === "-" ? -0.15 : 0.15))));
    }
  };
  return (
    <div className="proof-pane-wrap">
      <div className="proof-pane-tools" role="group" aria-label={`${label} alignment controls`}>
        <button type="button" disabled={zoom <= 0.55} onClick={() => setZoom((value) => Math.max(0.55, value - 0.15))} aria-label={`Zoom out ${label}`}>−</button>
        <span aria-live="polite" aria-atomic="true">{Math.round(zoom * 100)}%</span>
        <button type="button" disabled={zoom >= 4} onClick={() => setZoom((value) => Math.min(4, value + 0.15))} aria-label={`Zoom in ${label}`}>+</button>
        <button type="button" onClick={() => setRotation((value) => value - 1)} aria-label={`Rotate ${label} counterclockwise`}>↶</button>
        <button type="button" onClick={() => setRotation((value) => value + 1)} aria-label={`Rotate ${label} clockwise`}>↷</button>
        <button type="button" onClick={reset}>Reset</button>
        <button type="button" aria-pressed={panEnabled} onClick={() => setPanEnabled((value) => !value)}>Pan drawing</button>
      </div>
      <p id={hintId} className="sr-only">Arrow keys pan; plus and minus zoom; Home resets. Enable Pan drawing to drag with one finger. Otherwise swipe to scroll the page or pinch to magnify it. Rotation {rotation} degrees.</p>
      <div ref={paneRef} className={`proof-pane${panEnabled ? " is-panning" : ""}`} role="region" tabIndex={0} aria-label={label} aria-describedby={hintId} onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
        <div className="proof-pane-content" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)` }}>{children}</div>
      </div>
    </div>
  );
}

export function DimensionedOverlay() {
  const [mode, setMode] = useState<OverlayMode>("vector");
  const [proofLayout, setProofLayout] = useState<ProofLayout>("side-by-side");
  const tabsId = useId();
  const modes: { id: OverlayMode; label: string }[] = [{ id: "vector", label: "Architect SVG" }, { id: "measured", label: "Original scan" }, { id: "proof", label: "Source proof" }];
  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const index = modes.findIndex((item) => item.id === mode);
    const next = event.key === "Home" ? 0 : event.key === "End" ? modes.length - 1 : event.key === "ArrowRight" ? (index + 1) % modes.length : event.key === "ArrowLeft" ? (index + modes.length - 1) % modes.length : -1;
    if (next < 0) return;
    event.preventDefault();
    setMode(modes[next].id);
    event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='tab']")[next]?.focus();
  };
  const unresolved = geometryApprovalItems.filter((item) => !item.approved);
  const unresolvedByCategory = unresolved.reduce(
    (acc, item) => {
      (acc[item.category] ||= []).push(item);
      return acc;
    },
    {} as Record<string, typeof unresolved>,
  );

  return (
    <div className="dimensioned-overlay-container">
      <div className="overlay-comparison">
        <div className="plan-provenance">
          <span className="plan-ai-mark" aria-hidden="true">AI</span>
          <div>
            <p>AI-assisted architectural reconstruction</p>
            <span>
              Native SVG paths derived from <strong>measured-plan.jpeg</strong>, then checked against the accepted
              340 + 420 + 380 and 830 + 380 dimension chains.
            </span>
          </div>
          <span className="plan-file-type">SVG · A-01</span>
        </div>

        <div className="comparison-controls">
          <div className="mode-selector" role="tablist" aria-label="Plan source views" onKeyDown={onTabKeyDown}>
            {modes.map((item) => <button key={item.id} id={`${tabsId}-${item.id}`} type="button" role="tab" aria-selected={mode === item.id} aria-controls={`${tabsId}-panel`} tabIndex={mode === item.id ? 0 : -1} className={mode === item.id ? "is-active" : ""} onClick={() => setMode(item.id)}>{item.label}</button>)}
          </div>
          <p className="plan-mode-note">
            {mode === "vector" && "Editable vector reconstruction · dimensions in centimetres"}
            {mode === "measured" && "Authoritative photographed field drawing"}
            {mode === "proof" && "Side-by-side audit · no false survey registration"}
          </p>
          {mode === "proof" && (
            <div className="proof-layout-switch" role="group" aria-label="Source proof layout">
              <button type="button" className={proofLayout === "side-by-side" ? "is-active" : ""} aria-pressed={proofLayout === "side-by-side"} onClick={() => setProofLayout("side-by-side")}>Side by side</button>
              <button type="button" className={proofLayout === "stacked" ? "is-active" : ""} aria-pressed={proofLayout === "stacked"} onClick={() => setProofLayout("stacked")}>Stacked</button>
            </div>
          )}
        </div>

        <div className={`comparison-stage is-${mode}`} role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-${mode}`} tabIndex={0}>
          {mode === "vector" && <ArchitecturalPlan idPrefix="audit" />}
          {mode === "measured" && (
            <figure className="measured-view">
              <Image src="/references/measured-plan.jpeg" alt="Original photographed handwritten measured floor plan" fill sizes="100vw" unoptimized priority />
              <figcaption>Authoritative source · photographed measured drawing</figcaption>
            </figure>
          )}
          {mode === "proof" && (
            <div className={`source-proof-grid is-${proofLayout}`}>
              <figure>
                <ProofPane label="Original field drawing">
                <div className="source-proof-media source-scan">
                  <Image src="/references/measured-plan.jpeg" alt="Original photographed measured plan" fill sizes="(max-width: 800px) 100vw, 42vw" unoptimized />
                </div>
                </ProofPane>
                <figcaption><b>01</b> Original field drawing</figcaption>
              </figure>
              <figure>
                <ProofPane label="AI-assisted SVG reconstruction">
                <div className="source-proof-media source-svg"><ArchitecturalPlan idPrefix="proof" /></div>
                </ProofPane>
                <figcaption><b>02</b> AI-assisted SVG reconstruction</figcaption>
              </figure>
            </div>
          )}
        </div>
      </div>

      <aside className="approval-checklist">
        <div className="checklist-header">
          <h3>{unresolved.length === 0 ? "Geometry ledger" : "Open survey questions"}</h3>
          <span className={unresolved.length === 0 ? "resolved-count" : "unresolved-count"}>
            {unresolved.length === 0 ? "Closed" : `${unresolved.length} open`}
          </span>
        </div>

        <div className="plan-metric"><span>Footprint envelope</span><strong>11.40 × 12.10 m</strong></div>
        <div className="plan-metric"><span>Working wall build-up</span><strong>20 / 10 cm</strong></div>
        <div className="plan-metric"><span>Drawing basis</span><strong>Plan north · one FFL</strong></div>

        {unresolved.length === 0 ? (
          <div className="checklist-closed">
            <p>
              The working model follows every readable measured chain, including the west jog
              <strong> 830 + 380 = 1210</strong>. Standard single-storey assumptions fill only the items explicitly
              closed in the geometry ledger.
            </p>
            <p>
              This is a design-audit SVG, not a construction set. Elevations, site verification and a true-north
              bearing remain required before build documents.
            </p>
          </div>
        ) : (
          <div className="checklist-categories">
            {Object.entries(unresolvedByCategory).map(([category, items]) => (
              <div key={category} className="category-group">
                <div className="category-header">
                  <span className="category-name">
                    {category.replace(/-/g, " ").charAt(0).toUpperCase() + category.replace(/-/g, " ").slice(1)}
                  </span>
                  <span className="unresolved-badge">{items.length}</span>
                </div>
                <div className="category-items">
                  {items.map((item) => (
                    <div key={item.id} className="approval-item">
                      <strong>{item.description}</strong>
                      {item.zone && <em> ({item.zone})</em>}
                      {item.notes && <p className="item-notes">{item.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="checklist-footnote">Provenance and decisions live in <code>docs/GEOMETRY_AUDIT.md</code>.</p>
      </aside>
    </div>
  );
}
