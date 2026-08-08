"use client";
import { Blk, Cyl } from "./shared";
import type { Palette } from "./shared";

/**
 * Built-to-measure sanitaryware — no Poly Haven toilet/shower/vanity fits
 * these envelopes cleanly. Procedural fixtures, architect clearances.
 *
 * Main bath door (north partition): ~x 5.4–6.2 at z=10.2.
 * Ensuite door (west partition): ~z 10.9–11.7 at x=3.4.
 */

type Wall = "n" | "s" | "e" | "w";

/** Compact close-coupled WC. x/z = point on the wall face; cistern flush, bowl into room. */
function Toilet({
  base,
  palette,
  x,
  z,
  against,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  against: Wall;
}) {
  const alongWall = against === "n" || against === "s";
  const bowlW = alongWall ? 0.36 : 0.52;
  const bowlD = alongWall ? 0.54 : 0.36;
  const cisternW = alongWall ? 0.4 : 0.18;
  const cisternD = alongWall ? 0.18 : 0.4;
  const into =
    against === "n" ? { x: 0, z: 1 } :
    against === "s" ? { x: 0, z: -1 } :
    against === "w" ? { x: 1, z: 0 } :
    { x: -1, z: 0 };

  const cisternX = x + into.x * (cisternD / 2);
  const cisternZ = z + into.z * (cisternD / 2);
  const bowlX = x + into.x * (cisternD + bowlD / 2);
  const bowlZ = z + into.z * (cisternD + bowlD / 2);

  return (
    <group>
      <Blk x={cisternX} z={cisternZ} y={base} w={cisternW} d={cisternD} h={0.78} material={palette.upholstery} />
      <Blk x={bowlX} z={bowlZ} y={base} w={bowlW} d={bowlD} h={0.4} material={palette.upholstery} />
      <Cyl x={bowlX} z={bowlZ} y={base + 0.4} r={0.15} h={0.04} material={palette.upholstery} />
    </group>
  );
}

/** 90×90 shower: tray, glass screens, rain head. */
function Shower({
  base,
  palette,
  x,
  z,
  screens,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  screens: { west?: boolean; east?: boolean; north?: boolean; south?: boolean };
}) {
  const glassH = 2.0;
  const tray = 0.9;
  const half = tray / 2;
  const glassT = 0.02;
  return (
    <group>
      <Blk x={x} z={z} y={base} w={tray} d={tray} h={0.04} material={palette.stone} />
      <Blk x={x} z={z} y={base + 0.04} w={tray - 0.04} d={tray - 0.04} h={0.02} material={palette.charcoal} />

      {screens.west && (
        <Blk x={x - half + 0.01} z={z} y={base + 0.06} w={glassT} d={tray - 0.06} h={glassH} material={palette.glass} />
      )}
      {screens.east && (
        <Blk x={x + half - 0.01} z={z} y={base + 0.06} w={glassT} d={tray - 0.06} h={glassH} material={palette.glass} />
      )}
      {screens.north && (
        <Blk x={x} z={z - half + 0.01} y={base + 0.06} w={tray - 0.06} d={glassT} h={glassH} material={palette.glass} />
      )}
      {screens.south && (
        <Blk x={x} z={z + half - 0.01} y={base + 0.06} w={tray - 0.06} d={glassT} h={glassH} material={palette.glass} />
      )}

      <Blk x={x + 0.28} z={z - 0.28} y={base + 2.05} w={0.28} d={0.04} h={0.04} material={palette.frame} />
      <Cyl x={x + 0.12} z={z - 0.12} y={base + 2.0} r={0.12} h={0.05} material={palette.frame} />
    </group>
  );
}

/** Oak vanity + stone top + basin; optional flat mirror. */
function Vanity({
  base,
  palette,
  x,
  z,
  w,
  mirror = true,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  w: number;
  mirror?: boolean;
}) {
  const mirrorW = Math.min(w * 0.85, 1.2);
  return (
    <group>
      <Blk x={x} z={z} y={base} w={w} d={0.48} h={0.8} material={palette.oak} />
      <Blk x={x} z={z} y={base + 0.8} w={w + 0.02} d={0.52} h={0.03} material={palette.stone} />
      <Cyl x={x} z={z} y={base + 0.83} r={Math.min(0.18, w * 0.22)} h={0.1} material={palette.stone} />
      <Blk x={x} z={z + 0.14} y={base + 0.83} w={0.04} d={0.04} h={0.14} material={palette.frame} />
      {mirror && (
        <>
          <Blk x={x} z={z + 0.23} y={base + 1.2} w={mirrorW} d={0.03} h={0.7} material={palette.frame} />
          <Blk x={x} z={z + 0.21} y={base + 1.2} w={mirrorW - 0.06} d={0.02} h={0.64} material={palette.glass} />
        </>
      )}
    </group>
  );
}

/**
 * Main bathroom — 270 × 190 cm.
 * Door north ~x 5.4–6.2. WC on west wall (normal clearances),
 * vanity on south, 90 shower NE — toilet not jammed between fixtures.
 */
export function MainBathroom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      {/* WC on west wall, mid-depth — clear of door swing and vanity. */}
      <Toilet base={base} palette={palette} x={4.9} z={11.05} against="w" />

      {/* Shower NE: tray centre; glass on west + south; open to room. */}
      <Shower
        base={base}
        palette={palette}
        x={7.15}
        z={10.65}
        screens={{ west: true, south: true }}
      />

      {/* Vanity south under window — no tall mirror (south glazing). */}
      <Vanity base={base} palette={palette} x={6.05} z={11.86} w={1.35} mirror={false} />
    </group>
  );
}

/**
 * Ensuite — 150 × 190 cm. Door on west ~z 10.9–11.7.
 * Short vanity south, WC north — no shower (width too tight).
 */
export function EnsuiteBathroom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      <Toilet base={base} palette={palette} x={4.15} z={10.2} against="n" />
      <Vanity base={base} palette={palette} x={4.15} z={11.86} w={0.95} />
    </group>
  );
}
