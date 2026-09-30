# Interior styling and opening fit

The measured architectural data is unchanged. This pass repairs renderer gaps
and adds a proposed interior styling layer from the existing mood artifact.

- `living.png`, `kitchen.png`, `master.png`: desktop room views.
- `living-light.png`, `mobile-kitchen.png`: simplified rendering.
- `orthographic.png`, `measured-overlay.png`, `source-overlay.svg`: plan review.
- `verification.json`: frame contact, prop loading and furniture-edit regression.
- `assets.json`: Meshopt asset sizes, bounds and triangle counts (high and light).
- `camera/report.json`: keyboard, reduced-motion and camera navigation checks.

Rebuild the assets using Blender or a Python environment with `bpy`:

```sh
python scripts/build-interior-mood.py
MOOD_ASSET_TOOLS=/path/to/node_modules node scripts/pack-interior-mood.mjs
```

The external asset tools are `@gltf-transform/core`, `@gltf-transform/extensions`,
`@gltf-transform/functions` and `meshoptimizer`. They are authoring tools and do
not add dependencies to the shipped application. Existing mood photographs
supply the shared oak/linen finish detail; no new raster texture payload is added.

With the local development server running:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright node scripts/verify-interior-styling.mjs
```
