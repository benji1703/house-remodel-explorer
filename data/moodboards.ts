import type { ZoneId } from "./house";

export type MoodBoardId = ZoneId | "terrace" | "openings";

export type MoodImage = {
  src: string;
  alt: string;
  caption: string;
};

export type RoomMoodBoard = {
  id: MoodBoardId;
  label: string;
  shortLabel: string;
  atmosphere: string;
  finishes: string[];
  images: MoodImage[];
};

const img = (src: string, caption: string, alt: string): MoodImage => ({ src, alt, caption });

/**
 * Atmosphere references only — never geometry.
 * Palette: lime-wash plaster, microcement, light oak, Belgian fenestration in sage (#b8c9a8).
 * Caption rule: noun of what’s seen (1–2 words). Alt: place + material or light — no vibe adjectives.
 */
export const roomMoodBoards: RoomMoodBoard[] = [
  {
    id: "north-extension",
    label: "Kitchen",
    shortLabel: "K",
    atmosphere: "Oak run and honed travertine; east light, north bay. Threshold to living stays open.",
    finishes: ["European oak", "Honed travertine", "Belgian frames", "Lime-wash plaster"],
    images: [
      img(
        "/references/moods/mood-kitchen-improved.png",
        "Preparation",
        "Kitchen prep island with oak cabinetry and limestone surfaces",
      ),
      img("/references/moods/mood-kitchen.jpeg", "Dusk", "Kitchen oak cabinetry in low light"),
      img("/references/moods/mood-kitchen-detail.jpeg", "Grain", "Oak and travertine join"),
      img("/references/moods/mood-kitchen-03.jpeg", "Island", "Kitchen island under east window light"),
      img("/references/moods/mood-kitchen-04.jpeg", "Threshold", "Kitchen opening toward living"),
      img("/references/moods/mood-kitchen-05.jpeg", "Face", "Oak cabinet face and stone counter"),
      img("/references/moods/mood-kitchen-06.jpeg", "Bar", "Breakfast bar in morning light"),
      img("/references/moods/mood-kitchen-07.jpeg", "Pendant", "Pendant over the island"),
      img("/references/moods/mood-kitchen-08.jpeg", "Basin", "Stone sink beside the window"),
      img("/references/moods/mood-kitchen-09.jpeg", "Enfilade", "Kitchen flowing into living"),
      img("/references/moods/mood-kitchen-10.jpeg", "Olive", "Kitchen corner with olive branch"),
      img("/references/moods/mood-kitchen-11.jpeg", "Run", "Kitchen oak cabinetry in east light"),
      img("/references/moods/mood-kitchen-12.jpeg", "Travertine", "Kitchen travertine worktop in window light"),
      img("/references/moods/mood-kitchen-13.jpeg", "Reveal", "Kitchen plaster reveal in north light"),
      img("/references/moods/mood-kitchen-14.jpeg", "Toe Kick", "Kitchen oak base units in floor light"),
      img("/references/moods/mood-kitchen-15.jpeg", "Ledge", "Kitchen travertine ledge in east light"),
      img("/references/moods/mood-kitchen-16.jpeg", "Joinery", "Kitchen oak joinery in natural light"),
      img("/references/moods/mood-kitchen-17.jpeg", "Shadow", "Kitchen plaster wall in east shadow"),
      img("/references/moods/mood-kitchen-18.jpeg", "Shelf", "Kitchen oak shelf in north light"),
      img("/references/moods/mood-kitchen-19.jpeg", "Passage", "Kitchen passage with oak and plaster"),
      img("/references/moods/mood-kitchen-20.jpeg", "Patina", "Kitchen travertine and oak in soft light"),
    ],
  },
  {
    id: "central-core",
    label: "Living",
    shortLabel: "LR",
    atmosphere: "Low furniture, west glass to the terrace. Lime-wash and microcement carry the volume.",
    finishes: ["Microcement", "Wool upholstery", "West glazing", "Lime-wash plaster"],
    images: [
      img("/references/moods/mood-living-03.jpeg", "Terrace doors", "Low linen seating beside sage framed terrace doors"),
      img("/references/moods/mood-living-08.jpeg", "Upholstery", "Linen upholstery, a sage cushion and an oak coffee table"),
      img("/references/moods/mood-living-improved.png", "Reading", "Linen reading chair, timber bookcase and plaster hearth"),
      img("/references/moods/mood-living-12.jpeg", "Console", "Oak console against lime-wash plaster beside linen curtains"),
      img("/references/moods/mood-living-13.jpeg", "Curtain", "Linen curtain beside glazing and a timber pergola"),
      img("/references/moods/mood-living-14.jpeg", "Plaster", "Sunlight across lime-wash plaster and a timber skirting"),
      img("/references/moods/mood-living-18.jpeg", "Rug", "Woven rug beneath an oak coffee table and linen seating"),
      img("/references/moods/mood-living-09.jpeg", "Chair", "Timber and woven lounge chair beside sage plaster and glazing"),
    ],
  },
  {
    id: "terrace",
    label: "Terrace",
    shortLabel: "T",
    atmosphere: "Pergola, vine, shade for table. House returns through painted doors.",
    finishes: ["Timber pergola", "Climbing vine", "Painted doors", "Clay planters"],
    images: [
      img("/references/moods/mood-terrace-13.jpeg", "Dining", "Four-seat timber dining table beneath a vine-covered pergola"),
      img("/references/moods/mood-terrace-detail.jpeg", "Beam", "Weathered timber pergola joint wrapped in climbing vine"),
      img("/references/moods/mood-terrace-05.jpeg", "Climber", "Climbing flowers beside a timber post and sage shutters"),
      img("/references/moods/mood-terrace-08.jpeg", "Planter", "Weathered ceramic planter beside sage louvred shutters"),
      img("/references/moods/mood-terrace-14.jpeg", "Paving", "Dappled vine shadows across pale stone terrace paving"),
      img("/references/moods/mood-terrace-18.jpeg", "Canopy", "Vine canopy and timber beams above sage framed glazing"),
      img("/references/moods/mood-terrace-improved.png", "Table setting", "Linen and ceramic table setting beneath a vine pergola"),
      img("/references/moods/mood-terrace-20.jpeg", "Dusk", "Timber dining table and clay planter under a pergola at dusk"),
    ],
  },
  {
    id: "southwest-room",
    label: "Master bedroom",
    shortLabel: "BR",
    atmosphere: "Linen and pale oak; west exit to the private court.",
    finishes: ["Washed linen", "Oak bedside", "West exit", "Lime-wash plaster"],
    images: [
      img("/references/moods/mood-master-11.jpeg", "Bed", "Linen double bed with oak bedside tables and plaster walls"),
      img("/references/moods/mood-master-improved.png", "Dressing", "Oak wardrobe and a dressing niche beside a linen bed"),
      img("/references/moods/mood-master-08.jpeg", "Headboard", "Oak headboard and linen bedding against textured plaster"),
      img("/references/moods/mood-master-12.jpeg", "Bedside", "Oak bedside drawer and a ceramic lamp with a linen shade"),
      img("/references/moods/mood-master-13.jpeg", "Drapery", "Linen curtains beside a glazed garden door"),
      img("/references/moods/mood-master-15.jpeg", "Bedding", "Layered linen bedding and an oak bedside table"),
      img("/references/moods/mood-master-18.jpeg", "Sconce", "Plaster wall sconce above an oak bedside table"),
      img("/references/moods/mood-master-19.jpeg", "Dresser", "Oak chest of drawers against lime-wash plaster"),
    ],
  },
  {
    id: "east-upper-room",
    label: "Guest bedroom",
    shortLabel: "E1",
    atmosphere: "Bed, chair, Belgian window. Floor left empty.",
    finishes: ["Lime-wash plaster", "Pale oak", "Belgian window", "Plain linen"],
    images: [
      img("/references/moods/mood-east-upper.jpeg", "Guest bed", "Linen double bed and timber chair beside a Belgian window"),
      img("/references/moods/mood-east-upper-study.png", "Writing desk", "Pale oak writing desk and linen chair beside a Belgian window"),
      img("/references/moods/mood-east-upper-window.png", "Window detail", "Belgian window and timber shutters in daylight"),
      img("/references/moods/mood-east-upper-08.jpeg", "Bedside", "Oak nightstand and a ceramic lamp with a linen shade"),
      img("/references/moods/mood-east-upper-05.jpeg", "Linen", "Layered linen bedding beside a painted window sill"),
      img("/references/moods/mood-east-upper-06.jpeg", "Louvres", "Sage louvred shutters beside a linen bed"),
      img("/references/moods/mood-east-upper-04.jpeg", "Reading chair", "Upholstered reading chair beside an oak chest and linen bed"),
      img("/references/moods/mood-east-upper-wardrobe.png", "Joinery", "Pale oak wardrobe joinery with linen and ceramic detail"),
    ],
  },
  {
    id: "east-lower-room",
    label: "East bedroom",
    shortLabel: "E2",
    atmosphere: "Cross light south and east; oak dresser; bed or daybed.",
    finishes: ["Linen", "Oak dresser", "Dual windows", "Microcement"],
    images: [
      img("/references/moods/mood-east-lower.jpeg", "East bedroom", "Linen double bed opposite oak storage and a window-side desk"),
      img("/references/moods/mood-east-flex-improved.png", "Study", "Timber writing desk and linen daybed with framed art"),
      img("/references/moods/mood-east-lower-05.jpeg", "Dresser", "Oak chest of drawers with dark metal pulls and framed art"),
      img("/references/moods/mood-east-lower-08.jpeg", "Skirting", "Sage painted skirting meeting a pale mineral floor"),
      img("/references/moods/mood-east-lower-15.jpeg", "Bedding", "Linen double bed and oak bedside table in daylight"),
      img("/references/moods/mood-east-lower-16.jpeg", "Oak", "Oak drawers with a ceramic bowl and a linen-shaded lamp"),
      img("/references/moods/mood-east-lower-19.jpeg", "Reading corner", "Linen window seat beside an oak chest of drawers"),
      img("/references/moods/mood-east-lower-20.jpeg", "Sill", "Oak storage beneath a window beside linen bedding"),
    ],
  },
  {
    id: "service-core",
    label: "Bathroom",
    shortLabel: "B",
    atmosphere: "Wet room in plaster and microcement; oak vanity; one Belgian window.",
    finishes: ["Microcement", "Lime-wash plaster", "Oak vanity", "Belgian window"],
    images: [
      img("/references/moods/mood-bath-03.jpeg", "Wet room", "Compact bathroom with an oak vanity, toilet and glass shower"),
      img("/references/moods/mood-bath-detail.jpeg", "Joinery", "Oak vanity drawer and pale stone worktop detail"),
      img("/references/moods/mood-bath-04.jpeg", "Shower", "Glass shower screen, bronze fittings and a recessed shelf"),
      img("/references/moods/mood-bath-05.jpeg", "Vanity", "Oak vanity and rectangular basin beneath a wall mirror"),
      img("/references/moods/mood-bath-07.jpeg", "Niche", "Recessed shower shelf in a plaster and microcement wet room"),
      img("/references/moods/mood-bath-08.jpeg", "Basin", "Mineral basin and wall-mounted tap below a round mirror"),
      img("/references/moods/mood-bath-16.jpeg", "Floor junction", "Pale mineral floor meeting plaster below a floating oak vanity"),
      img("/references/moods/mood-bath-19.jpeg", "Fittings", "Bronze shower fittings beside a stone basin and oak vanity"),
    ],
  },
  {
    id: "ensuite",
    label: "Ensuite",
    shortLabel: "EN",
    atmosphere: "Master only: vanity, toilet, mirror — same materials, shorter run.",
    finishes: ["Oak", "Microcement", "Lime-wash plaster", "Mirror"],
    images: [
      img("/references/moods/mood-ensuite-03.jpeg", "WC and vanity", "Compact toilet and oak vanity beneath a small high window"),
      img("/references/moods/mood-ensuite-05.jpeg", "Vanity", "Oak vanity with a rectangular mirror and paired wall lights"),
      img("/references/moods/mood-bath-detail.jpeg", "Joinery", "Oak vanity drawer and pale stone worktop detail"),
      img("/references/moods/mood-ensuite-06.jpeg", "Compact WC", "Narrow powder room with a wall-hung toilet and timber vanity"),
      img("/references/moods/mood-ensuite-04.jpeg", "Mirror", "Illuminated rectangular mirror above a vessel basin and oak vanity"),
      img("/references/moods/mood-ensuite-15.jpeg", "Basin", "Ceramic vessel basin and bronze tap on an oak vanity"),
      img("/references/moods/mood-ensuite-17.jpeg", "Shelf", "Small oak shelf and wall mirror above a compact vanity"),
      img("/references/moods/mood-ensuite-19.jpeg", "Towel", "Linen hand towel beside an oak vanity and toilet"),
    ],
  },
  {
    id: "openings",
    label: "Windows & doors",
    shortLabel: "W",
    atmosphere: "Sage aluminium Belgian frames; light oak leaves; plaster reveals left honest.",
    finishes: ["Sage aluminium", "Belgian louvres", "Light oak", "Plaster reveals"],
    images: [
      img("/references/moods/mood-openings-01.jpeg", "Casement", "Belgian window on the facade"),
      img("/references/moods/mood-openings-02.jpeg", "Outlook", "Looking out through the frame"),
      img("/references/moods/mood-openings-03.jpeg", "Entry", "Light oak front door"),
      img("/references/moods/mood-openings-04.jpeg", "Terrace doors", "Multi-leaf terrace doors"),
      img("/references/moods/mood-openings-05.jpeg", "Detail", "Frame and louvre"),
      img("/references/moods/mood-openings-06.jpeg", "Shutters", "Louvres open on plaster"),
      img("/references/moods/mood-openings-07.jpeg", "Pair", "Oak door beside a window"),
      img("/references/moods/mood-openings-08.jpeg", "Muntin", "Frame close-up"),
      img("/references/moods/mood-openings-09.jpeg", "Pair facade", "Two windows on plaster"),
      img("/references/moods/mood-openings-10.jpeg", "Bath window", "Window above a vanity"),
      img("/references/moods/mood-openings-11.jpeg", "Mullion", "Sage aluminium mullion in daylight"),
      img("/references/moods/mood-openings-12.jpeg", "Casement", "Sage aluminium casement in morning light"),
      img("/references/moods/mood-openings-13.jpeg", "Leaf", "Light oak door leaf in natural light"),
      img("/references/moods/mood-openings-14.jpeg", "Jamb", "Plaster door jamb in side light"),
      img("/references/moods/mood-openings-15.jpeg", "Handle", "Bronze handle on light oak door"),
      img("/references/moods/mood-openings-16.jpeg", "Transom", "Sage aluminium transom in north light"),
      img("/references/moods/mood-openings-17.jpeg", "Latch", "Bronze latch on sage aluminium frame"),
      img("/references/moods/mood-openings-18.jpeg", "Pivot", "Light oak pivot door in daylight"),
      img("/references/moods/mood-openings-19.jpeg", "Glazing", "Sage aluminium glazing in west light"),
      img("/references/moods/mood-openings-20.jpeg", "Threshold", "Oak door threshold in natural light"),
    ],
  },
];

export const isMoodBoardId = (value: string | null): value is MoodBoardId =>
  roomMoodBoards.some((board) => board.id === value);
