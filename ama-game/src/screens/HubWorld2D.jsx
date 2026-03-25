import { useRef, useEffect, useState, useCallback } from 'react';

import workshopArt from '../assets/hub/workshop_sq.png';
import mutlabArt from '../assets/hub/mutlab_sq.png';
import cmdpostArt from '../assets/hub/cmdpost_sq.png';
import galleryArt from '../assets/hub/gallery_sq.png';
import corridorArt from '../assets/hub/corridor_sq.png';
import floorTileArt from '../assets/hub/floor_64.png';
import terminalArt from '../assets/hub/terminal_sq.png';

/* ═══════════════════════════════════════════════════════
   THE ARK — ORBITAL STAGING AREA
   Single-room hub with offscreen light-map system

   Render pipeline:
   1. Clear → floor pattern → AI art backgrounds (high opacity)
   2. Structural tiles (walls, grates, LEDs)
   3. Entities (doors, NPCs, terminals, player)
   4. LIGHT MAP (offscreen canvas, multiply blend — THE KEY)
   5. Additive glow bloom (lighter blend)
   6. Foreground overlay pipes
   7. Particles (additive)
   8. Post-processing (vignette + color grade)
   ═══════════════════════════════════════════════════════ */

const TILE = 24;
const COLS = 26;
const ROWS = 20;
const CANVAS_W = COLS * TILE;
const CANVAS_H = ROWS * TILE;
const PLAYER_SPEED = 2.5;

const W = 0, F = 1, P = 5, G = 6, L = 7;

/* ─── Hex → RGB utility ─── */
function hexRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/* ═══ TILEMAP ═══
   ORGANIZED LAYOUT — T-shaped with clear wings:
   ┌────────────────────────────┐
   │  ARENA 1 │ ARENA 2 │ A3 │ A4  │  (row 2-3: doors)
   │  ═══ GALLERY VIEWING ═══  │  (row 2-4: gallery art)
   ├────────────────────────────┤
   │          │ TOURNEY │ CMD  │  (row 5-7: upper level)
   │          │  HOLO   │ POST │
   ├════════════════════════════┤
   │  ═══ MAIN CORRIDOR ═══    │  (row 8-10: LED spine)
   ├──────────┼────────┼───────┤
   │ MUTATION │ CENTER │ TECH  │  (row 11-15: wings)
   │   LAB    │  PATH  │ SHOP  │
   │ (Helix)  │        │ (Ark) │
   ├──────────┼────────┼───────┤
   │  CODEX   │ ENTRY  │SUPPLY │  (row 16-18: bottom)
   └────────────────────────────┘
*/
function buildMap() {
  const m = Array.from({ length: ROWS }, () => Array(COLS).fill(F));

  // Hull walls (outer boundary)
  for (let c = 0; c < COLS; c++) { m[0][c] = W; m[ROWS - 1][c] = W; }
  for (let r = 0; r < ROWS; r++) { m[r][0] = W; m[r][COLS - 1] = W; }

  // Inner top wall (row 1) with pipe accents
  for (let c = 1; c < COLS - 1; c++) m[1][c] = W;
  for (let c = 4; c < COLS - 4; c += 4) m[1][c] = P;

  // Arena viewing zone (rows 2-3) — grate floor with support pillars
  for (const pc of [1, 7, 19, COLS - 2]) { m[2][pc] = W; m[3][pc] = W; }
  for (let c = 2; c < COLS - 2; c++) {
    if (m[2][c] === F) m[2][c] = G;
    if (m[3][c] === F) m[3][c] = G;
  }

  // Gallery walkway (row 4) — full width grate
  for (let c = 2; c < COLS - 2; c++) m[4][c] = G;

  // ─── WING DIVIDERS (rows 11-17) ───
  // Left wing wall: col 11
  for (let r = 11; r <= 17; r++) m[r][11] = W;
  // Right wing wall: col 15
  for (let r = 11; r <= 17; r++) m[r][15] = W;
  // Wide doorways (3 tiles open) for easy flow
  m[11][11] = G; m[11][15] = G;  // grate at top
  m[12][11] = F; m[12][15] = F;  // open
  m[13][11] = F; m[13][15] = F;  // open (NPC row)
  m[14][11] = L; m[14][15] = L;  // LED accent
  m[15][11] = F; m[15][15] = F;  // open
  m[17][11] = G; m[17][15] = G;  // grate at bottom

  // ─── CENTRAL CORRIDOR (rows 8-10) — the main horizontal spine ───
  for (let c = 2; c < COLS - 2; c++) {
    m[8][c] = G; m[9][c] = L; m[10][c] = G;
  }

  // ─── UPPER LEVEL grates (rows 5-7) ───
  // Left side upper hallway
  for (let c = 2; c <= 9; c++) for (let r = 5; r <= 7; r++) m[r][c] = G;
  // Tournament area floor (center)
  for (let c = 10; c <= 15; c++) for (let r = 5; r <= 7; r++) m[r][c] = G;
  // Command post floor (right side)
  for (let c = 16; c <= 23; c++) for (let r = 5; r <= 7; r++) m[r][c] = G;

  // ─── LEFT WING grates (mutation lab, rows 11-16) ───
  for (let c = 2; c <= 10; c++) for (let r = 11; r <= 16; r++) m[r][c] = G;
  // Side wall pipes
  for (let r = 12; r <= 16; r++) m[r][1] = P;

  // ─── RIGHT WING grates (tech workshop, rows 11-16) ───
  for (let c = 16; c <= 23; c++) for (let r = 11; r <= 16; r++) m[r][c] = G;
  // Side wall pipes
  for (let r = 12; r <= 16; r++) m[r][COLS - 2] = P;

  // ─── BOTTOM (row 18) — inner wall with entry gap ───
  for (let c = 1; c < COLS - 1; c++) m[18][c] = W;
  m[18][12] = F; m[18][13] = F; // entry door
  m[18][11] = L; m[18][14] = L; // entry lights

  // ─── ACCENT LEDs scattered in wings ───
  m[6][16] = L; m[7][23] = L;   // command post
  m[12][3] = L; m[14][9] = L;   // left wing
  m[12][22] = L; m[14][17] = L; // right wing
  m[16][5] = L; m[16][21] = L;  // bottom corners

  return m;
}

const TILEMAP = buildMap();

/* ─── Room art zones — ORGANIZED, non-overlapping ─── */
const ROOM_ZONES = [
  // Top: Gallery viewing (full width across arena doors)
  { img: 'gallery',  col: 2,  row: 2,  colSpan: 22, rowSpan: 3,  opacity: 0.75 },
  // Upper level: Corridor art fills the walkway between gallery and main corridor
  { img: 'corridor', col: 2,  row: 5,  colSpan: 8,  rowSpan: 3,  opacity: 0.55 },
  // Middle: Corridor spine (full width LED strip)
  { img: 'corridor', col: 2,  row: 8,  colSpan: 22, rowSpan: 3,  opacity: 0.55 },
  // Upper right: Command post (Vex's area)
  { img: 'cmdpost',  col: 16, row: 5,  colSpan: 8,  rowSpan: 3,  opacity: 0.70 },
  // Upper center: Terminal display (tournament area)
  { img: 'terminal', col: 10, row: 5,  colSpan: 6,  rowSpan: 3,  opacity: 0.50 },
  // Left wing: Mutation lab
  { img: 'mutlab',   col: 2,  row: 11, colSpan: 9,  rowSpan: 6,  opacity: 0.75 },
  // Right wing: Tech workshop
  { img: 'workshop', col: 16, row: 11, colSpan: 8,  rowSpan: 6,  opacity: 0.75 },
];

