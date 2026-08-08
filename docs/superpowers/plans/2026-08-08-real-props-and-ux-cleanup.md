# Real-Prop Furnishing + UX Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the primitive box/cylinder furniture in the 3D house scene with real CC0 glTF furniture (Poly Haven), furnish the two empty east bedrooms, re-do the kitchen and exterior with more taste-consistent detail, and clean up the app UI (`HouseExplorer.tsx`) so it reads as one clean, honest, uncluttered interface instead of duplicated/misleading controls.

**Architecture:** A generic fetch script downloads named Poly Haven glTF models into `public/props/<slug>/`. A thin `Prop` component wraps `useGLTF` and mirrors the existing `Blk`/`Cyl` placement convention (raw plan meters, `CX`/`CZ`-centred). `MeasuredHouseScene.tsx`'s per-room furniture functions (`Kitchen`, `Living`, `Bedroom`, `Bathroom`, `Terrace`) move into their own files under `components/rooms/`, each importing shared primitives from `components/rooms/shared.tsx` — this removes the single-file bottleneck so room tasks can run as independent, non-conflicting parallel agents. A separate UX task works only in `HouseExplorer.tsx`/`DimensionedOverlay.tsx`/`globals.css`, so it never touches the same files as the room tasks and can run fully in parallel with them.

**Tech Stack:** Next.js 16, React 19, `@react-three/fiber` 9, `@react-three/drei` 10 (`useGLTF`), `three` 0.179. No new npm dependencies — `useGLTF` is already available via drei.

## Global Constraints

- Never modify wall coordinates, footprint, openings, dimensions, or `GeometryStatus` values in `data/house.ts`. This plan only touches furniture/decor and the app shell UI.
- All new furniture models must come from Poly Haven (CC0, real-world scale) via `scripts/fetch-props.mjs` — no other asset source, no invented geometry.
- Fixed building elements without a Poly Haven equivalent (kitchen cabinetry/counters, bathroom vanity/toilet/shower) stay procedural (`Blk`/`Cyl`), built at the dimensions already encoded today — do not replace with a mismatched generic model.
- Run `npm run lint` and `npm run build:local` after every task's file changes, per `AGENTS.md`.
- Do not deploy/push unless the user explicitly asks.
- UX task must not remove or misrepresent any geometry-status/audit information (per AGENTS.md's honesty requirements) — it may only deduplicate controls, simplify layout, and improve copy clarity; it must not delete the audit/status functionality itself.

---

## File Structure

- Create: `scripts/fetch-props.mjs` — generic Poly Haven downloader, manifest-driven.
- Create: `scripts/props-manifest.json` — list of `{ "slug": string }` entries, single source of truth for what's fetched.
- Create: `public/props/<slug>/...` — downloaded glTF + bin + textures per model (gitignored is NOT appropriate here — these are committed assets like `public/references/*` already are; do not add to `.gitignore`).
- Create: `components/rooms/shared.tsx` — `CX`, `CZ`, `Blk`, `Cyl`, `Prop`, `Palette` type, re-exported for room files. Moved out of `MeasuredHouseScene.tsx` verbatim (same behavior).
- Create: `components/rooms/Kitchen.tsx`, `components/rooms/Living.tsx`, `components/rooms/MasterBedroom.tsx`, `components/rooms/EastRooms.tsx`, `components/rooms/Bathrooms.tsx`, `components/rooms/Terrace.tsx` — one file per independent work unit.
- Modify: `components/MeasuredHouseScene.tsx` — remove the inline `Kitchen`/`Living`/`Bedroom`/`Bathroom`/`Terrace` functions and `Blk`/`Cyl`/`CX`/`CZ` definitions, import them from `./rooms/*` instead; render call sites stay in the same place (lines ~703-723 today).
- Modify: `components/HouseExplorer.tsx` — dedupe controls, simplify layout/copy.
- Modify: `components/DimensionedOverlay.tsx` — only if the UX task finds misleading copy there (see Task 8).
- Modify: `app/globals.css` — supporting style changes for whichever UI elements the UX task simplifies/removes.

---

### Task 1: Prop pipeline + room-file split (prerequisite, do first, sequential)

**Files:**
- Create: `scripts/fetch-props.mjs`
- Create: `scripts/props-manifest.json`
- Create: `components/rooms/shared.tsx`
- Modify: `components/MeasuredHouseScene.tsx`

**Interfaces:**
- Produces: `Prop` component — `Prop({ url: string, x: number, z: number, y?: number, rotationY?: number, scale?: number })`, positions itself using the same `x - CX`, `z - CZ` convention as `Blk`.
- Produces: `Blk`, `Cyl`, `CX`, `CZ`, `Palette` type — re-exported unchanged from `components/rooms/shared.tsx`, importable as `import { Blk, Cyl, Prop, CX, CZ, type Palette } from "@/components/rooms/shared"`.
- Produces: `scripts/fetch-props.mjs` — run as `node scripts/fetch-props.mjs`, reads `scripts/props-manifest.json`, downloads every listed slug's 1k glTF into `public/props/<slug>/`, skips files that already exist (idempotent), exits non-zero on any download failure.
- Consumes: nothing (first task).

- [ ] **Step 1: Write the fetch script**

Create `scripts/fetch-props.mjs`:

```js
#!/usr/bin/env node
// Downloads CC0 glTF furniture models from Poly Haven into public/props/<slug>/.
// Usage: node scripts/fetch-props.mjs
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

const MANIFEST_PATH = new URL("./props-manifest.json", import.meta.url);
const PUBLIC_PROPS_DIR = new URL("../public/props/", import.meta.url);

async function exists(fileUrl) {
  try {
    await access(fileUrl);
    return true;
  } catch {
    return false;
  }
}

async function download(url, destUrl) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(destUrl.pathname), { recursive: true });
  await writeFile(destUrl, buf);
}

async function fetchSlug(slug) {
  const filesRes = await fetch(`https://api.polyhaven.com/files/${slug}`);
  if (!filesRes.ok) throw new Error(`files API for ${slug} -> ${filesRes.status}`);
  const files = await filesRes.json();
  const gltf1k = files.gltf?.["1k"];
  if (!gltf1k) throw new Error(`${slug}: no 1k gltf entry`);

  const slugDir = new URL(`${slug}/`, PUBLIC_PROPS_DIR);
  const mainDest = new URL(path.basename(gltf1k.url), slugDir);
  if (!(await exists(mainDest))) {
    console.log(`  ${slug}: main gltf`);
    await download(gltf1k.url, mainDest);
  }

  for (const [relPath, meta] of Object.entries(gltf1k.include ?? {})) {
    const dest = new URL(relPath, slugDir);
    if (await exists(dest)) continue;
    console.log(`  ${slug}: ${relPath}`);
    await download(meta.url, dest);
  }
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  let failed = 0;
  for (const { slug } of manifest) {
    console.log(`Fetching ${slug}...`);
    try {
      await fetchSlug(slug);
    } catch (err) {
      failed += 1;
      console.error(`  FAILED: ${err.message}`);
    }
  }
  if (failed > 0) {
    console.error(`${failed} model(s) failed to download.`);
    process.exit(1);
  }
  console.log("All props fetched.");
}

