# AMA: Scenario.gg Art Production Guide

**How to get consistent, game-ready pixel art from Scenario for every asset type.**

---

## The Three Tools You Need in Scenario

Scenario has specialized pixel art models built in — the **Retro Diffusion** family. These are purpose-built for game pixel art and should be your primary generators. Don't fight generic models into pixel art when purpose-built ones exist.

### 1. Retro Diffusion Plus (RD Plus)
**Use for:** Character sprites, portraits, standalone scenes, UI icons, NPC art, hero poses
- Trained at native 256×256 resolution — preserves crisp pixel placement without aliasing
- Supports palette control (upload a limited color image to restrict output colors)
- Background removal built in (transparent PNG output)
- Seamless tiling option for textures
- Accepts reference images with adjustable strength slider

### 2. Retro Diffusion Tile (RD Tile)
**Use for:** Hub overworld tileset, floor tiles, wall tiles, arena environments
- Generates single tiles, variations, or complete tilesets with smart transitions
- Dual-prompt blending: mix two materials (e.g., "metal floor" + "alien glow panels") into cohesive tile transitions
- Precise dimension control: set exact tile sizes (32×32 for overworld)
- Auto-seamless edges between adjacent tiles

### 3. Retro Diffusion Animation (RD Animation)
**Use for:** Idle animations, walk cycles, attack frames, VFX sprites
- Outputs sprite sheets (multiple frames in a grid), NOT single images
- Each style has specific frame sizes (32×32, 48×48, etc.)
- Dedicated styles for: walking cycles (4-direction), idle animations, VFX loops
- Accepts palette input and reference images
- Frames align with game engine conventions — import directly into PixiJS

---

## Custom Model Training (The Power Move)

This is Scenario's biggest advantage over Midjourney or generic AI. You train a model on YOUR art, and it reproduces your style consistently forever. For AMA, you should train TWO custom models:

### Style Model — "AMA Pixel Art"

Train this on 10-15 of your best Scenario generations that match AMA's aesthetic. This becomes your master style generator.

