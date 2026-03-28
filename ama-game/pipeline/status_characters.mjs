#!/usr/bin/env node
/**
 * STATUS CHARACTERS — Check all character jobs. No waiting.
 */
import fs from 'fs';
import path from 'path';
import { mcp, getText } from './api.mjs';

const MANIFEST_PATH = path.resolve('pipeline/character_manifest.json');
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); } catch { console.log('No manifest yet.'); process.exit(0); }

const OUTPUT_DIR = path.resolve('pipeline/output/characters');

const filter = process.argv.find(a => !a.startsWith('-') && a !== process.argv[1] && a !== process.argv[0]);
let total = 0, done = 0, processing = 0, failed = 0, downloaded = 0;

for (const [key, job] of Object.entries(manifest)) {
  if (filter && !key.startsWith(filter)) continue;
  if (!job?.id) continue;
  total++;

  // Check if downloaded
  const dir = path.join(OUTPUT_DIR, key);
  if (fs.existsSync(path.join(dir, 'south.png'))) {
    downloaded++; done++;
    manifest[key].status = 'downloaded';
    continue;
  }

  try {
    const r = await mcp('get_character', { character_id: job.id });
    const t = getText(r);
    if (t.includes('✅')) {
      console.log(`  ✓  ${key.padEnd(35)} READY`);
      manifest[key].status = 'completed';
      done++;
    } else if (t.includes('failed') || t.includes('Failed')) {
      const err = t.includes('429') ? '429' : 'error';
      console.log(`  ✗  ${key.padEnd(35)} FAILED (${err})`);
      manifest[key].status = 'failed';
      failed++;
    } else {
      const pct = t.match(/(\d+)%/);
      console.log(`  ⏳ ${key.padEnd(35)} ${pct ? pct[1] + '%' : 'processing'}`);
      manifest[key].status = 'processing';
      processing++;
    }
  } catch (e) {
    console.log(`  ?  ${key.padEnd(35)} ${e.message}`);
  }
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
console.log(`\n  Total: ${total}  Ready: ${done}  Processing: ${processing}  Failed: ${failed}  Downloaded: ${downloaded}`);
