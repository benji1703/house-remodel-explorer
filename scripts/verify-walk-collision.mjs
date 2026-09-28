import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Compile only the pure navigation modules; no DOM, renderer or test dependency.
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'house-walk-'));
try {
  for (const name of ['data/house', 'data/structuralWalls', 'data/walkthrough', 'lib/walkCollision']) {
    const result = ts.transpileModule(fs.readFileSync(`${name}.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
    const destination = path.join(temporary, `${name}.mjs`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, result.outputText.replace(/from "(\.[^"]+)"/g, 'from "$1.mjs"'));
  }
  const { canWalkAt, moveWalkPosition } = await import(pathToFileURL(path.join(temporary, 'lib/walkCollision.mjs')));
  const { walkStarts } = await import(pathToFileURL(path.join(temporary, 'data/walkthrough.mjs')));
  for (const [zone, start] of Object.entries(walkStarts)) assert.ok(canWalkAt(...start.positionCm.map(n => n / 100), true, {}), `${zone}: spawn clears walls`);
  assert.equal(canWalkAt(7.6, 6.8, true, {}), true, 'Open bedroom doorway');
  assert.equal(canWalkAt(7.6, 6.8, false, {}), false, 'Closed bedroom doorway');
  assert.equal(canWalkAt(7.6, 6.8, false, { 'int-0-0': true }), true, 'Individual door overrides global state');
  assert.equal(canWalkAt(7.6, 7.4, true, {}), false, 'Solid partition');
  assert.equal(canWalkAt(7.6, 6.4, true, {}), false, 'Jamb includes body radius');
  assert.equal(canWalkAt(3.4, 6.1, true, {}), false, 'Fixed full-height glazing');
  assert.equal(canWalkAt(-.1, 9, true, {}), false, 'Cannot leave measured floor');
  const allowed = (x, z) => canWalkAt(x, z, true, {});
  const [x] = moveWalkPosition(6.5, 7.7, 20, 0, allowed);
  assert.ok(x < 7.4, 'Large frame movement cannot tunnel through wall');
  const [, z] = moveWalkPosition(7.36, 7.7, .3, .3, allowed);
  assert.ok(z > 7.9, 'Movement slides along wall');
  assert.equal(canWalkAt(6, 4, true, {}, [{ minX: 5.5, maxX: 6.5, minZ: 3.5, maxZ: 4.5 }]), false, 'Furniture blocks movement');
  console.log('Passed: seven spawns, doors, overrides, jambs, glazing, envelope, tunnelling, sliding and furniture.');
} finally { fs.rmSync(temporary, { recursive: true, force: true }); }
