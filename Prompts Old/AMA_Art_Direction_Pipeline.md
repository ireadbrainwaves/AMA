# AMA: ART DIRECTION & VISUAL PIPELINE

**16-bit pixel art + Midjourney generation + modular mutation sprites**
**Everything you need to go from placeholder rectangles to premium pixel art**

---

## Art Direction Summary

**Style:** 16-bit pixel art with modern lighting and effects. Think SNES-era sprite detail with contemporary post-processing (dynamic shadows, glow effects, particle systems). Characters are detailed enough to read at a glance but small enough that a solo dev can manage the asset count.

**Tone:** Sci-fi colosseum. Neon-lit alien arenas floating in space. Dark backgrounds with vibrant character colors. Goofy body horror — your Frankenstein alien should look ridiculous AND cool simultaneously. The visual identity is "what if a SNES fighting game was set in a galaxy-brain alien tournament."

**Resolution target:** Characters at 64x64 or 96x96 pixels. Overworld tiles at 32x32. This is big enough for mutation detail but small enough to produce quickly.

**Color palette:** Limited per character (8-12 colors each) for pixel art consistency. Each species has a signature color:
- Cyber Gorilla: steel gray + electric blue
- Psycho Squid: deep purple + toxic green
- Bee Swarm: amber yellow + black
- Terror Pin Turtle: forest green + rust orange
- Echomorph: silver + shifting rainbow
- Hydravine: dark teal + glowing pink
- Parasitex: blood red + bone white

---

## Modular Sprite System

This is the core technical approach that makes visual mutations work without needing hundreds of unique sprite combinations.

### How It Works

Each character has a **base sprite** (the core body) and **attachment slots** where mutation parts layer on top. The game composites the final character in real-time.

```
ATTACHMENT SLOTS:
┌─────────────────────────┐
│        [HEAD SLOT]       │
│     ┌──┤ BASE ├──┐      │
│ [LEFT   │ BODY │  RIGHT] │
│  ARM]   │      │  [ARM]  │
│     └──┤      ├──┘      │
│        │ LEGS │         │
│    [BACK│      │[CHEST]  │
│    SLOT]└──────┘[PLATE]  │
└─────────────────────────┘
```

**Slots:**
- Left Arm (replaces base left arm sprite)
- Right Arm (replaces base right arm sprite)
- Back (wings, shells, tentacles extending from spine)
- Chest (armor plates, carapace, energy cores)
- Head (neural implants, extra eyes, antenna)
- Legs (replaced lower body, tail additions)

### Sprite Layers (render order, back to front)
1. Back slot (wings, shell, etc.)
2. Base body
3. Chest plate overlay
4. Left arm overlay
5. Right arm overlay
6. Head overlay
7. Tech glow effects (additive blend)

### What This Means For Production

**Without modular system:** 4 base characters × every possible mutation combination = potentially hundreds of unique sprites. Impossible for solo dev.

**With modular system:** 4 base body sprites + ~20 mutation attachment sprites + ~15 tech upgrade glow overlays = approximately 40 total sprite assets. Very doable.

Each mutation sprite is generated once and works on ANY base character because they attach to standardized slots. Gorilla tentacle arm is the same sprite whether it's on a gorilla body or a turtle body.

---

## Midjourney Prompt Templates

Use these templates to generate consistent pixel art assets. The key is maintaining style consistency across all assets.

### Base Character Prompts

```
GORILLA BASE:
16-bit pixel art character sprite, side view, cybernetic gorilla alien,
muscular build, steel gray body with electric blue accents, standing
fighting pose, 64x64 pixel resolution, SNES style, black background,
clean edges, limited color palette, game asset, transparent background
--ar 1:1 --style raw --v 6.1

SQUID BASE:
16-bit pixel art character sprite, side view, psychic alien squid
humanoid, purple body with toxic green bioluminescent spots, tentacle
arms, floating pose, 64x64 pixel resolution, SNES style, black
background, clean edges, limited color palette, game asset
--ar 1:1 --style raw --v 6.1

BEE SWARM BASE:
16-bit pixel art character sprite, side view, alien bee swarm entity,
amber yellow and black, cloud-like body made of small bee units,
buzzing pose, 64x64 pixel resolution, SNES style, black background,
clean edges, limited color palette, game asset
--ar 1:1 --style raw --v 6.1

TURTLE BASE:
16-bit pixel art character sprite, side view, armored alien turtle,
massive shell, forest green and rust orange, defensive stance, 64x64
pixel resolution, SNES style, black background, clean edges, limited
color palette, game asset
--ar 1:1 --style raw --v 6.1
```

