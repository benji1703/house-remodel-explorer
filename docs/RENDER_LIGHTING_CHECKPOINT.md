# Rendering lighting checkpoint — 2026-09-13

## Scope and starting evidence

Worker owns `components/scene/LightingRig.tsx`, `data/lighting.ts`, `lib/landscapeMaterials.ts` and new dedicated lighting modules only. Existing dirty work is preserved. Read AGENTS.md and `docs/RENDER_UPGRADE_PLAN.md`; inspected sourcebook terrace/kitchen and plants hero references plus `/tmp/house-remodel-astra-review/{overview,garden}.png`.

Reference targets: directional warm daylight with neutral shaded mineral surfaces, shaded plant interiors, readable room recesses and broad natural reflections. The baseline has excessive uniform fill and color-only mineral pores; an exposure adjustment cannot supply geometric detail or indirect-light occlusion.

## First increment — implemented

- Separate exterior gravel contacts at −3.3 cm (existing −3.5 cm gravel plus 2 mm) from existing +10 cm interior floors. Exterior contacts must persist in overview and garden regardless of selected room.
- Refresh one-shot contact captures after asynchronous assets commit, using event-driven scene changes/loading completion rather than continuous shadow renders.
- Use one daylight/environment policy across cameras; retain daylight/time, night practicals, high/light budgets and survey rendering.
- Add light-reactive, world-space limestone relief and retain mineral crevices in the existing gravel scan.

Implemented in the owned modules. `LightingRig` now treats overview and garden as
the same exterior presentation policy while keeping room/plan settings separate.
One-shot ContactShadows and Environment snapshots are keyed by stable scene and
quality state. This avoids mutating LightingRig from a child asset loader during
render while still refreshing when the selected camera, finish, or furniture
signature changes; there is no continuous shadow render loop. Exterior contacts use the explicit −3.5 cm gravel
datum plus 2 mm (−3.3 cm), while interior contacts retain their +10.3 cm local
floor receivers. Limestone relief adds procedural normal perturbation from the
world-space mineral field, and mineral roughness/env response is restrained for
natural diffuse stone rather than warm exposure tricks.

## Interfaces and validation plan

Keep existing LightingRig props and material factory signatures compatible. Targeted
source checks only; coordinator owns full lint/build, GPU shader compilation and
browser/reference comparisons. No deployment or geometry changes.

## Remaining gaps

No baked GI, local reflection probes or AO assets yet. Global sky environment
cannot model wall/leaf occlusion. A future bake needs only a static shell GLB
(walls, slabs, pergola, landscape receivers, no selectable furniture) plus a
lightmap UV2 channel; coordinator integration would load the lightmap texture on
those shell materials and keep dynamic sun/practicals for time-of-day. Materials
and lighting alone cannot supply missing botanical/terrace silhouettes.

## Asset provenance

No acquired third-party assets. Procedural material/light code is original project work. Existing compressed scan assets and their inherited attribution remain unchanged.
