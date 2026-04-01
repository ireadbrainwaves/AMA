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
import roomCentralhub from '../assets/hub/objects/room_centralhub.png';
import roomLibrary from '../assets/hub/objects/room_library.png';
import roomSpecieslab from '../assets/hub/objects/room_specieslab.png';

// PixelLab tilesets
import tsBaseFloor from '../assets/hub/tilesets/base_floor.png';
import tsCorridor from '../assets/hub/tilesets/corridor.png';
import tsHallFloor from '../assets/hub/tilesets/hall_floor.png';
import tsBioFloor from '../assets/hub/tilesets/bio_floor.png';
import tsTechFloor from '../assets/hub/tilesets/tech_floor.png';
import tsCmdFloor from '../assets/hub/tilesets/cmd_floor.png';
import tsGrate from '../assets/hub/tilesets/grate.png';

/* ═══════════════════════════════════════════════════════
   THE ARK — ORBITAL STAGING AREA
   6 rooms radiating from central hub, camera follows player

   Layout (50x50 grid, 32px tiles):

                  [ARENA BAY]
                      |
   [MUT LAB] ——— CENTRAL HUB ——— [TECH SHOP]
                      |
   [LIBRARY] ———      |      ——— [SPECIES LAB]
                      |
                  [VEX CMD]
   ═══════════════════════════════════════════════════════ */

const TILE = 32;
const COLS = 50;
const ROWS = 50;
const MAP_W = COLS * TILE;
const MAP_H = ROWS * TILE;
const ZOOM = 2;
const VIEW_W = 480;
const VIEW_H = 416;
const CANVAS_W = VIEW_W;
const CANVAS_H = VIEW_H;
const PLAYER_SPEED = 2.5;

const W = 0, F = 1, P = 5, G = 6, L = 7;

function hexRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/* ═══ ROOM DEFINITIONS — varied sizes, L-shapes, alcoves ═══ */
const ROOMS = {
  // Central hub — large, hexagonal feel (14x14)
  hub:        { col: 18, row: 18, w: 14, h: 14 },
  // Arena launch bay — grand, wide (14x10) + observation alcove
  arena:      { col: 18, row: 2,  w: 14, h: 10 },
  arenaAlcove:{ col: 22, row: 12, w: 6,  h: 2 },  // viewing deck connecting to hub
  // Mutation lab — L-shape: main area + specimen chamber
  mutlab:     { col: 2,  row: 20, w: 10, h: 8 },
  mutlabAlcove:{ col: 2, row: 28, w: 6,  h: 4 },  // isolated specimen chamber
  // Tech workshop — L-shape: main + storage
  techshop:   { col: 38, row: 20, w: 10, h: 8 },
  techAlcove: { col: 42, row: 28, w: 6,  h: 4 },  // back storage
  // Library — cozy (8x8)
  library:    { col: 4,  row: 36, w: 8,  h: 8 },
  // Species lab — wide observation room (12x8)
  specieslab: { col: 36, row: 36, w: 12, h: 8 },
  // Vex command — deep room (10x12)
  vexcmd:     { col: 20, row: 36, w: 10, h: 12 },
};