main();
```

- [ ] **Step 2: Write the full manifest**

Create `scripts/props-manifest.json`:

```json
[
  { "slug": "Sofa_01" },
  { "slug": "mid_century_lounge_chair" },
  { "slug": "CoffeeTable_01" },
  { "slug": "modern_ceiling_lamp_01" },
  { "slug": "potted_plant_01" },
  { "slug": "ornate_mirror_01" },
  { "slug": "electric_stove" },
  { "slug": "bar_chair_round_01" },
  { "slug": "caged_hanging_light" },
  { "slug": "potted_plant_02" },
  { "slug": "vintage_electric_kettle" },
  { "slug": "old_bed_frame" },
  { "slug": "ClassicNightstand_01" },
  { "slug": "modern_wooden_cabinet" },
  { "slug": "painted_wooden_nightstand" },
  { "slug": "side_table_01" },
  { "slug": "WoodenChair_01" },
  { "slug": "vintage_day_bed" },
  { "slug": "Ottoman_01" },
  { "slug": "outdoor_table_chair_set_01" },
  { "slug": "planter_box_01" },
  { "slug": "island_tree_01" }
]
```

- [ ] **Step 3: Run the fetch script and verify output**

Run: `node scripts/fetch-props.mjs`
Expected: `All props fetched.` printed; `ls public/props` shows one directory per slug above, each containing a `*_1k.gltf`, a `.bin`, and a `textures/` folder.

- [ ] **Step 4: Create the shared room module**

Create `components/rooms/shared.tsx`, moving `CX`, `CZ`, `Blk`, `Cyl` out of `components/MeasuredHouseScene.tsx` verbatim (same code, same behavior — copy, don't rewrite), plus the new `Prop` component and the `Palette` type:

```tsx
"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

// Scene centring, so the measured footprint orbits around the origin.
export const CX = 5.7;
export const CZ = 6.05;

/** Axis-aligned box placed by plan coordinates (metres, un-centred). */
export function Blk({
  x,
  z,
  y,
  w,
  d,
  h,
  material,
}: {
  x: number;
  z: number;
  y: number;
  w: number;
  d: number;
  h: number;
  material: THREE.Material;
}) {
  return (
    <mesh position={[x - CX, y + h / 2, z - CZ]} material={material} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
}

export function Cyl({
  x,
  z,
  y,
  r,
  h,
  material,
  segments = 20,
}: {
  x: number;
  z: number;
  y: number;
  r: number;
  h: number;
  material: THREE.Material;
  segments?: number;
}) {
  return (
    <mesh position={[x - CX, y + h / 2, z - CZ]} material={material} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, h, segments]} />
    </mesh>
  );
}

/**
 * A real CC0 glTF model (fetched by scripts/fetch-props.mjs into
 * public/props/<slug>/), placed with the same raw-plan-meters convention as
 * Blk/Cyl. `y` is the floor height the model's own origin sits on (usually
 * the room's zone.level); models are assumed real-world-scale (scale=1)
 * unless the placing room file found otherwise while checking against the
 * room footprint.
 */