### Mutation Part Prompts

```
TENTACLE ARM:
16-bit pixel art sprite, alien tentacle arm, purple with green suckers,
side view, isolated body part on transparent background, game asset,
64x64, SNES style, clean edges --ar 1:1 --style raw --v 6.1

CHITIN ARM PLATES:
16-bit pixel art sprite, insectoid chitin armor plates for arm,
dark brown exoskeleton with red accents, side view, isolated part,
game asset, 64x64, SNES style --ar 1:1 --style raw --v 6.1

BEE WINGS:
16-bit pixel art sprite, translucent alien insect wings pair,
amber glow, back attachment, isolated part on transparent background,
game asset, 64x64, SNES style --ar 1:1 --style raw --v 6.1

TURTLE SHELL PLATE:
16-bit pixel art sprite, armored chest plate from alien turtle shell,
green and rust, front view chest attachment, isolated part, game asset,
64x64, SNES style --ar 1:1 --style raw --v 6.1

NEURAL IMPLANT:
16-bit pixel art sprite, cybernetic brain implant on head, glowing
blue circuits, sci-fi tech, isolated head attachment, game asset,
64x64, SNES style --ar 1:1 --style raw --v 6.1
```

### Tech Upgrade Glow Overlays

```
ROCKET FIST GLOW:
16-bit pixel art sprite, energy glow effect around a fist, orange
and yellow flame trail, isolated effect overlay, transparent background,
game asset, 64x64, SNES style --ar 1:1 --style raw --v 6.1

PLASMA COATING:
16-bit pixel art sprite, electric blue plasma energy aura around
arm, crackling lightning, isolated glow overlay, transparent background,
game asset, 64x64, SNES style --ar 1:1 --style raw --v 6.1

SHOCK PLATING SPARKS:
16-bit pixel art sprite, electric sparks around chest armor, yellow
lightning crackle effect, isolated overlay, transparent background,
game asset, 64x64, SNES style --ar 1:1 --style raw --v 6.1
```

### Arena Background Prompts

```
TOXIC HIVE:
16-bit pixel art game background, alien beehive arena, dripping amber
honey walls, hexagonal structures, toxic green fog, neon lighting,
dark atmospheric, SNES style, 960x640, wide shot, parallax layers
--ar 3:2 --style raw --v 6.1

PSIONIC REEF:
16-bit pixel art game background, underwater alien coral arena,
bioluminescent purple and blue, floating psychic energy orbs, deep
ocean feel, dark atmospheric, SNES style, 960x640, parallax layers
--ar 3:2 --style raw --v 6.1

DEEP TRENCH:
16-bit pixel art game background, deep sea trench arena, crushing
darkness, sparse bioluminescent spots, massive stone walls, oppressive
atmosphere, SNES style, 960x640, parallax layers
--ar 3:2 --style raw --v 6.1

VOLCANIC PIT:
16-bit pixel art game background, volcanic alien arena, lava flows,
obsidian platforms, red and orange glow, heat shimmer, dark atmospheric,
SNES style, 960x640, parallax layers
--ar 3:2 --style raw --v 6.1

GRAVITY WELL:
16-bit pixel art game background, zero gravity arena in space,
floating rock platforms, distant nebula, purple and black, star field,
cosmic scale, SNES style, 960x640, parallax layers
--ar 3:2 --style raw --v 6.1
```

### Hub World Prompts

```
COLOSSEUM HUB:
16-bit pixel art game tileset, alien tournament colosseum interior,
dark purple stone floors, glowing cyan wall panels, neon arena lights,
sci-fi architecture, top-down perspective, SNES style, tile-based
--ar 3:2 --style raw --v 6.1

NPC - COMMANDER VEX:
16-bit pixel art character sprite, alien military commander, stern
but fair, dark green uniform with gold insignia, standing at attention,
top-down RPG perspective, 32x32, SNES style, game asset
--ar 1:1 --style raw --v 6.1

NPC - DR. HELIX:
16-bit pixel art character sprite, mad alien scientist doctor,
excited expression, lab coat covered in stains, multiple tool arms,
slightly unhinged look, top-down RPG perspective, 32x32, SNES style
--ar 1:1 --style raw --v 6.1
```

---

