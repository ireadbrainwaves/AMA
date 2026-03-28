import { useRef, useEffect, useState, useCallback } from 'react';

import workshopArt from '../assets/hub/workshop_sq.png';
import mutlabArt from '../assets/hub/mutlab_sq.png';
import cmdpostArt from '../assets/hub/cmdpost_sq.png';
import galleryArt from '../assets/hub/gallery_sq.png';
import corridorArt from '../assets/hub/corridor_sq.png';
import floorTileArt from '../assets/hub/floor_64.png';
import terminalArt from '../assets/hub/terminal_sq.png';

// PixelLab map objects
import objNpcHelix from '../assets/hub/objects/npc_helix.png';
import objNpcArk from '../assets/hub/objects/npc_ark.png';
import objNpcVex from '../assets/hub/objects/npc_vex.png';
import objBioTank from '../assets/hub/objects/bio_tank.png';
import objLabBench from '../assets/hub/objects/lab_bench.png';
import objWeaponRack from '../assets/hub/objects/weapon_rack.png';
import objTechWorkbench from '../assets/hub/objects/tech_workbench.png';
import objTechCrate from '../assets/hub/objects/tech_crate.png';
import objCmdConsole from '../assets/hub/objects/cmd_console.png';
import objTerminal from '../assets/hub/objects/terminal.png';
import objArenaDoor from '../assets/hub/objects/arena_door.png';
import objElevatorPad from '../assets/hub/objects/elevator_pad.png';
import objHoloDisplay from '../assets/hub/objects/holo_display.png';
import objPlayer from '../assets/hub/objects/player.png';

// PixelLab room backgrounds
import roomMutlab from '../assets/hub/objects/room_mutlab.png';
import roomWorkshop from '../assets/hub/objects/room_workshop.png';
import roomArena from '../assets/hub/objects/room_arena.png';
import roomCmdpost from '../assets/hub/objects/room_cmdpost.png';
import roomMainhall from '../assets/hub/objects/room_mainhall.png';

// PixelLab tilesets (4x4 Wang tile grids, 32px each tile)
import tsBaseFloor from '../assets/hub/tilesets/base_floor.png';
import tsCorridor from '../assets/hub/tilesets/corridor.png';
import tsHallFloor from '../assets/hub/tilesets/hall_floor.png';
import tsBioFloor from '../assets/hub/tilesets/bio_floor.png';
import tsTechFloor from '../assets/hub/tilesets/tech_floor.png';
import tsCmdFloor from '../assets/hub/tilesets/cmd_floor.png';
import tsGrate from '../assets/hub/tilesets/grate.png';

/* ═══════════════════════════════════════════════════════
   THE ARK — ORBITAL STAGING AREA (Cross/Plus Layout)

   Render pipeline:
   1. Clear → floor pattern → AI art backgrounds (high opacity)
   2. Structural tiles (walls, grates, LEDs)
   3. Entities (doors, NPCs, terminals, player)
   4. LIGHT MAP (offscreen canvas, multiply blend — THE KEY)
   5. Additive glow bloom (lighter blend)
   6. Foreground overlay pipes
   7. Particles (additive)
   8. Post-processing (vignette + color grade)

   Layout:
              ┌──────────────────┐
              │  ARENA CORRIDOR  │  cols 8-22, rows 1-5
              │  [1-4] [5-8]    │
              └────────┬─────────┘
   ┌──────────┐  ┌─────┴─────┐  ┌──────────┐
   │ MUTATION  ├──┤   MAIN    ├──┤  TECH    │  wings: rows 7-16
   │ LAB       │  │   HALL    │  │  SHOP    │  left: 1-9, center: 10-20, right: 21-29
   └──────────┘  ├───────────┤  └──────────┘
                 │ COMMAND   │  cols 10-20, rows 17-22
                 │ POST      │
                 └─────┬─────┘
                     SPAWN     row 23
   ═══════════════════════════════════════════════════════ */

const TILE = 32;
const COLS = 30;
const ROWS = 26;
const CANVAS_W = COLS * TILE;
const CANVAS_H = ROWS * TILE;
const PLAYER_SPEED = 2.5;

const W = 0, F = 1, P = 5, G = 6, L = 7;

function hexRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/* ═══ TILEMAP — Cross/Plus Shape with Arena Launch Bay ═══
   ┌──────────────────────────┐
   │     ARENA LAUNCH BAY     │  cols 7-23, rows 1-8
   │  bracket  elevator  holo │
   └────────────┬─────────────┘
   ┌────────┐ ┌─┴───┐ ┌────────┐
   │MUTATION ├─┤MAIN ├─┤  TECH  │  wings: rows 10-18
   │  LAB    │ │HALL │ │  SHOP  │  left: 1-9, center: 10-20, right: 21-29
   └────────┘ ├─────┤ └────────┘
              │ CMD  │  cols 10-20, rows 19-23
              │ POST │
              └──┬───┘
               SPAWN   row 24
*/
function buildMap() {
  const m = Array.from({ length: ROWS }, () => Array(COLS).fill(W));

  // ─── ARENA LAUNCH BAY (top): rows 1-8, cols 7-23 (17 wide, 8 tall) ───
  for (let r = 1; r <= 8; r++)
    for (let c = 7; c <= 23; c++) m[r][c] = F;
  // Grate border around bay
  for (let c = 7; c <= 23; c++) { m[1][c] = G; m[8][c] = G; }
  for (let r = 1; r <= 8; r++) { m[r][7] = G; m[r][23] = G; }
  // LED ring around elevator area (rows 3-6, cols 12-18)
  for (let c = 12; c <= 18; c++) { m[3][c] = L; m[6][c] = L; }
  for (let r = 3; r <= 6; r++) { m[r][12] = L; m[r][18] = L; }
  // Corner LEDs
  m[2][8] = L; m[2][22] = L; m[7][8] = L; m[7][22] = L;

  // ─── MAIN HALL (vertical spine): rows 9-23, cols 10-20 ───
  for (let r = 9; r <= 23; r++)
    for (let c = 10; c <= 20; c++) m[r][c] = F;
  // Central LED spine
  for (let r = 9; r <= 23; r++) m[r][15] = (r % 2 === 0) ? L : F;
  // Transition grates
  for (let c = 10; c <= 20; c++) { m[9][c] = G; m[23][c] = G; }

  // ─── LEFT WING — Mutation Lab: rows 10-18, cols 1-9 ───
  for (let r = 10; r <= 18; r++)
    for (let c = 1; c <= 9; c++) m[r][c] = F;
  for (let c = 1; c <= 9; c++) { m[10][c] = G; m[18][c] = G; }
  for (let r = 11; r <= 17; r++) m[r][1] = P;
  m[12][3] = L; m[16][7] = L;

  // ─── RIGHT WING — Tech Workshop: rows 10-18, cols 21-29 ───
  for (let r = 10; r <= 18; r++)
    for (let c = 21; c <= 29; c++) m[r][c] = F;
  for (let c = 21; c <= 29; c++) { m[10][c] = G; m[18][c] = G; }
  for (let r = 11; r <= 17; r++) m[r][29] = P;
  m[12][27] = L; m[16][23] = L;

  // ─── COMMAND POST (bottom): rows 19-23, cols 10-20 ───
  for (let c = 10; c <= 20; c++) m[19][c] = G;
  m[21][11] = L; m[21][19] = L;

  // ─── SPAWN ENTRY: row 24, cols 13-17 ───
  for (let c = 13; c <= 17; c++) { m[24][c] = F; }
  m[24][15] = L;

  // ─── Wing doorways (wide 3-tile openings) ───
  for (let r = 13; r <= 15; r++) { m[r][9] = G; m[r][10] = F; }
  for (let r = 13; r <= 15; r++) { m[r][20] = F; m[r][21] = G; }

  // ─── Bay to hall doorway: cols 12-18, row 8-9 ───
  for (let c = 12; c <= 18; c++) { m[8][c] = G; m[9][c] = G; }

  return m;
}

const TILEMAP = buildMap();

/* ─── Zone map: which tileset covers each tile ─── */
// 0=base, 1=corridor, 2=hall, 3=bio, 4=tech, 5=cmd, 6=grate
const ZONE_KEYS = ['tsBase', 'tsCorridor', 'tsHall', 'tsBio', 'tsTech', 'tsCmd', 'tsGrate'];
function buildZoneMap() {
  const z = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  // Arena corridor: rows 1-5, cols 8-22 → corridor tileset
  for (let r = 1; r <= 5; r++) for (let c = 8; c <= 22; c++) z[r][c] = 1;
  // Main hall spine: rows 6-22, cols 10-20 → hall tileset
  for (let r = 6; r <= 22; r++) for (let c = 10; c <= 20; c++) z[r][c] = 2;
  // Left wing (mutation lab): rows 7-16, cols 1-9 → bio tileset
  for (let r = 7; r <= 16; r++) for (let c = 1; c <= 9; c++) z[r][c] = 3;
  // Right wing (tech workshop): rows 7-16, cols 21-29 → tech tileset
  for (let r = 7; r <= 16; r++) for (let c = 21; c <= 29; c++) z[r][c] = 4;
  // Command post: rows 17-22, cols 10-20 → cmd tileset
  for (let r = 17; r <= 22; r++) for (let c = 10; c <= 20; c++) z[r][c] = 5;
  // Grate tiles override
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (TILEMAP[r][c] === G) z[r][c] = 6;
  }
  return z;
}
const ZONE_MAP = buildZoneMap();

/* Wang tile picker: pick tile from 4x4 tileset based on neighbors.
   Each tile in the 4x4 grid represents a corner configuration.
   We use a simple approach: sample if neighbors are same-zone to pick variety. */
function pickWangTile(tilesetImg, r, c, ctx, sx, sy) {
  if (!tilesetImg) return false;
  // Use position hash for consistent but varied tile selection
  const hash = ((r * 7 + c * 13) % 16);
  const tx = (hash % 4) * 32;
  const ty = Math.floor(hash / 4) * 32;
  ctx.drawImage(tilesetImg, tx, ty, 32, 32, sx, sy, TILE, TILE);
  return true;
}

/* ─── Room art zones — PixelLab cohesive backgrounds ─── */
const ROOM_ZONES = [
  { img: 'roomArena',    col: 7,  row: 1,  colSpan: 17, rowSpan: 8,  opacity: 0.80 },
  { img: 'roomMainhall', col: 10, row: 9,  colSpan: 11, rowSpan: 10, opacity: 0.65 },
  { img: 'roomMutlab',   col: 1,  row: 10, colSpan: 9,  rowSpan: 9,  opacity: 0.80 },
  { img: 'roomWorkshop', col: 21, row: 10, colSpan: 9,  rowSpan: 9,  opacity: 0.80 },
  { img: 'roomCmdpost',  col: 10, row: 19, colSpan: 11, rowSpan: 5,  opacity: 0.75 },
];

/* ─── Interactables ─── */
const INTERACTABLES = {
  // Single elevator replaces 8 arena doors — fight number tracked by game state
  elevator: { col: 15, row: 5, type: 'elevator', name: 'ARENA ELEVATOR', color: '#00ddff' },
  npcs: [
    { col: 5,  row: 14, type: 'helix', name: 'Dr. Helix',  color: '#00ff88', title: 'MUTATION SPECIALIST' },
    { col: 25, row: 14, type: 'ark',   name: 'RK-7 "Ark"', color: '#ccaa22', title: 'TECH MERCHANT' },
    { col: 15, row: 21, type: 'vex',   name: 'Cmdr. Vex',  color: '#aa66ee', title: 'TOURNAMENT DIRECTOR' },
  ],
  terminals: [
    { col: 4,  row: 16, type: 'codex',    name: 'Species Codex', color: '#00ccff' },
    { col: 26, row: 16, type: 'supplies',  name: 'Supplies',     color: '#ccaa22' },
    { col: 9,  row: 2,  type: 'bracket',   name: 'Bracket',      color: '#00ffee', wide: true },
    { col: 10, row: 2,  type: 'bracket',   name: 'Bracket',      color: '#00ffee', wide: true },
  ],
};

