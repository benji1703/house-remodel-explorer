# Apartment rendering review — 2026-10-03

Owner request: repair the sofa throw and review the whole apartment as a coherent,
professional real-time 3D experience.

## Visual changes

- Replaced the sofa's intersecting procedural throw with a continuous Blender
  cloth simulation against its actual cushions and arm. Relaxed the simulated
  creases, added fabric thickness and a narrow stitched hem, and baked neutral
  short-range occlusion into vertex colours. The existing 220 × 102 × 86 cm
  editable envelope, placement, selection ID and accessory ownership remain.
- Rebuilt the bedroom runner against the existing duvet/mattress surface in
  Blender. Replaced repetitive waves with settled cloth and a filled lumbar
  cushion; restrained the duvet creases across all three bedrooms.
- Fixed dominant-axis textile UVs, including UVs previously deleted from lounge
  chair cushions. Reduced fabric relief and made the bump weave approximately
  millimetre scale. Retained the existing shared linen albedo and finish controls.
- Added diffuse sky bounce at existing glazing, with neutral indirect light and
  warm practical fixtures. Floor contact captures now centre on the selected
  room. Matte oak roughness is bounded to prevent polished-looking patches.
- Softened limewash relief and contrast. Both wet rooms use the existing pale
  mineral finish; oak/microcement selection still applies to dry rooms.
- Refined tabletop and kitchen olive sprigs with curved, tapered leaves.
- The initial view uses Soft daylight at 13:30. Local now, the time slider,
  Golden hour, Evening glow and independent house-light controls remain.

## Runtime repairs

- Clear a cancelled shadow-refresh request during React Strict Mode cleanup.
  Previously the retained pending flag prevented subsequent asset arrivals from
  updating contact shadows. Async sanitaryware and plants also request a refresh.
- Limit nearby active practical shadow maps to six in high quality and three in
  light quality, reserving fragment samplers for PBR maps, environment and area
  light LUTs. This prevents missing furnishings from shader sampler exhaustion
  in full-house walkthroughs on GPUs with sixteen fragment texture units.
- Preserve walkthrough position and gaze when quality/texture loading remounts
  the controller through Suspense. Room selection and Reset position still start
  at their intended poses. Releasing movement input stops translation promptly.

## Architecture

No footprint, wall run, opening, thickness, ceiling datum, floor elevation or
room dimension changed. `data/house.ts`, `data/structuralWalls.ts`, the measured
source and master overlay remain the same. Furniture/textiles/materials are
removable visualization fit-out. The existing orthographic frame-contact and
source-proof checks remain part of the browser verification.

## Review artifacts and checks

- `artifacts/apartment-review/before/`: baseline views of all seven rooms and
  the whole-house overview, captured in Soft daylight before this repair.
- `artifacts/apartment-review/`: current 2× room/overview views plus desktop
  Chromium/WebKit sofa close-ups, evening-light comparisons and mobile captures.
  Screenshots use JPEG quality 92 to keep the full-resolution evidence compact;
  `report.json` contains metrics and WebGL results for every test capture.
- `scripts/verify-apartment-render.mjs`: real browser shader/asset errors,
  contact-shadow refresh, wet-room surfaces, original sofa dimensions, bounded
  shadow samplers, quality-switch pose retention and WebGL-loss fallback.
- `scripts/verify-lighting-transitions.mjs`: visible loading feedback,
  responsive time controls, daylight window bounce, persistent practical
  fixtures, house-light switching and retained furniture during transitions.
- `scripts/verify-interior-styling.mjs`: all 18 fitted openings, room assets,
  furniture resize/removal, survey mode, orthographic/source proof and mobile.
- `scripts/verify-walkthrough.mjs` and `scripts/verify-walk-collision.mjs`:
  keyboard/touch navigation, release/focus cleanup, room starts, doors and walls.
- `npm run lint` and `npm run build:local`: engineering checks.

Final results: all 18 apartment browser cases passed in Chromium/WebKit with
zero JavaScript, asset or shader errors. Desktop high-quality captures use DPR 2
(2880 × 1920 full-page output on the review display); the report records 16
fragment texture units and all linked shader programs for each capture. The
interior styling, lighting transition and walkthrough browser checks passed.
The walkthrough test opened the exterior kitchen entry, crossed onto the garden,
kept the correct ground-level eye height and returned inside. Collision checks
and validation of all 26 Meshopt GLBs also passed. Lint and TypeScript report no
errors; lint retains one existing `usePanelFocus.ts` warning. `npm run
build:local` could not complete because Next.js could not download the Google
Figtree and Newsreader fonts in the restricted network environment.

## Rebuilding the changed assets

Use Blender 5/bpy Python and an external asset-tool installation containing
`@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions`
and `meshoptimizer`. Set `GLTF_TRANSFORM_MODULE` for the sofa base builder and
`MOOD_ASSET_TOOLS` for packing if these are outside the project.

1. `node scripts/build-tailored-sofa.mjs`
2. Run `scripts/build-sofa-textiles.py` with Blender or bpy Python.
3. Run `scripts/build-bedroom-textiles.py` with Blender or bpy Python.
4. Set `INTERIOR_ASSETS=coffee-still-life,kitchen-herbs` and run
   `scripts/build-interior-mood.py` with Blender/bpy for the curved sprigs.
5. Set `INTERIOR_ASSETS=linen-lounge-chair` and run
   `node scripts/refine-interior-cushions.mjs` to repair existing cushion UVs.
6. Run `scripts/pack-interior-mood.mjs` with `INTERIOR_ASSETS` listing the changed
   high/light asset names (without `.glb`). This preserves unrelated assets and
   updates the shared asset manifest. The final exports use Meshopt compression.

The authored simulations and contact bake run offline; the browser loads static
high/light GLBs by room, keeping camera, finish, lighting and furniture edits live.