## Post-Processing in Midjourney

Midjourney won't give you perfect game-ready sprites. Here's the cleanup pipeline:

### Step 1: Generate in Midjourney
- Run the prompt, pick the best of 4 outputs
- Upscale your choice (U1-U4)

### Step 2: Clean Up in Aseprite or Photoshop
- Import the upscaled image
- Downscale to exact pixel resolution (64x64 or 32x32) using nearest-neighbor scaling (NO anti-aliasing)
- Clean up any blurry or inconsistent pixels
- Ensure transparent background (remove black background if needed)
- Verify limited color palette (reduce colors if Midjourney went wild)
- Fix any anatomical weirdness (Midjourney sometimes adds extra limbs — ironic for this game)

### Step 3: Animate
- Each character needs basic animation frames:
  - Idle (2-4 frames, subtle bounce/breathing)
  - Attack (3-4 frames per move type, or 1 universal attack animation)
  - Hit/damaged (2 frames, flinch)
  - Defeat (3-4 frames, collapse)
  - Victory (3-4 frames, celebration)
- For MVP: idle + one attack + hit is enough (3 animations × ~3 frames = 9 frames per character)
- Animate in Aseprite by hand — modify the Midjourney base frame

### Step 4: Export as Sprite Sheet
- Export animation frames as a horizontal sprite sheet PNG
- Load in PixiJS with AnimatedSprite or frame-by-frame rendering

---

## Animation Priority List

Not all animations are equal. Here's what to invest in:

### MUST HAVE (ship-blocking)
1. **Simultaneous reveal moment** — both characters flash/pulse when moves are shown. This is THE moment. Even a simple scale-up + color flash sells it.
2. **Damage hit reaction** — character flinches, screen shake, damage number flies up. Without this, hits feel like nothing.
3. **Mutation destruction** — the mutation part visually breaks off the character with particle explosion. This is the most important unique animation in the game.
4. **Finisher cinematic** — 1-2 second special animation per finisher. Primal Rage fires a beam. Psychic Crush shatters the screen. These are the hype moments.

### SHOULD HAVE (polish)
5. **Idle breathing** — 2-frame subtle animation so characters feel alive during move selection.
6. **Mutation graft moment** — between fights, when you attach a new mutation, show it snapping onto your character. The "equip" moment.
7. **Stamina push visual** — energy aura builds around the attacker proportional to stamina committed. Big push = big aura.
8. **Arena card flip** — the environment card flips with a satisfying motion.

### NICE TO HAVE (post-launch)
9. Unique attack animations per move (currently can use one generic attack)
10. Walk cycle for overworld (can start with 2-frame shuffle)
11. Doctor surgery cutscene (showing the graft being attached)
12. Victory celebration per character
13. Crowd animation in arena background

---

## Implementation Prompt for PixiJS

```
Add a modular sprite rendering system for character visuals.

SPRITE SYSTEM:
Create src/rendering/CharacterRenderer.js that composites a character
from multiple sprite layers.

Each character has:
{
  baseSpriteSheet: 'assets/characters/gorilla_base.png',
  slots: {
    back: null,      // sprite path or null
    leftArm: null,
    rightArm: null,
    chest: null,
    head: null,
    legs: null
  },
  techGlows: []      // array of glow overlay sprite paths
}

When a mutation is grafted:
- Determine which slot it occupies (each mutation has a 'slot' property)
- Load the mutation sprite asset
- Update the character's slots object
- Re-composite the character display

Rendering order (back to front):
1. Back slot sprite (offset: centered behind body)
2. Base body sprite
3. Chest overlay (offset: centered on torso)
4. Left arm overlay (offset: left side of body)
5. Right arm overlay (offset: right side of body)
6. Head overlay (offset: top of body)
7. Tech glow effects (additive blend mode)

Each sprite layer should support:
- Position offset relative to base body center
- Flip horizontal (for facing direction)
- Tint color (for damage flash: red tint on hit)
- Alpha (for fade in/out on mutation graft/destroy)

FOR NOW: Use colored rectangles as placeholder sprites.
Each slot is a different colored rectangle that layers on the body.
This lets us test the compositing system before real art exists.
- Base body: character's primary color (gray for gorilla, etc.)
- Mutation slots: the source species color (purple for squid parts, etc.)
- Tech glows: semi-transparent yellow/blue overlays

When a mutation is destroyed mid-fight:
1. The mutation slot sprite plays a "shatter" effect:
   - Sprite breaks into 4-6 small rectangles
   - Rectangles fly outward with physics (gravity + random velocity)
   - Fade out over 0.5 seconds
2. The slot becomes empty (no sprite)
3. A "scar" icon appears as a small mark on that slot position

When a mutation is grafted (between fights):
1. New sprite slides in from the side
2. Snaps to the slot position with a flash
3. Brief glow pulse on attachment

BATTLE SCREEN CHARACTER DISPLAY:
- Characters are shown at 3-4x pixel scale (64x64 sprite displayed at
  192-256px on screen) for readability
- Side by side in the center area
- Both face each other
- Enough space between them for the reveal text and matchup display
- Resource bars directly below each character

This system means adding a new mutation to the game is just:
1. Generate the sprite in Midjourney
2. Clean up in Aseprite
3. Add it to the mutation data with a slot assignment
4. The renderer handles everything else
```

