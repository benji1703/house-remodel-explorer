# Project handoff

## Product objective

Create a production-ready interactive website that presents the house remodel as a whole-house overview and as individual room experiences. Visitors should be able to explore 3D scenes, compare before and after states, inspect materials and products, and use the experience on desktop and mobile.

## Chosen architecture

- React + TypeScript for the application;
- React Three Fiber, Three.js, and Drei for browser 3D;
- Zustand for shared viewer state when multi-route scenes are introduced;
- Blender for authoritative detailed modeling;
- glTF/GLB for browser delivery;
- PBR metal/roughness materials;
- per-room lazy loading and separate desktop/mobile quality profiles.

## Current implementation

The current route is a geometry-control interface. It includes:

- an orbitable conceptual shell;
- a clickable vector audit plan;
- six provisional geometry zones;
- a source/status inspector;
- measured-source and mood-reference views;
- high/light rendering modes;
- a lighter mobile and non-WebGL path.

The current shell is not the approved architectural master. It visualizes an initial trace of the photographed plan so uncertainties can be found and resolved.

## Continuation sequence

1. Audit the measured plan and produce a dimensioned 2D master.
2. Ask only for unresolved dimensions that materially affect geometry.
3. Receive explicit approval for the external shell, internal walls, openings, and levels.
4. Rebuild `data/house.ts` from approved coordinates and add regression checks.
5. Create the real-scale Blender master and compare an orthographic export to the approved plan.
6. Export the optimized whole-house overview as GLB.
7. Add the kitchen/living room as the first detailed room route.
8. Add typed material/product/hotspot manifests.
9. Add before/after geometry and material variants.
10. Expand room by room, then perform performance and accessibility QA.

## Definition of the next approval milestone

The geometry audit is complete only when the user has approved:

- outer-wall coordinates and wall thicknesses;
- every interior partition to be retained or changed;
- every door and window position and width;
- floor and ceiling heights;
- any changes in floor level;
- roof/pergola relationship where it affects the model;
- the room-use plan for the remodel.

Do not start photoreal detailed modeling before this milestone.
