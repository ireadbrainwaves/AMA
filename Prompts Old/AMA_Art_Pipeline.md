# AMA: ART PIPELINE SPECIFICATION

**From Midjourney concept to in-game Pixi.js sprite — the complete production workflow**
**Budget constraint: Under $100 one-time tool spend**
**Team size: Solo developer with AI-assisted generation**

---

## Pipeline Philosophy

AMA's art pipeline draws from three proven indie approaches, adapted for a solo developer using AI image generation as the concept/base art phase:

**Hollow Knight model** — Hand-crafted PNGs imported directly into engine. Team Cherry's 3-person team hand-drew every asset in Photoshop, saved as flat PNGs, and imported into Unity with minimal shader work. AMA follows this "flat PNG into engine" pattern, substituting Midjourney generation + Aseprite cleanup for hand-drawing.

**Dead Cells hybrid insight** — Motion Twin's single artist created characters in 3D, then rendered them as pixelated 2D sprites with normal maps for dynamic lighting. AMA borrows the concept of generating higher-fidelity source art and downscaling it into pixel-resolution sprites, but uses AI generation instead of 3D modeling as the high-fidelity source.

**Hades production discipline** — Supergiant's ~6-person art team delivered 59 portraits, 1,400 environment textures, and nearly a million animation frames by choosing a fast art style (pen and ink) that aligned with production constraints. AMA applies the same principle: choose a visual style (16-bit neon pixel art) that Midjourney generates consistently and that processes cleanly through an automated pipeline.

---

## Phase Overview

```
PHASE 1: PRE-PRODUCTION          PHASE 2: GENERATION
Art direction lockdown     →     Midjourney batch prompting
Style reference (--sref)         Selection + upscaling
Asset manifest finalized         Raw PNG export

PHASE 3: PROCESSING              PHASE 4: ANIMATION
Background removal         →     Aseprite frame work
Auto-crop + downscale            Idle, hit, attack cycles
Palette reduction                Spine rigging (optional)
Transparent PNG export           Spritesheet export

PHASE 5: INTEGRATION             PHASE 6: POLISH
Pixi.js texture loading    →     Visual consistency pass
Slot system composition          Performance profiling
State-driven rendering           Final naming + version control
```

Each phase has clear entry criteria, deliverables, and quality gates. An asset does not advance to the next phase until the current phase's gate is passed.

---

## Phase 1: Pre-Production

### 1.1 Art Direction Lock

AMA's visual identity is defined by a single Midjourney style reference image. Every asset in the game is generated with the same `--sref` URL, ensuring visual cohesion across all 54 assets without requiring a human art director to review every piece for style consistency.

**Style pillars:**
- 16-bit pixel art (SNES-era fidelity, not NES, not HD)
- Neon color accents on dark backgrounds (cyberpunk-organic fusion)
- Clean sprite edges suitable for compositing
- Readable silhouettes at 128px and below

**Style reference (locked):**
```
--sref https://cdn.midjourney.com/f6d9874d-70f9-4f4b-a4df-ed3908ac1b3e/0_0.webp
```

This is AMA's equivalent of an AAA studio's "graphic charter" or style guide. In industry terms, this reference image plus the prompt template below constitute the art direction document that would normally be a 40-page PDF maintained by a lead artist.

### 1.2 Asset Manifest

The complete manifest lives in `AMA_Art_Manifest.md` and defines all 54 assets across 8 categories:

| Category | Count | Priority | Notes |
|----------|-------|----------|-------|
| Character sprites (front + back) | 11 | Highest | Core gameplay — needed for battle view |
| Species mutations (overlays) | 8 | High | Modular slot attachments |
| Boss moves + steal VFX | 4 | High | Parasitex-specific effects |
| Doctor mutations (overlays) | 6 | High | Purchasable from Dr. Helix |
| Tech glow overlays | 8 | Medium | VFX layer per move type |
| Arenas (Pokemon POV) | 4 | Medium | Battle backgrounds |
| UI assets | 8 | Lower | Functional placeholders work initially |
| Hub world | 5 | Lower | Can use placeholder tiles early |

**Naming convention** (adapted from industry standard `[TypePrefix]_[BaseName]_[Descriptor]`):