---

## Asset Count Estimate

### MVP Art Assets (what you need to ship)

**Characters (4 base × 3 animation states × ~3 frames):**
- 4 base character sprite sheets = 4 assets
- ~36 total frames of animation

**Mutations (8 mutation parts, one per slot variety):**
- 8 mutation overlay sprites = 8 assets
- Each needs idle + destruction frames = ~24 frames

**Tech Glows (5 varieties):**
- 5 glow overlay sprites = 5 assets

**Arenas (4 backgrounds):**
- 4 parallax background sets (2-3 layers each) = ~12 assets

**Hub World:**
- 1 tileset (floor, walls, doors, decorative) = ~20 tiles
- 3 NPC sprites (Vex, Helix, player top-down) = 3 assets

**UI:**
- Resource bar graphics = 4 assets
- Type badge icons = 8 assets
- Button/panel backgrounds = ~5 assets
- Arena card backs (4 colors) = 4 assets

**TOTAL: approximately 70-80 individual art assets**

With Midjourney generating the base + Aseprite cleanup, this is roughly:
- 2-3 hours of Midjourney generation (prompting, selecting, upscaling)
- 8-10 hours of Aseprite cleanup and animation
- 2-3 hours of integration into the game

**That's a long weekend of art production.** Not months. Not weeks. A weekend.

---

## Midjourney Workflow Tips

1. **Batch generate.** Run all character base prompts in one session so the style is consistent. Midjourney's style drifts between sessions.

2. **Use --seed for consistency.** Once you find a style you like, note the seed value and reuse it for all related assets.

3. **Generate at 2x then downscale.** Generate at 128x128 or 256x256, then downscale to 64x64 in Aseprite with nearest-neighbor. Gives you more detail to work with.

4. **Don't fight Midjourney's weirdness.** If it gives you a sixth finger or an extra eye, lean into it. These are aliens. Weird is good. Weird is the brand.

5. **Color correct after.** Midjourney often uses too many colors for pixel art. Reduce to 8-12 colors per character in Aseprite using the indexed color mode.

6. **Separate foreground from background.** Always generate characters on solid black or specified background, then remove it. Don't try to generate characters IN an environment.

7. **Reference sheet first.** Generate a "character design reference sheet, multiple poses, pixel art" version first to establish the look, then use that as a reference for the game sprite.

---

## Visual Progression Example

Here's what the player's character LOOKS like across a run:

**Start of run (Fight 1):**
Clean base gorilla. Steel gray body, electric blue cybernetic accents.
5 base moves on the menu.

**After Fight 1 (harvested squid tentacle):**
Gorilla body + purple tentacle replacing right arm.
The tentacle is clearly a different color/style from the base body.
6 moves on menu. Character looks slightly weird.

**After Fight 2 (harvested bee wings + tech upgrade on tentacle):**
Gorilla body + purple tentacle (now with blue plasma glow from tech) + amber bee wings on back.
7 moves on menu. Character looks like a science experiment.

**After Fight 3 (harvested turtle shell + doctor mutation):**
Gorilla body + glowing plasma tentacle + bee wings + green turtle chest plate + custom doctor mutation (neural implant on head).
8-9 moves on menu. Character is an abomination. Player loves it.

**Final boss fight:**
This grotesque cyborg alien hybrid waddles into the arena with
mismatched body parts glowing different colors, and the crowd goes
wild because nobody has ever seen anything like this thing before.

THAT is the visual identity of AMA. Every run produces a unique
monster that the player built themselves.