**Dataset requirements:**
- 10-15 high-quality images (more isn't better — quality and variety over quantity)
- All at 1024×1024 resolution minimum (Scenario auto-handles downscaling)
- Consistent art style across all images, but VARIED subjects (characters, environments, UI elements, items)
- Same color temperature, same pixel density, same lighting approach
- Different compositions (close-ups, full-body, environments, icons)

**Training settings:**
- Base model: Flux 2 (best prompt adherence and versatility)
- Epochs: 10 (default, works well for most datasets)
- Use Scenario's built-in epoch comparison — it generates test images at each epoch so you can pick the best checkpoint
- Add 4 test prompts during training to monitor progress:
  1. "cybernetic gorilla fighter, standing pose" (tests character generation)
  2. "dark sci-fi arena interior, neon lighting" (tests environment)
  3. "small UI icon, health potion, glowing" (tests small assets)
  4. "alien tentacle arm, isolated body part, transparent background" (tests modular parts)

**Captions are critical.** Scenario auto-captions your training images. Review and refine them — put the most important visual elements first in each caption. The AI prioritizes words earlier in captions.

### Character Models — One Per Species

After the style model works, train individual character models for each species. These ensure the Gorilla always looks like YOUR Gorilla across every generation.

**Per-character dataset:**
- 5-15 images of the same character
- Consistent features: proportions, color palette, signature details
- Varied poses: front, side, three-quarter, action poses
- Varied expressions if applicable
- Include both the overworld sprite scale AND the fight screen scale

**Key tip:** Use a unique trigger word in your captions like "ama_gorilla" or "ama_squid" — this helps the model associate the character with a specific token you can invoke in any prompt.

---

## Prompt Engineering for Scenario

### The Golden Rules

**1. Word order matters.** Scenario models prioritize elements mentioned earlier in the prompt. Put the most important thing first.

```
GOOD: "cybernetic gorilla, metal fist, fighting pose, pixel art, dark arena"
       ↑ subject first    ↑ key detail    ↑ pose     ↑ style   ↑ setting

BAD:  "dark arena with neon lights and a cybernetic gorilla standing there"
       ↑ setting first — gorilla is deprioritized
```

**2. Shorter prompts for custom models.** If you've trained a style model, you DON'T need to describe the style. The model already knows it. Focus on WHAT you want, not HOW it should look.

```
WITH CUSTOM MODEL: "gorilla fighter, metal right arm, jet vents, standing pose"
WITHOUT CUSTOM MODEL: "16-bit pixel art sprite, SNES style, cybernetic gorilla fighter, metal right arm with jet vents visible, standing fighting pose, steel gray body with electric blue cybernetic accents, limited color palette, 64x96 pixel resolution, black background, clean edges, game asset, transparent background"
```

**3. Build prompts progressively.** Start simple, evaluate, add detail. Don't write a paragraph on your first attempt.

```
Attempt 1: "gorilla fighter, standing"
→ Result: too generic, wrong style

Attempt 2: "gorilla fighter, cybernetic arm, standing pose, dark background"  
→ Result: closer, but proportions off

Attempt 3: "gorilla fighter, cybernetic right arm with jet vents, fighting stance, low angle, dark background"
→ Result: ✓ ship it
```

**4. Use Prompt Spark.** Scenario has a built-in prompt assistant that knows your model's training data. It can:
- Generate new prompts from scratch (influenced by your training captions)
- Rewrite short prompts into comprehensive ones
- Translate prompts from any language to English
- Generate prompts from uploaded reference images (image-to-prompt)

**5. Reinforce style when it drifts.** If your custom model occasionally produces realistic or wrong-style output, add style reinforcement at the start or end of your prompt:
```
"pixel art, [your subject description], retro game sprite style"
```

**6. Use Prompt Embeddings for auto-consistency.** In your model's Details page, set up a prompt embedding — a style description that automatically applies to every generation. You can auto-generate one or write your own. This eliminates the need to manually add style tokens to every prompt.

---

## Prompt Templates by Asset Type

### Species Sprites (Fight Screen — Front and Back)

These are your highest-priority assets. 64×96 pixel sprites at the Pokémon-style battle view scale.

```
GORILLA FRONT:
"cybernetic gorilla fighter, front facing, fighting stance, metal right arm with jet vents, steel gray body, electric blue cybernetic accents, imposing muscular build, full body visible, dark background"

GORILLA BACK:
"cybernetic gorilla fighter, rear view, fighting stance, metal right arm visible from behind, jet vents on forearm, broad shoulders, steel gray body, dark background"

SQUID FRONT:
"alien squid humanoid, front facing, eight tentacles visible, three glowing eye spots, deep purple body, toxic green bioluminescent markings, floating pose, menacing, dark background"

BEE SWARM FRONT:
"alien bee swarm entity, front facing, cloud of individual bee drones forming humanoid shape, amber yellow and black coloring, buzzing energy, multiple small glowing eyes, dark background"

TURTLE FRONT:
"armored alien turtle, front facing, massive shell visible, defensive stance, forest green body, rust orange shell accents, heavy and immovable, dark background"
```

### Boss Sprites

```
ECHOMORPH:
"featureless humanoid shapeshifter, semi-transparent body, liquid mercury sheen, smooth ovoid head with no face, faint glowing core in center of chest, silver-white color shifting to rainbow, standing neutral pose, dark background"

HYDRAVINE:
"plant-animal hybrid, tangled mass of dark green-black vines, bioluminescent pink-orange veins pulsing through body, central glowing root core visible, vine tendrils extending outward, coiled mass shape, dark background"

PARASITEX:
"horrifying chimera parasite, hunched insectoid frame, mismatched body parts from multiple species, one gorilla-like arm, squid eye cluster on head, vine tendrils through carapace, dark red-maroon exoskeleton, bone white joints, chaotic asymmetric design, dark background"
```

### Mutation Overlay Sprites (Modular Parts)

Generate these as ISOLATED body parts on transparent backgrounds. They layer on top of base species sprites.

```
GORILLA ARM GRAFT (Arms slot):
"cybernetic gorilla arm, isolated limb, side view, thick muscular forearm, steel gray with blue accents, hydraulic joints visible, transparent background, game asset sprite"

SQUID TENTACLE GRAFT (Arms slot):
"alien tentacle arm, isolated limb, side view, purple with green suckers, neural fiber glow at tip, flexible organic, transparent background, game asset sprite"

TURTLE SHELL GRAFT (Torso slot):
"alien turtle shell armor plate, isolated chest piece, front view, forest green with rust orange accents, biocite texture, thick and heavy looking, transparent background, game asset sprite"

BEE WING GRAFT (Legs slot / Back slot):
"alien insect wing cluster, isolated attachment, amber translucent wings with black veining, small thruster nodes at tips, transparent background, game asset sprite"

ROCKET FIST (Arms slot — tech enhanced):
"cybernetic metal fist, isolated arm piece, side view, titanium plating, jet vent housings on forearm and knuckles, cyan energy glow from vents, gunmetal gray, transparent background, game asset sprite"
```

### NPC Portraits

For dialogue boxes and hub interactions:

```
COMMANDER VEX:
"alien military commander portrait, stern expression, dark green uniform with gold insignia, scarred face, cybernetic jaw implant, weathered and experienced, authoritative bearing, close-up bust shot, dark background"

DR. HELIX:
"alien squid scientist portrait, excited manic expression, lab coat with biological stains, multiple tool-holding tentacles, three glowing eyes wide with enthusiasm, slightly unhinged energy, close-up bust shot, dark background"

RK-7 ARK:
"autonomous robot merchant portrait, no face just a sensor array and speaker grille, utilitarian metal body, tool attachments on arms, workshop grime on chassis, small price tag display on chest, merchant booth visible behind, close-up bust shot, dark background"
```

### Hub Tileset (32×32 tiles)

Use **RD Tile** for these:

```
FLOOR TILE:
"dark sci-fi metal floor panel, worn industrial, dark purple-gray, subtle grid lines, overhead neon reflection, top-down perspective"

WALL TILE:
"sci-fi corridor wall panel, glowing cyan accent strip, dark metal, alien architecture, top-down perspective, solid impassable surface"

ARENA DOOR TILE:
"sci-fi arena entrance, glowing red energy field doorway, metal frame, warning markers, top-down perspective, ominous"

NPC ALCOVE TILE:
"recessed wall alcove, dim interior lighting, workbench or equipment visible, sci-fi interior, top-down perspective"
```

### UI Elements

Use **RD Plus** at small dimensions with background removal:

```
HEALTH BAR FRAME:
"sci-fi UI health bar frame, horizontal, dark metal border, inner glow space, minimal clean design, game HUD element, transparent background"

TYPE BADGE — POWER:
"small icon badge, clenched fist symbol, red-orange color, bold simple design, game UI element, transparent background"

TYPE BADGE — PSYCHIC:
"small icon badge, brain/eye symbol, purple glow, ethereal design, game UI element, transparent background"

TYPE BADGE — FAST:
"small icon badge, lightning bolt symbol, yellow-white, sharp clean design, game UI element, transparent background"

TYPE BADGE — GRAB:
"small icon badge, grasping hand/claw symbol, green color, aggressive design, game UI element, transparent background"
```

---

## Batch Production Workflow

### Session 1: Species Sprites (2-3 hours)
1. Open RD Plus or your custom style model
2. Set resolution to match your sprite size
3. Enable background removal
4. Upload your color palette image
5. Generate all 4 species FRONT sprites in one session (style consistency)
6. Generate all 4 species BACK sprites in same session
7. Generate 3 boss sprites
8. **Total: ~11 base sprites**

### Session 2: Mutation Overlays (2-3 hours)
1. Same model, same session for consistency
2. Generate 4 mutation parts per slot category:
   - 4 head mutations (Gorilla/Squid/Bee/Turtle origin)
   - 4 arm mutations
   - 4 torso mutations
   - 4 leg mutations
3. Generate the Rocket Fist arm overlay
4. Generate 3-4 tech glow overlays (recolorable in code)
5. **Total: ~20 modular sprites**

### Session 3: Hub Tileset (1-2 hours)
1. Switch to RD Tile
2. Set to 32×32 dimensions
3. Generate floor tiles (3-4 variations)
4. Generate wall tiles (2-3 variations)
5. Generate arena door tiles (4 variations, one per arena)
6. Generate NPC alcove tiles
7. Generate decorative tiles (bracket display, item crates)
8. **Total: ~15-20 tiles**

### Session 4: NPC Portraits + UI (1-2 hours)
1. Back to RD Plus or custom model
2. Generate 3 NPC portraits (Vex, Helix, Ark)
3. Generate type badges (6 types)
4. Generate resource bar frames
5. Generate move menu frame
6. Generate misc UI elements (cursor, selection highlight, etc.)
7. **Total: ~15-20 UI assets**

### Session 5: Hero Pose / Marketing (1 hour)
1. Use RD Plus or custom model at higher resolution
2. Generate the Rocket Fist hero pose (multiple attempts, pick the best)
3. Generate species lineup for Steam capsule art
4. **Total: 2-5 hero images**

**Grand total: ~65-75 assets across 5 sessions (8-12 hours of generation)**

---

## Advanced Scenario Features for AMA

### Reference Images + Strength Slider
Upload an existing sprite as a reference and use the strength slider (0.0-1.0) to control how much it influences the output. Low strength (0.2-0.3) = loose inspiration. High strength (0.7-0.8) = close recreation with variations. Use this to generate mutation variants from a base sprite.

### Edit with Prompts
After generating a base sprite, use "Edit with Prompts" to make targeted changes without regenerating from scratch. Write instructions like "add metal plating to the right arm" or "change the color of the shell to dark green." Works with multiple AI models including Nano Banana (Gemini 2.5), Seedream, and Flux Kontext.

### Palette Control
Upload a small image containing ONLY the colors you want the AI to use. The model restricts its output to those exact colors. Critical for maintaining AMA's species color palettes:
- Gorilla: steel gray (#708090), electric blue (#00BFFF), dark metal (#2F4F4F), highlight white (#E0E0E0)
- Squid: deep purple (#4B0082), toxic green (#39FF14), dark body (#1C0033), glow accent (#00FF88)
- Bee: amber yellow (#FFB300), black (#1A1A1A), wing translucent (#FFC107), eye red (#FF3D00)
- Turtle: forest green (#228B22), rust orange (#CC5500), shell dark (#2D5016), bone highlight (#D2B48C)

### Video-to-Spritesheet Workflow
1. Generate a static character image
2. Use "Convert to Video" to animate it (e.g., "running cycle," "idle breathing")
3. Extract key frames from the video
4. Arrange frames into a sprite sheet using an external tool
5. Import into your game engine

This is Scenario's recommended workflow for creating animated sprites from static art.

### Multi-LoRA Composition
Combine multiple trained models at generation time. For example: your "AMA Style" model + a "Gorilla Character" model = style-consistent Gorilla sprites. Adjust the blend weight between models to control which aspects dominate.

---

## Common Pitfalls and Fixes

| Problem | Cause | Fix |
|---|---|---|
| Blurry / anti-aliased pixels | Generated above native resolution | Generate at 256×256 or below, use RD Plus which is trained for this |
| Style drifts between sessions | Generic model inconsistency | Train a custom style model. Use prompt embeddings. |
| Too many colors | Base model defaults to wide palette | Upload a strict palette image. Use RD Plus palette control. |
| Extra limbs / weird anatomy | AI hallucination | Lean into it (these are aliens). Or use Edit with Prompts to fix specific areas. |
| Mutation overlays don't match base | Different generation settings | Generate base + overlays in the same session with same model and palette |
| Output doesn't match my vision | Prompt too long or too vague | Shorter prompts for custom models. Use Prompt Spark to rewrite. |
| Model outputs realistic instead of pixel art | Strong real-world associations | Add style reinforcement: "pixel art, retro game sprite" at start of prompt |
| Inconsistent character across generations | No character model trained | Train a dedicated character model (5-15 images per character) |

---

## Quick Reference Card

```
SPRITES:        RD Plus or Custom Style Model → 64×96 → palette lock → transparent BG
TILES:          RD Tile → 32×32 → seamless tiling ON → dual-prompt for transitions
ANIMATIONS:     RD Animation → style-specific sizes → sprite sheet output
PORTRAITS:      RD Plus or Custom Model → larger resolution → background removal
UI ELEMENTS:    RD Plus → small dimensions → background removal → strict palette
HERO ART:       Custom Model → highest quality → multiple attempts → pick best

CUSTOM MODEL:   10-15 images → Flux 2 base → 10 epochs → 4 test prompts → compare epochs
PALETTE:        Upload a small image of ONLY your target colors
PROMPT ORDER:   Subject first → key details → pose → style reinforcement (if needed)
CONSISTENCY:    Same model + same palette + same session = consistent batch
```
