# AMA: Alien Martial Arts — Character Sprite Design System

## Art Direction

**Style**: Retro pixel art (Retro Diffusion Plus on Scenario.com)
**Palette**: Dark sci-fi, neon accents — matches the existing arena/hub art
**Canvas**: 960x540 fight screen, characters at scale 2.5x
**Base sprite size**: 48x64 pixels (renders as 120x160 on canvas)
**Background**: Transparent (PNG alpha) — characters overlay on arena canvas
**View**: Front-facing idle pose (opponent is flipped horizontally in-engine)

---

## Sprite Asset Structure

Each character needs:

```
src/assets/sprites/
  {species}/
    base_front.png          # 48x64, idle front pose, transparent bg
    base_back.png           # 48x64, idle back pose (player chars only)
    mut_{slot}.png           # ~24x24 overlay per mutation slot
    fx_attack.png            # 48x64, attack pose (stretch goal)
    fx_hit.png               # 48x64, hit/recoil pose (stretch goal)
```

### Mutation Overlay Slots (relative to base sprite center)

| Slot      | Position     | Size   | Description                        |
|-----------|-------------|--------|------------------------------------|
| head      | top-center  | ~20x16 | Helmets, crowns, crests, nodes     |
| chest     | center      | ~24x20 | Armor plates, membrane, carapace   |
| leftArm   | left-mid    | ~16x20 | Grafts, gauntlets, tendrils        |
| rightArm  | right-mid   | ~16x20 | Grafts, gauntlets, tendrils        |
| back      | behind-center| ~20x20| Wings, shells, spines, packs      |
| legs      | bottom      | ~24x16 | Boots, roots, anchors, thrusters   |

---

## Character Visual Identities

### 1. CYBER GORILLA — Heavy Hitter
- **Color**: `#ff6b35` (burnt orange / cyber-orange)
- **Silhouette**: Massive, wide shoulders, hunched forward, huge fists. Largest character.
- **Key features**: Cybernetic left arm (glowing cyan fist), heavy brow ridge, metallic chest plate, thick legs, small eyes with orange glow
- **Personality in pose**: Aggressive lean forward, fists clenched, ready to pound
- **Neon accents**: Cyan circuitry lines on cyber arm, orange eye glow
- **Mutations visual language**:
  - *Iron Knuckles (arms)*: Oversized chrome gauntlets with orange energy vents
  - *Thick Skull (head)*: Reinforced metal dome with impact plates
  - *Barrel Chest (chest)*: Expanded ribcage plating, glowing core behind armor
  - *Ground Stomp (legs)*: Piston-driven boots with seismic stabilizers

### 2. PSYCHO SQUID — Mentalist
- **Color**: `#8b5cf6` (deep violet / psychic purple)
- **Silhouette**: Tall, lanky, alien. Elongated head, multiple tentacle-arms hanging down. Unsettling.
- **Key features**: Bulbous head with glowing green eyes, exposed brain pattern, 4-6 tentacle arms (thinner at tips), translucent skin showing inner glow, dripping slime
- **Personality in pose**: Floating/hovering slightly, tentacles relaxed but ready to grab, head tilted with eerie calm
- **Neon accents**: Green eye glow, purple bioluminescent veins, magenta tentacle tips
- **Mutations visual language**:
  - *Tentacle Graft (arms)*: Extra thick tentacles with suction cups, glowing tips
  - *Psionic Lobe (head)*: Swollen cranium with visible pulsing energy patterns
  - *Chromatophore Skin (chest)*: Shifting color patches on torso, iridescent overlay
  - *Jet Siphon (legs)*: Water-jet propulsion tubes replacing lower tentacles

### 3. BEE SWARM — Attrition
- **Color**: `#ca8a04` (golden amber / toxic yellow)
- **Silhouette**: Humanoid insectoid, medium build. Segmented armor, compound eyes, small wings on back. Spiny.
- **Key features**: Large compound eyes (faceted, red-green), mandibles, segmented yellow-black exoskeleton, 2 small translucent wings, stinger tail, sharp angular limbs
- **Personality in pose**: Alert stance, arms slightly raised with open claws, wings buzzing (motion blur lines)
- **Neon accents**: Green compound eye glow, golden energy between armor segments
- **Mutations visual language**:
  - *Stinger Arms (arms)*: Long needle-like stingers extending from forearms, dripping venom (green)
  - *Hive Mind Node (head)*: Crown-like antenna array, pulsing neural connections
  - *Honeycomb Plating (chest)*: Hexagonal armor tiles with amber resin fill
  - *Wing Cluster (legs)*: Additional wing pairs at hip level, hover capability

