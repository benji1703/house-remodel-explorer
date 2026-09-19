import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ensuiteProposal as p } from '../data/ensuite.ts';
import { house } from '../data/house.ts';

const box = ({ x, z, width, depth }) => ({ minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 });
const fixtures = {
  shower: box(p.shower), washbasin: box(p.vanity), cistern: box(p.cistern),
  toilet: { minX: p.wc.wallX - p.wc.projection, maxX: p.wc.wallX, minZ: p.wc.z - p.wc.width / 2, maxZ: p.wc.z + p.wc.width / 2 },
};
const overlap = (a, b) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
for (const [name, b] of Object.entries(fixtures)) {
  assert.ok(b.minX >= p.room.minX && b.maxX <= p.room.maxX && b.minZ >= p.room.minZ && b.maxZ <= p.room.maxZ, `${name} stays within the finished wall faces`);
}
const entries = Object.entries(fixtures);
for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
  assert.ok(!overlap(entries[i][1], entries[j][1]), `${entries[i][0]} and ${entries[j][0]} do not intersect`);
}
assert.equal(fixtures.toilet.minX - p.room.minX, p.wcFrontClearance);
const entryAisle = { minX: p.room.minX, maxX: 403, minZ: p.door.fromZ, maxZ: p.door.toZ };
for (const [name, b] of entries) assert.ok(!overlap(entryAisle, b), `${name} clears the sliding entry aisle`);

// Rectify the existing trace to four visible scan anchors for a source overlay.
// The scan remains untouched; amber is the accepted working shell, teal is the
// proposed fit-out. This is visual checking, not a new survey or approval.
const anchors = [[340, 0, 272, 116], [760, 0, 425, 111], [1140, 1210, 576, 555], [0, 1210, 141, 570]];
const rows = anchors.flatMap(([x, z, u, v]) => [[x, z, 1, 0, 0, 0, -u * x, -u * z, u], [0, 0, 0, x, z, 1, -v * x, -v * z, v]]);
for (let col = 0; col < 8; col++) {
  let pivot = col;
  for (let row = col + 1; row < 8; row++) if (Math.abs(rows[row][col]) > Math.abs(rows[pivot][col])) pivot = row;
  [rows[col], rows[pivot]] = [rows[pivot], rows[col]];
  const divisor = rows[col][col]; rows[col] = rows[col].map(n => n / divisor);
  for (let row = 0; row < 8; row++) if (row !== col) { const factor = rows[row][col]; rows[row] = rows[row].map((n, i) => n - factor * rows[col][i]); }
}
const h = rows.map(r => r[8]);
const project = ([x, z]) => {
  const d = h[6] * x + h[7] * z + 1;
  return [(h[0] * x + h[1] * z + h[2]) / d, (h[3] * x + h[4] * z + h[5]) / d];
};
const footprint = house.footprint.map(([x, z]) => [x * 100, z * 100]);
const points = (pts, transform = v => v) => pts.map(v => transform(v).map(n => n.toFixed(2)).join(',')).join(' ');
const rectPoints = b => [[b.minX,b.minZ],[b.maxX,b.minZ],[b.maxX,b.maxZ],[b.minX,b.maxZ]];
const photo = fs.readFileSync('public/references/measured-plan.jpeg').toString('base64');
const proposalPolygons = (transform, stroke) => Object.entries(fixtures).map(([name, b]) => `<polygon points="${points(rectPoints(b), transform)}" fill="#68a897" fill-opacity="0.45" stroke="#28695e" stroke-width="${stroke}"><title>${name}</title></polygon>`).join('');
const sourceProof = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="780" viewBox="0 0 1440 780">
<rect width="1440" height="780" fill="#faf7ef"/><g font-family="sans-serif" fill="#354039"><text x="32" y="38" font-size="24">Ensuite fit-out · source and orthographic check</text><text x="32" y="66" font-size="14">Amber: accepted working shell. Teal: proposed fixtures. Measured wall envelope and openings unchanged.</text></g>
<g transform="translate(16 82)"><image href="data:image/jpeg;base64,${photo}" width="756" height="676"/><polygon points="${points(footprint, project)}" fill="none" stroke="#f19b22" stroke-width="2"/>${proposalPolygons(project,1)}<polygon points="${points([[340,1020],[490,1020],[490,1210],[340,1210]],project)}" fill="none" stroke="#28695e" stroke-width="1.5"/></g>
<g transform="translate(830 95) scale(.48)"><polygon points="${points(footprint)}" fill="#e9e1d2" stroke="#b97926" stroke-width="12"/><path d="M760 500V1210M760 855H1140M340 830V1210M340 1020H760M490 1020V1210" fill="none" stroke="#847b6d" stroke-width="10"/>${proposalPolygons(v=>v,3)}<path d="M340 1090V1170" stroke="#faf7ef" stroke-width="12"/><text x="415" y="1280" text-anchor="middle" font-size="24" font-family="sans-serif" fill="#28695e">150 × 190 cm ensuite</text></g>
<g font-family="sans-serif" font-size="13" fill="#596055"><text x="810" y="728">Four scan anchors register the photographed plan; residual skew remains.</text><text x="810" y="751">The ensuite is an accepted remodel partition, not an original surveyed room.</text></g></svg>`;
const dir = 'artifacts/design-review-2026-09-18';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(`${dir}/source-overlay.svg`, sourceProof);
fs.writeFileSync(`${dir}/layout-check.json`, JSON.stringify({ status: 'passed', units:'cm', fixtures, wcFrontClearance: p.wcFrontClearance, entryAisle, note:'Geometric fit only; installation and site survey still required.' }, null, 2));
console.log('PASS: fixture bounds, non-overlap, sliding entry aisle and 76 cm WC approach. Source overlay written.');
