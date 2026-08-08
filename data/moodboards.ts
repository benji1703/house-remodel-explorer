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
 * Room-by-room photoreal mood boards (WIP atmosphere only — never geometry).
 * Taste: warm beige plaster, microcement, light oak, soft sage Belgian fenestration (#b8c9a8).
 * JPEGs in public/references/moods/ — ~10 images per board.
 */
export const roomMoodBoards: RoomMoodBoard[] = [
  {
    id: "north-extension",
    label: "Kitchen",
    shortLabel: "K",
    atmosphere:
      "Oak run as furniture, stone under hand, open to living. Soft sage Belgian light from the east — warm, unhurried.",
    finishes: ["Natural oak", "Light travertine", "Soft sage frames", "Warm plaster"],
    images: [
      img("/references/moods/mood-kitchen.jpeg", "Kitchen · evening", "Photoreal kitchen with oak cabinetry"),
      img("/references/moods/mood-kitchen-detail.jpeg", "Oak · stone", "Oak and travertine material detail"),
      img("/references/moods/mood-kitchen-03.jpeg", "Island · sage light", "Kitchen island with soft sage window"),
      img("/references/moods/mood-kitchen-04.jpeg", "Open to living", "Kitchen open to living and terrace doors"),
      img("/references/moods/mood-kitchen-05.jpeg", "Cabinet grain", "Oak cabinet and stone counter detail"),
      img("/references/moods/mood-kitchen-06.jpeg", "Morning bar", "Breakfast bar stools in soft morning light"),
      img("/references/moods/mood-kitchen-07.jpeg", "Pendant · dusk", "Evening pendant over island"),
      img("/references/moods/mood-kitchen-08.jpeg", "Sink detail", "Stone sink near sage window frame"),
      img("/references/moods/mood-kitchen-09.jpeg", "Plan flow", "Kitchen flowing into living"),
      img("/references/moods/mood-kitchen-10.jpeg", "Olive corner", "Kitchen corner with olive and sage window"),
    ],
  },
  {
    id: "central-core",
    label: "Living room",
    shortLabel: "LR",
    atmosphere:
      "Conversation toward soft sage west glazing and terrace. Low sofa, timber table, one chair — calm, not crowded.",
    finishes: ["Microcement floor", "Warm upholstery", "Soft sage glazing", "Lime-wash wall"],
    images: [
      img("/references/moods/mood-living.jpeg", "Indoor–outdoor", "Living room opening to terrace at dusk"),
      img("/references/moods/mood-living-detail.jpeg", "Floor · plaster", "Microcement and lime-wash detail"),
      img("/references/moods/mood-living-03.jpeg", "Sage terrace doors", "Sofa facing soft sage terrace doors"),
      img("/references/moods/mood-living-04.jpeg", "Conversation", "Conversation triangle in warm plaster"),
      img("/references/moods/mood-living-05.jpeg", "Threshold", "Microcement meeting plaster at door"),
      img("/references/moods/mood-living-06.jpeg", "Niche · evening", "Fireplace niche and soft lighting"),
      img("/references/moods/mood-living-07.jpeg", "To pergola", "View out through sage doors to pergola"),
      img("/references/moods/mood-living-08.jpeg", "Linen · oak", "Sofa fabric and oak table detail"),
      img("/references/moods/mood-living-09.jpeg", "Chair corner", "Quiet lounge chair by sage window"),
      img("/references/moods/mood-living-10.jpeg", "Open plan", "Living open toward kitchen"),
    ],
  },
  {
    id: "terrace",
    label: "Terrace",
    shortLabel: "T",
    atmosphere:
      "Timber pergola, climbing green, dining under cover. Soft sage house doors — outdoor room, not a park.",
    finishes: ["Wood pergola", "Climbing greenery", "Soft sage doors", "Clay planters"],
    images: [
      img("/references/moods/mood-terrace.jpeg", "Pergola · dining", "Pergola terrace dining at golden hour"),
      img("/references/moods/mood-terrace-detail.jpeg", "Timber · vine", "Pergola beam and greenery detail"),
      img("/references/moods/mood-terrace-03.jpeg", "Dining under cover", "Terrace dining with sage house doors"),
      img("/references/moods/mood-terrace-04.jpeg", "Under slats", "Looking up through pergola timber"),
      img("/references/moods/mood-terrace-05.jpeg", "Post · vine", "Timber post and climbing plant detail"),
      img("/references/moods/mood-terrace-06.jpeg", "Lounge", "Terrace lounge under boho pergola"),
      img("/references/moods/mood-terrace-07.jpeg", "Evening table", "Outdoor dining under reed roof"),
      img("/references/moods/mood-terrace-08.jpeg", "Planter", "Clay planter on terrace floor"),
      img("/references/moods/mood-terrace-09.jpeg", "Master patio", "Boho patio off master exit"),
      img("/references/moods/mood-terrace-10.jpeg", "Facade dusk", "House facade with sage shutters at dusk"),
    ],
  },
  {
    id: "southwest-room",
    label: "Master bedroom",
    shortLabel: "BR",
    atmosphere:
      "Quiet bedroom: queen bed south, soft sage west exit to private boho timber pergola. Soft linen, little else.",
    finishes: ["Warm linen", "Oak nightstands", "Soft sage exit", "Soft plaster"],
    images: [
      img("/references/moods/mood-master.jpeg", "Master · calm", "Calm master bedroom with queen bed"),
      img("/references/moods/mood-bedroom-detail.jpeg", "Linen · oak", "Linen bedding material detail"),
      img("/references/moods/mood-master-03.jpeg", "Sage light", "Bedroom with soft sage window light"),
      img("/references/moods/mood-master-04.jpeg", "Exit to patio", "View to sage exit and boho patio"),
      img("/references/moods/mood-master-05.jpeg", "Nightstand", "Linen and oak nightstand detail"),
      img("/references/moods/mood-master-06.jpeg", "Morning", "Morning light through sage window"),
      img("/references/moods/mood-master-07.jpeg", "Corner lamp", "Pendant and shutter corner"),
      img("/references/moods/mood-master-08.jpeg", "Plaster · oak", "Plaster wall and oak headboard"),
      img("/references/moods/mood-master-09.jpeg", "Toward pergola", "From bed toward patio"),
      img("/references/moods/mood-master-10.jpeg", "Ensuite link", "Oak ensuite door and sage light"),
    ],
  },
  {
    id: "east-upper-room",
    label: "East upper room",
    shortLabel: "E1",
    atmosphere:
      "Guest bedroom: queen bed, nightstand, reading chair. Soft sage Belgian window light, floor kept clear.",
    finishes: ["Soft plaster", "Light wood", "Soft sage window", "Simple linen"],
    images: [
      img("/references/moods/mood-east-upper.jpeg", "Guest bedroom", "Guest bedroom with Belgian window"),
      img("/references/moods/mood-bedroom-detail.jpeg", "Bedding", "Bedding material detail"),
      img("/references/moods/mood-east-upper-03.jpeg", "Sage window", "Queen bed with soft sage window"),
      img("/references/moods/mood-east-upper-04.jpeg", "Reading chair", "Reading chair in window light"),
      img("/references/moods/mood-east-upper-05.jpeg", "Sill detail", "Linen and sage sill detail"),
      img("/references/moods/mood-east-upper-06.jpeg", "Shutters open", "Open louvre shutters from inside"),
      img("/references/moods/mood-east-upper-07.jpeg", "Morning calm", "Morning light empty calm floor"),
      img("/references/moods/mood-east-upper-08.jpeg", "Nightstand", "Oak nightstand and lamp"),
      img("/references/moods/mood-east-upper-09.jpeg", "Nook", "Reading nook by sage window"),
      img("/references/moods/mood-east-upper-10.jpeg", "Dusk", "Guest room at dusk"),
    ],
  },
  {
    id: "east-lower-room",
    label: "East lower room",
    shortLabel: "E2",
    atmosphere:
      "Flexible room: queen bed, dresser, soft sage south + east light. Reads as bedroom or quiet study.",
    finishes: ["Daybed linen", "Oak dresser", "Soft sage windows", "Microcement"],
    images: [
      img("/references/moods/mood-east-lower.jpeg", "Flexible room", "Flexible east bedroom"),
      img("/references/moods/mood-living-detail.jpeg", "Materials", "Soft floor and wall materials"),
      img("/references/moods/mood-east-lower-03.jpeg", "Dual light", "Bed with south and east sage windows"),
      img("/references/moods/mood-east-lower-04.jpeg", "Study mode", "Quiet study / daybed reading"),
      img("/references/moods/mood-east-lower-05.jpeg", "Dresser grain", "Oak dresser detail"),
      img("/references/moods/mood-east-lower-06.jpeg", "South glow", "Golden light from south window"),
      img("/references/moods/mood-east-lower-07.jpeg", "Corner", "Dresser and sage window corner"),
      img("/references/moods/mood-east-lower-08.jpeg", "Floor · frame", "Microcement and sage frame"),
      img("/references/moods/mood-east-lower-09.jpeg", "Evening", "Dual sage windows at evening"),
      img("/references/moods/mood-east-lower-10.jpeg", "Guest suite", "E2 as calm guest suite"),
    ],
  },
  {
    id: "service-core",
    label: "Main bathroom",
    shortLabel: "B",
    atmosphere:
      "Warm wet room: microcement, soft plaster, oak vanity, soft sage window. Toilet on its own wall — calm.",
    finishes: ["Microcement", "Warm plaster", "Oak vanity", "Soft sage window"],
    images: [
      img("/references/moods/mood-bath.jpeg", "Main bath", "Warm beige microcement bathroom"),
      img("/references/moods/mood-bath-detail.jpeg", "Microcement · plaster", "Material detail"),
      img("/references/moods/mood-bath-03.jpeg", "Normal WC", "Toilet on side wall, clear space"),
      img("/references/moods/mood-bath-04.jpeg", "Shower", "Glass shower in microcement"),
      img("/references/moods/mood-bath-05.jpeg", "Vanity detail", "Oak vanity and stone basin"),
      img("/references/moods/mood-bath-06.jpeg", "Morning", "Morning sage window light"),
      img("/references/moods/mood-bath-07.jpeg", "Wet niche", "Shower niche and rainfall"),
      img("/references/moods/mood-bath-08.jpeg", "Plaster texture", "Microcement wall texture"),
      img("/references/moods/mood-bath-09.jpeg", "Spa dusk", "Bathroom at soft dusk"),
      img("/references/moods/mood-bath-10.jpeg", "Full layout", "Entry view of calm layout"),
    ],
  },
  {
    id: "ensuite",
    label: "Ensuite",
    shortLabel: "EN",
    atmosphere:
      "Private bath off the master: short vanity, toilet, soft sage accent — no visual noise.",
    finishes: ["Compact oak", "Microcement", "Soft plaster", "Quiet mirror"],
    images: [
      img("/references/moods/mood-ensuite.jpeg", "Ensuite", "Compact ensuite with oak vanity"),
      img("/references/moods/mood-bath-detail.jpeg", "Detail", "Vanity material detail"),
      img("/references/moods/mood-ensuite-03.jpeg", "Compact calm", "Ensuite vanity and toilet"),
      img("/references/moods/mood-ensuite-04.jpeg", "Mirror light", "Vanity mirror soft light"),
      img("/references/moods/mood-ensuite-05.jpeg", "Oak · stone", "Oak vanity top detail"),
      img("/references/moods/mood-ensuite-06.jpeg", "Stacked", "Compact N–S fixture stack"),
      img("/references/moods/mood-ensuite-07.jpeg", "Evening", "Ensuite evening calm"),
      img("/references/moods/mood-ensuite-08.jpeg", "Floor", "Microcement floor detail"),
      img("/references/moods/mood-ensuite-09.jpeg", "From door", "Ensuite from doorway"),
      img("/references/moods/mood-ensuite-10.jpeg", "Morning", "Ensuite morning light"),
    ],
  },
  {
    id: "openings",
    label: "Windows & doors",
    shortLabel: "W",
    atmosphere:
      "Soft sage Belgian frames and louvres (#b8c9a8), light oak hinged doors, warm plaster reveals. Fenestration language for the whole house.",
    finishes: ["Soft sage aluminium", "Belgian louvres", "Light oak doors", "Warm plaster"],
    images: [
      img("/references/moods/mood-openings-01.jpeg", "Sage casement", "Soft sage Belgian window exterior"),
      img("/references/moods/mood-openings-02.jpeg", "From inside", "Interior view through sage window"),
      img("/references/moods/mood-openings-03.jpeg", "Oak entry", "Light oak entry door"),
      img("/references/moods/mood-openings-04.jpeg", "Terrace doors", "Sage multi-leaf terrace doors"),
      img("/references/moods/mood-openings-05.jpeg", "Frame detail", "Sage frame and louvre detail"),
      img("/references/moods/mood-openings-06.jpeg", "Shutters open", "Open louvre shutters on plaster"),
      img("/references/moods/mood-openings-07.jpeg", "Door · window", "Oak door beside sage window"),
      img("/references/moods/mood-openings-08.jpeg", "Muntin", "Sage muntin macro"),
      img("/references/moods/mood-openings-09.jpeg", "Corner pair", "Two sage windows on facade"),
      img("/references/moods/mood-openings-10.jpeg", "Bath window", "Sage bathroom window over vanity"),
    ],
  },
];

export const isMoodBoardId = (value: string | null): value is MoodBoardId =>
  roomMoodBoards.some((board) => board.id === value);
