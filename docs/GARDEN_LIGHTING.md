# Garden lighting and mineral materials — 2026-09-13

Original local references inspected: `plants-beit-hananiah-hero.webp`,
`outdoor-moodboard.png`, and the existing gravel/bark JPG source maps. Baseline
renderer image: `artifacts/garden/before/hero.png`. The primary photograph has
warm direct sunlight, neutral mineral shadows, visibly shaded foliage interiors
and a blue sky. The moodboard's dusk exposure is secondary to the daylight hero.

## Implemented policy

- `cameraMode="garden"` has a stronger directional key and lower neutral sky,
  environment and ambient fill. This recovers leaf/branch depth and pergola
  stripes without changing room lighting or the existing sun path. No extra
  continuous rendering pass, light or post-processing effect was introduced.
- A display-referred blue/haze sky is limited to the garden; the neutral
  hemisphere stays independent so pale gravel does not acquire blue fill.
- Garden contact shadows sit 2 mm above the existing proposed gravel datum
  (−3.5 cm), rather than above the interior finished floor. Coverage is 2800 cm,
  far range 135 cm, with 768 desktop / 256 light resolution. The snapshot is
  invalidated when suspended asset loading completes and when quality changes.
  These are presentation dimensions, not approved site measurements.
- The existing 2048 desktop directional map and disabled mobile directional
  shadow map remain. Garden normal bias is reduced to 1.2 cm to reduce detached
  contacts. Sun-hour changes refresh the environment snapshot.
- `lib/landscapeMaterials.ts` retains the original compressed gravel map family
  and its physical tile, re-mapping scan luminance to pale limestone while
  keeping crevices and grain. Low-frequency pigment modulation hides repetition.
  Rock materials use world-space mineral noise, sparse pits and sediment bands;
  they work on UV-less instanced meshes at a consistent grain scale.

## Integration and source ownership

The composition renderer owns texture clones, repeat/anisotropy and disposal;
`createGravelMaterial(maps)` consumes color/normal/roughness in that order.
`createLimestoneMaterial()` needs no texture or external dependency. Both return
caller-owned `MeshStandardMaterial` instances, to be memoized and disposed.

The GLSL material helpers are original deterministic project code. No new
third-party asset was acquired. Existing JPG/KTX2 scans are unchanged; their
inherited source record is `public/ASSET_SOURCES.md` (it describes project-prepared
maps but does not name an original scan provider). No stronger license claim is
made here.

## Validation

Owned TypeScript files pass targeted ESLint. Final integrated browser captures,
frame measurements and whole-project lint/build are recorded by the coordinator
in the garden implementation/validation notes. The baseline shows broad flat
mineral patches and thin foliage; material and light changes alone cannot correct
the photographic density or plant silhouettes, which are owned by the botanical
and composition specialists.

Intermediate live-render capture `artifacts/garden/lighting-wip/hero.png` was
visually inspected after the lighting change. Pergola stripes are clearer,
the sky reads blue and the interior remains legible without clipped pale walls.
Ground and botanical meshes in that capture were still the old versions, so
their flat regions and thin foliage were not used to tune final exposure.
Coordinator measured median 7.7 ms / p95 10.9 ms for synchronous render + GPU
finish there; this is an intermediate mixed scene and not a controlled lighting
benchmark. The final comparison must use the integrated assets and same camera.
