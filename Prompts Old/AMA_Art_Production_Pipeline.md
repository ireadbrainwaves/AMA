# AMA: ART PRODUCTION PIPELINE

**Full sprint plan — Midjourney generation + free tool cleanup**
**Organized to run in parallel with code development**

---

## Your Toolkit

Since you're running Midjourney only, here's the free cleanup stack:

| Tool | Purpose | Link |
|------|---------|------|
| **LibreSprite** | Free Aseprite fork — pixel editing, animation, sprite sheets | github.com/LibreSprite/LibreSprite |
| **Pixelorama** | Godot-based pixel art editor — layers, animation, onion skinning | orama-interactive.itch.io/pixelorama |
| **Photopea** | Free browser Photoshop — background removal, color reduction, layer compositing | photopea.com |
| **GIMP** | Heavy-duty image editing — batch processing, scripts, color indexing | gimp.org |
| **Lospec Palette Tool** | Browse and apply limited color palettes to enforce consistency | lospec.com/palette-list |

**Recommended combo:** Midjourney → Photopea (background removal + color reduction) → Pixelorama (pixel cleanup + animation frames + sprite sheet export)

---

## Phase Overview

```
PHASE 1: Style Lock (Day 1)
   └── Generate reference sheets, pick THE look, lock the seed
        No code dependency — do this first

PHASE 2: Base Characters (Days 1-2)
   └── 4 playable fighters as game-ready sprites
        Code dependency: CharacterRenderer.js (sprite compositing system)
        Start generating NOW, integrate when renderer is ready

PHASE 3: Mutation Parts (Days 2-3)
   └── 8 modular attachment sprites for the slot system
        Code dependency: modular sprite slot system in CharacterRenderer
        Generate in parallel with Phase 2 cleanup

PHASE 4: Arenas (Days 3-4)
   └── 4 arena backgrounds with parallax layers
        Code dependency: FightScreen background rendering
        Lowest priority — colored rectangles work fine as placeholders

PHASE 5: UI & Hub (Days 4-5)
   └── Resource bars, type badges, hub tileset, NPCs
        Code dependency: UI component refactor (if happening)
        Can be done anytime — UI assets are the most flexible

PHASE 6: Animation (Ongoing)
   └── Idle, attack, hit, destruction frames
        Code dependency: AnimatedSprite support in renderer
        Layer in after static sprites are working in-game
```

---

## PHASE 1: STYLE LOCK

**Goal:** Establish the exact visual style before generating any game assets. This prevents redoing work when "that looked different from the first one."

**Time: 1-2 hours**

### Step 1 — Reference Sheet Generation

Run these prompts in a SINGLE Midjourney session to keep style consistent:

```
STYLE REFERENCE (run this first to anchor everything):
16-bit pixel art character lineup, 4 alien fighters side by side,
cybernetic gorilla, psychic squid humanoid, bee swarm entity,
armored turtle, SNES fighting game style, dark sci-fi colosseum
background, neon lighting, limited color palette, retro game art
--ar 16:9 --style raw --v 6.1
```

```
GORILLA REFERENCE SHEET:
pixel art character reference sheet, cybernetic gorilla alien,
multiple poses (idle, attack, damaged), steel gray body, electric
blue cybernetic accents, muscular build, 16-bit SNES style,
dark background, clean pixel edges, game asset sheet
--ar 16:9 --style raw --v 6.1
```

```
SQUID REFERENCE SHEET:
pixel art character reference sheet, psychic alien squid humanoid,
multiple poses (idle, floating, attacking), deep purple body,
toxic green bioluminescent spots, tentacle arms, 16-bit SNES style,
dark background, clean pixel edges, game asset sheet
--ar 16:9 --style raw --v 6.1
```

```
BEE REFERENCE SHEET:
pixel art character reference sheet, alien bee swarm entity,
multiple poses (idle, buzzing, attacking), amber yellow and black,
cloud-like body of small bee units, 16-bit SNES style,
dark background, clean pixel edges, game asset sheet
--ar 16:9 --style raw --v 6.1
```

```
TURTLE REFERENCE SHEET:
pixel art character reference sheet, armored alien turtle warrior,
multiple poses (idle, defensive, attacking), forest green body,
rust orange shell plates, massive shell, 16-bit SNES style,
dark background, clean pixel edges, game asset sheet
--ar 16:9 --style raw --v 6.1
```

