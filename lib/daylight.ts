import * as THREE from "three";

/** Presentation sun path, not a surveyed solar simulation. 24:00 equals 00:00. */
export function getDaylight(hour: number) {
  const normalized = ((hour % 24) + 24) % 24;
  const progress = THREE.MathUtils.clamp((normalized - 6) / 14, 0, 1);
  const angle = progress * Math.PI;
  const daylight = normalized > 6 && normalized < 20 ? Math.sin(angle) : 0;
  const position: [number, number, number] = [
    Math.cos(angle) * 18,
    (daylight > 0 ? 0.35 : -3) + daylight * 15,
    Math.sin(angle) * 17,
  ];
  return {
    position,
    direction: new THREE.Vector3(...position).normalize(),
    color: new THREE.Color("#fff3d6").lerp(new THREE.Color("#ff9c55"), (1 - daylight) * 0.82),
    intensity: daylight * 3.63,
    sky: new THREE.Color("#d9c8b5").multiplyScalar(daylight),
    practical: 1 - THREE.MathUtils.smoothstep(daylight, 0, 0.6),
    daylight,
  };
}

export type Daylight = ReturnType<typeof getDaylight>;
