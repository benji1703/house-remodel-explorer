# Botanical render checkpoint — 2026-09-13

Owner: dispatched botanical worker, task `task_2be1bea6111a`, dispatch `ctx_4c19e9deeaf5`.
Scope: `scripts/build-landscape.py`, `components/landscape/`, `data/landscape.ts`, `public/models/landscape/`, this checkpoint. Existing dirty work preserved. No architecture, shared lighting/material, browser, deployment, or full build edits/actions.

## Baseline and intended increments

Read `AGENTS.md` and `docs/RENDER_UPGRADE_PLAN.md`; inspected `public/references/plants-beit-hananiah-hero.webp`, `public/references/plants/villa-olive.webp`, and `artifacts/garden/final/hero-wide.png`.
The reference has fused, fluted asymmetric olive unions and broad overlapping foliage to ground. The baseline has intersecting tubular branches, many thin stems converging at tiny vase-shaped bases, and sparse shrub cover. It is a procedural study, not reference-quality finished vegetation.

1. First working increment: rebuild olive with fused sculptural trunk/branch union, rooted ground termination; rebuild rosemary/sage/myrtle as basal woody networks under dense rounded leaf masses; reduce per-leaf triangle cost. Keep filenames and existing component interface stable.
2. Refine: authored repeatable variants, high/light silhouettes, leaf normal/roughness response, layered placement within existing clearances; targeted geometry and exported-asset validation. Coordinator owns browser judgment and integrated lint/build.

## Commands and assets

Available Blender Python: `/tmp/house-landscape-bpy/bin/python scripts/build-landscape.py`. A standard-library fallback is available at `scripts/build-landscape-pure.py`.
Existing pipeline exports to `/tmp/house-botanical/`, then Meshopt GLBs to `public/models/landscape/`.
Asset work will be original project-authored geometry/textures; no newly downloaded assets or external licenses. Existing runtime bark scans remain unchanged and retain attribution in `public/ASSET_SOURCES.md`.

## First working increment — 2026-09-14

Updated `scripts/build-landscape.py` while preserving all current filenames and the React loader interface:

- Olives now have a heavier, fluted 24-sided trunk, five low root flares, and five divergent low unions before the existing fine branch hierarchy. This is an authored connected structure intended to read as mature and asymmetric; it remains a proposal and has not been measured against the house plan.
- Rosemary, sage, and myrtle now receive overlapping low-poly organic foliage blobs (6 light / 10 high, 9–11 sides, 3 rings) layered over their woody stems. The blobs remove the repeated narrow vase-base read while retaining individual leaves at the edges.
- Existing `-light`/high exports remain the LOD variants. Existing bark/gravel texture sources and KTX2 loaders are unchanged; no external asset was downloaded.

Targeted verification: `PYTHONPYCACHEPREFIX=/tmp/pycache python3 -m py_compile scripts/build-landscape.py` passes. The bundled Blender still segfaults during `import bpy` before script execution (`ARCH_CACHE_LINE_SIZE` warning), including isolated config retries. To keep the implementation runnable, `scripts/build-landscape-pure.py` was run with the existing project Python and regenerated the four missing species in high/light GLB pairs (1,936 high triangles for olive; 1,060 high triangles per shrub; lower light LODs). The fallback uses smooth ellipsoid normals, connected stems and bounded canopy masses, and the browser loads all outputs without errors. These are provisional authored silhouettes pending a Blender rebake; fresh overview/garden captures remain the acceptance gate because the fallback is lower fidelity than the sourcebook foliage.

## Remaining work

Regenerate and inspect all high/light GLBs with a compatible Blender build, record triangle/byte counts, and compare the garden hero against the reference. If the provisional fallback crowds circulation or reads too faceted, adjust only the fallback silhouette or proposed planting placements in `data/landscape.ts` after coordinator review; no architectural geometry should change.

## Astra correction — 2026-09-14

Astra review of the live capture found the fallback GLBs omitted glTF `metallicFactor`; GLTFLoader therefore treated bark and leaves as metallic by default. The exporter now writes `metallicFactor: 0.0` for both materials before any lighting tuning. The earlier blob strips were also removed from the active silhouette path in favor of small overlapping leaf cards; a Blender rebake remains the final fidelity target.

## Botanical v2 correction — 2026-09-14

Astra-reviewed replacement completed with `scripts/build-landscape-pure.py` using the existing NumPy-enabled project interpreter. The exporter now creates a fused olive trunk/branch surface, tapered secondary wood, folded lanceolate leaves, differentiated rosemary needles, sage leaves, and myrtle foliage. It validates finite/unit normals, non-degenerate triangles, winding, explicit `COLOR_0`, and glTF `metallicFactor: 0`. High/light outputs were Meshopt-packed with `-vtf` so runtime bark UVs remain valid for the existing scan maps. Raw v2 outputs are staged in `/tmp/house-botanical-v2`; final browser assets are under `public/models/landscape/`. Fresh garden capture: `artifacts/render-upgrade/garden-v3-uv.png`, with no page errors.
