"use client";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { lazy, Suspense, startTransition, useCallback, useEffect, useRef, useState, useTransition, type KeyboardEvent as ReactKeyboardEvent, type TouchEvent } from "react";
import { house, statusCopy, type ZoneId } from "@/data/house";
import {
  furnitureCatalog,
  furnitureDimensions,
  type FurnitureDimensions,
  type FurnitureId,
  type FurnitureSizeOverrides,
} from "@/data/furniture";
import { isMoodBoardId, roomMoodBoards, type MoodBoardId } from "@/data/moodboards";
import { site } from "@/data/site";
import { kitchenViews, type KitchenView, type FloorFinish } from "@/data/kitchen";
import { FURNITURE_STORAGE_KEY, parseFurnitureLayout } from "@/lib/furnitureLayout";
import { usePanelFocus } from "@/lib/usePanelFocus";
import { RoomDirectory } from "./RoomDirectory";
import { SceneBoundary } from "./SceneBoundary";
import { Compass, type CompassHandle } from "./Compass";
import { ArchitecturalPlan } from "./ArchitecturalPlan";
import { DimensionedOverlay } from "./DimensionedOverlay";
import { MaterialsBoard, MoodTextureStrip } from "./MaterialsBoard";
import { ProductSourcebook } from "./ProductSourcebook";
import { MoodMedia, prefetchMoodSrcs } from "./MoodMedia";

const MeasuredHouseScene = lazy(() =>
  import("./MeasuredHouseScene").then((module) => ({
    default: module.MeasuredHouseScene,
  })),
);

type View = "model" | "plan" | "references" | "materials" | "sourcebook";
type CameraMode = "overview" | "room" | "plan";

function supportsWebGL() {
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    // Do not deliberately lose the probe context. Safari and iOS can briefly
    // count that forced loss against the page's active WebGL context budget,
    // causing the real renderer to fall back intermittently.
    return Boolean(context && context.getContextAttributes());
  } catch {
    return false;
  }
}

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

const VIEWS: { id: View; label: string }[] = [
  { id: "model", label: "House" },
  { id: "plan", label: "Plan" },
  { id: "references", label: "Mood" },
  { id: "materials", label: "Materials" },
  { id: "sourcebook", label: "Sourcebook" },
];

const isView = (value: string | null): value is View =>
  VIEWS.some((entry) => entry.id === value);

const isZoneId = (value: string | null): value is ZoneId =>
  house.zones.some((zone) => zone.id === value);

const zoneFromMood = (id: MoodBoardId): ZoneId =>
  id === "terrace" || id === "openings" ? "central-core" : id;

