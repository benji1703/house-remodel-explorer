# Render upgrade — resumable implementation

Started 2026-09-13. User authorized fixing all Astra review findings with parallel agents, incremental usable results, and token-conscious checkpoints. No deployment authorized.

## Target and constraints

- Visual targets: `public/references/plants-beit-hananiah-hero.webp`, `public/references/sourcebook/terrace-iron.webp`, `public/references/sourcebook/kitchen.webp`.
- Measured geometry remains authoritative: `public/references/measured-plan.jpeg`, `data/house.ts`, AGENTS.md. Do not invent roofs, openings, levels, or site boundaries. New finish/planting proposals remain proposals.
- Current branch contains extensive pre-existing uncommitted work. Preserve it; no reset, clean, blanket revert, staging, commits, or deploy.
- Primary URL: `http://localhost:3000/?view=model&camera=overview&zone=north-extension`. Also validate room and garden modes.
- Keep React/R3F, typed cm data, lazy room assets, high/light quality, selection IDs, keyboard/touch, reduced motion and fallback.

## Ordered checkpoints

| Step | Deliverable | Owner | Status / acceptance |
|---|---|---|---|
| 0 | Plan, baseline screenshots, ownership | Coordinator | Plan saved; baseline in `/tmp/house-remodel-astra-review/` and `artifacts/garden/final/` |
| 1 | Camera cold-load fix and repeatable browser assertions | Coordinator | DONE: controls-ready initialization; kitchen/island/overview, reduced-motion, normal-motion, keyboard orbit and resize assertions pass in `artifacts/render-upgrade/camera/report.json` |
| 2A | Botanical assets and layered planting/ground | Botanical worker | DONE for current asset gate: NumPy pure-Python v2 generates differentiated branch/leaf meshes, Meshopt + float-UV packaging validated in browser; Blender rebake remains optional |
| 2B | Terrace hero furniture and physically scaled finish assets | Terrace worker | DONE: dedicated iron chairs, pale cushions, stone pedestal/table materials and typed specs; approved extents and editing ID preserved |
| 2C | Lighting, contact shadow datums, reflection/occlusion strategy | Lighting worker | DONE first increment: -3.5cm gravel datum + 2mm contact, exterior policy, mineral relief; baked GI/probes remain future gap |
| 3 | Integrate shared materials, scene visibility/LOD and fixes | Coordinator | DONE for current increments: render-phase progress subscription removed, stale key fixed, lint/build pass, no page errors |
| 4 | Visual iteration and acceptance | Coordinator + bounded workers | PARTIAL: camera regression, terrace placement fix, botanical v2 close render and zero-error garden smoke pass; remaining gap is fine art direction of shrub base silhouettes |

## Exclusive write ownership

- Coordinator: `components/MeasuredHouseScene.tsx`, `components/HouseExplorer.tsx`, `components/scene/GardenDiagnostics.tsx`, `scripts/verify-render-upgrade.mjs`, this plan, final validation report, shared integration only.
- Botanical worker: `scripts/build-landscape.py`, `components/landscape/*`, `data/landscape.ts`, botanical models/textures under NEW subdirectories as needed, `docs/RENDER_BOTANICAL_CHECKPOINT.md`. Own existing `public/models/landscape/` only. Do not touch shared lighting/material files.
- Terrace worker: `components/rooms/Terrace.tsx`, NEW dedicated terrace asset/material modules, NEW terrace asset generation scripts/data/models/textures, `docs/RENDER_TERRACE_CHECKPOINT.md`. Do not edit generic furniture/shared helpers or coordinator palette; expose own materials or report integration needed.
- Lighting worker: `components/scene/LightingRig.tsx`, `data/lighting.ts`, `lib/landscapeMaterials.ts`, NEW dedicated lighting/environment/material assets, `docs/RENDER_LIGHTING_CHECKPOINT.md`. Do not edit shared scene or landscape components; report needed integration.
- Every worker reads reference images before editing, writes a short checkpoint early and at completion, and reports exact files and interfaces. No worker-wide lint/build while peers edit; coordinator runs integrated checks.

## Resource discipline

