# AMA Hub Art Prompts — Retro Diffusion Models

**Model guide:** Use **RD Plus** for room backgrounds, portraits, and UI. Use **RD Tile** for any tileable floor/wall elements. All prompts assume top-down bird's eye perspective unless noted.

**Key settings for all generations:**
- Upload AMA palette image (dark purples, cyans, magentas, neon greens on black/dark gray)
- Enable background removal where needed
- Use "Edit with Prompts" to fix specific details after generation
- If style drifts toward realism, add "pixel art, retro game sprite" at start of prompt

**Perspective lock phrase (add to every room prompt):**
`flat top-down bird's eye view, contained room with walls on all four sides, game asset`

---

## 1. Arena Bay (RD Plus) — 256×256px (1:1)

Generate 1 base, then tint-shift for 4 variations.

```
dark sci-fi arena pit, flat top-down bird's eye view, contained square room with walls on all four sides, fighting ring in center, energy barrier perimeter, neon red accent lighting, metal grate flooring, dark purple-gray walls, overhead perspective, game asset, no vignette, uniform lighting
```

**Tint variations (use Edit with Prompts on base):**
- Arena 1: red neon accents (Power arena)
- Arena 2: purple neon accents (Psychic arena)
- Arena 3: yellow neon accents (Fast arena)
- Arena 4: green neon accents (Grab arena)

---

## 2. Mutation Lab (RD Plus) — 320×320px (1:1)

```
alien biology laboratory, flat top-down bird's eye view, contained square room with walls on all four sides, specimen tanks along walls, glowing green-purple liquid tubes, surgical table center, scattered alien organs and tools, toxic green bioluminescent lighting, dark metal floor with drainage grates, game asset, no vignette, uniform lighting
```

---

## 3. Tech Workshop (RD Plus) — 320×320px (1:1)

*Already have a good reference — use it as reference image at 0.5-0.6 strength.*

```
robot repair workshop, flat top-down bird's eye view, contained square room with walls on all four sides, workbenches with cybernetic parts, welding sparks, tool racks on walls, amber-orange accent lighting, metal floor with oil stains, spare robot parts scattered, game asset, no vignette, uniform lighting
```

---

## 4. Command Post (RD Plus) — 320×320px (1:1)

*Already have a good reference — use it as reference image at 0.5-0.6 strength.*

```
military command center, flat top-down bird's eye view, contained square room with walls on all four sides, holographic tactical display table center, wall-mounted screens with data readouts, dark purple-magenta accent lighting, armored floor plates, weapon rack on far wall, game asset, no vignette, uniform lighting
```

---

## 5. Arena Gallery (RD Plus) — 1024×192px (~5:1 wide)

**Note:** RD Plus native is 256×256. Generate at closest supported wide ratio, then crop/stretch to 1024×192. Or generate as a panoramic strip.

```
sci-fi observation corridor, flat top-down bird's eye view, very wide horizontal hallway, glass floor panels looking down into arenas below, metal railings both sides, cyan LED strip lighting along walls, dark atmosphere, spectator viewing area, game asset, no vignette, uniform lighting, seamless left-right edges
```

---

## 6. Central Corridor (RD Plus) — 1024×128px (8:1 wide)

**Note:** Same wide-format approach as Arena Gallery. Generate wide, crop to 1024×128.

```
main station hallway, flat top-down bird's eye view, very wide horizontal corridor, cyan LED accent strip running center of floor, dark metal wall panels both sides, door frames visible at regular intervals along walls, industrial sci-fi, game asset, no vignette, uniform lighting, seamless left-right edges
```

---

## 7. Terminal Alcove (RD Plus) — 256×192px (4:3)

```
small supply room, flat top-down bird's eye view, contained rectangular room with walls on all four sides, data terminal screens on back wall, supply crates stacked along sides, dim blue-white terminal glow, dark metal floor, compact space, game asset, no vignette, uniform lighting
```

---

## 8. Vertical Connector Hallway (RD Plus) — 64×128px (1:2 tall)

```
short vertical passage, flat top-down bird's eye view, narrow hallway connecting two rooms, dark metal walls, single cyan LED strip on floor, doorway frames at top and bottom, tight corridor, game asset, no vignette, uniform lighting, seamless top-bottom edges
```

---

## Negative Prompt (use for ALL generations)

```
vignette, darkened edges, side view, isometric, 3D render, realistic, photograph, blurry, anti-aliased, gradient lighting, perspective distortion, fisheye, text, watermark, signature
```

---

## Generation Order (by session)

### Session A: Square Rooms (RD Plus)
1. Arena Bay base (256×256) → tint x4
2. Mutation Lab (320×320)
3. Tech Workshop (320×320) — use existing as reference
4. Command Post (320×320) — use existing as reference
**Output: 7 room images**

### Session B: Wide Corridors + Small Rooms (RD Plus)
5. Arena Gallery (1024×192 target — generate at max wide, crop)
6. Central Corridor (1024×128 target — generate at max wide, crop)
7. Terminal Alcove (256×192)
8. Vertical Connectors (64×128) — generate a few variations
**Output: 5-8 images**

### Session C: Optional Tileable Elements (RD Tile, 32×32)
If you want tileable floor/wall textures to layer UNDER the room backgrounds:

```
FLOOR: dark sci-fi metal floor panel, top-down, subtle grid lines, dark purple-gray, uniform lighting, no vignette
WALL: sci-fi wall panel, top-down, glowing cyan accent strip, dark metal, uniform lighting, no vignette
DOOR FRAME: energy field doorway, top-down, glowing border, dark metal frame, uniform lighting, no vignette
```

---

## Quick Checklist Before Each Generation

- [ ] Correct model selected (RD Plus or RD Tile)
- [ ] Resolution matches target from hub-layout.md
- [ ] Palette image uploaded
- [ ] "flat top-down bird's eye view" in prompt
- [ ] "no vignette, uniform lighting" in prompt
- [ ] Negative prompt includes: vignette, darkened edges, side view, isometric
- [ ] Background removal ON for overlays, OFF for room backgrounds
- [ ] Reference image loaded (if building on existing good result)