```
SPR_cyberGorilla_front.png        — character sprite, front-facing
SPR_cyberGorilla_back.png         — character sprite, back-facing
MUT_power_slam_rightArm.png       — mutation overlay, slot-tagged
VFX_power_glow.png                — tech glow overlay
BG_toxic_hive.png                 — arena background
UI_bar_guard.png                  — UI element
HUB_npc_drHelix.png               — hub world asset
```

Prefixes ensure assets sort by type in any file browser and map directly to Pixi.js loader keys.

### 1.3 Prompt Template

Every Midjourney prompt follows this locked template:

```
16-bit pixel art sprite, [DESCRIPTION], [COLOR PALETTE],
[VIEW ANGLE], [SIZE], SNES style, clean edges
--ar [RATIO] --style raw --v 6.1
--sref https://cdn.midjourney.com/f6d9874d-70f9-4f4b-a4df-ed3908ac1b3e/0_0.webp
```

**View angles by asset type:**
- Character front: `front-facing, battle stance, facing camera`
- Character back: `rear view, over-the-shoulder, back to camera`
- Mutations: `isolated part on dark background, game asset overlay`
- VFX: `isolated energy effect, transparent background, game VFX`
- Arenas: `over-the-shoulder perspective, depth view, battle arena`
- UI: `isolated UI element, flat icon, game HUD asset`

