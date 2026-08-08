"use client";
import type { Palette } from "./shared";
import { Dresser, LoungeChair, Nightstand, QueenBed } from "./furniture";

/**
 * East bedrooms — queen 160×200.
 * West doors at z≈6.8 (E1) / 9.3 (E2) — beds on east wall so leaves stay clear.
 * Envelopes: E1 x∈[7.6,11.4] z∈[5.0,8.55]; E2 x∈[7.6,11.4] z∈[8.55,12.1].
 */
export function EastUpperRoom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      {/* Queen on east wall — west door at z≈6.8 stays clear. */}
      <QueenBed base={base} palette={palette} x={10.5} z={6.4} along="z" headToward="-" />

      <Nightstand base={base} palette={palette} x={9.45} z={5.5} />

      {/* Chair south-west, south of door swing. */}
      <LoungeChair base={base} palette={palette} x={8.35} z={7.7} face="n" />
    </group>
  );
}

export function EastLowerRoom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      {/* Queen on east wall — west door at z≈9.3 stays clear. */}
      <QueenBed base={base} palette={palette} x={10.5} z={10.7} along="z" headToward="+" />

      <Nightstand base={base} palette={palette} x={9.45} z={11.55} />

      {/* Dresser on south wall, west of bed foot clearance. */}
      <Dresser base={base} palette={palette} x={8.5} z={11.75} along="x" />
    </group>
  );
}
