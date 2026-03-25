# AMA Three.js Hub World — Implementation Spec

## Concept

Replace the current menu-based OverworldScreen with a first-person low-poly 3D hub. The player walks through an orbital station corridor using WASD + mouse look. NPCs, terminals, and arena doors are physical objects in the space. Walking up to something and pressing E triggers interaction — opening the doctor screen, scouting screen, or starting a fight.

The arena plays out like a BJJ tournament: you enter a door, see the tournament bracket projected holographically in the arena space, and your next match is highlighted. After a fight, you return to the hub. Other players' matches (future multiplayer) could be spectated from viewing platforms.

---

## Tech Integration with React

### Architecture

Three.js runs inside a React component via a canvas ref. The 3D world is persistent — it doesn't unmount when you open a menu screen. Instead, menu screens overlay the 3D view.

```
App.jsx
├── HubWorld.jsx              ← Three.js canvas (always mounted during hub phase)
│   ├── Three.js scene        ← Station corridor, NPCs, doors, lighting
│   └── HUD overlay           ← React DOM elements on top of canvas
├── DoctorScreen.jsx          ← Overlays on top of hub (modal-style)
├── ScoutingScreen.jsx        ← Overlays on top of hub
├── FightScreen.jsx           ← Full-screen transition (hides hub)
├── HarvestScreen.jsx         ← Overlays or full-screen after fight
├── CharacterSelect.jsx       ← Shown before hub, unmounts after selection
└── VictoryScreen / DefeatScreen
```

### Screen Transitions

| Trigger | Transition |
|---------|-----------|
| Walk to Dr. Helix + press E | Blur/darken hub canvas, slide in DoctorScreen overlay |
| Walk to Cmdr. Vex + press E | Blur/darken hub canvas, slide in ScoutingScreen overlay |
| Walk to arena door + press E | Camera zooms into door → fade to black → FightScreen mounts (hub unmounts or pauses) |
| Walk to Codex terminal + press E | Blur/darken hub canvas, show Codex overlay |
| Walk to Supplies terminal + press E | Blur/darken hub canvas, show Supplies overlay |
| Fight ends (win) | Fade from black → HarvestScreen overlay → back to hub |
| Fight ends (loss) | Fade from black → DefeatScreen → back to hub (or run over) |
| Close any overlay (Escape) | Resume hub, release pointer lock prompt |

### React Component Structure

```jsx
// src/screens/HubWorld.jsx

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export default function HubWorld({ 
  runState,          // current run data (ladder progress, biomass, tech, etc.)
  meta,              // meta-progression (codex, run count, W/L)
  onInteract,        // callback: (targetType) => void — 'helix', 'vex', 'codex', 'supplies', 'arena1-4'
  overlayActive,     // boolean — is a menu overlay open? (pauses controls)
}) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const controlsRef = useRef(null);
  
  useEffect(() => {
    // Initialize Three.js scene once
    // Store references for cleanup
    // Return cleanup function that disposes geometry/materials
  }, []);

  useEffect(() => {
    // When overlayActive changes, pause/resume controls
    // Disable pointer lock when overlay is open
  }, [overlayActive]);

  useEffect(() => {
    // When runState changes, update door states (glow colors, locked/unlocked)
    // Update NPC positions or dialogue triggers
  }, [runState]);

  return (
    <div className="hub-world">
      <canvas ref={canvasRef} />
      {/* HUD elements rendered as React DOM on top of canvas */}
      <HubHUD runState={runState} meta={meta} />
      <InteractPrompt target={nearestTarget} />
    </div>
  );
}
```

### Installing Three.js

```bash
npm install three
```

Three.js r128 is available on CDN but for a React/Vite project, install via npm and import directly. This gets you tree-shaking and proper module support.

---

## Station Layout

### Floor Plan (top-down)

```
                    NORTH WALL (arena doors)
    ┌─────────────────────────────────────────────┐
    │  [A1]     [A2]     [A3]     [A4]           │
    │                                              │
    │              MAIN CORRIDOR                   │
    │                                              │
    ├────┐                              ┌─────────┤
    │    │    WEST                EAST   │         │
    │ VEX│    ALCOVE             ALCOVE  │  HELIX  │
    │    │                               │         │
    ├────┘                              └─────────┤
    │                                              │
    │         [CODEX]      [SUPPLIES]              │
    │                                              │
    │              SOUTH CORRIDOR                  │
    │                                              │
    │              [SPAWN POINT]                   │
    └─────────────────────────────────────────────┘
                    SOUTH WALL
```