/* ═══ CORRIDORS — pinched midpoints, bends, airlocks ═══ */
function buildMap() {
  const m = Array.from({ length: ROWS }, () => Array(COLS).fill(W));

  // Helper: carve a rect of floor tiles
  function carveRoom(col, row, w, h) {
    for (let r = row; r < row + h; r++)
      for (let c = col; c < col + w; c++)
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) m[r][c] = F;
  }
  // Helper: carve corridor with pinch (wide→narrow→wide)
  function carveCorridor(c1, r1, c2, r2, dir) {
    if (dir === 'v') {
      // Vertical: full width at ends, pinch to 2 in middle
      const midR = Math.floor((r1 + r2) / 2);
      const fullW = c2 - c1 + 1;
      const pinchC1 = c1 + 1, pinchC2 = c2 - 1;
      for (let r = r1; r <= r2; r++) {
        const distFromMid = Math.abs(r - midR);
        const isPinch = distFromMid <= 1 && fullW > 2;
        const startC = isPinch ? pinchC1 : c1;
        const endC = isPinch ? pinchC2 : c2;
        for (let c = startC; c <= endC; c++)
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) m[r][c] = F;
      }
    } else {
      // Horizontal: same logic
      const midC = Math.floor((c1 + c2) / 2);
      const fullH = r2 - r1 + 1;
      const pinchR1 = r1 + 1, pinchR2 = r2 - 1;
      for (let c = c1; c <= c2; c++) {
        const distFromMid = Math.abs(c - midC);
        const isPinch = distFromMid <= 1 && fullH > 2;
        const startR = isPinch ? pinchR1 : r1;
        const endR = isPinch ? pinchR2 : r2;
        for (let r = startR; r <= endR; r++)
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) m[r][c] = F;
      }
    }
  }

  // ─── Carve all rooms ───
  for (const room of Object.values(ROOMS)) {
    carveRoom(room.col, room.row, room.w, room.h);
  }

  // ─── Grate borders on rooms ───
  for (const room of Object.values(ROOMS)) {
    for (let c = room.col; c < room.col + room.w; c++) { m[room.row][c] = G; m[room.row + room.h - 1][c] = G; }
    for (let r = room.row; r < room.row + room.h; r++) { m[r][room.col] = G; m[r][room.col + room.w - 1] = G; }
  }

  // ─── Corridors — overlap room edges by 1 tile to ensure connection ───
  // Hub(18-31, 18-31), Arena(18-31, 2-11), Mutlab(2-11, 20-27),
  // Tech(38-47, 20-27), Vex(20-29, 36-47), Library(4-11, 36-43), Species(36-47, 36-43)

  // Hub ↑ Arena: cols 23-26, from arena row 11 to hub row 18
  carveCorridor(23, 11, 26, 19, 'v');

  // Hub ← Mutlab: rows 23-26, from mutlab col 11 to hub col 18
  carveCorridor(11, 23, 19, 26, 'h');

  // Hub → Techshop: rows 23-26, from hub col 31 to techshop col 38
  carveCorridor(31, 23, 39, 26, 'h');

  // Hub ↓ Vex: cols 23-26, from hub row 31 to vex row 36
  carveCorridor(23, 31, 26, 37, 'v');

  // Hub ↙ Library: south from hub, then west, then south to library
  carveCorridor(19, 31, 22, 34, 'v');  // south from hub bottom-left
  carveCorridor(11, 32, 20, 35, 'h');  // west across
  carveCorridor(9, 35, 12, 37, 'v');   // south into library (library at row 36)

  // Hub ↘ Species Lab: south from hub, then east, then south to lab
  carveCorridor(28, 31, 31, 34, 'v');  // south from hub bottom-right
  carveCorridor(30, 32, 39, 35, 'h');  // east across
  carveCorridor(38, 35, 41, 37, 'v');  // south into species lab (lab at row 36)

  // ─── LED strips ───
  const hub = ROOMS.hub;
  // Hub: inner LED rectangle
  for (let c = hub.col + 3; c < hub.col + hub.w - 3; c++) { m[hub.row + 3][c] = L; m[hub.row + hub.h - 4][c] = L; }
  for (let r = hub.row + 3; r < hub.row + hub.h - 3; r++) { m[r][hub.col + 3] = L; m[r][hub.col + hub.w - 4] = L; }

  // Arena: elevator ring
  const ar = ROOMS.arena;
  for (let c = ar.col + 4; c < ar.col + ar.w - 4; c++) { m[ar.row + 3][c] = L; m[ar.row + ar.h - 3][c] = L; }
  for (let r = ar.row + 3; r < ar.row + ar.h - 3; r++) { m[r][ar.col + 4] = L; m[r][ar.col + ar.w - 5] = L; }

  // Corridor center LEDs
  for (let r = 13; r < 18; r++) m[r][24] = L;  // north
  for (let r = 33; r < 36; r++) m[r][24] = L;  // south
  for (let c = 13; c < 18; c++) m[24][c] = L;  // west
  for (let c = 33; c < 38; c++) m[24][c] = L;  // east

  // Room accent LEDs
  m[ROOMS.mutlab.row + 4][ROOMS.mutlab.col + 2] = L;
  m[ROOMS.mutlab.row + 4][ROOMS.mutlab.col + 8] = L;
  m[ROOMS.techshop.row + 4][ROOMS.techshop.col + 2] = L;
  m[ROOMS.techshop.row + 4][ROOMS.techshop.col + 8] = L;
  m[ROOMS.library.row + 4][ROOMS.library.col + 4] = L;
  m[ROOMS.specieslab.row + 4][ROOMS.specieslab.col + 6] = L;
  m[ROOMS.vexcmd.row + 3][ROOMS.vexcmd.col + 2] = L;
  m[ROOMS.vexcmd.row + 3][ROOMS.vexcmd.col + 8] = L;

  // ─── Pipe accents on room walls ───
  for (const key of ['mutlab', 'techshop']) {
    const rm = ROOMS[key];
    for (let r = rm.row + 2; r < rm.row + rm.h - 2; r++) { m[r][rm.col] = P; m[r][rm.col + rm.w - 1] = P; }
  }

  return m;
}

const TILEMAP = buildMap();

