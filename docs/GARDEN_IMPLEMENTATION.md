# Garden implementation — 2026-09-13

## Ownership and interface agreed before parallel edits

- Coordinator: shared integration (`MeasuredHouseScene.tsx`, `HouseExplorer.tsx`), comparison cameras/QA harness, final documentation. No architectural data changes.
- Botanical specialist: `scripts/build-landscape.py`, botanical GLBs and generated manifest under `public/models/landscape/`, botanical source/QA notes. Do not alter textures shared with ground specialist.
- Composition specialist: `data/landscape.ts`, `components/landscape/MediterraneanLandscape.tsx`, dedicated ground geometry helpers. Own placement, rocks, soil transitions, selection. Do not edit the botanical pipeline or LightingRig.
- Lighting specialist: `components/scene/LightingRig.tsx`, `data/lighting.ts`, dedicated `lib/landscapeMaterials.ts` and texture resources. Do not edit landscape rendering or botanical pipeline. Report integration calls to composition specialist.

Coordinates: typed landscape proposals use centimetres `[x, elevation, plan z]`; rendering converts to metres and subtracts existing `CX=5.7`, `CZ=6.05`. Blender metres Z-up exports glTF Y-up; preserve exported node transforms. Root sits at local zero. High/light asset suffix convention remains. Stable plant IDs and species IDs remain. Botanical specialist supplies actual exported bounds in centimetres (including foliage), triangle counts and asset byte sizes. Composition validates full transformed extents against architecture and circulation, including explicit vertical envelopes for trained pergola vines.

Quality: high/light profiles retained; Meshopt GLBs and existing Basis/KTX2 loaders retained. Instancing grouped per species/material/variation. Garden remains proposed landscaping with no new approved site limits, grades or architectural dimensions. No deployment.

## Initial impact-ranked reference gaps (source plus original local reference)

1. Close mature olive framing is missing: small evenly branched specimens cannot convey the photograph's heavy irregular trunk and layered silver canopy.
2. Two-row drifts and isolated thin shrubs lack overlapping rounded green/silver masses and foreground depth.
3. Gravel pigment shader suppresses 82% of scan detail; small regular rocks lack weathering and embedded mass.
4. Eye view requires a clear enclosed route, warm direct light and readable pergola patterns. Verify current light in browser; historical notes are not evidence.
5. Preserve actual measured house as background; photograph architecture/site must not be imported.

Baseline and final cameras/performance evidence will be recorded from the actual renderer in `artifacts/garden/`.

## Lighting continuation — 2026-09-13

House practicals are now persistent in design mode. Warm interior pools remain
active in overview, room, and garden cameras, with a higher night contribution;
four low-energy exterior pools cover the west pergola, terrace approach, and
east entries. Daylight still supplies the dominant key, while night removes the
sun contribution without leaving the house black. Verified in the browser at
sun hour 23: interior pendants and the living/kitchen volume remain readable,
and the garden facade and pergola receive restrained warm pools.

## Final browser evidence

At 1440×960 in Chrome 153.0.8010.37 on an Apple M4 Pro, the final garden
composition reports 2,447 draw calls, 13,783,266 triangles, 43 textures and a
7.9 ms median / 9.0 ms p95 synchronous render sample (45 GPU-finished frames).
The denser proposed planting and surface grain raise the total above the
10.7M baseline, while remaining interactive on the validation machine.
Screenshots are in `artifacts/garden/final/`: `hero-wide.png`, `comparison.png`,
`alternate.png`, `top.png`, `room-night.png`, `night-garden.png`, and the exact
reference-size `reference-frame-clean-1583x648.png`. `architecture-before.sha256`
matches the final measured house, terrace, patio, and house data files.
