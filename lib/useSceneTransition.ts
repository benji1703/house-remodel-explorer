"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";

/** Paint feedback before scene work; only the latest rendered request can dismiss it. */
export function useSceneTransition() {
  const [revision, setRevision] = useState(0);
  const [feedback, setFeedback] = useState({ title: "Loading the view", detail: "Preparing the 3D scene." });
  const [updating, setUpdating] = useState(false);
  const requested = useRef(0);
  const shownAt = useRef(0);
  const frame = useRef<number | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (revealTimer.current !== null) clearTimeout(revealTimer.current);
    frame.current = null;
    revealTimer.current = null;
  }, []);

  const cancelScene = useCallback(() => {
    cancel();
    requested.current++;
    setUpdating(false);
  }, [cancel]);

  const changeScene = useCallback((title: string, detail: string, update: () => void) => {
    cancel();
    const next = ++requested.current;
    shownAt.current = performance.now();
    setFeedback({ title, detail });
    setUpdating(true);
    // Two frames give the browser a paint opportunity before reconciliation.
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => {
        if (next !== requested.current) return;
        startTransition(() => {
          setRevision(next);
          update();
        });
      });
    });
  }, [cancel]);

  const sceneReady = useCallback((renderedRevision: number) => {
    if (renderedRevision !== requested.current) return;
    if (revealTimer.current !== null) clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => {
      if (renderedRevision === requested.current) setUpdating(false);
    }, Math.max(0, 450 - (performance.now() - shownAt.current)));
  }, []);

  useEffect(() => {
    // Browser Back/Forward wins over scene work queued by an earlier tap.
    window.addEventListener("popstate", cancelScene);
    return () => { cancel(); window.removeEventListener("popstate", cancelScene); };
  }, [cancel, cancelScene]);
  return { revision, updating, ...feedback, changeScene, sceneReady, cancelScene };
}