### Dimensions (Three.js units, 1 unit ≈ 1 meter)

- Total room: 20 x 20 units
- Ceiling height: 3.5 units
- Player eye height: 1.6 units
- Arena doors: along north wall (z = -10), spaced 4 units apart
- West alcove (Vex): recessed area at x = -8, z = 0 to 4
- East alcove (Helix): recessed area at x = 8, z = 0 to 4
- Codex terminal: x = -2, z = 5
- Supplies terminal: x = 3, z = 6
- Player spawn: x = 0, z = 8

### Geometry Budget

Keep it low-poly. The hub is atmosphere, not a tech demo.

| Element | Geometry | Count |
|---------|----------|-------|
| Floor | PlaneGeometry(20, 20) | 1 |
| Ceiling | PlaneGeometry(20, 20) | 1 |
| Walls (outer) | BoxGeometry, thin | 4 |
| Alcove walls | BoxGeometry, thin | 4-6 |
| Arena door frames | BoxGeometry | 4 |
| Arena door inner panels | BoxGeometry | 4 |
| NPC bodies (head+torso+legs) | BoxGeometry each | 4 NPCs x 3 = 12 |
| Terminals | BoxGeometry | 2-3 |
| Ceiling light panels | BoxGeometry, flat | 6-8 |
| Floor grid | GridHelper | 1 |
| **Total meshes** | | **~45** |

This is well within budget for 60fps on any hardware.

---

## Lighting

### Ambient
```javascript
const ambient = new THREE.AmbientLight(0x101828, 1.0);
```
Low blue-tinted ambient. Everything is dimly visible but moody.

### Ceiling Lights
6-8 point lights along the ceiling at regular intervals:
```javascript
const ceilLight = new THREE.PointLight(0x2244aa, 0.25, 8);
ceilLight.position.set(x, 3.3, z);
```
Cool blue industrial lighting. Low intensity, medium range.

### Arena Door Glows
Each door gets a colored point light at floor level:
```javascript
// Cleared: green glow
const doorLight = new THREE.PointLight(0x66ee88, 0.5, 4);
// Next: cyan glow
const doorLight = new THREE.PointLight(0x44ccff, 0.5, 4);
// Locked: no light (or very dim gray)
```
These are the main visual wayfinding — players naturally walk toward the brightest glow.

### NPC Accent Lights
Each NPC gets a small point light above their head in their accent color:
```javascript
// Dr. Helix: green
new THREE.PointLight(0x00ff88, 0.3, 3);
// Cmdr. Vex: purple  
new THREE.PointLight(0xaa66ee, 0.3, 3);
```

### Fog
```javascript
scene.fog = new THREE.Fog(0x080c14, 8, 25);
```
Matches the background color. Hides far walls and creates depth. Adjust near/far to taste.

---

## NPCs

### Representation

NPCs are simple box-geometry figures (head + torso + legs) that always face the player (billboard rotation on Y axis only). This matches the aesthetic — they're stylized, not realistic.

```javascript
function createNPC(config) {
  const group = new THREE.Group();
  
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.35, 0.35),
    new THREE.MeshLambertMaterial({ color: config.headColor, flatShading: true })
  );
  head.position.y = 1.55;
  group.add(head);
  
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.6, 0.3),
    new THREE.MeshLambertMaterial({ color: config.bodyColor, flatShading: true })
  );
  torso.position.y = 1.1;
  group.add(torso);
  
  const legs = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.5, 0.25),
    new THREE.MeshLambertMaterial({ color: 0x060a12, flatShading: true })
  );
  legs.position.y = 0.55;
  group.add(legs);
  
  // Accent light
  const light = new THREE.PointLight(config.glowColor, 0.3, 3);
  light.position.y = 1.8;
  group.add(light);
  
  group.position.set(config.x, 0, config.z);
  group.userData = { 
    name: config.name, 
    type: config.type,          // 'helix', 'vex'
    interactRadius: 2.5,        // how close player needs to be
  };
  
  return group;
}
```

### NPC Idle Animation

Simple bobbing on Y axis. No skeletal animation needed.

```javascript
// In animation loop:
npcs.forEach(npc => {
  // Face player
  const angle = Math.atan2(
    camera.position.x - npc.position.x,
    camera.position.z - npc.position.z
  );
  npc.rotation.y = angle;
  
  // Gentle bob
  const bob = Math.sin(Date.now() * 0.002 + npc.position.x) * 0.03;
  npc.children[0].position.y = 1.55 + bob; // head bobs
});
```

### NPC Data

