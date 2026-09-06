"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { lazy, Suspense, startTransition, useEffect, useRef, useState, useTransition, type TouchEvent } from "react";
import { house, statusCopy, type ZoneId } from "@/data/house";
import {
  furnitureById,
  furnitureCatalog,
  furnitureDimensions,
  type FurnitureDimensions,
  type FurnitureId,
  type FurnitureSizeOverrides,
} from "@/data/furniture";
import { isMoodBoardId, roomMoodBoards, type MoodBoardId } from "@/data/moodboards";
import { site } from "@/data/site";
import { gsap, motionEase, motionEaseIn, useGSAP } from "@/lib/gsap";
import { ArchitecturalPlan } from "./ArchitecturalPlan";
import { DimensionedOverlay } from "./DimensionedOverlay";
import { MaterialsBoard, MoodTextureStrip } from "./MaterialsBoard";
import { MoodMedia, prefetchMoodSrcs } from "./MoodMedia";

const MeasuredHouseScene = lazy(() =>
  import("./MeasuredHouseScene").then((module) => ({
    default: module.MeasuredHouseScene,
  })),
);

type View = "model" | "plan" | "references" | "materials";

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
];

const isView = (value: string | null): value is View =>
  VIEWS.some((entry) => entry.id === value);

const isZoneId = (value: string | null): value is ZoneId =>
  house.zones.some((zone) => zone.id === value);

