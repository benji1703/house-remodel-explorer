import { furnitureCatalog, type FurnitureId, type FurnitureSizeOverrides } from "../data/furniture";

export const FURNITURE_STORAGE_KEY = "villa-nehama:furniture-layout:v1";

/** Browser storage is user-controlled; only valid centimetre dimensions reach Three.js. */
export function parseFurnitureLayout(value: unknown): {
  sizes: FurnitureSizeOverrides;
  removedIds: FurnitureId[];
} {
  const sizes: FurnitureSizeOverrides = {};
  const removedIds: FurnitureId[] = [];
  if (!value || typeof value !== "object") return { sizes, removedIds };
  const saved = value as { sizes?: unknown; removedIds?: unknown };
  const candidates = saved.sizes && typeof saved.sizes === "object"
    ? saved.sizes as Record<string, unknown>
    : {};

  for (const item of furnitureCatalog) {
    const candidate = candidates[item.id];
    if (candidate && typeof candidate === "object") {
      const dimensions = candidate as Record<string, unknown>;
      const valid = ["widthCm", "depthCm", "heightCm"].every((key) => {
        const dimension = dimensions[key];
        return typeof dimension === "number" && Number.isFinite(dimension) && dimension >= 10 && dimension <= 600;
      });
      if (valid) {
        sizes[item.id] = {
          widthCm: Math.round(dimensions.widthCm as number),
          depthCm: Math.round(dimensions.depthCm as number),
          heightCm: Math.round(dimensions.heightCm as number),
        };
      }
    }
    if (Array.isArray(saved.removedIds) && saved.removedIds.includes(item.id)) removedIds.push(item.id);
  }
  return { sizes, removedIds };
}
