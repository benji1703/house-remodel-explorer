import { productReferences, type ProductReference } from "./productReferences";

export type SourcebookScene = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  products: ProductReference[];
};

const byName = (name: string) => productReferences.find((product) => product.name === name)!;

/** House-specific visual studies. Linked products remain the real specification targets. */
export const sourcebookScenes: SourcebookScene[] = [
  {
    eyebrow: "North extension · kitchen",
    title: "Oak, stone, and a quiet working window.",
    description: "A staged view from the living threshold keeps the measured north bay, the 98 cm aisle, and the pale oak / honed travertine language in frame.",
    image: "/references/sourcebook/kitchen.webp",
    alt: "Villa Nehama north extension kitchen with oak cabinetry, travertine island, olive branches and sage window frames",
    products: [byName("Zedra Touch"), byName("BLANCO Silgranit PuraDur"), byName("Custom oak kitchen showroom"), byName("551 Travina")],
  },
  {
    eyebrow: "Service core · ensuite",
    title: "A wet room with one material story.",
    description: "Warm microcement, a floating oak vanity, and restrained chrome sit inside the compact measured room. The pocket door stays clear of the circulation and shower glass.",
    image: "/references/sourcebook/ensuite.webp",
    alt: "Villa Nehama ensuite with warm microcement, oak vanity, vessel basin and sage framed window",
    products: [byName("Essence basin mixer 24174A01"), byName("Essence 60 vessel basin 3960800H"), byName("Grohtherm shower system"), byName("Bau Ceramic wall-hung WC 39427000")],
  },
  {
    eyebrow: "Courtyard · pergola",
    title: "The garden as another room.",
    description: "Olive, carob, mastic, rosemary, sage, and sea lavender are shown at believable mature scale around the travertine steps and timber pergola—no sea view, no anonymous resort planting.",
    image: "/references/sourcebook/terrace-iron.webp",
    alt: "Villa Nehama travertine courtyard with olive tree, mastic, rosemary, sea lavender and a timber pergola",
    products: [byName("Louise wrought-iron garden chair"), byName("CH25 Lounge Chair"), byName("TEXTURE בטון · warm mineral effect")],
  },
];
