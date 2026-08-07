# House Remodel Explorer

An interactive architecture project for documenting and presenting the house remodel in 2D and 3D.

The current application is the geometry-control milestone: it provides a measured-shell audit, selectable zones, an interactive React Three Fiber scene, a 2D fallback, and a strict separation between measured geometry and visual inspiration.

## Source-of-truth rule

The photographed measured plan at `public/references/measured-plan.jpeg` is the only authoritative geometric source.

The other two boards are inspiration only:

- `public/references/outdoor-moodboard.png` — materials and atmosphere;
- `public/references/design-reference.png` — general design language only; its plan and proportions are explicitly rejected.

The geometry in `data/house.ts` is provisional until a dimensioned overlay is reviewed and approved.

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
data/house.ts                Typed provisional geometry ledger
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
- Exact architectural geometry is **not yet approved**.
- Detailed rooms, GLB assets, PBR materials, product hotspots, and before/after models remain future milestones.

See `docs/PROJECT_HANDOFF.md` for the continuation sequence and `docs/GEOMETRY_AUDIT.md` for approval rules.