export function Prop({
  slug,
  x,
  z,
  y = 0,
  rotationY = 0,
  scale = 1,
}: {
  slug: string;
  x: number;
  z: number;
  y?: number;
  rotationY?: number;
  scale?: number;
}) {
  const { scene } = useGLTF(`/props/${slug}/${slug}_1k.gltf`);
  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={cloned}
      position={[x - CX, y, z - CZ]}
      rotation-y={rotationY}
      scale={scale}
    />
  );
}

export type Palette = {
  exterior: THREE.Material;
  interior: THREE.Material;
  ground: THREE.Material;
  glass: THREE.Material;
  frame: THREE.Material;
  oak: THREE.Material;
  timber: THREE.Material;
  upholstery: THREE.Material;
  stone: THREE.Material;
  charcoal: THREE.Material;
  greenery: THREE.Material;
  vine: THREE.Material;
  terracotta: THREE.Material;
  floors: Record<string, THREE.Material>;
};
```

- [ ] **Step 5: Update `MeasuredHouseScene.tsx` to import from the shared module**

In `components/MeasuredHouseScene.tsx`:
- Delete the `CX`/`CZ` constant declarations (were at the top, near `const SECTION = 1.5;`).
- Delete the `Blk` and `Cyl` function definitions.
- Delete the `Kitchen`, `Living`, `Bedroom`, `Bathroom`, `Terrace` function definitions (these move to Tasks 2-7 below — leave a comment `// Room furniture: see components/rooms/*` where they were).
- Change `type Palette = ReturnType<typeof buildPalette>;` to `import type { Palette } from "./rooms/shared";` and delete the old type alias line.
- Add near the top: `import { Blk, Cyl, CX, CZ } from "./rooms/shared";`
- Add: `import { Kitchen } from "./rooms/Kitchen"; import { Living } from "./rooms/Living"; import { MasterBedroom } from "./rooms/MasterBedroom"; import { EastUpperRoom, EastLowerRoom } from "./rooms/EastRooms"; import { MainBathroom, EnsuiteBathroom } from "./rooms/Bathrooms"; import { Terrace } from "./rooms/Terrace";`
- In the render section (where `<Kitchen .../> <Living .../> <Bedroom .../> <Bathroom .../> <Bathroom .../>` are called, around the old lines 703-723), replace:

```tsx
{designMode && (
  <>
    <Terrace palette={palette} quality={quality} />
    <Kitchen base={zoneById["north-extension"].level} palette={palette} />
    <Living base={zoneById["central-core"].level} palette={palette} />
    <MasterBedroom base={zoneById["southwest-room"].level} palette={palette} />
    <EastUpperRoom base={zoneById["east-upper-room"].level} palette={palette} />
    <EastLowerRoom base={zoneById["east-lower-room"].level} palette={palette} />
    <MainBathroom base={zoneById["service-core"].level} palette={palette} />
    <EnsuiteBathroom base={zoneById.ensuite.level} palette={palette} />
  </>
)}
```

Note this both restores the two east rooms into the render tree (they are absent today — confirmed by reading the current file, they have zone floors/labels but no furniture function is ever called for them) and keeps every other zone's call site working once Tasks 2-6 create the corresponding files.

- [ ] **Step 6: Stub the six room files so the build passes before Tasks 2-7 land**

This unblocks parallel work: each room task below overwrites its stub with real content, but the stub must exist first so `MeasuredHouseScene.tsx` compiles standalone.

Create `components/rooms/Kitchen.tsx`:
```tsx
"use client";
import type { Palette } from "./shared";
export function Kitchen({ base, palette }: { base: number; palette: Palette }) {
  return null;
}
```

Create `components/rooms/Living.tsx` (same pattern, `export function Living`), `components/rooms/MasterBedroom.tsx` (`export function MasterBedroom`), `components/rooms/Terrace.tsx` (`export function Terrace({ palette, quality }: { palette: Palette; quality: "high" | "light" })`).

Create `components/rooms/EastRooms.tsx`:
```tsx
"use client";
import type { Palette } from "./shared";
export function EastUpperRoom({ base, palette }: { base: number; palette: Palette }) {
  return null;
}
export function EastLowerRoom({ base, palette }: { base: number; palette: Palette }) {
  return null;
}
```

Create `components/rooms/Bathrooms.tsx`:
```tsx
"use client";
import type { Palette } from "./shared";
export function MainBathroom({ base, palette }: { base: number; palette: Palette }) {
  return null;
}
export function EnsuiteBathroom({ base, palette }: { base: number; palette: Palette }) {
  return null;
}
```

- [ ] **Step 7: Verify build**

Run: `npm run lint && npm run build:local`
Expected: both pass with zero errors. The 3D view will show unfurnished rooms at this point (stubs return `null`) — that's expected, Tasks 2-7 fill them in.

- [ ] **Step 8: Commit**

```bash
git add scripts/fetch-props.mjs scripts/props-manifest.json components/rooms public/props components/MeasuredHouseScene.tsx
git commit -m "Add prop-fetch pipeline and split room furniture into components/rooms/*"
```

---

### Task 2: Kitchen real props (parallel — after Task 1)

**Files:**
- Modify: `components/rooms/Kitchen.tsx`

