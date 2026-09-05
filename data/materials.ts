import type { MoodBoardId } from "./moodboards";

export type MaterialCard = {
  id: string;
  family: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  specification: string;
  finish: string;
  format: "portrait" | "landscape" | "square" | "tall";
  moods: MoodBoardId[];
};

export const materialCards: MaterialCard[] = [
  {
    id: "oak-parquet",
    family: "Floor",
    title: "Select oak fishbone",
    description: "A real PBR parquet surface: narrow boards, visible grain and quiet joints that catch grazing light without reading as stripes.",
    image: "/textures/luxury-oak-fishbone.png",
    alt: "Natural oak herringbone parquet texture",
    specification: "40 × 8 cm visual scale",
    finish: "Matte hardwax oil",
    format: "landscape",
    moods: ["north-extension", "central-core", "southwest-room", "east-upper-room", "east-lower-room"],
  },
  {
    id: "lime-plaster",
    family: "Walls",
    title: "Layered lime wash",
    description: "Hand-applied mineral variation softens the measured shell. It should bloom in side light, never look mottled or theatrical.",
    image: "/textures/lime-plaster-ai.jpg",
    alt: "Warm lime wash plaster surface",
    specification: "Warm ivory mineral base",
    finish: "Clouded hand brush",
    format: "portrait",
    moods: ["north-extension", "central-core", "southwest-room", "east-upper-room", "east-lower-room", "service-core", "ensuite", "openings"],
  },
  {
    id: "travertine",
    family: "Worktops",
    title: "Honed pale travertine",
    description: "Filled pores and a dry, velvety reflection keep the kitchen worktop tactile while the integrated sink stays visually calm.",
    image: "/references/moods/mood-kitchen-detail.jpeg",
    alt: "Close detail of pale travertine meeting oak",
    specification: "20 mm eased edge",
    finish: "Honed and sealed",
    format: "tall",
    moods: ["north-extension", "service-core", "ensuite"],
  },
  {
    id: "cabinet-oak",
    family: "Joinery",
    title: "Quarter-cut oak",
    description: "Continuous pale grain across integrated cabinet fronts, with narrow shadow gaps and low-sheen protection.",
    image: "/textures/light-oak-ai.jpg",
    alt: "Pale quarter-cut oak grain",
    specification: "Book-matched fronts",
    finish: "Natural matte oil",
    format: "square",
    moods: ["north-extension", "southwest-room", "east-upper-room", "east-lower-room", "service-core", "ensuite"],
  },
  {
    id: "parquet-depth",
    family: "Render layer",
    title: "Depth without outlines",
    description: "Ambient occlusion, surface normals and roughness describe the tiny board joints and grain. Light—not drawn borders—reveals the pattern.",
    image: "/textures/herringbone-parquet-ao-2k.jpg",
    alt: "Ambient occlusion layer for oak herringbone parquet",
    specification: "Aligned 2K PBR maps",
    finish: "Physically based response",
    format: "landscape",
    moods: ["north-extension", "central-core", "southwest-room", "east-upper-room", "east-lower-room"],
  },
  {
    id: "linen",
    family: "Textile",
    title: "Washed Belgian linen",
    description: "Loose fibres, softened creases and a warm chalk tone give upholstered pieces the visual depth missing from flat colour materials.",
    image: "/references/moods/mood-bedroom-detail.jpeg",
    alt: "Washed linen and pale oak bedroom detail",
    specification: "Heavy natural weave",
    finish: "Stone-washed",
    format: "portrait",
    moods: ["central-core", "southwest-room", "east-upper-room", "east-lower-room"],
  },
  {
    id: "microcement",
    family: "Wet rooms",
    title: "Warm microcement",
    description: "Fine aggregate and subtle trowel movement form one continuous wet-room envelope with no decorative tile grid.",
    image: "/references/moods/mood-bath-detail.jpeg",
    alt: "Warm microcement surface detail",
    specification: "Continuous 3 mm system",
    finish: "Matte mineral sealer",
    format: "landscape",
    moods: ["service-core", "ensuite", "east-lower-room"],
  },
  {
    id: "sage-metal",
    family: "Openings",
    title: "Soft sage aluminium",
    description: "A desaturated green frame holds the Belgian proportions without becoming a graphic outline against the plaster.",
    image: "/references/moods/mood-openings-11.jpeg",
    alt: "Sage aluminium window mullion in daylight",
    specification: "Fine Belgian profile",
    finish: "Low-gloss powder coat",
    format: "tall",
    moods: ["openings", "north-extension", "central-core", "southwest-room", "east-upper-room", "east-lower-room", "service-core"],
  },
  {
    id: "jerusalem-stone",
    family: "Exterior",
    title: "Jerusalem limestone",
    description: "Quiet fossil movement and softened tonal shifts ground the exterior terraces in local stone rather than generic concrete.",
    image: "/textures/jerusalem-stone-ai.jpg",
    alt: "Pale Jerusalem limestone texture",
    specification: "Large random lengths",
    finish: "Honed, brushed outdoors",
    format: "square",
    moods: ["terrace", "openings"],
  },
  {
    id: "terracotta",
    family: "Garden",
    title: "Hand-thrown terracotta",
    description: "Mineral bloom, firing variation and softened rims make the garden vessels feel collected rather than duplicated props.",
    image: "/references/moods/mood-terrace-08.jpeg",
    alt: "Clay planter on a shaded terrace",
    specification: "Mixed handmade vessels",
    finish: "Unsealed natural clay",
    format: "portrait",
    moods: ["terrace", "southwest-room"],
  },
  {
    id: "botanical-layer",
    family: "Planting",
    title: "Myrtle and jasmine",
    description: "Small-leaf evergreen volume with restrained white flowering, layered from crossed foliage cards instead of repeating low bedding plants on the pergola.",
    image: "/textures/jasmine-foliage.png",
    alt: "Star jasmine foliage with small white flowers",
    specification: "Jasmine climber + myrtle shrub layer",
    finish: "Natural seasonal variation",
    format: "landscape",
    moods: ["terrace", "north-extension", "central-core", "southwest-room"],
  },
  {
    id: "evergreen-myrtle",
    family: "Planting",
    title: "Evergreen myrtle",
    description: "Dense, irregular branching and fine Mediterranean leaves create a quiet evergreen layer without the synthetic symmetry of decorative houseplants.",
    image: "/textures/myrtle-foliage.png",
    alt: "Natural Mediterranean myrtle foliage",
    specification: "Mixed-height clustered planting",
    finish: "Living matte foliage",
    format: "portrait",
    moods: ["terrace", "north-extension", "central-core", "southwest-room", "east-upper-room"],
  },
];

export function materialsForMood(id: MoodBoardId, limit = 4) {
  return materialCards.filter((material) => material.moods.includes(id)).slice(0, limit);
}