/* ─── Room art zones ─── */
const ROOM_ZONES = [
  { img: 'roomArena',      col: ROOMS.arena.col,      row: ROOMS.arena.row,      colSpan: ROOMS.arena.w,      rowSpan: ROOMS.arena.h,      opacity: 0.80 },
  { img: 'roomCentralhub', col: ROOMS.hub.col,        row: ROOMS.hub.row,        colSpan: ROOMS.hub.w,        rowSpan: ROOMS.hub.h,        opacity: 0.75 },
  { img: 'roomMutlab',     col: ROOMS.mutlab.col,     row: ROOMS.mutlab.row,     colSpan: ROOMS.mutlab.w,     rowSpan: ROOMS.mutlab.h,     opacity: 0.80 },
  { img: 'roomWorkshop',   col: ROOMS.techshop.col,   row: ROOMS.techshop.row,   colSpan: ROOMS.techshop.w,   rowSpan: ROOMS.techshop.h,   opacity: 0.80 },
  { img: 'roomCmdpost',    col: ROOMS.vexcmd.col,     row: ROOMS.vexcmd.row,     colSpan: ROOMS.vexcmd.w,     rowSpan: ROOMS.vexcmd.h,     opacity: 0.75 },
  { img: 'roomLibrary',    col: ROOMS.library.col,     row: ROOMS.library.row,    colSpan: ROOMS.library.w,    rowSpan: ROOMS.library.h,    opacity: 0.75 },
  { img: 'roomSpecieslab', col: ROOMS.specieslab.col,  row: ROOMS.specieslab.row, colSpan: ROOMS.specieslab.w, rowSpan: ROOMS.specieslab.h, opacity: 0.75 },
];

/* ─── Interactables ─── */
const INTERACTABLES = {
  elevator: { col: ROOMS.arena.col + 7, row: ROOMS.arena.row + 5, type: 'elevator', name: 'ARENA ELEVATOR', color: '#00ddff' },
  npcs: [
    { col: ROOMS.mutlab.col + 5,   row: ROOMS.mutlab.row + 4,   type: 'helix', name: 'Dr. Helix',  color: '#00ff88', title: 'MUTATION SPECIALIST' },
    { col: ROOMS.techshop.col + 5, row: ROOMS.techshop.row + 4, type: 'ark',   name: 'RK-7 "Ark"', color: '#ccaa22', title: 'TECH MERCHANT' },
    { col: ROOMS.vexcmd.col + 5,   row: ROOMS.vexcmd.row + 6,   type: 'vex',   name: 'Cmdr. Vex',  color: '#aa66ee', title: 'TOURNAMENT DIRECTOR' },
  ],
  terminals: [
    { col: ROOMS.mutlab.col + 2,   row: ROOMS.mutlab.row + 6,   type: 'codex',      name: 'Species Codex', color: '#00ccff' },
    { col: ROOMS.techshop.col + 7, row: ROOMS.techshop.row + 6, type: 'supplies',   name: 'Supplies',      color: '#ccaa22' },
    { col: ROOMS.arena.col + 2,    row: ROOMS.arena.row + 2,    type: 'bracket',    name: 'Bracket',       color: '#00ffee', wide: true },
    { col: ROOMS.arena.col + 3,    row: ROOMS.arena.row + 2,    type: 'bracket',    name: 'Bracket',       color: '#00ffee', wide: true },
    { col: ROOMS.library.col + 4,    row: ROOMS.library.row + 4,    type: 'library',    name: 'Library',       color: '#6688cc' },
    { col: ROOMS.specieslab.col + 6, row: ROOMS.specieslab.row + 4, type: 'specieslab', name: 'Species Lab',   color: '#44ccaa' },
  ],
};

const WALL_MONITORS = [
  { col: ROOMS.arena.col + 2, row: ROOMS.arena.row, w: 2, color: '#00ccff' },
  { col: ROOMS.arena.col + 6, row: ROOMS.arena.row, w: 2, color: '#00ddff' },
];

const FG_PIPES = {
  horizontal: [
    { row: ROOMS.hub.row - 0.5, colStart: ROOMS.hub.col, colEnd: ROOMS.hub.col + ROOMS.hub.w },
    { row: ROOMS.hub.row + ROOMS.hub.h - 0.5, colStart: ROOMS.hub.col, colEnd: ROOMS.hub.col + ROOMS.hub.w },
  ],
  vertical: [
    { col: ROOMS.hub.col - 0.5, rowStart: ROOMS.hub.row, rowEnd: ROOMS.hub.row + ROOMS.hub.h },
    { col: ROOMS.hub.col + ROOMS.hub.w - 0.5, rowStart: ROOMS.hub.row, rowEnd: ROOMS.hub.row + ROOMS.hub.h },
  ],
};