/* ─── Interactables — SYMMETRICAL wing placement ─── */
const INTERACTABLES = {
  doors: [
    { col: 4,  row: 2, id: 0, label: 'ARENA 1' },
    { col: 10, row: 2, id: 1, label: 'ARENA 2' },
    { col: 16, row: 2, id: 2, label: 'ARENA 3' },
    { col: 22, row: 2, id: 3, label: 'ARENA 4' },
  ],
  npcs: [
    // Left wing — Dr. Helix (biology/mutations)
    { col: 6,  row: 13, type: 'helix', name: 'Dr. Helix',  color: '#00ff88', title: 'MUTATION SPECIALIST' },
    // Right wing — RK-7 Ark (tech/weapons) — MIRRORED with Helix
    { col: 19, row: 13, type: 'ark',   name: 'RK-7 "Ark"', color: '#ccaa22', title: 'TECH MERCHANT' },
    // Upper right — Cmdr. Vex (tournament)
    { col: 19, row: 6,  type: 'vex',   name: 'Cmdr. Vex',  color: '#aa66ee', title: 'TOURNAMENT DIRECTOR' },
  ],
  terminals: [
    // Bottom-left — Species Codex
    { col: 5,  row: 16, type: 'codex',   name: 'Species Codex', color: '#00ccff' },
    // Bottom-right — Supplies
    { col: 21, row: 16, type: 'supplies', name: 'Supplies',     color: '#ccaa22' },
    // North wall center — Tournament Bracket
    { col: 13, row: 2,  type: 'bracket',  name: 'Bracket',      color: '#00ffee', wide: true },
    { col: 14, row: 2,  type: 'bracket',  name: 'Bracket',      color: '#00ffee', wide: true },
  ],
};

/* ─── Wall monitors ─── */
const WALL_MONITORS = [
  { col: 4,  row: 1, w: 2, color: '#00ff88' },
  { col: 12, row: 1, w: 2, color: '#00ccff' },
  { col: 20, row: 1, w: 2, color: '#aa66ee' },
];

/* ─── Foreground pipes — follow wing boundaries ─── */
const FG_PIPES = {
  horizontal: [
    { row: 4.8, colStart: 3, colEnd: 23 },   // above upper level
    { row: 10.5, colStart: 2, colEnd: 24 },   // below corridor
    { row: 17.2, colStart: 2, colEnd: 24 },   // above bottom wall
  ],
  vertical: [
    { col: 11.2, rowStart: 10.5, rowEnd: 17 }, // left wing divider
    { col: 14.8, rowStart: 10.5, rowEnd: 17 }, // right wing divider
  ],
};

/* ═══ LIGHT SOURCE DEFINITIONS — matched to organized layout ═══ */
function getLightSources(playerX, playerY, arenasCleared, arenaStates, time) {
  const lights = [];

  // Player personal light
  lights.push({ x: playerX, y: playerY, radius: TILE * 7, r: 120, g: 200, b: 240, intensity: 0.9 });

  // NPC station lights — each in their wing
  lights.push(
    // Left wing — Dr. Helix (green bio glow)
    { x: 6 * TILE + 12, y: 13 * TILE + 12, radius: TILE * 5, r: 80, g: 240, b: 160, intensity: 0.85 },
    // Right wing — RK-7 Ark (warm amber glow)
    { x: 19 * TILE + 12, y: 13 * TILE + 12, radius: TILE * 5, r: 230, g: 200, b: 100, intensity: 0.85 },
    // Upper right — Cmdr. Vex (purple command glow)
    { x: 19 * TILE + 12, y: 6 * TILE + 12, radius: TILE * 5, r: 190, g: 150, b: 250, intensity: 0.85 },
  );

  // Corridor LED lights — the spine
  for (let c = 3; c < COLS - 3; c += 2) {
    const flicker = 0.45 + Math.sin(time * 0.003 + c * 1.7) * 0.1;
    lights.push({ x: c * TILE + 12, y: 9 * TILE + 12, radius: TILE * 3, r: 0, g: 180, b: 230, intensity: flicker });
  }

  // Arena door lights
  INTERACTABLES.doors.forEach((door, i) => {
    const isNext = i === arenasCleared && i < 4;
    const cleared = arenaStates?.[i]?.cleared;
    if (isNext) {
      const pulse = 0.7 + Math.sin(time * 0.003) * 0.25;
      lights.push({ x: door.col * TILE + 12, y: door.row * TILE + 18, radius: TILE * 7, r: 0, g: 210, b: 255, intensity: pulse });
    } else if (cleared) {
      lights.push({ x: door.col * TILE + 12, y: door.row * TILE + 18, radius: TILE * 4, r: 0, g: 240, b: 140, intensity: 0.5 });
    } else {
      lights.push({ x: door.col * TILE + 12, y: door.row * TILE + 18, radius: TILE * 2, r: 120, g: 40, b: 40, intensity: 0.2 });
    }
  });

  // Wall monitor glows
  WALL_MONITORS.forEach(mon => {
    const [r, g, b] = hexRgb(mon.color);
    lights.push({ x: mon.col * TILE + mon.w * TILE / 2, y: mon.row * TILE + 10, radius: TILE * 2.5, r, g, b, intensity: 0.4 });
  });

  // Terminal glows
  INTERACTABLES.terminals.forEach(term => {
    const [r, g, b] = hexRgb(term.color);
    lights.push({ x: term.col * TILE + 12, y: term.row * TILE + 12, radius: TILE * 3.5, r, g, b, intensity: 0.5 });
  });

  // Entry door frame light
  lights.push({ x: 12.5 * TILE, y: 18 * TILE + 12, radius: TILE * 3.5, r: 0, g: 200, b: 240, intensity: 0.4 });

  // Bracket terminal glow (north wall center)
  const bracketPulse = 0.45 + Math.sin(time * 0.002) * 0.15;
  lights.push({ x: 13.5 * TILE, y: 2 * TILE + 12, radius: TILE * 4, r: 0, g: 255, b: 238, intensity: bracketPulse });

  // Wing-specific ambient fills
  lights.push(
    // Left wing ambient (green tint — bio theme)
    { x: 6 * TILE, y: 14 * TILE, radius: TILE * 5, r: 30, g: 60, b: 50, intensity: 0.2 },
    // Right wing ambient (amber tint — tech theme)
    { x: 20 * TILE, y: 14 * TILE, radius: TILE * 5, r: 50, g: 45, b: 25, intensity: 0.2 },
    // Center walkway (neutral blue)
    { x: 13 * TILE, y: 14 * TILE, radius: TILE * 3, r: 30, g: 50, b: 70, intensity: 0.2 },
    // Upper left hallway — needs to be visible
    { x: 5 * TILE, y: 6 * TILE, radius: TILE * 6, r: 40, g: 70, b: 100, intensity: 0.4 },
    // Tournament center
    { x: 13 * TILE, y: 6 * TILE, radius: TILE * 4, r: 0, g: 50, b: 80, intensity: 0.2 },
  );

  return lights;
}

