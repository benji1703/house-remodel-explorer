"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";

/** Paint feedback first, coalesce scrubbing, and reveal only a rendered result. */
export function useLightingTransition(initialHour: number, initialLightsOn: boolean) {
  const [lighting, setLighting] = useState({ hour: initialHour, lightsOn: initialLightsOn, revision: 0 });
  const [preview, setPreview] = useState({ hour: initialHour, lightsOn: initialLightsOn });
  const [updating, setUpdating] = useState(false);
  const requested = useRef({ hour: initialHour, lightsOn: initialLightsOn, revision: 0 });
  const shownAt = useRef(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<number | null>(null);
  const cancel = useCallback(() => {
    if (revealTimer.current !== null) clearTimeout(revealTimer.current);
    if (timer.current !== null) clearTimeout(timer.current);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);
  const changeLighting = useCallback((hour: number, lightsOn: boolean, delay = 0) => {
    if (requested.current.hour === hour && requested.current.lightsOn === lightsOn) return;
    cancel();
    const next = { hour, lightsOn, revision: requested.current.revision + 1 };
    requested.current = next;
    setPreview({ hour, lightsOn });
    shownAt.current = performance.now();
    setUpdating(true);
    timer.current = setTimeout(() => {
      // Two browser frames let the loader paint before WebGL work begins.
      frame.current = requestAnimationFrame(() => {
        frame.current = requestAnimationFrame(() => {
          if (requested.current.revision !== next.revision) return;
          startTransition(() => setLighting(next));
        });
      });
    }, delay);
  }, [cancel]);
  const lightingReady = useCallback((revision: number) => {
    if (revision !== requested.current.revision) return;
    // Keep feedback legible even when cached lighting completes immediately.
    revealTimer.current = setTimeout(() => {
      if (revision === requested.current.revision) setUpdating(false);
    }, Math.max(0, 350 - (performance.now() - shownAt.current)));
  }, []);
  useEffect(() => cancel, [cancel]);
  return { ...lighting, previewHour: preview.hour, previewLightsOn: preview.lightsOn, updating, changeLighting, lightingReady };
}
