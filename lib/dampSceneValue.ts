import { MathUtils } from "three";

/** Keep demand rendering alive only until an animated scene value settles. */
export function dampSceneValue(
  current: number,
  target: number,
  smoothing: number,
  delta: number,
  invalidate: () => void,
  reducedMotion = false,
) {
  if (reducedMotion || Math.abs(current - target) < 0.0005) return target;
  // The first demand frame can follow a long idle period. Do not jump to the
  // end of a door animation just because the previous frame was minutes ago.
  const next = MathUtils.damp(current, target, smoothing, Math.min(delta, 1 / 30));
  invalidate();
  return next;
}
