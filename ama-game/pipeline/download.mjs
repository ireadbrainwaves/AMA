#!/usr/bin/env node
/**
 * DOWNLOAD — Grab completed jobs that aren't on disk yet.
 *
 * Usage:
 *   node pipeline/download.mjs              # download everything ready
 *   node pipeline/download.mjs npc_helix    # download one specific job
 *   node pipeline/download.mjs --copy       # also copy to game src/assets
 *
 * Reads manifest.json for URLs. If no URL stored, queries API first.
 * Skips anything already downloaded.
 */
import fs from 'fs';
import path from 'path';
import { mcp, getText, downloadFile } from './api.mjs';

const MANIFEST_PATH = path.resolve('pipeline/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

const OUTPUT_DIRS = {
  objects: path.resolve('pipeline/output/objects'),
  tilesets: path.resolve('pipeline/output/tilesets'),
  sprites: path.resolve('pipeline/output/species'),
};

const GAME_DIRS = {
  objects: path.resolve('src/assets/hub/objects'),
  tilesets: path.resolve('src/assets/hub/tilesets'),
  sprites: path.resolve('src/assets/sprites'),
};

const args = process.argv.slice(2);
const filterName = args.find(a => !a.startsWith('-'));
const doCopy = args.includes('--copy');

let grabbed = 0, skipped = 0, failed = 0;

for (const [type, jobs] of Object.entries(manifest)) {
  if (type === 'downloaded') continue;

  const getTool = type === 'objects' ? 'get_map_object' : 'get_topdown_tileset';
  const idKey = type === 'objects' ? 'object_id' : 'tileset_id';
  const outDir = OUTPUT_DIRS[type];
  fs.mkdirSync(outDir, { recursive: true });

  for (const [name, job] of Object.entries(jobs)) {
    if (!job?.id) continue;
    if (filterName && name !== filterName) continue;

    const pngPath = path.join(outDir, `${name}.png`);

    // Skip if already on disk
    if (fs.existsSync(pngPath) && fs.statSync(pngPath).size > 100) {
      console.log(`SKIP  ${name} — already downloaded`);
      skipped++;
      continue;
    }

    // Get URL — try manifest, then construct from ID, then query API
    let url = job.url;
    if (!url && (job.status === 'completed' || job.status === 'submitted')) {
      // Check if job is done first
      try {
        const r = await mcp(getTool, { [idKey]: job.id });
        const t = getText(r);
        if (t.includes('failed') || t.includes('Failed')) {
          console.log(`FAIL  ${name} — job failed`);
          manifest[type][name].status = 'failed';
          failed++;
          continue;
        }
        if (!t.includes('✅') && !t.includes('completed') && !t.includes('Completed')) {
          const pct = t.match(/(\d+)%/);
          console.log(`WAIT  ${name} — still processing${pct ? ` (${pct[1]}%)` : ''}`);
          continue;
        }
        // Try to extract URL from response
        const urls = [...t.matchAll(/https:\/\/[^\s")\]>]+\.(png|image)[^\s")\]>]*/g)].map(m => m[0]);
        if (urls.length) {
          url = urls[0];
        } else {
          // Construct URL from API pattern
          if (type === 'objects') {
            url = `https://api.pixellab.ai/mcp/map-objects/${job.id}/download`;
          } else {
            url = `https://api.pixellab.ai/mcp/tilesets/${job.id}/image`;
          }
        }
        manifest[type][name].url = url;
      } catch (e) {
        console.log(`ERR   ${name} — ${e.message}`);
        failed++;
        continue;
      }
    }
    if (!url) {
      if (job.status === 'failed') { console.log(`SKIP  ${name} — failed, resubmit needed`); failed++; }
      else console.log(`WAIT  ${name} — no URL yet`);
      continue;
    }

    // Download
    try {
      const bytes = await downloadFile(url, pngPath);
      console.log(`OK    ${name} — ${(bytes / 1024).toFixed(1)}KB`);
      manifest[type][name].status = 'downloaded';
      grabbed++;

      // Copy to game assets if requested
      if (doCopy) {
        const gameDir = GAME_DIRS[type];
        fs.mkdirSync(gameDir, { recursive: true });
        fs.copyFileSync(pngPath, path.join(gameDir, `${name}.png`));
        console.log(`      → copied to ${gameDir}`);
      }
    } catch (e) {
      console.log(`FAIL  ${name} — download error: ${e.message}`);
      failed++;
    }
  }
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
console.log(`\nDone: ${grabbed} downloaded, ${skipped} skipped, ${failed} failed`);
