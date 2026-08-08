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
 */
export const roomMoodBoards: RoomMoodBoard[] = [
  {
    id: "north-extension",
    label: "Kitchen",
    shortLabel: "K",
    atmosphere:
      "A continuous oak run, travertine under the hand, morning light from the east. The room opens to living without ceremony.",
    finishes: ["European oak", "Honed travertine", "Belgian frames", "Lime-wash plaster"],
    images: [
      img("/references/moods/mood-kitchen.jpeg", "Evening", "Kitchen with oak cabinetry at evening"),
      img("/references/moods/mood-kitchen-detail.jpeg", "Grain & stone", "Oak and travertine detail"),
      img("/references/moods/mood-kitchen-03.jpeg", "Island", "Kitchen island with east window light"),
      img("/references/moods/mood-kitchen-04.jpeg", "Threshold", "Kitchen opening toward living"),
      img("/references/moods/mood-kitchen-05.jpeg", "Cabinet", "Oak cabinet face and stone counter"),
      img("/references/moods/mood-kitchen-06.jpeg", "Bar", "Breakfast bar in morning light"),
      img("/references/moods/mood-kitchen-07.jpeg", "Pendant", "Pendant over the island at dusk"),
      img("/references/moods/mood-kitchen-08.jpeg", "Basin", "Stone sink beside the window"),
      img("/references/moods/mood-kitchen-09.jpeg", "Enfilade", "Kitchen flowing into living"),
      img("/references/moods/mood-kitchen-10.jpeg", "Corner", "Quiet kitchen corner with olive"),
    ],
  },
  {
    id: "central-core",
    label: "Living",
    shortLabel: "LR",
    atmosphere:
      "Furniture kept low and few. The west glazing carries the eye to the terrace; plaster and microcement do the rest.",
    finishes: ["Microcement", "Wool upholstery", "West glazing", "Lime-wash plaster"],
    images: [
      img("/references/moods/mood-living.jpeg", "Dusk", "Living room opening to terrace at dusk"),
      img("/references/moods/mood-living-detail.jpeg", "Floor", "Microcement and plaster junction"),
      img("/references/moods/mood-living-03.jpeg", "Terrace doors", "Seating toward the terrace doors"),
      img("/references/moods/mood-living-04.jpeg", "Conversation", "Low seating in plaster light"),
      img("/references/moods/mood-living-05.jpeg", "Sill", "Floor meeting the door threshold"),
      img("/references/moods/mood-living-06.jpeg", "Niche", "Fireplace niche, evening"),
      img("/references/moods/mood-living-07.jpeg", "Outlook", "View through doors to the pergola"),
      img("/references/moods/mood-living-08.jpeg", "Linen", "Upholstery and oak table"),
      img("/references/moods/mood-living-09.jpeg", "Chair", "Lounge chair by the window"),
      img("/references/moods/mood-living-10.jpeg", "Open plan", "Living toward the kitchen"),
    ],
  },
  {
    id: "terrace",
    label: "Terrace",
    shortLabel: "T",
    atmosphere:
      "An outdoor room under timber and vine. Dining in shade; the house returns through painted doors.",
    finishes: ["Timber pergola", "Climbing vine", "Painted doors", "Clay planters"],
    images: [
      img("/references/moods/mood-terrace.jpeg", "Golden hour", "Pergola dining at golden hour"),
      img("/references/moods/mood-terrace-detail.jpeg", "Beam", "Pergola timber and vine"),
      img("/references/moods/mood-terrace-03.jpeg", "Covered table", "Dining under the pergola"),
      img("/references/moods/mood-terrace-04.jpeg", "Slats", "Looking up through timber"),
      img("/references/moods/mood-terrace-05.jpeg", "Post", "Column and climbing plant"),
      img("/references/moods/mood-terrace-06.jpeg", "Lounge", "Seating under the canopy"),
      img("/references/moods/mood-terrace-07.jpeg", "Supper", "Table under reed and timber"),
      img("/references/moods/mood-terrace-08.jpeg", "Planter", "Clay planter on the terrace"),
      img("/references/moods/mood-terrace-09.jpeg", "Master court", "Private court off the bedroom"),
      img("/references/moods/mood-terrace-10.jpeg", "Facade", "House front at dusk"),
    ],
  },
  {
    id: "southwest-room",
    label: "Master bedroom",
    shortLabel: "BR",
    atmosphere:
      "A quiet chamber. Linen, oak, and a west door to a private court — nothing that asks for attention.",
    finishes: ["Washed linen", "Oak bedside", "West exit", "Lime-wash plaster"],
    images: [
      img("/references/moods/mood-master.jpeg", "Rest", "Master bedroom with queen bed"),
      img("/references/moods/mood-bedroom-detail.jpeg", "Linen", "Bedding and oak detail"),
      img("/references/moods/mood-master-03.jpeg", "Daylight", "Bedroom in painted-frame light"),
      img("/references/moods/mood-master-04.jpeg", "Court", "Door toward the private patio"),
      img("/references/moods/mood-master-05.jpeg", "Bedside", "Nightstand and linen"),
      img("/references/moods/mood-master-06.jpeg", "Morning", "First light through the window"),
      img("/references/moods/mood-master-07.jpeg", "Corner", "Lamp and shutter"),
      img("/references/moods/mood-master-08.jpeg", "Headboard", "Plaster and oak"),
      img("/references/moods/mood-master-09.jpeg", "Toward garden", "From the bed to the court"),
      img("/references/moods/mood-master-10.jpeg", "Ensuite", "Door to the private bath"),
    ],
  },
  {
    id: "east-upper-room",
    label: "Guest bedroom",
    shortLabel: "E1",
    atmosphere:
      "A spare guest room. Bed, chair, Belgian light — floor left clear.",
    finishes: ["Lime-wash plaster", "Pale oak", "Belgian window", "Plain linen"],
    images: [
      img("/references/moods/mood-east-upper.jpeg", "Guest", "Guest bedroom with Belgian window"),
      img("/references/moods/mood-bedroom-detail.jpeg", "Cloth", "Bedding detail"),
      img("/references/moods/mood-east-upper-03.jpeg", "Window", "Bed beside the east window"),
      img("/references/moods/mood-east-upper-04.jpeg", "Reading", "Chair in window light"),
      img("/references/moods/mood-east-upper-05.jpeg", "Sill", "Linen at the sill"),
      img("/references/moods/mood-east-upper-06.jpeg", "Louvres", "Shutters open inward"),
      img("/references/moods/mood-east-upper-07.jpeg", "Morning", "Empty floor, morning light"),
      img("/references/moods/mood-east-upper-08.jpeg", "Lamp", "Oak nightstand and lamp"),
      img("/references/moods/mood-east-upper-09.jpeg", "Nook", "Reading corner"),
      img("/references/moods/mood-east-upper-10.jpeg", "Evening", "Guest room at dusk"),
    ],
  },
  {
    id: "east-lower-room",
    label: "East bedroom",
    shortLabel: "E2",
    atmosphere:
      "Bedroom or study by turn. South and east light; oak dresser; little else on the floor.",
    finishes: ["Linen", "Oak dresser", "Dual windows", "Microcement"],
    images: [
      img("/references/moods/mood-east-lower.jpeg", "East room", "East bedroom"),
      img("/references/moods/mood-living-detail.jpeg", "Surface", "Floor and wall finish"),
      img("/references/moods/mood-east-lower-03.jpeg", "Cross light", "Bed with south and east windows"),
      img("/references/moods/mood-east-lower-04.jpeg", "Study", "Daybed as reading place"),
      img("/references/moods/mood-east-lower-05.jpeg", "Dresser", "Oak dresser grain"),
      img("/references/moods/mood-east-lower-06.jpeg", "South", "Afternoon from the south"),
      img("/references/moods/mood-east-lower-07.jpeg", "Corner", "Dresser and window"),
      img("/references/moods/mood-east-lower-08.jpeg", "Frame", "Microcement and painted frame"),
      img("/references/moods/mood-east-lower-09.jpeg", "Evening", "Windows at evening"),
      img("/references/moods/mood-east-lower-10.jpeg", "Suite", "As a quiet guest suite"),
    ],
  },
  {
    id: "service-core",
    label: "Bathroom",
    shortLabel: "B",
    atmosphere:
      "A wet room in plaster and microcement. Oak vanity, a single window, fixtures set with space between them.",
    finishes: ["Microcement", "Lime-wash plaster", "Oak vanity", "Belgian window"],
    images: [
      img("/references/moods/mood-bath.jpeg", "Bath", "Bathroom in plaster and microcement"),
      img("/references/moods/mood-bath-detail.jpeg", "Texture", "Microcement surface"),
      img("/references/moods/mood-bath-03.jpeg", "WC", "Toilet on its own wall"),
      img("/references/moods/mood-bath-04.jpeg", "Shower", "Glass shower enclosure"),
      img("/references/moods/mood-bath-05.jpeg", "Vanity", "Oak vanity and stone basin"),
      img("/references/moods/mood-bath-06.jpeg", "Morning", "Window light on plaster"),
      img("/references/moods/mood-bath-07.jpeg", "Niche", "Shower niche"),
      img("/references/moods/mood-bath-08.jpeg", "Wall", "Microcement wall"),
      img("/references/moods/mood-bath-09.jpeg", "Dusk", "Bath at low light"),
      img("/references/moods/mood-bath-10.jpeg", "Plan", "Room from the door"),
    ],
  },
  {
    id: "ensuite",
    label: "Ensuite",
    shortLabel: "EN",
    atmosphere:
      "Private to the master. A short vanity, toilet, and mirror — the same materials, less of them.",
    finishes: ["Oak", "Microcement", "Lime-wash plaster", "Mirror"],
    images: [
      img("/references/moods/mood-ensuite.jpeg", "Private bath", "Ensuite with oak vanity"),
      img("/references/moods/mood-bath-detail.jpeg", "Detail", "Vanity surface"),
      img("/references/moods/mood-ensuite-03.jpeg", "Compact", "Vanity and toilet"),
      img("/references/moods/mood-ensuite-04.jpeg", "Mirror", "Mirror light"),
      img("/references/moods/mood-ensuite-05.jpeg", "Top", "Oak vanity top"),
      img("/references/moods/mood-ensuite-06.jpeg", "Stack", "Fixtures in a short run"),
      img("/references/moods/mood-ensuite-07.jpeg", "Evening", "Ensuite at evening"),
      img("/references/moods/mood-ensuite-08.jpeg", "Floor", "Microcement floor"),
      img("/references/moods/mood-ensuite-09.jpeg", "Entry", "From the doorway"),
      img("/references/moods/mood-ensuite-10.jpeg", "Morning", "Morning light"),
    ],
  },
  {
    id: "openings",
    label: "Windows & doors",
    shortLabel: "W",
    atmosphere:
      "One language for the house: Belgian frames in sage aluminium, light oak for hinged doors, plaster reveals left honest.",
    finishes: ["Sage aluminium", "Belgian louvres", "Light oak", "Plaster reveals"],
    images: [
      img("/references/moods/mood-openings-01.jpeg", "Casement", "Belgian window on the facade"),
      img("/references/moods/mood-openings-02.jpeg", "Interior", "Looking out through the frame"),
      img("/references/moods/mood-openings-03.jpeg", "Entry", "Light oak front door"),
      img("/references/moods/mood-openings-04.jpeg", "Terrace", "Multi-leaf terrace doors"),
      img("/references/moods/mood-openings-05.jpeg", "Detail", "Frame and louvre"),
      img("/references/moods/mood-openings-06.jpeg", "Shutters", "Louvres open on plaster"),
      img("/references/moods/mood-openings-07.jpeg", "Pair", "Oak door beside a window"),
      img("/references/moods/mood-openings-08.jpeg", "Muntin", "Frame close-up"),
      img("/references/moods/mood-openings-09.jpeg", "Facade", "Two windows on plaster"),
      img("/references/moods/mood-openings-10.jpeg", "Bath", "Window above a vanity"),
    ],
  },
];

export const isMoodBoardId = (value: string | null): value is MoodBoardId =>
  roomMoodBoards.some((board) => board.id === value);
