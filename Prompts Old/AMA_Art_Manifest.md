# AMA: COMPLETE ART ASSET MANIFEST

**Every visual asset the game needs, mapped to code, organized for Midjourney batch prompting**
**Style Reference:** `https://cdn.midjourney.com/f6d9874d-70f9-4f4b-a4df-ed3908ac1b3e/0_0.webp`

---

## REFERENCE BATCH (Already Generated — Keep for Style Reference)

These were generated in the first pass. Don't upscale further, but use as visual anchors.

| Asset | Status | Notes |
|-------|--------|-------|
| Gorilla base sprite | ✅ Upscaled (#3) | Style locked |
| Queen Bee base sprite | ✅ Upscaled (#3) | Style locked |
| Squid base sprite | ✅ Upscaled (#3) | Style locked |
| Turtle base sprite | ✅ Upscaled (#3) | Style locked |
| 8 generic mutation sprites | ✅ Generated | Keep as reference only — don't map to game |
| 4 side-view arenas | ✅ Generated | Re-prompting in Pokemon perspective |

---

## SECTION 1: BASE CHARACTER SPRITES (7 total)

### Already Generated (4 Playable — need over-shoulder versions too)
These exist as side-view sprites. For the Pokemon-style battle view, we also need:
- **Front-facing** version (opponent view — facing camera)
- **Back-facing** version (player view — seen from behind)

| # | Character | Code ID | Color Palette | Side ✅ | Front | Back |
|---|-----------|---------|---------------|---------|-------|------|
| 1 | Cyber Gorilla | `cyberGorilla` | Steel gray + electric blue | ✅ | ❌ | ❌ |
| 2 | Psycho Squid | `psychoSquid` | Deep purple + toxic green | ✅ | ❌ | ❌ |
| 3 | Queen Bee | `beeSwarm` | Amber yellow + black | ✅ | ❌ | ❌ |
| 4 | Terror Pin Turtle | `terrorPinTurtle` | Forest green + rust orange | ✅ | ❌ | ❌ |

### Need to Generate (3 Non-Playable)
| # | Character | Code ID | Color Palette | Role | Front | Back |
|---|-----------|---------|---------------|------|-------|------|
| 5 | Echomorph | `echomorph` | Silver + shifting rainbow | Counter-mechanic opponent | ❌ | N/A |
| 6 | Hydravine | `hydravine` | Dark teal + glowing pink | Counter-mechanic opponent | ❌ | N/A |
| 7 | Parasitex | `parasitex` | Blood red + bone white | Final Boss | ❌ | N/A |

> **Note:** Non-playable opponents only need front-facing sprites (player never controls them).
> Playable characters need BOTH front (when fought as AI) and back (when controlled by player).

**Sprite count: 4 back + 7 front = 11 character sprites**

---

## SECTION 2: SPECIES MUTATIONS (8 total — 2 per playable character)

Each mutation needs a **modular overlay sprite** that attaches to the base character's body via the slot system. These sprites work on ANY base character.

### Cyber Gorilla Mutations

| # | Mutation | Code ID | Type | Visual Concept | Attachment Slot | Prompt Approach |
|---|----------|---------|------|----------------|-----------------|-----------------|
| 1 | **Power Slam** | `power_slam` | ADD (new move) | Enlarged gorilla fist with crackling orange energy, armored knuckles, smashing downward | Arm (right) | Isolated fist sprite with energy trail |
| 2 | **Bone Density** | `bone_density` | MODIFY (chip guard) | Visible bone structure glowing through skin, calcium-white highlights on arms/fists, skeletal reinforcement | Arm overlay (both) | Semi-transparent bone glow overlay |

### Psycho Squid Mutations

| # | Mutation | Code ID | Type | Visual Concept | Attachment Slot | Prompt Approach |
|---|----------|---------|------|----------------|-----------------|-----------------|
| 3 | **Psychic Echo** | `psychic_echo` | ADD (new move) | Third eye on forehead emitting purple shockwave rings, psychic energy ripples | Head | Glowing third eye + wave effect |
| 4 | **Psionic Residue** | `psionic_residue` | MODIFY (chip composure) | Dripping purple-green ectoplasm aura around hands/tentacles, psychic slime trails | Arm overlay (both) | Ectoplasm glow on arms |

### Bee Swarm Mutations

| # | Mutation | Code ID | Type | Visual Concept | Attachment Slot | Prompt Approach |
|---|----------|---------|------|----------------|-----------------|-----------------|
| 5 | **Swarm Burst** | `swarm_burst` | ADD (new move) | Explosive cloud of tiny bees radiating outward in all directions, amber energy burst | Full body effect | Radial bee swarm explosion sprite |
| 6 | **Reflex Membrane** | `reflex_membrane` | MODIFY (cancel damage) | Translucent amber membrane/force field shell around body, honeycomb pattern, shimmering | Chest overlay | Semi-transparent hex shield overlay |

### Terror Pin Turtle Mutations

| # | Mutation | Code ID | Type | Visual Concept | Attachment Slot | Prompt Approach |
|---|----------|---------|------|----------------|-----------------|-----------------|
| 7 | **Counter Shell** | `counter_shell` | ADD (new move) | Spiked shell plates extending outward, green with red-tipped spikes, damage reflection shards flying off | Back + Chest | Spiked shell armor with reflection sparks |
| 8 | **Adaptive Shell** | `adaptive_shell` | MODIFY (regen stamina) | Living shell that pulses with teal bio-energy, organic veins running through shell surface, breathing effect | Back overlay | Pulsing bio-shell with energy veins |

---

## SECTION 3: BOSS MOVES — PARASITEX (3 visual effects)

Parasitex has no mutations but needs VFX for its 3 base moves + its steal mechanic.

| # | Move | Code ID | Move Type | Visual Concept | Prompt Approach |
|---|------|---------|-----------|----------------|-----------------|
| 9 | **Parasite Drain** | `parasite_drain` | Grab | Red tendrils extending from Parasitex, latching onto victim, life force (green particles) flowing back | Attack effect sprite — tendril latch |
| 10 | **Nerve Web** | `nerve_web` | Psychic | Network of red neural threads spreading across screen, pulsing nodes | Attack effect sprite — spreading web |
| 11 | **Shell Crack** | `shell_crack` | Power | Massive claw/pincer strike with impact shatter effect, bone-white claws | Attack effect sprite — crushing strike |
| 12 | **Graft Steal** | (passive VFX) | Steal | Parasitex absorbing a glowing mutation orb, red tendrils wrapping around stolen power | Special animation — absorption effect |

---

## SECTION 4: DOCTOR MUTATIONS (6 total — from Dr. Helix)

Generic mutations available for purchase. These also need modular overlay sprites.

| # | Mutation | Code ID | Type | Cost | Visual Concept | Attachment Slot |
|---|----------|---------|------|------|----------------|-----------------|
| 13 | **Adrenaline Glands** | `adrenaline_glands` | ADD | 3 biomass | Pulsing red glands visible on neck/chest, veins bulging with stimulant, speed lines | Chest |
| 14 | **Neural Weave** | `neural_weave` | MODIFY | 4 biomass | Circuit-like neural wiring across the scalp/head, blue-purple glow, cybernetic mesh | Head |
| 15 | **Chitin Plating** | `chitin_plating` | MODIFY | 3 biomass | Insectoid armor plates across chest and shoulders, dark brown with red accent lines | Chest |
| 16 | **Ink Sacs** | `ink_sacs` | ADD | 4 biomass | Visible ink bladders on back/sides, deep purple-black, ready to burst | Back |
| 17 | **Regenerative Tissue** | `regenerative_tissue` | PASSIVE | 2 biomass | Glowing green organic tissue patches, visible on torso, pulsing with healing energy | Body glow overlay |
| 18 | **Berserker Glands** | `berserker_glands` | MODIFY | 3 biomass | Rage-red veins spreading across arms and chest, bulging musculature, heat distortion | Arm + Chest overlay |

---

## SECTION 5: TECH GLOW OVERLAYS (Move Type VFX — ~8 total)

These are energy/glow effects that layer on top of characters during attacks. One per move type.

| # | Move Type | Code Color | Visual Concept | Prompt Approach |
|---|-----------|-----------|----------------|-----------------|
| 19 | **Power** | `#dc2626` Red | Red-orange explosive energy burst, impact shockwave, debris | Isolated glow effect overlay |
| 20 | **Fast** | `#ca8a04` Gold | Gold speed lines, afterimage trail, motion blur streaks | Isolated speed effect overlay |
| 21 | **Evasion** | `#06b6d4` Cyan | Cyan smoke/mist dissipation, fading silhouette, ghost echo | Isolated evasion effect overlay |
| 22 | **Defense** | `#2563eb` Blue | Blue energy shield, hexagonal barrier, protective aura dome | Isolated shield effect overlay |
| 23 | **Psychic** | `#7c3aed` Purple | Purple psychic waves, rippling mind energy, eye glow | Isolated psychic effect overlay |
| 24 | **Area** | `#ea580c` Orange | Orange radial blast, ground-crack shockwave, explosion ring | Isolated area effect overlay |
| 25 | **Grab** | `#16a34a` Green | Green energy tendrils/chains, binding effect, lock-on markers | Isolated grab effect overlay |
| 26 | **Finisher** | `#d97706` Amber | Golden supercharged aura, screen-filling energy, dramatic glow | Isolated finisher effect overlay |

---

## SECTION 6: ARENAS — POKEMON OVER-THE-SHOULDER (4 total, re-prompt)

**Perspective:** Player's fighter visible from behind (bottom 1/3), opponent facing camera (top 1/3), arena environment fills the depth between them. Classic Pokemon battle framing.

| # | Arena | Visual Concept | Key Elements |
|---|-------|---------------|--------------|
| 27 | **Toxic Hive** | Amber honey walls stretching into distance, hexagonal floor tiles, toxic green fog rising, dripping ceiling | Over-shoulder POV, depth perspective, hive interior |
| 28 | **Psionic Reef** | Underwater coral arena receding into deep ocean, bioluminescent purple/blue, floating psychic orbs at different depths | Over-shoulder POV, underwater depth, coral pillars |
| 29 | **Volcanic Pit** | Lava arena stretching into distance, obsidian platform in foreground, molten rivers flowing between rock formations | Over-shoulder POV, heat haze depth, lava glow |
| 30 | **Gravity Well** | Space arena with floating platforms at various depths, nebula backdrop, zero-gravity debris, cosmic scale | Over-shoulder POV, infinite depth, floating rocks |

---

## SECTION 7: UI ASSETS (8 total)

| # | Asset | Visual Concept |
|---|-------|---------------|
| 31 | **Body HP Bar** | Red organic bar, flesh/muscle texture |
| 32 | **Guard Bar** | Blue metallic bar, armor/shield texture |
| 33 | **Composure Bar** | Purple psychic bar, brain/neural texture |
| 34 | **Stamina Bar** | Gold energy bar, lightning/fuel texture |
| 35 | **Biomass Counter** | Green organic currency icon, alien tissue blob |
| 36 | **Type Badge: Power** | Red fist icon |
| 37 | **Type Badge: Psychic** | Purple eye/brain icon |
| 38 | **Type Badge: Defense** | Blue shield icon |

---

## SECTION 8: HUB WORLD (5 total)

| # | Asset | Visual Concept |
|---|-------|---------------|
| 39 | **Colosseum Hub Tileset** | Dark purple stone, cyan wall panels, neon lights, top-down |
| 40 | **NPC: Commander Vex** | Military commander, dark green + gold, stern, 32x32 |
| 41 | **NPC: Dr. Helix** | Mad scientist, lab coat, multiple tool arms, 32x32 |
| 42 | **NPC: Scout Drone** | Floating info bot, holographic display, 32x32 |
| 43 | **Biomass Pickup** | Glowing green organic blob on ground, collectible |

---

## TOTAL ASSET COUNT

| Category | Count |
|----------|-------|
| Character sprites (front + back) | 11 |
| Species mutations | 8 |
| Boss moves + steal VFX | 4 |
| Doctor mutations | 6 |
| Tech glow overlays | 8 |
| Arenas (Pokemon POV) | 4 |
| UI assets | 8 |
| Hub world | 5 |
| **TOTAL** | **54** |

---

## MIDJOURNEY BATCH PLAN

**Batch 1 — Character Front/Back Sprites (11 prompts)**
Priority: Highest — needed for Pokemon perspective to work

**Batch 2 — Species Mutations (8 prompts)**
Priority: High — core gameplay visuals

**Batch 3 — Doctor Mutations + Boss Moves (10 prompts)**
Priority: High — complete the mutation system

**Batch 4 — Arenas in Pokemon POV (4 prompts)**
Priority: Medium — re-do with new perspective

**Batch 5 — Tech Glow Overlays (8 prompts)**
Priority: Medium — VFX polish layer

**Batch 6 — UI + Hub World (13 prompts)**
Priority: Lower — functional placeholders work for now

**Total Midjourney prompts: ~54**
**Estimated time: 3-4 hours of generation + selection**

---

## PROMPT TEMPLATE (All assets use this base)

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
- Arenas: `over-the-shoulder perspective, depth view, battle arena, foreground to background`
- UI: `isolated UI element, flat icon, game HUD asset`