```javascript
const NPC_CONFIG = [
  {
    name: 'Dr. Helix',
    type: 'helix',
    x: 8, z: 2,
    headColor: 0x0a3a1a,
    bodyColor: 0x0a2a15,
    glowColor: 0x00ff88,
  },
  {
    name: 'Cmdr. Vex',
    type: 'vex',
    x: -8, z: 2,
    headColor: 0x2a0a2a,
    bodyColor: 0x1a0a1a,
    glowColor: 0xaa66ee,
  },
];
```

### Future: Replace box NPCs with sprite billboards

When your Scenario character art is processed, NPCs become billboarded quads with sprite textures instead of box geometry. The interaction system stays identical.

```javascript
// Future upgrade:
const texture = new THREE.TextureLoader().load('/sprites/helix_front.png');
texture.magFilter = THREE.NearestFilter; // pixelated
const spriteMat = new THREE.SpriteMaterial({ map: texture });
const sprite = new THREE.Sprite(spriteMat);
sprite.scale.set(1, 1.5, 1);
```

---

## Arena Doors

### Visual Design

Each door is a recessed frame in the north wall with a glowing threshold strip at the floor.

```javascript
function createDoor(config) {
  const group = new THREE.Group();
  
  // Outer frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 2.8, 0.2),
    new THREE.MeshLambertMaterial({ color: 0x060a10, flatShading: true })
  );
  frame.position.y = 1.4;
  group.add(frame);
  
  // Inner dark panel (the "door" itself)
  const inner = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.2, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x030508, flatShading: true })
  );
  inner.position.set(0, 1.3, 0.08);
  group.add(inner);
  
  // Floor glow strip
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.06, 0.15),
    new THREE.MeshBasicMaterial({ color: config.glowColor })
  );
  glow.position.set(0, 0.03, 0.15);
  group.add(glow);
  
  // Point light matching glow color
  const light = new THREE.PointLight(config.glowColor, config.lightIntensity, 4);
  light.position.set(0, 0.5, 0.8);
  group.add(light);
  
  group.position.set(config.x, 0, -9.8);
  group.userData = {
    name: config.label,
    type: config.type,          // 'arena1', 'arena2', etc.
    interactRadius: 2.0,
    locked: config.locked,
  };
  
  return group;
}
```

### Door States

| State | Glow Color | Light Intensity | Interact? |
|-------|-----------|-----------------|-----------|
| Cleared | #66ee88 (green) | 0.4 | Yes (replay or pass through) |
| Next | #44ccff (cyan), pulses | 0.6 | Yes (start fight) |
| Locked | #2a2a2a (dark gray) | 0.05 | No (shows "LOCKED" prompt) |

The "next" door should pulse its light intensity gently to draw the player's attention:
```javascript
// In animation loop:
if (door.userData.isNext) {
  const pulse = 0.4 + Math.sin(Date.now() * 0.003) * 0.2;
  door.light.intensity = pulse;
}
```

---

## Interaction System

### Proximity Detection

Every frame, check distance from camera to all interactable objects. Show the prompt for the nearest one within range.

```javascript
function findNearestInteractable(camera, interactables) {
  let nearest = null;
  let minDist = Infinity;
  
  for (const obj of interactables) {
    const dist = camera.position.distanceTo(obj.position);
    const radius = obj.userData.interactRadius || 2.5;
    
    if (dist < radius && dist < minDist) {
      minDist = dist;
      nearest = obj;
    }
  }
  
  return nearest;
}
```

### Interaction Flow

```
Player walks near NPC/door/terminal
  → HUD shows "[E] Dr. Helix" prompt (React overlay)
  
Player presses E
  → onInteract('helix') callback fires
  → App.jsx sets overlayActive = true
  → Hub controls pause (no movement, pointer lock released)
  → DoctorScreen slides in as overlay
  
Player presses Escape in DoctorScreen
  → App.jsx sets overlayActive = false  
  → Hub controls resume
  → Pointer lock re-acquired on next click
```

### Arena Door Special Case

Walking into an arena door triggers a camera animation before the screen transition:

```javascript
function enterArena(door) {
  // 1. Disable player controls
  controlsEnabled = false;
  
  // 2. Animate camera toward door over 1 second
  const startPos = camera.position.clone();
  const endPos = new THREE.Vector3(door.position.x, 1.6, door.position.z + 0.5);
  const startRot = camera.rotation.clone();
  
  // Tween camera position + look toward door
  animateCamera(startPos, endPos, 1000, () => {
    // 3. Fade to black (CSS overlay transition)
    // 4. onInteract('arena3') — App.jsx mounts FightScreen
  });
}
```