### Step 2 — Lock the Style

From your reference outputs:
1. Pick the generation that nails the vibe across ALL characters
2. Note the **--seed** value (react to the image with ✉️ in Discord to get the seed)
3. Save that seed — use it in ALL subsequent prompts with `--seed [YOUR_SEED]`
4. Screenshot your chosen reference and save as `assets/reference/style_lock.png`

### Step 3 — Color Palette Extraction

For each character, extract the dominant 8-12 colors from the reference:

| Character | Primary | Secondary | Accent | Glow |
|-----------|---------|-----------|--------|------|
| Gorilla | Steel gray | Dark gray | Electric blue | Cyan |
| Squid | Deep purple | Dark violet | Toxic green | Green glow |
| Bee | Amber yellow | Black | Gold | Orange glow |
| Turtle | Forest green | Brown | Rust orange | Teal glow |

Save these as named palettes in Pixelorama or as .gpl files for reuse.

**PHASE 1 DELIVERABLES:**
- [ ] Style reference image saved
- [ ] Seed value recorded: ___________
- [ ] 4 character reference sheets generated
- [ ] Color palettes extracted for each character
- [ ] Free tools installed and tested

---

## PHASE 2: BASE CHARACTER SPRITES

**Goal:** 4 game-ready character sprites at 64x64, with placeholder animation frames.

**Time: 3-4 hours (1 hour generation, 2-3 hours cleanup)**

### Generation Order
Generate all 4 in one session to maintain style consistency.

```
GORILLA GAME SPRITE:
16-bit pixel art character sprite, side view, cybernetic gorilla alien,
muscular build, steel gray body with electric blue accents, standing
fighting pose, 64x64 pixel resolution, SNES style, black background,
clean edges, limited color palette, game asset, transparent background
--ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]
```

```
SQUID GAME SPRITE:
16-bit pixel art character sprite, side view, psychic alien squid
humanoid, purple body with toxic green bioluminescent spots, tentacle
arms, floating pose, 64x64 pixel resolution, SNES style, black
background, clean edges, limited color palette, game asset
--ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]
```

```
BEE GAME SPRITE:
16-bit pixel art character sprite, side view, alien bee swarm entity,
amber yellow and black, cloud-like body made of small bee units,
buzzing pose, 64x64 pixel resolution, SNES style, black background,
clean edges, limited color palette, game asset
--ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]
```

```
TURTLE GAME SPRITE:
16-bit pixel art character sprite, side view, armored alien turtle,
massive shell, forest green and rust orange, defensive stance, 64x64
pixel resolution, SNES style, black background, clean edges, limited
color palette, game asset
--ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]
```

### Cleanup Pipeline (per character)

1. **Photopea** — Open the upscaled MJ output
   - Select > Color Range > select the black background > Delete
   - Image > Image Size > set to 64x64 > Resample: Nearest Neighbor
   - Image > Mode > Indexed Color > 12 colors max
   - Export as PNG with transparency

2. **Pixelorama** — Open the cleaned PNG
   - Fix any pixel artifacts from the downscale
   - Ensure the character reads clearly at 64x64
   - Apply your locked color palette (replace any off-palette colors)
   - Save as `gorilla_base.png`, `squid_base.png`, etc.

3. **Quick idle animation** (2 frames)
   - Duplicate the sprite
   - Shift the body down 1 pixel on frame 2 (breathing effect)
   - Optionally add a subtle glow pulse on cybernetic/energy parts
   - Export as sprite sheet (2 frames horizontal): `gorilla_idle.png`

### File Structure
```
assets/
├── characters/
│   ├── gorilla_base.png      (64x64, static)
│   ├── gorilla_idle.png      (128x64, 2-frame sheet)
│   ├── squid_base.png
│   ├── squid_idle.png
│   ├── bee_base.png
│   ├── bee_idle.png
│   ├── turtle_base.png
│   └── turtle_idle.png
└── reference/
    ├── style_lock.png
    └── palettes/
```

**PHASE 2 DELIVERABLES:**
- [ ] Gorilla base sprite (64x64 transparent PNG)
- [ ] Squid base sprite
- [ ] Bee base sprite
- [ ] Turtle base sprite
- [ ] 2-frame idle sheets for each
- [ ] All pass the "squint test" — recognizable at a glance

