"use client";

import { Edges } from "@react-three/drei";
import type { ReactNode } from "react";
import { furnitureById, furnitureDimensions, type FurnitureId, type FurnitureSizeOverrides } from "@/data/furniture";
import { CX, CZ } from "./shared";

export type FurnitureEditingState = {
  sizes: FurnitureSizeOverrides;
  removedIds: FurnitureId[];
  selectedId?: FurnitureId;
  onSelect: (id: FurnitureId) => void;
};

export function EditableFurniture({
  id,
  editing,
  x,
  z,
  base,
  swapPlanAxes = false,
  children,
}: {
  id: FurnitureId;
  editing: FurnitureEditingState;
  x: number;
  z: number;
  base: number;
  swapPlanAxes?: boolean;
  children: ReactNode;
}) {
  const item = furnitureById[id];
  const current = furnitureDimensions(id, editing.sizes);
  const widthScale = current.widthCm / item.dimensions.widthCm;
  const depthScale = current.depthCm / item.dimensions.depthCm;
  const heightScale = current.heightCm / item.dimensions.heightCm;
  const originX = x - CX;
  const originZ = z - CZ;
  const selected = editing.selectedId === id;

  if (editing.removedIds.includes(id)) return null;

  return (
    <group
      name={item.uuid}
      position={[originX, base, originZ]}
      scale={[swapPlanAxes ? depthScale : widthScale, heightScale, swapPlanAxes ? widthScale : depthScale]}
      userData={{ furnitureId: id, uuid: item.uuid, dimensionsCm: current }}
      onClick={(event) => {
        event.stopPropagation();
        editing.onSelect(id);
      }}
      onPointerEnter={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        document.body.style.cursor = "default";
      }}
    >
      <group position={[-originX, -base, -originZ]}>{children}</group>
      {selected && (
        <mesh position={[0, item.dimensions.heightCm / 200, 0]}>
          <boxGeometry
            args={[
              (swapPlanAxes ? item.dimensions.depthCm : item.dimensions.widthCm) / 100,
              item.dimensions.heightCm / 100,
              (swapPlanAxes ? item.dimensions.widthCm : item.dimensions.depthCm) / 100,
            ]}
          />
          <meshBasicMaterial transparent opacity={0.025} depthWrite={false} color="#e59a50" />
          <Edges color="#e59a50" threshold={10} />
        </mesh>
      )}
    </group>
  );
}