/* ═══ LIGHT SOURCES ═══ */
function getLightSources(playerX, playerY, arenasCleared, arenaStates, time) {
  const lights = [];

  // Player light
  lights.push({ x: playerX, y: playerY, radius: TILE * 7, r: 120, g: 200, b: 240, intensity: 0.9 });

  // NPC lights
  INTERACTABLES.npcs.forEach(npc => {
    const [r, g, b] = hexRgb(npc.color);
    lights.push({ x: npc.col * TILE + 16, y: npc.row * TILE + 16, radius: TILE * 5, r, g, b, intensity: 0.85 });
  });

  // Elevator light
  const elev = INTERACTABLES.elevator;
  const elevPulse = 0.7 + Math.sin(time * 0.003) * 0.25;
  lights.push({ x: elev.col * TILE + 16, y: elev.row * TILE + 16, radius: TILE * 8, r: 0, g: 220, b: 255, intensity: elevPulse });

  // Terminal lights
  INTERACTABLES.terminals.forEach(term => {
    const [r, g, b] = hexRgb(term.color);
    lights.push({ x: term.col * TILE + 16, y: term.row * TILE + 16, radius: TILE * 3.5, r, g, b, intensity: 0.5 });
  });

  // Room ambient fills
  for (const [key, room] of Object.entries(ROOMS)) {
    const cx = (room.col + room.w / 2) * TILE, cy = (room.row + room.h / 2) * TILE;
    const colors = {
      hub: [40, 60, 80], arena: [0, 60, 100], mutlab: [30, 60, 50],
      techshop: [50, 45, 25], library: [40, 50, 80], specieslab: [30, 60, 55], vexcmd: [40, 30, 60],
    };
    const [r, g, b] = colors[key] || [40, 50, 60];
    lights.push({ x: cx, y: cy, radius: TILE * 7, r, g, b, intensity: 0.3 });
  }

  // Corridor junction lights (hardcoded positions matching buildMap corridors)
  const corPositions = [
    [24.5, 15], [15, 24.5], [35, 24.5], [24.5, 34],  // N, W, E, S main corridors
    [15, 31], [10, 34], [35, 31], [40, 34],            // SW and SE corridor bends
  ];
  for (const [cx, cy] of corPositions) {
    const flicker = 0.4 + Math.sin(time * 0.003 + cx * 10) * 0.1;
    lights.push({ x: cx * TILE, y: cy * TILE, radius: TILE * 4, r: 0, g: 180, b: 230, intensity: flicker });
  }

  return lights;
}