**CODE SYNC POINT:** Once these exist, the Claude Code agent can wire up `CharacterRenderer.js` to load real sprites instead of colored rectangles. Share the file paths.

---

## PHASE 3: MUTATION PARTS

**Goal:** 8 modular mutation sprites that layer onto ANY base character via the slot system.

**Time: 2-3 hours**

### What to Generate

Each mutation goes in a specific attachment slot. Generate them at the same resolution as characters (64x64 canvas, part fills relevant area).

| Mutation | Slot | Source Species | Colors |
|----------|------|---------------|--------|
| Tentacle Arm | Right Arm | Squid | Purple + green |
| Chitin Arm Plates | Left Arm | Bee | Dark brown + red |
| Bee Wings | Back | Bee | Amber + translucent |
| Turtle Shell Plate | Chest | Turtle | Green + rust |
| Neural Implant | Head | Squid | Blue circuits |
| Tail Whip | Legs | Turtle | Green + spines |
| Spore Sacs | Back | Hydravine | Teal + pink glow |
| Parasite Tendrils | Chest | Parasitex | Red + bone white |

### Prompts (run in batch)

```
TENTACLE ARM:
16-bit pixel art sprite, alien tentacle arm, purple with green suckers,
side view, isolated body part on transparent background, game asset,
64x64, SNES style, clean edges --ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]

CHITIN ARM PLATES:
16-bit pixel art sprite, insectoid chitin armor plates for arm,
dark brown exoskeleton with red accents, side view, isolated part,
game asset, 64x64, SNES style --ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]

BEE WINGS:
16-bit pixel art sprite, translucent alien insect wings pair,
amber glow, back attachment, isolated part on transparent background,
game asset, 64x64, SNES style --ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]

TURTLE SHELL PLATE:
16-bit pixel art sprite, armored chest plate from alien turtle shell,
green and rust, front view chest attachment, isolated part, game asset,
64x64, SNES style --ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]

NEURAL IMPLANT:
16-bit pixel art sprite, cybernetic brain implant on head, glowing
blue circuits, sci-fi tech, isolated head attachment, game asset,
64x64, SNES style --ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]

TAIL WHIP:
16-bit pixel art sprite, alien reptile tail with spines, green scales
with rust-orange spikes, side view, isolated body part, game asset,
64x64, SNES style --ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]

SPORE SACS:
16-bit pixel art sprite, alien plant spore sacs, dark teal bulbs
with glowing pink veins, back attachment, isolated part, game asset,
64x64, SNES style --ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]

PARASITE TENDRILS:
16-bit pixel art sprite, parasitic alien tendrils, blood red with
bone white tips, chest attachment, writhing, isolated part, game asset,
64x64, SNES style --ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]
```

### Cleanup Notes

Mutation parts need extra care because they LAYER on top of base characters:
- Transparent background is critical — no stray pixels
- Parts should be sized to fit their slot region (arm parts fill ~25% of canvas on one side)
- Test each part by manually layering it on top of a base character in Photopea
- If it looks wrong on the gorilla, adjust until it works — it needs to look decent on all 4

### File Structure
```
assets/
├── mutations/
│   ├── tentacle_arm.png
│   ├── chitin_arm.png
│   ├── bee_wings.png
│   ├── turtle_shell.png
│   ├── neural_implant.png
│   ├── tail_whip.png
│   ├── spore_sacs.png
│   └── parasite_tendrils.png
```

