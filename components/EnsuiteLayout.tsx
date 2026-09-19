import { ensuiteProposal as plan } from "@/data/ensuite";

/** Same centimetre schedule as the 3D fit-out; available without WebGL. */
export function EnsuiteLayout() {
  const { shower, vanity, wc, cistern } = plan;
  return <details className="ensuite-layout" open>
    <summary>Proposed fixture layout</summary>
    <svg viewBox="315 995 200 245" role="img" aria-label="Ensuite proposal: 150 by 190 centimetres, 80 by 80 corner shower, 48 by 32 washbasin, compact toilet and unchanged sliding entry" xmlns="http://www.w3.org/2000/svg">
      <rect x="315" y="995" width="200" height="245" fill="#faf7ef" />
      <g stroke="#4b5046" strokeWidth="0.7" fill="none">
        <path d="M340 1010H490M340 1006V1014M490 1006V1014M502 1020V1210M498 1020H506M498 1210H506" />
      </g>
      <g fontFamily="sans-serif" fontSize="7" fill="#4b5046" textAnchor="middle">
        <text x="415" y="1006">150 cm</text>
        <text x="510" y="1115" transform="rotate(90 510 1115)">190 cm</text>
      </g>
      <path d="M340 1020H490V1210H340Z" fill="#e9e0d0" stroke="#807968" strokeWidth="10" />
      <path d="M335 1210H495" stroke="#807968" strokeWidth="20" />
      <path d={`M340 ${plan.door.fromZ}V${plan.door.toZ}`} stroke="#faf7ef" strokeWidth="12" />
      <path d={`M336 ${plan.door.fromZ}V${plan.door.toZ}`} stroke="#777d63" strokeWidth="1" />
      <path d="M380 1210H450" stroke="#bfd0c8" strokeWidth="5" />
      <rect x={shower.x - shower.width / 2} y={shower.z - shower.depth / 2} width={shower.width} height={shower.depth} rx="2" fill="#d0ddd7" stroke="#6e8982" />
      <path d="M404 1028V1067M443 1106H482" fill="none" stroke="#547a77" strokeWidth="2" />
      <path d="M426 1090L407 1110" stroke="#547a77" strokeDasharray="2 2" />
      <rect x={vanity.x - vanity.width / 2} y={vanity.z - vanity.depth / 2} width={vanity.width} height={vanity.depth} rx="2" fill="#c5ac88" stroke="#8e7759" />
      <ellipse cx={vanity.x} cy={vanity.z + 2} rx="17" ry="10" fill="#fffdf6" stroke="#8e7759" />
      <rect x={cistern.x - cistern.width / 2} y={cistern.z - cistern.depth / 2} width={cistern.width} height={cistern.depth} fill="#d2c6b2" stroke="#918572" />
      <path d={`M${wc.wallX} ${wc.z - 18}H${wc.wallX - 28}A20 18 0 0 0 ${wc.wallX - 28} ${wc.z + 18}H${wc.wallX}Z`} fill="#fffdf6" stroke="#918572" />
      <ellipse cx={wc.wallX - 28} cy={wc.z} rx="15" ry="11" fill="#e9e5db" stroke="#aaa08f" />
      <path d="M345 1188H421M345 1185V1191M421 1185V1191" fill="none" stroke="#807968" strokeWidth="0.6" />
      <g fontFamily="sans-serif" fontSize="6.4" fill="#38433b" textAnchor="middle">
        <text x={shower.x} y="1055">SHOWER</text><text x={shower.x} y="1065">80 × 80</text>
        <text x={vanity.x} y="1073">WASH 48 × 32</text>
        <text x="385" y="1140">SLIDING ENTRY</text><text x="385" y="1150">80 cm</text>
        <text x="383" y="1183">76 cm in front of WC</text>
        <text x="415" y="1230">PROPOSAL · DIMENSIONS IN CM</text>
      </g>
    </svg>
    <p>Compact shower, washbasin and toilet. Keep the sliding entry and window. Final drainage, waterproofing and fixture installation need a site check.</p>
    <a href="/references/ensuite-layout.svg" download>Download layout ↗</a>
  </details>;
}