/* ═══ PARTICLE SYSTEM ═══ */
class ParticleSystem {
  constructor(count) {
    this.particles = Array.from({ length: count }, () => this._spawn());
  }
  _spawn() {
    return {
      x: Math.random() * CANVAS_W, y: Math.random() * CANVAS_H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.2 - 0.1,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.3 + 0.05,
      life: Math.random() * 200 + 100, maxLife: 300,
    };
  }
  update() {
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0 || p.x < 0 || p.x > CANVAS_W || p.y < 0 || p.y > CANVAS_H) {
        Object.assign(p, this._spawn());
      }
    });
  }
  draw(ctx) {
    ctx.globalCompositeOperation = 'lighter';
    this.particles.forEach(p => {
      const fade = Math.min(1, (p.maxLife - p.life) / 30) * Math.min(1, p.life / 30);
      ctx.fillStyle = `rgba(100, 200, 255, ${p.alpha * fade})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalCompositeOperation = 'source-over';
  }
}

/* ═══ ART PRELOADER ═══ */
function useArtLoader() {
  const [arts, setArts] = useState({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sources = { workshop: workshopArt, mutlab: mutlabArt, cmdpost: cmdpostArt, gallery: galleryArt, corridor: corridorArt, floor: floorTileArt, terminal: terminalArt };
    const loaded = {};
    let count = 0;
    const total = Object.keys(sources).length;
    Object.entries(sources).forEach(([key, src]) => {
      const img = new Image();
      img.onload = () => { loaded[key] = img; if (++count >= total) { setArts(loaded); setReady(true); } };
      img.onerror = () => { if (++count >= total) { setArts(loaded); setReady(true); } };
      img.src = src;
    });
  }, []);
  return { arts, ready };
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function HubWorld2D({ runState, meta, arenaStates, onInteract, overlayActive }) {
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const posRef = useRef({ x: 13 * TILE, y: 16 * TILE });
  const animRef = useRef(null);
  const particlesRef = useRef(new ParticleSystem(100));
  const [nearTarget, setNearTarget] = useState(null);
  const dirRef = useRef({ dx: 0, dy: 1 });
  const lightCanvasRef = useRef(null);

  const { arts, ready } = useArtLoader();
  const arenasCleared = arenaStates?.filter(a => a.cleared).length || 0;

  // Key events
  useEffect(() => {
    const onDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'e' && nearTarget && !overlayActive) onInteract(nearTarget.type);
    };
    const onUp = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [nearTarget, overlayActive, onInteract]);

  // Collision
  const blocked = useCallback((px, py) => {
    const s = 5;
    for (const [ox, oy] of [[-s, -s], [s, -s], [-s, s], [s, s]]) {
      const c = Math.floor((px + ox) / TILE);
      const r = Math.floor((py + oy) / TILE);
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
      if (TILEMAP[r][c] === W || TILEMAP[r][c] === P) return true;
    }
    return false;
  }, []);

  // ═══ RENDER LOOP ═══
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const particles = particlesRef.current;

    // Create offscreen light canvas
    if (!lightCanvasRef.current) {
      lightCanvasRef.current = document.createElement('canvas');
      lightCanvasRef.current.width = CANVAS_W;
      lightCanvasRef.current.height = CANVAS_H;
    }
    const lCanvas = lightCanvasRef.current;
    const lctx = lCanvas.getContext('2d');

    let floorPattern = null;
    if (ready && arts.floor) floorPattern = ctx.createPattern(arts.floor, 'repeat');

    function frame() {
      animRef.current = requestAnimationFrame(frame);
      const time = Date.now();

      // Movement
      if (!overlayActive) {
        const k = keysRef.current;
        let dx = 0, dy = 0;
        if (k['w'] || k['arrowup']) dy -= PLAYER_SPEED;
        if (k['s'] || k['arrowdown']) dy += PLAYER_SPEED;
        if (k['a'] || k['arrowleft']) dx -= PLAYER_SPEED;
        if (k['d'] || k['arrowright']) dx += PLAYER_SPEED;
        if (dx && dy) { dx *= 0.707; dy *= 0.707; }
        if (dx || dy) dirRef.current = { dx: Math.sign(dx) || 0, dy: Math.sign(dy) || 0 };
        const pos = posRef.current;
        const nx = pos.x + dx, ny = pos.y + dy;
        if (!blocked(nx, ny)) { pos.x = nx; pos.y = ny; }
        else if (!blocked(nx, pos.y)) { pos.x = nx; }
        else if (!blocked(pos.x, ny)) { pos.y = ny; }
      }
      const pos = posRef.current;

      // ════════════════════════════════════════
      // PASS 1: SCENE RENDERING
      // ════════════════════════════════════════

      // Clear
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Floor tile pattern (visible base texture)
      if (floorPattern) {
        ctx.save();
        ctx.globalAlpha = 0.38;
        ctx.fillStyle = floorPattern;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.restore();
      }

      // Metal floor plate seams (adds texture to the floor)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 0.5;
      for (let r = 2; r < ROWS - 2; r++) {
        for (let c = 2; c < COLS - 2; c++) {
          if (TILEMAP[r][c] === F || TILEMAP[r][c] === G || TILEMAP[r][c] === L) {
            ctx.strokeRect(c * TILE + 0.5, r * TILE + 0.5, TILE - 1, TILE - 1);
          }
        }
      }

      // Room art backgrounds with feathered edges
      if (ready) {
        for (const zone of ROOM_ZONES) {
          const img = arts[zone.img];
          if (!img) continue;
          const zx = zone.col * TILE, zy = zone.row * TILE;
          const zw = zone.colSpan * TILE, zh = zone.rowSpan * TILE;
          ctx.save();
          ctx.globalAlpha = zone.opacity;
          ctx.drawImage(img, zx, zy, zw, zh);
          ctx.restore();
          // Feathered edges — gradient fade on all borders
          const fade = TILE * 1.5;
          // Left edge
          const lGrad = ctx.createLinearGradient(zx, 0, zx + fade, 0);
          lGrad.addColorStop(0, 'rgba(2, 4, 8, 0.7)');
          lGrad.addColorStop(1, 'rgba(2, 4, 8, 0)');
          ctx.fillStyle = lGrad;
          ctx.fillRect(zx, zy, fade, zh);
          // Right edge
          const rGrad = ctx.createLinearGradient(zx + zw - fade, 0, zx + zw, 0);
          rGrad.addColorStop(0, 'rgba(2, 4, 8, 0)');
          rGrad.addColorStop(1, 'rgba(2, 4, 8, 0.7)');
          ctx.fillStyle = rGrad;
          ctx.fillRect(zx + zw - fade, zy, fade, zh);
          // Top edge
          const tGrad = ctx.createLinearGradient(0, zy, 0, zy + fade);
          tGrad.addColorStop(0, 'rgba(2, 4, 8, 0.6)');
          tGrad.addColorStop(1, 'rgba(2, 4, 8, 0)');
          ctx.fillStyle = tGrad;
          ctx.fillRect(zx, zy, zw, fade);
          // Bottom edge
          const bGrad = ctx.createLinearGradient(0, zy + zh - fade, 0, zy + zh);
          bGrad.addColorStop(0, 'rgba(2, 4, 8, 0)');
          bGrad.addColorStop(1, 'rgba(2, 4, 8, 0.6)');
          ctx.fillStyle = bGrad;
          ctx.fillRect(zx, zy + zh - fade, zw, fade);
        }
      }

      // Structural tiles
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const sx = c * TILE, sy = r * TILE;
          const tile = TILEMAP[r][c];

          if (tile === W) {
            ctx.fillStyle = '#0c1628';
            ctx.fillRect(sx, sy, TILE, TILE);
            // Panel edges
            ctx.fillStyle = '#1a2a42';
            ctx.fillRect(sx, sy, TILE, 1);
            ctx.fillRect(sx, sy, 1, TILE);
            ctx.fillStyle = '#060c18';
            ctx.fillRect(sx + TILE - 1, sy, 1, TILE);
            ctx.fillRect(sx, sy + TILE - 1, TILE, 1);
            // Panel detail (rivet dots)
            if ((c + r) % 3 === 0) {
              ctx.fillStyle = '#2a3a52';
              ctx.fillRect(sx + 3, sy + 3, 1, 1);
              ctx.fillRect(sx + TILE - 4, sy + TILE - 4, 1, 1);
            }
          } else if (tile === P) {
            ctx.fillStyle = '#0a1020';
            ctx.fillRect(sx, sy, TILE, TILE);
            ctx.fillStyle = '#1a3040';
            ctx.fillRect(sx + 4, sy + 8, TILE - 8, 8);
            ctx.fillStyle = '#0a1a25';
            ctx.fillRect(sx + 4, sy + 10, TILE - 8, 4);
            ctx.fillStyle = '#2a4858';
            ctx.fillRect(sx + 3, sy + 11, 2, 2);
            ctx.fillRect(sx + TILE - 5, sy + 11, 2, 2);
          } else if (tile === G) {
            ctx.fillStyle = 'rgba(6, 10, 18, 0.4)';
            ctx.fillRect(sx, sy, TILE, TILE);
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.06)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < TILE; i += 6) {
              ctx.beginPath(); ctx.moveTo(sx + i, sy); ctx.lineTo(sx + i, sy + TILE); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(sx, sy + i); ctx.lineTo(sx + TILE, sy + i); ctx.stroke();
            }
          } else if (tile === L) {
            ctx.fillStyle = 'rgba(8, 14, 24, 0.2)';
            ctx.fillRect(sx, sy, TILE, TILE);
            const pulse = 0.5 + Math.sin(time * 0.002 + c * 0.5) * 0.25;
            // Embedded LED strip — recessed channel with glow
            ctx.fillStyle = '#060c16';
            ctx.fillRect(sx + 8, sy + 10, TILE - 16, 4); // channel
            ctx.fillStyle = `rgba(0, 200, 255, ${pulse * 0.5})`;
            ctx.fillRect(sx + 9, sy + 11, TILE - 18, 2); // LED core
            // Subtle ambient glow around LED
            ctx.fillStyle = `rgba(0, 180, 255, ${pulse * 0.08})`;
            ctx.fillRect(sx + 2, sy + 4, TILE - 4, TILE - 8);
          }
        }
      }

      // Equipment details — organized by wing
      const equipment = [
        // ─── LEFT WING (Mutation Lab) ───
        // Bio-specimen tanks along left wall
        { x: 2, y: 12, w: 1.5, h: 2.5, color: '#0a1a18', highlight: '#1a2a28', accent: '#00ff88' },
        { x: 2, y: 15, w: 1.5, h: 1.5, color: '#0a1a18', highlight: '#1a2a28', accent: '#00ff88' },
        // Lab bench
        { x: 4, y: 15, w: 3, h: 1, color: '#141a20', highlight: '#1a2a28', accent: '#00ff88' },
        // Mutation vials rack
        { x: 8, y: 12, w: 1.5, h: 2, color: '#0a1818', highlight: '#1a2828', accent: '#00ccaa' },

        // ─── RIGHT WING (Tech Workshop) ───
        // Weapon racks along right wall
        { x: 23, y: 12, w: 1.5, h: 2.5, color: '#1a1a10', highlight: '#2a2a20', accent: '#ccaa22' },
        { x: 23, y: 15, w: 1.5, h: 1.5, color: '#1a1a10', highlight: '#2a2a20', accent: '#ff6644' },
        // Workbench
        { x: 17, y: 15, w: 3, h: 1, color: '#1a1a14', highlight: '#2a2a24', accent: '#ccaa22' },
        // Tech crates
        { x: 17, y: 12, w: 2, h: 1.5, color: '#181810', highlight: '#282818', accent: '#ccaa22' },

        // ─── CENTER WALKWAY ───
        // Cable conduits along bottom wall
        { x: 3, y: 17, w: 8, h: 0.3, color: '#0a1a2a', highlight: '#1a2a3a' },
        { x: 16, y: 17, w: 7, h: 0.3, color: '#0a1a2a', highlight: '#1a2a3a' },
        // Small barrel near entry
        { x: 12, y: 17, w: 0.8, h: 0.8, color: '#1a1a28', highlight: '#2a2a38', accent: '#00ccff' },
        { x: 13.5, y: 17, w: 0.8, h: 0.8, color: '#1a1a28', highlight: '#2a2a38', accent: '#00ccff' },

        // ─── UPPER AREA ───
        // Command post equipment (right)
        { x: 22, y: 5, w: 1.5, h: 2, color: '#1a1428', highlight: '#2a2438', accent: '#aa66ee' },
        // Upper-left hallway: observation benches & storage
        { x: 2, y: 5.5, w: 2, h: 1, color: '#0c1420', highlight: '#1a2430', accent: '#00ccff' },
        { x: 2, y: 7, w: 1.5, h: 1.5, color: '#101828', highlight: '#1a2838', accent: '#00ccff' },
        { x: 5, y: 6, w: 2.5, h: 1.5, color: '#0a1220', highlight: '#142030', accent: '#00aadd' },
        { x: 8, y: 5.5, w: 1.5, h: 1, color: '#0c1420', highlight: '#1a2430', accent: '#00ccff' },
      ];
      for (const eq of equipment) {
        const ex = eq.x * TILE, ey = eq.y * TILE;
        const ew = eq.w * TILE, eh = eq.h * TILE;
        ctx.fillStyle = eq.color;
        ctx.fillRect(ex, ey, ew, eh);
        ctx.fillStyle = eq.highlight;
        ctx.fillRect(ex, ey, ew, 1); // top highlight
        ctx.fillRect(ex, ey, 1, eh); // left highlight
        // Dark bottom/right edge
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(ex + ew - 1, ey, 1, eh);
        ctx.fillRect(ex, ey + eh - 1, ew, 1);
        // Accent strip (colored label/indicator on crate)
        if (eq.accent) {
          ctx.fillStyle = eq.accent + '44';
          ctx.fillRect(ex + 2, ey + 2, Math.min(ew - 4, 8), 2);
        }
      }

      // Blinking status lights — organized by wing
      const supplyLights = [
        // Left wing (bio green)
        { x: 2.3, y: 12.5, color: '#00ff88' },
        { x: 2.3, y: 15.3, color: '#00ff88' },
        { x: 8.3, y: 12.5, color: '#00ccaa' },
        // Right wing (tech amber)
        { x: 23.3, y: 12.5, color: '#ccaa22' },
        { x: 23.3, y: 15.3, color: '#ff6644' },
        { x: 17.3, y: 12.5, color: '#ccaa22' },
        // Command post (purple)
        { x: 22.3, y: 5.3, color: '#aa66ee' },
      ];
      for (const sl of supplyLights) {
        const on = Math.sin(time * 0.003 + sl.x * 7 + sl.y * 13) > 0;
        if (on) {
          ctx.fillStyle = sl.color + '88';
          ctx.fillRect(sl.x * TILE, sl.y * TILE, 2, 2);
          // Tiny glow
          ctx.fillStyle = sl.color + '22';
          ctx.fillRect(sl.x * TILE - 2, sl.y * TILE - 2, 6, 6);
        }
      }

      // Floor markings — hazard stripes near arena doors
      ctx.save();
      ctx.globalAlpha = 0.08;
      INTERACTABLES.doors.forEach(door => {
        const fx = (door.col - 0.5) * TILE, fy = (door.row + 1.5) * TILE;
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#ccaa00' : '#020408';
          ctx.fillRect(fx + i * 6, fy, 5, 2);
        }
      });
      ctx.restore();

      // Wall monitors (animated screens)
      WALL_MONITORS.forEach(mon => {
        const mx = mon.col * TILE, my = mon.row * TILE;
        const mw = mon.w * TILE, mh = TILE - 6;
        const [mr, mg, mb] = hexRgb(mon.color);
        ctx.fillStyle = '#040810';
        ctx.fillRect(mx + 2, my + 3, mw - 4, mh);
        ctx.strokeStyle = `rgba(${mr}, ${mg}, ${mb}, 0.5)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(mx + 2, my + 3, mw - 4, mh);
        const scanY = ((time * 0.02 + mon.col * 10) % mh);
        ctx.fillStyle = `rgba(${mr}, ${mg}, ${mb}, 0.4)`;
        ctx.fillRect(mx + 3, my + 4 + scanY, mw - 6, 1);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = `rgba(${mr}, ${mg}, ${mb}, 0.2)`;
          ctx.fillRect(mx + 4, my + 6 + i * 4, mw * (0.3 + Math.sin(time * 0.001 + i * 2) * 0.2), 1);
        }
      });

      // Wall LEDs
      for (let c = 3; c < COLS - 3; c += 3) {
        if (Math.sin(time * 0.003 + c * 7.3) > 0.2) {
          ctx.fillStyle = 'rgba(0, 220, 255, 0.5)';
          ctx.fillRect(c * TILE + TILE / 2 - 1, 1, 2, 2);
        }
      }
      for (let r = 3; r < ROWS - 3; r += 3) {
        if (Math.sin(time * 0.003 + r * 11.7) > 0.2) {
          ctx.fillStyle = 'rgba(0, 220, 255, 0.4)';
          ctx.fillRect(1, r * TILE + TILE / 2 - 1, 2, 2);
          ctx.fillRect((COLS - 1) * TILE + TILE - 3, r * TILE + TILE / 2 - 1, 2, 2);
        }
      }

      // Arena doors
      INTERACTABLES.doors.forEach((door, i) => {
        const dx = door.col * TILE, dy = door.row * TILE;
        const cleared = arenaStates?.[i]?.cleared;
        const isNext = i === arenasCleared && i < 4;
        const locked = i > arenasCleared;

        ctx.fillStyle = '#020408';
        ctx.fillRect(dx - TILE, dy - 2, TILE * 3, TILE * 2);
        ctx.fillStyle = locked ? '#060a14' : '#0c1828';
        ctx.fillRect(dx - TILE * 0.5, dy, TILE * 2, TILE * 1.5);

        let barColor;
        if (cleared) barColor = '#00ff8888';
        else if (isNext) {
          const p = 0.5 + Math.sin(time * 0.004) * 0.4;
          barColor = `rgba(0, 220, 255, ${p})`;
        } else barColor = '#1a1a1a';
        ctx.fillStyle = barColor;
        ctx.fillRect(dx - TILE * 0.5, dy, TILE * 2, 3);

        if (isNext || cleared) {
          const lc = cleared ? 'rgba(0, 255, 136, 0.4)' : `rgba(0, 220, 255, ${0.25 + Math.sin(time * 0.003) * 0.2})`;
          ctx.fillStyle = lc;
          ctx.fillRect(dx - TILE * 0.5, dy + 4, 2, TILE * 1.2);
          ctx.fillRect(dx + TILE * 1.5 - 2, dy + 4, 2, TILE * 1.2);
        }

        ctx.font = 'bold 12px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = cleared ? '#66ee88' : isNext ? '#55ddff' : '#2a4a5a';
        ctx.fillText(door.label, dx + TILE * 0.5, dy + TILE * 0.9);
        if (cleared) {
          ctx.fillStyle = '#66ee88'; ctx.font = '9px "Share Tech Mono", monospace';
          ctx.fillText('CLEARED', dx + TILE * 0.5, dy + TILE * 1.3);
        } else if (locked) {
          ctx.fillStyle = '#2a3a4a'; ctx.font = '9px "Share Tech Mono", monospace';
          ctx.fillText('LOCKED', dx + TILE * 0.5, dy + TILE * 1.3);
        }
      });

      // Holographic tournament display — centered in upper area
      const holoX = 11.5 * TILE, holoY = 5 * TILE;
      const holoW = TILE * 3.5, holoH = TILE * 2.5;
      // Projector base
      ctx.fillStyle = '#0a1828';
      ctx.fillRect(holoX - 2, holoY + holoH, holoW + 4, 4);
      ctx.fillStyle = `rgba(0, 200, 255, ${0.3 + Math.sin(time * 0.003) * 0.1})`;
      ctx.fillRect(holoX + 4, holoY + holoH, holoW - 8, 2);
      // Hologram body (translucent blue field)
      ctx.save();
      ctx.globalAlpha = 0.18 + Math.sin(time * 0.002) * 0.06;
      const holoGrad = ctx.createLinearGradient(holoX, holoY, holoX, holoY + holoH);
      holoGrad.addColorStop(0, 'rgba(0, 200, 255, 0.3)');
      holoGrad.addColorStop(0.5, 'rgba(0, 200, 255, 0.15)');
      holoGrad.addColorStop(1, 'rgba(0, 200, 255, 0.4)');
      ctx.fillStyle = holoGrad;
      ctx.fillRect(holoX + 2, holoY + 2, holoW - 4, holoH - 4);
      ctx.restore();
      // Tournament bracket lines
      ctx.strokeStyle = `rgba(0, 220, 255, ${0.2 + Math.sin(time * 0.001) * 0.05})`;
      ctx.lineWidth = 1;
      // Left bracket
      ctx.beginPath();
      ctx.moveTo(holoX + 8, holoY + 8); ctx.lineTo(holoX + 16, holoY + 16);
      ctx.moveTo(holoX + 8, holoY + 24); ctx.lineTo(holoX + 16, holoY + 16);
      ctx.moveTo(holoX + 16, holoY + 16); ctx.lineTo(holoX + holoW / 2, holoY + holoH / 2);
      ctx.stroke();
      // Right bracket
      ctx.beginPath();
      ctx.moveTo(holoX + holoW - 8, holoY + 8); ctx.lineTo(holoX + holoW - 16, holoY + 16);
      ctx.moveTo(holoX + holoW - 8, holoY + 24); ctx.lineTo(holoX + holoW - 16, holoY + 16);
      ctx.moveTo(holoX + holoW - 16, holoY + 16); ctx.lineTo(holoX + holoW / 2, holoY + holoH / 2);
      ctx.stroke();
      // Arena status dots in bracket
      ctx.save(); ctx.globalAlpha = 0.5;
      for (let i = 0; i < 4; i++) {
        const dotX = holoX + 8 + (i < 2 ? 0 : holoW - 16);
        const dotY = holoY + 8 + (i % 2) * 16;
        ctx.fillStyle = arenaStates?.[i]?.cleared ? '#00ff88' : '#00ccff';
        ctx.fillRect(dotX, dotY, 4, 4);
      }
      ctx.restore();
      // Center trophy/crown for final
      const tPulse = 0.3 + Math.sin(time * 0.002) * 0.15;
      ctx.fillStyle = `rgba(255, 200, 50, ${tPulse})`;
      ctx.fillRect(holoX + holoW / 2 - 3, holoY + holoH / 2 - 2, 6, 4);
      // Scanline
      const holoScan = ((time * 0.02) % holoH);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.fillRect(holoX + 2, holoY + 2 + holoScan, holoW - 4, 1);
      // Title text
      ctx.font = '6px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(0, 220, 255, ${0.3 + Math.sin(time * 0.002) * 0.1})`;
      ctx.fillText('TOURNAMENT', holoX + holoW / 2, holoY + holoH - 6);

      // NPCs
      INTERACTABLES.npcs.forEach(npc => {
        const nx = npc.col * TILE, ny = npc.row * TILE;
        const bob = Math.sin(time * 0.002 + npc.col) * 1.5;
        const isArk = npc.type === 'ark';
        const isHelix = npc.type === 'helix';
        const isVex = npc.type === 'vex';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(nx + TILE / 2, ny + TILE + 2, isArk ? 10 : 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        if (isArk) {
          const arkBob = Math.sin(time * 0.003 + 20) * 2;
          ctx.fillStyle = '#3a3020';
          ctx.fillRect(nx + 1, ny + 16 + arkBob, 22, 6);
          ctx.fillStyle = npc.color + '44';
          ctx.fillRect(nx + 3, ny + 18 + arkBob, 18, 2);
          ctx.fillStyle = '#2a2010';
          ctx.fillRect(nx + 3, ny + 2 + arkBob, 18, 14);
          ctx.strokeStyle = npc.color + '88';
          ctx.lineWidth = 1;
          ctx.strokeRect(nx + 3, ny + 2 + arkBob, 18, 14);
          const eyePulse = 0.6 + Math.sin(time * 0.005) * 0.4;
          ctx.fillStyle = `rgba(204, 170, 34, ${eyePulse})`;
          ctx.fillRect(nx + 7, ny + 5 + arkBob, 10, 3);
          ctx.fillStyle = '#4a4030';
          ctx.fillRect(nx + 11, ny - 4 + arkBob, 2, 6);
          ctx.fillStyle = npc.color;
          ctx.fillRect(nx + 10, ny - 5 + arkBob, 4, 2);
          ctx.fillStyle = '#3a3020';
          ctx.fillRect(nx - 2, ny + 6 + arkBob, 5, 3);
          ctx.fillRect(nx + 21, ny + 6 + arkBob, 5, 3);
          if (Math.sin(time * 0.008) > 0.7) {
            ctx.fillStyle = `rgba(255, 200, 50, ${0.3 + Math.random() * 0.4})`;
            ctx.fillRect(nx + 22 + Math.random() * 4, ny + 4 + Math.random() * 6 + arkBob, 1, 1);
          }
        } else if (isHelix) {
          // Dr. Helix — alien squid scientist, tentacle-like appendages
          const hBob = bob;
          // Body (bulbous head + narrow body)
          ctx.fillStyle = '#1a0033';
          ctx.fillRect(nx + 4, ny + 10 + hBob, 16, 12); // lab coat body
          ctx.fillStyle = '#2a0055';
          ctx.fillRect(nx + 5, ny + 11 + hBob, 14, 10); // coat inner
          ctx.fillStyle = npc.color + 'cc';
          ctx.fillRect(nx + 7, ny + 12 + hBob, 2, 3); // coat buttons
          ctx.fillRect(nx + 7, ny + 17 + hBob, 2, 3);
          // Head (bulbous squid-like)
          ctx.fillStyle = '#3a0066';
          ctx.fillRect(nx + 5, ny - 4 + hBob, 14, 12);
          ctx.fillStyle = '#4a0088';
          ctx.fillRect(nx + 6, ny - 3 + hBob, 12, 10);
          // Three eye spots
          const eyePulse = 0.6 + Math.sin(time * 0.004) * 0.4;
          ctx.fillStyle = `rgba(0, 255, 136, ${eyePulse})`;
          ctx.fillRect(nx + 7, ny + 1 + hBob, 2, 2);
          ctx.fillRect(nx + 11, ny - 1 + hBob, 2, 2);
          ctx.fillRect(nx + 15, ny + 1 + hBob, 2, 2);
          // Tentacle arms holding tools
          ctx.fillStyle = '#3a0066';
          ctx.fillRect(nx, ny + 12 + hBob + Math.sin(time * 0.005) * 1, 4, 8);
          ctx.fillRect(nx + 20, ny + 12 + hBob - Math.sin(time * 0.005) * 1, 4, 8);
          // Syringe in right hand
          ctx.fillStyle = '#88cccc';
          ctx.fillRect(nx + 22, ny + 12 + hBob, 2, 5);
          ctx.fillStyle = npc.color;
          ctx.fillRect(nx + 22, ny + 11 + hBob, 2, 2);
        } else if (isVex) {
          // Cmdr. Vex — military commander, armored uniform
          const vBob = bob;
          // Armored body
          ctx.fillStyle = '#1a1a30';
          ctx.fillRect(nx + 3, ny + 8 + vBob, 18, 14);
          ctx.fillStyle = '#2a2a44';
          ctx.fillRect(nx + 4, ny + 9 + vBob, 16, 12);
          // Shoulder pads
          ctx.fillStyle = '#3a2a55';
          ctx.fillRect(nx, ny + 8 + vBob, 5, 5);
          ctx.fillRect(nx + 19, ny + 8 + vBob, 5, 5);
          // Gold insignia on shoulders
          ctx.fillStyle = '#ccaa22';
          ctx.fillRect(nx + 1, ny + 9 + vBob, 3, 3);
          ctx.fillRect(nx + 20, ny + 9 + vBob, 3, 3);
          // Head with cybernetic jaw
          ctx.fillStyle = '#5a4a77';
          ctx.fillRect(nx + 6, ny - 2 + vBob, 12, 10);
          ctx.fillStyle = '#4a3a66';
          ctx.fillRect(nx + 7, ny - 1 + vBob, 10, 8);
          // Cybernetic jaw implant
          ctx.fillStyle = '#888888';
          ctx.fillRect(nx + 7, ny + 4 + vBob, 10, 3);
          ctx.fillStyle = '#666666';
          ctx.fillRect(nx + 8, ny + 5 + vBob, 8, 2);
          // Eyes (stern)
          ctx.fillStyle = '#ff8844';
          ctx.fillRect(nx + 8, ny + 1 + vBob, 2, 2);
          ctx.fillRect(nx + 14, ny + 1 + vBob, 2, 2);
          // Medal/badge on chest
          ctx.fillStyle = '#ccaa22';
          ctx.fillRect(nx + 10, ny + 12 + vBob, 4, 4);
          ctx.fillStyle = '#ff6644';
          ctx.fillRect(nx + 11, ny + 13 + vBob, 2, 2);
        }

        // Nameplate
        ctx.font = '9px "Share Tech Mono", monospace';
        const nameWidth = ctx.measureText(npc.name.toUpperCase()).width || 60;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(nx + TILE / 2 - nameWidth / 2 - 4, ny - 18, nameWidth + 8, 14);
        ctx.fillStyle = npc.color;
        ctx.textAlign = 'center';
        ctx.fillText(npc.name.toUpperCase(), nx + TILE / 2, ny - 8);
        ctx.font = '7px "Share Tech Mono", monospace';
        ctx.fillStyle = npc.color + '88';
        ctx.fillText(npc.title, nx + TILE / 2, ny - 1);
      });

      // Terminals
      const drawnBracket = { done: false };
      INTERACTABLES.terminals.forEach(term => {
        // Wide bracket terminal — draw once spanning 2 tiles
        if (term.type === 'bracket') {
          if (drawnBracket.done) return;
          drawnBracket.done = true;
          const bx = 13 * TILE, by = 2 * TILE;
          const bw = TILE * 2;
          // Terminal body
          ctx.fillStyle = '#0a1220';
          ctx.fillRect(bx, by + 8, bw, TILE - 8);
          // Screen
          ctx.fillStyle = '#00ffee12';
          ctx.fillRect(bx + 2, by + 2, bw - 4, 14);
          ctx.strokeStyle = '#00ffee55';
          ctx.lineWidth = 1;
          ctx.strokeRect(bx + 2, by + 2, bw - 4, 14);
          // Scanline
          const scanY = (time * 0.02 + 260) % 14;
          ctx.fillStyle = '#00ffee33';
          ctx.fillRect(bx + 3, by + 3 + scanY, bw - 6, 1);
          // Bracket icon lines inside screen
          ctx.strokeStyle = `rgba(0, 255, 238, ${0.3 + Math.sin(time * 0.002) * 0.15})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(bx + 6, by + 5); ctx.lineTo(bx + 12, by + 9);
          ctx.moveTo(bx + 6, by + 13); ctx.lineTo(bx + 12, by + 9);
          ctx.moveTo(bx + bw - 6, by + 5); ctx.lineTo(bx + bw - 12, by + 9);
          ctx.moveTo(bx + bw - 6, by + 13); ctx.lineTo(bx + bw - 12, by + 9);
          ctx.moveTo(bx + 12, by + 9); ctx.lineTo(bx + bw / 2, by + 9);
          ctx.moveTo(bx + bw - 12, by + 9); ctx.lineTo(bx + bw / 2, by + 9);
          ctx.stroke();
          // Label
          ctx.font = '8px "Share Tech Mono", monospace';
          ctx.fillStyle = '#00ffeecc';
          ctx.textAlign = 'center';
          ctx.fillText('BRACKET', bx + bw / 2, by + TILE + 10);
          return;
        }
        const tx = term.col * TILE, ty = term.row * TILE;
        ctx.fillStyle = '#0a1220';
        ctx.fillRect(tx + 2, ty + 12, TILE - 4, TILE - 12);
        ctx.fillStyle = term.color + '20';
        ctx.fillRect(tx + 3, ty + 2, TILE - 6, 12);
        ctx.strokeStyle = term.color + '55';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx + 3, ty + 2, TILE - 6, 12);
        const scanY = (time * 0.02 + term.col * 20) % 12;
        ctx.fillStyle = term.color + '33';
        ctx.fillRect(tx + 4, ty + 3 + scanY, TILE - 8, 1);
        ctx.font = '8px "Share Tech Mono", monospace';
        ctx.fillStyle = term.color + 'cc';
        ctx.textAlign = 'center';
        ctx.fillText(term.name.toUpperCase(), tx + TILE / 2, ty + TILE + 10);
      });

      // Player — larger, more visible sprite
      const px = pos.x, py = pos.y;
      const dir = dirRef.current;
      const isMoving = keysRef.current['w'] || keysRef.current['s'] || keysRef.current['a'] || keysRef.current['d'] ||
        keysRef.current['arrowup'] || keysRef.current['arrowdown'] || keysRef.current['arrowleft'] || keysRef.current['arrowright'];
      // Shadow (bigger)
      ctx.fillStyle = 'rgba(0, 200, 255, 0.18)';
      ctx.beginPath();
      ctx.ellipse(px, py + 12, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Legs (wider, more visible)
      const legOffset = isMoving ? Math.sin(time * 0.012) * 3 : 0;
      ctx.fillStyle = '#1a6688';
      ctx.fillRect(px - 5, py + 3, 4, 8 + legOffset);
      ctx.fillRect(px + 1, py + 3, 4, 8 - legOffset);
      // Boots
      ctx.fillStyle = '#227799';
      ctx.fillRect(px - 6, py + 9 + legOffset, 5, 3);
      ctx.fillRect(px + 1, py + 9 - legOffset, 5, 3);
      // Body (larger torso)
      ctx.fillStyle = '#2299bb';
      ctx.fillRect(px - 7, py - 6, 14, 10);
      // Armor plate
      ctx.fillStyle = '#33bbdd';
      ctx.fillRect(px - 6, py - 5, 12, 8);
      // Chest highlights
      ctx.fillStyle = '#44ccee';
      ctx.fillRect(px - 5, py - 5, 10, 1); // top edge
      ctx.fillRect(px - 3, py - 4, 1, 6); // left stripe
      ctx.fillRect(px + 2, py - 4, 1, 6); // right stripe
      // Energy core on chest
      ctx.fillStyle = `rgba(100, 240, 255, ${0.6 + Math.sin(time * 0.004) * 0.3})`;
      ctx.fillRect(px - 1, py - 3, 2, 2);
      // Shoulders
      ctx.fillStyle = '#1a7799';
      ctx.fillRect(px - 8, py - 4, 3, 5);
      ctx.fillRect(px + 5, py - 4, 3, 5);
      // Head (larger)
      ctx.fillStyle = '#44ccee';
      ctx.fillRect(px - 5, py - 13, 10, 7);
      // Helmet detail
      ctx.fillStyle = '#55ddff';
      ctx.fillRect(px - 4, py - 12, 8, 5);
      // Visor (wide, glowing)
      ctx.fillStyle = '#88eeff';
      ctx.fillRect(px - 4, py - 11, 8, 3);
      ctx.fillStyle = '#ccffff';
      ctx.fillRect(px + dir.dx * 2 - 1, py - 10, 3, 2);
      // Antenna
      ctx.fillStyle = '#55ddff';
      ctx.fillRect(px + 3, py - 15, 1, 3);
      ctx.fillStyle = `rgba(0, 255, 200, ${0.5 + Math.sin(time * 0.006) * 0.4})`;
      ctx.fillRect(px + 3, py - 16, 1, 1);

      // ════════════════════════════════════════
      // PASS 2: LIGHT MAP (the atmosphere engine)
      // ════════════════════════════════════════

      // Fill light canvas with ambient darkness (brighter = more art visible)
      lctx.fillStyle = 'rgb(60, 65, 85)';
      lctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Paint light sources (additive onto dark canvas)
      lctx.globalCompositeOperation = 'lighter';
      const lights = getLightSources(pos.x, pos.y, arenasCleared, arenaStates, time);

      for (const light of lights) {
        const grad = lctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
        const cr = Math.min(255, light.r + 60);
        const cg = Math.min(255, light.g + 60);
        const cb = Math.min(255, light.b + 60);
        grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${light.intensity})`);
        grad.addColorStop(0.4, `rgba(${light.r}, ${light.g}, ${light.b}, ${light.intensity * 0.4})`);
        grad.addColorStop(1, `rgba(${light.r}, ${light.g}, ${light.b}, 0)`);
        lctx.fillStyle = grad;
        lctx.beginPath();
        lctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
        lctx.fill();
      }
      lctx.globalCompositeOperation = 'source-over';

      // MULTIPLY light map onto main canvas — this is the magic
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(lCanvas, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      // ════════════════════════════════════════
      // PASS 3: ADDITIVE GLOW BLOOM
      // ════════════════════════════════════════
      ctx.globalCompositeOperation = 'lighter';

      // Bright cores on NPCs — larger, more vivid glow
      INTERACTABLES.npcs.forEach(npc => {
        const [r, g, b] = hexRgb(npc.color);
        const lx = npc.col * TILE + 12, ly = npc.row * TILE + 12;
        // Outer soft glow
        const outerGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, TILE * 3);
        outerGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.12)`);
        outerGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.04)`);
        outerGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.arc(lx, ly, TILE * 3, 0, Math.PI * 2);
        ctx.fill();
        // Inner bright core
        const coreGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, TILE * 1.2);
        coreGrad.addColorStop(0, `rgba(${Math.min(255, r + 80)}, ${Math.min(255, g + 80)}, ${Math.min(255, b + 80)}, 0.25)`);
        coreGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(lx, ly, TILE * 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Bright core on arena doors — dramatic pulsing for next door
      INTERACTABLES.doors.forEach((door, i) => {
        const isNext = i === arenasCleared && i < 4;
        const cleared = arenaStates?.[i]?.cleared;
        const dx = door.col * TILE + 12, dy = door.row * TILE + 18;
        if (isNext) {
          const doorGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, TILE * 4);
          const p = 0.14 + Math.sin(time * 0.003) * 0.08;
          doorGrad.addColorStop(0, `rgba(0, 240, 255, ${p})`);
          doorGrad.addColorStop(0.3, `rgba(0, 200, 255, ${p * 0.5})`);
          doorGrad.addColorStop(1, 'rgba(0, 200, 255, 0)');
          ctx.fillStyle = doorGrad;
          ctx.beginPath();
          ctx.arc(dx, dy, TILE * 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (cleared) {
          const clrGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, TILE * 2);
          clrGrad.addColorStop(0, 'rgba(0, 255, 136, 0.08)');
          clrGrad.addColorStop(1, 'rgba(0, 255, 136, 0)');
          ctx.fillStyle = clrGrad;
          ctx.beginPath();
          ctx.arc(dx, dy, TILE * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Corridor LED glow bloom — brighter, more visible
      for (let c = 3; c < COLS - 3; c += 2) {
        const cx = c * TILE + 12, cy = 9 * TILE + 12;
        const ledGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, TILE * 1.5);
        const lp = 0.07 + Math.sin(time * 0.003 + c) * 0.03;
        ledGrad.addColorStop(0, `rgba(0, 220, 255, ${lp})`);
        ledGrad.addColorStop(1, 'rgba(0, 200, 255, 0)');
        ctx.fillStyle = ledGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, TILE * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player glow bloom — dramatic, makes player easy to find
      const pGrad = ctx.createRadialGradient(px, py, 0, px, py, TILE * 3.5);
      pGrad.addColorStop(0, 'rgba(120, 240, 255, 0.28)');
      pGrad.addColorStop(0.3, 'rgba(100, 220, 255, 0.12)');
      pGrad.addColorStop(0.6, 'rgba(80, 200, 255, 0.04)');
      pGrad.addColorStop(1, 'rgba(80, 200, 255, 0)');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, TILE * 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = 'source-over';

      // ════════════════════════════════════════
      // PASS 4: FOREGROUND OVERLAY (overhead pipes)
      // ════════════════════════════════════════
      ctx.save();
      ctx.globalAlpha = 0.5;
      FG_PIPES.horizontal.forEach(pipe => {
        const pipeY = pipe.row * TILE;
        const px1 = pipe.colStart * TILE, px2 = pipe.colEnd * TILE;
        ctx.fillStyle = '#080e18';
        ctx.fillRect(px1, pipeY, px2 - px1, 5);
        ctx.fillStyle = '#1a2838';
        ctx.fillRect(px1, pipeY, px2 - px1, 1);
        ctx.fillStyle = '#040810';
        ctx.fillRect(px1, pipeY + 4, px2 - px1, 1);
      });
      FG_PIPES.vertical.forEach(pipe => {
        const cx = pipe.col * TILE;
        const cy1 = pipe.rowStart * TILE, cy2 = pipe.rowEnd * TILE;
        ctx.fillStyle = '#081018';
        ctx.fillRect(cx, cy1, 3, cy2 - cy1);
        for (let y = cy1; y < cy2; y += TILE) {
          ctx.fillStyle = '#1a2a3a';
          ctx.fillRect(cx, y, 3, 1);
        }
      });
      FG_PIPES.horizontal.forEach(hPipe => {
        FG_PIPES.vertical.forEach(vPipe => {
          const jx = vPipe.col * TILE, jy = hPipe.row * TILE;
          ctx.fillStyle = '#1a2838';
          ctx.fillRect(jx - 2, jy - 2, 7, 9);
          if (Math.sin(time * 0.005 + jx * 0.1 + jy * 0.07) > 0.3) {
            ctx.fillStyle = 'rgba(0, 220, 255, 0.7)';
            ctx.fillRect(jx, jy + 1, 2, 2);
          }
        });
      });
      ctx.restore();

      // ════════════════════════════════════════
      // PASS 5: PARTICLES (additive dust motes)
      // ════════════════════════════════════════
      particles.update();
      particles.draw(ctx);

      // ════════════════════════════════════════
      // PASS 6: POST-PROCESSING
      // ════════════════════════════════════════

      // Floor reflective highlights (screen blend near light sources)
      ctx.globalCompositeOperation = 'screen';
      for (const light of lights) {
        if (light.intensity > 0.3 && light.radius > TILE * 2) {
          const reflGrad = ctx.createRadialGradient(light.x, light.y + TILE, 0, light.x, light.y + TILE, light.radius * 0.5);
          reflGrad.addColorStop(0, `rgba(${light.r}, ${light.g}, ${light.b}, 0.07)`);
          reflGrad.addColorStop(0.5, `rgba(${light.r}, ${light.g}, ${light.b}, 0.02)`);
          reflGrad.addColorStop(1, `rgba(${light.r}, ${light.g}, ${light.b}, 0)`);
          ctx.fillStyle = reflGrad;
          ctx.fillRect(light.x - light.radius, light.y, light.radius * 2, light.radius * 0.7);
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      // Zone labels — one per zone, clearly placed
      ctx.font = '7px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      const zoneLabelAlpha = 0.3;
      // Top
      ctx.fillStyle = `rgba(0, 204, 255, ${zoneLabelAlpha})`;
      ctx.fillText('// ARENA GALLERY', 13 * TILE, 4.7 * TILE);
      // Upper
      ctx.fillStyle = `rgba(170, 102, 238, ${zoneLabelAlpha})`;
      ctx.fillText('// COMMAND POST', 19 * TILE, 7.7 * TILE);
      // Left wing
      ctx.fillStyle = `rgba(0, 255, 136, ${zoneLabelAlpha})`;
      ctx.fillText('// MUTATION LAB', 6 * TILE, 16.7 * TILE);
      // Right wing
      ctx.fillStyle = `rgba(204, 170, 34, ${zoneLabelAlpha})`;
      ctx.fillText('// TECH WORKSHOP', 20 * TILE, 16.7 * TILE);
      // Center
      ctx.fillStyle = `rgba(0, 204, 255, ${zoneLabelAlpha * 0.6})`;
      ctx.fillText('// MAIN HALL', 13 * TILE, 17.5 * TILE);

      // Ambient cable / wire details — running along wing walls
      ctx.strokeStyle = 'rgba(0, 180, 255, 0.04)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 8]);
      // Left wing internal cables
      ctx.beginPath(); ctx.moveTo(2 * TILE, 11 * TILE); ctx.lineTo(10 * TILE, 11 * TILE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2 * TILE, 16 * TILE); ctx.lineTo(10 * TILE, 16 * TILE); ctx.stroke();
      // Right wing internal cables
      ctx.beginPath(); ctx.moveTo(16 * TILE, 11 * TILE); ctx.lineTo(24 * TILE, 11 * TILE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16 * TILE, 16 * TILE); ctx.lineTo(24 * TILE, 16 * TILE); ctx.stroke();
      // Center vertical cables (main path)
      ctx.beginPath(); ctx.moveTo(13 * TILE, 10 * TILE); ctx.lineTo(13 * TILE, 18 * TILE); ctx.stroke();
      ctx.setLineDash([]);

      // ════════════════════════════════════════
      // PROXIMITY CHECK
      // ════════════════════════════════════════
      let closest = null, closestDist = Infinity;
      INTERACTABLES.doors.forEach((door, i) => {
        const dcx = door.col * TILE + 12, dcy = door.row * TILE + TILE;
        const dist = Math.hypot(pos.x - dcx, pos.y - dcy);
        if (dist < TILE * 3 && dist < closestDist && i <= arenasCleared) {
          closestDist = dist; closest = { type: `arena${i}`, name: door.label };
        }
      });
      INTERACTABLES.npcs.forEach(npc => {
        const ncx = npc.col * TILE + 12, ncy = npc.row * TILE + 12;
        const dist = Math.hypot(pos.x - ncx, pos.y - ncy);
        if (dist < TILE * 3 && dist < closestDist) {
          closestDist = dist; closest = { type: npc.type, name: npc.name };
        }
      });
      INTERACTABLES.terminals.forEach(term => {
        const tcx = term.col * TILE + 12, tcy = term.row * TILE + 12;
        const dist = Math.hypot(pos.x - tcx, pos.y - tcy);
        if (dist < TILE * 2.5 && dist < closestDist) {
          closestDist = dist; closest = { type: term.type, name: term.name };
        }
      });
      setNearTarget(closest);
    }

    frame();
    return () => cancelAnimationFrame(animRef.current);
  }, [ready, arts, overlayActive, arenaStates, arenasCleared, blocked]);

  const runNum = meta?.totalRuns || 1;
  const wins = meta?.totalWins || 0;
  const losses = meta?.totalLosses || 0;

  return (
    <div className="hub-world" style={{
      position: 'relative', width: '100%', height: '100vh',
      background: '#020408', display: 'flex', alignItems: 'center',
      justifyContent: 'center', overflow: 'hidden',
    }}>
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
      }} />
      {/* CRT scanlines */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', opacity: 0.03,
        background: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
      }} />

      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{
        imageRendering: 'pixelated',
        width: Math.min(CANVAS_W * 2, window.innerWidth - 20),
        height: 'auto',
        opacity: overlayActive ? 0.3 : 1,
        filter: overlayActive ? 'blur(2px) brightness(0.5)' : 'none',
        transition: 'opacity 0.3s, filter 0.3s',
        zIndex: 1,
      }} />

      {/* HUD — top left */}
      <div style={{
        position: 'absolute', top: 16, left: 20, zIndex: 5,
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
        color: '#4a6a7a', textTransform: 'uppercase',
      }}>
        <div style={{ color: '#00ccff', marginBottom: 4 }}>// the ark</div>
        <div>orbital station — run #{runNum}</div>
      </div>

      {/* HUD — top right */}
      <div style={{
        position: 'absolute', top: 16, right: 20, zIndex: 5,
        fontFamily: 'var(--font-mono)', textAlign: 'right',
      }}>
        <div style={{ fontSize: 10, color: '#4a6a7a', letterSpacing: 1 }}>W:{wins} L:{losses}</div>
        <div style={{ fontSize: 10, color: '#6a8a9a', letterSpacing: 1, marginTop: 2 }}>arenas: {arenasCleared}/4</div>
        {runState && (
          <div style={{ fontSize: 9, color: '#3a5a6a', marginTop: 4, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <span style={{ color: '#ccaa22' }}>{runState.credits}c</span>
            <span style={{ color: '#00ff88' }}>{runState.biomass}bio</span>
            <span style={{ color: '#00ccff' }}>{runState.techPoints}tp</span>
          </div>
        )}
      </div>

      {/* Interaction prompt */}
      {nearTarget && !overlayActive && (
        <div style={{
          position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 5, fontFamily: 'var(--font-mono)', textAlign: 'center',
        }}>
          <div style={{
            fontSize: 14, color: '#00ccff', letterSpacing: 3, textTransform: 'uppercase',
            textShadow: '0 0 12px rgba(0,204,255,0.4)', animation: 'pulse 1.5s infinite',
          }}>
            [E] {nearTarget.name}
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div style={{
        position: 'absolute', bottom: 16, left: 20, zIndex: 5,
        fontFamily: 'var(--font-mono)', fontSize: 9, color: '#2a4a5a',
        letterSpacing: 1, textTransform: 'uppercase',
      }}>
        wasd move / e interact
      </div>
    </div>
  );
}
