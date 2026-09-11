"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent, type ReactNode, type WheelEvent } from "react";
import { geometryApprovalItems } from "@/data/house";
import { ArchitecturalPlan } from "./ArchitecturalPlan";

type OverlayMode = "vector" | "measured" | "proof";

function ProofPane({ children, label }: { children: ReactNode; label: string }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setPan({ x: drag.current.panX + event.clientX - drag.current.x, y: drag.current.panY + event.clientY - drag.current.y });
  };
  const reset = () => { setZoom(1); setRotation(0); setPan({ x: 0, y: 0 }); };
  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom((value) => Math.max(0.55, Math.min(4, value * (event.deltaY > 0 ? 0.92 : 1.08))));
  };
  return (
    <div className="proof-pane-wrap">
      <div className="proof-pane-tools" role="group" aria-label={`${label} alignment controls`}>
        <button type="button" onClick={() => setZoom((value) => Math.max(0.55, value - 0.15))} aria-label="Zoom out">−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(4, value + 0.15))} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => setRotation((value) => value - 1)} aria-label="Rotate counterclockwise">↶</button>
        <button type="button" onClick={() => setRotation((value) => value + 1)} aria-label="Rotate clockwise">↷</button>
        <button type="button" onClick={reset}>Reset</button>
      </div>
      <div className="proof-pane" aria-label={`${label}; drag to pan, scroll to zoom`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onWheel={onWheel}>
        <div className="proof-pane-content" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)` }}>{children}</div>
      </div>
    </div>
  );
}

export function DimensionedOverlay() {
  const [mode, setMode] = useState<OverlayMode>("vector");
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
          <div className="mode-selector" role="tablist" aria-label="Plan source views">
            <button type="button" role="tab" aria-selected={mode === "vector"} className={mode === "vector" ? "is-active" : ""} onClick={() => setMode("vector")}>
              Architect SVG
            </button>
            <button type="button" role="tab" aria-selected={mode === "measured"} className={mode === "measured" ? "is-active" : ""} onClick={() => setMode("measured")}>
              Original scan
            </button>
            <button type="button" role="tab" aria-selected={mode === "proof"} className={mode === "proof" ? "is-active" : ""} onClick={() => setMode("proof")}>
              Source proof
            </button>
          </div>
          <p className="plan-mode-note">
            {mode === "vector" && "Editable vector reconstruction · dimensions in centimetres"}
            {mode === "measured" && "Authoritative photographed field drawing"}
            {mode === "proof" && "Side-by-side audit · no false survey registration"}
          </p>
        </div>

        <div className={`comparison-stage is-${mode}`} role="tabpanel">
          {mode === "vector" && <ArchitecturalPlan idPrefix="audit" />}
          {mode === "measured" && (
            <figure className="measured-view">
              <Image src="/references/measured-plan.jpeg" alt="Original photographed handwritten measured floor plan" fill sizes="100vw" unoptimized priority />
              <figcaption>Authoritative source · photographed measured drawing</figcaption>
            </figure>
          )}
          {mode === "proof" && (
            <div className="source-proof-grid">
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