/* ═══ PARTICLE SYSTEM ═══ */
class ParticleSystem {
  constructor(count) { this.particles = Array.from({ length: count }, () => this._spawn()); }
  _spawn() {
    return {
      x: Math.random() * MAP_W, y: Math.random() * MAP_H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.2 - 0.1,
      size: Math.random() * 1.5 + 0.5, alpha: Math.random() * 0.3 + 0.05,
      life: Math.random() * 200 + 100, maxLife: 300,
    };
  }
  update() {
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0 || p.x < 0 || p.x > MAP_W || p.y < 0 || p.y > MAP_H) Object.assign(p, this._spawn());
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
      workshop: workshopArt, mutlab: mutlabArt, cmdpost: cmdpostArt, gallery: galleryArt,
      corridor: corridorArt, floor: floorTileArt, terminal: terminalArt,
      npcHelix: objNpcHelix, npcArk: objNpcArk, npcVex: objNpcVex,
      bioTank: objBioTank, labBench: objLabBench, weaponRack: objWeaponRack,
      techWorkbench: objTechWorkbench, techCrate: objTechCrate, cmdConsole: objCmdConsole,
      objTerminal: objTerminal, arenaDoor: objArenaDoor, holoDisplay: objHoloDisplay,
      player: objPlayer, elevatorPad: objElevatorPad,
      roomMutlab: roomMutlab, roomWorkshop: roomWorkshop, roomArena: roomArena,
      roomCmdpost: roomCmdpost, roomMainhall: roomMainhall,
      roomCentralhub: roomCentralhub, roomLibrary: roomLibrary, roomSpecieslab: roomSpecieslab,
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

/* ═══ MAIN COMPONENT ═══ */
export default function HubWorld2D({ runState, meta, arenaStates, onInteract, overlayActive }) {
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const hub = ROOMS.hub;
  const posRef = useRef({ x: (hub.col + hub.w / 2) * TILE, y: (hub.row + hub.h / 2) * TILE });
  const animRef = useRef(null);
  const particlesRef = useRef(new ParticleSystem(120));
  const [nearTarget, setNearTarget] = useState(null);
  const dirRef = useRef({ dx: 0, dy: 1 });
  const lightCanvasRef = useRef(null);

  const { arts, ready } = useArtLoader();
  const arenasCleared = arenaStates?.filter(a => a.cleared).length || 0;

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const particles = particlesRef.current;

    if (!lightCanvasRef.current) {
      lightCanvasRef.current = document.createElement('canvas');
      lightCanvasRef.current.width = MAP_W;
      lightCanvasRef.current.height = MAP_H;
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

      // Camera
      const camX = Math.max(0, Math.min(MAP_W - VIEW_W, pos.x - VIEW_W / 2));
      const camY = Math.max(0, Math.min(MAP_H - VIEW_H, pos.y - VIEW_H / 2));

      // ═══ PASS 1: SCENE ═══
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.save();
      ctx.translate(-camX, -camY);

      // Floor pattern
      if (floorPattern) { ctx.save(); ctx.globalAlpha = 0.38; ctx.fillStyle = floorPattern; ctx.fillRect(0, 0, MAP_W, MAP_H); ctx.restore(); }

      // Floor seams
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'; ctx.lineWidth = 0.5;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (TILEMAP[r][c] !== W) ctx.strokeRect(c * TILE + 0.5, r * TILE + 0.5, TILE - 1, TILE - 1);
      }

      // Room art backgrounds
      if (ready) {
        for (const zone of ROOM_ZONES) {
          const img = arts[zone.img]; if (!img) continue;
          const zx = zone.col * TILE, zy = zone.row * TILE, zw = zone.colSpan * TILE, zh = zone.rowSpan * TILE;
          ctx.save(); ctx.globalAlpha = zone.opacity;
          ctx.drawImage(img, zx, zy, zw, zh); ctx.restore();
          const fade = TILE * 1.5;
          let g;
          g = ctx.createLinearGradient(zx, 0, zx + fade, 0); g.addColorStop(0, 'rgba(2,4,8,0.7)'); g.addColorStop(1, 'rgba(2,4,8,0)'); ctx.fillStyle = g; ctx.fillRect(zx, zy, fade, zh);
          g = ctx.createLinearGradient(zx + zw - fade, 0, zx + zw, 0); g.addColorStop(0, 'rgba(2,4,8,0)'); g.addColorStop(1, 'rgba(2,4,8,0.7)'); ctx.fillStyle = g; ctx.fillRect(zx + zw - fade, zy, fade, zh);
          g = ctx.createLinearGradient(0, zy, 0, zy + fade); g.addColorStop(0, 'rgba(2,4,8,0.6)'); g.addColorStop(1, 'rgba(2,4,8,0)'); ctx.fillStyle = g; ctx.fillRect(zx, zy, zw, fade);
          g = ctx.createLinearGradient(0, zy + zh - fade, 0, zy + zh); g.addColorStop(0, 'rgba(2,4,8,0)'); g.addColorStop(1, 'rgba(2,4,8,0.6)'); ctx.fillStyle = g; ctx.fillRect(zx, zy + zh - fade, zw, fade);
        }
      }

      // Structural tiles
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const sx = c * TILE, sy = r * TILE, tile = TILEMAP[r][c];
        if (tile === W) {
          ctx.fillStyle = '#0c1628'; ctx.fillRect(sx, sy, TILE, TILE);
          ctx.fillStyle = '#1a2a42'; ctx.fillRect(sx, sy, TILE, 1); ctx.fillRect(sx, sy, 1, TILE);
          ctx.fillStyle = '#060c18'; ctx.fillRect(sx + TILE - 1, sy, 1, TILE); ctx.fillRect(sx, sy + TILE - 1, TILE, 1);
          if ((c + r) % 3 === 0) { ctx.fillStyle = '#2a3a52'; ctx.fillRect(sx + 4, sy + 4, 1, 1); ctx.fillRect(sx + TILE - 5, sy + TILE - 5, 1, 1); }
        } else if (tile === P) {
          ctx.fillStyle = '#0a1020'; ctx.fillRect(sx, sy, TILE, TILE);
          ctx.fillStyle = '#1a3040'; ctx.fillRect(sx + 6, sy + 10, TILE - 12, 12);
          ctx.fillStyle = '#2a4858'; ctx.fillRect(sx + 5, sy + 15, 2, 2); ctx.fillRect(sx + TILE - 7, sy + 15, 2, 2);
        } else if (tile === G) {
          ctx.fillStyle = 'rgba(6,10,18,0.4)'; ctx.fillRect(sx, sy, TILE, TILE);
          ctx.strokeStyle = 'rgba(0,180,255,0.06)'; ctx.lineWidth = 0.5;
          for (let i = 0; i < TILE; i += 8) { ctx.beginPath(); ctx.moveTo(sx + i, sy); ctx.lineTo(sx + i, sy + TILE); ctx.stroke(); ctx.beginPath(); ctx.moveTo(sx, sy + i); ctx.lineTo(sx + TILE, sy + i); ctx.stroke(); }
        } else if (tile === L) {
          const pulse = 0.5 + Math.sin(time * 0.002 + c * 0.5 + r * 0.3) * 0.25;
          ctx.fillStyle = '#060c16'; ctx.fillRect(sx + 10, sy + 12, TILE - 20, 6);
          ctx.fillStyle = `rgba(0,200,255,${pulse * 0.5})`; ctx.fillRect(sx + 11, sy + 13, TILE - 22, 4);
          ctx.fillStyle = `rgba(0,180,255,${pulse * 0.08})`; ctx.fillRect(sx + 4, sy + 6, TILE - 8, TILE - 12);
        }
      }