**Quality gate:** Every prompt must include `--style raw` (prevents Midjourney's aesthetic override) and the `--sref` URL. No exceptions.

---

## Phase 2: Generation

### 2.1 Midjourney Batch Plan

Generation follows the priority order from the manifest. Each batch targets one asset category to maintain focus and allow style comparison within a category before moving on.

**Batch 1 — Character sprites (11 prompts, ~45 min)**
Generate front-facing and back-facing views for all 7 species. Playable characters need both views; non-playable opponents need front only. Generate 4 variations per prompt, select the best, upscale.

**Batch 2 — Species mutations (8 prompts, ~30 min)**
Each mutation is an isolated overlay on dark background. These must read clearly at small sizes since they attach to character slots. Generate with extra emphasis on clean edges and isolation from background.

**Batch 3 — Doctor mutations + boss moves (10 prompts, ~35 min)**
Same approach as species mutations. Boss move VFX need more dynamic composition (tendrils extending, webs spreading, impact effects).

**Batch 4 — Arenas (4 prompts, ~20 min)**
Over-the-shoulder Pokemon perspective. These are the most complex compositions — foreground, midground, background depth with battle framing. May need 2-3 re-rolls per arena to get the perspective right.

**Batch 5 — Tech glow overlays (8 prompts, ~25 min)**
Pure energy/glow effects. These layer on top of characters during attacks. Need transparent/dark backgrounds and strong color identity per move type.

**Batch 6 — UI + hub world (13 prompts, ~30 min)**
Smallest sprites, simplest compositions. UI elements are functional — readability matters more than artistry. Hub NPCs at 32x32 target size.

**Total estimated generation time: 3-4 hours**

### 2.2 Selection Criteria

For each prompt's 4 variations, select based on:

1. **Silhouette clarity** — Can you identify what it is at 128px? At 64px?
2. **Edge cleanliness** — Will background removal be clean or fight with the subject?
3. **Color palette adherence** — Does it match the species' defined palette?
4. **Composability** — For mutations, will it layer convincingly on a base character?
5. **Style consistency** — Does it look like it belongs with previously selected assets?

### 2.3 Export from Midjourney

After selection and upscale, export the raw PNG from Midjourney. These are the "source art" files — the equivalent of a traditional studio's PSD/Maya source files.

**Storage structure:**
```
assets/
  raw/                          ← Midjourney exports (source files, never modified)
    characters/
      cyberGorilla_front_raw.png
      cyberGorilla_back_raw.png
    mutations/
      power_slam_raw.png
    vfx/
    arenas/
    ui/
    hub/
  processed/                    ← Pipeline output (game-ready)
    sprites/
    overlays/
    backgrounds/
    ui/
```

**Quality gate:** Raw files are archived and never modified. All processing happens on copies. This is AMA's equivalent of the industry-standard two-repository split (source assets vs. game resources).

---

## Phase 3: Processing

### 3.1 The Sprite Pipeline Script

AMA uses an automated Python processing script (`tools/process_sprite.py`) that handles the full cleanup pipeline. This replaces what would be hours of manual Photoshop work per asset.

The script runs five steps in sequence:
1. Background removal (flood-fill from edges, color-key, or AI-based)
2. Auto-crop to content bounds with configurable padding
3. Nearest-neighbor downscale to target game resolution
4. Optional palette reduction for retro aesthetic
5. Transparent PNG export, optimized

### 3.2 Processing Profiles by Asset Type

Each asset category has a defined processing profile — a locked set of parameters that ensures consistency within a category.

**Character Sprites:**
```bash
python tools/process_sprite.py raw/characters/cyberGorilla_front_raw.png \
  -o processed/sprites/SPR_cyberGorilla_front.png \
  -s 128 -c 32 --method flood --dark-threshold 80
```
- Target: 128px (fits 1280x720 game resolution, leaves room for detail)
- Colors: 32 (preserves neon glows while feeling retro)
- BG removal: Flood-fill (Midjourney characters are centered on dark backgrounds)

**Mutation Overlays:**
```bash
python tools/process_sprite.py raw/mutations/power_slam_raw.png \
  -o processed/overlays/MUT_power_slam_rightArm.png \
  -s 64 -c 16 --square --method flood
```
- Target: 64px (mutations are smaller, attach to character slots)
- Colors: 16 (simpler palette, these layer on top of base sprites)
- Square: Yes (aligns to slot grid system)

**VFX / Tech Glows:**
```bash
python tools/process_sprite.py raw/vfx/power_glow_raw.png \
  -o processed/overlays/VFX_power_glow.png \
  -s 64 --method none
```
- Target: 64px
- Colors: No reduction (glow gradients need full color range)
- BG removal: Skip (dark backgrounds work as transparency in additive blend mode — the game engine handles this via Pixi.js blend modes)

**Arenas:**
```bash
python tools/process_sprite.py raw/arenas/toxic_hive_raw.png \
  -o processed/backgrounds/BG_toxic_hive.png \
  -s 1280 -c 64 --method none --no-smooth
```
- Target: 1280px wide (full game width, not a sprite)
- Colors: 64 (more palette room for environmental detail)
- BG removal: None (arenas ARE the background)

**UI Elements:**
```bash
python tools/process_sprite.py raw/ui/bar_guard_raw.png \
  -o processed/ui/UI_bar_guard.png \
  -s 256 --method flood
```
- Target: 256px wide (UI bars are horizontal, need width)
- Colors: No reduction (UI needs to be crisp and readable)

**Hub World:**
```bash
python tools/process_sprite.py raw/hub/npc_drHelix_raw.png \
  -o processed/hub/HUB_npc_drHelix.png \
  -s 32 -c 16 --square --method flood
```
- Target: 32px (small top-down NPCs)
- Colors: 16 (tight palette, tiny sprite)

### 3.3 Batch Processing

Process an entire category at once:
```bash
python tools/process_sprite.py raw/characters/ \
  -o processed/sprites/ -s 128 -c 32
```

### 3.4 Manual Cleanup in Aseprite ($19.99)

The automated pipeline handles 80-90% of cases cleanly. For the remaining assets that need manual touch-up:

**When to use Aseprite:**
- Background removal left artifacts (stray pixels, color fringing at edges)
- A mutation overlay needs its edges hand-refined to composite cleanly on base characters
- Palette reduction created color banding that looks wrong
- A sprite needs hand-drawn detail that Midjourney couldn't generate (specific slot attachment points, hitbox-aligned features)

**Aseprite workflow:**
1. Open the processed PNG (not the raw — start from the pipeline output)
2. Fix edges with the pencil tool at 1x zoom (pixel-level precision)
3. Use indexed color mode to verify palette count matches the profile
4. Export as PNG with transparency preserved
5. Overwrite the processed file (same name, same location)

**Aseprite is also used for all animation work** — see Phase 4.

### 3.5 Quality Gate: Processing

Every processed asset must pass:
- Transparent background (no stray opaque pixels in corners)
- Correct dimensions (within 10% of target profile)
- Palette within target count (check with Aseprite's color count)
- Visual clarity at intended display size (zoom out in Aseprite to verify)
- Clean edges (no halos, no color fringing from background removal)

---

## Phase 4: Animation

### 4.1 Animation Strategy

AMA uses primarily **frame-by-frame animation in Aseprite**, supplemented by code-driven animation in Pixi.js for simple effects. This follows the Hollow Knight model (hand-crafted frames) rather than the skeletal approach, for three reasons:

1. **Pixel art + skeletal = uncanny.** Spine's smooth interpolation creates fluid motion that looks wrong on chunky pixel sprites. The "cutout puppet" quality that Spine produces conflicts with AMA's 16-bit SNES aesthetic.
2. **Frame count is manageable.** AMA's characters need 3-5 animation states with 4-8 frames each. That's roughly 15-30 frames per character, not the 50,000 frames of Cuphead. A solo developer can produce this.
3. **Pixi.js AnimatedSprite is built for this.** Frame-by-frame sprite animation is Pixi.js's native strength. No plugins or middleware needed.

**Exception — Spine Essential ($69) for future scaling:**
If AMA grows beyond the initial 7 species and animation needs multiply, Spine becomes worth the investment. Spine Essential at $69 covers runtime animation blending (smooth transitions between idle/attack/hit states) and a skins system that would let all mutation overlays animate with a single rig. This is a Phase 2 purchase decision, not needed for initial production.

### 4.2 Animation States per Asset Type

**Base Character Sprites (front + back):**

| State | Frames | FPS | Loop | Notes |
|-------|--------|-----|------|-------|
| Idle | 4-6 | 8 | Yes | Subtle breathing/movement. This is what the player sees 80% of the time. |
| Attack | 4-6 | 12 | No | Plays once on move execution. Snappy, impactful. |
| Hit | 3-4 | 10 | No | Recoil/flinch reaction. Quick. |
| KO | 4-6 | 8 | No | Collapse/defeat. Dramatic, plays once at fight end. |
| Win | 3-4 | 8 | No | Victory pose. Brief, satisfying. |

**Mutation Overlays:**
| State | Frames | FPS | Loop | Notes |
|-------|--------|-----|------|-------|
| Idle | 2-4 | 6 | Yes | Ambient pulsing/glow. Must sync with base character's idle. |
| Activate | 3-4 | 12 | No | Plays when the mutation's move is selected. |
| Destroyed | 4-6 | 10 | No | Shattering effect. Pieces fly outward. Critical gameplay moment. |

**VFX / Tech Glows:**
| State | Frames | FPS | Loop | Notes |
|-------|--------|-----|------|-------|
| Burst | 4-8 | 12 | No | Attack effect. Plays once over the target. |

**Arenas:**
No frame animation. Arenas use code-driven Pixi.js effects (parallax scrolling, ambient particle emitters for fog/sparks/lava).

### 4.3 Aseprite Animation Workflow

1. Open the processed sprite PNG as frame 1
2. Duplicate frame, make incremental edits for frame 2
3. Use onion skinning (Aseprite's key feature) to see previous/next frames while drawing
4. Tag each animation state (idle, attack, hit, ko, win) with Aseprite's frame tag system
5. Export as spritesheet: `File → Export Sprite Sheet`

**Export settings:**
- Sheet type: Packed (minimizes texture atlas size)
- Constraints: Fixed columns matching the longest animation (e.g., 6 columns if longest state is 6 frames)
- Output: PNG spritesheet + JSON data file (Pixi.js reads this natively)
- Border padding: 1px (prevents texture bleeding at edges)
- Inner padding: 0px
- Trim: Enabled (removes empty space per frame)

**Naming convention for exported sheets:**
```
SPR_cyberGorilla_front_sheet.png     — spritesheet image
SPR_cyberGorilla_front_sheet.json    — frame data (Aseprite JSON hash format)
```

### 4.4 Mutation Destruction Animation

This deserves special attention because it's a key gameplay moment. When a mutation's HP hits 0:

1. The mutation overlay plays its "destroyed" animation (shattering outward)
2. Particle effects spawn at the mutation's slot position (debris, sparks)
3. A brief screen flash emphasizes the impact
4. The mutation sprite is removed from the character's composition

The destruction animation is created in Aseprite as part of each mutation overlay's spritesheet. The particle effects are handled in code via Pixi.js particle emitters (no additional art assets needed — reuse the mutation's colors for the particles).

### 4.5 Quality Gate: Animation

- All states play at correct FPS without visual hitches
- Idle loop is seamless (frame 1 matches final frame)
- Attack animations have clear anticipation → action → recovery arc
- Mutation overlays animate in sync with base character (same idle rhythm)
- Spritesheets have no frame bleeding at edges
- JSON data files load correctly in Pixi.js (test with `PIXI.AnimatedSprite.fromFrames()`)

---

## Phase 5: Integration

### 5.1 Pixi.js Asset Loading

All processed sprites and spritesheets load through Pixi.js's built-in asset system:

```javascript
// Texture loading for static sprites
const texture = PIXI.Texture.from('assets/sprites/SPR_cyberGorilla_front.png');
const sprite = new PIXI.Sprite(texture);
sprite.anchor.set(0.5, 1.0); // Bottom-center anchor for fighting game perspective

// Spritesheet loading for animated sprites
const sheet = await PIXI.Assets.load('assets/sprites/SPR_cyberGorilla_front_sheet.json');
const idleFrames = sheet.animations['idle']; // Reads Aseprite tags from JSON
const animSprite = new PIXI.AnimatedSprite(idleFrames);
animSprite.animationSpeed = 0.15;
animSprite.play();
```

### 5.2 The Slot Composition System

AMA's modular sprite system composites base characters with mutation overlays at runtime. This is the technical core that makes the mutation economy visual.

**Architecture:**
```
CharacterComposite (PIXI.Container)
├── baseSprite (PIXI.AnimatedSprite)          — The base character
├── slotOverlays (Map<SlotID, PIXI.Sprite>)   — Mutation attachments
│   ├── rightArm: MUT_power_slam_rightArm.png
│   ├── head: MUT_psychic_echo_head.png
│   └── back: MUT_counter_shell_back.png
└── vfxLayer (PIXI.Container)                  — Tech glows, attack effects
```

**Slot positions** are defined per character as pixel offsets from the base sprite's anchor:

```javascript
const SLOT_OFFSETS = {
  cyberGorilla: {
    rightArm: { x: 32, y: -48 },
    leftArm:  { x: -32, y: -48 },
    head:     { x: 0, y: -72 },
    chest:    { x: 0, y: -40 },
    back:     { x: 0, y: -44 },
    legs:     { x: 0, y: -12 }
  }
  // ... per species
};
```

When a mutation is grafted, its overlay sprite is positioned at the corresponding slot offset and added to the character's container. When destroyed, it plays its destruction animation and is removed.

### 5.3 State-Driven Rendering for Combat

The targetable mutation combat system requires specific visual states:

**Mutation HP display:**
```
State: HIDDEN (fog of war)    → Show "???" overlay
State: REVEALED (hit once)    → Show HP bar above mutation slot
State: LOW_HP (below 50%)     → Mutation sprite flickers/pulses red
State: DESTROYED (HP = 0)     → Play destruction animation, remove sprite
```

**Target selection UI:**
When the player enters target select (click 2 in the two-click turn structure), each targetable mutation slot gets a highlight/outline:
- Default: subtle pulsing outline
- Hovered: bright outline + info popup (mutation name, HP, weakness)
- Selected: crosshair lock indicator

These highlights are drawn programmatically in Pixi.js (Graphics objects), not additional art assets.

### 5.4 VFX Integration

Tech glow overlays and attack effects use Pixi.js blend modes for compositing:

```javascript
// Attack VFX — additive blending for glow effects
const vfx = new PIXI.Sprite(PIXI.Texture.from('VFX_power_glow.png'));
vfx.blendMode = PIXI.BLEND_MODES.ADD;  // Dark pixels become transparent
vfx.alpha = 0.8;
```

This is why VFX assets skip background removal in processing — the additive blend mode naturally makes dark/black pixels invisible, preserving glow gradients without alpha channel artifacts.

### 5.5 Arena Rendering

Arenas are full-width background images with optional parallax layers:

```javascript
// Simple arena background
const arena = new PIXI.Sprite(PIXI.Texture.from('BG_toxic_hive.png'));
arena.width = GAME_WIDTH;   // 1280
arena.height = GAME_HEIGHT; // 720

// Ambient effects via particle emitters (no art assets needed)
const fogEmitter = new PIXI.ParticleContainer();
// Code-driven particles using simple circles/gradients
```

### 5.6 Quality Gate: Integration

- All assets load without errors in Pixi.js dev build
- Character composites render correctly with 0, 1, 2, and 3 mutation overlays simultaneously
- Mutation overlays position correctly at all slot offsets
- VFX blend modes produce expected visual results
- Animation state transitions are smooth (idle → attack → idle)
- Target selection highlights appear at correct positions
- Destruction animations play completely before sprite removal
- No texture bleeding or visual artifacts at sprite edges
- Performance: stable 60fps with full battle scene (2 characters, up to 6 mutation overlays, VFX layer, arena background)

---

## Phase 6: Polish

### 6.1 Visual Consistency Pass

After all assets are integrated, a full consistency review:

- **Color audit:** Do all species respect their defined palettes? Do mutation overlays from one species look wrong on another species' base character?
- **Scale audit:** Are all sprites proportionally correct? A mutation overlay shouldn't dwarf the character it attaches to.
- **Readability audit:** At actual game resolution (1280x720), can the player identify every character, mutation, and UI element without confusion?
- **Style audit:** Do any assets feel visually disconnected from the rest? (This catches Midjourney generations that technically matched the prompt but have a different "feel")

### 6.2 Performance Profiling

Profile the Pixi.js renderer with a worst-case battle scene:
- 2 characters with maximum mutation overlays (3 each = 6 overlays)
- All overlays animating (idle loops)
- VFX active (attack effect playing)
- Arena background + ambient particles

Target: Stable 60fps on mid-range hardware. If the frame drops, the optimization priority is: reduce particle count → reduce overlay animation framerate → compress textures.

Texture memory budget: All battle assets combined should fit within 64MB of GPU texture memory. At 128px sprites with 32-color palettes, individual sprites are 5-15KB each. Even with spritesheets, the full battle scene should use under 2MB of texture data.

### 6.3 Accessibility Considerations

Following the industry standard that accessibility is a baseline requirement:

- **Color-blind support:** Mutation weaknesses and move types are identified by icons/shapes in addition to color. The type badges (Section 7 of manifest) serve this function.
- **High contrast mode:** UI elements (HP bars, stamina bar) have border outlines that remain visible against any arena background.
- **Scalable UI:** Resource bars and type badges render at consistent screen-relative sizes regardless of game resolution.

---

## Tool Stack Summary

| Tool | Cost | Role in Pipeline |
|------|------|-----------------|
| **Midjourney v6.1** | $10-30/mo subscription | Phase 2: AI generation of all base art |
| **Aseprite** | $19.99 one-time | Phase 3: Manual cleanup. Phase 4: All animation work. |
| **Python + Pillow** | Free | Phase 3: Automated sprite processing pipeline |
| **Pixi.js 8** | Free | Phase 5-6: Runtime rendering, composition, animation |
| **Git** | Free | Version control for all processed assets and code |
| **Spine Essential** | $69 one-time | Phase 4 (future): Skeletal animation if needed at scale |

**Total one-time cost: $19.99 (Aseprite) + $69 (Spine Essential) = $88.99**
**Recurring cost: Midjourney subscription during active generation phases only**

### Tool Roles Clarified

**Midjourney** is the concept artist. It generates raw source art that would traditionally require a human illustrator. The `--sref` system provides the style consistency that would normally require an art director reviewing every asset.

**The sprite pipeline script** is the technical artist. It handles the mechanical processing work (background removal, cropping, downscaling, palette reduction) that would traditionally require hours of Photoshop batch actions.

**Aseprite** is the animator and cleanup artist. It handles the creative work that requires human judgment — fixing edge artifacts, crafting animation frames, ensuring visual quality at the pixel level.

**Pixi.js** is the engine. It composites everything at runtime, handling the slot system, blend modes, animation playback, and rendering.

---

## Version Control Strategy

Following industry practice (adapted from Perforce/Git LFS patterns for a solo developer):

**Git repository structure:**
```
ama-game/
├── assets/
│   ├── raw/            ← Git LFS tracked (large Midjourney PNGs)
│   └── processed/      ← Git tracked (small, game-ready PNGs)
├── tools/
│   └── process_sprite.py
├── src/                ← Game code
└── .gitattributes      ← LFS rules for raw/ directory
```

**Rules:**
- `raw/` files are tracked with Git LFS (large binary files, rarely change after generation)
- `processed/` files are regular Git (small, change more frequently during polish)
- Every processing run is documented: which raw file, which parameters, which output
- Processed files can always be regenerated from raw files + the processing script

---

## Production Timeline Estimate

For a solo developer working 4-6 hours/day on art:

| Phase | Duration | Notes |
|-------|----------|-------|
| Pre-production (Phase 1) | Done | Manifest and style locked |
| Generation (Phase 2) | 1-2 days | 54 prompts, selection, upscaling |
| Processing (Phase 3) | 1 day | Batch processing + manual cleanup of ~10 problem assets |
| Animation (Phase 4) | 5-7 days | ~15-30 frames per character × 7 characters + overlays |
| Integration (Phase 5) | 2-3 days | Slot system, state rendering, VFX |
| Polish (Phase 6) | 2-3 days | Consistency pass, performance, accessibility |
| **Total** | **~2-3 weeks** | For all 54 assets, animated and integrated |

This timeline assumes Midjourney generates usable results on first or second attempt for most assets. Budget an extra week for re-generation and iteration on problem assets (complex compositions like arenas and boss VFX tend to need more attempts).

---

## Appendix A: Asset Checklist by Production Phase

Use this to track each asset through the pipeline:

```
[ ] RAW — Midjourney generated and exported
[ ] SELECT — Best variation chosen and upscaled
[ ] PROCESS — Pipeline script run, transparent PNG produced
[ ] CLEANUP — Manual Aseprite touch-up (if needed, mark N/A if clean)
[ ] ANIMATE — All animation states created, spritesheet exported
[ ] INTEGRATE — Loaded in Pixi.js, positioned correctly
[ ] POLISH — Passed visual consistency review
```

## Appendix B: Mutation Slot Map (Visual Reference)

This maps directly to the targetable mutation combat system. Each slot has a defined position on the character body and accepts one mutation overlay.

```
           [HEAD]
      ┌──────┼──────┐
[L ARM]   [CHEST]   [R ARM]
      └──────┼──────┘
           [LEGS]
      ┌──────┼──────┐
          [BACK]

6 slots per character.
Each slot either has a mutation overlay or is empty (base body part).
Only mutated slots are targetable in combat.
```

## Appendix C: Color Palette Reference

| Species | Primary | Accent | Hex Values |
|---------|---------|--------|------------|
| Cyber Gorilla | Steel gray | Electric blue | #708090, #00BFFF |
| Psycho Squid | Deep purple | Toxic green | #4B0082, #39FF14 |
| Queen Bee | Amber yellow | Black | #FFBF00, #1A1A1A |
| Terror Pin Turtle | Forest green | Rust orange | #228B22, #B7410E |
| Echomorph | Silver | Shifting rainbow | #C0C0C0, varies |
| Hydravine | Dark teal | Glowing pink | #008080, #FF69B4 |
| Parasitex | Blood red | Bone white | #8B0000, #FFFDD0 |

| Move Type | Color | Hex |
|-----------|-------|-----|
| Power | Red | #DC2626 |
| Fast | Gold | #CA8A04 |
| Evasion | Cyan | #06B6D4 |
| Defense | Blue | #2563EB |
| Psychic | Purple | #7C3AED |
| Area | Orange | #EA580C |
| Grab | Green | #16A34A |
| Finisher | Amber | #D97706 |
