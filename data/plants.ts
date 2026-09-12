export type PlantZone = "arrival" | "courtyard" | "pergola" | "boundary" | "planter";

export type PlantReference = {
  name: string;
  botanical: string;
  role: string;
  zones: PlantZone[];
  sun: string;
  water: string;
  height: string;
  ecology: string;
  image: string;
  url: string;
};

/** A first planting brief for a sunny coastal Mediterranean lot; verify soil, salt exposure and irrigation on site. */
export const plantReferences: PlantReference[] = [
  { name: "Mastic tree", botanical: "Pistacia lentiscus", role: "Evergreen structure", zones: ["arrival", "boundary"], sun: "Full sun / light shade", water: "Low once established", height: "2–5 m", ecology: "Native Mediterranean shrub with berries for birds and dense, wind-tolerant foliage.", image: "/references/plants/mastic.webp", url: "https://www.gov.il/he/departments/dynamiccollectors/water_saving_plants" },
  { name: "Carob tree", botanical: "Ceratonia siliqua", role: "Long-lived shade tree", zones: ["arrival", "courtyard"], sun: "Full sun", water: "Low once established", height: "6–12 m", ecology: "A locally adapted evergreen canopy tree; reserve generous root room and keep clear of foundations.", image: "/references/plants/carob.webp", url: "https://en-lifesci.tau.ac.il/botanical/garden/kurkar" },
  { name: "Olive tree", botanical: "Olea europaea", role: "Architectural specimen", zones: ["arrival", "courtyard", "planter"], sun: "Full sun", water: "Low / deep irrigation", height: "3–7 m trained", ecology: "Silvery, drought-adapted foliage echoes the travertine palette; choose a nursery-grown, non-fruiting form near seating.", image: "/references/plants/olive.webp", url: "https://www.gov.il/he/departments/dynamiccollectors/water_saving_plants" },
  { name: "Myrtle", botanical: "Myrtus communis", role: "Scented evergreen hedge", zones: ["boundary", "arrival"], sun: "Full sun / light shade", water: "Low to moderate", height: "1.5–3 m", ecology: "Native evergreen with fragrant flowers; useful as a clipped, quiet green room around the lot edge.", image: "/references/plants/myrtle.webp", url: "https://www.kkl.org.il/climate_and_sustainability/climate_ventures/plant_guide/" },
  { name: "Israeli sage", botanical: "Salvia fruticosa", role: "Pollinator herb", zones: ["courtyard", "planter"], sun: "Full sun", water: "Very low", height: "0.6–1.2 m", ecology: "Aromatic native shrub with seasonal flowers for bees; plant in sharply drained soil and avoid summer overwatering.", image: "/references/plants/sage.webp", url: "https://www.gov.il/he/departments/dynamiccollectors/water_saving_plants" },
  { name: "Rosemary", botanical: "Salvia rosmarinus", role: "Edible low hedge", zones: ["arrival", "courtyard", "planter"], sun: "Full sun", water: "Very low", height: "0.4–1 m", ecology: "Coastal-Mediterranean aromatic foliage and winter flowers; excellent along warm paths and kitchen-facing planters.", image: "/references/plants/rosemary.webp", url: "https://yarokli.com/garden/mediterranean-plants/care" },
  { name: "Dwarf bougainvillea", botanical: "Bougainvillea glabra", role: "Pergola climber", zones: ["pergola"], sun: "Full sun", water: "Low once established", height: "Train to 2.5–4 m", ecology: "A heat-loving flowering vine for the timber pergola; train on independent wires and keep thorns away from door swings.", image: "/references/plants/bougainvillea.webp", url: "https://www.botanicanursery.co.il/seaside" },
  { name: "Sea lavender", botanical: "Limonium perezii", role: "Salt-tolerant perennial", zones: ["boundary", "planter"], sun: "Full sun", water: "Low", height: "0.4–0.7 m", ecology: "Handles coastal exposure and gives a restrained blue-violet flower haze beside stone and sage frames.", image: "/references/plants/sealavender.webp", url: "https://www.botanicanursery.co.il/seaside" },
  { name: "Dune grass", botanical: "Leymus arenarius", role: "Coastal textural grass", zones: ["boundary", "pergola"], sun: "Full sun", water: "Low", height: "0.5–1 m", ecology: "Use sparingly in sandy, wind-exposed pockets for movement; keep away from paths where blades can spill.", image: "/references/plants/dunegrass.webp", url: "https://www.botanicanursery.co.il/seaside" },
  { name: "Lomandra 'Little Con'", botanical: "Lomandra longifolia", role: "Evergreen strappy accent", zones: ["arrival", "planter"], sun: "Full sun / light shade", water: "Low once established", height: "0.4–0.6 m", ecology: "Tough, architectural foliage for the warm mineral courtyard; selected from Israeli coastal-plant availability.", image: "/references/plants/lomandra.webp", url: "https://www.botanicanursery.co.il/seaside" },
];
