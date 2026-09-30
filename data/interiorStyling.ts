/** Proposed removable styling, referenced to the mood artifact, never survey geometry.
 * Assets are authored from Blender or the procedural Three.js builder; placements/dimensions here are centimetres.
 * Furniture-supported props live inside their owner's editable transform.
 */
export type InteriorAssetSpec = {
  label: string;
  reference: string;
  detailOnly?: boolean;
};
export const interiorAssets = {
  'linen-lounge-chair': { label: 'Curved linen lounge chair with oak feet', reference: 'mood-living-improved.png' },
  'oak-coffee-table': { label: 'Solid oak coffee table with slab legs', reference: 'mood-living-18.jpeg' },
  'tailored-linen-sofa': { label: 'Tailored linen sofa with separate seat cushions and stitched edges', reference: 'mood-living-08.jpeg' },
  'sofa-linen': { label: 'Sage cushions and a relaxed linen throw', reference: 'mood-living-08.jpeg' },
  'coffee-still-life': { label: 'Art books, olive branches and stoneware', reference: 'mood-living-18.jpeg', detailOnly: true },
  'kitchen-preparation': { label: 'Oak board, sourdough, linen and breakfast ceramics', reference: 'mood-kitchen-improved.png', detailOnly: true },
  'kitchen-herbs': { label: 'Kitchen herbs in hand-thrown terracotta', reference: 'mood-kitchen-improved.png', detailOnly: true },
  'bed-linen': { label: 'Layered linen runner and sage lumbar cushion', reference: 'mood-master-15.jpeg' },
  'bedside-reading': { label: 'Bedside books and a ceramic dish', reference: 'mood-master-12.jpeg', detailOnly: true },
  'bath-linen': { label: 'Folded cotton towels', reference: 'mood-bath-detail.jpeg', detailOnly: true },
  'living-rug': { label: 'Bound handwoven wool rug', reference: 'mood-living-18.jpeg' },
  'reading-lamp': { label: 'Pleated linen reading lamp with turned oak stem', reference: 'mood-master-12.jpeg' },
  'oak-counter-stool': { label: 'Sculpted oak counter stool with woven seat', reference: 'mood-kitchen-06.jpeg' },
} as const satisfies Record<string, InteriorAssetSpec>;
export type InteriorAssetId = keyof typeof interiorAssets;

export const interiorStyling = {
  livingRug: { xCm: 540, zCm: 615 },
  readingLamp: { xCm: 380, zCm: 756 },
  kitchenPreparation: { xCm: 535, zCm: 242, heightCm: 97.5 },
  kitchenHerbs: { xCm: 593, zCm: 28, heightCm: 94.5 },
  bathroomTowels: { xCm: 650, zCm: 1164, heightCm: 75.5 },
  bedsideBooksOffset: { xCm: 11, zCm: -9 },
} as const;
