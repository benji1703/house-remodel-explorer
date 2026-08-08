"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { lazy, Suspense, startTransition, useEffect, useRef, useState, useTransition } from "react";
import { house, statusCopy, type ZoneId } from "@/data/house";
import { isMoodBoardId, roomMoodBoards, type MoodBoardId } from "@/data/moodboards";
import { gsap, motionEase, motionEaseIn, useGSAP } from "@/lib/gsap";
import { DimensionedOverlay } from "./DimensionedOverlay";
import { MoodMedia, prefetchMoodSrcs } from "./MoodMedia";

const MeasuredHouseScene = lazy(() =>
  import("./MeasuredHouseScene").then((module) => ({
    default: module.MeasuredHouseScene,
  })),
);

type View = "model" | "plan" | "references";

const Icon = ({ name }: { name: "cube" | "layers" | "grid" | "close" | "chevron" }) => {
  const paths = {
    cube: "m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z M4 7.5l8 4.5 8-4.5M12 12v9",
    layers: "m4 8 8-4 8 4-8 4-8-4Zm0 4 8 4 8-4M4 16l8 4 8-4",
    grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    close: "M6 6l12 12M18 6 6 18",
    chevron: "m6 9 6 6 6-6",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
};

function VectorPlan({ selected, onSelect }: { selected: ZoneId; onSelect: (id: ZoneId) => void }) {
  return (
    <div className="vector-plan-wrap">
      <svg className="vector-plan" viewBox="-90 -100 1320 1410" role="img" aria-label="Measured floor plan">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(29,29,31,.07)" strokeWidth="2" />
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
              rx="8"
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
          <text x="570" y="-60">11.40 m</text>
        </g>
        <g className="dimension-line side-dimension">
          <line x1="1185" y1="0" x2="1185" y2="1210" />
          <line x1="1165" y1="0" x2="1205" y2="0" />
          <line x1="1165" y1="1210" x2="1205" y2="1210" />
          <text x="1205" y="605" transform="rotate(90 1205 605)">12.10 m</text>
        </g>
      </svg>
      <p className="plan-scale">1 square = 1 m</p>
    </div>
  );
}

const VIEWS: { id: View; label: string; icon: "cube" | "grid" | "layers" }[] = [
  { id: "model", label: "Model", icon: "cube" },
  { id: "plan", label: "Plan", icon: "grid" },
  { id: "references", label: "Refs", icon: "layers" },
];

const isView = (value: string | null): value is View =>
  VIEWS.some((entry) => entry.id === value);

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [refsPending, startRefsTransition] = useTransition();
  const shellRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const scrimRef = useRef<HTMLButtonElement>(null);
  const introDone = useRef(false);
  const skipViewMotion = useRef(true);
  const sheetWasOpen = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const isSmall = window.matchMedia("(max-width: 800px)").matches;
      const saveData =
        "connection" in navigator &&
        Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
      if (isSmall || saveData) setQuality("light");
      const canvas = document.createElement("canvas");
      setWebglSupport(Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  const active = house.zones.find((zone) => zone.id === selectedZone) ?? house.zones[0];
  const activeMood = roomMoodBoards.find((board) => board.id === selectedMood) ?? roomMoodBoards[1];

  const moodImageCount = activeMood.images.length;
  const moodImageIndex = Math.min(moodImageByBoard[selectedMood] ?? 0, Math.max(moodImageCount - 1, 0));
  const heroMoodImage = activeMood.images[moodImageIndex] ?? activeMood.images[0];
  const moodIndexLabel = `${moodImageIndex + 1} / ${moodImageCount}`;

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

  useEffect(() => {
    if (view !== "references") return;
    const current = activeMood.images.map((image) => image.src);
    const neighbors = [
      activeMood.images[(moodImageIndex + 1) % moodImageCount]?.src,
      activeMood.images[(moodImageIndex - 1 + moodImageCount) % moodImageCount]?.src,
    ].filter(Boolean) as string[];
    const boardCovers = roomMoodBoards.map((board) => board.images[0]?.src).filter(Boolean) as string[];
    prefetchMoodSrcs([...current, ...neighbors, ...boardCovers]);
  }, [view, activeMood, moodImageIndex, moodImageCount]);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: motionEase } });
        tl.from(".app-bar", { y: -18, opacity: 0, duration: 0.7, clearProps: "all" })
          .from(".stage", { opacity: 0, y: 22, scale: 0.985, duration: 0.85, transformOrigin: "50% 50%", clearProps: "all" }, "-=0.45")
          .from(".detail", { opacity: 0, x: 24, duration: 0.65, clearProps: "opacity,x" }, "-=0.55")
          .from(".tab-bar", { y: 24, opacity: 0, duration: 0.5, clearProps: "all" }, "-=0.45")
          .from(".mobile-room-rail", { y: 12, opacity: 0, duration: 0.4, clearProps: "all" }, "-=0.35");
        introDone.current = true;
      });
      media.add("(prefers-reduced-motion: reduce)", () => {
        introDone.current = true;
      });
    },
    { scope: shellRef },
  );

  useGSAP(
    () => {
      if (skipViewMotion.current) {
        skipViewMotion.current = false;
        return;
      }
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const stage = stageRef.current;
        if (!stage) return;
        gsap.fromTo(
          stage,
          { opacity: 0.35, y: 18 },
          { opacity: 1, y: 0, duration: 0.55, ease: motionEase, overwrite: "auto" },
        );
        const hud = stage.querySelector(".stage-hud");
        const toolbar = stage.querySelector(".stage-toolbar");
        const masthead = stage.querySelector(".mood-masthead");
        const intro = stage.querySelector(".view-intro");
        gsap.fromTo(
          [toolbar, hud, masthead, intro].filter(Boolean),
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: motionEase, delay: 0.05 },
        );
      });
    },
    { scope: shellRef, dependencies: [view] },
  );

  useGSAP(
    () => {
      if (view !== "references") return;
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".mood-masthead-title",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6, ease: motionEase, overwrite: "auto" },
        );
        gsap.fromTo(
          ".mood-masthead-lede",
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5, ease: motionEase, delay: 0.05, overwrite: "auto" },
        );
        gsap.fromTo(
          ".mood-board-stage",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.55, ease: motionEase, delay: 0.08, overwrite: "auto" },
        );
      });
    },
    { scope: shellRef, dependencies: [selectedMood, view] },
  );

  useGSAP(
    () => {
      if (view !== "model") return;
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".hud-card",
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45, ease: motionEase, overwrite: "auto" },
        );
      });
    },
    { scope: shellRef, dependencies: [selectedZone, view] },
  );

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(max-width: 800px) and (prefers-reduced-motion: no-preference)", () => {
        const detail = detailRef.current;
        const scrim = scrimRef.current;
        if (!detail) return;
        const wasOpen = sheetWasOpen.current;
        sheetWasOpen.current = sheetOpen;

        if (sheetOpen) {
          gsap.set(detail, { display: "flex", pointerEvents: "auto" });
          gsap.set(scrim, { pointerEvents: "auto" });
          gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: motionEase, overwrite: "auto" });
          gsap.fromTo(
            detail,
            { yPercent: 108 },
            { yPercent: 0, duration: 0.5, ease: motionEase, overwrite: "auto" },
          );
          gsap.fromTo(
            detail.querySelectorAll("h2, .detail-copy, .measure-list, .detail-list, .detail-cta, .detail-note, .detail-head, .detail-kicker"),
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, delay: 0.12, ease: motionEase, clearProps: "opacity,y" },
          );
          return;
        }

        // Already closed (view switch / remount) — park off-screen, never steal taps.
        gsap.set(scrim, { opacity: 0, pointerEvents: "none" });
        gsap.set(detail, { yPercent: 108, pointerEvents: "none" });
        if (!wasOpen) return;

        gsap.to(scrim, {
          opacity: 0,
          duration: 0.22,
          ease: motionEaseIn,
          overwrite: "auto",
        });
        gsap.fromTo(
          detail,
          { yPercent: 0, pointerEvents: "none" },
          { yPercent: 108, duration: 0.38, ease: motionEaseIn, overwrite: "auto" },
        );
      });
      media.add("(max-width: 800px) and (prefers-reduced-motion: reduce)", () => {
        const detail = detailRef.current;
        const scrim = scrimRef.current;
        sheetWasOpen.current = sheetOpen;
        if (!detail) return;
        gsap.set(detail, { clearProps: "transform,y,yPercent", pointerEvents: sheetOpen ? "auto" : "none" });
        gsap.set(scrim, { opacity: sheetOpen ? 1 : 0, pointerEvents: sheetOpen ? "auto" : "none" });
      });
    },
    { scope: shellRef, dependencies: [sheetOpen, compact, view] },
  );

  const selectMoodBoard = (id: MoodBoardId) => {
    startRefsTransition(() => {
      navigate({ view: "references", mood: id }, "replace");
    });
  };

  const selectMoodImage = (index: number) => {
    startTransition(() => {
      setMoodImageByBoard((prev) => ({ ...prev, [selectedMood]: index }));
    });
  };

  const zoneIndex = String(house.zones.findIndex((zone) => zone.id === active.id) + 1).padStart(2, "0");

  const goToView = (next: View) => {
    setSheetOpen(false);
    sheetWasOpen.current = false;
    // Kill any leftover sheet transforms so the tab bar stays tappable.
    const detail = detailRef.current;
    const scrim = scrimRef.current;
    if (detail) {
      gsap.killTweensOf(detail);
      gsap.set(detail, { yPercent: 108, pointerEvents: "none", clearProps: "transform,y" });
    }
    if (scrim) {
      gsap.killTweensOf(scrim);
      gsap.set(scrim, { opacity: 0, pointerEvents: "none" });
    }
    if (next === view) return;
    navigate(next === "references" ? { view: next, mood: selectedMood } : { view: next }, "replace");
  };

  const detailPanel = view === "references" ? (
    <>
      <p className="detail-kicker">Board</p>
      <h2>{activeMood.label}</h2>
      <p className="detail-copy">{activeMood.atmosphere}</p>
      <ul className="detail-list" aria-label="Palette">
        {activeMood.finishes.map((finish) => (
          <li key={finish}>{finish}</li>
        ))}
      </ul>
      <p className="detail-note">Images set tone. The measured plan owns walls and footprint.</p>
      <button
        type="button"
        className="detail-cta"
        onClick={() => {
          setSheetOpen(false);
          navigate({ view: "model", zone: zoneFromMood(activeMood.id) });
        }}
      >
        <span className="detail-thumb">
          <Image src={heroMoodImage.src} alt="" fill sizes="64px" unoptimized />
        </span>
        <span>
          <small>Model</small>
          Open in three dimensions
        </span>
      </button>
    </>
  ) : (
    <>
      <div className="detail-head">
        <span className={`status-tag ${active.status}`}>{statusCopy[active.status]}</span>
        <span className="detail-index">{zoneIndex}</span>
      </div>
      <h2>{active.label}</h2>
      <p className="detail-copy">{active.description}</p>
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
      <p className="detail-note">Walls and footprint follow the survey drawing.</p>
      <button
        type="button"
        className="detail-cta"
        onClick={() => {
          setSheetOpen(false);
          navigate({ view: "references", mood: active.id });
        }}
      >
        <span className="detail-thumb">
          <Image
            src={
              roomMoodBoards.find((board) => board.id === active.id)?.images[0].src ??
              "/references/moods/mood-living.jpeg"
            }
            alt=""
            fill
            sizes="64px"
            unoptimized
          />
        </span>
        <span>
          <small>References</small>
          {active.label} atmosphere
        </span>
      </button>
    </>
  );

  return (
    <main ref={shellRef} className={sheetOpen ? "shell is-sheet-open has-motion" : "shell has-motion"}>
      <header className="app-bar">
        <a className="logo" href="#top" aria-label="House remodel home">
          <span className="logo-mark">House</span>
          <span className="logo-meta">Remodel</span>
        </a>

        <nav className="view-switch desktop-only" role="tablist" aria-label="Views">
          {VIEWS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={view === entry.id}
              className={view === entry.id ? "view-tab is-active" : "view-tab"}
              onClick={() => goToView(entry.id)}
            >
              <Icon name={entry.icon} />
              <span>{entry.label === "Refs" ? "References" : entry.label}</span>
            </button>
          ))}
        </nav>

        <div className="app-bar-end">
          {view === "model" && (
            <button
              type="button"
              className="ghost-button"
              onClick={() => setQuality((value) => (value === "high" ? "light" : "high"))}
            >
              {quality === "high" ? "Lighter" : "Detail"}
            </button>
          )}
        </div>
      </header>

      <div className={`app-body is-${view}`} id="top">
        <section
          ref={stageRef}
          className={`stage is-${view}`}
          aria-label={view === "model" ? "House model" : view === "plan" ? "Measured plan" : "References"}
        >
          {view === "model" && (
            <>
              <div className="three-stage">
                {webglSupport === true && (
                  <Suspense fallback={<div className="model-loading">Loading…</div>}>
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

              <div className="stage-toolbar" role="group" aria-label="Model controls">
                <div className="segmented">
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
                    className={showMeasurements ? "toolbar-chip is-active" : "toolbar-chip"}
                    aria-pressed={showMeasurements}
                    onClick={() => setShowMeasurements((value) => !value)}
                  >
                    Measures
                  </button>
                )}
              </div>

              <div className="stage-hud">
                {compact ? (
                  <button
                    type="button"
                    className="hud-card"
                    onClick={() => setSheetOpen(true)}
                    aria-expanded={sheetOpen}
                    aria-controls="detail-sheet"
                  >
                    <div className="hud-card-text">
                      <p className="hud-kicker">{zoneIndex}</p>
                      <h2>{active.label}</h2>
                      <p className="hud-hint">Drag · pinch · tap for details</p>
                    </div>
                    <span className="hud-open" aria-hidden="true">
                      <Icon name="chevron" />
                    </span>
                  </button>
                ) : (
                  <div className="hud-card">
                    <div className="hud-card-text">
                      <p className="hud-kicker">{zoneIndex}</p>
                      <h2>{active.label}</h2>
                      <p className="hud-hint">Drag to orbit · scroll to zoom</p>
                    </div>
                  </div>
                )}
                <div className="orientation" aria-hidden="true">
                  <b>N</b>
                  <span style={webglSupport === true ? { transform: `rotate(${cameraAzimuth}rad)` } : undefined} />
                </div>
              </div>
            </>
          )}

          {view === "plan" && (
            <div className="plan-view">
              <header className="view-intro">
                <p className="view-kicker">Survey</p>
                <h2>Measured plan</h2>
                <p>Photograph against the traced shell.</p>
              </header>
              <DimensionedOverlay />
            </div>
          )}

          {view === "references" && (
            <div className={refsPending ? "references-view is-pending" : "references-view"}>
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
                        onClick={() => selectMoodBoard(board.id)}
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
                aria-busy={refsPending}
              >
                <figure className="mood-hero" key={heroMoodImage.src}>
                  <MoodMedia
                    key={heroMoodImage.src}
                    src={heroMoodImage.src}
                    alt={heroMoodImage.alt}
                    sizes="(max-width: 800px) 100vw, 62vw"
                    priority
                  />
                  <figcaption>
                    <span>{heroMoodImage.caption}</span>
                    <small className="desktop-only">← →</small>
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
                          onClick={() => selectMoodImage(index)}
                        >
                          <MoodMedia
                            key={image.src}
                            src={image.src}
                            alt={image.alt}
                            sizes="(max-width: 800px) 28vw, 14vw"
                            priority={index < 4}
                          />
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
                    <button
                      type="button"
                      className="mobile-inline-cta mobile-only"
                      onClick={() => navigate({ view: "model", zone: zoneFromMood(activeMood.id) })}
                    >
                      Open in model
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {view === "model" && (
          <div className="mobile-room-rail mobile-only" aria-label="Rooms">
            {house.zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                className={selectedZone === zone.id ? "room-chip is-active" : "room-chip"}
                onClick={() => navigate({ zone: zone.id }, "replace")}
              >
                <em>{zone.shortLabel}</em>
                {zone.label}
              </button>
            ))}
          </div>
        )}

        {view !== "plan" && (
          <>
            <button
              ref={scrimRef}
              type="button"
              className={sheetOpen ? "sheet-scrim is-open mobile-only" : "sheet-scrim mobile-only"}
              aria-label="Close details"
              tabIndex={sheetOpen ? 0 : -1}
              onClick={() => setSheetOpen(false)}
            />
            <aside
              ref={detailRef}
              id="detail-sheet"
              className={sheetOpen ? "detail is-open" : "detail"}
              aria-live="polite"
            >
              <div className="sheet-chrome mobile-only">
                <button
                  type="button"
                  className="sheet-handle"
                  aria-label="Close details"
                  onClick={() => setSheetOpen(false)}
                >
                  <span />
                </button>
                <button
                  type="button"
                  className="sheet-close"
                  aria-label="Close"
                  onClick={() => setSheetOpen(false)}
                >
                  <Icon name="close" />
                </button>
              </div>
              {detailPanel}
            </aside>
          </>
        )}
      </div>

      <nav className="tab-bar mobile-only" aria-label="Primary">
        {VIEWS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={view === entry.id ? "tab-item is-active" : "tab-item"}
            aria-current={view === entry.id ? "page" : undefined}
            onClick={() => goToView(entry.id)}
          >
            <Icon name={entry.icon} />
            <span>{entry.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
