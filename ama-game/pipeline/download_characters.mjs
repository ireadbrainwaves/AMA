#!/usr/bin/env node
/**
 * DOWNLOAD CHARACTERS — Grab completed character sprites.
 * Downloads 4 direction PNGs (south/north/east/west) per character.
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import { mcp, getText } from './api.mjs';

const MANIFEST_PATH = path.resolve('pipeline/character_manifest.json');
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); } catch { process.exit(0); }

const OUTPUT_DIR = path.resolve('pipeline/output/characters');
const GAME_DIR = path.resolve('src/assets/sprites/characters');

const filter = process.argv.find(a => !a.startsWith('-') && a !== process.argv[1] && a !== process.argv[0]);
const doCopy = process.argv.includes('--copy');

function dl(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.length < 100) return reject(new Error('Too small'));
        fs.writeFileSync(dest, buf);
        resolve(buf.length);
      });
    }).on('error', reject);
  });
}

let grabbed = 0, skipped = 0, failed = 0;

for (const [key, job] of Object.entries(manifest)) {
  if (filter && !key.startsWith(filter)) continue;
  if (!job?.id) continue;

  const dir = path.join(OUTPUT_DIR, key);
  if (fs.existsSync(path.join(dir, 'south.png')) && fs.statSync(path.join(dir, 'south.png')).size > 100) {
    skipped++;
    continue;
  }

  // Get character data for download URLs
  try {
    const r = await mcp('get_character', { character_id: job.id, include_preview: true });
    const t = getText(r);

    if (!t.includes('✅')) {
      if (t.includes('failed')) { console.log(`FAIL  ${key}`); failed++; }
      continue;
    }

    // Extract backblaze URLs
    const urls = [...t.matchAll(/https:\/\/backblaze[^\s")\]>]+rotations\/(\w+)\.png[^\s")\]>]*/g)];
    if (!urls.length) { console.log(`SKIP  ${key} — no URLs`); continue; }

    fs.mkdirSync(dir, { recursive: true });
    let ok = true;
    for (const match of urls) {
      const url = match[0];
      const direction = match[1];
      try {
        await dl(url, path.join(dir, `${direction}.png`));
      } catch (e) {
        console.log(`FAIL  ${key}/${direction} — ${e.message}`);
        ok = false;
      }
    }

    if (ok) {
      console.log(`OK    ${key} (${urls.length} directions)`);
      manifest[key].status = 'downloaded';
      grabbed++;

      if (doCopy) {
        const gameSubdir = path.join(GAME_DIR, key);
        fs.mkdirSync(gameSubdir, { recursive: true });
        for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.png'))) {
          fs.copyFileSync(path.join(dir, f), path.join(gameSubdir, f));
        }
        console.log(`      → copied to ${gameSubdir}`);
      }
    }
  } catch (e) {
    console.log(`ERR   ${key} — ${e.message}`);
    failed++;
  }
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
console.log(`\nDone: ${grabbed} downloaded, ${skipped} skipped, ${failed} failed`);
