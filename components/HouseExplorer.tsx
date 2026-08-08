"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { lazy, Suspense, startTransition, useEffect, useRef, useState, useTransition, type TouchEvent } from "react";
import { house, statusCopy, type ZoneId } from "@/data/house";
import { isMoodBoardId, roomMoodBoards, type MoodBoardId } from "@/data/moodboards";
import { site } from "@/data/site";
import { gsap, motionEase, motionEaseIn, useGSAP } from "@/lib/gsap";
import { DimensionedOverlay } from "./DimensionedOverlay";
import { MoodMedia, prefetchMoodSrcs } from "./MoodMedia";

const MeasuredHouseScene = lazy(() =>
  import("./MeasuredHouseScene").then((module) => ({
    default: module.MeasuredHouseScene,
  })),
);

type View = "model" | "plan" | "references";

const Icon = ({ name }: { name: "close" | "chevron" }) => {
  const paths = {
    close: "M6 6l12 12M18 6 6 18",
    chevron: "m6 9 6 6 6-6",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
};

/** Measured footprint mark — same silhouette as favicon. */
const FootprintMark = () => (
  <svg className="logo-mark-svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 3h8v9h7v9H1v-7h7V3Z" fill="currentColor" className="logo-foot-sage" />
  </svg>
);

function VectorPlan({ selected, onSelect }: { selected: ZoneId; onSelect: (id: ZoneId) => void }) {
  return (
    <div className="vector-plan-wrap">
      <svg className="vector-plan" viewBox="-90 -100 1320 1410" role="img" aria-label="Measured floor plan">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(42,50,44,.08)" strokeWidth="2" />
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

const VIEWS: { id: View; label: string }[] = [
  { id: "model", label: "House" },
  { id: "plan", label: "Plan" },
  { id: "references", label: "Mood" },
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

  useEffect(() => {
    if (view !== "references") return;
    const tab = document.getElementById(`mood-tab-${selectedMood}`);
    const nav = tab?.closest(".mood-index-nav");
    if (!tab || !nav) return;
    const left = tab.offsetLeft - (nav.clientWidth - tab.clientWidth) / 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
  }, [view, selectedMood]);

  useEffect(() => {
    if (view !== "references") return;
    const thumb = document.getElementById(`mood-thumb-${moodImageIndex}`);
    const gallery = thumb?.closest(".mood-gallery");
    if (!thumb || !gallery) return;
    const left = thumb.offsetLeft - (gallery.clientWidth - thumb.clientWidth) / 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gallery.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
  }, [view, selectedMood, moodImageIndex]);

  const moodTouch = useRef<{ x: number; y: number } | null>(null);

  const stepMoodImage = (step: number) => {
    if (moodImageCount < 2) return;
    setMoodImageByBoard((prev) => {
      const current = prev[selectedMood] ?? 0;
      const next = ((current + step) % moodImageCount + moodImageCount) % moodImageCount;
      return { ...prev, [selectedMood]: next };
    });
  };

  const onMoodHeroTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    moodTouch.current = { x: touch.clientX, y: touch.clientY };
  };

  const onMoodHeroTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = moodTouch.current;
    moodTouch.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    stepMoodImage(dx < 0 ? 1 : -1);
  };

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
          return;
        }

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
      <p className="detail-kicker">{activeMood.finishes[0] ?? "Finishes"}</p>
      <h2>{activeMood.label}</h2>
      <p className="detail-copy">{activeMood.atmosphere}</p>
      <ul className="detail-list" aria-label="Finishes">
        {activeMood.finishes.map((finish) => (
          <li key={finish}>{finish}</li>
        ))}
      </ul>
      <p className="detail-note">Atmosphere — walls stay on the measured drawing.</p>
      <button
        type="button"
        className="detail-cta"
        aria-label={`Open ${activeMood.label} in the house model`}
        onClick={() => {
          setSheetOpen(false);
          navigate({ view: "model", zone: zoneFromMood(activeMood.id) });
        }}
      >
        <span className="detail-thumb">
          <Image src={heroMoodImage.src} alt="" fill sizes="64px" unoptimized />
        </span>
        <span>
          <small>House</small>
          Walk {activeMood.label}
        </span>
      </button>
    </>
  ) : (
    <>
      <div className="detail-head">
        <span className={`status-tag ${active.status}`}>{statusCopy[active.status]}</span>
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
      <p className="detail-note">Taken from the survey drawing.</p>
      <button
        type="button"
        className="detail-cta"
        aria-label={`Open ${active.label} mood references`}
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
          <small>Materials</small>
          {active.label} palette
        </span>
      </button>
    </>
  );

  return (
    <main ref={shellRef} className={sheetOpen ? "shell is-sheet-open has-motion" : "shell has-motion"}>
      <header className="app-bar">
        <a className="logo" href="#top" aria-label={`${site.name} home`}>
          <FootprintMark />
          <span className="logo-text">
            <span className="logo-mark">{site.wordmark.primary}</span>
            <span className="logo-meta">{site.wordmark.secondary}</span>
          </span>
        </a>

        <nav className="view-switch desktop-only" aria-label="Views">
          {VIEWS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-current={view === entry.id ? "page" : undefined}
              className={view === entry.id ? "view-tab is-active" : "view-tab"}
              onClick={() => goToView(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </nav>

        <div className="app-bar-end">
          {view === "model" && (
            <button
              type="button"
              className="ghost-button"
              aria-pressed={quality === "light"}
              onClick={() => setQuality((value) => (value === "high" ? "light" : "high"))}
            >
              {quality === "high" ? "Use faster load" : "Use full detail"}
            </button>
          )}
        </div>
      </header>

      <div className={`app-body is-${view}`} id="top">
        <section
          ref={stageRef}
          className={`stage is-${view}`}
          aria-label={view === "model" ? "House" : view === "plan" ? "Measured plan" : "Mood"}
        >
          {view === "model" && (
            <>
              <div className="three-stage">
                {webglSupport === true && (
                  <Suspense fallback={<div className="model-loading">Settling the house…</div>}>
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
                    <p>Plan only — WebGL unavailable</p>
                  </div>
                )}
                {webglSupport === null && <div className="model-loading">Settling the house…</div>}
              </div>

              <div className="stage-toolbar" role="group" aria-label="Model controls">
                <div className="segmented">
                  <button
                    type="button"
                    className={!designMode ? "is-active" : ""}
                    aria-pressed={!designMode}
                    onClick={() => setDesignMode(false)}
                  >
                    Survey shell
                  </button>
                  <button
                    type="button"
                    className={designMode ? "is-active" : ""}
                    aria-pressed={designMode}
                    onClick={() => setDesignMode(true)}
                  >
                    With finishes
                  </button>
                </div>
                {webglSupport === true && (
                  <button
                    type="button"
                    className={showMeasurements ? "toolbar-chip is-active" : "toolbar-chip"}
                    aria-pressed={showMeasurements}
                    onClick={() => setShowMeasurements((value) => !value)}
                  >
                    Dimensions
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
                      <p className="hud-kicker">{active.shortLabel}</p>
                      <h2>{active.label}</h2>
                      <p className="hud-hint">Orbit · pinch · open room note</p>
                    </div>
                    <span className="hud-open" aria-hidden="true">
                      <Icon name="chevron" />
                    </span>
                  </button>
                ) : (
                  <div className="hud-card">
                    <div className="hud-card-text">
                      <p className="hud-kicker">{active.shortLabel}</p>
                      <h2>{active.label}</h2>
                      <p className="hud-hint">Orbit · scroll · north on the right</p>
                    </div>
                  </div>
                )}
                <div
                  className="orientation"
                  role="status"
                  aria-live="polite"
                  aria-label={`North; camera heading ${Math.round(((cameraAzimuth % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) * (180 / Math.PI))} degrees`}
                >
                  <b>N</b>
                  <span style={webglSupport === true ? { transform: `rotate(${cameraAzimuth}rad)` } : undefined} />
                </div>
              </div>
            </>
          )}

          {view === "plan" && (
            <div className="plan-view">
              <header className="view-intro">
                <p className="view-kicker">Measured drawing</p>
                <h2>Plan under the photo</h2>
                <p>Check wall runs against the survey before trusting the model.</p>
              </header>
              <DimensionedOverlay />
            </div>
          )}

          {view === "references" && (
            <div className={refsPending ? "references-view is-pending" : "references-view"}>
              <header className="mood-masthead">
                <div className="mood-masthead-row">
                  <p className="mood-masthead-kicker">{site.tagline}</p>
                  <p className="mood-index" aria-live="polite">
                    {moodIndexLabel}
                  </p>
                </div>
                <h2 className="mood-masthead-title">{activeMood.label}</h2>
                <p className="mood-masthead-lede">{activeMood.atmosphere}</p>

                <nav className="mood-index-nav" aria-label="Rooms">
                  {roomMoodBoards.map((board) => {
                    const selected = selectedMood === board.id;
                    return (
                      <button
                        key={board.id}
                        type="button"
                        id={`mood-tab-${board.id}`}
                        aria-current={selected ? "true" : undefined}
                        className={selected ? "mood-index-link is-active" : "mood-index-link"}
                        onClick={() => selectMoodBoard(board.id)}
                      >
                        {board.label}
                      </button>
                    );
                  })}
                </nav>
              </header>

              <div
                className="mood-board-stage"
                id="mood-board-panel"
                aria-busy={refsPending}
              >
                <figure
                  className="mood-hero"
                  key={heroMoodImage.src}
                  onTouchStart={onMoodHeroTouchStart}
                  onTouchEnd={onMoodHeroTouchEnd}
                >
                  <MoodMedia
                    key={heroMoodImage.src}
                    src={heroMoodImage.src}
                    alt={heroMoodImage.alt}
                    sizes="(max-width: 800px) 100vw, 62vw"
                    priority
                  />
                  <figcaption>
                    <span>{heroMoodImage.caption}</span>
                    <small className="desktop-only">Arrow keys step photos</small>
                  </figcaption>
                </figure>
                <div className="mood-side">
                  <div
                    className="mood-gallery"
                    role="group"
                    aria-label={`${activeMood.label} references`}
                  >
                    {activeMood.images.map((image, index) => {
                      const selected = index === moodImageIndex;
                      return (
                        <button
                          key={`${image.src}-${image.caption}`}
                          type="button"
                          id={`mood-thumb-${index}`}
                          aria-pressed={selected}
                          aria-label={image.alt}
                          className={selected ? "mood-thumb is-active" : "mood-thumb"}
                          onClick={() => selectMoodImage(index)}
                        >
                          <MoodMedia
                            key={image.src}
                            src={image.src}
                            alt=""
                            sizes="(max-width: 800px) 28vw, 14vw"
                            priority={index < 4}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="mood-finishes-block">
                    <p className="mood-finishes-label">Finishes</p>
                    <ul className="mood-finishes" aria-label="Finish palette">
                      {activeMood.finishes.map((finish) => (
                        <li key={finish}>{finish}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    className="mobile-inline-cta mobile-only"
                    onClick={() => navigate({ view: "model", zone: zoneFromMood(activeMood.id) })}
                  >
                    Open the house
                  </button>
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
              aria-hidden={compact ? !sheetOpen : undefined}
              inert={compact && !sheetOpen ? true : undefined}
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
            <span>{entry.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