### 4. TERROR PIN TURTLE — Fortress
- **Color**: `#14b8a6` (deep teal / ocean green)
- **Silhouette**: Short, wide, VERY heavy. Massive shell on back, short thick arms and legs. Tank-like.
- **Key features**: Domed shell with spikes/barnacles, scarred snapping jaw, small fierce eyes, thick limbs with clawed feet, barnacle textures
- **Personality in pose**: Low center of gravity, arms out in blocking position, jaw slightly open showing teeth, unmovable
- **Neon accents**: Teal glow in shell cracks, bioluminescent barnacles, cyan eye dots
- **Mutations visual language**:
  - *Shell Gauntlets (arms)*: Arm-shields made from shell fragments, spiked knuckles
  - *Iron Dome (head)*: Reinforced dome helmet with impact ridges
  - *Shell Plate (chest)*: Extra shell layer on front, cratered but impenetrable
  - *Anchor Legs (legs)*: Root-like leg extensions that dig into the ground, heavy anchors

### 5. ECHOMORPH — Copycat (Opponent-only, Boss Fight 3)
- **Color**: `#94a3b8` (silver-slate / shifting grey)
- **Silhouette**: Humanoid but featureless, smooth. Like a mannequin or liquid metal figure. Medium build.
- **Key features**: Smooth featureless face with just eye slits (green glow), reflective/mirror-like skin, body seems to shift/ripple, no distinct species features — intentionally blank template
- **Personality in pose**: Neutral stance mirroring a fighter, slight shimmer effect, uncanny valley
- **Neon accents**: Green scanning lines across body, mirror reflections of opponent's color
- **Mutations visual language**:
  - *Adaptive Membrane (chest)*: Shifting camouflage pattern on torso
  - *Mirror Reflex (arms)*: Chrome mirror-surface forearms that reflect attacks
  - *Echo Core (head)*: Transparent cranium showing swirling copied data

### 6. HYDRAVINE — Regenerator (Opponent-only, Boss Fight 3)
- **Color**: `#22c55e` (toxic green / jungle green)
- **Silhouette**: Monstrous plant creature. Hunched, thick vines for limbs, gaping maw, no clear head — face IS the body. Intimidating mass.
- **Key features**: Vine-tentacle arms, massive tooth-filled mouth in center of body, thorns everywhere, dripping toxic sap (magenta), root-like legs that spread out, spore clouds
- **Personality in pose**: Coiled and ready to lunge, vines spread wide, mouth open revealing teeth, roots gripping floor
- **Neon accents**: Magenta bio-luminescent sap, green pulse through vine veins
- **Mutations visual language**:
  - *Regenerative Membrane (chest)*: Pulsing green growth covering wounds, self-healing tissue
  - *Thorn Bark (arms)*: Hardened bark layer with retractable thorns on vine-arms
  - *Root Network (legs)*: Expanded root system spreading across floor

### 7. PARASITEX — Assimilator (Opponent-only, Boss Fight 4)
- **Color**: `#be185d` (dark magenta / parasite pink)
- **Silhouette**: Grotesque, asymmetric. One side looks somewhat normal, other side is overgrown with stolen biological material. Hunched, reaching.
- **Key features**: Exposed tendril-covered body, one large eye, dripping organic matter (red), asymmetric build (one arm larger from stolen mutations), chitinous patches, visible internal organs
- **Personality in pose**: Lurching forward, one arm extended to grab, body language hungry/predatory
- **Neon accents**: Red eye glow, pink-magenta tendrils, stolen mutation parts glow their original species color
- **Mutations visual language**:
  - *Parasitic Link (head)*: Neural tendril crown connecting to stolen data
  - *Chitin Exoframe (chest)*: Stolen exoskeleton pieces stitched together
  - *Assimilation Tendril (arms)*: Long reaching tendril-arm that absorbs on contact

