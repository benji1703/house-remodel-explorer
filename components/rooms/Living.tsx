"use client";
import type { Palette } from "./shared";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { CoffeeTable, FURN, LoungeChair, Pendant, Sofa } from "./furniture";
import { ArtTV, SideTable } from "./LuxuryDetails";

import { InteriorMoodProp } from "./InteriorMoodProps";
import { MoodOlivePot } from "./MoodGardenProps";
import { interiorStyling } from "@/data/interiorStyling";
import { useSceneQuality } from "../scene/SceneDetail";

/** Living — layered linen and natural oak, within the existing conversation group. */
export function Living({ base, palette, furnitureEditing, lightsOn = true, nightFactor = 1 }: { base: number; palette: Palette; furnitureEditing: FurnitureEditingState; lightsOn?: boolean; nightFactor?: number }) {
  const quality = useSceneQuality();
  return (
    <group>
      <InteriorMoodProp palette={palette} id="living-rug" {...interiorStyling.livingRug} base={base + 0.002} />

      {/* Sofa on east side, sits facing west toward terrace. 220×90 cm. */}
      <EditableFurniture id="living-sofa" editing={furnitureEditing} x={6.7} z={6.1} base={base} swapPlanAxes>
        <Sofa base={base} palette={palette} x={6.7} z={6.1} face="w" />
        <InteriorMoodProp palette={palette} id="sofa-linen" xCm={670} zCm={610} base={base} />
      </EditableFurniture>

      {/* Coffee table 120×70 in front of sofa. */}
      <EditableFurniture id="living-coffee-table" editing={furnitureEditing} x={5.35} z={6.1} base={base}>
        <CoffeeTable base={base} palette={palette} x={5.35} z={6.1} />
        <InteriorMoodProp palette={palette} id="coffee-still-life" xCm={535} zCm={610} base={base + FURN.coffee.h} />
      </EditableFurniture>

      {/* Lounge chair closes the triangle — clear of bedroom door swing. */}
      <EditableFurniture id="living-lounge-chair" editing={furnitureEditing} x={4.5} z={7.45} base={base}>
        <LoungeChair base={base} palette={palette} x={4.5} z={7.45} face="n" />
      </EditableFurniture>

      <LoungeChair base={base} palette={palette} x={4.48} z={4.82} face="s" />
      <SideTable base={base} palette={palette} x={4.15} z={6.12} />
      <InteriorMoodProp palette={palette} id="reading-lamp" {...interiorStyling.readingLamp} base={base} glow={lightsOn ? 0.25 + nightFactor * 0.75 : 0} />
      <ArtTV base={base} x={7.485} z={4.45} wall="east" width={1.22} height={0.72} />
      <Pendant base={base} palette={palette} x={5.4} z={6.1} lightsOn={lightsOn} nightFactor={nightFactor} />
      <MoodOlivePot base={base} palette={palette} x={6.45} z={4.75} scale={0.82} quality={quality} />
    </group>
  );
}
