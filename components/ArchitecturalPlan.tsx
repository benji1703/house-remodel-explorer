"use client";

import { house, type ZoneId } from "@/data/house";

type Props = {
  selected?: ZoneId;
  onSelect?: (id: ZoneId) => void;
  interactive?: boolean;
  idPrefix?: string;
};

const roomLabelOffsets: Partial<Record<ZoneId, [number, number]>> = {
  ensuite: [0, 10],
  "service-core": [0, 8],
};

function Dimension({
  x1,
  y1,
  x2,
  y2,
  label,
  vertical = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  vertical?: boolean;
}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g className="architect-dimension">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {vertical ? (
        <>
          <line x1={x1 - 12} y1={y1} x2={x1 + 12} y2={y1} />
          <line x1={x2 - 12} y1={y2} x2={x2 + 12} y2={y2} />
          <text x={mx + 21} y={my} transform={`rotate(90 ${mx + 21} ${my})`}>
            {label}
          </text>
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - 12} x2={x1} y2={y1 + 12} />
          <line x1={x2} y1={y2 - 12} x2={x2} y2={y2 + 12} />
          <text x={mx} y={my - 12}>{label}</text>
        </>
      )}
    </g>
  );
}

function DoorSwing({
  x,
  y,
  width,
  orientation,
  flip = false,
}: {
  x: number;
  y: number;
  width: number;
  orientation: "horizontal" | "vertical";
  flip?: boolean;
}) {
  const s = flip ? -1 : 1;
  if (orientation === "vertical") {
    return (
      <g className="architect-door-symbol">
        <line x1={x} y1={y} x2={x + width * s} y2={y} />
        <path d={`M ${x} ${y + width} A ${width} ${width} 0 0 ${flip ? 0 : 1} ${x + width * s} ${y}`} />
      </g>
    );
  }
  return (
    <g className="architect-door-symbol">
      <line x1={x} y1={y} x2={x} y2={y + width * s} />
      <path d={`M ${x + width} ${y} A ${width} ${width} 0 0 ${flip ? 1 : 0} ${x} ${y + width * s}`} />
    </g>
  );
}

