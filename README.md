# House Remodel Explorer

An interactive architecture project for documenting and presenting the house remodel in 2D and 3D.

The current application is the geometry-control milestone: it provides a measured-shell audit, selectable zones, an interactive React Three Fiber scene, a 2D fallback, and a strict separation between measured geometry and visual inspiration.

## Source-of-truth rule

The photographed measured plan at `public/references/measured-plan.jpeg` is the only authoritative geometric source.

The other two boards are inspiration only:

- `public/references/outdoor-moodboard.png` — materials and atmosphere;
- `public/references/design-reference.png` — general design language only; its plan and proportions are explicitly rejected.

The outer footprint in `data/house.ts` is cross-checked against two independent dimension chains on the measured plan (see `docs/GEOMETRY_AUDIT.md`), but wall thickness, most openings, ceiling heights, and one footprint jog are still unconfirmed. A first-pass detailed 3D rendering now exists on top of that provisional shell, using explicit `designAssumptions` (wall thickness, ceiling height, opening sizes) that are design proposals, not measurements — see `docs/GEOMETRY_AUDIT.md` for exactly what is and isn't approved.

## Open this as a Codex project

1. Download and unzip the project folder.
2. Open the ChatGPT desktop app and switch to **Codex**.
3. Choose **Add new project** or **Open folder**.
4. Select the unzipped `house-remodel-explorer` folder and make it the primary folder.
5. Start a new Codex chat with: `Read AGENTS.md and continue the geometry-audit milestone.`

Codex automatically reads the repository-level `AGENTS.md`, so the measured-plan constraints carry into every new project chat.

## Local development

Requirements:

- Node.js 22.13 or newer;
- npm 10 or newer.

Install and start:

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build:local
```

`npm run build:local` is the portable macOS/local check. The Sites checkpoint workflow uses `npm run build`, which intentionally expects GNU `timeout` in its Linux environment.

## Project structure

```text
app/                         Routes, metadata, and global styles
components/                  2D/3D explorer components
data/house.ts                Typed geometry ledger and design assumptions
docs/                        Handoff and geometry-audit documentation
public/references/           Architectural source and visual references
AGENTS.md                    Durable Codex project instructions
.openai/hosting.json         Existing Sites project identity
```

## Current status

- Existing site source recovered and versioned.
- Interactive 3D shell and plan audit implemented.
- Desktop/mobile quality selection implemented.
- WebGL fallback implemented.
- Exact architectural geometry is **not yet fully approved** (see `docs/GEOMETRY_AUDIT.md`); a first-pass 3D rendering exists on provisional design assumptions.
- Detailed rooms, GLB assets, PBR materials, product hotspots, and before/after models remain future milestones.

See `docs/PROJECT_HANDOFF.md` for the continuation sequence and `docs/GEOMETRY_AUDIT.md` for approval rules.

## First-person walkthrough

Choose **Explore** in the House toolbar (also under Controls → Camera).
Use **WASD** to move, **arrow keys** to walk/turn, and **drag** to look around.
The on-screen pad supports touch and keyboard activation; on desktop, choose **Movement pad** to show it. Select a room to start
there, use **Reset position** if needed, and **Back to house** to return to orbit.
Escape releases keyboard focus. Movement stops when the viewer loses focus.

Walk mode stays within the existing house floor, with full-height walls and a
ceiling at the model's accepted height. Open doors permit passage; walls, closed
doors block movement. Furniture is passable at normal eye height for free FPS exploration. **With finishes** renders the existing
mood-image materials; **Survey shell** shows the neutral model. The light quality
profile and non-WebGL Plan fallback remain available.

Walkthrough checks (browser check needs a running development server):

```bash
node scripts/verify-walk-collision.mjs
PLAYWRIGHT_MODULE=/path/to/playwright node scripts/verify-walkthrough.mjs
```

The default **Soft daylight** scene pairs pale beige limewash and microcement
with broad interior bounce. Controls also offers **Golden hour** and **Evening
glow**; the time slider and house-light switch remain independently adjustable.