      // Equipment
      const ml = ROOMS.mutlab, ts = ROOMS.techshop, vc = ROOMS.vexcmd, lb = ROOMS.library, sl = ROOMS.specieslab;
      const equipmentSprites = [
        // Mutation Lab — specimens along walls, bench in back
        { img: 'bioTank',  x: ml.col + 1, y: ml.row + 2, w: 1.5, h: 2 },
        { img: 'bioTank',  x: ml.col + 1, y: ml.row + 5, w: 1.5, h: 2 },
        { img: 'bioTank',  x: ml.col + 8, y: ml.row + 2, w: 1.5, h: 2 },
        { img: 'labBench', x: ml.col + 3, y: ml.row + 6, w: 3, h: 1.5 },
        // Mutlab alcove — isolated specimen
        { img: 'bioTank',  x: ROOMS.mutlabAlcove.col + 2, y: ROOMS.mutlabAlcove.row + 1, w: 1.5, h: 2 },
        // Tech Workshop — racks, benches, crates
        { img: 'weaponRack',    x: ts.col + 8, y: ts.row + 2, w: 1.5, h: 2 },
        { img: 'weaponRack',    x: ts.col + 8, y: ts.row + 5, w: 1.5, h: 2 },
        { img: 'techWorkbench', x: ts.col + 2, y: ts.row + 6, w: 3, h: 1.5 },
        { img: 'techCrate',     x: ts.col + 1, y: ts.row + 2, w: 1.5, h: 1.5 },
        // Tech alcove — storage
        { img: 'techCrate', x: ROOMS.techAlcove.col + 1, y: ROOMS.techAlcove.row + 1, w: 1.5, h: 1.5 },
        { img: 'techCrate', x: ROOMS.techAlcove.col + 3, y: ROOMS.techAlcove.row + 1, w: 1.5, h: 1.5 },
        // Vex Command — consoles flanking
        { img: 'cmdConsole', x: vc.col + 1, y: vc.row + 3, w: 2, h: 2 },
        { img: 'cmdConsole', x: vc.col + 7, y: vc.row + 3, w: 2, h: 2 },
        { img: 'cmdConsole', x: vc.col + 4, y: vc.row + 8, w: 2, h: 2 },
        // Hub center — crates for visual interest
        { img: 'techCrate', x: ROOMS.hub.col + 1, y: ROOMS.hub.row + 1, w: 1.5, h: 1.5 },
        { img: 'techCrate', x: ROOMS.hub.col + 12, y: ROOMS.hub.row + 1, w: 1.5, h: 1.5 },
        { img: 'techCrate', x: ROOMS.hub.col + 1, y: ROOMS.hub.row + 12, w: 1.5, h: 1.5 },
        { img: 'techCrate', x: ROOMS.hub.col + 12, y: ROOMS.hub.row + 12, w: 1.5, h: 1.5 },
      ];
      for (const eq of equipmentSprites) {
        const eqImg = arts[eq.img];
        const ex = eq.x * TILE, ey = eq.y * TILE, ew = eq.w * TILE, eh = eq.h * TILE;
        if (eqImg) { ctx.drawImage(eqImg, ex, ey, ew, eh); }
        else { ctx.fillStyle = '#0a1420'; ctx.fillRect(ex, ey, ew, eh); }
      }