**Interfaces:**
- Consumes: `Blk`, `Cyl`, `Prop`, `Palette` from `./shared` (Task 1).
- Produces: `Kitchen({ base, palette })` — same signature as the stub; no other file depends on its internals.

- [ ] **Step 1: Implement the kitchen**

Replace the stub in `components/rooms/Kitchen.tsx`. Keep the existing procedural counters/island/fridge (real carpentry, correct cm dims, already tuned to the zone footprint) and add real props: two bar stools at the island, a hanging pendant light over the island, a potted plant in the corner, a kettle on the counter.

```tsx
"use client";
import { Blk, Cyl, Prop } from "./shared";
import type { Palette } from "./shared";

export function Kitchen({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      {/* Procedural cabinetry/counters/fridge — no real-world CC0 model
          matches custom carpentry at these dimensions, so these stay
          built-to-measure boxes. */}
      <Blk x={5.7} z={0.55} y={base} w={3.8} d={0.65} h={0.9} material={palette.oak} />
      <Blk x={7.25} z={2.2} y={base} w={0.6} d={2.6} h={0.9} material={palette.oak} />
      <Blk x={5.7} z={0.55} y={base + 0.9} w={3.8} d={0.66} h={0.04} material={palette.stone} />
      <Blk x={5.4} z={2.5} y={base} w={2.2} d={0.95} h={0.92} material={palette.oak} />
      <Blk x={5.4} z={2.5} y={base + 0.92} w={2.3} d={1.05} h={0.05} material={palette.stone} />
      <Blk x={4.0} z={0.6} y={base} w={0.78} d={0.72} h={1.9} material={palette.charcoal} />

      {/* Real props: cooktop insert on the main counter. */}
      <Prop slug="electric_stove" x={6.6} z={0.55} y={base + 0.9} rotationY={Math.PI / 2} />

      {/* Island bar stools. */}
      <Prop slug="bar_chair_round_01" x={4.6} z={2.3} y={base} rotationY={Math.PI} />
      <Prop slug="bar_chair_round_01" x={4.6} z={2.7} y={base} rotationY={Math.PI} />

      {/* Pendant light over the island. */}
      <Prop slug="caged_hanging_light" x={5.4} z={2.5} y={base + 2.3} />

      {/* Counter and corner decor. */}
      <Prop slug="vintage_electric_kettle" x={5.9} z={0.65} y={base + 0.94} />
      <Prop slug="potted_plant_02" x={7.35} z={0.55} y={base} />
    </group>
  );
}
```

- [ ] **Step 2: Verify in dev server**

Run: `npm run dev`, open the app, select the Kitchen zone in Material study mode.
Expected: bar stools sit against the island without clipping into it, the pendant hangs above the island at roughly ceiling height (2.3m matches the 2.5m ceiling minus fixture drop), the kettle sits on the counter surface (y = counter top height, `base + 0.94`), the plant is in the free corner near the fridge, nothing pokes through a wall (kitchen zone spans x∈[3.4,7.6], z∈[0,3.8]).

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build:local`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add components/rooms/Kitchen.tsx
git commit -m "Furnish kitchen with real CC0 props: bar stools, pendant light, decor"
```

---

### Task 3: Living room real props (parallel — after Task 1)

**Files:**
- Modify: `components/rooms/Living.tsx`

**Interfaces:**
- Consumes: `Blk`, `Cyl`, `Prop`, `Palette` from `./shared`.
- Produces: `Living({ base, palette })`.

- [ ] **Step 1: Implement the living room**

The zone spans x∈[3.4,7.6], z∈[3.8,10.2] (width 4.2, depth 6.4). The west opening (glazed wall) is at x=3.4. Keep the low rug as a procedural plane (real-world rugs aren't meaningfully modeled by Poly Haven's furniture set); replace the sofa/chair/coffee-table blockout with real props.

```tsx
"use client";
import { Blk, Prop } from "./shared";
import type { Palette } from "./shared";

export function Living({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      {/* Rug. */}
      <Blk x={5.6} z={6.1} y={base + 0.005} w={3.4} d={3.8} h={0.02} material={palette.stone} />

      {/* Sofa, facing the west glazing. */}
      <Prop slug="Sofa_01" x={6.6} z={5.9} y={base} rotationY={Math.PI / 2} />

      {/* Coffee table in front of the sofa. */}
      <Prop slug="CoffeeTable_01" x={5.6} z={5.9} y={base} />

      {/* Lounge chair, pulled clear of the bedroom-door swing at the south
          end of this wall (x=3.4, z≈8.75-9.65), same clearance rule as the
          previous blockout. */}
      <Prop slug="mid_century_lounge_chair" x={4.9} z={7.1} y={base} rotationY={-Math.PI / 4} />

      {/* Ceiling light and wall decor. */}
      <Prop slug="modern_ceiling_lamp_01" x={5.6} z={5.9} y={base + 2.3} />
      <Prop slug="ornate_mirror_01" x={4.05} z={4.1} y={base + 1.4} rotationY={Math.PI / 2} />
    </group>
  );
}
```

- [ ] **Step 2: Verify in dev server**

