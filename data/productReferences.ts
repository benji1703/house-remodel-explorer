import type { MoodBoardId } from "./moodboards";

export type ProductReference = {
  name: string;
  maker: string;
  category: string;
  rooms: MoodBoardId[];
  rationale: string;
  url: string;
};

/** Real, currently manufactured references for specification conversations. */
export const productReferences: ProductReference[] = [
  { name: "IC Lights S1", maker: "Flos · Michael Anastassiades", category: "Pendant", rooms: ["north-extension", "central-core"], rationale: "Opal globe and aged brass suit the kitchen island and low living room ceiling line.", url: "https://flos.com/en/wo/ic-lights-suspension/M-ic-lights-suspension.html?itemListID=ic-lights-us&itemListName=IC+Lights+Family&spareparts=false" },
  { name: "Aged Brass Basin Mixer", maker: "deVOL / Perrin & Rowe", category: "Tapware", rooms: ["north-extension", "service-core", "ensuite"], rationale: "Unlacquered brass develops the patina called for by the oak, stone and bronze palette.", url: "https://www.devolkitchens.co.uk/shop/bathrooms/aged-brass-basin-mixer-tap" },
  { name: "551 Travina", maker: "Caesarstone", category: "Porcelain surface", rooms: ["north-extension", "service-core", "ensuite"], rationale: "Fine beige layering and 20 mm availability make it a credible honed-stone reference at this scale.", url: "https://www.caesarstone.com/color-catalog/551-travina/" },
  { name: "CH25 Lounge Chair", maker: "Carl Hansen & Søn · Hans J. Wegner", category: "Lounge chair", rooms: ["central-core", "southwest-room", "east-upper-room"], rationale: "Oak and hand-woven paper cord reinforce the quiet, collected old-money language.", url: "https://www.carlhansen.com/en/en/collection/chairs/lounge-chairs/ch25" },
  { name: "Plein Air Chair", maker: "Fermob", category: "Outdoor dining", rooms: ["terrace"], rationale: "A durable, stackable outdoor chair keeps the four-seat pergola arrangement light and serviceable.", url: "https://www.fermob.com/us/collections/plein-air.html" },
  { name: "Finley Ceramic Lamp", maker: "Porta Romana", category: "Table lamp", rooms: ["southwest-room", "east-upper-room", "east-lower-room"], rationale: "Hand-cast ceramic with natural linen shade adds tactile bedside weight without visual noise.", url: "https://portaromana.com/products/finley_ceramic_lamp" },
];
