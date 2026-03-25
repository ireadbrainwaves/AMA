# AMA Mutation Art & Pixi.js Composition System

## Overview

Characters are composed from layered sprites in real-time. A base body sprite plus mutation overlays at body-part offsets, plus optional tech glow effects. This system means every mutation in the game is one sprite that works on any character. Pixi.js handles the fight screen rendering. The doctor screen uses a simplified static version of the same composition for the body slot preview.

---

## Part 1: Art Production in Scenario

### What you're generating

For the slot composition system to work, mutation sprites need to be generated as **isolated body parts on transparent backgrounds** — not full characters with mutations baked in.

#### Mutation Overlay Sprites Needed (Batch 3)

Each mutation is a single body part that layers onto any base character:

| Mutation | Slot | Source Species | What it looks like |
|----------|------|---------------|-------------------|
| Tentacle Arm | rightArm | Psycho Squid | A purple tentacle, curled slightly, with suction cups visible |
| Gorilla Fist | leftArm | Cyber Gorilla | Oversized cybernetic gorilla fist, metallic gray with glowing joints |
| Bee Wings | back | Bee Swarm | Pair of translucent insect wings, yellow-amber tint |
| Shell Plate | chest | Terror Pin Turtle | Green armored carapace plate, hexagonal pattern |
| Neural Antenna | head | Psycho Squid | Bioluminescent antenna/tentacle extending from forehead |
| Swarm Legs | legs | Bee Swarm | Lower body replaced by a buzzing cluster of bees |
| Spine Whip | back | Parasitex | Barbed organic whip/tail extending from the spine |
| Leech Node | chest | Parasitex | Fleshy parasitic growth attached to the torso, pulsing |

#### Scenario Prompt Structure for Mutation Overlays