Run: `npm run dev`, select the living room zone.
Expected: sofa faces the west glazing, coffee table sits in front of it without overlapping, lounge chair stays clear of the bedroom door swing zone (x=3.4, z 8.75-9.65), mirror is flush against the north partition wall (z=3.8 side), nothing crosses zone bounds x∈[3.4,7.6] z∈[3.8,10.2].

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build:local`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add components/rooms/Living.tsx
git commit -m "Furnish living room with real CC0 props: sofa, coffee table, lounge chair"
```

---

### Task 4: Master bedroom real props (parallel — after Task 1)

**Files:**
- Modify: `components/rooms/MasterBedroom.tsx`

**Interfaces:**
- Consumes: `Blk`, `Prop`, `Palette` from `./shared`.
- Produces: `MasterBedroom({ base, palette })`.

- [ ] **Step 1: Implement the master bedroom**

Zone spans x∈[0,3.4], z∈[8.2,12.1] (width 3.4, depth 3.9). No Poly Haven bed matches the warm-oak-minimal palette (only Gothic/vintage/day-bed options exist in the free catalog) — use `old_bed_frame` as the real structural frame (plain wood, closest neutral match) and keep a thin procedural mattress/linen slab on top in the palette's upholstery material, so the visible bedding still reads warm-neutral. Add real nightstands and a wardrobe.

```tsx
"use client";
import { Blk, Prop } from "./shared";
import type { Palette } from "./shared";

export function MasterBedroom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      {/* Real bed frame (closest neutral wood match in the free catalog). */}
      <Prop slug="old_bed_frame" x={1.7} z={11.4} y={base} rotationY={Math.PI} />

      {/* Procedural mattress/linen slab on top, in the room's warm palette,
          since the frame model ships without bedding. */}
      <Blk x={1.7} z={11.2} y={base + 0.32} w={1.6} d={2.0} h={0.18} material={palette.upholstery} />

      {/* Nightstands flanking the bed. */}
      <Prop slug="ClassicNightstand_01" x={0.55} z={11.75} y={base} />
      <Prop slug="ClassicNightstand_01" x={2.85} z={11.75} y={base} rotationY={Math.PI} />

      {/* Wardrobe against the free wall. */}
      <Prop slug="modern_wooden_cabinet" x={0.3} z={8.6} y={base} rotationY={Math.PI / 2} />
    </group>
  );
}
```

- [ ] **Step 2: Verify in dev server**

Run: `npm run dev`, select the master bedroom zone.
Expected: bed sits centered against the south wall as before, nightstands flank it without clipping, wardrobe sits against the free (north-west) wall without blocking the door opening at x=3.4 (partition openings at z=8.2-12.1 per `data/house.ts` partitions list).

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build:local`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add components/rooms/MasterBedroom.tsx
git commit -m "Furnish master bedroom with real CC0 props: bed frame, nightstands, wardrobe"
```

---

### Task 5: East rooms furnishing (parallel — after Task 1)

**Files:**
- Modify: `components/rooms/EastRooms.tsx`

**Interfaces:**
- Consumes: `Blk`, `Prop`, `Palette` from `./shared`.
- Produces: `EastUpperRoom({ base, palette })`, `EastLowerRoom({ base, palette })`.

- [ ] **Step 1: Implement both east bedrooms**

Both zones are 3.8 × 3.55 m (`east-upper-room`: x∈[7.6,11.4] z∈[5.0,8.55]; `east-lower-room`: x∈[7.6,11.4] z∈[8.55,12.1]). These rooms are currently completely unfurnished (confirmed: no furniture function was ever called for them in the current scene). Furnish each as a simple bedroom: a bed, a nightstand, and a small reading corner, varied between the two rooms so they don't look identical.

```tsx
"use client";
import { Blk, Prop } from "./shared";
import type { Palette } from "./shared";

export function EastUpperRoom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      <Prop slug="old_bed_frame" x={8.5} z={5.8} y={base} rotationY={Math.PI / 2} />
      <Blk x={8.5} z={5.8} y={base + 0.32} w={2.0} d={1.5} h={0.18} material={palette.upholstery} />
      <Prop slug="painted_wooden_nightstand" x={8.5} z={7.0} y={base} rotationY={Math.PI / 2} />

      {/* Reading corner. */}
      <Prop slug="WoodenChair_01" x={10.6} z={5.5} y={base} rotationY={-Math.PI / 2} />
      <Prop slug="side_table_01" x={10.6} z={6.1} y={base} />
    </group>
  );
}

export function EastLowerRoom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      <Prop slug="vintage_day_bed" x={8.6} z={9.4} y={base} rotationY={Math.PI / 2} />
      <Prop slug="painted_wooden_nightstand" x={8.6} z={10.7} y={base} rotationY={Math.PI / 2} />
      <Prop slug="Ottoman_01" x={10.6} z={11.4} y={base} />
    </group>
  );
}
```

- [ ] **Step 2: Verify in dev server**

Run: `npm run dev`, select both east-upper-room and east-lower-room zones.
Expected: both rooms now show furniture (previously empty), beds/nightstand/chair stay within each zone's bounds, nothing clips the shared partition wall at x=7.6 or the cross-partition at z=8.55.

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build:local`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add components/rooms/EastRooms.tsx
git commit -m "Furnish both east bedrooms with real CC0 props (previously unfurnished)"
```

