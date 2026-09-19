# Terrace render checkpoint

## 2026-09-14 — usable first increment

The terrace dining set now uses dedicated authored geometry in `components/rooms/Terrace.tsx`: a substantial rounded stone pedestal and plinth, softened stone slab, four iron framed chairs with separate pale cushions, back rails, legs, and arm loops. Approved extents remain the existing 160 × 85 × 75 cm dining set and existing 320 × 500 × 276 cm pergola; no footprint, roof, slat count, or openings were changed. The existing `EditableFurniture` wrapper and `terrace-dining-set` ID remain intact, so selection, editing scale, and quality visibility continue through the current route.

Materials are isolated in `components/rooms/terraceMaterials.ts` and dimensions in `data/terraceFurniture.ts`; the materials use MeshPhysicalMaterial with metallic iron, rough stone, pale textile sheen, and warm timber response. `scripts/build-terrace-furniture.py` emits a valid `public/models/terrace/terrace-dining-preview.glb` pipeline preview and records the Blender export boundary. The bundled `/tmp/house-landscape-bpy/bin/python` currently exits during `bpy`/USD startup on this macOS host, so the detailed live asset is authored directly in the typed R3F source while the script is ready for a Blender bake when the runtime is repaired.

## Source / licensing

The silhouette and material direction are an original interpretation of `public/references/sourcebook/terrace-iron.webp` and `artifacts/garden/final/hero-wide.png`; no external mesh or texture was sourced. Reference images remain visual-only and are not redistributed into the asset.

## Coordinator integration

No shared furniture, palette, lighting, or scene files were edited. Coordinator should verify the terrace route and optionally replace the preview GLB with a Blender export once `bpy` is operational; the R3F implementation is usable immediately.
