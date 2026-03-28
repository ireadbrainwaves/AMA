#!/usr/bin/env node
/**
 * STATUS — Check all jobs in manifest. No waiting, no loops.
 *
 * Usage:
 *   node pipeline/status.mjs              # check everything
 *   node pipeline/status.mjs --type objects
 */
import fs from 'fs';
import path from 'path';
import { mcp, getText } from './api.mjs';

const MANIFEST_PATH = path.resolve('pipeline/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

const OUTPUT_DIRS = {
  objects: path.resolve('pipeline/output/objects'),
  tilesets: path.resolve('pipeline/output/tilesets'),
};

const filterType = process.argv.includes('--type') ? process.argv[process.argv.indexOf('--type') + 1] : null;

let total = 0, done = 0, processing = 0, failed = 0, downloaded = 0;

for (const [type, jobs] of Object.entries(manifest)) {
  if (type === 'downloaded') continue;
  if (filterType && type !== filterType) continue;

  const getTool = type === 'objects' ? 'get_map_object' : 'get_topdown_tileset';
  const idKey = type === 'objects' ? 'object_id' : 'tileset_id';
  const outDir = OUTPUT_DIRS[type];

  console.log(`\n── ${type.toUpperCase()} ──`);

  for (const [name, job] of Object.entries(jobs)) {
    if (!job?.id) continue;
    total++;

    // Check if already downloaded
    const pngPath = path.join(outDir, `${name}.png`);
    if (fs.existsSync(pngPath)) {
      const size = fs.statSync(pngPath).size;
      console.log(`  ✓  ${name.padEnd(18)} downloaded (${(size / 1024).toFixed(1)}KB)`);
      downloaded++;
      done++;
      manifest[type][name].status = 'downloaded';
      continue;
    }

    // Query API
    try {
      const r = await mcp(getTool, { [idKey]: job.id });
      const t = getText(r);

      if (t.includes('✅') || t.includes('Completed') || t.includes('completed')) {
        console.log(`  ✓  ${name.padEnd(18)} READY to download`);
        manifest[type][name].status = 'completed';

        // Extract download URL
        const urls = [...t.matchAll(/https:\/\/[^\s")\]>]+\/(download|image)[^\s")\]>]*/g)].map(m => m[0]);
        if (urls.length) {
          manifest[type][name].url = urls[0];
        } else {
          const endpoint = type === 'objects' ? 'map-objects' : 'tilesets';
          manifest[type][name].url = `https://api.pixellab.ai/mcp/${endpoint}/${job.id}/download`;
        }

        done++;
      } else if (t.includes('failed') || t.includes('Failed')) {
        const err = t.includes('429') ? '429 rate limit' : 'generation error';
        console.log(`  ✗  ${name.padEnd(18)} FAILED (${err})`);
        manifest[type][name].status = 'failed';
        failed++;
      } else {
        const pct = t.match(/(\d+)%/);
        console.log(`  ⏳ ${name.padEnd(18)} processing${pct ? ` (${pct[1]}%)` : ''}`);
        manifest[type][name].status = 'processing';
        processing++;
      }
    } catch (e) {
      console.log(`  ?  ${name.padEnd(18)} error: ${e.message}`);
    }
  }
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

console.log(`\n── SUMMARY ──`);
console.log(`  Total: ${total}  Ready: ${done}  Processing: ${processing}  Failed: ${failed}  Downloaded: ${downloaded}`);
if (failed > 0) console.log(`  Tip: delete failed jobs from manifest.json and re-run submit.mjs`);
if (done > downloaded) console.log(`  Tip: run download.mjs to grab completed files`);