---

### Task 6: Bathrooms decor (parallel — after Task 1)

**Files:**
- Modify: `components/rooms/Bathrooms.tsx`

**Interfaces:**
- Consumes: `Blk`, `Cyl`, `Prop`, `Palette` from `./shared`.
- Produces: `MainBathroom({ base, palette })`, `EnsuiteBathroom({ base, palette })`.

- [ ] **Step 1: Implement both bathrooms**

No Poly Haven vanity/toilet/shower model exists, so fixtures stay procedural at their current dimensions/positions (unchanged from today). Add one real prop — a wall mirror — to each, the only bathroom-appropriate decor item available in the manifest.

```tsx
"use client";
import { Blk, Cyl, Prop } from "./shared";
import type { Palette } from "./shared";

function BathroomFixtures({
  base,
  palette,
  vanity,
  toilet,
  shower,
}: {
  base: number;
  palette: Palette;
  vanity: { x: number; z: number; w: number };
  toilet: { x: number; z: number };
  shower?: { x: number; z: number };
}) {
  return (
    <group>
      <Blk x={vanity.x} z={vanity.z} y={base} w={vanity.w} d={0.48} h={0.82} material={palette.oak} />
      <Blk x={vanity.x} z={vanity.z} y={base + 0.82} w={vanity.w} d={0.5} h={0.04} material={palette.stone} />
      <Cyl x={vanity.x} z={vanity.z} y={base + 0.86} r={0.19} h={0.12} material={palette.stone} />
      <Blk x={toilet.x} z={toilet.z} y={base} w={0.38} d={0.6} h={0.4} material={palette.stone} />
      <Blk x={toilet.x} z={toilet.z + 0.34} y={base} w={0.38} d={0.16} h={0.78} material={palette.stone} />
      {shower && <Blk x={shower.x} z={shower.z} y={base} w={0.9} d={0.9} h={0.05} material={palette.stone} />}
    </group>
  );
}

export function MainBathroom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      <BathroomFixtures
        base={base}
        palette={palette}
        vanity={{ x: 6.2, z: 11.8, w: 1.6 }}
        toilet={{ x: 5.25, z: 10.65 }}
        shower={{ x: 7.05, z: 10.75 }}
      />
      <Prop slug="ornate_mirror_01" x={6.2} z={12.05} y={base + 1.1} scale={0.6} />
    </group>
  );
}

export function EnsuiteBathroom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      <BathroomFixtures
        base={base}
        palette={palette}
        vanity={{ x: 4.15, z: 11.8, w: 1.1 }}
        toilet={{ x: 3.8, z: 10.65 }}
      />
      <Prop slug="ornate_mirror_01" x={4.15} z={12.05} y={base + 1.1} scale={0.5} />
    </group>
  );
}
```

- [ ] **Step 2: Verify in dev server**

Run: `npm run dev`, select both `service-core` and `ensuite` zones.
Expected: fixtures unchanged from today's positions, mirrors sit above each vanity without clipping the wall.

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build:local`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add components/rooms/Bathrooms.tsx
git commit -m "Add real wall-mirror prop to both bathrooms, keep fixtures procedural"
```

---

### Task 7: Exterior/terrace real props (parallel — after Task 1)

**Files:**
- Modify: `components/rooms/Terrace.tsx`

**Interfaces:**
- Consumes: `Blk`, `Cyl`, `Prop`, `Palette`, and `designAssumptions` (from `@/data/house`) for pergola height.
- Produces: `Terrace({ palette, quality })` — same signature as today (`quality: "high" | "light"` still controls slat/vine density).

- [ ] **Step 1: Implement the terrace**