---

## Holographic Tournament Bracket

### Concept

When the player enters the arena lobby (walks through any arena door), they see a large holographic bracket projected in the center of the arena space. Their next match is highlighted.

### Visual Implementation

The bracket is a flat plane with a dynamically generated canvas texture, positioned vertically in the arena space with a holographic look.

```javascript
function createHoloBracket(ladderState) {
  // Create a canvas and draw the bracket on it
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // Draw bracket background
  ctx.fillStyle = 'rgba(0, 20, 40, 0.6)';
  ctx.fillRect(0, 0, 512, 256);
  
  // Draw bracket lines and matchup info
  // ... (standard tournament bracket rendering)
  
  // Create Three.js texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 2),
    mat
  );
  plane.position.set(0, 2, -6);
  
  return plane;
}
```

### Holographic Effect

To sell the holographic projection:
- Slight transparency (opacity 0.85)
- Scanline overlay via the canvas texture (horizontal lines every 4px at low opacity)
- Subtle floating bob animation (Y position oscillates ±0.05)
- Cyan edge glow: add thin glowing strips at the top and bottom edges
- Optional: particle system around the edges (very sparse, floating cyan dots)

### Bracket Content

```
    ROUND 1           ROUND 2          FINAL
  ┌──────────┐
  │ Bee Swarm│──┐
  │   (you)  │  ├──────────┐
  └──────────┘  │          │
  ┌──────────┐  │          │
  │  T.P.    │──┘          ├──────────┐
  │ Turtle   │             │          │
  └──────────┘             │          │
                ┌──────────┘          │
  ┌──────────┐  │                     │
  │Echomorph │──┤          PARASITEX  │
  │ (next)   │  │          (always)   │
  └──────────┘  │                     │
  ┌──────────┐  │                     │
  │   ???    │──┘                     │
  │          │                        │
  └──────────┘                        │
```

The bracket updates as fights are won:
- Completed matches: green text, winner advances
- Next match: cyan highlight, pulsing
- Future matches: dim gray, opponent may show "???" until scouted
- Parasitex always in the final (shown if codex reveals it)

### Future Multiplayer Vision

In a multiplayer hub:
- Multiple brackets are displayed on different walls/screens
- Other players' avatars walk around the same station
- Walking up to another player's bracket shows their progress
- "Spectate" option on an active fight — camera transitions to a viewing gallery above the arena where you watch the fight play out in real time
- Between-round lobby where players can see each other's builds (mutations visible on their character model)

This is later — but the Three.js architecture supports it because the spatial foundation is already there.

---

## Player Movement

### Controls

```javascript
const MOVE_SPEED = 0.08;    // units per frame
const STRAFE_MULT = 0.7;    // strafe is slower than forward
const MOUSE_SENS = 0.002;   // radians per pixel
const PITCH_LIMIT = 1.2;    // radians (about 70 degrees up/down)
const PLAYER_RADIUS = 0.4;  // collision radius
const EYE_HEIGHT = 1.6;     // camera Y position
```

### Collision Detection

Simple AABB collision against wall segments. No physics engine needed.

```javascript
// Wall segments defined as axis-aligned boxes:
const WALLS = [
  { minX: -10, maxX: 10, minZ: -10.15, maxZ: -9.85 },  // north wall
  { minX: -10, maxX: 10, minZ: 9.85, maxZ: 10.15 },    // south wall
  { minX: -10.15, maxX: -9.85, minZ: -10, maxZ: 10 },  // west wall
  { minX: 9.85, maxX: 10.15, minZ: -10, maxZ: 10 },    // east wall
  // Alcove walls...
];

function collides(x, z) {
  for (const w of WALLS) {
    if (x + PLAYER_RADIUS > w.minX && x - PLAYER_RADIUS < w.maxX &&
        z + PLAYER_RADIUS > w.minZ && z - PLAYER_RADIUS < w.maxZ) {
      return true;
    }
  }
  return false;
}

// Move with sliding collision:
function movePlayer(dx, dz) {
  const nx = camera.position.x + dx;
  const nz = camera.position.z + dz;
  
  // Try full move
  if (!collides(nx, nz)) {
    camera.position.x = nx;
    camera.position.z = nz;
    return;
  }
  // Try X only (slide along Z wall)
  if (!collides(nx, camera.position.z)) {
    camera.position.x = nx;
    return;
  }
  // Try Z only (slide along X wall)
  if (!collides(camera.position.x, nz)) {
    camera.position.z = nz;
  }
}
```