Each prompt should generate the body part in isolation. Key rules:
- **Transparent background** (use Scenario's transparency feature)
- **Consistent angle** matching your character front sprites (front-facing, slight 3/4 turn)
- **Same art style** as your trained Scenario model
- **Sized to fit** the slot region on a 128px character (mutation sprites should be roughly 32-64px)

Example prompt pattern:
```
[mutation name], isolated body part, pixel art, transparent background, 
front-facing view, [description of the part], 
matching style of [your Scenario model name]
```

For the BACK view versions (player character in fight screen), you also need rear-facing variants of each mutation. These can be simpler — less detail visible from behind.

#### What you DON'T need to generate

- Full characters with mutations already attached (the game composites these)
- Every character × mutation combination (one mutation sprite fits all characters)
- Animated frames yet (static first, animate in Aseprite later)

### Processing Pipeline

Same `process_sprite.py` you already have, but with mutation-specific profile:

```bash
python tools/process_sprite.py \
  --input AMA_Art_Book/06_Species_Mutations/MUT_tentacleArm_raw.png \
  --output src/assets/mutations/MUT_tentacleArm.png \
  --size 64 \
  --colors 16 \
  --padding 4
```

Mutations at 64px / 16 colors (half the character size, simpler palette). This keeps them visually subordinate to the base character while still readable.

### Naming Convention

```
MUT_{mutationName}_{view}.png

MUT_tentacleArm_front.png
MUT_tentacleArm_back.png
MUT_beeWings_front.png
MUT_beeWings_back.png
MUT_shellPlate_front.png
...
```

---

## Part 2: Pixi.js Composition System

### Architecture

```
FightScreen.jsx
└── BattleArena (div container)
    ├── Pixi.js Canvas (character rendering)
    │   ├── Player Character Composite
    │   │   ├── Back slot layer (wings, whip)
    │   │   ├── Base body sprite
    │   │   ├── Chest overlay
    │   │   ├── Left arm overlay
    │   │   ├── Right arm overlay
    │   │   ├── Head overlay
    │   │   ├── Legs overlay
    │   │   └── Tech glow layers
    │   └── Opponent Character Composite
    │       └── (same layer structure)
    └── React DOM overlays (resource bars, move panel, flash messages)
```

Pixi.js handles ONLY the character sprite compositing and animation. Everything else (resource bars, move select, HUD) stays as React DOM positioned over the canvas. This keeps the Pixi.js scope minimal.

### Setup

```bash
npm install pixi.js
```

### Core Renderer

```javascript
// src/rendering/CharacterCompositor.js
import * as PIXI from 'pixi.js';

// Slot render order (back to front)
const SLOT_ORDER = ['back', 'legs', 'chest', 'leftArm', 'rightArm', 'head'];

// Slot offsets relative to base sprite center (in pixels at 128px scale)
// These define WHERE each mutation part attaches on the character
const SLOT_OFFSETS = {
  cyberGorilla: {
    front: {
      leftArm:  { x: -32, y: 8 },
      rightArm: { x: 32, y: 8 },
      back:     { x: 0, y: -4 },
      chest:    { x: 0, y: 8 },
      head:     { x: 0, y: -28 },
      legs:     { x: 0, y: 32 },
    },
    back: {
      leftArm:  { x: -30, y: 10 },
      rightArm: { x: 30, y: 10 },
      back:     { x: 0, y: -2 },
      chest:    { x: 0, y: 10 },
      head:     { x: 0, y: -26 },
      legs:     { x: 0, y: 34 },
    },
  },
  psychoSquid: {
    front: {
      leftArm:  { x: -28, y: 12 },
      rightArm: { x: 28, y: 12 },
      back:     { x: 0, y: -6 },
      chest:    { x: 0, y: 6 },
      head:     { x: 0, y: -24 },
      legs:     { x: 0, y: 28 },
    },
    back: { /* ... */ },
  },
  // ... same for beeSwarm, terrorPinTurtle
};

export class CharacterCompositor {
  constructor(app, config) {
    this.app = app;
    this.container = new PIXI.Container();
    this.layers = {};
    this.species = config.species;
    this.view = config.view; // 'front' or 'back'
    
    // Create layer containers in render order
    this.layers.back = new PIXI.Container();
    this.layers.base = new PIXI.Container();
    this.layers.legs = new PIXI.Container();
    this.layers.chest = new PIXI.Container();
    this.layers.leftArm = new PIXI.Container();
    this.layers.rightArm = new PIXI.Container();
    this.layers.head = new PIXI.Container();
    this.layers.techGlow = new PIXI.Container();
    
    // Add in render order
    this.container.addChild(this.layers.back);
    this.container.addChild(this.layers.base);
    this.container.addChild(this.layers.legs);
    this.container.addChild(this.layers.chest);
    this.container.addChild(this.layers.leftArm);
    this.container.addChild(this.layers.rightArm);
    this.container.addChild(this.layers.head);
    this.container.addChild(this.layers.techGlow);
    
    app.stage.addChild(this.container);
  }
  
  // Load the base body sprite
  async loadBase(spritePath) {
    const texture = PIXI.Texture.from(spritePath);
    texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST; // pixel art!
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    this.layers.base.addChild(sprite);
    this.baseSprite = sprite;
  }
  
  // Attach a mutation to a slot
  async attachMutation(slot, mutationSpritePath) {
    // Clear existing mutation in this slot
    this.clearSlot(slot);
    
    const texture = PIXI.Texture.from(mutationSpritePath);
    texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    
    // Position at the slot offset for this species + view
    const offsets = SLOT_OFFSETS[this.species]?.[this.view];
    if (offsets?.[slot]) {
      sprite.x = offsets[slot].x;
      sprite.y = offsets[slot].y;
    }
    
    this.layers[slot].addChild(sprite);
    this.layers[slot].mutationSprite = sprite;
  }
  
  // Remove a mutation from a slot
  clearSlot(slot) {
    this.layers[slot].removeChildren();
    this.layers[slot].mutationSprite = null;
  }
  
  // Add tech glow effect to a slot
  addTechGlow(slot, glowColor = 0x00ccff) {
    const mutSprite = this.layers[slot].mutationSprite;
    if (!mutSprite) return;
    
    // Create a slightly larger, tinted copy behind the mutation
    const glow = new PIXI.Sprite(mutSprite.texture);
    glow.anchor.set(0.5);
    glow.x = mutSprite.x;
    glow.y = mutSprite.y;
    glow.scale.set(1.15);
    glow.tint = glowColor;
    glow.alpha = 0.4;
    glow.blendMode = PIXI.BLEND_MODES.ADD;
    
    this.layers.techGlow.addChild(glow);
  }
  
  // Set position of the entire composite
  setPosition(x, y) {
    this.container.x = x;
    this.container.y = y;
  }
  
  // Set scale (player is larger than opponent in Pokemon-style layout)
  setScale(s) {
    this.container.scale.set(s);
  }
  
  // Flash white on hit
  flashHit(duration = 200) {
    const filter = new PIXI.ColorMatrixFilter();
    filter.brightness(2, false);
    this.container.filters = [filter];
    setTimeout(() => { this.container.filters = []; }, duration);
  }
  
  // Shake on damage
  shake(intensity = 4, duration = 300) {
    const originalX = this.container.x;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed > duration) {
        this.container.x = originalX;
        return;
      }
      const decay = 1 - elapsed / duration;
      this.container.x = originalX + (Math.random() - 0.5) * intensity * 2 * decay;
      requestAnimationFrame(tick);
    };
    tick();
  }
  
  // Mutation destruction effect
  destroyMutation(slot) {
    const mutSprite = this.layers[slot].mutationSprite;
    if (!mutSprite) return;
    
    // Create 4-6 fragment sprites from the mutation
    const fragments = [];
    for (let i = 0; i < 5; i++) {
      const frag = new PIXI.Sprite(PIXI.Texture.WHITE);
      frag.width = 8;
      frag.height = 8;
      frag.tint = mutSprite.tint || 0xcccccc;
      frag.anchor.set(0.5);
      frag.x = mutSprite.x + (Math.random() - 0.5) * 16;
      frag.y = mutSprite.y + (Math.random() - 0.5) * 16;
      frag.vx = (Math.random() - 0.5) * 6;
      frag.vy = -Math.random() * 4 - 2;
      this.container.addChild(frag);
      fragments.push(frag);
    }
    
    // Remove the mutation sprite
    this.clearSlot(slot);
    
    // Animate fragments outward + fade
    const start = Date.now();
    const animateFragments = () => {
      const elapsed = Date.now() - start;
      if (elapsed > 500) {
        fragments.forEach(f => this.container.removeChild(f));
        return;
      }
      fragments.forEach(f => {
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.3; // gravity
        f.alpha = 1 - elapsed / 500;
      });
      requestAnimationFrame(animateFragments);
    };
    animateFragments();
  }
  
  // Clean up
  destroy() {
    this.app.stage.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}
```

### Integrating Pixi.js into FightScreen

```jsx
// In BattleArena.jsx (upgraded to use Pixi.js)

import { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { CharacterCompositor } from '../rendering/CharacterCompositor';
import SPRITES from '../data/spriteMap';

export default function BattleArena({
  playerSpecies,
  opponentSpecies,
  playerBuild,      // { slots: { leftArm: { mutation: null, tech: [] }, ... } }
  opponentBuild,
  playerAnimState,
  opponentAnimState,
  flashMessage,
  onReady,          // callback when Pixi.js is initialized
}) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const playerComp = useRef(null);
  const opponentComp = useRef(null);

  useEffect(() => {
    // Initialize Pixi.js app
    const app = new PIXI.Application({
      view: canvasRef.current,
      width: 800,
      height: 380,
      backgroundAlpha: 0,  // transparent — CSS background shows through
      resolution: 1,
    });
    appRef.current = app;

    // Create player composite (back sprite, bottom-left, larger)
    const player = new CharacterCompositor(app, {
      species: playerSpecies,
      view: 'back',
    });
    player.loadBase(SPRITES[playerSpecies].back);
    player.setPosition(200, 280);  // bottom-left
    player.setScale(2.5);          // larger = closer to camera
    playerComp.current = player;

    // Create opponent composite (front sprite, top-right, smaller)
    const opponent = new CharacterCompositor(app, {
      species: opponentSpecies,
      view: 'front',
    });
    opponent.loadBase(SPRITES[opponentSpecies].front);
    opponent.setPosition(580, 140);  // top-right
    opponent.setScale(1.8);          // smaller = farther away
    opponentComp.current = opponent;

    // Attach player mutations from build
    Object.entries(playerBuild.slots).forEach(([slot, data]) => {
      if (data.mutation) {
        const mutSpritePath = getMutationSpritePath(data.mutation, 'back');
        player.attachMutation(slot, mutSpritePath);
        
        // Add tech glow if enhanced
        if (data.tech.length > 0) {
          player.addTechGlow(slot);
        }
      }
    });

    // Attach opponent mutations
    Object.entries(opponentBuild.slots).forEach(([slot, data]) => {
      if (data.mutation) {
        const mutSpritePath = getMutationSpritePath(data.mutation, 'front');
        opponent.attachMutation(slot, mutSpritePath);
      }
    });

    // Idle bob animation
    app.ticker.add((delta) => {
      const bob = Math.sin(Date.now() * 0.002) * 2;
      player.container.y = 280 + bob;
      opponent.container.y = 140 + bob * 0.7;
    });

    onReady?.();

    return () => {
      player.destroy();
      opponent.destroy();
      app.destroy(false);
    };
  }, [playerSpecies, opponentSpecies]);

  // Handle animation state changes
  useEffect(() => {
    if (!playerComp.current) return;
    if (playerAnimState === 'attacking') {
      // Lunge toward opponent
      animateLunge(playerComp.current, 30, -15);
    } else if (playerAnimState === 'hit') {
      playerComp.current.flashHit();
      playerComp.current.shake();
    }
  }, [playerAnimState]);

  useEffect(() => {
    if (!opponentComp.current) return;
    if (opponentAnimState === 'attacking') {
      animateLunge(opponentComp.current, -30, 15);
    } else if (opponentAnimState === 'hit') {
      opponentComp.current.flashHit();
      opponentComp.current.shake();
    }
  }, [opponentAnimState]);

  return (
    <div className="battle-arena" style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '380px',
          imageRendering: 'pixelated',
        }}
      />
      {/* React DOM overlays for resource bars, flash messages etc. */}
      {flashMessage && <div className="arena-flash">{flashMessage}</div>}
    </div>
  );
}

function getMutationSpritePath(mutationId, view) {
  return `/assets/mutations/MUT_${mutationId}_${view}.png`;
}

function animateLunge(compositor, dx, dy, duration = 400) {
  const startX = compositor.container.x;
  const startY = compositor.container.y;
  const start = Date.now();
  
  const tick = () => {
    const elapsed = Date.now() - start;
    const t = Math.min(1, elapsed / duration);
    
    // Quick lunge out (0-40%) then return (40-100%)
    let progress;
    if (t < 0.4) {
      progress = t / 0.4; // 0 to 1
    } else {
      progress = 1 - (t - 0.4) / 0.6; // 1 to 0
    }
    
    const ease = progress * (2 - progress); // ease-out
    compositor.container.x = startX + dx * ease;
    compositor.container.y = startY + dy * ease;
    
    if (t < 1) requestAnimationFrame(tick);
  };
  tick();
}
```

---

## Part 3: Slot Offset Tuning

### The Offset Problem

Every character has different proportions. A gorilla's arm slot is wider than a squid's. The turtle is shorter. The bee swarm doesn't really have conventional arms.

**Solution: define offsets per species, tune visually, store as data.**

```javascript
// src/data/slotOffsets.js

// All values in pixels at base 128px sprite scale
// x: negative = left, positive = right
// y: negative = up, positive = down
// anchor is center of the base sprite

export const SLOT_OFFSETS = {
  cyberGorilla: {
    front: {
      leftArm:  { x: -34, y: 6 },
      rightArm: { x: 34, y: 6 },
      back:     { x: 0, y: -6 },
      chest:    { x: 0, y: 6 },
      head:     { x: 0, y: -30 },
      legs:     { x: 0, y: 34 },
    },
    back: {
      leftArm:  { x: -32, y: 8 },
      rightArm: { x: 32, y: 8 },
      back:     { x: 0, y: -4 },
      chest:    { x: 0, y: 8 },
      head:     { x: 0, y: -28 },
      legs:     { x: 0, y: 36 },
    },
  },
  psychoSquid: {
    front: {
      leftArm:  { x: -28, y: 10 },
      rightArm: { x: 28, y: 10 },
      back:     { x: 0, y: -8 },
      chest:    { x: 0, y: 4 },
      head:     { x: 0, y: -26 },
      legs:     { x: 0, y: 30 },
    },
    back: {
      leftArm:  { x: -26, y: 12 },
      rightArm: { x: 26, y: 12 },
      back:     { x: 0, y: -6 },
      chest:    { x: 0, y: 6 },
      head:     { x: 0, y: -24 },
      legs:     { x: 0, y: 32 },
    },
  },
  beeSwarm: {
    front: {
      leftArm:  { x: -22, y: 8 },
      rightArm: { x: 22, y: 8 },
      back:     { x: 0, y: -10 },
      chest:    { x: 0, y: 4 },
      head:     { x: 0, y: -22 },
      legs:     { x: 0, y: 26 },
    },
    back: {
      leftArm:  { x: -20, y: 10 },
      rightArm: { x: 20, y: 10 },
      back:     { x: 0, y: -8 },
      chest:    { x: 0, y: 6 },
      head:     { x: 0, y: -20 },
      legs:     { x: 0, y: 28 },
    },
  },
  terrorPinTurtle: {
    front: {
      leftArm:  { x: -30, y: 4 },
      rightArm: { x: 30, y: 4 },
      back:     { x: 0, y: -8 },
      chest:    { x: 0, y: 2 },
      head:     { x: 0, y: -24 },
      legs:     { x: 0, y: 28 },
    },
    back: {
      leftArm:  { x: -28, y: 6 },
      rightArm: { x: 28, y: 6 },
      back:     { x: 0, y: -6 },
      chest:    { x: 0, y: 4 },
      head:     { x: 0, y: -22 },
      legs:     { x: 0, y: 30 },
    },
  },
};
```

### Tuning Tool

Build a simple debug overlay (dev-only) that lets you drag slot positions on the character and outputs the offset values. This saves hours of guesswork:

```jsx
// src/tools/SlotTuner.jsx (dev-only tool, don't ship this)
// Renders a character with draggable colored rectangles at each slot position
// Outputs the current offsets to console on save
// Use this to tune offsets visually then paste into slotOffsets.js
```

---

## Part 4: Doctor Screen Composition

The doctor screen doesn't need Pixi.js — it uses a simplified static version.

### Body Slot Preview (left column)

When the player selects a body slot in the doctor screen, the right panel shows a preview of the character with that slot highlighted. This is a CSS-based composite, not Pixi.js:

```jsx
// Static character preview in doctor screen
function CharacterPreview({ species, view, playerBuild, highlightedSlot }) {
  const offsets = SLOT_OFFSETS[species][view];
  
  return (
    <div className="char-preview" style={{ position: 'relative', width: 160, height: 200 }}>
      {/* Base body */}
      <img
        src={SPRITES[species][view]}
        className="preview-base"
        style={{ 
          position: 'absolute', 
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          imageRendering: 'pixelated',
          width: 128,
        }}
      />
      
      {/* Mutation overlays */}
      {Object.entries(playerBuild.slots).map(([slot, data]) => {
        if (!data.mutation) return null;
        const offset = offsets[slot];
        const isHighlighted = slot === highlightedSlot;
        
        return (
          <img
            key={slot}
            src={getMutationSpritePath(data.mutation, view)}
            style={{
              position: 'absolute',
              left: `calc(50% + ${offset.x}px)`,
              top: `calc(50% + ${offset.y}px)`,
              transform: 'translate(-50%, -50%)',
              imageRendering: 'pixelated',
              width: 64,
              filter: isHighlighted ? 'brightness(1.5)' : 'none',
              outline: isHighlighted ? '2px solid #00ccff' : 'none',
            }}
          />
        );
      })}
      
      {/* Empty slot indicators */}
      {Object.entries(playerBuild.slots).map(([slot, data]) => {
        if (data.mutation) return null;
        const offset = offsets[slot];
        const isHighlighted = slot === highlightedSlot;
        
        return (
          <div
            key={slot}
            style={{
              position: 'absolute',
              left: `calc(50% + ${offset.x}px)`,
              top: `calc(50% + ${offset.y}px)`,
              transform: 'translate(-50%, -50%)',
              width: 24, height: 24,
              border: `1px dashed ${isHighlighted ? '#00ccff' : '#1a3040'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, color: '#2a4a5a',
            }}
          >
            {slot.charAt(0).toUpperCase()}
          </div>
        );
      })}
    </div>
  );
}
```

This gives the doctor a visual representation of the character's current build without any canvas overhead. When the player hovers/selects a slot, it highlights on the character preview. When they graft a mutation, it immediately appears on the character.

---

## Part 5: Production Order

### Immediate (do now)

1. **Run Batch 3 in Scenario** — 8 mutation overlay sprites (front views)
   - Use your existing trained model
   - Generate on transparent backgrounds
   - Front-facing, isolated body parts

2. **Process through pipeline** — `process_sprite.py` at 64px / 16 colors

3. **Create back-view versions** — either:
   - Generate in Scenario (ideal: use back-facing prompt variant)
   - Or mirror/simplify the front version in Aseprite (faster: flip horizontally, adjust details)

### Next (integration)

4. **Install Pixi.js** — `npm install pixi.js`

5. **Build CharacterCompositor** — the core class above

6. **Create slotOffsets.js** — rough initial values, tuned visually

7. **Replace BattleArena** — swap CSS-animated `<img>` tags for Pixi.js canvas
   - Keep all React DOM overlays (resource bars, move panel) unchanged
   - Only character rendering moves to Pixi.js

8. **Wire mutation data** — `playerBuild.slots` drives what's attached on the compositor

9. **Build doctor screen CharacterPreview** — CSS-based version, no Pixi.js needed

### Later (polish)

10. **Slot tuning tool** — dev-only draggable overlay for pixel-perfect offsets

11. **Mutation destruction VFX** — fragment particles on destroy

12. **Tech glow effects** — additive blend overlays on enhanced mutations

13. **Animated spritesheets** — replace static textures with Aseprite frame sequences

14. **Batch 4+** — boss moves, arena backgrounds, hub tileset

---

## Art Asset Checklist

### Characters (have)
- [x] Cyber Gorilla front + back
- [x] Psycho Squid front + back
- [x] Bee Swarm front + back
- [x] Terror Pin Turtle front + back
- [x] Parasitex front
- [ ] Echomorph front (Scenario version)
- [ ] Hydravine front (Scenario version)

### Mutation Overlays (need — Batch 3)
- [ ] MUT_tentacleArm_front.png
- [ ] MUT_gorillaFist_front.png
- [ ] MUT_beeWings_front.png
- [ ] MUT_shellPlate_front.png
- [ ] MUT_neuralAntenna_front.png
- [ ] MUT_swarmLegs_front.png
- [ ] MUT_spineWhip_front.png
- [ ] MUT_leechNode_front.png
- [ ] Back versions of all 8 (Batch 3B)

### Tech Glow Effects (later)
- [ ] Generic cyan glow overlay
- [ ] Red offensive glow
- [ ] Blue defensive glow
- [ ] Yellow utility glow
- [ ] Green passive glow

### Not needed for MVP
- Arena backgrounds (flat color works fine)
- Hub tileset (colored rectangles work for now)
- Animated frames (static sprites first)