- Three bounded workers maximum; one coordinator owns integration and browser verification. No recursive delegation.
- Each worker delivers a working first increment before refinement. Avoid unbounded asset browsing/generation or repeated wholesale scene rewrites.
- Do not call a renamed procedural blockout a finished asset. Judge close silhouettes/materials in real screenshots. If a required asset cannot be sourced/authored, record that specific gap honestly.
- Asset source/license attribution in each worker checkpoint; coordinator consolidates `public/ASSET_SOURCES.md`.
- One integration check per meaningful increment; repeat only for changes or failures. Preserve baseline; avoid running multiple Blender/browser jobs unnecessarily.

## Resume protocol

1. Read this file, AGENTS.md, and `docs/RENDER_*_CHECKPOINT.md`; inspect `git status --short`. Do not repeat the original review.
2. Inspect Orca `orchestration task-list --brief --json` and active dispatches before reassigning ownership. Never duplicate a live worker.
3. Continue first incomplete checkpoint; finish/test partial edits before expanding scope. Exact task IDs/terminal handles and outcomes are appended below.
4. Run `npm run lint`, `npm run build:local`, browser regression script and fresh comparison screenshots after integration.
5. Update this plan with completed steps, evidence paths, remaining gaps and the exact next action before stopping. No deployment.

## Session log

- Initial review: current eye-level scene still has tubular olive trunk, narrow repeated shrub bases, basic outdoor furniture, untextured timber, flat finish response, exposed ground horizon. Kitchen direct room URL rendered living furniture; camera initialization race identified. Overview contact receiver is 13.8cm above gravel.
- Current baseline browser: Chrome at 1440×960, all three routes loaded without page errors. Review-only files unchanged before this plan.
- 2026-09-14 continuation: camera fix added to `components/MeasuredHouseScene.tsx`; `GardenDiagnostics` now exposes controls target/direction; `scripts/verify-render-upgrade.mjs` added. `npm run lint` passes with one pre-existing warning; `npm run build:local` passes. All three visual workers reached their agent usage limits after checkpoint/audit and before generated asset changes; no botanical/terrace/lighting implementation can be claimed complete. Resume by re-dispatching those exact tasks when capacity returns, first inspecting checkpoint files and `git status`.
- 2026-09-14 completion wave: all three workers returned `worker_done`. Terrace and lighting first increments integrated. Botanical script increment is documented, but no live botanical GLB bytes changed because `bpy` segfaults on import. Removed `useProgress()` from LightingRig after fresh browser exposed `Cannot update a component (LightingRig) while rendering a different component (PlantBatch)`; contact capture remains keyed by stable scene state. Final camera regression: 2 motion modes pass; lint/build pass; fresh requested overview had zero page errors. Next resume action: repair/use compatible Blender runtime, regenerate botanical high/light GLBs, then fresh garden comparison and performance/LOD review.
- 2026-09-14 UI/render follow-up: terrace chair frames now use local chair-center transforms and cardinal rotations, keeping all four chairs attached around the 160×85 cm table while preserving the `terrace-dining-set` editor ID. Lint/build remain passing; fresh garden smoke has zero page errors. Full UI polish and reference acceptance remain coupled to the botanical GLB regeneration gate.
- 2026-09-14 fallback continuation: bundled `bpy` still crashes before export, so `scripts/build-landscape-pure.py` regenerated provisional high/light GLBs. Astra review then found omitted metallic factors and reversed proxy winding; the exporter now writes explicit zero metalness, runtime forces botanical materials to nonmetallic, and canopy proxy winding is corrected. The garden remains PARTIAL: the proxy silhouettes still need replacement with differentiated clustered leaves and a close-up sourcebook acceptance pass.
- 2026-09-14 Unity-style 3D pass: botanical assets were rebuilt as real indexed GLB meshes with fused olive isosurface wood, tapered shoots, folded leaves, vertex pigment, zero-metal PBR materials, and float UVs. `MediterraneanLandscape` keeps one instanced draw per mesh part and uses Three's native `Raycaster` through R3F pointer events for plant selection; `GardenDiagnostics.plants()` verifies material attributes, accepted/rejected placements, and mesh data at runtime. Contact captures now remount after the committed landscape load. Fresh exact-route render is `artifacts/render-upgrade/garden-v3-uv.png`; camera, lint, build, and browser error checks pass.
- 2026-09-14 render engineering pass: repacked all botanical assets with floating-point UVs after detecting quantization damage to runtime bark-map injection; added species-aware roughness/side/material handling, committed-landscape shadow refresh, native raycast diagnostics, and validated both vine anchors. Exact garden route reports zero errors, 2,506 draw calls, and 14.7M triangles at the high desktop profile; the mobile light profile remains the intended budget.
