"use client";

import { useImperativeHandle, useState, type Ref } from "react";

export type CompassHandle = { update: (azimuth: number) => void };

/** Camera telemetry updates this small leaf, never the explorer or scene tree. */
export function Compass({ ref }: { ref: Ref<CompassHandle> }) {
  const [azimuth, setAzimuth] = useState(0);
  useImperativeHandle(ref, () => ({ update: setAzimuth }), []);
  const degrees = Math.round(((azimuth % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) * 180 / Math.PI);
  return (
    <div className="orientation" role="img" aria-label={`Plan north; camera heading ${degrees} degrees`}>
      <b>N</b>
      <span style={{ transform: `rotate(${azimuth}rad)` }} />
    </div>
  );
}
