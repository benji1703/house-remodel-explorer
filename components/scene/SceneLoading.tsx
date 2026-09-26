"use client";

import { useProgress } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LoadingState } from "../loading/LoadingState";

/** Signal after an actual scene frame, rather than when the WebGL context exists. */
export function SceneFirstFrame({ onReady, enabled = true }: { onReady: () => void; enabled?: boolean }) {
  const frame = useRef<number | null>(null);
  const sent = useRef(false);
  useFrame(() => {
    if (sent.current || !enabled) return;
    sent.current = true;
    frame.current = requestAnimationFrame(onReady);
  });
  useLayoutEffect(() => {
    sent.current = false;
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);
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
  const [slow, setSlow] = useState(false);

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

  useEffect(() => {
    if (revealed) return;
    const timer = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(timer);
  }, [revealed]);

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

  const progress = assets.active && assets.total > 0 && assets.progress < 100 ? assets.progress : undefined;
  return <>
    <div ref={coverRef} className={`scene-loading-cover${covered ? "" : " is-revealed"}`} aria-hidden={!covered} inert={!covered}>
      <LoadingState
        title={assets.active ? "Bringing the house into view" : ready ? "Setting the scene" : "Opening your house"}
        detail={slow ? "Still preparing the view. You can explore the plan while you wait." : assets.active ? "Preparing materials, furnishings and planting." : "Finding the light. Making room for the details."}
        progress={progress}
      >
        {onShowPlan && <button type="button" className="loading-plan-link" onClick={onShowPlan}>Explore the 2D plan <span aria-hidden="true">↗</span></button>}
      </LoadingState>
    </div>
    {!covered && detailsVisible && <LoadingState compact title="Adding the finer details" detail="You can keep exploring." progress={progress} />}
  </>;
}