      // Arena elevator
      const elev = INTERACTABLES.elevator;
      const ex = elev.col * TILE, ey = elev.row * TILE;
      const elevImg = arts.elevatorPad;
      const elevPulse = 0.5 + Math.sin(time * 0.003) * 0.3;
      if (elevImg) { ctx.drawImage(elevImg, ex - TILE * 1.5, ey - TILE * 1.5, TILE * 3, TILE * 3); }
      else {
        ctx.fillStyle = '#0a1828'; ctx.beginPath(); ctx.arc(ex + 16, ey + 16, TILE * 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(0,220,255,${elevPulse})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ex + 16, ey + 16, TILE * 1.2, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.font = 'bold 14px "Share Tech Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(0,220,255,${0.6 + elevPulse * 0.3})`;
      ctx.fillText(arenasCleared >= 8 ? 'CHAMPION' : `FIGHT ${arenasCleared + 1}/8`, ex + 16, ey - TILE * 1.6);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = arenaStates?.[i]?.cleared ? '#00ff88' : i === arenasCleared ? `rgba(0,220,255,${elevPulse})` : '#1a2a3a';
        ctx.fillRect(ex - 28 + i * 8, ey + TILE * 1.8, 6, 4);
      }

      // NPCs
      const npcImgMap = { helix: 'npcHelix', ark: 'npcArk', vex: 'npcVex' };
      INTERACTABLES.npcs.forEach(npc => {
        const nx = npc.col * TILE, ny = npc.row * TILE;
        const bob = Math.sin(time * 0.002 + npc.col) * 1.5;
        const npcImg = arts[npcImgMap[npc.type]];
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(nx + TILE / 2, ny + TILE + 2, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        if (npcImg) {
          const scale = TILE * 1.8 / Math.max(npcImg.width, npcImg.height);
          const sw = npcImg.width * scale, sh = npcImg.height * scale;
          ctx.drawImage(npcImg, nx + TILE / 2 - sw / 2, ny + TILE / 2 - sh / 2 + bob, sw, sh);
        }
        ctx.font = '10px "Share Tech Mono", monospace';
        const nameWidth = ctx.measureText(npc.name.toUpperCase()).width || 70;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(nx + TILE / 2 - nameWidth / 2 - 4, ny - 22, nameWidth + 8, 16);
        ctx.fillStyle = npc.color; ctx.textAlign = 'center';
        ctx.fillText(npc.name.toUpperCase(), nx + TILE / 2, ny - 10);
        ctx.font = '8px "Share Tech Mono", monospace'; ctx.fillStyle = npc.color + '88';
        ctx.fillText(npc.title, nx + TILE / 2, ny - 1);
      });

      // Terminals
      const termImg = arts.objTerminal;
      INTERACTABLES.terminals.forEach(term => {
        if (term.type === 'bracket') return; // drawn as part of arena
        const tx = term.col * TILE, ty = term.row * TILE;
        if (termImg) { ctx.drawImage(termImg, tx, ty - 8, TILE, TILE + 8); }
        else { ctx.fillStyle = '#0a1220'; ctx.fillRect(tx + 3, ty + 14, TILE - 6, TILE - 14); }
        ctx.font = '9px "Share Tech Mono", monospace'; ctx.fillStyle = term.color + 'cc'; ctx.textAlign = 'center';
        ctx.fillText(term.name.toUpperCase(), tx + TILE / 2, ty + TILE + 12);
      });

      // Player
      const px = pos.x, py = pos.y;
      const playerImg = arts.player;
      ctx.fillStyle = 'rgba(0,200,255,0.18)'; ctx.beginPath(); ctx.ellipse(px, py + 12, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      if (playerImg) {
        const pScale = 1.6;
        ctx.drawImage(playerImg, px - playerImg.width * pScale / 2, py - playerImg.height * pScale / 2 - 4, playerImg.width * pScale, playerImg.height * pScale);
      } else {
        ctx.fillStyle = '#2299bb'; ctx.fillRect(px - 7, py - 6, 14, 10);
        ctx.fillStyle = '#44ccee'; ctx.fillRect(px - 5, py - 13, 10, 7);
      }
      ctx.fillStyle = `rgba(100,240,255,${0.4 + Math.sin(time * 0.004) * 0.2})`; ctx.fillRect(px - 1, py - 3, 2, 2);

      // End world space for scene
      ctx.restore();

      // ═══ PASS 2: LIGHT MAP ═══
      lctx.fillStyle = 'rgb(60, 65, 85)';
      lctx.fillRect(0, 0, MAP_W, MAP_H);
      lctx.globalCompositeOperation = 'lighter';
      const lights = getLightSources(pos.x, pos.y, arenasCleared, arenaStates, time);
      for (const light of lights) {
        const grad = lctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
        const cr = Math.min(255, light.r + 60), cg = Math.min(255, light.g + 60), cb = Math.min(255, light.b + 60);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${light.intensity})`);
        grad.addColorStop(0.4, `rgba(${light.r},${light.g},${light.b},${light.intensity * 0.4})`);
        grad.addColorStop(1, `rgba(${light.r},${light.g},${light.b},0)`);
        lctx.fillStyle = grad; lctx.beginPath(); lctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2); lctx.fill();
      }
      lctx.globalCompositeOperation = 'source-over';
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(lCanvas, camX, camY, VIEW_W, VIEW_H, 0, 0, VIEW_W, VIEW_H);
      ctx.globalCompositeOperation = 'source-over';

      // ═══ PASS 3: BLOOM ═══
      ctx.save(); ctx.translate(-camX, -camY);
      ctx.globalCompositeOperation = 'lighter';
      INTERACTABLES.npcs.forEach(npc => {
        const [r, g, b] = hexRgb(npc.color);
        const lx = npc.col * TILE + 16, ly = npc.row * TILE + 16;
        const outerGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, TILE * 3);
        outerGrad.addColorStop(0, `rgba(${r},${g},${b},0.12)`); outerGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = outerGrad; ctx.beginPath(); ctx.arc(lx, ly, TILE * 3, 0, Math.PI * 2); ctx.fill();
      });
      // Elevator bloom
      const edx = elev.col * TILE + 16, edy = elev.row * TILE + 16;
      const elevGrad = ctx.createRadialGradient(edx, edy, 0, edx, edy, TILE * 5);
      elevGrad.addColorStop(0, `rgba(0,240,255,${0.16 + Math.sin(time * 0.003) * 0.08})`);
      elevGrad.addColorStop(1, 'rgba(0,200,255,0)');
      ctx.fillStyle = elevGrad; ctx.beginPath(); ctx.arc(edx, edy, TILE * 5, 0, Math.PI * 2); ctx.fill();
      // Player bloom
      const pGrad = ctx.createRadialGradient(px, py, 0, px, py, TILE * 3.5);
      pGrad.addColorStop(0, 'rgba(120,240,255,0.28)'); pGrad.addColorStop(1, 'rgba(80,200,255,0)');
      ctx.fillStyle = pGrad; ctx.beginPath(); ctx.arc(px, py, TILE * 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // ═══ PASS 4: PARTICLES ═══
      particles.update(); particles.draw(ctx);

      // ═══ PASS 5: ZONE LABELS ═══
      ctx.font = '8px "Share Tech Mono", monospace'; ctx.textAlign = 'center';
      const za = 0.3;
      const labels = [
        { text: '// ARENA LAUNCH BAY', room: 'arena',      color: '0,220,255' },
        { text: '// CENTRAL HUB',      room: 'hub',        color: '0,204,255' },
        { text: '// MUTATION LAB',      room: 'mutlab',     color: '0,255,136' },
        { text: '// TECH WORKSHOP',     room: 'techshop',   color: '204,170,34' },
        { text: '// COMMAND POST',      room: 'vexcmd',     color: '170,102,238' },
        { text: '// LIBRARY',           room: 'library',    color: '100,136,204' },
        { text: '// SPECIES LAB',       room: 'specieslab', color: '68,204,170' },
      ];
      labels.forEach(l => {
        const rm = ROOMS[l.room];
        ctx.fillStyle = `rgba(${l.color},${za})`;
        ctx.fillText(l.text, (rm.col + rm.w / 2) * TILE, (rm.row + rm.h - 0.5) * TILE);
      });

      ctx.restore(); // end world space

      // ═══ PROXIMITY CHECK ═══
      let closest = null, closestDist = Infinity;
      // Elevator
      { const ecx = elev.col * TILE + 16, ecy = elev.row * TILE + 16;
        const dist = Math.hypot(pos.x - ecx, pos.y - ecy);
        if (dist < TILE * 3 && dist < closestDist && arenasCleared < 8) { closestDist = dist; closest = { type: `arena${arenasCleared}`, name: `FIGHT ${arenasCleared + 1}/8` }; }
      }
      INTERACTABLES.npcs.forEach(npc => {
        const dist = Math.hypot(pos.x - (npc.col * TILE + 16), pos.y - (npc.row * TILE + 16));
        if (dist < TILE * 3 && dist < closestDist) { closestDist = dist; closest = { type: npc.type, name: npc.name }; }
      });
      INTERACTABLES.terminals.forEach(term => {
        const dist = Math.hypot(pos.x - (term.col * TILE + 16), pos.y - (term.row * TILE + 16));
        if (dist < TILE * 2.5 && dist < closestDist) { closestDist = dist; closest = { type: term.type, name: term.name }; }
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
    <div className="hub-world" style={{ position: 'relative', width: '100%', height: '100vh', background: '#020408', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', opacity: 0.03, background: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)' }} />

      <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} style={{
        imageRendering: 'pixelated', width: VIEW_W * ZOOM, height: VIEW_H * ZOOM,
        opacity: overlayActive ? 0.3 : 1, filter: overlayActive ? 'blur(2px) brightness(0.5)' : 'none',
        transition: 'opacity 0.3s, filter 0.3s', zIndex: 1,
      }} />

      <div style={{ position: 'absolute', top: 16, left: 20, zIndex: 5, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: '#4a6a7a', textTransform: 'uppercase' }}>
        <div style={{ color: '#00ccff', marginBottom: 4 }}>// the ark</div>
        <div>orbital station — run #{runNum}</div>
      </div>

      <div style={{ position: 'absolute', top: 16, right: 20, zIndex: 5, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
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

      {nearTarget && !overlayActive && (
        <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 5, fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#00ccff', letterSpacing: 3, textTransform: 'uppercase', textShadow: '0 0 12px rgba(0,204,255,0.4)', animation: 'pulse 1.5s infinite' }}>
            [E] {nearTarget.name}
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 16, left: 20, zIndex: 5, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#2a4a5a', letterSpacing: 1, textTransform: 'uppercase' }}>
        wasd move / e interact
      </div>

      <button onClick={() => onInteract('settings')} style={{ position: 'absolute', top: 10, right: 10, zIndex: 5, background: 'rgba(5,10,20,0.6)', border: '1px solid #1a2a3a', color: '#4a6a7a', fontSize: 14, cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} title="Settings">&#9881;</button>
    </div>
  );
}
