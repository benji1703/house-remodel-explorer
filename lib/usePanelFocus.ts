"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";

const FOCUSABLE = "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex='0']";

/** Panels share Escape dismissal and focus return; mobile overlays also contain Tab. */
export function usePanelFocus(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void, containFocus = false) {
  const close = useEffectEvent(onClose);
  useEffect(() => {
    if (!open) return;
    const panel = ref.current;
    if (!panel) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controls = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => element.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => controls()[0]?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key !== "Tab" || !containFocus) return;
      const elements = controls();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      if (trigger?.isConnected && !trigger.closest("[inert]")) trigger.focus();
    };
  }, [ref, open, containFocus]);
}
