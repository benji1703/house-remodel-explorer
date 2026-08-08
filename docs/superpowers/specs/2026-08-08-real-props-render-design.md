# Real-prop furnishing pass — design

## Goal

Replace primitive box/cylinder furniture blockouts in `MeasuredHouseScene.tsx` with real CC0 3D models (Poly Haven), across the whole house, without altering approved/measured architectural geometry. Furnish the two currently-empty east rooms; re-furnish the kitchen with more taste-consistent detail; expand outdoor/indoor decor.

## Non-negotiables (carried over from AGENTS.md)

- Never modify wall coordinates, footprint, openings, or dimensions in `data/house.ts`. This pass only adds/replaces movable furniture and decor within existing room volumes.
- Real props must be true to their real-world scale (Poly Haven models are photogrammetry/CAD at real scale — use as-is, don't stretch to fit).
- Fixed building elements without a Poly Haven equivalent (kitchen cabinetry/counters, bathroom vanity/toilet/shower) stay procedural, built at correct cm dimensions — not replaced with a mismatched generic model.
- No exact olive tree exists in the free catalog; a similar Mediterranean-style tree stands in, flagged in code comments as an approximation, not a measured/invented architectural element.

## Asset pipeline

1. `scripts/fetch-props.mjs`: Node script, no new deps beyond `node:https`/`node:fs`. Given a manifest array of `{ id: PolyHavenSlug, format: "gltf", res: "1k" }`, calls `https://api.polyhaven.com/files/<id>`, downloads the `.gltf` + its `include` files (bin + textures) into `public/props/<id>/`, preserving relative paths. Idempotent (skips existing files).
2. Manifest lives inline in the script (or a small `scripts/props-manifest.json`) — one entry per model used anywhere in the scene, so re-running the script is the single source of truth for what's on disk.
3. `components/Prop.tsx`: thin wrapper — `useGLTF(url)`, clones the scene (so one loaded model can be instanced multiple times, e.g. two nightstands), applies `position`/`rotation`/`scale`, sets `castShadow`/`receiveShadow`.
4. Room functions (`Kitchen`, `Living`, `Bedroom`, new `EastUpperRoom`/`EastLowerRoom`, `Bathroom`, `Terrace`) compose `<Prop>` placements using the same per-zone `base` local-origin convention already in the file, instead of `<Blk>`/`<Cyl>` stacks. Cabinetry/counters/vanities/toilets/showers keep their existing `<Blk>`-based construction.
5. Lazy loading: wrap each room's prop group in React `Suspense`; only mount a zone's detailed prop group when `designMode` is on (as today) — this already scopes loading to the interactive/design view rather than the plan/audit views.

## Manifest (draft, confirmed available on Poly Haven at time of writing)

- Living: `Sofa_01`, `ArmChair_01` or `mid_century_lounge_chair`, `CoffeeTable_01`, `modern_ceiling_lamp_01` or floor lamp equivalent, `potted_plant_01`, `ornate_mirror_01` or wall decoration.
- Kitchen: `electric_stove`, bar stools (`bar_chair_round_01` ×2), pendant light, `potted_plant_02`, dishes/vases from `dishes`/`vases` categories for open-shelf styling.
- Master bedroom (southwest): `GothicBed_01`/`old_bed_frame`/similar real bed, `ClassicNightstand_01` ×2, `painted_wooden_cabinet` or wardrobe-equivalent, rug.
- East-upper room: bed + nightstand, small desk or `WoodenChair_01`, matching palette.
- East-lower room: bed + nightstand, `Ottoman_01` or reading chair.
- Bathrooms: procedural (no change) + `ornate_mirror_01`-class decor if scale fits.
- Exterior/terrace: `outdoor_table_chair_set_01`, `planter_box_01`/`02` ×2, `potted_plant_04`, a Poly Haven tree (e.g. `island_tree_01` or `jacaranda_tree`) as an olive-tree stand-in, pergola lighting from the `lighting` category.

Exact picks get finalized per-zone by the implementing agent, cross-checked against the moodboard's warm-oak/neutral palette; this list is a starting manifest, not a locked spec.

## Parallelization

Independent work units, dispatched as parallel agents once the plan is written:

1. Kitchen re-furnish
2. Living room re-furnish
3. Master bedroom re-furnish
4. East-upper + east-lower room furnishing (paired — same new-room pattern)
5. Exterior/terrace enrichment
6. Bathrooms (light-touch decor only)

Each agent: updates its manifest slice, extends `fetch-props.mjs`'s manifest, runs the fetch script, rewrites its room function in `MeasuredHouseScene.tsx`, verifies placement doesn't clip walls/other props, runs `npm run lint` and `npm run build:local`. I merge and do a final cross-room visual/perf pass (bundle size, shared Suspense boundaries, no duplicate texture loads).

## Testing/verification

- `npm run lint`, `npm run build:local` after each zone and after merge.
- Manual check in dev server: orbit each room, confirm props sit on the correct floor level (`zone.level`), don't clip walls/openings, shadows render, and `light` quality profile still degrades gracefully (fewer/no point lights, but props still visible).
- No automated visual regression tooling exists in this repo; verification is build-green + manual visual check, consistent with how prior 3D passes in this project were verified.

## Out of scope

- No changes to `data/house.ts` geometry, zone coordinates, or approval status.
- No Blender authoring pipeline (per user decision: free CC0 glTF instead).
- No before/after state toggling, no clickable hotspots/product manifests — those remain future milestones per `docs/PROJECT_HANDOFF.md`.