const FURNITURE_STORAGE_KEY = "villa-nehama:furniture-layout:v1";

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
  // Open on a curated late-afternoon presentation light; the controls still
  // offer local time for daylight studies.
  const [sunHour, setSunHour] = useState(16.75);
  const [allDoorsOpen, setAllDoorsOpen] = useState(true);
  const [doorStates, setDoorStates] = useState<Record<string, boolean>>({});
  const [cameraMode, setCameraMode] = useState<"overview" | "room" | "plan">("overview");
  const [cameraRevision, setCameraRevision] = useState(0);
  const [furnitureSizes, setFurnitureSizes] = useState<FurnitureSizeOverrides>({});
  const [removedFurniture, setRemovedFurniture] = useState<FurnitureId[]>([]);
  const [furnitureStorageReady, setFurnitureStorageReady] = useState(false);
  const [furnitureEditorOpen, setFurnitureEditorOpen] = useState(false);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<FurnitureId>("living-sofa");
  const [exportStatus, setExportStatus] = useState("");
  const [moodImageByBoard, setMoodImageByBoard] = useState<Partial<Record<MoodBoardId, number>>>({});
  const [moodLightboxOpen, setMoodLightboxOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [refsPending, startRefsTransition] = useTransition();
  const shellRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const moodHeroButtonRef = useRef<HTMLButtonElement>(null);
  const moodLightboxPanelRef = useRef<HTMLDivElement>(null);
  const moodLightboxCloseRef = useRef<HTMLButtonElement>(null);
  const scrimRef = useRef<HTMLButtonElement>(null);
  const sheetWasOpen = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(FURNITURE_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as {
            sizes?: FurnitureSizeOverrides;
            removedIds?: string[];
          };
          if (parsed.sizes && typeof parsed.sizes === "object") setFurnitureSizes(parsed.sizes);
          if (Array.isArray(parsed.removedIds)) {
            setRemovedFurniture(
              parsed.removedIds.filter((id): id is FurnitureId =>
                furnitureCatalog.some((item) => item.id === id),
              ),
            );
          }
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

  const selectedFurniture = furnitureById[selectedFurnitureId];
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

  useEffect(() => {
    if (view !== "references" || moodLightboxOpen) return;
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
  }, [view, moodImageCount, selectedMood, moodLightboxOpen]);

  const stepMoodImage = (step: number) => {
    if (moodImageCount < 2) return;
    setMoodImageByBoard((prev) => {
      const current = prev[selectedMood] ?? 0;
      const next = ((current + step) % moodImageCount + moodImageCount) % moodImageCount;
      return { ...prev, [selectedMood]: next };
    });
  };

  useEffect(() => {
    if (!moodLightboxOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoodLightboxOpen(false);
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const step = event.key === "ArrowRight" ? 1 : -1;
        setMoodImageByBoard((prev) => {
          const current = prev[selectedMood] ?? 0;
          const next = ((current + step) % moodImageCount + moodImageCount) % moodImageCount;
          return { ...prev, [selectedMood]: next };
        });
      }
      if (event.key === "Tab") {
        const panel = moodLightboxPanelRef.current;
        if (!panel) return;
        const focusable = Array.from(panel.querySelectorAll<HTMLElement>("button:not([disabled])"));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.body.classList.add("has-lightbox");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("has-lightbox");
      window.removeEventListener("keydown", onKey);
    };
  }, [moodLightboxOpen, moodImageCount, selectedMood]);

  useEffect(() => {
    if (!moodLightboxOpen) {
      moodHeroButtonRef.current?.focus();
      return;
    }
    const frame = window.requestAnimationFrame(() => moodLightboxCloseRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [moodLightboxOpen]);

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

  const onMoodLightboxTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = moodTouch.current;
    moodTouch.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
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

  const returnToHouse = () => {
    setCameraMode("overview");
    setCameraRevision((revision) => revision + 1);
    setExperienceOpen(false);
    setFurnitureEditorOpen(false);
  };

  const goToView = (next: View) => {
    setMoodLightboxOpen(false);
    setSheetOpen(false);
    setExperienceOpen(false);
    setFurnitureEditorOpen(false);
    sheetWasOpen.current = false;
    // Kill any leftover sheet transforms so the tab bar stays tappable.
    const detail = detailRef.current;
    const scrim = scrimRef.current;
    if (detail && compact) {
      gsap.killTweensOf(detail);
      gsap.set(detail, { yPercent: 108, pointerEvents: "none", clearProps: "transform,y" });
    }
    if (scrim) {
      gsap.killTweensOf(scrim);
      gsap.set(scrim, { opacity: 0, pointerEvents: "none" });
    }
    // The House tab doubles as a reliable reset from every room camera, even
    // when the user is already in the 3D view.
    if (next === "model") returnToHouse();
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
          setCameraMode("room");
          setCameraRevision((revision) => revision + 1);
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
          aria-label={view === "model" ? "House" : view === "plan" ? "Measured plan" : view === "references" ? "Mood" : "Materials"}
        >
          {view === "model" && (
            <>
              <div className="three-stage">
                {webglSupport === true && (
                  <Suspense fallback={<div className="model-loading">Settling the house…</div>}>
                    <MeasuredHouseScene
                      selectedZone={selectedZone}
                      onSelectZone={(id) => {
                        setCameraMode("room");
                        setCameraRevision((revision) => revision + 1);
                        setExperienceOpen(false);
                        navigate({ zone: id }, "replace");
                      }}
                      designMode={designMode}
                      quality={quality}
                      showMeasurements={showMeasurements}
                      onCameraAzimuth={setCameraAzimuth}
                      sunHour={sunHour}
                      allDoorsOpen={allDoorsOpen}
                      doorStates={doorStates}
                      onToggleDoor={toggleDoor}
                      cameraMode={cameraMode}
                      cameraRevision={cameraRevision}
                      furnitureSizes={furnitureSizes}
                      removedFurniture={removedFurniture}
                      selectedFurnitureId={selectedFurnitureId}
                      onSelectFurniture={(id) => {
                        setSelectedFurnitureId(id);
                        if (!compact) setFurnitureEditorOpen(true);
                        setExportStatus("");
                      }}
                    />
                  </Suspense>
                )}
                {webglSupport === false && (
                  <div className="webgl-fallback">
                    <ArchitecturalPlan
                      selected={selectedZone}
                      onSelect={(id) => navigate({ zone: id }, "replace")}
                      interactive
                      idPrefix="fallback"
                    />
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
                      onClick={() => setFurnitureEditorOpen((value) => !value)}
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
                aria-label="Close model controls"
                tabIndex={experienceOpen || furnitureEditorOpen ? 0 : -1}
                onClick={() => {
                  setExperienceOpen(false);
                  setFurnitureEditorOpen(false);
                }}
              />

              {webglSupport === true && furnitureEditorOpen && (
                <aside className="furniture-editor" id="furniture-editor" aria-label="Furniture sizing editor">
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

                  <div className="furniture-uuid">
                    <span>Stable UUID</span>
                    <code>{selectedFurniture.uuid}</code>
                  </div>

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
                  className={experienceOpen ? "experience-dock is-open" : "experience-dock"}
                  id="experience-controls"
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
                        className="experience-close mobile-only"
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
                        onClick={() => setEveryDoor(true)}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className={!allDoorsOpen && Object.keys(doorStates).length === 0 ? "is-active" : ""}
                        onClick={() => setEveryDoor(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="camera-control">
                    <span><b>Camera</b><small>Smooth architectural views</small></span>
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
                            setCameraMode(mode);
                            setCameraRevision((revision) => revision + 1);
                          }}
                        >
                          {mode === "overview" ? "House" : mode === "room" ? "Room" : "Plan"}
                        </button>
                      ))}
                    </div>
                  </div>
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
                  <p className="daylight-note">Illustrative solar study · plan north, not surveyed true north</p>
                </section>
              )}

              {cameraMode === "room" && (
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
                      <p className="hud-kicker">{cameraMode === "overview" ? "House overview" : active.shortLabel}</p>
                      <h2>{cameraMode === "overview" ? "Choose a room to explore" : active.label}</h2>
                      <p className="hud-hint">{cameraMode === "overview" ? "Select a room · orbit · scroll" : "Orbit · scroll · north on the right"}</p>
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
                <h2>Survey to architectural SVG</h2>
                <p>An AI-assisted, editable architectural reconstruction—auditable against the original drawing.</p>
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

              <MoodTextureStrip moodId={activeMood.id} onOpen={() => goToView("materials")} />

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
                  <button
                    type="button"
                    className="mood-hero-open"
                    ref={moodHeroButtonRef}
                    onClick={() => setMoodLightboxOpen(true)}
                    aria-label={`View ${heroMoodImage.caption} full screen`}
                  >
                    <MoodMedia
                      key={heroMoodImage.src}
                      src={heroMoodImage.src}
                      alt={heroMoodImage.alt}
                      sizes="(max-width: 800px) 100vw, 62vw"
                      priority
                    />
                    <span className="mood-hero-open-label">View full image <span aria-hidden="true">↗</span></span>
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
                    onClick={() => navigate({ view: "model", zone: zoneFromMood(activeMood.id) })}
                  >
                    Open the house
                  </button>
                </div>
              </div>

              {moodLightboxOpen && (
                <div className="mood-lightbox" role="dialog" aria-modal="true" aria-label={`${activeMood.label} image viewer`}>
                  <button type="button" className="mood-lightbox-backdrop" aria-label="Close image viewer" onClick={() => setMoodLightboxOpen(false)} />
                  <div className="mood-lightbox-panel" ref={moodLightboxPanelRef}>
                    <header className="mood-lightbox-head">
                      <div>
                        <p>{activeMood.label}</p>
                        <span>{moodIndexLabel} · swipe or use arrow keys</span>
                      </div>
                      <button ref={moodLightboxCloseRef} type="button" className="mood-lightbox-close" onClick={() => setMoodLightboxOpen(false)} aria-label="Close image viewer">×</button>
                    </header>
                    <div
                      className="mood-lightbox-stage"
                      onTouchStart={onMoodHeroTouchStart}
                      onTouchEnd={onMoodLightboxTouchEnd}
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
                      <span>{heroMoodImage.caption}</span>
                      <div className="mood-lightbox-dots" role="tablist" aria-label="Choose mood image">
                        {activeMood.images.map((image, index) => (
                          <button key={image.src} type="button" role="tab" aria-selected={index === moodImageIndex} aria-label={`Image ${index + 1}: ${image.caption}`} className={index === moodImageIndex ? "is-active" : ""} onClick={() => selectMoodImage(index)} />
                        ))}
                      </div>
                    </footer>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "materials" && <MaterialsBoard />}
        </section>

        {view === "model" && (
          <div className="mobile-room-rail mobile-only" aria-label="Rooms">
            {house.zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                className={selectedZone === zone.id ? "room-chip is-active" : "room-chip"}
                onClick={() => {
                  if (selectedZone === zone.id && cameraMode === "room") {
                    setSheetOpen(true);
                    return;
                  }
                  setCameraMode("room");
                  setCameraRevision((revision) => revision + 1);
                  setExperienceOpen(false);
                  navigate({ zone: zone.id }, "replace");
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