**PHASE 3 DELIVERABLES:**
- [ ] 8 mutation part sprites (64x64 transparent PNGs)
- [ ] Each tested as overlay on at least 1 base character
- [ ] Colors clearly distinct from base characters (you can tell what's grafted)

**CODE SYNC POINT:** These plug directly into the modular slot system. Each mutation in `mutations.js` gets a `spriteAsset` path and `slot` assignment. The renderer composites them.

---

## PHASE 4: ARENA BACKGROUNDS

**Goal:** 4 arena backgrounds with 2-3 parallax layers each.

**Time: 2-3 hours**

### Arenas to Generate

| Arena | Mood | Key Colors |
|-------|------|-----------|
| Toxic Hive | Gross, buzzing, sticky | Amber, toxic green, dark |
| Psionic Reef | Eerie, bioluminescent, deep | Purple, blue, glowing |
| Volcanic Pit | Intense, hot, dangerous | Red, orange, obsidian |
| Gravity Well | Cosmic, vast, weightless | Purple, black, starfield |

### Parallax Strategy

Each arena needs 2-3 layers that scroll at different speeds:
- **Back layer** (slowest): sky/space/distant environment
- **Mid layer**: main structures, walls, terrain
- **Front layer** (fastest, optional): foreground details, particles, fog

Generate these as separate prompts or crop from a single wide shot.

```
TOXIC HIVE — FULL:
16-bit pixel art game background, alien beehive arena, dripping amber
honey walls, hexagonal structures, toxic green fog, neon lighting,
dark atmospheric, SNES style, 960x640, wide shot, parallax layers
--ar 3:2 --style raw --v 6.1 --seed [YOUR_SEED]

PSIONIC REEF — FULL:
16-bit pixel art game background, underwater alien coral arena,
bioluminescent purple and blue, floating psychic energy orbs, deep
ocean feel, dark atmospheric, SNES style, 960x640, parallax layers
--ar 3:2 --style raw --v 6.1 --seed [YOUR_SEED]

VOLCANIC PIT — FULL:
16-bit pixel art game background, volcanic alien arena, lava flows,
obsidian platforms, red and orange glow, heat shimmer, dark atmospheric,
SNES style, 960x640, parallax layers
--ar 3:2 --style raw --v 6.1 --seed [YOUR_SEED]

GRAVITY WELL — FULL:
16-bit pixel art game background, zero gravity arena in space,
floating rock platforms, distant nebula, purple and black, star field,
cosmic scale, SNES style, 960x640, parallax layers
--ar 3:2 --style raw --v 6.1 --seed [YOUR_SEED]
```

### Splitting Into Layers (in Photopea)

1. Open the full arena image
2. Separate distinct depth planes onto layers (distant, mid, near)
3. Export each layer as a separate PNG with transparency
4. Name as: `toxic_hive_back.png`, `toxic_hive_mid.png`, `toxic_hive_front.png`

```
assets/
├── arenas/
│   ├── toxic_hive_back.png
│   ├── toxic_hive_mid.png
│   ├── toxic_hive_front.png
│   ├── psionic_reef_back.png
│   ├── psionic_reef_mid.png
│   ├── ... (repeat for each arena)
```

**PHASE 4 DELIVERABLES:**
- [ ] 4 arena backgrounds (each split into 2-3 parallax layers)
- [ ] Dark enough that characters pop in front
- [ ] Distinct mood per arena — you can tell them apart at a glance

**CODE SYNC POINT:** FightScreen gets a `background` property per arena. Parallax scrolling is a nice-to-have — even static backgrounds are a huge upgrade over solid colors.

---

## PHASE 5: UI & HUB ASSETS

**Goal:** Resource bar graphics, type icons, hub world tileset, NPC sprites.

**Time: 2-3 hours**

### UI Assets

These are small but high-impact. They replace the CSS-drawn bars and text labels.

| Asset | Size | Notes |
|-------|------|-------|
| Guard bar frame | 200x20 | Blue-tinted frame, fill bar inside |
| Composure bar frame | 200x20 | Purple-tinted frame |
| Body bar frame | 200x20 | Red-tinted frame |
| Stamina bar frame | 200x20 | Yellow-tinted frame |
| Type badges (8) | 32x32 each | POWER, FAST, EVASION, DEFENSE, PSYCHIC, AREA, GRAB, SPECIAL |
| Arena card back | 120x160 | Mysterious card back for unrevealed arenas |
| Scar icon | 16x16 | Small mark for the scar HUD |

### Hub World

```
HUB TILESET:
16-bit pixel art game tileset, alien tournament colosseum interior,
dark purple stone floors, glowing cyan wall panels, neon arena lights,
sci-fi architecture, top-down perspective, SNES style, tile-based,
32x32 tiles, tileset sheet layout
--ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]

NPC — COMMANDER VEX:
16-bit pixel art character sprite, alien military commander, stern
but fair, dark green uniform with gold insignia, standing at attention,
top-down RPG perspective, 32x32, SNES style, game asset
--ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]

NPC — DR. HELIX:
16-bit pixel art character sprite, mad alien scientist doctor,
excited expression, lab coat covered in stains, multiple tool arms,
slightly unhinged look, top-down RPG perspective, 32x32, SNES style
--ar 1:1 --style raw --v 6.1 --seed [YOUR_SEED]

PLAYER TOP-DOWN:
16-bit pixel art character sprite, generic alien fighter, top-down
RPG perspective, 4-direction walk cycle (down, up, left, right),
32x32 per frame, SNES style, sprite sheet layout
--ar 4:1 --style raw --v 6.1 --seed [YOUR_SEED]
```

**PHASE 5 DELIVERABLES:**
- [ ] Resource bar frames (4 bars)
- [ ] Type badge icons (8 types)
- [ ] Hub tileset (floor, walls, doors, deco)
- [ ] Commander Vex sprite (32x32)
- [ ] Dr. Helix sprite (32x32)
- [ ] Player top-down sprite (4 directions)

---

## PHASE 6: ANIMATION (ONGOING)

**Goal:** Bring sprites to life. Layer in as time allows.

### Priority Order (matches the doc)

**Ship-blocking animations:**
1. **Simultaneous reveal flash** — scale-up + color flash on both characters when moves show. Can be code-only (no sprite needed — tint + scale tween).
2. **Damage hit reaction** — 2 frames: normal + flinch (shifted back 2px, squished slightly). Plus screen shake (code-only).
3. **Mutation destruction** — the part sprite shatters into 4-6 pieces that fly outward. Mostly code (particle system), but need the part sprite split into chunks.
4. **Finisher cinematic** — 1 custom frame per character for their finisher moment. Gorilla: beam pose. Squid: psychic shatter. Bee: swarm explosion. Turtle: tidal crash.

**Polish animations (post-MVP):**
5. Idle breathing (2 frames — already covered in Phase 2)
6. Mutation graft snap-on effect
7. Stamina push aura buildup
8. Arena card flip

### Frame Counts Per Character (MVP)

| Animation | Frames | Method |
|-----------|--------|--------|
| Idle | 2 | Pixel shift + glow pulse |
| Attack | 3 | Wind-up, strike, recover |
| Hit/flinch | 2 | Recoil + flash |
| Defeat | 3 | Stagger, fall, down |
| Finisher pose | 1 | Unique per character |

**Total: ~11 frames × 4 characters = 44 frames**

At roughly 10 minutes per frame (modifying the base), that's about 7-8 hours of animation work. Spread across sessions, not a single sprint.

---

## COORDINATION WITH CLAUDE CODE AGENT

Here's what to tell the code agent and when:

| When you finish... | Tell the code agent to... |
|--------------------|--------------------------|
| Phase 2 (base sprites) | Build `CharacterRenderer.js` with sprite loading, replace colored rectangles. File paths: `assets/characters/[species]_base.png` |
| Phase 3 (mutations) | Wire mutation sprites into the slot system. Each mutation in `mutations.js` gets a `sprite` and `slot` field. Renderer composites layers. |
| Phase 4 (arenas) | Add arena backgrounds to FightScreen. Load per-arena images. Optional parallax. |
| Phase 5 (UI) | Replace CSS resource bars with sprite-based bars. Add type badge images to move cards. |
| Phase 6 (animation) | Implement AnimatedSprite support — load sprite sheets, play frame sequences on game events (attack, hit, destroy). |

**Key principle:** Generate art slightly ahead of code. By the time you finish Phase 2 cleanup, the code agent should be ready to receive sprites. Don't wait for the renderer to start generating.

---

## QUICK REFERENCE: ASSET TOTALS

| Category | Count | Status |
|----------|-------|--------|
| Character base sprites | 4 | Not started |
| Character idle sheets | 4 | Not started |
| Mutation overlay sprites | 8 | Not started |
| Arena backgrounds (layers) | ~12 | Not started |
| UI bar frames | 4 | Not started |
| Type badge icons | 8 | Not started |
| Hub tileset | ~20 tiles | Not started |
| NPC sprites | 3 | Not started |
| Animation frames | ~44 | Not started |
| **TOTAL** | **~107 assets** | |

**Estimated total production time: 15-20 hours**
(Split across ~5 sessions running parallel with code development)
