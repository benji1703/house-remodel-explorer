"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { house, statusCopy, type ZoneId } from "@/data/house";
import { isMoodBoardId, roomMoodBoards, type MoodBoardId } from "@/data/moodboards";
import { DimensionedOverlay } from "./DimensionedOverlay";

const MeasuredHouseScene = lazy(() =>
  import("./MeasuredHouseScene").then((module) => ({
    default: module.MeasuredHouseScene,
  })),
);

type View = "model" | "plan" | "references";

const Icon = ({ name }: { name: "cube" | "layers" | "grid" }) => {
  const paths = {
    cube: "m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z M4 7.5l8 4.5 8-4.5M12 12v9",
    layers: "m4 8 8-4 8 4-8 4-8-4Zm0 4 8 4 8-4M4 16l8 4 8-4",
    grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
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
        <path className="plan-shell" d="M340 0H760V500H1140V1210H0V830H340Z" />
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

const VIEWS: View[] = ["model", "plan", "references"];
const isView = (value: string | null): value is View => VIEWS.includes(value as View);
const isZoneId = (value: string | null): value is ZoneId =>
  house.zones.some((zone) => zone.id === value);

const zoneFromMood = (id: MoodBoardId): ZoneId =>
  id === "terrace" || id === "openings" ? "central-core" : id;

export function HouseExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const viewParam = searchParams.get("view");
  const zoneParam = searchParams.get("zone");
  const moodParam = searchParams.get("mood");
  const view: View = isView(viewParam) ? viewParam : "model";
  const selectedZone: ZoneId = isZoneId(zoneParam) ? zoneParam : "north-extension";
  const selectedMood: MoodBoardId = isMoodBoardId(moodParam)
    ? moodParam
    : isMoodBoardId(zoneParam)
      ? zoneParam
      : "central-core";

  const navigate = (
    next: { view?: View; zone?: ZoneId; mood?: MoodBoardId },
    mode: "push" | "replace" = "push",
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next.view ?? view);
    if (next.mood) {
      params.set("mood", next.mood);
      params.set("zone", zoneFromMood(next.mood));
    } else {
      params.set("zone", next.zone ?? selectedZone);
      if (next.zone && isMoodBoardId(next.zone)) params.set("mood", next.zone);
    }
    const url = `${pathname}?${params.toString()}`;
    if (mode === "replace") router.replace(url, { scroll: false });
    else router.push(url, { scroll: false });
  };

  const [designMode, setDesignMode] = useState(true);
  const [quality, setQuality] = useState<"high" | "light">("high");
  const [webglSupport, setWebglSupport] = useState<boolean | null>(null);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [cameraAzimuth, setCameraAzimuth] = useState(0);
  const [moodImageByBoard, setMoodImageByBoard] = useState<Partial<Record<MoodBoardId, number>>>({});

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

  const activeMood = useMemo(
    () => roomMoodBoards.find((board) => board.id === selectedMood) ?? roomMoodBoards[1],
    [selectedMood],
  );

  const moodImageCount = activeMood.images.length;
  const moodImageIndex = Math.min(moodImageByBoard[selectedMood] ?? 0, Math.max(moodImageCount - 1, 0));
  const heroMoodImage = activeMood.images[moodImageIndex] ?? activeMood.images[0];
  const moodIndexLabel = `${String(moodImageIndex + 1).padStart(2, "0")} / ${String(moodImageCount).padStart(2, "0")}`;

  useEffect(() => {
    if (view !== "references") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      setMoodImageByBoard((prev) => {
        const current = prev[selectedMood] ?? 0;
        const next = ((current + step) % moodImageCount + moodImageCount) % moodImageCount;
        return { ...prev, [selectedMood]: next };
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, moodImageCount, selectedMood]);

  const zoneIndex = String(house.zones.findIndex((zone) => zone.id === active.id) + 1).padStart(2, "0");

  return (
    <main className="explorer-shell">
      <aside className="side-rail" aria-label="Primary navigation">
        <a className="brand-mark" href="#top" aria-label="House remodel home">
          H<span>01</span>
        </a>
        <nav>
          <button
            className={view === "model" ? "rail-button is-active" : "rail-button"}
            aria-label="House model"
            aria-current={view === "model" ? "page" : undefined}
            onClick={() => navigate({ view: "model" })}
          >
            <Icon name="cube" />
          </button>
          <button
            className={view === "plan" ? "rail-button is-active" : "rail-button"}
            aria-label="Measured plan"
            aria-current={view === "plan" ? "page" : undefined}
            onClick={() => navigate({ view: "plan" })}
          >
            <Icon name="grid" />
          </button>
          <button
            className={view === "references" ? "rail-button is-active" : "rail-button"}
            aria-label="References"
            aria-current={view === "references" ? "page" : undefined}
            onClick={() => navigate({ view: "references", mood: selectedMood })}
          >
            <Icon name="layers" />
          </button>
        </nav>
      </aside>

      <section className="workspace" id="top">
        <header className="topbar">
          <div className="topbar-brand">
            <p className="eyebrow">In progress</p>
            <h1>House remodel</h1>
          </div>
          <div className="topbar-actions">
            {view === "model" && (
              <button
                type="button"
                className="quality-button"
                onClick={() => setQuality((value) => (value === "high" ? "light" : "high"))}
              >
                {quality === "high" ? "Lighter view" : "Full detail"}
              </button>
            )}
          </div>
        </header>

        <div className="content-grid">
          <section className={`stage-card is-${view}`} aria-label={view === "model" ? "House model" : view === "plan" ? "Measured plan" : "References"}>
            {view === "model" && (
              <>
                <div className="stage-copy">
                  <span className="overline">Room</span>
                  <h2>{active.label}</h2>
                  <p>Orbit, zoom, select a room</p>
                </div>
                <div className="stage-controls">
                  <div className="mode-toggle" role="group" aria-label="Model appearance">
                    <button
                      type="button"
                      className={!designMode ? "is-active" : ""}
                      aria-pressed={!designMode}
                      onClick={() => setDesignMode(false)}
                    >
                      Survey
                    </button>
                    <button
                      type="button"
                      className={designMode ? "is-active" : ""}
                      aria-pressed={designMode}
                      onClick={() => setDesignMode(true)}
                    >
                      Finishes
                    </button>
                  </div>
                  {webglSupport === true && (
                    <button
                      type="button"
                      className={showMeasurements ? "chip-toggle is-active" : "chip-toggle"}
                      aria-pressed={showMeasurements}
                      onClick={() => setShowMeasurements((value) => !value)}
                    >
                      {showMeasurements ? "Hide measures" : "Measures"}
                    </button>
                  )}
                </div>
                <div className="three-stage">
                  {webglSupport === true && (
                    <Suspense fallback={<div className="model-loading">Loading model…</div>}>
                      <MeasuredHouseScene
                        selectedZone={selectedZone}
                        onSelectZone={(id) => navigate({ zone: id }, "replace")}
                        designMode={designMode}
                        quality={quality}
                        showMeasurements={showMeasurements}
                        onCameraAzimuth={setCameraAzimuth}
                      />
                    </Suspense>
                  )}
                  {webglSupport === false && (
                    <div className="webgl-fallback">
                      <VectorPlan selected={selectedZone} onSelect={(id) => navigate({ zone: id }, "replace")} />
                      <p>Plan view — 3D unavailable</p>
                    </div>
                  )}
                  {webglSupport === null && <div className="model-loading">Preparing…</div>}
                </div>
                <div className="orientation" aria-hidden="true">
                  <b>N</b>
                  <span style={webglSupport === true ? { transform: `rotate(${cameraAzimuth}rad)` } : undefined} />
                </div>
              </>
            )}

            {view === "plan" && (
              <div className="plan-view">
                <div className="stage-copy plan-copy">
                  <span className="overline">Survey</span>
                  <h2>Measured plan</h2>
                  <p>Photograph against the traced shell.</p>
                </div>
                <DimensionedOverlay />
              </div>
            )}

            {view === "references" && (
              <div className="references-view">
                <header className="mood-masthead">
                  <div className="mood-masthead-row">
                    <p className="mood-masthead-kicker">References</p>
                    <p className="mood-index" aria-live="polite">
                      {moodIndexLabel}
                    </p>
                  </div>
                  <h2 className="mood-masthead-title">{activeMood.label}</h2>
                  <p className="mood-masthead-lede">{activeMood.atmosphere}</p>

                  <nav className="mood-index-nav" role="tablist" aria-label="Rooms">
                    {roomMoodBoards.map((board, index) => {
                      const selected = selectedMood === board.id;
                      return (
                        <button
                          key={board.id}
                          type="button"
                          role="tab"
                          id={`mood-tab-${board.id}`}
                          aria-selected={selected}
                          aria-controls="mood-board-panel"
                          className={selected ? "mood-index-link is-active" : "mood-index-link"}
                          onClick={() => navigate({ view: "references", mood: board.id }, "replace")}
                        >
                          <em>{String(index + 1).padStart(2, "0")}</em>
                          {board.label}
                        </button>
                      );
                    })}
                  </nav>
                </header>

                <div
                  className="mood-board-stage"
                  id="mood-board-panel"
                  role="tabpanel"
                  aria-labelledby={`mood-tab-${activeMood.id}`}
                >
                  <figure className="mood-hero" key={heroMoodImage.src}>
                    <Image
                      src={heroMoodImage.src}
                      alt={heroMoodImage.alt}
                      fill
                      sizes="(max-width: 900px) 100vw, 58vw"
                      priority
                      unoptimized
                    />
                    <figcaption>
                      <span>{heroMoodImage.caption}</span>
                      <small>← →</small>
                    </figcaption>
                  </figure>
                  <div className="mood-side">
                    <div
                      className="mood-gallery"
                      role="listbox"
                      aria-label={`${activeMood.label} references`}
                      aria-activedescendant={`mood-thumb-${moodImageIndex}`}
                    >
                      {activeMood.images.map((image, index) => {
                        const selected = index === moodImageIndex;
                        return (
                          <button
                            key={`${image.src}-${image.caption}`}
                            type="button"
                            id={`mood-thumb-${index}`}
                            role="option"
                            aria-selected={selected}
                            className={selected ? "mood-thumb is-active" : "mood-thumb"}
                            onClick={() =>
                              setMoodImageByBoard((prev) => ({ ...prev, [selectedMood]: index }))
                            }
                          >
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              sizes="(max-width: 900px) 45vw, 16vw"
                              unoptimized
                            />
                            <span className="mood-thumb-index">{String(index + 1).padStart(2, "0")}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mood-finishes-block">
                      <p className="mood-finishes-label">Palette</p>
                      <ul className="mood-finishes" aria-label="Finish palette">
                        {activeMood.finishes.map((finish) => (
                          <li key={finish}>{finish}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="inspector" aria-live="polite">
            {view === "references" ? (
              <>
                <div className="inspector-head">
                  <span className="source-tag traced">Reference</span>
                  <span className="zone-number">{activeMood.shortLabel}</span>
                </div>
                <p className="eyebrow">Board</p>
                <h2>{activeMood.label}</h2>
                <p className="zone-description">{activeMood.atmosphere}</p>

                <ul className="inspector-finishes" aria-label="Palette">
                  {activeMood.finishes.map((finish) => (
                    <li key={finish}>{finish}</li>
                  ))}
                </ul>

                <div className="accuracy-note">
                  <div className="accuracy-title">
                    <span>Note</span>
                    <b>Atmosphere</b>
                  </div>
                  <p>These images set tone and finish. Walls and footprint follow the measured plan.</p>
                </div>

                <button
                  type="button"
                  className="source-link"
                  onClick={() => navigate({ view: "model", zone: zoneFromMood(activeMood.id) })}
                >
                  <span className="source-thumbnail">
                    <Image src={heroMoodImage.src} alt="" fill sizes="72px" unoptimized />
                  </span>
                  <span>
                    <small>Model</small>
                    View this room in three dimensions
                  </span>
                  <b aria-hidden="true">↗</b>
                </button>
              </>
            ) : (
              <>
                <div className="inspector-head">
                  <span className={`source-tag ${active.status}`}>{statusCopy[active.status]}</span>
                  <span className="zone-number">{zoneIndex}</span>
                </div>
                <p className="eyebrow">Room</p>
                <h2>{active.label}</h2>
                <p className="zone-description">{active.description}</p>

                <dl className="measure-list">
                  <div>
                    <dt>Width</dt>
                    <dd>{Math.round(active.width * 100)} cm</dd>
                  </div>
                  <div>
                    <dt>Depth</dt>
                    <dd>{Math.round(active.depth * 100)} cm</dd>
                  </div>
                  <div>
                    <dt>Area</dt>
                    <dd>{(active.width * active.depth).toFixed(1)} m²</dd>
                  </div>
                </dl>

                <div className="accuracy-note">
                  <div className="accuracy-title">
                    <span>Geometry</span>
                    <b>Measured</b>
                  </div>
                  <p>Walls and footprint follow the survey drawing.</p>
                </div>

                <button
                  type="button"
                  className="source-link"
                  onClick={() => navigate({ view: "references", mood: active.id })}
                >
                  <span className="source-thumbnail">
                    <Image
                      src={
                        roomMoodBoards.find((b) => b.id === active.id)?.images[0].src ??
                        "/references/moods/mood-living.jpeg"
                      }
                      alt=""
                      fill
                      sizes="72px"
                      unoptimized
                    />
                  </span>
                  <span>
                    <small>References</small>
                    {active.label} atmosphere
                  </span>
                  <b aria-hidden="true">↗</b>
                </button>
              </>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
