# Mood-image material pass — 2026-09-28

The real-time renderer now samples the existing mood-board image files directly
for joinery, worktops, plaster, mineral floors and upholstery. No new images were
generated. These are supplied design references, not verified site photographs
or scanned PBR materials.

| Surface | Original image | Used on |
| --- | --- | --- |
| Weathered clay | `mood-terrace-08.jpeg` | Round outdoor olive pots |
| Oak | `mood-kitchen-16.jpeg` | Joinery, doors, bedroom storage and bathroom vanities |
| Travertine | `mood-kitchen-detail.jpeg` | Worktops, island, vanity tops and tables |
| Lime plaster | `mood-living-14.jpeg` | Interior/exterior shell |
| Mineral finish | `mood-bath-16.jpeg` | Sand floor option and wet-room floors |
| Linen | `mood-living-08.jpeg` | Sofa, chair seats, bed upholstery, duvets and pillows |

`data/moodSurfaces.ts` records each image, selected surface patch and visual sample
size in centimetres. The shader in `lib/moodSurfaceMaterial.ts` converts that size
to metres and projects the patch onto the existing meshes. Furniture mapping
follows the object; wall/floor mapping remains continuous in world coordinates.
Mirrored patch edges avoid sampling nearby furniture, joints or cast shadows.
A low-frequency normalization reduces the source image's lighting, with separate
roughness and fine relief retained where available. This is an approximate
material treatment, not reconstruction of a measured BRDF or full image de-lighting.

The crop shader survives cutaway-wall, floor and kitchen material cloning.
Original image textures are shared; owned texture/material clones are disposed
on replacement. The lighter profile retains its reduced geometry, effects and
framebuffer budgets. Existing parquet PBR maps remain the oak-floor option.

Interior lighting uses more neutral sky bounce, less uniform ambient fill, and
stronger existing kitchen window lights. Existing garden lighting is retained.
The Materials board points to the same source images as these rendered finishes.

No footprint, wall run, opening, floor level or ceiling height changed. `data/house.ts` and the measured master overlay are unchanged;
no new architectural geometry was inferred from the mood references.

Validation: `npm run lint`, `npm run build:local`, and
`scripts/verify-mood-materials.mjs` against the dev server. The browser check
records all seven rooms, overview, lighter rendering, parquet, survey shell and
mobile; it verifies the actual bound image URLs and catches shader/browser errors.
Screenshots and its report are under `artifacts/mood-materials/after/`.


The toilet and garden pass uses original Blender-authored GLBs. Both WCs use a
smooth ivory wall-hung body, closed D-shaped lid, slim layered seat and vertical
dual-button flush plate from `mood-ensuite-06.jpeg`. The main WC rear datum is
495.5 cm, aligned to the existing west partition's finished face; the ensuite
retains its proposed 48 cm projection and 76 cm front approach. The exported
36 × 54 cm model is checked before the ensuite depth adjustment. These proposed
fixture sizes are not inferred survey measurements.

The terrace/patio pots follow the round weathered clay vessel and fine olive
foliage in `mood-terrace-08.jpeg`. Box planters and broadleaf outdoor props were
replaced at their existing anchors. The pergola now has white star jasmine from
`mood-terrace-05.jpeg`, with connected stems winding around the existing posts.
The old floating foliage cards were removed. Myrtle, sage and rosemary use
fuller low-branching models. Existing plant anchors, circulation exclusions and
height-band collision checks are retained. Stable vine IDs retain their former
`bougainvillea` prefix for selection compatibility; their species is jasmine.

Build assets with Blender 4.5 LTS running `scripts/build-mood-fixtures.py`, then
run `scripts/pack-mood-fixtures.mjs` with glTF Transform and Meshoptimizer
installed (`MOOD_ASSET_TOOLS` may point at an external node_modules directory).
The image references establish appearance; these models are interpretations,
not exact 3D reconstructions from single images.

Fixture validation is `scripts/verify-mood-fixtures.mjs`: decoded GLB bounds and
finite attributes, toilet dimensions, high/light pot assets, both jasmine
instances passing the real geometry clearance checks, and orthographic navigation.
`LAYOUT_ARTIFACT_DIR=artifacts/mood-fixtures node scripts/verify-ensuite-layout.mjs`
checks the WC footprints and produces the measured-plan registration and
orthographic overlay. Safari UI inspection via Orca covers both bathrooms,
garden, terrace, high/light profiles and top view. Evidence is in
`artifacts/mood-fixtures/`. Lint retains the existing `usePanelFocus.ts` warning.

Both quality profiles load all 15 decoded assets without errors. The existing
clearance filter omits three border specimens whose full leaf bounds would enter
protected areas (`terrace-north-27`, `terrace-south-11`, `north-courtyard-17`);
no exclusions were relaxed to force them into the scene.
