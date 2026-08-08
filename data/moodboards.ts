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
    ],
  },
  {
    id: "central-core",
    label: "Living",
    shortLabel: "LR",
    atmosphere: "Low furniture, west glass to the terrace. Lime-wash and microcement carry the volume.",
    finishes: ["Microcement", "Wool upholstery", "West glazing", "Lime-wash plaster"],
    images: [
      img("/references/moods/mood-living.jpeg", "Terrace light", "Living room opening to terrace at dusk"),
      img("/references/moods/mood-living-detail.jpeg", "Junction", "Microcement and plaster join"),
      img("/references/moods/mood-living-03.jpeg", "Doors", "Seating toward the terrace doors"),
      img("/references/moods/mood-living-04.jpeg", "Seating", "Low seating in plaster light"),
      img("/references/moods/mood-living-05.jpeg", "Sill", "Floor meeting the door threshold"),
      img("/references/moods/mood-living-06.jpeg", "Niche", "Fireplace niche"),
      img("/references/moods/mood-living-07.jpeg", "Outlook", "View through doors to the pergola"),
      img("/references/moods/mood-living-08.jpeg", "Table", "Upholstery and oak table"),
      img("/references/moods/mood-living-09.jpeg", "Chair", "Lounge chair by the window"),
      img("/references/moods/mood-living-10.jpeg", "Plan", "Living toward the kitchen"),
    ],
  },
  {
    id: "terrace",
    label: "Terrace",
    shortLabel: "T",
    atmosphere: "Pergola, vine, shade for table. House returns through painted doors.",
    finishes: ["Timber pergola", "Climbing vine", "Painted doors", "Clay planters"],
    images: [
      img("/references/moods/mood-terrace.jpeg", "Pergola", "Pergola dining at golden hour"),
      img("/references/moods/mood-terrace-detail.jpeg", "Beam", "Pergola timber and vine"),
      img("/references/moods/mood-terrace-03.jpeg", "Table", "Dining under the pergola"),
      img("/references/moods/mood-terrace-04.jpeg", "Slats", "Looking up through timber"),
      img("/references/moods/mood-terrace-05.jpeg", "Post", "Column and climbing plant"),
      img("/references/moods/mood-terrace-06.jpeg", "Lounge", "Seating under the canopy"),
      img("/references/moods/mood-terrace-07.jpeg", "Supper", "Table under reed and timber"),
      img("/references/moods/mood-terrace-08.jpeg", "Planter", "Clay planter on the terrace"),
      img("/references/moods/mood-terrace-09.jpeg", "Court", "Private court off the bedroom"),
      img("/references/moods/mood-terrace-10.jpeg", "Facade", "House front at dusk"),
    ],
  },
  {
    id: "southwest-room",
    label: "Master bedroom",
    shortLabel: "BR",
    atmosphere: "Linen and pale oak; west exit to the private court.",
    finishes: ["Washed linen", "Oak bedside", "West exit", "Lime-wash plaster"],
    images: [
      img("/references/moods/mood-master.jpeg", "Bed", "Master bedroom with queen bed"),
      img("/references/moods/mood-bedroom-detail.jpeg", "Cloth", "Bedding and oak detail"),
      img("/references/moods/mood-master-03.jpeg", "Frame light", "Bedroom in painted-frame light"),
      img("/references/moods/mood-master-04.jpeg", "Court door", "Door toward the private patio"),
      img("/references/moods/mood-master-05.jpeg", "Bedside", "Nightstand and linen"),
      img("/references/moods/mood-master-06.jpeg", "First light", "Morning light through the window"),
      img("/references/moods/mood-master-07.jpeg", "Lamp", "Lamp and shutter"),
      img("/references/moods/mood-master-08.jpeg", "Headboard", "Plaster and oak"),
      img("/references/moods/mood-master-09.jpeg", "Garden line", "From the bed to the court"),
      img("/references/moods/mood-master-10.jpeg", "Bath door", "Door to the private bath"),
    ],
  },
  {
    id: "east-upper-room",
    label: "Guest bedroom",
    shortLabel: "E1",
    atmosphere: "Bed, chair, Belgian window. Floor left empty.",
    finishes: ["Lime-wash plaster", "Pale oak", "Belgian window", "Plain linen"],
    images: [
      img("/references/moods/mood-east-upper.jpeg", "Guest bed", "Guest bedroom with Belgian window"),
      img("/references/moods/mood-bedroom-detail.jpeg", "Linen", "Bedding detail"),
      img("/references/moods/mood-east-upper-03.jpeg", "East light", "Bed beside the east window"),
      img("/references/moods/mood-east-upper-04.jpeg", "Chair", "Chair in window light"),
      img("/references/moods/mood-east-upper-05.jpeg", "Sill", "Linen at the sill"),
      img("/references/moods/mood-east-upper-06.jpeg", "Louvres", "Shutters open inward"),
      img("/references/moods/mood-east-upper-07.jpeg", "Floor", "Empty floor in morning light"),
      img("/references/moods/mood-east-upper-08.jpeg", "Stand", "Oak nightstand and lamp"),
      img("/references/moods/mood-east-upper-09.jpeg", "Nook", "Reading corner"),
      img("/references/moods/mood-east-upper-10.jpeg", "Dusk", "Guest room at dusk"),
    ],
  },
  {
    id: "east-lower-room",
    label: "East bedroom",
    shortLabel: "E2",
    atmosphere: "Cross light south and east; oak dresser; bed or daybed.",
    finishes: ["Linen", "Oak dresser", "Dual windows", "Microcement"],
    images: [
      img("/references/moods/mood-east-lower.jpeg", "East room", "East bedroom"),
      img("/references/moods/mood-living-detail.jpeg", "Surface", "Floor and wall finish"),
      img("/references/moods/mood-east-lower-03.jpeg", "Cross light", "Bed with south and east windows"),
      img("/references/moods/mood-east-lower-04.jpeg", "Daybed", "Daybed as reading place"),
      img("/references/moods/mood-east-lower-05.jpeg", "Dresser", "Oak dresser grain"),
      img("/references/moods/mood-east-lower-06.jpeg", "South", "Afternoon from the south"),
      img("/references/moods/mood-east-lower-07.jpeg", "Corner", "Dresser and window"),
      img("/references/moods/mood-east-lower-08.jpeg", "Frame", "Microcement and painted frame"),
      img("/references/moods/mood-east-lower-09.jpeg", "Windows", "Windows at evening"),
      img("/references/moods/mood-east-lower-10.jpeg", "Suite", "Quiet guest suite"),
    ],
  },
  {
    id: "service-core",
    label: "Bathroom",
    shortLabel: "B",
    atmosphere: "Wet room in plaster and microcement; oak vanity; one Belgian window.",
    finishes: ["Microcement", "Lime-wash plaster", "Oak vanity", "Belgian window"],
    images: [
      img("/references/moods/mood-bath.jpeg", "Wet room", "Bathroom in plaster and microcement"),
      img("/references/moods/mood-bath-detail.jpeg", "Texture", "Microcement surface"),
      img("/references/moods/mood-bath-03.jpeg", "WC", "Toilet on its own wall"),
      img("/references/moods/mood-bath-04.jpeg", "Shower", "Glass shower enclosure"),
      img("/references/moods/mood-bath-05.jpeg", "Vanity", "Oak vanity and stone basin"),
      img("/references/moods/mood-bath-06.jpeg", "Plaster light", "Window light on plaster"),
      img("/references/moods/mood-bath-07.jpeg", "Niche", "Shower niche"),
      img("/references/moods/mood-bath-08.jpeg", "Wall", "Microcement wall"),
      img("/references/moods/mood-bath-09.jpeg", "Low light", "Bath in low light"),
      img("/references/moods/mood-bath-10.jpeg", "Entry", "Room from the door"),
    ],
  },
  {
    id: "ensuite",
    label: "Ensuite",
    shortLabel: "EN",
    atmosphere: "Master only: vanity, toilet, mirror — same materials, shorter run.",
    finishes: ["Oak", "Microcement", "Lime-wash plaster", "Mirror"],
    images: [
      img("/references/moods/mood-ensuite.jpeg", "Private bath", "Ensuite with oak vanity"),
      img("/references/moods/mood-bath-detail.jpeg", "Top", "Vanity surface"),
      img("/references/moods/mood-ensuite-03.jpeg", "Run", "Vanity and toilet"),
      img("/references/moods/mood-ensuite-04.jpeg", "Mirror", "Mirror light"),
      img("/references/moods/mood-ensuite-05.jpeg", "Oak top", "Oak vanity top"),
      img("/references/moods/mood-ensuite-06.jpeg", "Stack", "Fixtures in a short run"),
      img("/references/moods/mood-ensuite-07.jpeg", "Evening", "Ensuite at evening"),
      img("/references/moods/mood-ensuite-08.jpeg", "Floor", "Microcement floor"),
      img("/references/moods/mood-ensuite-09.jpeg", "Doorway", "From the doorway"),
      img("/references/moods/mood-ensuite-10.jpeg", "Morning", "Morning light"),
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
    ],
  },
];

export const isMoodBoardId = (value: string | null): value is MoodBoardId =>
  roomMoodBoards.some((board) => board.id === value);
