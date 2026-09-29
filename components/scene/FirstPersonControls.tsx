"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { house, type ZoneId } from "@/data/house";
import { walkSettings, walkStarts } from "@/data/walkthrough";
import { canWalkAt, moveWalkPosition } from "@/lib/walkCollision";
import { CX, CZ } from "../rooms/shared";

type Action = "forward" | "back" | "left" | "right" | "turnLeft" | "turnRight";
export type WalkInput = {
  held: Set<string>;
  pulses: Map<string, number>;
  wake?: () => void;
  reset?: () => void;
};
export const createWalkInput = (): WalkInput => ({ held: new Set(), pulses: new Map() });
function clearInput(input: RefObject<WalkInput>) { input.current.held.clear(); input.current.pulses.clear(); }
const keys: Record<string, Action> = { KeyW: "forward", ArrowUp: "forward", KeyS: "back", ArrowDown: "back", KeyA: "left", KeyD: "right", ArrowLeft: "turnLeft", ArrowRight: "turnRight" };

export function FirstPersonController({ input, active, zone, revision, allDoorsOpen, doorStates }: {
  input: RefObject<WalkInput>; active: boolean; zone: ZoneId; revision: number;
  allDoorsOpen: boolean; doorStates: Record<string, boolean>;
}) {
  const { camera, gl, invalidate } = useThree();
  const angles = useRef({ yaw: 0, pitch: 0 });
  const keyboard = useRef(new Set<string>());
  const rotation = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const clear = useCallback(() => {
    keyboard.current.clear(); clearInput(input);
  }, [input]);
  const reset = useCallback(() => {
    const start = walkStarts[zone];
    const floor = house.zones.find((entry) => entry.id === zone)!.level;
    angles.current = { yaw: start.yaw, pitch: 0 };
    camera.position.set(start.positionCm[0] / 100 - CX, floor + walkSettings.eyeHeightCm / 100, start.positionCm[1] / 100 - CZ);
    camera.rotation.set(0, start.yaw, 0, "YXZ");
    if (camera instanceof THREE.PerspectiveCamera) {
      Object.assign(camera, { fov: walkSettings.fov }); camera.updateProjectionMatrix();
    }
    clear(); invalidate();
  }, [camera, zone, clear, invalidate]);

  useEffect(() => { reset(); }, [reset, revision]);
  useEffect(() => {
    const current = input.current;
    Object.assign(current, { wake: invalidate, reset });
    const canvas = gl.domElement;
    const previousLabel = canvas.getAttribute("aria-label");
    canvas.setAttribute("aria-label", "First-person house walkthrough. W A S D to move, arrow keys to walk and turn. Drag to look. Escape to release focus.");
    return () => {
      clear(); Object.assign(current, { wake: undefined, reset: undefined });
      if (previousLabel) canvas.setAttribute("aria-label", previousLabel);
    };
  }, [input, invalidate, reset, gl, clear]);

  useEffect(() => {
    if (!active) { clear(); return; }
    const canvas = gl.domElement;
    canvas.focus({ preventScroll: true });
    let drag: { id: number; x: number; y: number; distance: number } | null = null;
    let suppressClick = false;
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || drag) return;
      canvas.focus({ preventScroll: true });
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0 };
      suppressClick = false;
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      drag.distance += Math.abs(dx) + Math.abs(dy);
      suppressClick = drag.distance > 5;
      angles.current.yaw -= dx * 0.004;
      angles.current.pitch = THREE.MathUtils.clamp(angles.current.pitch - dy * 0.004, -1.25, 1.25);
      drag.x = event.clientX; drag.y = event.clientY;
      invalidate();
    };
    const up = (event: PointerEvent) => {
      if (drag?.id !== event.pointerId) return;
      drag = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const click = (event: MouseEvent) => {
      if (suppressClick) { event.stopImmediatePropagation(); event.preventDefault(); suppressClick = false; }
    };
    const keyDown = (event: KeyboardEvent) => {
      if (document.activeElement !== canvas || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.code === "Escape") { clear(); canvas.blur(); return; }
      if (!keys[event.code]) return;
      event.preventDefault(); keyboard.current.add(event.code); invalidate();
    };
    const keyUp = (event: KeyboardEvent) => { keyboard.current.delete(event.code); };
    const blur = () => { clear(); drag = null; };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("lostpointercapture", up);
    canvas.addEventListener("click", click, true);
    canvas.addEventListener("keydown", keyDown);
    canvas.addEventListener("blur", clear);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", blur);
    return () => {
      blur();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", up);
      canvas.removeEventListener("click", click, true);
      canvas.removeEventListener("keydown", keyDown);
      canvas.removeEventListener("blur", clear);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", blur);
    };
  }, [active, gl, invalidate, clear]);

  useFrame((_, delta) => {
    if (!active) return;
    const pressed = new Set(input.current.held);
    keyboard.current.forEach((key) => pressed.add(keys[key]));
    input.current.pulses.forEach((until, action) => {
      if (performance.now() < until) pressed.add(action);
      else input.current.pulses.delete(action);
    });
    const dt = Math.min(delta, 0.05);
    const axis = (positive: Action, negative: Action) => Number(pressed.has(positive)) - Number(pressed.has(negative));
    angles.current.yaw += axis("turnLeft", "turnRight") * dt * 1.5;
    rotation.current.set(angles.current.pitch, angles.current.yaw, 0);
    camera.quaternion.setFromEuler(rotation.current);
    const forward = axis("forward", "back"), side = axis("right", "left");
    if (forward || side) {
      // FPS exploration ignores furnishings; architecture still constrains movement.
      const scale = walkSettings.speedCmPerSecond / 100 * dt / Math.hypot(forward, side);
      const { yaw } = angles.current;
      const dx = (side * Math.cos(yaw) - forward * Math.sin(yaw)) * scale;
      const dz = (-forward * Math.cos(yaw) - side * Math.sin(yaw)) * scale;
      const [x, z] = moveWalkPosition(camera.position.x + CX, camera.position.z + CZ, dx, dz,
        (x, z) => canWalkAt(x, z, allDoorsOpen, doorStates));
      camera.position.set(x - CX, camera.position.y, z - CZ);
    }
    if (pressed.size) invalidate();
  }, -1);
  return null;
}

export function WalkControls({ input, onReset }: { input: RefObject<WalkInput>; onReset: () => void }) {
  const actions: [Action, string, string][] = [
    ["turnLeft", "Turn left", "↶"], ["forward", "Walk forward", "↑"], ["turnRight", "Turn right", "↷"],
    ["left", "Step left", "←"], ["back", "Walk backward", "↓"], ["right", "Step right", "→"],
  ];
  return <div className="walk-controls" aria-label="First-person controls">
    <div className="walk-help"><strong>Walk · FPS</strong><span>Drag to look · hold arrows to move</span><span>WASD / arrow keys · tap doors to open</span><span>Move freely through furniture</span><button type="button" onClick={onReset}>Reset position</button></div>
    <div className="walk-pad" role="group" aria-label="Walk and turn">
      {actions.map(([action, label, glyph]) => <button key={action} type="button" aria-label={label}
        onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); input.current.held.add(action); input.current.wake?.(); }}
        onPointerUp={(event) => { input.current.held.delete(action); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => input.current.held.delete(action)}
        onLostPointerCapture={() => input.current.held.delete(action)}
        onClick={(event) => { if (event.detail === 0) { input.current.pulses.set(action, performance.now() + 200); input.current.wake?.(); } }}
      >{glyph}</button>)}
    </div>
  </div>;
}
