# Project handoff

## Latest checkpoint — 2026-09-29

The original geometry-audit sequence below is historical. The owner closed the
explorer geometry ledger on 2026-08-08; see `GEOMETRY_AUDIT.md` for accepted
working assumptions and remaining construction-survey limitations.

The viewer now includes seven furnished room views, garden exploration,
high/light rendering profiles, shared mood-image finishes and first-person
walkthrough controls. Architectural walls and closed openings constrain walking;
furniture does not. Daylight, golden-hour and evening presets are available.

The latest continuation completes the in-progress beige mineral material and
interior-lighting pass. Plaster and floor colour, fine relief and roughness share
one world-projected photographic crop; unused procedural mineral maps were
removed. See `MOOD_RENDERING.md` for source patches and approximation limits.
The measured geometry is unchanged.

Owner follow-up: oak parquet is now the default across all seven rooms, including
both bathrooms. Microcement remains an explicit whole-house alternative. The
controls panel's furniture/dimension buttons use the same separated layout on
desktop walkthroughs and mobile.

Local validation commands are `npm run lint`, `npm run build:local`,
`scripts/verify-mood-materials.mjs` and `scripts/verify-finish-lighting.mjs`.
The browser scripts require a dev server and Playwright; `PLAYWRIGHT_MODULE`
can point at an external installation (with `pngjs` for lighting checks).
Material/lighting review artifacts are in `/tmp/house-mineral-review/`;
the oak-default and desktop/mobile controls review is in `/tmp/house-oak-review/`.
No deployment has been performed.

## Product objective

Create a production-ready interactive website that presents the house remodel as a whole-house overview and as individual room experiences. Visitors should be able to explore 3D scenes, compare before and after states, inspect materials and products, and use the experience on desktop and mobile.

## Chosen architecture

- React + TypeScript for the application;
- React Three Fiber, Three.js, and Drei for browser 3D;
- Zustand for shared viewer state when multi-route scenes are introduced;
- Blender for authoritative detailed modeling;
- glTF/GLB for browser delivery;
- PBR metal/roughness materials;
- per-room lazy loading and separate desktop/mobile quality profiles.

## Original implementation checkpoint

The current route is a geometry-control interface. It includes:

- an orbitable conceptual shell;
- a clickable vector audit plan;
- six provisional geometry zones;
- a source/status inspector;
- measured-source and mood-reference views;
- high/light rendering modes;
- a lighter mobile and non-WebGL path.

The current shell is not the approved architectural master. It visualizes an initial trace of the photographed plan so uncertainties can be found and resolved.

## Original continuation sequence

1. Audit the measured plan and produce a dimensioned 2D master.
2. Ask only for unresolved dimensions that materially affect geometry.
3. Receive explicit approval for the external shell, internal walls, openings, and levels.
4. Rebuild `data/house.ts` from approved coordinates and add regression checks.
5. Create the real-scale Blender master and compare an orthographic export to the approved plan.
6. Export the optimized whole-house overview as GLB.
7. Add the kitchen/living room as the first detailed room route.
8. Add typed material/product/hotspot manifests.
9. Add before/after geometry and material variants.
10. Expand room by room, then perform performance and accessibility QA.

## Definition of the next approval milestone

The geometry audit is complete only when the user has approved:

- outer-wall coordinates and wall thicknesses;
- every interior partition to be retained or changed;
- every door and window position and width;
- floor and ceiling heights;
- any changes in floor level;
- roof/pergola relationship where it affects the model;
- the room-use plan for the remodel.

Do not start photoreal detailed modeling before this milestone.
