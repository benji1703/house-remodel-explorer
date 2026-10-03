"use client";

import { useProgress } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LoadingState } from "../loading/LoadingState";

/** Signal after an actual scene frame, rather than when the WebGL context exists. */
export function SceneFirstFrame({ onReady, enabled = true }: { onReady?: () => void; enabled?: boolean }) {
  const invalidate = useThree(state => state.invalidate);
  const frame = useRef<number | null>(null);
  const sent = useRef(false);
  useFrame(() => {
    if (sent.current || !enabled) return;
    sent.current = true;
    if (onReady) frame.current = requestAnimationFrame(onReady);
  });
  useLayoutEffect(() => {
    sent.current = false;
    invalidate();
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [enabled, invalidate]);
  return null;
}

/** Wait for the requested lighting revision to reach the rendered canvas. */
export function SceneLightingFrame({ revision, onReady }: { revision: number; onReady?: (revision: number) => void }) {
  const invalidate = useThree(state => state.invalidate);
  const sent = useRef(false);
  const frame = useRef<number | null>(null);
  useLayoutEffect(() => {
    sent.current = false;
    invalidate();
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, [revision, invalidate]);
  useFrame(() => {
    if (sent.current || !onReady) return;
    sent.current = true;
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => onReady(revision));
    });
  });
  return null;
}

/** Core textures can suspend again after a quality or finish change. */
export function ScenePending({ onPending }: { onPending: () => void }) {
  useEffect(onPending, [onPending]);
  return null;
}

export function SceneLoading({ ready, onShowPlan, onRevealChange }: { ready: boolean; onShowPlan?: () => void; onRevealChange?: (revealed: boolean) => void }) {
  const coverRef = useRef<HTMLDivElement>(null);
  const [assets, setAssets] = useState(() => useProgress.getState());
  const [revealed, setRevealed] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    let update: ReturnType<typeof setTimeout>;
    const publish = () => {
      clearTimeout(update);
      // Loaders can publish while a mesh renders. Defer React updates and
      // coalesce bursts without subscribing the entire scene to progress.
      update = setTimeout(() => setAssets(useProgress.getState()), 0);
    };
    const unsubscribe = useProgress.subscribe(publish);
    publish();
    return () => { unsubscribe(); clearTimeout(update); };
  }, []);

  useEffect(() => {
    if (!ready) return;
    // The core scene has produced a real frame. Garden LODs and decorative
    // assets may continue streaming without holding the whole house hostage.
    const timer = setTimeout(() => setRevealed(true), 150);
    return () => clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    const timer = setTimeout(() => setDetailsVisible(assets.active), assets.active ? 350 : 250);
    return () => clearTimeout(timer);
  }, [assets.active]);

  const covered = !revealed || !ready;
  useEffect(() => {
    if (covered) {
      onRevealChange?.(false);
      return;
    }
    // Safari can delay a CSS transition under WebGL load. Reveal the HTML
    // controls only when the cover has actually become invisible.
    let frame: number;
    const finish = () => {
      if (coverRef.current && getComputedStyle(coverRef.current).visibility === "hidden") {
        onRevealChange?.(true);
      } else {
        frame = requestAnimationFrame(finish);
      }
    };
    frame = requestAnimationFrame(finish);
    return () => cancelAnimationFrame(frame);
  }, [covered, onRevealChange]);

  useEffect(() => () => onRevealChange?.(false), [onRevealChange]);

  const filesPending = assets.active && assets.total > 0 && assets.loaded < assets.total;
  const progress = filesPending ? assets.loaded / assets.total * 100 : undefined;
  const progressLabel = filesPending ? `${assets.loaded} of ${assets.total} scene files loaded`
    : ready ? "View rendered · opening the house" : "Preparing the first 3D frame";
  return <>
    <div ref={coverRef} className={`scene-loading-cover${covered ? "" : " is-revealed"}`} aria-hidden={!covered} inert={!covered}>
      <LoadingState
        active={covered}
        title={filesPending ? "Loading materials and furnishings" : ready ? "Your house is ready" : "Rendering your 3D view"}
        detail={filesPending ? "Downloading the room materials, furniture and planting. The first visit can take longer on your phone." : "Building the house and preparing its lighting. Your view will appear after the first frame renders."}
        progress={progress}
        progressLabel={progressLabel}
      >
        {covered && assets.errors.length > 0 && <p className="loading-wait-note">Some files could not load. Check your connection or open the 2D plan.</p>}
        {onShowPlan && <button type="button" className="loading-plan-link" onClick={onShowPlan}>Explore the 2D plan <span aria-hidden="true">↗</span></button>}
      </LoadingState>
    </div>
    {!covered && detailsVisible && <LoadingState compact title="Loading the finer details" detail="The house is ready; you can keep exploring." progress={progress} progressLabel={filesPending ? progressLabel : "Preparing the remaining details"} />}
  </>;
}