Sliding collision is important — without it, brushing a wall stops you dead and feels terrible.

### Head Bob (optional, adds presence)

```javascript
const bobTimer = useRef(0);

// In animation loop, when player is moving:
if (isMoving) {
  bobTimer.current += 0.1;
  camera.position.y = EYE_HEIGHT + Math.sin(bobTimer.current) * 0.04;
} else {
  camera.position.y = EYE_HEIGHT; // reset when still
}
```

Keep it very subtle (±0.04 units). Too much causes motion sickness.

---

## HUD Overlay (React DOM on top of canvas)

The HUD is pure React, positioned absolutely over the Three.js canvas. This keeps it in the design system (Share Tech Mono, same colors) without trying to render text in 3D.

### Elements

```jsx
function HubHUD({ runState, meta, nearTarget }) {
  return (
    <>
      {/* Top-left: location + run info */}
      <div className="hub-hud-top-left">
        // orbital station — run {meta.totalRuns}
      </div>
      
      {/* Top-right: W/L and resources */}
      <div className="hub-hud-top-right">
        W:{meta.wins} L:{meta.losses} | Biomass:{runState.biomass} | Tech:{runState.techUsed}/{runState.techCap}
      </div>
      
      {/* Center: interact prompt */}
      {nearTarget && (
        <div className="hub-hud-interact">
          [E] {nearTarget.name}
        </div>
      )}
      
      {/* Bottom-left: controls hint */}
      <div className="hub-hud-controls">
        WASD move / mouse look
      </div>
      
      {/* Crosshair */}
      <div className="hub-crosshair" />
    </>
  );
}
```

### Pointer Lock UX

- Player clicks the canvas → pointer lock acquired, controls active
- Opening an overlay → pointer lock released, controls paused
- Pressing Escape in hub (no overlay) → pointer lock released, cursor visible
- Clicking canvas again → pointer lock re-acquired

---

## Ambient Details

### Floor Grid
```javascript
const grid = new THREE.GridHelper(20, 40, 0x0a1525, 0x0a1525);
grid.position.y = 0.01;
```
Very subtle, barely visible. Sells the sci-fi floor without distracting.

### Ceiling Light Panels
Flat box meshes flush with the ceiling, slightly emissive:
```javascript
const panelMat = new THREE.MeshBasicMaterial({ color: 0x1a2838 });
const panel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.8), panelMat);
panel.position.set(x, 3.47, z);
```
Each panel has a dim PointLight below it.

### Decor (add later, not MVP)
- Cable runs along wall bases (thin dark cylinders)
- Vent grates on walls (textured planes)
- Crate stacks in corners (box geometry clusters)
- Screen/monitor on walls showing status readouts (canvas textures)
- Atmospheric haze particles (Three.js Points with small transparent squares)

---

## Performance Notes

### Target: Stable 60fps

- All geometry uses `MeshLambertMaterial` with `flatShading: true` (cheapest lit material)
- No real-time shadows (too expensive, not needed for the aesthetic)
- Fog handles draw distance culling naturally
- Total triangle count should stay under 5,000 for the hub
- `renderer.setPixelRatio(1)` — no high-DPI scaling (keeps the low-fi look AND saves GPU)
- No post-processing passes for MVP

### Cleanup

Three.js leaks memory if you don't dispose. When HubWorld unmounts:

```javascript
useEffect(() => {
  return () => {
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    renderer.dispose();
  };
}, []);
```

---

## Implementation Order

1. **Basic room** — Floor, ceiling, 4 walls, fog, ambient light, ceiling lights. Camera with WASD + mouse look. Collision detection. (~2 hours)

2. **Arena doors** — 4 door frames along north wall with colored glow strips and point lights. Door state driven by `runState.ladderProgress`. (~1 hour)

3. **NPCs** — Dr. Helix and Cmdr. Vex as box figures in alcoves. Billboard rotation. Accent lights. (~1 hour)

4. **Terminals** — Codex and Supplies as small box-geometry stations on the floor. (~30 min)

5. **Interaction system** — Proximity detection, [E] prompt overlay, `onInteract` callback wiring to App.jsx screen routing. (~1-2 hours)

6. **Screen overlay transitions** — Blur/darken canvas when overlay opens, resume on close. Pointer lock management. (~1 hour)

7. **Arena door camera animation** — Zoom-into-door effect before fight transition. (~1 hour)

8. **Holographic bracket** — Canvas-textured plane in arena space, bracket data driven by `runState`. (~2 hours)

Total estimate: **~10 hours** for a polished hub. Start with steps 1-5 for the functional version, then add polish.
