# House Remodel Explorer — Codex instructions

## Coordination note (read first)

A parallel Claude session worked the dimensioned-overlay milestone on 2026-08-07 (same working tree, no branch/worktree split). It:

- Added a "Dimensioned overlay — session 2026-08-07" section to `docs/GEOMETRY_AUDIT.md` with cross-checked dimension chains and one flagged discrepancy (west jog: plan reads 830, `data/house.ts` has 820 — unresolved, needs user decision).
- Added `docs/plan-overlay.svg`, a traced overlay covering only cross-checked geometry (outer envelope + north-extension bay opening). Does not cover interior partitions beyond that.
- Did **not** modify `data/house.ts` — still provisional, per the acceptance rule below.
- Left several items explicitly unresolved (door widths, 10 vs 20 corner marks, site symbols south of the footprint, true-north bearing) because the source scan (756×676px) is too low-res to read them reliably — see the doc for the full list.

If you pick up the next step in the continuation sequence, read that section first to avoid re-deriving or contradicting it.

## Project goal

Build a production-quality, browser-based architectural remodel explorer with:

- a whole-house overview;
- room-by-room navigation;
- orbit, pan, and zoom in 3D;
- before/after states;
- clickable finishes, fixtures, and products;
- a lighter mobile experience than desktop;
- an accessible 2D/non-WebGL fallback.

## Non-negotiable geometry rules

- `public/references/measured-plan.jpeg` is the only authoritative source for walls, footprint, openings, and dimensions.
- `public/references/design-reference.png` and `public/references/outdoor-moodboard.png` are visual references only. Never copy their footprint, room layout, dimensions, openings, roof, furniture positions, or proportions.
- Use centimetres for approved architectural dimensions. Convert to metres only at the 3D rendering boundary.
- Do not invent or silently infer missing dimensions, doors, windows, wall thicknesses, or ceiling heights.
- Mark uncertain geometry as provisional and request confirmation before treating it as approved.
- The geometry currently encoded in `data/house.ts` is a first audit trace, not an approved final model.
- Validate every geometry revision with an orthographic top-view overlay against the measured plan before creating detailed room scenes.
- Do not extend, straighten, or cross the measured wall envelope without explicit user approval.

## Modeling and asset conventions

- Author detailed geometry in Blender at real scale, then export web assets as GLB/glTF.
- Keep the structural shell, room collections, furniture, and before/after geometry separate.
- Give selectable meshes stable IDs that map to typed specification records.
- Split large assets by room and lazy-load them.
- Use Meshopt for geometry and KTX2/Basis for PBR textures when the asset pipeline is introduced.
- Prefer baked lighting and restrained post-processing over many real-time lights.
- Provide desktop and mobile quality profiles.

## Engineering expectations

- Use TypeScript and preserve the React/React Three Fiber architecture.
- Keep architectural data in typed files under `data/`; avoid burying measurements in JSX.
- Keep shared viewer behavior reusable across room routes.
- Preserve keyboard, touch, reduced-motion, and WebGL fallback behavior.
- Run `npm run lint` and `npm run build:local` after meaningful local source changes. The hosted Sites workflow uses `npm run build`.
- Do not deploy unless the user explicitly asks to publish or confirms a deployment checkpoint.

## Immediate next milestone

Produce a dimensioned 2D master/overlay from the measured plan. Resolve ambiguous wall runs, openings, wall thicknesses, ceiling heights, floor levels, and north orientation before building the kitchen/living room model.
