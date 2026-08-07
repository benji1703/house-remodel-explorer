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

## Still required before approval

- A rectified, scaled image of the measured plan.
- Exterior and interior wall thicknesses.
- Complete chained horizontal and vertical dimensions.
- Exact door leaf widths and swing directions.
- Exact window widths, sill heights, and head heights.
- Floor-to-ceiling and structural ceiling heights.
- Any steps or floor-level changes.
- Verified north orientation.
- Confirmation of which partitions are existing, removed, or proposed.

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

### Discrepancy found — needs your decision

The west-side vertical chain reads **830** (not 820) down to the jog, then **380** below it, summing to 1210. `data/house.ts` currently places that jog at `z: 8.2` (820 cm). The plan supports **8.3 m**, a 10 cm difference in where the southwest room's north wall sits relative to the central core.

I have **not** changed `data/house.ts` — this needs your confirmation before promotion, per the audit's no-silent-averaging rule. Options: (a) trust the 830 label and move the jog to 8.3 m, (b) the label is a duplicate/stray annotation and 820 traced from geometry elsewhere is correct, (c) remeasure on site.

### Still genuinely illegible at current scan resolution

- Two short door-width tags near the bathroom/hall openings (partial Hebrew-numeral marks, read as something like "0.7"/"0.8" but not confident enough to record as a value).
- The "10" vs "20" corner marks at the north-extension jambs — likely wall-thickness call-outs, but could also be jamb/reveal marks; can't confirm which without a sharper scan.
- Two site symbols south of the footprint: a circle labeled "ב.ס" and a two-square box labeled "ב.ר" — outside the house outline, probably a pit/meter and a step, not part of the modeled shell. Left out of the overlay entirely rather than guessed.
- North arrow is present (bottom-right, pointing up-left) but its exact bearing relative to true north is not stated on the sheet — orientation is graphic-only, not measured.

A rescan or higher-resolution photo of `measured-plan.jpeg` would resolve all four items above; the current file is too low-resolution (756×676 px) to read them reliably.

## Acceptance rule

No detailed 3D asset, furniture plan, kitchen layout, opening, or appliance placement is considered dimensionally correct until it derives from the approved master overlay.
