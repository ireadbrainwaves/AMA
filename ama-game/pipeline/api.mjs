/**
 * Shared PixelLab MCP API helper.
 * Single function, no state, no loops, no waiting.
 */
import https from 'https';
import fs from 'fs';

const API_KEY = 'd9a30b87-ef59-478f-9e79-18b835038853';

export function mcp(toolName, args) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      id: Date.now(),
      params: { name: toolName, arguments: args },
    });
    const req = https.request({
      hostname: 'api.pixellab.ai',
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        for (const line of d.split('\n').reverse()) {
          if (line.startsWith('data:')) {
            try {
              const p = JSON.parse(line.slice(5).trim());
              if (p.result) return resolve(p);
            } catch {}
          }
        }
        resolve(null);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export function getText(r) {
  return r?.result?.content?.map(c => c.text).join('\n') || '';
}

export function findUUIDs(t) {
  return [...t.matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)].map(m => m[0]);
}

export function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const go = (u, withAuth) => {
      const parsed = new URL(u);
      const headers = withAuth ? { Authorization: `Bearer ${API_KEY}` } : {};
      const opts = { hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers };
      https.get(opts, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return go(res.headers.location, false);
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          if (buf.length < 100) return reject(new Error(`Too small: ${buf.length} bytes`));
          fs.writeFileSync(dest, buf);
          resolve(buf.length);
        });
      }).on('error', reject);
    };
    go(url, true);
  });
}
