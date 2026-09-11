"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";

const FOCUSABLE = "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]";
const activePanels: HTMLElement[] = [];

const available = (element: HTMLElement) => element.getClientRects().length > 0 &&
  !element.closest("[inert], [hidden], [aria-hidden='true']");

/** Panels share Escape dismissal and focus return; mobile overlays also contain Tab. */
export function usePanelFocus(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void, containFocus = false, returnFocusRef?: RefObject<HTMLElement | null>) {
  const close = useEffectEvent(onClose);
  useEffect(() => {
    if (!open) return;
    const panel = ref.current;
    if (!panel) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activePanels.push(panel);
    const isTop = () => activePanels[activePanels.length - 1] === panel;
    const controls = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => element.tabIndex >= 0 && available(element));
    const focusInside = () => (controls()[0] ?? panel).focus({ preventScroll: true });
    // Isolate siblings up to the document root, never the dialog's ancestors.
    // Scrims retain pointer dismissal but are hidden from assistive technology.
    const inertSiblings = new Map<HTMLElement, boolean>();
    if (containFocus) {
      let branch: HTMLElement = panel;
      while (branch.parentElement) {
        for (const sibling of branch.parentElement.children) {
          if (!(sibling instanceof HTMLElement) || sibling === branch || sibling.hasAttribute("data-modal-backdrop") || /^(SCRIPT|STYLE|LINK)$/.test(sibling.tagName)) continue;
          inertSiblings.set(sibling, sibling.inert);
          // Siblings are intentionally inert while this modal owns focus.
          // eslint-disable-next-line react-hooks/immutability
          sibling.inert = true;
        }
        if (branch.parentElement === document.body) break;
        branch = branch.parentElement;
      }
    }
    const frame = requestAnimationFrame(() => { if (isTop()) focusInside(); });
    const onKey = (event: KeyboardEvent) => {
      if (!isTop() || event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== "Tab" || !containFocus) return;
      const elements = controls();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (containFocus && isTop() && event.target instanceof Node && !panel.contains(event.target)) focusInside();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
      const wasTop = isTop();
      activePanels.splice(activePanels.lastIndexOf(panel), 1);
      inertSiblings.forEach((inert, element) => { element.inert = inert; });
      if (!wasTop) return;
      const destination = trigger?.isConnected && trigger !== document.body && available(trigger) ? trigger : returnFocusRef?.current;
      if (destination && available(destination)) destination.focus({ preventScroll: true });
    };
  }, [ref, open, containFocus, returnFocusRef]);
}