const WALL_MONITORS = [
  { col: 8,  row: 0, w: 2, color: '#00ccff' },
  { col: 14, row: 0, w: 2, color: '#00ddff' },
  { col: 21, row: 0, w: 2, color: '#00ccff' },
];

const FG_PIPES = {
  horizontal: [
    { row: 9.5,  colStart: 7,  colEnd: 23 },
    { row: 18.5, colStart: 1,  colEnd: 29 },
  ],
  vertical: [
    { col: 9.5,  rowStart: 10, rowEnd: 18 },
    { col: 20.5, rowStart: 10, rowEnd: 18 },
  ],
};

/* ═══ LIGHT SOURCES ═══ */
function getLightSources(playerX, playerY, arenasCleared, arenaStates, time) {
  const lights = [];

  // Player personal light
  lights.push({ x: playerX, y: playerY, radius: TILE * 7, r: 120, g: 200, b: 240, intensity: 0.9 });

  // NPC station lights
  lights.push(
    { x: 5 * TILE + 16, y: 14 * TILE + 16, radius: TILE * 5, r: 80, g: 240, b: 160, intensity: 0.85 },
    { x: 25 * TILE + 16, y: 14 * TILE + 16, radius: TILE * 5, r: 230, g: 200, b: 100, intensity: 0.85 },
    { x: 15 * TILE + 16, y: 21 * TILE + 16, radius: TILE * 5, r: 190, g: 150, b: 250, intensity: 0.85 },
  );

  // Corridor LED lights — main hall spine
  for (let r = 9; r <= 23; r += 2) {
    const flicker = 0.45 + Math.sin(time * 0.003 + r * 1.7) * 0.1;
    lights.push({ x: 15 * TILE + 16, y: r * TILE + 16, radius: TILE * 3, r: 0, g: 180, b: 230, intensity: flicker });
  }
  // Arena launch bay LED ring
  for (let c = 12; c <= 18; c += 2) {
    const flicker = 0.5 + Math.sin(time * 0.004 + c * 1.3) * 0.15;
    lights.push({ x: c * TILE + 16, y: 3 * TILE + 16, radius: TILE * 2.5, r: 0, g: 200, b: 255, intensity: flicker });
    lights.push({ x: c * TILE + 16, y: 6 * TILE + 16, radius: TILE * 2.5, r: 0, g: 200, b: 255, intensity: flicker });
  }

  // Elevator light — pulsing cyan, intensity based on availability
  const elev = INTERACTABLES.elevator;
  if (arenasCleared < 8) {
    const pulse = 0.7 + Math.sin(time * 0.003) * 0.25;
    lights.push({ x: elev.col * TILE + 16, y: elev.row * TILE + 16, radius: TILE * 8, r: 0, g: 220, b: 255, intensity: pulse });
  } else {
    lights.push({ x: elev.col * TILE + 16, y: elev.row * TILE + 16, radius: TILE * 5, r: 0, g: 240, b: 140, intensity: 0.6 });
  }

  // Wall monitor glows
  WALL_MONITORS.forEach(mon => {
    const [r, g, b] = hexRgb(mon.color);
    lights.push({ x: mon.col * TILE + mon.w * TILE / 2, y: mon.row * TILE + 14, radius: TILE * 2.5, r, g, b, intensity: 0.4 });
  });

  // Terminal glows
  INTERACTABLES.terminals.forEach(term => {
    const [r, g, b] = hexRgb(term.color);
    lights.push({ x: term.col * TILE + 16, y: term.row * TILE + 16, radius: TILE * 3.5, r, g, b, intensity: 0.5 });
  });

  // Entry light
  lights.push({ x: 15 * TILE, y: 24 * TILE + 16, radius: TILE * 3.5, r: 0, g: 200, b: 240, intensity: 0.4 });

  // Bracket terminal glow
  const bracketPulse = 0.45 + Math.sin(time * 0.002) * 0.15;
  lights.push({ x: 9.5 * TILE, y: 2 * TILE + 16, radius: TILE * 3, r: 0, g: 255, b: 238, intensity: bracketPulse });

  // Wing ambient fills
  lights.push(
    { x: 5 * TILE, y: 14 * TILE, radius: TILE * 5, r: 30, g: 60, b: 50, intensity: 0.2 },
    { x: 25 * TILE, y: 14 * TILE, radius: TILE * 5, r: 50, g: 45, b: 25, intensity: 0.2 },
    { x: 15 * TILE, y: 14 * TILE, radius: TILE * 3, r: 30, g: 50, b: 70, intensity: 0.2 },
    { x: 15 * TILE, y: 21 * TILE, radius: TILE * 4, r: 40, g: 30, b: 60, intensity: 0.3 },
    // Arena launch bay — dramatic ambient glow
    { x: 15 * TILE, y: 5 * TILE, radius: TILE * 8, r: 0, g: 60, b: 100, intensity: 0.35 },
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
    const sources = {
      workshop: workshopArt, mutlab: mutlabArt, cmdpost: cmdpostArt, gallery: galleryArt, corridor: corridorArt, floor: floorTileArt, terminal: terminalArt,
      npcHelix: objNpcHelix, npcArk: objNpcArk, npcVex: objNpcVex,
      bioTank: objBioTank, labBench: objLabBench, weaponRack: objWeaponRack,
      techWorkbench: objTechWorkbench, techCrate: objTechCrate, cmdConsole: objCmdConsole,
      objTerminal: objTerminal, arenaDoor: objArenaDoor, holoDisplay: objHoloDisplay, player: objPlayer, elevatorPad: objElevatorPad,
      tsBase: tsBaseFloor, tsCorridor: tsCorridor, tsHall: tsHallFloor,
      tsBio: tsBioFloor, tsTech: tsTechFloor, tsCmd: tsCmdFloor, tsGrate: tsGrate,
      roomMutlab: roomMutlab, roomWorkshop: roomWorkshop, roomArena: roomArena,
      roomCmdpost: roomCmdpost, roomMainhall: roomMainhall,
    };
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
  const posRef = useRef({ x: 15 * TILE, y: 24 * TILE });
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

    if (!lightCanvasRef.current) {
      lightCanvasRef.current = document.createElement('canvas');
      lightCanvasRef.current.width = CANVAS_W;
      lightCanvasRef.current.height = CANVAS_H;
    }
    const lCanvas = lightCanvasRef.current;
    const lctx = lCanvas.getContext('2d');

    let floorPattern = null;
    if (ready && arts.floor) floorPattern = ctx.createPattern(arts.floor, 'repeat');

    let running = true;
    function frame() {
      if (!running) return;
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

      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Floor tile pattern
      if (floorPattern) {
        ctx.save();
        ctx.globalAlpha = 0.38;
        ctx.fillStyle = floorPattern;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.restore();
      }

      // Metal floor plate seams
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 0.5;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
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
          const fade = TILE * 1.5;
          const lGrad = ctx.createLinearGradient(zx, 0, zx + fade, 0);
          lGrad.addColorStop(0, 'rgba(2, 4, 8, 0.7)'); lGrad.addColorStop(1, 'rgba(2, 4, 8, 0)');
          ctx.fillStyle = lGrad; ctx.fillRect(zx, zy, fade, zh);
          const rGrad = ctx.createLinearGradient(zx + zw - fade, 0, zx + zw, 0);
          rGrad.addColorStop(0, 'rgba(2, 4, 8, 0)'); rGrad.addColorStop(1, 'rgba(2, 4, 8, 0.7)');
          ctx.fillStyle = rGrad; ctx.fillRect(zx + zw - fade, zy, fade, zh);
          const tGrad = ctx.createLinearGradient(0, zy, 0, zy + fade);
          tGrad.addColorStop(0, 'rgba(2, 4, 8, 0.6)'); tGrad.addColorStop(1, 'rgba(2, 4, 8, 0)');
          ctx.fillStyle = tGrad; ctx.fillRect(zx, zy, zw, fade);
          const bGrad = ctx.createLinearGradient(0, zy + zh - fade, 0, zy + zh);
          bGrad.addColorStop(0, 'rgba(2, 4, 8, 0)'); bGrad.addColorStop(1, 'rgba(2, 4, 8, 0.6)');
          ctx.fillStyle = bGrad; ctx.fillRect(zx, zy + zh - fade, zw, fade);
        }
      }

      // Structural tiles — procedural rendering
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const sx = c * TILE, sy = r * TILE;
          const tile = TILEMAP[r][c];
          if (tile === W) {
            ctx.fillStyle = '#0c1628';
            ctx.fillRect(sx, sy, TILE, TILE);
            ctx.fillStyle = '#1a2a42'; ctx.fillRect(sx, sy, TILE, 1); ctx.fillRect(sx, sy, 1, TILE);
            ctx.fillStyle = '#060c18'; ctx.fillRect(sx + TILE - 1, sy, 1, TILE); ctx.fillRect(sx, sy + TILE - 1, TILE, 1);
            if ((c + r) % 3 === 0) {
              ctx.fillStyle = '#2a3a52';
              ctx.fillRect(sx + 4, sy + 4, 1, 1); ctx.fillRect(sx + TILE - 5, sy + TILE - 5, 1, 1);
            }
          } else if (tile === P) {
            ctx.fillStyle = '#0a1020'; ctx.fillRect(sx, sy, TILE, TILE);
            ctx.fillStyle = '#1a3040'; ctx.fillRect(sx + 6, sy + 10, TILE - 12, 12);
            ctx.fillStyle = '#0a1a25'; ctx.fillRect(sx + 6, sy + 14, TILE - 12, 6);
            ctx.fillStyle = '#2a4858'; ctx.fillRect(sx + 5, sy + 15, 2, 2); ctx.fillRect(sx + TILE - 7, sy + 15, 2, 2);
          } else if (tile === G) {
            ctx.fillStyle = 'rgba(6, 10, 18, 0.4)'; ctx.fillRect(sx, sy, TILE, TILE);
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.06)'; ctx.lineWidth = 0.5;
            for (let i = 0; i < TILE; i += 8) {
              ctx.beginPath(); ctx.moveTo(sx + i, sy); ctx.lineTo(sx + i, sy + TILE); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(sx, sy + i); ctx.lineTo(sx + TILE, sy + i); ctx.stroke();
            }
          } else if (tile === L) {
            ctx.fillStyle = 'rgba(8, 14, 24, 0.2)'; ctx.fillRect(sx, sy, TILE, TILE);
            const pulse = 0.5 + Math.sin(time * 0.002 + c * 0.5 + r * 0.3) * 0.25;
            ctx.fillStyle = '#060c16'; ctx.fillRect(sx + 10, sy + 12, TILE - 20, 6);
            ctx.fillStyle = `rgba(0, 200, 255, ${pulse * 0.5})`; ctx.fillRect(sx + 11, sy + 13, TILE - 22, 4);
            ctx.fillStyle = `rgba(0, 180, 255, ${pulse * 0.08})`; ctx.fillRect(sx + 4, sy + 6, TILE - 8, TILE - 12);
          }
        }
      }

      // Equipment — PixelLab sprites placed in rooms
      const equipmentSprites = [
        // Left wing (Mutation Lab)
        { img: 'bioTank',  x: 2,  y: 11, w: 1.5, h: 2 },
        { img: 'bioTank',  x: 2,  y: 15, w: 1.5, h: 2 },
        { img: 'labBench', x: 3,  y: 16, w: 3,   h: 1.5 },
        // Right wing (Tech Workshop)
        { img: 'weaponRack',    x: 27, y: 11, w: 1.5, h: 2 },
        { img: 'techWorkbench', x: 22, y: 16, w: 3,   h: 1.5 },
        { img: 'techCrate',     x: 22, y: 11, w: 1.5, h: 1.5 },
        { img: 'techCrate',     x: 27, y: 15, w: 1.5, h: 1.5 },
        // Command post
        { img: 'cmdConsole', x: 17, y: 20, w: 2, h: 2 },
        { img: 'cmdConsole', x: 11, y: 20, w: 2, h: 2 },
      ];
      for (const eq of equipmentSprites) {
        const eqImg = arts[eq.img];
        const ex = eq.x * TILE, ey = eq.y * TILE, ew = eq.w * TILE, eh = eq.h * TILE;
        if (eqImg) {
          ctx.drawImage(eqImg, ex, ey, ew, eh);
        } else {
          // Fallback procedural
          ctx.fillStyle = '#0a1420'; ctx.fillRect(ex, ey, ew, eh);
          ctx.fillStyle = '#1a2430'; ctx.fillRect(ex, ey, ew, 1);
        }
      }

      // Blinking status lights
      const supplyLights = [
        { x: 2.3, y: 11.5, color: '#00ff88' }, { x: 2.3, y: 15.3, color: '#00ff88' },
        { x: 7.3, y: 11.5, color: '#00ccaa' },
        { x: 27.3, y: 11.5, color: '#ccaa22' }, { x: 27.3, y: 15.3, color: '#ff6644' },
        { x: 22.3, y: 11.5, color: '#ccaa22' }, { x: 18.3, y: 20.3, color: '#aa66ee' },
      ];
      for (const sl of supplyLights) {
        const on = Math.sin(time * 0.003 + sl.x * 7 + sl.y * 13) > 0;
        if (on) {
          ctx.fillStyle = sl.color + '88'; ctx.fillRect(sl.x * TILE, sl.y * TILE, 2, 2);
          ctx.fillStyle = sl.color + '22'; ctx.fillRect(sl.x * TILE - 2, sl.y * TILE - 2, 6, 6);
        }
      }

      // Floor hazard stripes around elevator
      ctx.save(); ctx.globalAlpha = 0.1;
      const elevX = INTERACTABLES.elevator.col * TILE, elevY = INTERACTABLES.elevator.row * TILE;
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ccaa00' : '#020408';
        ctx.fillRect(elevX - TILE * 1.5 + i * 8, elevY + TILE * 1.5, 7, 3);
        ctx.fillRect(elevX - TILE * 1.5 + i * 8, elevY - TILE * 0.5 - 3, 7, 3);
      }
      ctx.restore();

      // Wall monitors
      WALL_MONITORS.forEach(mon => {
        const mx = mon.col * TILE, my = mon.row * TILE;
        const mw = mon.w * TILE, mh = TILE - 8;
        const [mr, mg, mb] = hexRgb(mon.color);
        ctx.fillStyle = '#040810'; ctx.fillRect(mx + 3, my + 4, mw - 6, mh);
        ctx.strokeStyle = `rgba(${mr}, ${mg}, ${mb}, 0.5)`; ctx.lineWidth = 1;
        ctx.strokeRect(mx + 3, my + 4, mw - 6, mh);
        const scanY = ((time * 0.02 + mon.col * 10) % mh);
        ctx.fillStyle = `rgba(${mr}, ${mg}, ${mb}, 0.4)`; ctx.fillRect(mx + 4, my + 5 + scanY, mw - 8, 1);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = `rgba(${mr}, ${mg}, ${mb}, 0.2)`;
          ctx.fillRect(mx + 5, my + 7 + i * 5, mw * (0.3 + Math.sin(time * 0.001 + i * 2) * 0.2), 1);
        }
      });

      // Wall LEDs
      for (let c = 7; c <= 23; c += 3) {
        if (Math.sin(time * 0.003 + c * 7.3) > 0.2) {
          ctx.fillStyle = 'rgba(0, 220, 255, 0.5)'; ctx.fillRect(c * TILE + TILE / 2 - 1, 1, 2, 2);
        }
      }

      // Arena elevator — single launch pad
      const elev = INTERACTABLES.elevator;
      const ex = elev.col * TILE, ey = elev.row * TILE;
      const elevImg = arts.elevatorPad;
      const allCleared = arenasCleared >= 8;
      const elevPulse = 0.5 + Math.sin(time * 0.003) * 0.3;
      // Platform base
      if (elevImg) {
        ctx.drawImage(elevImg, ex - TILE * 1.5, ey - TILE * 1.5, TILE * 3, TILE * 3);
      } else {
        // Procedural elevator pad
        ctx.fillStyle = '#0a1828'; ctx.beginPath(); ctx.arc(ex + 16, ey + 16, TILE * 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#060c18'; ctx.beginPath(); ctx.arc(ex + 16, ey + 16, TILE * 1.0, 0, Math.PI * 2); ctx.fill();
        // Energy ring
        ctx.strokeStyle = allCleared ? `rgba(0, 255, 136, ${elevPulse})` : `rgba(0, 220, 255, ${elevPulse})`;
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ex + 16, ey + 16, TILE * 1.2, 0, Math.PI * 2); ctx.stroke();
        // Inner ring
        ctx.strokeStyle = allCleared ? `rgba(0, 255, 136, ${elevPulse * 0.5})` : `rgba(0, 220, 255, ${elevPulse * 0.5})`;
        ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ex + 16, ey + 16, TILE * 0.7, 0, Math.PI * 2); ctx.stroke();
        // Down arrow
        ctx.fillStyle = `rgba(0, 220, 255, ${elevPulse * 0.8})`;
        ctx.beginPath(); ctx.moveTo(ex + 8, ey + 10); ctx.lineTo(ex + 24, ey + 10); ctx.lineTo(ex + 16, ey + 22); ctx.closePath(); ctx.fill();
      }
      // Fight info text
      ctx.font = 'bold 14px "Share Tech Mono", monospace'; ctx.textAlign = 'center';
      if (allCleared) {
        ctx.fillStyle = '#66ee88';
        ctx.fillText('CHAMPION', ex + 16, ey - TILE * 1.6);
      } else {
        ctx.fillStyle = `rgba(0, 220, 255, ${0.6 + elevPulse * 0.3})`;
        ctx.fillText(`FIGHT ${arenasCleared + 1} OF 8`, ex + 16, ey - TILE * 1.6);
      }
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = '#4a6a7a';
      ctx.fillText('ARENA ELEVATOR', ex + 16, ey + TILE * 1.8);
      // Progress pips
      for (let i = 0; i < 8; i++) {
        const pipX = ex - 28 + i * 8;
        ctx.fillStyle = arenaStates?.[i]?.cleared ? '#00ff88' : i === arenasCleared ? `rgba(0, 220, 255, ${elevPulse})` : '#1a2a3a';
        ctx.fillRect(pipX, ey + TILE * 2.1, 6, 4);
      }

      // Holographic tournament display — PixelLab sprite
      const holoX = 19 * TILE, holoY = 2 * TILE;
      const holoW = TILE * 4, holoH = TILE * 2.5;
      const holoImg = arts.holoDisplay;
      if (holoImg) {
        ctx.save();
        ctx.globalAlpha = 0.85 + Math.sin(time * 0.002) * 0.1;
        ctx.drawImage(holoImg, holoX - 8, holoY - 4, holoW + 16, holoH + 8);
        ctx.restore();
        // Scanline overlay on top of sprite
        const holoScan = ((time * 0.02) % holoH);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.15)'; ctx.fillRect(holoX, holoY + holoScan, holoW, 1);
      } else {
        // Fallback procedural
        ctx.fillStyle = '#0a1828'; ctx.fillRect(holoX - 2, holoY + holoH, holoW + 4, 5);
        ctx.save(); ctx.globalAlpha = 0.2;
        const holoGrad = ctx.createLinearGradient(holoX, holoY, holoX, holoY + holoH);
        holoGrad.addColorStop(0, 'rgba(0, 200, 255, 0.3)'); holoGrad.addColorStop(1, 'rgba(0, 200, 255, 0.4)');
        ctx.fillStyle = holoGrad; ctx.fillRect(holoX + 2, holoY + 2, holoW - 4, holoH - 4);
        ctx.restore();
      }
      // Arena status dots always drawn
      ctx.save(); ctx.globalAlpha = 0.5;
      for (let i = 0; i < 4; i++) {
        const dotX = holoX + 10 + (i < 2 ? 0 : holoW - 20);
        const dotY = holoY + 10 + (i % 2) * 20;
        ctx.fillStyle = arenaStates?.[i]?.cleared ? '#00ff88' : '#00ccff';
        ctx.fillRect(dotX, dotY, 5, 5);
      }
      ctx.restore();
      ctx.font = '7px "Share Tech Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(0, 220, 255, ${0.3 + Math.sin(time * 0.002) * 0.1})`;
      ctx.fillText('TOURNAMENT', holoX + holoW / 2, holoY + holoH - 8);

      // NPCs — PixelLab sprites with bob animation
      const npcImgMap = { helix: 'npcHelix', ark: 'npcArk', vex: 'npcVex' };
      INTERACTABLES.npcs.forEach(npc => {
        const nx = npc.col * TILE, ny = npc.row * TILE;
        const bob = Math.sin(time * 0.002 + npc.col) * 1.5;
        const npcImg = arts[npcImgMap[npc.type]];
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(nx + TILE / 2, ny + TILE + 2, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        // Draw sprite centered on tile, with bob
        if (npcImg) {
          const scale = TILE * 1.8 / Math.max(npcImg.width, npcImg.height);
          const sw = npcImg.width * scale, sh = npcImg.height * scale;
          ctx.drawImage(npcImg, nx + TILE / 2 - sw / 2, ny + TILE / 2 - sh / 2 + bob, sw, sh);
        }
        // Nameplate
        ctx.font = '10px "Share Tech Mono", monospace';
        const nameWidth = ctx.measureText(npc.name.toUpperCase()).width || 70;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(nx + TILE / 2 - nameWidth / 2 - 4, ny - 22, nameWidth + 8, 16);
        ctx.fillStyle = npc.color; ctx.textAlign = 'center';
        ctx.fillText(npc.name.toUpperCase(), nx + TILE / 2, ny - 10);
        ctx.font = '8px "Share Tech Mono", monospace'; ctx.fillStyle = npc.color + '88';
        ctx.fillText(npc.title, nx + TILE / 2, ny - 1);
      });

      // Terminals — PixelLab sprite for non-bracket, procedural bracket
      const drawnBracket = { done: false };
      const termImg = arts.objTerminal;
      INTERACTABLES.terminals.forEach(term => {
        if (term.type === 'bracket') {
          if (drawnBracket.done) return;
          drawnBracket.done = true;
          const bx = 9 * TILE, by = 2 * TILE, bw = TILE * 2;
          // Bracket is the holo display area — already drawn above
          ctx.font = '9px "Share Tech Mono", monospace'; ctx.fillStyle = '#00ffeecc'; ctx.textAlign = 'center';
          ctx.fillText('BRACKET', bx + bw / 2, by + TILE + 12);
          return;
        }
        const tx = term.col * TILE, ty = term.row * TILE;
        if (termImg) {
          ctx.drawImage(termImg, tx, ty - 8, TILE, TILE + 8);
        } else {
          ctx.fillStyle = '#0a1220'; ctx.fillRect(tx + 3, ty + 14, TILE - 6, TILE - 14);
          ctx.fillStyle = term.color + '20'; ctx.fillRect(tx + 4, ty + 3, TILE - 8, 14);
        }
        // Scanline on top
        const scanY = (time * 0.02 + term.col * 20) % TILE;
        ctx.fillStyle = term.color + '22'; ctx.fillRect(tx + 4, ty + scanY, TILE - 8, 1);
        ctx.font = '9px "Share Tech Mono", monospace'; ctx.fillStyle = term.color + 'cc'; ctx.textAlign = 'center';
        ctx.fillText(term.name.toUpperCase(), tx + TILE / 2, ty + TILE + 12);
      });

      // Player sprite — PixelLab image with shadow
      const px = pos.x, py = pos.y;
      const dir = dirRef.current;
      const playerImg = arts.player;
      // Shadow
      ctx.fillStyle = 'rgba(0, 200, 255, 0.18)';
      ctx.beginPath(); ctx.ellipse(px, py + 12, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      if (playerImg) {
        const pScale = 1.6;
        const pw = playerImg.width * pScale, ph = playerImg.height * pScale;
        ctx.drawImage(playerImg, px - pw / 2, py - ph / 2 - 4, pw, ph);
      } else {
        // Fallback procedural player
        ctx.fillStyle = '#2299bb'; ctx.fillRect(px - 7, py - 6, 14, 10);
        ctx.fillStyle = '#44ccee'; ctx.fillRect(px - 5, py - 13, 10, 7);
        ctx.fillStyle = '#88eeff'; ctx.fillRect(px - 4, py - 11, 8, 3);
        ctx.fillStyle = '#ccffff'; ctx.fillRect(px + dir.dx * 2 - 1, py - 10, 3, 2);
      }
      // Energy core glow (always drawn on top)
      ctx.fillStyle = `rgba(100, 240, 255, ${0.4 + Math.sin(time * 0.004) * 0.2})`;
      ctx.fillRect(px - 1, py - 3, 2, 2);

      // ════════════════════════════════════════
      // PASS 2: LIGHT MAP
      // ════════════════════════════════════════
      lctx.fillStyle = 'rgb(60, 65, 85)';
      lctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      lctx.globalCompositeOperation = 'lighter';
      const lights = getLightSources(pos.x, pos.y, arenasCleared, arenaStates, time);
      for (const light of lights) {
        const grad = lctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
        const cr = Math.min(255, light.r + 60), cg = Math.min(255, light.g + 60), cb = Math.min(255, light.b + 60);
        grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${light.intensity})`);
        grad.addColorStop(0.4, `rgba(${light.r}, ${light.g}, ${light.b}, ${light.intensity * 0.4})`);
        grad.addColorStop(1, `rgba(${light.r}, ${light.g}, ${light.b}, 0)`);
        lctx.fillStyle = grad; lctx.beginPath(); lctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2); lctx.fill();
      }
      lctx.globalCompositeOperation = 'source-over';
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(lCanvas, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      // ════════════════════════════════════════
      // PASS 3: ADDITIVE GLOW BLOOM
      // ════════════════════════════════════════
      ctx.globalCompositeOperation = 'lighter';
      INTERACTABLES.npcs.forEach(npc => {
        const [r, g, b] = hexRgb(npc.color);
        const lx = npc.col * TILE + 16, ly = npc.row * TILE + 16;
        const outerGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, TILE * 3);
        outerGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.12)`); outerGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.04)`); outerGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = outerGrad; ctx.beginPath(); ctx.arc(lx, ly, TILE * 3, 0, Math.PI * 2); ctx.fill();
        const coreGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, TILE * 1.2);
        coreGrad.addColorStop(0, `rgba(${Math.min(255, r + 80)}, ${Math.min(255, g + 80)}, ${Math.min(255, b + 80)}, 0.25)`); coreGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = coreGrad; ctx.beginPath(); ctx.arc(lx, ly, TILE * 1.2, 0, Math.PI * 2); ctx.fill();
      });
      // Elevator bloom
      {
        const edx = INTERACTABLES.elevator.col * TILE + 16, edy = INTERACTABLES.elevator.row * TILE + 16;
        const elevGrad = ctx.createRadialGradient(edx, edy, 0, edx, edy, TILE * 5);
        const ep = 0.16 + Math.sin(time * 0.003) * 0.08;
        elevGrad.addColorStop(0, `rgba(0, 240, 255, ${ep})`);
        elevGrad.addColorStop(0.3, `rgba(0, 200, 255, ${ep * 0.4})`);
        elevGrad.addColorStop(1, 'rgba(0, 200, 255, 0)');
        ctx.fillStyle = elevGrad; ctx.beginPath(); ctx.arc(edx, edy, TILE * 5, 0, Math.PI * 2); ctx.fill();
      }
      // Player glow
      const pGrad = ctx.createRadialGradient(px, py, 0, px, py, TILE * 3.5);
      pGrad.addColorStop(0, 'rgba(120, 240, 255, 0.28)'); pGrad.addColorStop(0.3, 'rgba(100, 220, 255, 0.12)');
      pGrad.addColorStop(0.6, 'rgba(80, 200, 255, 0.04)'); pGrad.addColorStop(1, 'rgba(80, 200, 255, 0)');
      ctx.fillStyle = pGrad; ctx.beginPath(); ctx.arc(px, py, TILE * 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // ════════════════════════════════════════
      // PASS 4: FOREGROUND OVERLAY PIPES
      // ════════════════════════════════════════
      ctx.save(); ctx.globalAlpha = 0.5;
      FG_PIPES.horizontal.forEach(pipe => {
        const pipeY = pipe.row * TILE, px1 = pipe.colStart * TILE, px2 = pipe.colEnd * TILE;
        ctx.fillStyle = '#080e18'; ctx.fillRect(px1, pipeY, px2 - px1, 5);
        ctx.fillStyle = '#1a2838'; ctx.fillRect(px1, pipeY, px2 - px1, 1);
        ctx.fillStyle = '#040810'; ctx.fillRect(px1, pipeY + 4, px2 - px1, 1);
      });
      FG_PIPES.vertical.forEach(pipe => {
        const cx = pipe.col * TILE, cy1 = pipe.rowStart * TILE, cy2 = pipe.rowEnd * TILE;
        ctx.fillStyle = '#081018'; ctx.fillRect(cx, cy1, 3, cy2 - cy1);
        for (let y = cy1; y < cy2; y += TILE) { ctx.fillStyle = '#1a2a3a'; ctx.fillRect(cx, y, 3, 1); }
      });
      FG_PIPES.horizontal.forEach(hPipe => {
        FG_PIPES.vertical.forEach(vPipe => {
          const jx = vPipe.col * TILE, jy = hPipe.row * TILE;
          ctx.fillStyle = '#1a2838'; ctx.fillRect(jx - 2, jy - 2, 7, 9);
          if (Math.sin(time * 0.005 + jx * 0.1 + jy * 0.07) > 0.3) {
            ctx.fillStyle = 'rgba(0, 220, 255, 0.7)'; ctx.fillRect(jx, jy + 1, 2, 2);
          }
        });
      });
      ctx.restore();

      // ════════════════════════════════════════
      // PASS 5: PARTICLES
      // ════════════════════════════════════════
      particles.update();
      particles.draw(ctx);

      // ════════════════════════════════════════
      // PASS 6: POST-PROCESSING
      // ════════════════════════════════════════
      ctx.globalCompositeOperation = 'screen';
      for (const light of lights) {
        if (light.intensity > 0.3 && light.radius > TILE * 2) {
          const reflGrad = ctx.createRadialGradient(light.x, light.y + TILE, 0, light.x, light.y + TILE, light.radius * 0.5);
          reflGrad.addColorStop(0, `rgba(${light.r}, ${light.g}, ${light.b}, 0.07)`);
          reflGrad.addColorStop(0.5, `rgba(${light.r}, ${light.g}, ${light.b}, 0.02)`);
          reflGrad.addColorStop(1, `rgba(${light.r}, ${light.g}, ${light.b}, 0)`);
          ctx.fillStyle = reflGrad; ctx.fillRect(light.x - light.radius, light.y, light.radius * 2, light.radius * 0.7);
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      // Zone labels
      ctx.font = '8px "Share Tech Mono", monospace'; ctx.textAlign = 'center';
      const za = 0.3;
      ctx.fillStyle = `rgba(0, 220, 255, ${za})`; ctx.fillText('// ARENA LAUNCH BAY', 15 * TILE, 8.7 * TILE);
      ctx.fillStyle = `rgba(170, 102, 238, ${za})`; ctx.fillText('// COMMAND POST', 15 * TILE, 22.7 * TILE);
      ctx.fillStyle = `rgba(0, 255, 136, ${za})`; ctx.fillText('// MUTATION LAB', 5 * TILE, 17.7 * TILE);
      ctx.fillStyle = `rgba(204, 170, 34, ${za})`; ctx.fillText('// TECH WORKSHOP', 25 * TILE, 17.7 * TILE);
      ctx.fillStyle = `rgba(0, 204, 255, ${za * 0.6})`; ctx.fillText('// MAIN HALL', 15 * TILE, 16.5 * TILE);

      // Ambient cables
      ctx.strokeStyle = 'rgba(0, 180, 255, 0.04)'; ctx.lineWidth = 0.5; ctx.setLineDash([4, 8]);
      ctx.beginPath(); ctx.moveTo(1 * TILE, 10 * TILE); ctx.lineTo(9 * TILE, 10 * TILE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1 * TILE, 18 * TILE); ctx.lineTo(9 * TILE, 18 * TILE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(21 * TILE, 10 * TILE); ctx.lineTo(29 * TILE, 10 * TILE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(21 * TILE, 18 * TILE); ctx.lineTo(29 * TILE, 18 * TILE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(15 * TILE, 9 * TILE); ctx.lineTo(15 * TILE, 23 * TILE); ctx.stroke();
      ctx.setLineDash([]);

      // ════════════════════════════════════════
      // PROXIMITY CHECK
      // ════════════════════════════════════════
      let closest = null, closestDist = Infinity;
      // Elevator proximity — triggers next fight
      {
        const ecx = INTERACTABLES.elevator.col * TILE + 16, ecy = INTERACTABLES.elevator.row * TILE + 16;
        const dist = Math.hypot(pos.x - ecx, pos.y - ecy);
        if (dist < TILE * 3 && dist < closestDist && arenasCleared < 8) {
          closestDist = dist; closest = { type: `arena${arenasCleared}`, name: `FIGHT ${arenasCleared + 1} OF 8` };
        }
      }
      INTERACTABLES.npcs.forEach(npc => {
        const ncx = npc.col * TILE + 16, ncy = npc.row * TILE + 16;
        const dist = Math.hypot(pos.x - ncx, pos.y - ncy);
        if (dist < TILE * 3 && dist < closestDist) {
          closestDist = dist; closest = { type: npc.type, name: npc.name };
        }
      });
      INTERACTABLES.terminals.forEach(term => {
        const tcx = term.col * TILE + 16, tcy = term.row * TILE + 16;
        const dist = Math.hypot(pos.x - tcx, pos.y - tcy);
        if (dist < TILE * 2.5 && dist < closestDist) {
          closestDist = dist; closest = { type: term.type, name: term.name };
        }
      });
      setNearTarget(closest);
      animRef.current = requestAnimationFrame(frame);
    }

    frame();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
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
        <div style={{ fontSize: 10, color: '#6a8a9a', letterSpacing: 1, marginTop: 2 }}>arenas: {arenasCleared}/8</div>
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

      {/* Settings gear button */}
      <button
        onClick={() => onInteract('settings')}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 5,
          background: 'rgba(5,10,20,0.6)', border: '1px solid #1a2a3a',
          color: '#4a6a7a', fontSize: 14, cursor: 'pointer',
          width: 32, height: 32, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 0,
        }}
        title="Settings"
      >
        &#9881;
      </button>
    </div>
  );
}
