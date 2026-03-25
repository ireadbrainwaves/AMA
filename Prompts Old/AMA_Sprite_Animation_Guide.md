# AMA Sprite Animation & Production Guide

## Aseprite Animation Workflow

### Why Aseprite

Aseprite ($19.99) is the industry standard for pixel art animation. It handles frame-by-frame animation with onion skinning, spritesheet export (individual frames to a single PNG strip), JSON data export (frame positions, timing, tags), and layer management.

---

### Minimum Viable Animation Set

**Tier 1 — Do first (biggest visual impact):**
- Idle (2–4 frames, looping) — breathing, slight movement
- Attack (3–5 frames, one-shot) — wind up, strike, return

**Tier 2 — Do second:**
- Hit/damage (2–3 frames, one-shot) — recoil, flash
- KO/defeat (3–4 frames, one-shot) — collapse, fade

**Tier 3 — Do later:**
- Win/victory (3–5 frames, one-shot)
- Special/finisher (4–6 frames, one-shot)
- Mutation overlays (slot-based compositing)

---

### Frame Counts and Timing

For pixel art at ~128px characters:

| Animation | Frames | Duration         | Loop? |
|-----------|--------|------------------|-------|
| Idle      | 2–4    | 400–600ms total  | Yes   |
| Attack    | 4–5    | 300–500ms total  | No    |
| Hit       | 2–3    | 200–300ms total  | No    |
| KO        | 3–4    | 500–800ms total  | No    |
| Win       | 3–5    | 600–1000ms total | No    |

Each frame lasts ~100–150ms. Fewer frames is fine for pixel art — it adds to the chunky charm.

---

### Step-by-Step Aseprite Workflow

#### 1. Open Your Processed Sprite
File > Open your processed PNG (e.g., `cyberGorilla_front.png`). This becomes Frame 1.

#### 2. Set Up the Canvas
Your sprite should already be on a transparent background. Use Sprite > Canvas Size to add 10–20% padding if the character will shift positions during attack.

#### 3. Create the Idle Animation

**Approach A: Squash and Stretch (easiest)**
1. Frame 1 = your base sprite (as-is)
2. Duplicate frame (Frame menu > New Frame)
3. On Frame 2, select all (Ctrl+A), then Edit > Transform
4. Squish vertically by 1–2 pixels, stretch horizontally by 1 pixel
5. Set frame duration: Frame 1 = 300ms, Frame 2 = 300ms
6. Preview with Play button

**Approach B: Redraw Key Parts (better quality)**
1. Frame 1 = base pose
2. Frame 2 = slightly shifted pose (arms moved, head tilted 1px)
3. Use onion skinning (View > Onion Skinning) to see Frame 1 while drawing Frame 2

For your first pass, Approach A is totally fine.

#### 4. Create the Attack Animation
1. Start from your idle Frame 1
2. Frame 1: Wind-up — shift body back 2–3px, raise arms/appendage
3. Frame 2: Strike — lunge forward 4–6px, extend attack appendage
4. Frame 3: Impact — hold strike position, add a 1–2px impact squash
5. Frame 4: Return — back to idle position
6. Use Tags (Frame > Tag) to mark this sequence as "attack"

**Key principle:** The wind-up frame sells the attack. One frame pulling back makes the strike feel powerful.

#### 5. Export as Spritesheet
File > Export Sprite Sheet:
- Layout: "By Rows" (one row per animation tag)
- Check "JSON Data"
- Output: `[species]_[view]_sheet.png`
- JSON: `[species]_[view]_sheet.json`

---

### Spritesheet JSON Format (Aseprite Export)

```json
{
  "frames": {
    "cyberGorilla_front 0.aseprite": {
      "frame": { "x": 0, "y": 0, "w": 128, "h": 128 },
      "duration": 300
    },
    "cyberGorilla_front 1.aseprite": {
      "frame": { "x": 128, "y": 0, "w": 128, "h": 128 },
      "duration": 300
    }
  },
  "meta": {
    "frameTags": [
      { "name": "idle", "from": 0, "to": 1, "direction": "pingpong" },
      { "name": "attack", "from": 2, "to": 5, "direction": "forward" }
    ],
    "size": { "w": 768, "h": 128 }
  }
}
```

The `useSpriteAnimation` hook and `AnimatedSprite` component in the codebase are ready to consume this format. When you export from Aseprite, drop the sheet PNG and JSON into `src/assets/sprites/` and swap the static `<img>` tags for `<AnimatedSprite>` in BattleArena.

---

### When to Bring in Pixi.js

Not needed until you're doing:
- Mutation slot compositing (overlaying mutation sprites on body part positions)
- Particle VFX (hit sparks, energy effects)
- Complex layering (multiple sprites composited per character)

That's Phase 5 work — after you have all animation frames created.

---

## Production Order

1. **Done:** Static sprites displaying in FightScreen with CSS animations (Part 1)
2. **Done:** `useSpriteAnimation` hook and `AnimatedSprite` component created (Part 2 code)
3. **Next:** Process remaining raw sprites through the pipeline script
4. **Then:** Open Aseprite, create idle animations for all 4 playable species (backs) — just 2-frame squash/stretch
5. **Then:** Create idle animations for the 3 counter-mechanic opponents (fronts)
6. **Then:** Attack animations for playable species (4–5 frames each)
7. **Then:** Hit/KO animations
8. **Later:** Mutation overlays, VFX, Pixi.js integration

---

## Time Estimates

| Task                                           | Time Estimate  |
|------------------------------------------------|----------------|
| Process sprites + set up spriteMap.js           | 1–2 hours      |
| BattleArena component + CSS                    | 1–2 hours      |
| Wire into FightScreen                          | 1–2 hours      |
| First Aseprite idle animation (learning curve) | 2–3 hours      |
| Subsequent idle animations                     | 30–60 min each |
| First attack animation                         | 1–2 hours      |
| Subsequent attack animations                   | 30–60 min each |

---

## What to Skip for Now

- **Spine ($69)** — only needed for bone-based animation. Frame-by-frame is more appropriate for your pixel art style.
- **Pixi.js slot composition** — needs mutation sprites first (Batch 3 not yet generated).
- **Arena backgrounds** — characters on flat color or existing fight screen background is fine for playtesting.

---

## Key Principle

Always work at the final resolution: 128px for characters, 64px for mutations. Your animated frames in Aseprite should match the processed output from `process_sprite.py`, not the raw Scenario output.