---

## Scenario.com Prompt Templates

**Model**: Retro Diffusion Plus
**Settings**: Pixel art, dark background, character centered, full body

### Base Sprite Prompt Pattern
```
pixel art, {character description}, full body, front facing, idle fighting stance,
dark sci-fi arena background, {key visual features}, {color accents},
retro game sprite, 16-bit style, clean silhouette, transparent background style
```

### Per-Character Prompts

**Cyber Gorilla**:
```
pixel art, massive cybernetic gorilla fighter, full body, front facing, aggressive stance,
dark sci-fi arena, huge fists, glowing cyan cybernetic left arm, orange eye glow,
metallic chest plate, thick muscular build, retro game sprite, 16-bit fighting game character
```

**Psycho Squid**:
```
pixel art, alien squid creature fighter, full body, front facing, hovering menacing pose,
dark sci-fi arena, bulbous head with exposed brain, glowing green eyes, multiple tentacle arms,
purple bioluminescent veins, dripping slime, retro game sprite, 16-bit fighting game character
```

**Bee Swarm**:
```
pixel art, humanoid insect bee warrior, full body, front facing, alert combat stance,
dark sci-fi arena, compound eyes, yellow-black segmented exoskeleton, small translucent wings,
mandibles, stinger, golden amber highlights, retro game sprite, 16-bit fighting game character
```

**Terror Pin Turtle**:
```
pixel art, massive armored turtle warrior, full body, front facing, defensive blocking stance,
dark sci-fi arena, huge spiked shell on back, snapping jaw, barnacle textures, short thick limbs,
teal bioluminescent glow in shell cracks, retro game sprite, 16-bit fighting game character
```

**Echomorph**:
```
pixel art, featureless mirror humanoid shapeshifter, full body, front facing, neutral stance,
dark sci-fi arena, smooth reflective silver skin, green scanning eye slits, liquid metal body,
shifting surface, no distinct features, uncanny, retro game sprite, 16-bit fighting game character
```

**Hydravine**:
```
pixel art, monstrous plant vine creature, full body, front facing, coiled attack pose,
dark sci-fi arena, vine tentacle arms, huge tooth-filled mouth, thorns everywhere,
dripping magenta toxic sap, root legs gripping floor, retro game sprite, 16-bit fighting game character
```

**Parasitex**:
```
pixel art, grotesque alien parasite creature, full body, front facing, lurching hungry pose,
dark sci-fi arena, asymmetric body with stolen biological parts, one large red eye,
dripping tendrils, chitinous patches, dark magenta glow, retro game sprite, 16-bit fighting game character
```

---

## Animation States (Stretch Goal)

For each character, the engine supports these states via CharacterCompositor:

| State      | Visual                                    | Implementation          |
|------------|-------------------------------------------|------------------------|
| `idle`     | Gentle sine-wave bob (already in engine)  | Base sprite             |
| `attacking`| Lunge toward opponent + impact particles  | `animateLunge()` call   |
| `hit`      | White flash + screen shake                | `flashHit()` + `shake()`|
| `victory`  | Celebratory pose (future)                 | Swap sprite             |
| `defeat`   | Collapsed/fallen pose (future)            | Swap sprite             |

**Phase 1 (NOW)**: Single idle sprite per character — the engine already handles animation via code (lunge, flash, shake, bob).

**Phase 2 (LATER)**: Attack/hit pose variants swapped during combat phases.

---

## Processing Pipeline

1. **Generate on Scenario.com** (Retro Diffusion Plus, 928x1232 or similar)
2. **Background removal** (Python `rembg` or manual in image editor)
3. **Resize to 48x64** with nearest-neighbor interpolation (preserve pixel art)
4. **Export as PNG** with alpha transparency
5. **Place in** `src/assets/sprites/{species}_front.png`
6. **Verify** spriteMap.js imports resolve correctly
7. **Fix CharacterCompositor.loadBase()** if Pixi v8 `Texture.from()` needs async loading

### Mutation Overlays (Phase 2)
1. Generate each mutation as a small detail sprite on its own
2. Size to ~24x24 pixels
3. Position via SLOT_OFFSETS in slotOffsets.js
4. CharacterCompositor.attachMutation() handles layering
