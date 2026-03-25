# AMA Sprint: Hub Shell + Mutation Economy (Interleaved)

## Sprint Philosophy

Alternate between hub and economy tasks so each one makes the other more tangible. Build the hub room → build the slot system → put the doctor IN the hub → build the doctor screen → walk up to the doctor and use it. Every step is playable.

The hub is 2D top-down (dungeon-crawl aesthetic). The fight screen is the 3D moment (Pokémon-style over-the-shoulder). The contrast between walking around a dark 2D station and then stepping through a door into a 3D arena is the big reveal.

---

## Phase 1: Skeleton (get both systems existing)

### 1A — Hub: 2D top-down room with movement
**Dispatch to Claude Code.**
- New `HubWorld.jsx` component using HTML5 Canvas (2D context)
- Top-down view of the orbital station corridor
- Dark sci-fi terminal aesthetic: dark navy floor (#0b1018), wall borders (#1a2a3a), subtle floor grid lines in cyan at low opacity
- Player character as a small sprite or colored rectangle, centered on screen
- WASD movement with tile-based or pixel-based collision against walls
- Camera follows player (player stays centered, world scrolls)
- HUD overlay (React DOM): `// orbital station — run XX` top-left, `WASD move / E interact` bottom
- Wire into App.jsx: after CharacterSelect, mount HubWorld instead of old OverworldScreen
- **No NPCs, no doors yet.** Just a room you can walk around.

**Rendering: tile map approach.** Define a 2D grid where each cell is wall/floor/door/NPC. Classic dungeon crawl. Simplest collision (check tile type), easiest to add new rooms later.

**Layout (top-down):**
```
    ┌─────────────────────────────────────┐
    │  [A1]    [A2]    [A3]    [A4]      │ ← North wall (arena doors)
    │                                     │
    │                                     │
    ├───┐                          ┌──────┤
    │VEX│     Main corridor        │HELIX │ ← Alcoves
    ├───┘                          └──────┤
    │                                     │
    │      [CODEX]    [SUPPLIES]          │
    │                                     │
    │           [PLAYER SPAWN]            │
    └─────────────────────────────────────┘
```

**Test:** Player selects species → spawns in the 2D station → can walk around freely with WASD. Walls block movement.

### 1B — Economy: ADD/REPLACE slot data model
**Dispatch to Claude Code.**
- Add `BODY_SLOTS` to constants.js: `['leftArm', 'rightArm', 'back', 'chest', 'head', 'legs']`
- Each species in characters.js gets a `slotMap` linking base moves to body slots:
  ```
  cyberGorilla: {
    leftArm: 'gorillaPunch',
    rightArm: 'ironBackhand',
    head: 'chestBeat',
    legs: 'groundSlam',
    back: null,
    chest: null,
  }
  ```
- Each mutation in mutations.js gets `slotType: 'ADD' | 'REPLACE'` and `slot: 'rightArm'` etc.
- ADD mutations: modify existing move in that slot (add secondary effects)
- REPLACE mutations: swap in a completely new move, old move is gone
- `playerBuild` state object in App.jsx tracks: `{ slots: { leftArm: { base: 'gorillaPunch', mutation: null, tech: [] }, ... } }`
- Helper functions: `getMoveList(playerBuild)` returns the current list of available moves based on slot state
- **No UI yet.** Just the data model and helpers.

**Test:** Console log `getMoveList(playerBuild)` after a mock mutation graft. Verify base moves correct, REPLACE swaps work, ADD modifies work.

---

## Phase 2: Connections (things to interact with)

### 2A — Hub: Arena doors + interaction system
**Dispatch to Claude Code.**
- 4 arena door tiles along north wall
- Door visuals: dark recessed rectangle with a colored glow line at threshold
  - Cleared: green glow (#66ee88)
  - Next: cyan glow (#44ccff), pulses
  - Locked: dark gray (#2a2a2a), no glow
- Door state driven by `runState.ladderProgress`
- Proximity detection: when player is adjacent to an interactable, show `[E] Arena 3` prompt
- Pressing E on the next arena door → fade to black → FightScreen mounts
- Pressing E on cleared doors: "CLEARED" prompt
- Pressing E on locked doors: "LOCKED" prompt
- Door labels rendered above each door: "A1", "A2", "A3", "A4"

**Test:** Walk to the cyan-glowing door, press E, fade to black, fight starts.

### 2B — Economy: Harvest screen redesign
**Dispatch to Claude Code.**
- After a fight win, HarvestScreen shows the defeated opponent's available mutations
- Each mutation displayed as a card: name, slot, type (ADD/REPLACE), weakness, effect
- If REPLACE: card shows "Replaces: [current move name]" in red
- If ADD: card shows "Modifies: [current move name]" with the bonus
- If target slot already has a mutation: warning "Current graft will be destroyed"
- Skip button always available ("Take nothing, keep your build clean")
- On selection: update `playerBuild.slots` accordingly
- Wire `getMoveList(playerBuild)` into FightScreen so next fight uses the new move list
- Style with dark sci-fi terminal aesthetic (design system)

**Test:** Win fight 1 → harvest screen → pick a REPLACE mutation for rightArm → fight 2 shows the new move.

---

## Phase 3: The Doctor (hub + economy converge)

### 3A — Hub: NPC sprites + interaction
**Dispatch to Claude Code.**
- Dr. Helix as a top-down sprite in the east alcove
  - Processed Scenario sprite (top-down) or colored placeholder rectangle
  - Green accent glow around NPC (#00ff88 at low opacity)
  - Nameplate: "DR. HELIX" in green
- Cmdr. Vex in west alcove (purple, #aa66ee)
- Codex terminal in main corridor (cyan)
- Supplies terminal (amber)
- All use same proximity + E interaction system from 2A
- Pressing E calls `onInteract('helix')` → App.jsx shows DoctorScreen overlay
- Hub stays visible (dimmed) while overlay is open
- Escape closes overlay, resumes hub movement

**Test:** Walk to Dr. Helix, press E, doctor screen opens over darkened hub. Escape returns to hub.

### 3B — Economy: Doctor screen with Graft tab
**Dispatch to Claude Code.**
- New DoctorScreen with dark sci-fi terminal styling (design system)
- Left column: 6 body slot rows (empty, base move, grafted mutation + HP)
- Right column: detail/preview panel for selected slot
- **Graft tab only** — Enhance, Remove, Items tabs visible but disabled
- Available grafts from biomass pool
- Click graft → confirmation → updates `playerBuild.slots`
- Dr. Helix dialogue bar at bottom with run-aware quotes
- Biomass cost on each option

**Test:** Walk to Helix → doctor → see body slots → graft mutation → close → next fight uses it.

---

## Phase 4: Tech layer (economy deepens)

### 4A — Economy: Tech Points + Enhance tab
**Dispatch to Claude Code.**
- `techCapacity: 10` and `techUsed: 0` in run state
- `techUpgrades.js`: name, description, cost (1-3), category, effect
- Effects applied in `resolveTurn` (damage bonuses, cost reductions, composure chip, etc.)
- Enhance tab in DoctorScreen:
  - Select a slot with a mutation
  - See available upgrades
  - Install (deducts tech points)
  - Visible on slot row
- 10 tech points per run, spend across all 4 fights

**Test:** Graft tentacle → enhance with Neural Scrambler (3 pts) → fight → tentacle chips composure.

### 4B — Hub: Tournament bracket + polish
**Dispatch to Claude Code.**
- Tournament bracket as a wall object/terminal near arena doors
- Player walks up, presses E, sees enlarged bracket overlay:
  - 4-fight BJJ-style bracket
  - Cleared in green, next in cyan, future in gray/???
  - Opponent species (or ??? if unscouted)
- Hub ambient details:
  - Floor grid lines (subtle cyan)
  - Wall panel details (lighter rectangles on dark walls)
  - Alcove shading
  - NPC glow pulse animation

**Test:** Walk to bracket, press E, see progress. Hub looks polished.

---

## Phase 5: Risk/Reward (economy matures)

### 5A — Economy: Remove tab + destruction consequences
**Dispatch to Claude Code.**
- Remove tab in DoctorScreen:
  - Safe removal: costs biomass
  - Free removal: random negative effect
- Mutation destroyed in combat now also removes tech enhancements
  - "GRAFT LOST" + "TECH LOST: Neural Scrambler" flash messages
  - Tech points gone (not refunded)

**Test:** Enhance mutation (3 pts) → Parasitex destroys it → lose mutation AND tech.

### 5B — Hub: Transitions + flow polish
**Dispatch to Claude Code.**
- Smooth screen transitions:
  - Arena door: fade to black (0.5s) → FightScreen
  - Fight end: fade from black → HarvestScreen → back to hub
  - NPC interaction: hub dims, overlay slides in
  - Overlay close: slide out, hub brightens
- Sound triggers (SoundManager):
  - Footstep loop while moving
  - Ambient station hum
  - Door whoosh, NPC terminal beep
- Vex dialogue updates based on next opponent

---

## Dispatch Order

| # | Task | Type | Depends On | Effort |
|---|------|------|-----------|--------|
| 1A | 2D hub room + WASD | Hub | — | ~2 hrs |
| 1B | Slot data model | Economy | — | ~2 hrs |
| 2A | Arena doors + interaction | Hub | 1A | ~2 hrs |
| 2B | Harvest redesign | Economy | 1B | ~3 hrs |
| 3A | NPC sprites + interaction | Hub | 2A | ~1.5 hrs |
| 3B | Doctor screen (Graft) | Economy | 1B, 2B | ~3 hrs |
| 4A | Tech + Enhance tab | Economy | 3B | ~3 hrs |
| 4B | Bracket + hub polish | Hub | 3A | ~2 hrs |
| 5A | Remove tab + destruction | Economy | 4A | ~2 hrs |
| 5B | Transitions + sound | Hub | 4B | ~2 hrs |

**Total: ~22.5 hours across 10 tasks.**

1A and 1B can go simultaneously. After that, alternate.

---

## What This Sprint Produces

A complete playable loop:
- 2D top-down hub (dark dungeon-crawl aesthetic)
- Walk up to NPCs and interact
- Tournament bracket on the wall
- Full mutation economy: ADD/REPLACE slots, biomass grafts, tech enhancements, removal
- The risk loop: investment = power + vulnerability
- Smooth transitions between hub → fight → harvest → doctor → hub
- The 3D fight screen hits harder because the hub is 2D — the dimension shift IS the drama
