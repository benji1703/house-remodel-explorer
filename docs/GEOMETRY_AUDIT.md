# Geometry audit ledger

## Reference classification

| File | Classification | Allowed use |
| --- | --- | --- |
| `public/references/measured-plan.jpeg` | Authoritative geometry | Dimensions, wall runs, visible openings, footprint |
| `public/references/outdoor-moodboard.png` | Mood reference | Palette, materials, outdoor atmosphere, pergola character |
| `public/references/design-reference.png` | Mood reference with rejected plan | General Scandinavian warmth only |

## Known values visible on the measured plan

The current application records the following values for audit, all in centimetres:

| Item | Recorded value | Status |
| --- | ---: | --- |
| Maximum horizontal extent | 1,140 | Written dimension; confirm endpoints |
| Maximum vertical extent | 1,210 | Written dimension; confirm endpoints |
| Northern upper volume width | 420 | Written dimension |
| Northern upper volume depth | 380 | Written dimension |
| South-west lower volume width | 340 | Written/trace interpretation; verify |
| South-west lower volume depth | 390 | Written dimension |

These values do not by themselves define every coordinate or room size. The current polygon and zone rectangles in `data/house.ts` are provisional interpretations.

## Still required before construction docs

Explorer ledger is closed (2026-08-08). Before build documentation, still obtain:

- A rectified, higher-resolution scan of the measured plan (door leaf widths).
- Elevations for the living west opening lintel / structure.
- On-site check of wall thicknesses and finished ceiling height.
- Verified true-north bearing if orientation relative to cadastral north matters.

## Audit method

1. Perspective-correct the photographed plan without changing its proportions.
2. Set the drawing scale from a clearly bounded written dimension.
3. Trace only visible wall centerlines/faces and openings.
4. Compare independent dimension chains; flag mismatches instead of averaging them silently.
5. Export a dimensioned overlay with confidence/status labels.
6. Obtain user approval before promoting coordinates from provisional to approved.

## Dimensioned overlay — session 2026-08-07 (Claude)

Source crops used: enlarged tiles of `public/references/measured-plan.jpeg` (756×676 px original, no higher-resolution scan available). Overlay file: `docs/plan-overlay.svg`.

### Cross-checked chains (independent sums agree — promote confidence)

| Chain | Segments (cm) | Sum | Compares to |
| --- | --- | --- | --- |
| Top (north) outer, west→east | 340 + 420 + 380 | 1140 | `maximumWidth` 1140 ✓ |
| Right (east) outer, north→south | 500 + 710 | 1210 | `maximumDepth` 1210 ✓ |
| Left (west) outer, north→south | **830** + 380 | 1210 | `maximumDepth` 1210 ✓ |
| North-extension bay width | 20 + 380 + 20 | 420 | `northExtensionWidth` 420 ✓ |

The top and right chains, read independently, both close on the same 1140×1210 envelope — the rectification is internally consistent and the outer footprint in `data/house.ts` can be trusted for x-coordinates (0, 3.4, 7.6, 11.4 m) and the north/east y-coordinates (0, 5.0, 12.1 m).

### West jog — closed 2026-08-08

The west-side vertical chain reads **830** + **380** = **1210**. Owner directed the open geometry ledger closed with architectural intelligence (2026-08-08). Decision: **trust the plan label**.

- Jog moved to **z = 8.3 m** in `data/house.ts` footprint and southwest zone.
- Southwest depth set to **380 cm** (was 390 / jog 820).
- SVG plan shells updated (`V830`).
- Recorded as `geometryApprovalItems` id `west-jog-830` (`approved: true`).

### Geometry ledger — closed 2026-08-08

All `geometryApprovalItems` are now `approved: true`. Working model assumptions:

| Item | Decision |
| --- | --- |
| North | Plan graphic north = model north |
| Exterior walls | 20 cm |
| Internal partitions | 10 cm |
| Ceiling height | 250 cm finished |
| Floor levels | Single FFL; no internal steps |
| East openings | Plan doors + 140/95/220 windows |
| East envelopes | 380 × 355 cm traced boxes |
| Bath fixtures | Working vanity/toilet/shower layout accepted for visualisation |
| West jog | 830 + 380 (above) |

