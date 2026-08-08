#!/usr/bin/env node
// Downloads CC0 glTF furniture models from Poly Haven into public/props/<slug>/.
// Usage: node scripts/fetch-props.mjs
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

const MANIFEST_PATH = new URL("./props-manifest.json", import.meta.url);
const PUBLIC_PROPS_DIR = new URL("../public/props/", import.meta.url);

async function exists(fileUrl) {
  try {
    await access(fileUrl);
    return true;
  } catch {
    return false;
  }
}

async function download(url, destUrl) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(destUrl.pathname), { recursive: true });
  await writeFile(destUrl, buf);
}

async function fetchSlug(slug) {
  const filesRes = await fetch(`https://api.polyhaven.com/files/${slug}`);
  if (!filesRes.ok) throw new Error(`files API for ${slug} -> ${filesRes.status}`);
  const files = await filesRes.json();
  const gltf1k = files.gltf?.["1k"]?.gltf;
  if (!gltf1k) throw new Error(`${slug}: no 1k gltf entry`);

  const slugDir = new URL(`${slug}/`, PUBLIC_PROPS_DIR);
  const mainDest = new URL(path.basename(gltf1k.url), slugDir);
  if (!(await exists(mainDest))) {
    console.log(`  ${slug}: main gltf`);
    await download(gltf1k.url, mainDest);
  }

  for (const [relPath, meta] of Object.entries(gltf1k.include ?? {})) {
    const dest = new URL(relPath, slugDir);
    if (await exists(dest)) continue;
    console.log(`  ${slug}: ${relPath}`);
    await download(meta.url, dest);
  }
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  let failed = 0;
  for (const { slug } of manifest) {
    console.log(`Fetching ${slug}...`);
    try {
      await fetchSlug(slug);
    } catch (err) {
      failed += 1;
      console.error(`  FAILED: ${err.message}`);
    }
  }
  if (failed > 0) {
    console.error(`${failed} model(s) failed to download.`);
    process.exit(1);
  }
  console.log("All props fetched.");
}

main();