export function ArchitecturalPlan({ selected, onSelect, interactive = false, idPrefix = "master" }: Props) {
  const gridId = `${idPrefix}-architect-grid`;
  const footprintId = `${idPrefix}-architect-footprint`;

  return (
    <div className="architect-plan-wrap">
      <svg
        className="architect-plan"
        viewBox="-90 -155 1660 1495"
        role={interactive ? "group" : "img"}
        aria-labelledby={`${idPrefix}-plan-title ${idPrefix}-plan-desc`}
      >
        <title id={`${idPrefix}-plan-title`}>AI-assisted architectural SVG reconstruction of Villa Nehama</title>
        <desc id={`${idPrefix}-plan-desc`}>
          Vector floor plan traced from the measured drawing, with the accepted room zones, dimension chains,
          openings and working wall thicknesses. It is a design-audit drawing, not a construction document.
        </desc>
        <defs>
          <pattern id={gridId} width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0H0V50" className="architect-grid-minor" />
          </pattern>
          <clipPath id={footprintId}>
            <path d="M340 0H760V500H1140V1210H0V830H340Z" />
          </clipPath>
        </defs>

        <rect x="-90" y="-125" width="1660" height="1465" className="architect-paper" />
        <rect x="-50" y="-90" width="1240" height="1370" fill={`url(#${gridId})`} />

        <g clipPath={`url(#${footprintId})`} className="architect-zones">
          {house.zones.map((zone) => {
            const offset = roomLabelOffsets[zone.id] ?? [0, 0];
            const cx = (zone.x + zone.width / 2) * 100 + offset[0];
            const cy = (zone.z + zone.depth / 2) * 100 + offset[1];
            const active = zone.id === selected;
            return (
              <g
                key={zone.id}
                className={`architect-zone${active ? " is-selected" : ""}${interactive ? " is-interactive" : ""}`}
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-label={interactive ? `Open ${zone.label}` : undefined}
                aria-pressed={interactive ? active : undefined}
                onClick={interactive ? () => onSelect?.(zone.id) : undefined}
                onKeyDown={
                  interactive
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelect?.(zone.id);
                        }
                      }
                    : undefined
                }
              >
                <rect
                  x={zone.x * 100}
                  y={zone.z * 100}
                  width={zone.width * 100}
                  height={zone.depth * 100}
                />
                <text x={cx} y={cy - 18} className="architect-room-name">{zone.label.toUpperCase()}</text>
                <text x={cx} y={cy + 10} className="architect-room-size">
                  {Math.round(zone.width * 100)} × {Math.round(zone.depth * 100)}
                </text>
                <text x={cx} y={cy + 36} className="architect-room-area">
                  {(zone.width * zone.depth).toFixed(1)} m² · {zone.shortLabel}
                </text>
              </g>
            );
          })}
        </g>

        {/* Accepted wall trace: 20 cm exterior, 10 cm internal. */}
        <path className="architect-wall exterior" d="M340 0H760V500H1140V1210H0V830H340Z" />
        <path className="architect-wall interior" d="M760 500V1210M760 855H1140M340 830V1210M340 1020H760M490 1020V1210" />

        {/* Accepted openings; white cuts separate wall voids from the frame/leaf notation. */}
        <g className="architect-opening-cuts">
          <path d="M470 0H630M760 25V145M880 500H1020M1140 610V790M1140 930V1070" />
          <path d="M880 1210H1020M570 1210H670M380 1210H450M95 1210H245M100 830H240" />
          <path className="door-cut" d="M760 265V365M0 860V980M340 430V790" />
          <path className="door-cut interior-cut" d="M760 635V725M760 885V975M340 885V975M340 1090V1170M540 1020H620" />
        </g>

        <g className="architect-window-symbols">
          <path d="M470 0H630M760 25V145M880 500H1020M1140 610V790M1140 930V1070" />
          <path d="M880 1210H1020M570 1210H670M380 1210H450M95 1210H245M100 830H240" />
        </g>

        {/* Door and terrace symbols follow the accepted model opening schedule. */}
        <DoorSwing x={760} y={265} width={100} orientation="vertical" flip />
        <DoorSwing x={0} y={860} width={120} orientation="vertical" />
        <DoorSwing x={760} y={635} width={90} orientation="vertical" flip />
        <DoorSwing x={760} y={885} width={90} orientation="vertical" flip />
        <DoorSwing x={340} y={885} width={90} orientation="vertical" />
        <DoorSwing x={540} y={1020} width={80} orientation="horizontal" />
        <g className="architect-slider-symbol">
          <line x1="340" y1="1090" x2="340" y2="1170" />
          <line x1="326" y1="1090" x2="326" y2="1170" />
          <path d="M321 1102L326 1090L331 1102M321 1158L326 1170L331 1158" />
        </g>
        <g className="architect-terrace-symbol">
          <line x1="340" y1="430" x2="340" y2="790" />
          <line x1="324" y1="430" x2="324" y2="790" />
          <line x1="324" y1="520" x2="340" y2="520" />
          <line x1="324" y1="610" x2="340" y2="610" />
          <line x1="324" y1="700" x2="340" y2="700" />
        </g>

        <g className="architect-dimension-set">
          <Dimension x1={0} y1={-72} x2={340} y2={-72} label="340" />
          <Dimension x1={340} y1={-72} x2={760} y2={-72} label="420" />
          <Dimension x1={760} y1={-72} x2={1140} y2={-72} label="380" />
          <Dimension x1={0} y1={-110} x2={1140} y2={-110} label="1140 OVERALL" />
          <Dimension x1={-46} y1={0} x2={-46} y2={830} label="830" vertical />
          <Dimension x1={-46} y1={830} x2={-46} y2={1210} label="380" vertical />
          <Dimension x1={-78} y1={0} x2={-78} y2={1210} label="1210 OVERALL" vertical />
          <Dimension x1={1182} y1={0} x2={1182} y2={500} label="500" vertical />
          <Dimension x1={1182} y1={500} x2={1182} y2={1210} label="710" vertical />
        </g>

        <g className="architect-north" transform="translate(1285 110)">
          <text x="0" y="-34">PLAN NORTH</text>
          <path d="M0 68V-8M0-8L-13 22M0-8L13 22" />
          <circle cx="0" cy="68" r="8" />
        </g>

        <g className="architect-legend" transform="translate(1240 265)">
          <text className="architect-block-title" x="0" y="0">DRAWING KEY</text>
          <line x1="0" y1="34" x2="54" y2="34" className="legend-exterior" />
          <text x="72" y="40">20 cm exterior wall</text>
          <line x1="0" y1="72" x2="54" y2="72" className="legend-interior" />
          <text x="72" y="78">10 cm partition</text>
          <line x1="0" y1="110" x2="54" y2="110" className="legend-window" />
          <text x="72" y="116">Accepted opening</text>
          <rect x="0" y="139" width="54" height="24" className="legend-remodel" />
          <text x="72" y="158">Remodel atmosphere</text>
        </g>

        <g className="architect-scale" transform="translate(1240 520)">
          <text className="architect-block-title" x="0" y="0">GRAPHIC SCALE</text>
          <rect x="0" y="24" width="50" height="18" />
          <rect x="50" y="24" width="50" height="18" className="is-light" />
          <rect x="100" y="24" width="100" height="18" />
          <text x="0" y="64">0</text>
          <text x="48" y="64">0.5</text>
          <text x="96" y="64">1</text>
          <text x="194" y="64">2 m</text>
        </g>

        <g className="architect-title-block" transform="translate(1218 760)">
          <rect width="330" height="450" />
          <line x1="0" y1="92" x2="330" y2="92" />
          <line x1="0" y1="252" x2="330" y2="252" />
          <line x1="0" y1="354" x2="330" y2="354" />
          <text x="24" y="35" className="architect-studio">VILLA NEHAMA</text>
          <text x="24" y="67" className="architect-sheet-name">MEASURED MASTER PLAN</text>
          <text x="24" y="130" className="architect-ai-label">AI-ASSISTED SVG</text>
          <text x="24" y="166">Architectural reconstruction from</text>
          <text x="24" y="191">the photographed measured drawing.</text>
          <text x="24" y="225">Vector geometry · editable paths</text>
          <text x="24" y="290">SOURCE  measured-plan.jpeg</text>
          <text x="24" y="320">UNITS   centimetres</text>
          <text x="24" y="390">STATUS  design-audit trace</text>
          <text x="24" y="420">NOT FOR CONSTRUCTION</text>
          <text x="278" y="420" className="architect-revision">A-01</text>
        </g>
      </svg>
    </div>
  );
}