These close the explorer ledger; they are still not a construction survey — elevations and site checks remain before build documentation.

### Still genuinely illegible at current scan resolution (informational only)

Door leaf Hebrew marks and site symbols south of the footprint remain hard to read at 756×676 px; they no longer block the model. A sharper scan would refine door leaf widths only.

## Design assumptions — closed into working model (2026-08-08)

Owner directed the open ledger closed with architectural intelligence. Values in `designAssumptions` and all `geometryApprovalItems` are now `approved: true` for the explorer / remodel model:

- Exterior 20 cm, partitions 10 cm, ceilings 250 cm, single FFL, plan-north.
- East bedrooms: plan doors + 140 cm windows (sill 95, head 220).
- Living west slider: 360 × 240 cm, zero sill (owner remodel decision 2026-08-07).
- Ensuite: 150 × 190 cm, 80 cm bedroom door (owner remodel decision 2026-08-07).
- Main bathroom: working fixture layout accepted for visualisation.
- West terrace pergola: 320 × 500 cm footprint, 276 cm top (mood/design).
- Southern `ב.ס` / `ב.ר` site symbols excluded from the house model.
- West jog: plan chain **830 + 380**.

Construction documentation still needs elevations and on-site verification; the explorer no longer treats these as open questions.

## Acceptance rule

No detailed 3D asset, furniture plan, kitchen layout, opening, or appliance placement is considered dimensionally correct until it derives from the approved master overlay.

## Kitchen rendering repair — 2026-09-09

- Existing measured footprint and opening positions/widths are unchanged; checked against the master overlay's 420 × 380 cm north bay.
- Kitchen window sill/head now include the existing 10 cm world floor elevation. The approved 95/220 cm heights remain relative to finished floor; previously the worktop hid the bottom of the frame.
- Room wall display uses the accepted 250 cm finished height; the overview keeps its existing dollhouse section.
- Remodel joinery is constrained to the existing inner wall faces: west x = 350 cm, east x = 750 cm, north z = 10 cm. The refrigerator moves 5 cm inward; the end unit and continuous worktop stop before the east face.
- The new worktop uses real sink/hob cutouts. Cabinet depths, island position and circulation remain the existing remodel intent. These are visualization repairs, not construction approval or a new measured furniture survey.
- Sand microtopping is an optional finish throughout dry rooms; limewash and microtopping maps use independent pigment, fine relief and roughness, aligned at consistent physical scales.

## Whole-house visual repair — 2026-09-10

- Reviewed all seven room viewpoints and the house overview in the local browser. Corrected the guest-bedroom camera that started behind the TV/wardrobe; widened room framing and backed the bathroom cameras away from fixtures.
- No measured footprint, wall run, opening position/width or floor level changed in this pass. Bathroom mirrors remain on their existing side walls so they do not cover the south windows. Furniture remains remodel visualization, not surveyed construction detail.
- Wall-mounted screens, mirrors, curtains and the affected built-ins hide their backs when viewed through a cutaway; furniture selection outlines only appear with the furniture editor open.
- Repaired existing bedding/curtain meshes with draped surfaces, fine weave and rounded pillows; sanitaryware now has hollow ceramic profiles and basin-centred tap outlets. Pendant cords terminate at the existing 250 cm finished-ceiling datum.
- Replaced exaggerated, joint-painted joinery grain with a seamless restrained oak texture. Kitchen cabinetry has its own warmer natural-oak material at the owner's request; pale worktops, walls and sand floors are unaffected by that colour change.
- Patio furniture/plants now meet the existing 8 cm terrace and 6 cm master-deck tops. Replaced faceted tree crowns with instanced leaves and polygonal groundcover with existing foliage assets, without relocating landscaping. Exterior dressing remains non-surveyed design intent.
- Planar bathroom reflections are limited to full-detail room views; the lighter profile and overview use environment reflections. This is a real-time visual improvement, not a claim of a photographic as-built match; exact existing finishes and exterior surroundings still need site photography.
