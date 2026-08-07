"use client";

import Image from "next/image";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { house, statusCopy, type ZoneId } from "@/data/house";
import { DimensionedOverlay } from "./DimensionedOverlay";

const MeasuredHouseScene = lazy(() =>
  import("./MeasuredHouseScene").then((module) => ({
    default: module.MeasuredHouseScene,
  })),
);

type View = "model" | "plan" | "references";

const Icon = ({ name }: { name: "home" | "cube" | "layers" | "grid" | "sun" }) => {
  const paths = {
    home: "M3 11.5 12 4l9 7.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-8Z M9 21v-6h6v6",
    cube: "m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z M4 7.5l8 4.5 8-4.5M12 12v9",
    layers: "m4 8 8-4 8 4-8 4-8-4Zm0 4 8 4 8-4M4 16l8 4 8-4",
    grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42M7.06 16.94l-1.42 1.42",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
};

function VectorPlan({ selected, onSelect }: { selected: ZoneId; onSelect: (id: ZoneId) => void }) {
  return (
    <div className="vector-plan-wrap">
      <svg className="vector-plan" viewBox="-90 -100 1320 1410" role="img" aria-label="Measured floor plan audit">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(43,48,40,.08)" strokeWidth="2" />
          </pattern>
        </defs>
        <rect x="-90" y="-100" width="1320" height="1410" fill="url(#grid)" />
        <path
          className="plan-shell"
          d="M340 0H760V500H1140V1210H0V820H340Z"
        />
        {house.zones.map((zone) => (
          <g
            key={zone.id}
            className={selected === zone.id ? "plan-zone is-selected" : "plan-zone"}
            onClick={() => onSelect(zone.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelect(zone.id);
            }}
          >
            <rect
              x={zone.x * 100 + 8}
              y={zone.z * 100 + 8}
              width={zone.width * 100 - 16}
              height={zone.depth * 100 - 16}
              rx="12"
            />
            <text x={(zone.x + zone.width / 2) * 100} y={(zone.z + zone.depth / 2) * 100}>
              {zone.shortLabel}
            </text>
          </g>
        ))}
        <g className="dimension-line top-dimension">
          <line x1="0" y1="-45" x2="1140" y2="-45" />
          <line x1="0" y1="-65" x2="0" y2="-25" />
          <line x1="1140" y1="-65" x2="1140" y2="-25" />
          <text x="570" y="-60">11.40 m maximum width</text>
        </g>
        <g className="dimension-line side-dimension">
          <line x1="1185" y1="0" x2="1185" y2="1210" />
          <line x1="1165" y1="0" x2="1205" y2="0" />
          <line x1="1165" y1="1210" x2="1205" y2="1210" />
          <text x="1205" y="605" transform="rotate(90 1205 605)">12.10 m maximum depth</text>
        </g>
      </svg>
      <div className="plan-scale"><span /> 1 grid square = 1 m</div>
    </div>
  );
}

export function HouseExplorer() {
  const [view, setView] = useState<View>("model");
  const [selectedZone, setSelectedZone] = useState<ZoneId>("north-extension");
  const [designMode, setDesignMode] = useState(true);
  const [quality, setQuality] = useState<"high" | "light">("high");
  const [webglSupport, setWebglSupport] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const isSmall = window.matchMedia("(max-width: 760px)").matches;
      const saveData = "connection" in navigator && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
      if (isSmall || saveData) setQuality("light");
      const canvas = document.createElement("canvas");
      setWebglSupport(Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const active = useMemo(
    () => house.zones.find((zone) => zone.id === selectedZone) ?? house.zones[0],
    [selectedZone],
  );

  return (
    <main className="explorer-shell">
      <aside className="side-rail" aria-label="Primary navigation">
        <a className="brand-mark" href="#top" aria-label="House remodel home">H<span>01</span></a>
        <nav>
          <button className="rail-button is-active" aria-label="House overview"><Icon name="home" /></button>
          <button className="rail-button" aria-label="3D explorer" onClick={() => setView("model")}><Icon name="cube" /></button>
          <button className="rail-button" aria-label="Measured plan" onClick={() => setView("plan")}><Icon name="grid" /></button>
          <button className="rail-button" aria-label="Reference materials" onClick={() => setView("references")}><Icon name="layers" /></button>
        </nav>
        <button className="rail-button rail-bottom" aria-label="Design mode" onClick={() => setDesignMode((value) => !value)}><Icon name="sun" /></button>
      </aside>

      <section className="workspace" id="top">
        <header className="topbar">
          <div>
            <p className="eyebrow">Private architecture record</p>
            <h1>House Remodel <span>/ Geometry 01</span></h1>
          </div>
          <div className="topbar-actions">
            <span className="status-pill"><i /> Source controlled</span>
            <button className="quality-button" onClick={() => setQuality((value) => value === "high" ? "light" : "high")}>
              {quality === "high" ? "High detail" : "Light mode"}
            </button>
          </div>
        </header>

        <div className="view-tabs" role="tablist" aria-label="Explorer views">
          <button className={view === "model" ? "is-active" : ""} onClick={() => setView("model")} role="tab">3D shell</button>
          <button className={view === "plan" ? "is-active" : ""} onClick={() => setView("plan")} role="tab">Plan audit</button>
          <button className={view === "references" ? "is-active" : ""} onClick={() => setView("references")} role="tab">Visual references</button>
        </div>

        <div className="content-grid">
          <section className="stage-card">
            {view === "model" && (
              <>
                <div className="stage-copy">
                  <span className="overline">Measured shell draft</span>
                  <h2>Orbit the real footprint</h2>
                  <p>Drag to orbit · scroll to zoom · select a zone</p>
                </div>
                <div className="mode-toggle" aria-label="Model appearance">
                  <button className={!designMode ? "is-active" : ""} onClick={() => setDesignMode(false)}>Survey</button>
                  <button className={designMode ? "is-active" : ""} onClick={() => setDesignMode(true)}>Material study</button>
                </div>
                <div className="three-stage">
                  {webglSupport === true && (
                    <Suspense fallback={<div className="model-loading">Loading 3D shell…</div>}>
                      <MeasuredHouseScene selectedZone={selectedZone} onSelectZone={setSelectedZone} designMode={designMode} quality={quality} />
                    </Suspense>
                  )}
                  {webglSupport === false && (
                    <div className="webgl-fallback">
                      <VectorPlan selected={selectedZone} onSelect={setSelectedZone} />
                      <p>Interactive plan fallback · 3D is unavailable on this device</p>
                    </div>
                  )}
                  {webglSupport === null && <div className="model-loading">Preparing measured shell…</div>}
                </div>
                <div className="orientation"><b>N</b><span /></div>
                <div className="stage-note">Outer shell: dimensioned source · Internal blocks: audit overlay</div>
              </>
            )}

            {view === "plan" && (
              <div className="plan-view">
                <div className="stage-copy plan-copy">
                  <span className="overline">Measured vs. vector trace</span>
                  <h2>Dimension audit</h2>
                  <p>Compare authoritative photograph with vector reconstruction and approve unresolved geometry.</p>
                </div>
                <DimensionedOverlay />
              </div>
            )}

            {view === "references" && (
              <div className="references-view">
                <div className="stage-copy reference-copy">
                  <span className="overline">Mood, not geometry</span>
                  <h2>Visual direction</h2>
                  <p>These boards inform finishes and atmosphere only.</p>
                </div>
                <div className="reference-grid">
                  <figure className="reference-main">
                    <Image src="/references/outdoor-moodboard.png" alt="Warm outdoor and indoor living moodboard" fill sizes="(max-width: 900px) 100vw, 64vw" priority unoptimized />
                    <figcaption>Outdoor living · material direction</figcaption>
                  </figure>
                  <figure>
                    <Image src="/references/design-reference.png" alt="Scandinavian house design reference board" fill sizes="(max-width: 900px) 100vw, 30vw" unoptimized />
                    <figcaption>Design language · proportions rejected</figcaption>
                  </figure>
                </div>
              </div>
            )}
          </section>

          <aside className="inspector" aria-live="polite">
            <div className="inspector-head">
              <span className={`source-tag ${active.status}`}>{statusCopy[active.status]}</span>
              <span className="zone-number">{String(house.zones.findIndex((zone) => zone.id === active.id) + 1).padStart(2, "0")}</span>
            </div>
            <p className="eyebrow">Selected zone</p>
            <h2>{active.label}</h2>
            <p className="zone-description">{active.description}</p>

            <dl className="measure-list">
              <div><dt>Outer width</dt><dd>{Math.round(active.width * 100)} cm</dd></div>
              <div><dt>Outer depth</dt><dd>{Math.round(active.depth * 100)} cm</dd></div>
              <div><dt>Area envelope</dt><dd>{(active.width * active.depth).toFixed(1)} m²</dd></div>
              <div><dt>Source</dt><dd>{active.status === "measured" ? "Written dimension" : "Plan trace"}</dd></div>
            </dl>

            <div className="accuracy-card">
              <div className="accuracy-title"><span>Geometry rule</span><b>Locked</b></div>
              <p>The handwritten measured plan controls walls and footprint. Presentation boards cannot change geometry.</p>
            </div>

            <a className="source-link" href="/references/measured-plan.jpeg" target="_blank" rel="noreferrer">
              <span className="source-thumbnail"><Image src="/references/measured-plan.jpeg" alt="Original handwritten measured floor plan" fill sizes="72px" unoptimized /></span>
              <span><small>Authoritative source</small>Open measured drawing</span>
              <b>↗</b>
            </a>
          </aside>
        </div>

        <section className="zone-strip" aria-label="House zones">
          <div className="strip-heading">
            <div><p className="eyebrow">Geometry ledger</p><h2>Seven audited zones</h2></div>
            <p>Room names below are the owner&apos;s proposed program. Wall positions, openings, and thicknesses stay provisional until the geometry audit is approved.</p>
          </div>
          <div className="zone-cards">
            {house.zones.map((zone, index) => (
              <button key={zone.id} className={selectedZone === zone.id ? "zone-card is-active" : "zone-card"} onClick={() => { setSelectedZone(zone.id); setView("model"); }}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{zone.label}</strong>
                <small>{statusCopy[zone.status]}</small>
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