Keep the pergola structure, slats, and climbing-vine geometry procedural (they're architectural/landscaping structure, not off-the-shelf furniture). Replace the two "olive tree" icosahedron/sphere blockouts with a real Poly Haven tree (closest available Mediterranean-style species — no exact olive tree exists in the free catalog; this is a decorative landscaping stand-in, not a change to measured geometry). Add real outdoor seating and planters.

```tsx
"use client";
import { Blk, Cyl, Prop } from "./shared";
import type { Palette } from "./shared";
import { designAssumptions } from "@/data/house";

export function Terrace({ palette, quality }: { palette: Palette; quality: "high" | "light" }) {
  const slats = quality === "high" ? 15 : 8;
  const vines = quality === "high" ? 11 : 5;
  const posts: Array<[number, number]> = [
    [0.55, 4.0],
    [3.1, 4.0],
    [0.55, 7.8],
    [3.1, 7.8],
  ];
  return (
    <group>
      <Blk x={1.8} z={5.9} y={0} w={3.2} d={5.0} h={0.08} material={palette.stone} />
      {posts.map(([x, z]) => (
        <Blk key={`${x}-${z}`} x={x} z={z} y={0.08} w={0.14} d={0.14} h={2.5} material={palette.timber} />
      ))}
      <Blk x={0.55} z={5.9} y={designAssumptions.pergola.heightCm / 100 - 0.18} w={0.14} d={4.2} h={0.18} material={palette.timber} />
      <Blk x={3.1} z={5.9} y={designAssumptions.pergola.heightCm / 100 - 0.18} w={0.14} d={4.2} h={0.18} material={palette.timber} />
      {Array.from({ length: slats }, (_, index) => (
        <Blk
          key={index}
          x={1.83}
          z={3.9 + (index * 4.0) / (slats - 1)}
          y={designAssumptions.pergola.heightCm / 100}
          w={2.9}
          d={0.09}
          h={0.14}
          material={palette.timber}
        />
      ))}
      {Array.from({ length: vines }, (_, index) => {
        const z = 4.1 + (index * 3.6) / (vines - 1);
        const x = index % 2 === 0 ? 0.6 : 3.05;
        const radius = 0.24 + ((index * 7) % 5) * 0.035;
        return (
          <mesh
            key={`vine-${index}`}
            position={[x - 5.7, designAssumptions.pergola.heightCm / 100 + 0.02, z - 6.05]}
            material={palette.vine}
            castShadow
          >
            <icosahedronGeometry args={[radius, 0]} />
          </mesh>
        );
      })}

      {/* Real trees — closest Mediterranean-style stand-in available in the
          free CC0 catalog; no exact olive tree exists there. Decorative
          landscaping only, not measured/approved geometry. */}
      <Prop slug="island_tree_01" x={0.95} z={3.4} y={0} scale={1.1} />
      <Prop slug="island_tree_01" x={2.9} z={8.4} y={0} rotationY={Math.PI / 3} scale={0.95} />

      {/* Outdoor seating and planters. */}
      <Prop slug="outdoor_table_chair_set_01" x={1.8} z={6.3} y={0} />
      <Prop slug="planter_box_01" x={0.5} z={5.0} y={0} />
      <Prop slug="planter_box_01" x={3.15} z={5.0} y={0} rotationY={Math.PI} />
    </group>
  );
}
```

- [ ] **Step 2: Verify in dev server**

Run: `npm run dev`, view the model with `designMode` on.
Expected: pergola/vines unchanged, trees replace the old sphere blockouts in roughly the same planter positions, outdoor table/chair set sits centered on the terrace slab without overlapping posts, both quality profiles (`high`/`light`) still render without errors.

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build:local`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add components/rooms/Terrace.tsx
git commit -m "Replace terrace tree/olive blockouts with real CC0 props; add outdoor seating"
```

---

### Task 8: UX cleanup — dedupe controls, simplify layout (parallel — independent of Tasks 2-7, can start immediately)

**Files:**
- Modify: `components/HouseExplorer.tsx`
- Modify: `components/DimensionedOverlay.tsx` (only if a misleading-copy issue is found there during Step 1's audit)
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: nothing new — same `house`, `statusCopy`, `ZoneId` exports from `@/data/house` already used today.
- Produces: same `HouseExplorer` component export, same public behavior (view/zone routing via URL params unchanged), just fewer/clearer controls.

- [ ] **Step 1: Audit current controls for duplication and confusion**

Read `components/HouseExplorer.tsx` in full first. Confirmed problems to fix (found by reading the file directly):

1. **Duplicate design-mode toggle.** The side-rail's sun-icon button (`<button className="rail-button rail-bottom" ... onClick={() => setDesignMode((value) => !value)}>`) and the stage's `mode-toggle` buttons ("Survey" / "Material study") both control the exact same `designMode` boolean state. Two separate controls for one piece of state, in two different visual locations, is the kind of duplication the user flagged. Fix: remove the side-rail sun button entirely; the "Survey"/"Material study" toggle in the stage header is the clearer, better-labeled control (it explains what the two states mean) and should be the only one.
2. **Zone selection exists in three separate places that don't visually agree.** Clicking a 3D zone mesh, clicking a `zone-card` in the bottom strip, and clicking a shape in the plan view (`VectorPlan`) all set the same `selectedZone`, but nothing ties them together visually as "the same control." This is acceptable as multi-entry-point navigation (not true duplication — each is a different way to reach the model), so leave this alone; don't remove any of these, just make sure the active zone is visually consistent across all three (check `is-active`/`is-selected` classes are applied correctly in all three — they already are, per the file: `zone-card is-active`, `plan-zone is-selected`, and the 3D `ZoneFloor` highlight).
3. **Quality toggle wording is unclear.** The button labeled `"High detail" : "Light mode"` shows the *current* state as its own label with no indication it's a toggle you can click to change — a user has no way to tell "High detail" means "click to switch to light" vs. "this is high detail, informational." Fix: relabel to make the action explicit, e.g. `quality === "high" ? "Switch to light mode" : "Switch to high detail"`.
4. **"Source controlled" status pill is meaningless to a visitor.** `<span className="status-pill"><i /> Source controlled</span>` in the topbar doesn't explain what it means (git source control? measured-source status? unclear) and isn't clickable/linked to anything. Fix: remove it — it's decoration masquerading as information, which is the "misleading information" pattern the user flagged. If a status indicator is wanted here, it should describe the *current zone's* geometry status (already shown correctly in the inspector's `source-tag`), not a vague global label.

- [ ] **Step 2: Remove the duplicate design-mode toggle**

In `components/HouseExplorer.tsx`, delete this line from the side-rail:

```tsx
<button className="rail-button rail-bottom" aria-label="Design mode" onClick={() => setDesignMode((value) => !value)}><Icon name="sun" /></button>
```

Also remove the now-unused `"sun"` case from the `Icon` component's `paths` object and its type union, if no other call site uses `Icon name="sun"` (grep to confirm: `grep -n 'name="sun"' components/HouseExplorer.tsx` should show zero remaining matches after this deletion).

- [ ] **Step 3: Clarify the quality-toggle label**

In `components/HouseExplorer.tsx`, change:

```tsx
<button className="quality-button" onClick={() => setQuality((value) => value === "high" ? "light" : "high")}>
  {quality === "high" ? "High detail" : "Light mode"}
</button>
```

to:

```tsx
<button className="quality-button" onClick={() => setQuality((value) => value === "high" ? "light" : "high")}>
  {quality === "high" ? "Switch to light mode" : "Switch to high detail"}
</button>
```

- [ ] **Step 4: Remove the meaningless status pill**

In `components/HouseExplorer.tsx`, delete:

```tsx
<span className="status-pill"><i /> Source controlled</span>
```

from `topbar-actions`, leaving just the quality button there. In `app/globals.css`, remove the now-unused `.status-pill` rule (search `grep -n "status-pill" app/globals.css` and delete the matched block); confirm nothing else references the class first (`grep -rn "status-pill" components/` should show zero remaining matches after the HouseExplorer edit).

- [ ] **Step 5: Re-check `DimensionedOverlay.tsx` for the same duplication/misleading-copy patterns**

Read `components/DimensionedOverlay.tsx` in full. Look specifically for: any leftover control that duplicates a `HouseExplorer` control, any status copy that overstates confidence (e.g. anything implying approval/confirmation that the geometry-audit data doesn't actually support — cross-check against `data/house.ts`'s `geometryApprovalItems`, where every item currently has `approved: false` except `living-west-opening` and `ensuite-partition`). If found, fix inline using the same pattern as commit `ec7616a` (the prior session's "Relabel needs-confirmation status copy to a passive description" fix) — describe status passively/accurately rather than implying an action was taken. If nothing is found, skip this step's edit (do not force a change).

- [ ] **Step 6: Visual pass in dev server**

Run: `npm run dev`, open the app. Walk through: side-rail (3 nav buttons only, no sun icon), topbar (title + quality button only, no status pill), stage header (Survey/Material study toggle works and is now the only design-mode control), quality button label changes correctly when clicked, zone-strip and 3D zone clicks still both navigate correctly.
Expected: no dead controls, no unlabeled icons, no visual regression in spacing now that two elements were removed (side-rail's bottom button, topbar's status pill) — check `app/globals.css` for any layout rule (e.g. `justify-content: space-between` relying on the removed elements) that now leaves an awkward gap, and tighten if so.

- [ ] **Step 7: Lint and build**

Run: `npm run lint && npm run build:local`
Expected: pass, zero unused-import/unused-variable warnings (confirm `Icon`'s `"sun"` type is fully removed if unused).

- [ ] **Step 8: Commit**

```bash
git add components/HouseExplorer.tsx components/DimensionedOverlay.tsx app/globals.css
git commit -m "UX cleanup: remove duplicate design-mode toggle and meaningless status pill, clarify quality-toggle label"
```

---

### Task 9: Integration verification (sequential — after Tasks 2-8 all merged)

**Files:**
- None created/modified — verification only.

**Interfaces:**
- Consumes: everything from Tasks 1-8.

- [ ] **Step 1: Full lint + build**

Run: `npm run lint && npm run build:local`
Expected: pass with zero errors/warnings across the whole merged tree.

- [ ] **Step 2: Full manual walkthrough in dev server**

Run: `npm run dev`. For every one of the 7 zones (kitchen, living room, master bedroom, east-upper, east-lower, main bathroom, ensuite) plus the terrace: orbit in Material study mode, confirm props are visible, correctly scaled (compare against the room's own wall lengths — no prop should look larger than the room), not clipping walls or each other, and shadows render in `high` quality. Toggle to `light` quality and confirm the scene still renders (fewer lights, but same geometry) without console errors.

- [ ] **Step 3: Check bundle/asset weight is reasonable**

Run: `du -sh public/props` and `du -sh public/props/*` 
Expected: no single model directory is unexpectedly large (Poly Haven 1k textures are typically 100-200KB each per texture map — flag anything over ~5MB per model directory for review, since that would suggest an accidentally-fetched 4k or wrong-resolution asset).

- [ ] **Step 4: Confirm no geometry-data changes**

Run: `git diff main -- data/house.ts` (or whatever the merge base is)
Expected: empty diff — this whole plan must not have touched `data/house.ts`.

- [ ] **Step 5: Report**

Summarize to the user: which rooms are now furnished with real props, what stayed procedural and why (kitchen cabinetry, bathroom fixtures), the olive-tree stand-in caveat, and the UX changes made. Do not deploy/push — wait for explicit instruction per `AGENTS.md`.
