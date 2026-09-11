"use client";

import { house, type ZoneId } from "@/data/house";

export function RoomDirectory({ selected, onSelect }: {
  selected?: ZoneId;
  onSelect: (id: ZoneId) => void;
}) {
  return (
    <nav className="room-directory" aria-label="Explore rooms">
      <p className="room-directory-title">Explore the rooms <span>{String(house.zones.length).padStart(2, "0")}</span></p>
      {house.zones.map((zone, index) => (
        <button key={zone.id} type="button" aria-current={selected === zone.id ? "true" : undefined} onClick={() => onSelect(zone.id)}>
          <span className="room-directory-index">{String(index + 1).padStart(2, "0")}</span>
          <span>{zone.label}</span>
          <span className="room-directory-arrow" aria-hidden="true">↗</span>
        </button>
      ))}
    </nav>
  );
}
