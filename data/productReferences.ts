import type { MoodBoardId } from "./moodboards";

export type ProductReference = {
  name: string;
  maker: string;
  category: string;
  rooms: MoodBoardId[];
  rationale: string;
  url: string;
};

/** Real references from Israeli manufacturer/distributor sites for specification conversations. */
export const productReferences: ProductReference[] = [
  { name: "Essence basin mixer 24174A01", maker: "GROHE Israel", category: "Sanitary · basin tap", rooms: ["service-core", "ensuite"], rationale: "The tall swivel spout and Hard Graphite finish give the vanity a quiet, architectural focal point; confirm the local finish sample before ordering.", url: "https://www.grohe.co.il/he_il/essence-new-1-2-l-24174A01.html" },
  { name: "Essence 60 vessel basin", maker: "GROHE Israel", category: "Sanitary · basin", rooms: ["service-core", "ensuite"], rationale: "A restrained vessel basin pairs with the oak vanity and leaves the wall finish visible around the mirror.", url: "https://www.grohe.co.il/he_il/essence-60-3960800H.html" },
  { name: "Grohtherm shower system", maker: "GROHE Israel", category: "Sanitary · shower", rooms: ["service-core", "ensuite"], rationale: "Thermostatic control and a restrained rain head suit the warm microcement wet rooms while improving everyday comfort and safety.", url: "https://www.grohe.co.il/he_il/for-your-bathroom/collections/shower-systems/shower-systems.html" },
  { name: "Arena Cosmopolitan", maker: "GROHE Israel", category: "Sanitary · WC", rooms: ["service-core", "ensuite"], rationale: "Use the coordinated wall-hung WC family to keep the compact bathroom visually calm and easy to clean.", url: "https://www.grohe.co.il/he_il/for-your-bathroom/wc-collections/arena-cosmopolitan.html" },
  { name: "Zedra Touch", maker: "GROHE Israel", category: "Kitchen · tap", rooms: ["north-extension"], rationale: "Touch control and a pull-out spray keep the oak kitchen practical without adding visual clutter at the sink.", url: "https://www.grohe.co.il/he_il/for-your-kitchen/collections/tapware/zedra-touch.html" },
  { name: "BLANCO Silgranit PuraDur", maker: "NIGÀ Israel", category: "Kitchen · sink", rooms: ["north-extension"], rationale: "A non-porous, durable sink in a warm neutral tone will sit quietly under the honed travertine worktop; verify cabinet minimum and cut-out locally.", url: "https://www.nyga.co.il/brand/blanco/" },
  { name: "Custom oak kitchen showroom", maker: "Regba Kitchens · Israel", category: "Kitchen · cabinetry", rooms: ["north-extension"], rationale: "Use a local design studio to resolve the measured window, 98 cm aisle and restrained pale-oak fronts before fabrication.", url: "https://www.regba.co.il/" },
  { name: "TEXTURE בטון · warm mineral effect", maker: "Tambour · Israel", category: "Interior wall finish", rooms: ["north-extension", "central-core", "service-core", "ensuite"], rationale: "Specify a warm sand/travertine tint and a low-sheen hand-applied texture: the wall should read mineral and softly varied, never green or glossy.", url: "https://tambour.co.il/product/texture-%D7%91%D7%98%D7%95%D7%9F/" },
  { name: "IC Lights S1", maker: "Flos · Michael Anastassiades", category: "Pendant", rooms: ["north-extension", "central-core"], rationale: "Opal globe and aged brass suit the kitchen island and low living room ceiling line.", url: "https://flos.com/en/wo/ic-lights-suspension/M-ic-lights-suspension.html?itemListID=ic-lights-us&itemListName=IC+Lights+Family&spareparts=false" },
  { name: "551 Travina", maker: "Caesarstone", category: "Porcelain surface", rooms: ["north-extension", "service-core", "ensuite"], rationale: "Fine beige layering and 20 mm availability make it a credible honed-stone reference at this scale.", url: "https://www.caesarstone.com/color-catalog/551-travina/" },
  { name: "CH25 Lounge Chair", maker: "Carl Hansen & Søn · Hans J. Wegner", category: "Lounge chair", rooms: ["central-core", "southwest-room", "east-upper-room"], rationale: "Oak and hand-woven paper cord reinforce the quiet, collected old-money language.", url: "https://www.carlhansen.com/en/en/collection/chairs/lounge-chairs/ch25" },
  { name: "Plein Air Chair", maker: "Fermob", category: "Outdoor dining", rooms: ["terrace"], rationale: "A durable, stackable outdoor chair keeps the four-seat pergola arrangement light and serviceable.", url: "https://www.fermob.com/us/collections/plein-air.html" },
  { name: "Finley Ceramic Lamp", maker: "Porta Romana", category: "Table lamp", rooms: ["southwest-room", "east-upper-room", "east-lower-room"], rationale: "Hand-cast ceramic with natural linen shade adds tactile bedside weight without visual noise.", url: "https://portaromana.com/products/finley_ceramic_lamp" },
];