export function HouseExplorer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const viewParam = searchParams.get("view");
  const zoneParam = searchParams.get("zone");
  const moodParam = searchParams.get("mood");
  const view: View = isView(viewParam) ? viewParam : "model";
  const cameraParam = searchParams.get("camera");
  const cameraMode: CameraMode = cameraParam === "overview" || cameraParam === "room" || cameraParam === "plan"
    ? cameraParam : isZoneId(zoneParam) ? "room" : "overview";
  const selectedZone: ZoneId = isZoneId(zoneParam) ? zoneParam : "north-extension";
  const floorFinish: FloorFinish = searchParams.get("floor") === "sand-microtopping" ? "sand-microtopping" : "oak";
  const selectedMood: MoodBoardId = isMoodBoardId(moodParam)
    ? moodParam
    : isMoodBoardId(zoneParam)
      ? zoneParam
      : "central-core";

  const navigate = (
    next: { view?: View; zone?: ZoneId; mood?: MoodBoardId; floor?: FloorFinish; camera?: CameraMode },
    mode: "push" | "replace" = "push",
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.floor) params.set("floor", next.floor);
    params.set("view", next.view ?? view);
    params.set("camera", next.camera ?? cameraMode);
    if (next.mood) {
      params.set("mood", next.mood);
      params.set("zone", zoneFromMood(next.mood));
    } else {
      params.set("zone", next.zone ?? selectedZone);
      if (next.zone && isMoodBoardId(next.zone)) params.set("mood", next.zone);
    }
    const url = `${pathname}?${params.toString()}`;
    // These parameters only select local explorer state. Native history keeps
    // Next's search params and back/forward navigation in sync without waiting
    // for a server navigation before the camera can respond.
    if (mode === "replace") window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  };

  const [designMode, setDesignMode] = useState(true);
  const [quality, setQuality] = useState<"high" | "light">("high");
  const [webglSupport, setWebglSupport] = useState<boolean | null>(null);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const compassRef = useRef<CompassHandle>(null);
  const updateCompass = useCallback((azimuth: number) => compassRef.current?.update(azimuth), []);
  // Open on a curated late-afternoon presentation light; the controls still
  // offer local time for daylight studies.
  const [sunHour, setSunHour] = useState(16.75);
  const [allDoorsOpen, setAllDoorsOpen] = useState(true);
  const [doorStates, setDoorStates] = useState<Record<string, boolean>>({});
  const [kitchenView, setKitchenView] = useState<KitchenView>("entrance");
  const [kitchenAppliances, setKitchenAppliances] = useState({ fridge: false, dishwasher: false });
  const toggleKitchenAppliance = (id: "fridge" | "dishwasher") => setKitchenAppliances((previous) => ({ ...previous, [id]: !previous[id] }));
  const [cameraRevision, setCameraRevision] = useState(0);
  const [furnitureSizes, setFurnitureSizes] = useState<FurnitureSizeOverrides>({});
  const [removedFurniture, setRemovedFurniture] = useState<FurnitureId[]>([]);
  const [furnitureStorageReady, setFurnitureStorageReady] = useState(false);
  const [furnitureEditorOpen, setFurnitureEditorOpen] = useState(false);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<FurnitureId>("living-sofa");
  const [exportStatus, setExportStatus] = useState("");
  const [moodImageByBoard, setMoodImageByBoard] = useState<Partial<Record<MoodBoardId, number>>>({});
  const [moodBackdropEnabled, setMoodBackdropEnabled] = useState(true);
  const [moodLightboxOpen, setMoodLightboxOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [refsPending, startRefsTransition] = useTransition();
  const stageRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const moodHeroButtonRef = useRef<HTMLButtonElement>(null);
  const moodLightboxPanelRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLElement>(null);
  const furnitureRef = useRef<HTMLElement>(null);

  usePanelFocus(detailRef, compact && sheetOpen && (view === "model" || view === "references"), () => setSheetOpen(false), true, stageRef);
  usePanelFocus(experienceRef, view === "model" && experienceOpen, () => setExperienceOpen(false), compact, stageRef);
  usePanelFocus(furnitureRef, view === "model" && furnitureEditorOpen, () => setFurnitureEditorOpen(false), compact, stageRef);
  usePanelFocus(moodLightboxPanelRef, view === "references" && moodLightboxOpen, () => setMoodLightboxOpen(false), true, moodHeroButtonRef);

  const handleSceneUnavailable = useCallback(() => {
    setWebglSupport(false);
    setExperienceOpen(false);
    setFurnitureEditorOpen(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(FURNITURE_STORAGE_KEY);
        if (saved) {
          const parsed = parseFurnitureLayout(JSON.parse(saved));
          setFurnitureSizes(parsed.sizes);
          setRemovedFurniture(parsed.removedIds);
        }
      } catch {
        // Ignore malformed or unavailable browser storage and retain defaults.
      } finally {
        setFurnitureStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!furnitureStorageReady) return;
    try {
      window.localStorage.setItem(
        FURNITURE_STORAGE_KEY,
        JSON.stringify({ sizes: furnitureSizes, removedIds: removedFurniture }),
      );
    } catch {
      // The editor remains usable when storage is blocked by the browser.
    }
  }, [furnitureSizes, furnitureStorageReady, removedFurniture]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const isSmall = window.matchMedia("(max-width: 800px)").matches;
      const saveData =
        "connection" in navigator &&
        Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
      if (isSmall || saveData) setQuality("light");
      setWebglSupport(supportsWebGL());
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

  const active = house.zones.find((zone) => zone.id === selectedZone) ?? house.zones[0];
  const activeZoneIndex = Math.max(0, house.zones.findIndex((zone) => zone.id === active.id));
  const activeMood = roomMoodBoards.find((board) => board.id === selectedMood) ?? roomMoodBoards[1];

  const moodImageCount = activeMood.images.length;
  const moodImageIndex = Math.min(moodImageByBoard[selectedMood] ?? 0, Math.max(moodImageCount - 1, 0));
  const heroMoodImage = activeMood.images[moodImageIndex] ?? activeMood.images[0];
  const moodIndexLabel = `${moodImageIndex + 1} / ${moodImageCount}`;
  const sunTime = `${String(Math.floor(sunHour)).padStart(2, "0")}:${String(Math.round((sunHour % 1) * 60)).padStart(2, "0")}`;
  const sunPhase = sunHour < 5.5 || sunHour >= 20.5 ? "Night" : sunHour < 8 ? "Early light" : sunHour < 12 ? "Morning" : sunHour < 16 ? "High sun" : sunHour < 18.5 ? "Golden hour" : "Blue hour";

  const useLocalTime = () => {
    const now = new Date();
    setSunHour(now.getHours() + now.getMinutes() / 60);
  };

  const setEveryDoor = (open: boolean) => {
    setAllDoorsOpen(open);
    setDoorStates({});
  };

  const toggleDoor = (id: string) => {
    setDoorStates((current) => ({ ...current, [id]: !(current[id] ?? allDoorsOpen) }));
  };

  const selectedFurnitureSize = furnitureDimensions(selectedFurnitureId, furnitureSizes);

  const updateFurnitureDimension = (key: keyof FurnitureDimensions, value: number) => {
    if (!Number.isFinite(value)) return;
    setFurnitureSizes((current) => ({
      ...current,
      [selectedFurnitureId]: {
        ...furnitureDimensions(selectedFurnitureId, current),
        [key]: Math.max(10, Math.min(600, Math.round(value))),
      },
    }));
    setExportStatus("");
  };

  const resetFurniture = () => {
    setFurnitureSizes((current) => {
      const next = { ...current };
      delete next[selectedFurnitureId];
      return next;
    });
    setExportStatus("");
  };

  const toggleFurnitureRemoved = () => {
    setRemovedFurniture((current) =>
      current.includes(selectedFurnitureId)
        ? current.filter((id) => id !== selectedFurnitureId)
        : [...current, selectedFurnitureId],
    );
    setExportStatus("");
  };

  const exportFurniture = () => {
    const payload = {
      schema: "villa-nehama/furniture-layout@2",
      unit: "cm",
      exportedAt: new Date().toISOString(),
      furniture: furnitureCatalog.map((item) => ({
        uuid: item.uuid,
        id: item.id,
        label: item.label,
        room: item.room,
        dimensions: furnitureDimensions(item.id, furnitureSizes),
        removed: removedFurniture.includes(item.id),
      })),
    };
    const json = JSON.stringify(payload, null, 2);
    const blobUrl = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "villa-nehama-furniture.json";
    link.click();
    URL.revokeObjectURL(blobUrl);
    void navigator.clipboard?.writeText(json).catch(() => undefined);
    setExportStatus("JSON downloaded · copied when permitted");
  };

  const stepMoodImage = (step: number) => {
    if (moodImageCount < 2) return;
    setMoodImageByBoard((prev) => {
      const current = prev[selectedMood] ?? 0;
      const next = ((current + step) % moodImageCount + moodImageCount) % moodImageCount;
      return { ...prev, [selectedMood]: next };
    });
  };

  const onMoodKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    stepMoodImage(event.key === "ArrowRight" ? 1 : -1);
  };

  const onGalleryKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || moodImageCount < 2) return;
    const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    if (!backward && !forward && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    event.stopPropagation();
    const index = event.key === "Home" ? 0 : event.key === "End" ? moodImageCount - 1 : (moodImageIndex + (forward ? 1 : -1) + moodImageCount) % moodImageCount;
    setMoodImageByBoard((previous) => ({ ...previous, [selectedMood]: index }));
    event.currentTarget.querySelectorAll<HTMLButtonElement>("button")[index]?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (view !== "references") return;
    const neighbors = [
      activeMood.images[(moodImageIndex + 1) % moodImageCount]?.src,
      activeMood.images[(moodImageIndex - 1 + moodImageCount) % moodImageCount]?.src,
    ].filter(Boolean) as string[];
    const boardCovers = roomMoodBoards.map((board) => board.images[0]?.src).filter(Boolean) as string[];
    prefetchMoodSrcs([...neighbors, ...boardCovers]);
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

  const onMoodHeroTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1) { moodTouch.current = null; return; }
    const touch = event.changedTouches[0];
    if (!touch) return;
    moodTouch.current = { x: touch.clientX, y: touch.clientY };
  };

  const onMoodHeroTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = moodTouch.current;
    moodTouch.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch || event.touches.length > 0) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    event.preventDefault();
    stepMoodImage(dx < 0 ? 1 : -1);
  };

  const onMoodLightboxTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = moodTouch.current;
    moodTouch.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch || event.touches.length > 0) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
    event.preventDefault();
    stepMoodImage(dx < 0 ? 1 : -1);
  };

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

  const returnToHouse = () => {
    navigate({ view: "model", camera: "overview" }, "replace");
    if (cameraMode === "overview") setCameraRevision((revision) => revision + 1);
    setExperienceOpen(false);
    setFurnitureEditorOpen(false);
  };

  const goToView = (next: View) => {
    setMoodLightboxOpen(false);
    setSheetOpen(false);
    setExperienceOpen(false);
    setFurnitureEditorOpen(false);
    if (next === "model") {
      returnToHouse();
      return;
    }
    if (next === view) return;
    navigate(next === "references" ? { view: next, mood: selectedMood } : { view: next }, "replace");
  };

  const selectRoom = (id: ZoneId) => {
    setSheetOpen(false);
    setExperienceOpen(false);
    setFurnitureEditorOpen(false);
    if (cameraMode === "room" && selectedZone === id) setCameraRevision((revision) => revision + 1);
    navigate({ view: "model", zone: id, camera: "room" }, "replace");
  };

  const planFallback = (
    <div className="webgl-fallback">
      <div className="fallback-notice" role="status">
        <strong>The house, in plan.</strong>
        <p>3D is unavailable here. You can still explore every room and its finishes.</p>
        <button type="button" onClick={() => setWebglSupport(supportsWebGL())}>Try 3D again</button>
      </div>
      <ArchitecturalPlan selected={cameraMode === "room" ? selectedZone : undefined} onSelect={selectRoom} interactive idPrefix="fallback" />
    </div>
  );

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
          selectRoom(zoneFromMood(activeMood.id));
        }}
      >
        <span className="detail-thumb">
          <Image src={heroMoodImage.src} alt="" fill sizes="64px" unoptimized />
        </span>
        <span>
          <small>Explore in 3D</small>
          View {activeMood.label}
        </span>
      </button>
    </>
  ) : cameraMode !== "room" ? (
    <>
      <p className="detail-kicker">A home, reimagined</p>
      <h2>Warm materials.<br />Room to live.</h2>
      <p className="detail-copy">Explore Villa Nehama, from the whole-house plan to the light, finishes and details of each room.</p>
      <RoomDirectory onSelect={selectRoom} />
      <p className="detail-note">A remodel study based on the measured drawing. Furnishings and finishes show design intent.</p>
      <button type="button" className="overview-plan-link" onClick={() => goToView("plan")}>View the measured plan <span aria-hidden="true">↗</span></button>
    </>
  ) : (
    <>
      <div className="detail-head">
        <span className={`status-tag ${active.status}`}>{statusCopy[active.status]}</span>
        <span className="detail-index" aria-label={`Room ${activeZoneIndex + 1} of ${house.zones.length}`}>
          {String(activeZoneIndex + 1).padStart(2, "0")} / {String(house.zones.length).padStart(2, "0")}
        </span>
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
      <p className="detail-note">
        {active.status === "measured"
          ? "Measured envelope from the survey; furnishings and finishes are remodel intent."
          : "Envelope traced from the survey; openings, furnishings and finishes follow the approved working model."}
      </p>
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
          <small>Mood references</small>
          {active.label} palette
        </span>
      </button>
      <RoomDirectory selected={selectedZone} onSelect={selectRoom} />
    </>
  );

  return (
    <main className={sheetOpen ? "shell is-sheet-open" : "shell"}>
      <header className="app-bar">
<a className="logo" href="#top" aria-label={`${site.name} home`} onClick={(event) => { event.preventDefault(); goToView("model"); }}>
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
              aria-label="Use lighter rendering"
              aria-pressed={quality === "light"}
              onClick={() => setQuality((value) => (value === "high" ? "light" : "high"))}
            >
              {quality === "high" ? "Detail: High" : "Detail: Light"}
            </button>
          )}
        </div>
      </header>

      <div className={`app-body is-${view}`} id="top">
        <section
          ref={stageRef}
          id="explorer-content"
          tabIndex={-1}
          className={`stage is-${view}`}
          aria-label={view === "model" ? "House" : view === "plan" ? "Measured plan" : view === "references" ? "Mood" : view === "materials" ? "Materials" : "Product sourcebook"}
        >
          {view === "model" && (
            <>
              <div className="three-stage">
                {webglSupport === true && (
                  <SceneBoundary fallback={planFallback} onUnavailable={handleSceneUnavailable}>
                  <Suspense fallback={<div className="model-loading" role="status">Opening your house…</div>}>
                    <MeasuredHouseScene
                      selectedZone={selectedZone}
                      onSelectZone={selectRoom}
                      onUnavailable={handleSceneUnavailable}
                      designMode={designMode}
                      quality={quality}
                      showMeasurements={showMeasurements}
                      onCameraAzimuth={updateCompass}
                      sunHour={sunHour}
                      allDoorsOpen={allDoorsOpen}
                      doorStates={doorStates}
                      onToggleDoor={toggleDoor}
                      cameraMode={cameraMode}
                      cameraRevision={cameraRevision}
                      kitchenView={kitchenView}
                      floorFinish={floorFinish}
                      kitchenAppliances={kitchenAppliances}
                      onToggleKitchenAppliance={toggleKitchenAppliance}
                      furnitureSizes={furnitureSizes}
                      removedFurniture={removedFurniture}
                      selectedFurnitureId={furnitureEditorOpen ? selectedFurnitureId : undefined}
                      onSelectFurniture={(id) => {
                        setSelectedFurnitureId(id);
                        if (!compact) setFurnitureEditorOpen(true);
                        setExportStatus("");
                      }}
                    />
                  </Suspense>
                  </SceneBoundary>
                )}
                {webglSupport === false && planFallback}
                {webglSupport === null && <div className="model-loading" role="status">Opening your house…</div>}
              </div>

              <p id="model-keyboard-help" className="sr-only">3D view: arrow keys orbit, plus and minus zoom. Shift and arrow keys pan when available. Use the room list or Plan view for a two-dimensional alternative.</p>
              <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{cameraMode === "room" ? `${active.label} room view` : cameraMode === "plan" ? "House top view" : "Whole house overview"}</p>
              <div className="stage-toolbar" hidden={webglSupport === false} role="group" aria-label="Model controls">
                <div className="segmented">
                  <button
                    type="button"
                    className={!designMode ? "is-active" : ""}
                    aria-pressed={!designMode}
                    onClick={() => setDesignMode(false)}
                  >
                    {compact ? "Shell" : "Survey shell"}
                  </button>
                  <button
                    type="button"
                    className={designMode ? "is-active" : ""}
                    aria-pressed={designMode}
                    onClick={() => setDesignMode(true)}
                  >
                    {compact ? "Finishes" : "With finishes"}
                  </button>
                </div>
                {webglSupport === true && (
                  <>
                    <button
                      type="button"
                      className={furnitureEditorOpen ? "toolbar-chip desktop-model-control is-active" : "toolbar-chip desktop-model-control"}
                      aria-expanded={furnitureEditorOpen}
                      aria-controls="furniture-editor"
                      onClick={() => { setExperienceOpen(false); setFurnitureEditorOpen((value) => !value); }}
                    >
                      Furniture
                    </button>
                    <button
                      type="button"
                      className={showMeasurements ? "toolbar-chip desktop-model-control is-active" : "toolbar-chip desktop-model-control"}
                      aria-pressed={showMeasurements}
                      onClick={() => setShowMeasurements((value) => !value)}
                    >
                      Dimensions
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className={experienceOpen ? "toolbar-chip controls-trigger is-active" : "toolbar-chip controls-trigger"}
                  aria-expanded={experienceOpen}
                  aria-controls="experience-controls"
                  onClick={() => {
                    setFurnitureEditorOpen(false);
                    setExperienceOpen((value) => !value);
                  }}
                >
                  Controls
                </button>
              </div>

              <button
                type="button"
                className={experienceOpen || furnitureEditorOpen ? "model-popover-scrim mobile-only is-open" : "model-popover-scrim mobile-only"}
                data-modal-backdrop
                aria-hidden="true"
                tabIndex={-1}
                onClick={() => {
                  setExperienceOpen(false);
                  setFurnitureEditorOpen(false);
                }}
              />

              {webglSupport === true && furnitureEditorOpen && (
                <aside ref={furnitureRef} className="furniture-editor" id="furniture-editor" role={compact ? "dialog" : undefined} aria-modal={compact ? true : undefined} tabIndex={-1} aria-label="Furniture sizing editor">
                  <div className="furniture-editor-head">
                    <div>
                      <p>Model schedule</p>
                      <h2>Furniture sizing</h2>
                    </div>
                    <button type="button" aria-label="Close furniture editor" onClick={() => setFurnitureEditorOpen(false)}>
                      <Icon name="close" />
                    </button>
                  </div>

                  <label className="furniture-select">
                    <span>Piece</span>
                    <select value={selectedFurnitureId} onChange={(event) => setSelectedFurnitureId(event.target.value as FurnitureId)}>
                      {furnitureCatalog.map((item) => (
                        <option key={item.id} value={item.id}>{item.room} · {item.label}</option>
                      ))}
                    </select>
                  </label>

                  <div className="furniture-dimensions">
                    {([
                      ["widthCm", "Width"],
                      ["depthCm", "Depth"],
                      ["heightCm", "Height"],
                    ] as const).map(([key, label]) => (
                      <label key={key}>
                        <span>{label}</span>
                        <span className="dimension-input">
                          <input
                            type="number"
                            inputMode="numeric"
                            min="10"
                            max="600"
                            step="1"
                            value={selectedFurnitureSize[key]}
                            onChange={(event) => updateFurnitureDimension(key, Number(event.target.value))}
                          />
                          <i>cm</i>
                        </span>
                      </label>
                    ))}
                  </div>

                  <p className="furniture-editor-note">Click a piece in the model or choose it here. Changes save locally and scale live around its floor-centre.</p>
                  <div className="furniture-editor-actions">
                    <button type="button" onClick={resetFurniture}>Reset piece</button>
                    <button
                      type="button"
                      className={removedFurniture.includes(selectedFurnitureId) ? "is-restore" : "is-remove"}
                      onClick={toggleFurnitureRemoved}
                    >
                      {removedFurniture.includes(selectedFurnitureId) ? "Restore piece" : "Remove piece"}
                    </button>
                    <button type="button" className="is-primary" onClick={exportFurniture}>Export JSON</button>
                  </div>
                  <p className="furniture-save-status">Saved in this browser · export after final adjustments</p>
                  {exportStatus && <p className="furniture-export-status" role="status">{exportStatus}</p>}
                </aside>
              )}

              {webglSupport === true && (
                <section
                  ref={experienceRef}
                  className={experienceOpen ? "experience-dock is-open" : "experience-dock"}
                  id="experience-controls"
                  role={compact ? "dialog" : undefined}
                  aria-modal={compact && experienceOpen ? true : undefined}
                  tabIndex={-1}
                  aria-label="Daylight, door, and camera controls"
                  aria-hidden={!experienceOpen}
                  inert={!experienceOpen ? true : undefined}
                >
                  <div className="experience-dock-head">
                    <span className="sun-orb" aria-hidden="true" />
                    <div>
                      <p>{sunPhase}</p>
                      <strong>{sunTime}</strong>
                    </div>
                    <div className="experience-head-actions">
                      <button type="button" onClick={useLocalTime}>Local now</button>
                      <button
                        type="button"
                        className="experience-close"
                        aria-label="Close controls"
                        onClick={() => setExperienceOpen(false)}
                      >
                        <Icon name="close" />
                      </button>
                    </div>
                  </div>
                  <label className="sun-scrubber" htmlFor="sun-hour">
                    <span>Plan-north daylight</span>
                    <input
                      id="sun-hour"
                      type="range"
                      min="0"
                      max="24"
                      step="0.25"
                      value={sunHour}
                      onChange={(event) => setSunHour(Number(event.target.value))}
                      aria-valuetext={`${sunPhase}, ${sunTime}`}
                    />
                    <span className="sun-ticks"><i>00</i><i>06</i><i>12</i><i>18</i><i>24</i></span>
                  </label>
                  <div className="door-control">
                    <span><b>Doors</b><small>Tap any leaf in the model</small></span>
                    <div className="door-control-buttons" role="group" aria-label="Set all doors">
                      <button
                        type="button"
                        className={allDoorsOpen && Object.keys(doorStates).length === 0 ? "is-active" : ""}
                        aria-pressed={allDoorsOpen && Object.keys(doorStates).length === 0}
                        onClick={() => setEveryDoor(true)}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className={!allDoorsOpen && Object.keys(doorStates).length === 0 ? "is-active" : ""}
                        aria-pressed={!allDoorsOpen && Object.keys(doorStates).length === 0}
                        onClick={() => setEveryDoor(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="camera-control">
                    <span><b>Camera</b><small>Choose a viewpoint</small></span>
                    <div className="camera-control-buttons" role="group" aria-label="Camera view">
                      {(["overview", "room", "plan"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={cameraMode === mode ? "is-active" : ""}
                          aria-pressed={cameraMode === mode}
                          onClick={() => {
                            if (mode === "overview") {
                              returnToHouse();
                              return;
                            }
                            navigate({ camera: mode }, "replace");
                            if (cameraMode === mode) setCameraRevision((revision) => revision + 1);
                          }}
                        >
                          {mode === "overview" ? "House" : mode === "room" ? "Room" : "Plan"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <fieldset className="finish-control">
                    <legend>Floor finish</legend>
                    <div className="finish-options">
                      {([['oak', 'Oak parquet'], ['sand-microtopping', 'Sand microtopping']] as const).map(([id, label]) => (
                        <button key={id} type="button" aria-pressed={floorFinish === id} onClick={() => navigate({ floor: id }, "replace")}>
                          <span className={`finish-swatch is-${id}`} aria-hidden="true" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                    <p>Continuous finish throughout the dry rooms.</p>
                  </fieldset>
                  <div className="mobile-model-actions mobile-only">
                    <button
                      type="button"
                      onClick={() => {
                        setExperienceOpen(false);
                        setFurnitureEditorOpen(true);
                      }}
                    >
                      Edit furniture
                    </button>
                    <button
                      type="button"
                      className={showMeasurements ? "is-active" : ""}
                      onClick={() => setShowMeasurements((value) => !value)}
                    >
                      {showMeasurements ? "Hide dimensions" : "Show dimensions"}
                    </button>
                  </div>
                </section>
              )}

              {cameraMode !== "overview" && webglSupport === true && (
                <button
                  type="button"
                  className="return-house-button"
                  onClick={returnToHouse}
                  aria-label="Return to the main house overview"
                >
                  <FootprintMark />
                  <span>Back to house</span>
                </button>
              )}
              {cameraMode === "room" && selectedZone === "north-extension" && webglSupport === true && (
                <div className="kitchen-view-strip" role="group" aria-label="Kitchen viewpoints">
                  {kitchenViews.map((shot, index) => (
                    <button key={shot.id} type="button" aria-pressed={kitchenView === shot.id} onClick={() => {
                      setKitchenView(shot.id);
                      setCameraRevision((revision) => revision + 1);
                    }}><span>0{index + 1}</span>{shot.label}</button>
                  ))}
                </div>
              )}

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
                      <p className="hud-kicker">{cameraMode === "room" ? "Room details" : "Villa Nehama"}</p>
                      <h2>{cameraMode === "room" ? active.label : "Explore the house"}</h2>
                      <p className="hud-hint">{webglSupport === false ? "Tap for rooms and finishes" : "Drag to orbit · pinch to zoom · room notes"}</p>
                    </div>
                    <span className="hud-open" aria-hidden="true">
                      <Icon name="chevron" />
                    </span>
                  </button>
                ) : (
                  <div className="hud-card">
                    <div className="hud-card-text">
                      <p className="hud-kicker">{cameraMode === "overview" ? "House overview" : cameraMode === "plan" ? "Top view" : active.shortLabel}</p>
                      <h2>{cameraMode !== "room" ? "Choose a room to explore" : active.label}</h2>
                      <p className="hud-hint">{webglSupport === false ? "Select a room to see its details" : "Drag to orbit · scroll to zoom · arrow keys when focused"}</p>
                    </div>
                  </div>
                )}
                {webglSupport === true && <Compass ref={compassRef} />}
              </div>
            </>
          )}

          {view === "plan" && (
            <div className="plan-view">
              <header className="view-intro">
                <p className="view-kicker">Measured drawing</p>
                <h2>The measured plan</h2>
                <p>Explore the dimensions and compare the house with the original survey.</p>
              </header>
              <DimensionedOverlay />
            </div>
          )}

          {view === "references" && (
            <div className={refsPending ? "references-view is-pending" : "references-view"}>
              <header className="mood-masthead">
                <div className="mood-masthead-row">
                  <p className="mood-masthead-kicker">{site.tagline}</p>
                  <p className="mood-index" aria-live="polite" aria-atomic="true" aria-label={`Image ${moodImageIndex + 1} of ${moodImageCount}: ${heroMoodImage.caption}`}>
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

              <MoodTextureStrip moodId={activeMood.id} onOpen={() => goToView("materials")} />

              <div
                className="mood-board-stage"
                id="mood-board-panel"
                aria-busy={refsPending}
                onKeyDown={onMoodKeyDown}
              >
                <figure
                  className="mood-hero"
                  onTouchStart={onMoodHeroTouchStart}
                  onTouchEnd={onMoodHeroTouchEnd}
                  onTouchCancel={() => { moodTouch.current = null; }}
                >
                  <button
                    type="button"
                    className="mood-hero-open"
                    ref={moodHeroButtonRef}
                    onClick={() => setMoodLightboxOpen(true)}
                    aria-label={`View ${heroMoodImage.caption} full screen`}
                    aria-haspopup="dialog"
                  >
                    <MoodMedia
                      key={heroMoodImage.src}
                      src={heroMoodImage.src}
                      alt={heroMoodImage.alt}
                      sizes="(max-width: 800px) 100vw, 62vw"
                      priority
                      backdrop={moodBackdropEnabled}
                    />
                    <span className="mood-hero-open-label">View full image <span aria-hidden="true">↗</span></span>
                  </button>
                  <button
                    type="button"
                    className={`mood-backdrop-toggle${moodBackdropEnabled ? " is-active" : ""}`}
                    aria-pressed={moodBackdropEnabled}
                    onClick={(event) => { event.stopPropagation(); setMoodBackdropEnabled((enabled) => !enabled); }}
                  >
                    {moodBackdropEnabled ? "Ambient backdrop" : "Flat backdrop"}
                  </button>
                  <button
                    type="button"
                    className="mood-hero-arrow is-prev"
                    onClick={(event) => { event.stopPropagation(); stepMoodImage(-1); }}
                    aria-label="Previous mood image"
                  >‹</button>
                  <button
                    type="button"
                    className="mood-hero-arrow is-next"
                    onClick={(event) => { event.stopPropagation(); stepMoodImage(1); }}
                    aria-label="Next mood image"
                  >›</button>
                  <figcaption>
                    <span>{heroMoodImage.caption}</span>
                    <small>Open full image · ← →</small>
                  </figcaption>
                </figure>
                <div className="mood-side">
                  <div
                    className="mood-gallery"
                    role="group"
                    aria-label={`${activeMood.label} references`}
                    onKeyDown={onGalleryKeyDown}
                  >
                    {activeMood.images.map((image, index) => {
                      const selected = index === moodImageIndex;
                      return (
                        <button
                          key={`${image.src}-${image.caption}`}
                          type="button"
                          id={`mood-thumb-${index}`}
                          aria-pressed={selected}
                          tabIndex={selected ? 0 : -1}
                          aria-label={`Image ${index + 1} of ${moodImageCount}: ${image.alt}`}
                          className={selected ? "mood-thumb is-active" : "mood-thumb"}
                          onClick={() => selectMoodImage(index)}
                        >
                          <MoodMedia
                            key={image.src}
                            src={image.src}
                            alt=""
                            sizes="80px"
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
                    onClick={() => selectRoom(zoneFromMood(activeMood.id))}
                  >
                    Open the house
                  </button>
                </div>
              </div>

              {moodLightboxOpen && (
                <div className="mood-lightbox">
                  <button type="button" className="mood-lightbox-backdrop" data-modal-backdrop aria-hidden="true" tabIndex={-1} onClick={() => setMoodLightboxOpen(false)} />
                  <div className="mood-lightbox-panel" ref={moodLightboxPanelRef} role="dialog" aria-modal="true" aria-label={`${activeMood.label} image viewer`} tabIndex={-1} onKeyDown={onMoodKeyDown}>
                    <header className="mood-lightbox-head">
                      <div>
                        <p>{activeMood.label}</p>
                        <span>{moodIndexLabel} · swipe or use arrow keys</span>
                      </div>
                      <button type="button" className="mood-lightbox-close" onClick={() => setMoodLightboxOpen(false)} aria-label="Close image viewer">×</button>
                    </header>
                    <div
                      className="mood-lightbox-stage"
                      onTouchStart={onMoodHeroTouchStart}
                      onTouchEnd={onMoodLightboxTouchEnd}
                      onTouchCancel={() => { moodTouch.current = null; }}
                    >
                      <button type="button" className="mood-lightbox-arrow is-prev" onClick={() => stepMoodImage(-1)} aria-label="Previous image">‹</button>
                      <MoodMedia
                        key={`lightbox-${heroMoodImage.src}`}
                        src={heroMoodImage.src}
                        alt={heroMoodImage.alt}
                        sizes="100vw"
                        priority
                        className="mood-lightbox-media"
                      />
                      <button type="button" className="mood-lightbox-arrow is-next" onClick={() => stepMoodImage(1)} aria-label="Next image">›</button>
                    </div>
                    <footer className="mood-lightbox-foot">
                      <span role="status" aria-live="polite" aria-atomic="true">Image {moodImageIndex + 1} of {moodImageCount}: {heroMoodImage.caption}</span>
                      <div className="mood-lightbox-dots" role="group" aria-label="Choose mood image" onKeyDown={onGalleryKeyDown}>
                        {activeMood.images.map((image, index) => (
                          <button key={image.src} type="button" aria-pressed={index === moodImageIndex} tabIndex={index === moodImageIndex ? 0 : -1} aria-label={`Image ${index + 1}: ${image.caption}`} className={index === moodImageIndex ? "is-active" : ""} onClick={() => selectMoodImage(index)} />
                        ))}
                      </div>
                    </footer>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "materials" && <MaterialsBoard />}
          {view === "sourcebook" && <ProductSourcebook />}
        </section>

        {view === "model" && (
          <div className="mobile-room-rail mobile-only" role="group" aria-label="Rooms">
            {house.zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                className={cameraMode === "room" && selectedZone === zone.id ? "room-chip is-active" : "room-chip"}
                aria-pressed={cameraMode === "room" && selectedZone === zone.id}
                onClick={() => {
                  if (selectedZone === zone.id && cameraMode === "room") {
                    setSheetOpen(true);
                    return;
                  }
                  selectRoom(zone.id);
                }}
              >
                <em>{zone.shortLabel}</em>
                {zone.label}
              </button>
            ))}
          </div>
        )}

        {(view === "model" || view === "references") && (
          <>
            <button
              type="button"
              className={sheetOpen ? "sheet-scrim is-open mobile-only" : "sheet-scrim mobile-only"}
              data-modal-backdrop
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => setSheetOpen(false)}
            />
            <aside
              ref={detailRef}
              id="detail-sheet"
              role={compact ? "dialog" : undefined}
              aria-modal={compact && sheetOpen ? true : undefined}
              aria-label={view === "references" ? `${activeMood.label} references` : cameraMode === "room" ? `${active.label} room details` : "Explore the house"}
              tabIndex={-1}
              className={sheetOpen ? "detail is-open" : "detail"}
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
