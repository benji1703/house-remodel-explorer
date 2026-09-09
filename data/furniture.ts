export type FurnitureDimensions = {
  widthCm: number;
  depthCm: number;
  heightCm: number;
};

export const furnitureCatalog = [
  { id: "living-sofa", uuid: "2d6cd4dc-7fd9-4fbe-8e5e-d1d73c56f9a1", label: "Living sofa", room: "Living", dimensions: { widthCm: 220, depthCm: 90, heightCm: 75 } },
  { id: "living-coffee-table", uuid: "b8ca8bd2-44d5-4ba6-859d-47e81198d8d9", label: "Coffee table", room: "Living", dimensions: { widthCm: 120, depthCm: 70, heightCm: 40 } },
  { id: "living-lounge-chair", uuid: "75fb86b1-819a-499a-9a58-92369eb119f6", label: "Lounge chair", room: "Living", dimensions: { widthCm: 85, depthCm: 90, heightCm: 70 } },
  { id: "master-bed", uuid: "91454cf0-6155-4d15-8457-feb463b891ca", label: "Master bed", room: "Master bedroom", dimensions: { widthCm: 160, depthCm: 200, heightCm: 55 } },
  { id: "master-nightstand-west", uuid: "fb6595b0-f753-40b9-8797-83c31bff1cf4", label: "West nightstand", room: "Master bedroom", dimensions: { widthCm: 45, depthCm: 40, heightCm: 55 } },
  { id: "master-nightstand-east", uuid: "420d67e7-f360-473a-9a7d-cd513b867d4b", label: "East nightstand", room: "Master bedroom", dimensions: { widthCm: 45, depthCm: 40, heightCm: 55 } },
  { id: "east-upper-bed", uuid: "28928602-f655-4d96-9325-6de845d04f59", label: "East upper bed", room: "East upper", dimensions: { widthCm: 160, depthCm: 200, heightCm: 55 } },
  { id: "east-upper-nightstand", uuid: "f157de5f-f4b9-4c7e-90aa-a730ea3b508b", label: "East upper nightstand", room: "East upper", dimensions: { widthCm: 45, depthCm: 40, heightCm: 55 } },
  { id: "east-upper-chair", uuid: "c2d2b9c1-7907-4a79-a73b-5b7a6f6ddb82", label: "East upper chair", room: "East upper", dimensions: { widthCm: 85, depthCm: 90, heightCm: 70 } },
  { id: "east-lower-bed", uuid: "3f26e1d4-e55f-4370-a8bc-ec1c51847265", label: "East lower bed", room: "East lower", dimensions: { widthCm: 160, depthCm: 200, heightCm: 55 } },
  { id: "east-lower-nightstand", uuid: "27d87cfb-1438-49dc-a983-2801ff044d74", label: "East lower nightstand", room: "East lower", dimensions: { widthCm: 45, depthCm: 40, heightCm: 55 } },
  { id: "east-lower-dresser", uuid: "5219de6c-30c7-46ef-b53a-ec4a946bb1cb", label: "East lower dresser", room: "East lower", dimensions: { widthCm: 120, depthCm: 50, heightCm: 85 } },
  { id: "kitchen-stool-north", uuid: "826011e6-e25f-40a9-9c65-c8bc119131e8", label: "North island stool", room: "Kitchen", dimensions: { widthCm: 40, depthCm: 40, heightCm: 70 } },
  { id: "kitchen-stool-south", uuid: "edc28624-ce64-4119-9eb0-814559d70acf", label: "South island stool", room: "Kitchen", dimensions: { widthCm: 40, depthCm: 40, heightCm: 70 } },
  { id: "kitchen-integrated-fridge", uuid: "194eaa55-8aab-476c-b4af-ce8eed213acd", label: "Integrated fridge", room: "Kitchen", dimensions: { widthCm: 90, depthCm: 70, heightCm: 223 } },
  { id: "terrace-dining-set", uuid: "b860832a-1b38-4183-8e8f-7d65820fc647", label: "Terrace dining table", room: "Terrace", dimensions: { widthCm: 160, depthCm: 85, heightCm: 75 } },
  { id: "master-patio-chair", uuid: "19a4bafd-1a75-4608-ab4c-cc2a91d1e8e1", label: "Patio lounge chair", room: "Master patio", dimensions: { widthCm: 85, depthCm: 90, heightCm: 70 } },
] as const;

export type FurnitureId = (typeof furnitureCatalog)[number]["id"];
export type FurnitureSizeOverrides = Partial<Record<FurnitureId, FurnitureDimensions>>;

export const furnitureById = Object.fromEntries(
  furnitureCatalog.map((item) => [item.id, item]),
) as Record<FurnitureId, (typeof furnitureCatalog)[number]>;

export function furnitureDimensions(id: FurnitureId, overrides: FurnitureSizeOverrides) {
  return overrides[id] ?? furnitureById[id].dimensions;
}
