# AMA (Alien Martial Arts) — Development History

## Project Overview

AMA is a roguelike fighting game built with React + Vite. Players choose from alien species (Cyber Gorilla, Psycho Squid, Bee Swarm, Terror Pin Turtle), fight through a 4-arena ladder, harvest mutations from defeated opponents, and upgrade their builds at Dr. Helix's workshop. Combat is simultaneous-reveal with a type matchup system, stamina push economy, and resource-breaking finisher conditions.

**Tech Stack:** React, Vite, vanilla CSS variables, localStorage for persistence, no external state management.

**Core Game Loop:** Character Select -> Overworld -> Scouting -> Fight -> Harvest/Doctor -> repeat x4 -> Victory/Defeat

---

## Session 1 — Balance & UX Fixes (AMA_Balance_UX_Fixes.md)

### What existed before this session
- Base game with 4 playable species, each with 5 moves
- FightScreen with simultaneous reveal, matchup resolution, stamina push
- Basic overworld, harvest screen, doctor screen, scouting screen
- Character select, victory/defeat screens
- Sound manager, matchup guide overlay
- Items system (stamina serum, guard patch, composure stim, adrenaline shot)
- Species mutations defined in mutations.js but not deeply integrated
- Meta-progression structure in constants.js (localStorage) but partially wired

### What was built

#### Resource Pool Rebalancing (Prompt 1) — Already Done
Resource values were already updated in constants.js:
- Guard: 20, Composure: 20, Body: 25, Stamina: 10, Regen: +3
- MAX_TURNS: 20
- Damage formula: baseDamage x staminaPush (with 0.5x for matchup losers)

#### Progressive Disclosure Tutorial (Prompt 2) — Wired In
**TutorialEngine.js** existed but wasn't connected to FightScreen.

Changes made:
- Fixed `filterMovesForTutorial` Phase A to only show Body-targeting moves (was incorrectly including Guard/Defense moves)
- Imported TutorialEngine into FightScreen
- Added `isTutorial` flag based on `isFirstFight` prop
- Tutorial phase computed per turn: BODY_ONLY (1-3), ADD_GUARD (4-6), FULL_SYSTEM (7+)
- Resource bars conditionally hidden per phase (Guard hidden in Phase A, Composure hidden until Phase C)
- Move list filtered through `filterMovesForTutorial` per phase
- Matchups disabled in Phase A (both moves always land)
- Tutorial hint banner displayed at top of fight screen
- Simple Light/Medium/Heavy push buttons replace full slider in Phase A
- Tutorial hints fire on matchup wins/losses during Phase B
- AI moves filtered through tutorial phases too (AI only uses Body moves in Phase A)

#### Counter-Mechanic Opponents (Prompt 3) — Data Done, Passives Wired
**Characters defined:** Echomorph, Hydravine, Parasitex in characters.js with moves, passives, scout warnings.

**AI weights** in AIEngine.js for all three species.

**Passives implemented in FightScreen resolveTurn:**
- Hydravine Regrowth: +2 to most damaged resource at end of turn
- Echomorph Copycat: lastPlayerMove tracked and passed to AI for weighted move selection
- Parasitex Graft Steal: when it destroys a player mutation, gains the move at 75% damage

**Arena scheduling** in App.jsx: Fights 1-2 standard, Fight 3 standard or counter (50/50), Fight 4 always Parasitex.

#### Mutation Scars (Prompt 4) — Engine Wired In
**ScarEngine.js** existed with full scar types. Wired into FightScreen:
- `applyScarEffects` — power/finisher damage bonuses
- `getScarCompBonus` — composure chip on all attacks
- `checkScarDodge` — 10% auto-dodge per Ghost Scar
- `getScarDamageReduction` — flat damage reduction per Armor Scar
- `getScarRegenBonus` — extra stamina regen per Speed Scar
- Splash Scar — chip 1 to secondary resource on attacks
- Grip Scar — opponent cost modifier
- Scars displayed in player resource panel with hover tooltips

#### Death-As-Progress Meta (Prompt 5) — Partially Wired
- Meta structure (constants.js): totalRuns, wins, losses, bestRun, codex, mutationCatalog, isFirstRun
- Codex updates in App.jsx handleFightEnd
- **ScoutingScreen redesigned:** codex-based progressive reveal (0 encounters = name only, 1+ = style, 2+ = passive, 3+ = full moves), scout warnings rendered, encounter stats shown
- **DoctorScreen redesigned:** Dr. Helix has run-aware dialogue based on run count and last death species, renamed from "Mutation Doctor"
- **CharacterSelect:** already had run counter and W-L record (was done)
- **Defeat screen:** Commander Vex commentary added with run-aware quotes
- Meta passed to DoctorScreen from App.jsx

---

## Session 2 — Mutation HP & Parasitex Graft Steal

### What was built

#### Mutation HP System
- Added `MUTATION_HP_SMALL = 8` and `MUTATION_HP_LARGE = 12` to constants.js
- FightScreen initializes mutation HP state for each ADD-type mutation the player has
- Mutation HP bars displayed in player resource panel ("Grafts" section) with name, HP bar, destroyed indicator

#### AI Mutation Targeting
- AIEngine.js updated: AI can target player mutations when guard is broken
- Parasitex targets mutations 70% of the time, other species 30%
- AI focuses lowest-HP mutation (focus fire)
- `aiTargetMutation` state tracked in FightScreen and passed through commit flow

#### Mutation Destruction Flow
- When AI body-damage hits a targeted mutation, damage goes to mutation HP with overflow to body
- Mutation HP hitting 0 triggers: "MUTATION DESTROYED" log, scar creation via `onScar`, flash overlay message
- Parasitex graft steal: absorbed move added to `oppStolenMoves` at 75% base damage
- Destroyed mutation moves filtered from visible move list immediately
- `onEnd` passes `destroyedMutations` so App.jsx permanently removes them from playerMoves and mutations

---

## Session 3 — Emergency Fix (AMA_Emergency_Fix_Resources_Tutorial.md)

### Issues Investigated
1. **Resource pools** — confirmed already correct (20/20/25/10)
2. **Tutorial not triggering** — confirmed working, added `ama_first_run` localStorage key
3. **AI too weak** — found and fixed real bug

### What was fixed

#### Console Diagnostics Added
- `PLAYER INIT` and `OPPONENT INIT` logs at fight start with all resource values
- `DAMAGE` log on every damage event (player and AI) showing move name, base, stamina, total, target
- `AI CHOSE` log showing move name, type, cost, and push amount

#### AI Broken State Cost Bug Fixed
- AIEngine.js `affordable` filter was using raw `m.minCost` instead of accounting for broken-state cost penalties
- Now applies same cost doubling (broken guard/composure) and exhaustion (+1) as the player
- Stolen moves from Parasitex no longer bypass cost checks

#### First-Run Flag
- Added `localStorage.setItem('ama_first_run', 'false')` after fight 1 completion to match expected key

---

## Session 4 — Targetable Mutation Combat & Weakness System

### What was built

#### Target Select Phase (AMA_Targetable_Mutation_Combat.md — Prompt 1)

**New `TARGET_SELECT` phase** added to FightScreen between MOVE_SELECT and COMMITTED:
- When player selects a non-finisher attack move and opponent has alive mutations, target select panel appears
- Panel shows BODY (always available, direct resource damage) and each alive opponent mutation
- Each mutation target shows: slot name, mutation name, HP (fog of war), weakness type, damage preview
- "WEAK! 2x" badge highlights when move type matches mutation weakness
- Back button returns to move select, Commit button proceeds to reveal
- Finishers, evasion, defense, utility moves skip target select (always target BODY)

**Opponent Mutation System:**
- Opponents now have mutations generated from their species data at fight start
- Opponent mutation HP tracked in `oppMutationHP` state
- Opponent mutation HP bars displayed in opponent resource panel with fog of war (??? until hit)
- HP revealed after first damage hit (`revealed: true`)

**Damage Resolution for Mutation Targeting:**
- Primary damage goes to mutation HP
- Secondary resource chip = 25% of primary damage (min 1) to the move's normal resource target
- On mutation destruction: scar logged, mutation removed, flash message shown

**Committed Phase:** shows "Targeting: [mutation name]" when player aimed at a mutation

#### Mutation Weakness System (Prompt 2)

**Weakness Data Added to mutations.js:**
- `SPECIES_WEAKNESS` map: Gorilla -> psychic, Squid -> power, Bee -> area, Turtle -> grab
- Every ADD mutation now has `weakness` and `slot` properties
- Doctor ADD mutations also have weakness and slot

**2x Weakness Multiplier in resolveTurn:**
- When player's move type matches targeted mutation's weakness, damage is doubled
- Log shows "SUPER EFFECTIVE!" message
- Both primary (mutation HP) and secondary (resource chip) benefit from the multiplier

**AI Targeting Upgraded in AIEngine.js:**
- Priority scoring system replaces simple random targeting:
  - +50 for weakness match (AI picks moves that deal 2x to player mutations)
  - +30 for low HP mutations (below 50%)
  - +threat bonus (tracks damage dealt by each player mutation this fight)
  - Base +10
- Per-archetype targeting rates: Parasitex 80%, Bee 50%, Squid 40%, Gorilla 20%, Turtle 15%
- AI evaluates all move+mutation combinations and picks the highest-scored pair

---

## Session 5 — Bug Fixes

### Death Cloud Nuclear Damage Fix
- Death Cloud (`variableDamage: true`) was calculating `totalCompDamage x staminaPush x dmgMult`
- With 20 composure damage and 6 push, that's 120 body damage — instant kill
- Fixed: variable damage moves now use `totalCompDamage x dmgMult` (flat, not multiplied by push)
- Fixed for both player and AI sides

### Duplicate Item Key Warning Fix
- Items list can contain duplicates (e.g., two Stamina Serums)
- React key was `item.id`, causing duplicate key warnings
- Fixed: key now uses `${item.id}_${idx}` for uniqueness

---

## File Map (Key Source Files)

```
ama-game/src/
  App.jsx                    — Main app, screen routing, run management, meta
  main.jsx                   — Entry point
  index.css                  — CSS variables, animations
  App.css                    — Additional styles

  data/
    characters.js            — 7 species (4 playable + 3 counter-mechanic), moves, passives
    constants.js             — Resource pools, mutation HP, meta-progression, localStorage
    items.js                 — Consumable items
    matchups.js              — Type chart, matchup resolution, preview
    mutations.js             — Species mutations, doctor mutations, weakness map
    spriteMap.js             — Species-keyed sprite import map

  engine/
    AIEngine.js              — Weighted AI move selection, stamina push, mutation targeting
    ScarEngine.js            — Scar creation, damage bonuses, dodge, reduction, regen
    SoundManager.js          — Audio playback (placeholder)
    TutorialEngine.js        — Progressive disclosure phases, hints, move filtering

  screens/
    CharacterSelect.jsx      — Species picker, run counter, W-L record
    FightScreen.jsx           — Core combat (900+ lines), all phases, targeting, mutations
    ScoutingScreen.jsx        — Pre-fight intel, codex reveal, scout warnings
    OverworldScreen.jsx       — Hub navigation, arena doors, NPCs
    HarvestScreen.jsx         — Post-fight mutation/biomass choice
    DoctorScreen.jsx          — Dr. Helix shop, run-aware dialogue
    VictoryScreen.jsx         — Run complete screen
    LadderScreen.jsx          — Arena ladder display

  hooks/
    useSpriteAnimation.js     — Spritesheet frame stepper (reads Aseprite JSON)

  components/
    BattleArena.jsx           — Pokemon-style battle view (static sprites + CSS anims)
    AnimatedSprite.jsx        — Spritesheet renderer (for Aseprite exports)
    MatchupGuide.jsx          — Type chart overlay (M key)

  assets/sprites/             — Processed character PNGs (11 sprites)
```

---

## Design Documents (Prompts)

```
Prompts Old/
  AMA_Alien_Martial_Arts_GDD_v3.docx    — Original game design document
  AMA_Sunday_Sprint_Prompt_Guide.docx   — Sprint planning guide
  AMA_Master_Sprint_Prompts.md          — Master prompt collection

Prompts New/
  AMA_Balance_UX_Fixes.md               — Resource rebalancing + tutorial + scars + meta
  AMA_Targetable_Mutation_Combat.md      — Target select, fog of war, weakness system
  AMA_Mutation_Economy_Tech_System.md    — Full economy redesign (not yet implemented)
  AMA_Art_Manifest.md                    — 54 art assets for Midjourney (art pipeline)
  AMA_Art_Pipeline.md                    — Full 6-phase art production pipeline spec
  AMA_Midjourney_Prompts.md              — 54 Midjourney prompts (legacy, pre-Scenario pivot)
  AMA_Scenario_Prompts.md                — Character prompts for Scenario.gg
  AMA_Scenario_Batch3_Mutations.md       — 8 species mutation prompts for Scenario.gg
```

---

## Session 6 — Art Pipeline & Asset Generation

### What was built

#### Full Art Pipeline Specification
Created `Prompts New/AMA_Art_Pipeline.md` — comprehensive 6-phase production pipeline document covering the complete journey from concept to in-game Pixi.js sprite:

- **Phase 1: Pre-Production** — Art direction lock via Midjourney `--sref` style reference, naming conventions (`SPR_`, `MUT_`, `VFX_`, `BG_`, `UI_`, `HUB_` prefixes), processing profiles per asset type
- **Phase 2: Generation** — Batch plan for all 54 assets across 9 batches by priority
- **Phase 3: Processing** — Automated sprite pipeline (`tools/process_sprite.py`) with locked profiles per asset type (characters: 128px/32 colors, mutations: 64px/16 colors, arenas: 1280px/64 colors, etc.)
- **Phase 4: Animation** — Frame-by-frame in Aseprite, animation states defined per asset type (idle, attack, hit, KO, win), spritesheet export with Pixi.js JSON format
- **Phase 5: Integration** — Pixi.js slot composition system mapping mutations to body part offsets, state-driven rendering for combat (fog of war, HP reveal, destruction), VFX blend modes
- **Phase 6: Polish** — Visual consistency pass, performance profiling (60fps target), accessibility

Tool budget: Aseprite ($19.99) + Spine Essential ($69) = $88.99 total.

Pipeline informed by industry practices from Hollow Knight (flat PNGs into engine), Dead Cells (high-fidelity source → pixelated sprites), and Hades (fast art style matching production constraints).

#### Midjourney Batch Prompts
Created `Prompts New/AMA_Midjourney_Prompts.md` — all 54 copy-paste-ready prompts organized into 9 batches with locked `--sref`, `--style raw`, `--v 6.1` parameters.

#### Scenario.gg Discovery — Major Pipeline Pivot
Midjourney proved difficult for game asset production (inconsistent poses, no transparency, tedious copy-paste workflow). Discovered **Scenario.gg** as a far superior tool for this project:

- Train a custom model on existing sprites → generates consistent style across all assets
- Multi-view consistency (front/back of same character actually match)
- Game-aware features (transparency, sprite sheets)
- API access for batch generation

**The Scenario model produced a distinctly different and improved art style** — cleaner geometry, simpler polygons, better suited for animation and processing. The team pivoted fully to Scenario for all remaining generation.

#### Character Sprites Generated (Scenario v2)
All generated through trained Scenario model with new style:

**Fronts (filed in `AMA_Art_Book/07_Character_Fronts/`):**
- `SPR_cyberGorilla2_front_raw.png`
- `SPR_psychoSquid2_front_raw.png`
- `SPR_beeSwarm2_front_raw.png`
- `SPR_terrorPinTurtle2_front_raw.png`
- `SPR_parasitex2_front_raw.png`

**Backs (filed in `AMA_Art_Book/08_Character_Backs/`):**
- `SPR_cyberGorilla2_back_raw.png`
- `SPR_psychoSquid2_back_raw.png`
- `SPR_beeSwarm2_back_raw.png`
- `SPR_terrorPinTurtle2_back_raw.png`

**Not yet regenerated in Scenario style:**
- Echomorph (front only — has Midjourney v1)
- Hydravine (front only — has Midjourney v1)

#### Sprite Processing Pipeline Script
`ama-game/tools/process_sprite.py` — Python/Pillow automated processing:
- Flood-fill background removal (no external model dependencies)
- Auto-crop with padding
- Nearest-neighbor downscale
- Palette reduction (median-cut quantization)
- Transparent PNG export
- Batch processing support

#### Remaining Scenario Prompts Written
- `Prompts New/AMA_Scenario_Prompts.md` — Character front/back prompts for Scenario
- `Prompts New/AMA_Scenario_Batch3_Mutations.md` — 8 species mutation overlay prompts

### Art Book Folder Structure
```
AMA_Art_Book/
  01_Hero_Poses/          — (empty, for hero action poses)
  02_Tech_VFX/            — (empty, awaiting Batch 6)
  03_Arenas_Pokemon_POV/  — (empty, awaiting Batch 7)
  04_Doctor_Mutations/    — (empty, awaiting Batch 5)
  05_Boss_Moves/          — (empty, awaiting Batch 4)
  06_Species_Mutations/   — (empty, awaiting Batch 3)
  07_Character_Fronts/    — 5 Scenario v2 + 7 Midjourney v1
  08_Character_Backs/     — 4 Scenario v2
  09_Reference_Batch/     — Style reference image
```

### What's Next (Art Pipeline)
1. Echomorph + Hydravine Scenario fronts (2 prompts)
2. Batch 3: Species Mutations (8 prompts — written, ready to run)
3. Batches 4-9: Boss moves, doctor mutations, tech VFX, arenas, UI, hub world (35 prompts — need Scenario versions written)
4. Phase 3: Run sprite processing pipeline on all raw assets
5. Phase 4: Animation in Aseprite
6. Phase 5: Integration into Pixi.js with slot composition system

---

## Session 7 — Sprite Integration & Battle Arena (Part 1 + Animation Scaffold)

### What was built

#### Static Sprite Battle Arena (Part 1)

**Sprites processed and integrated:**
- All 11 character sprites copied from `AMA_Art_Book/` into `src/assets/sprites/`:
  - Fronts: cyberGorilla, psychoSquid, beeSwarm, terrorPinTurtle, parasitex, echomorph, hydravine
  - Backs: cyberGorilla, psychoSquid, beeSwarm, terrorPinTurtle
- Species without back sprites (echomorph, hydravine, parasitex) are opponent-only

**New files created:**

- **`src/data/spriteMap.js`** — Import map for all sprites, keyed by species name with `{ front, back }` pairs. Species missing backs have `back: null`.

- **`src/components/BattleArena.jsx`** — Pokemon-style over-the-shoulder battle view:
  - Player = back sprite, bottom-left, larger (~160px)
  - Opponent = front sprite, top-right, smaller (~120px)
  - Accepts `playerSpecies`, `opponentSpecies`, `playerState`, `opponentState`, `flashMessage` props
  - Flash message overlay for "SUPER EFFECTIVE", "MUTATION DESTROYED", etc.
  - Comment block documenting upgrade path to AnimatedSprite when Aseprite exports are ready

- **Arena CSS added to `index.css`:**
  - 16:9 aspect ratio arena container
  - `image-rendering: pixelated` on all sprites
  - **Idle:** gentle 2s vertical bob (infinite loop)
  - **Attack:** player lunges right+up, opponent lunges left+down (0.4s, scale 1.05)
  - **Hit:** brightness(2) flash + horizontal shake (0.3s)
  - **KO:** fall + rotate + fade to 0.3 opacity (0.6s)
  - **Flash pop:** scale in, hold, fade out (0.8s) centered in arena

- **FightScreen.jsx updated:**
  - BattleArena imported and rendered above existing move select / resource panel UI
  - Animation states (`playerAnimState`, `opponentAnimState`) managed with useState
  - Turn resolution drives animation sequence via setTimeout chain: player attack → opponent hit → opponent attack → player hit → idle

#### Spritesheet Animation Scaffold (Part 2 code)

- **`src/hooks/useSpriteAnimation.js`** — React hook that reads Aseprite-exported JSON spritesheet data:
  - Finds animation by tag name (`idle`, `attack`, `hit`, etc.)
  - Steps through frames using per-frame `duration` values via setTimeout
  - One-shot animations (`direction: 'forward'`) stop at last frame; looping ones wrap
  - Returns `{ x, y, w, h }` source rect for current frame

- **`src/components/AnimatedSprite.jsx`** — Renders a div with spritesheet background:
  - Uses `useSpriteAnimation` hook for frame stepping
  - `backgroundPosition` + `backgroundSize` to show correct slice of spritesheet PNG
  - Passes `className` through so CSS animation classes still apply
  - Ready to drop in when Aseprite exports exist

#### Reference Guide Created
- **`AMA_Sprite_Animation_Guide.md`** saved to project root — covers Aseprite workflow (idle + attack step-by-step), spritesheet JSON format, frame counts/timing table, production order, time estimates, and when to bring in Pixi.js

### Checklist update
- [x] Pokemon-style over-the-shoulder battle view (was previously unchecked)
- Spritesheet animation system scaffolded, waiting on Aseprite frame exports

### What's Next (Art Pipeline)
1. Process remaining raw sprites through `process_sprite.py`
2. Create idle animations in Aseprite for all 4 playable species (backs) — 2-frame squash/stretch
3. Create idle animations for 3 counter-mechanic opponents (fronts)
4. Attack animations for playable species (4–5 frames each)
5. Hit/KO animations
6. Swap static `<img>` tags for `AnimatedSprite` component
7. Later: Mutation overlays, VFX, Pixi.js integration

---

## Session 8 — Dark Design System + Three.js Hub World

### What was built

#### Complete Design System Overhaul (AMA_Design_System.md)

**index.css rewritten** — replaced the light cream theme with a dark sci-fi terminal aesthetic:

- **Background palette**: `#080c14` (deep navy) replaces `#f5f5f0` (cream). Cards `#0a1220`, surfaces `#0f1a2e`
- **Typography**: Share Tech Mono (Google Fonts) replaces system fonts. Monospace everywhere — the monospace IS the aesthetic
- **Sharp edges**: all `--radius-*` set to `0px`. No rounded corners on inner elements. Military terminal feel
- **Text hierarchy**: bright `#e0f0f8`, primary `#c0d0d8`, secondary `#6a8a9a`, muted `#4a6a7a`, ghost `#2a4a5a`, dead `#1a2a3a`
- **Accent colors**: cyan `#00ccff` (interactive), green `#00ff88` (positive/bio), amber `#ccaa22` (tech), red `#ee6666` (danger), purple `#aa66ee` (psychic)
- **Resource bar colors** updated for dark backgrounds: guard blue `#2288cc`, composure purple `#8844cc`, body red `#cc4444`, stamina green `#44cc66`
- **CRT scanline overlay**: `.screen::after` pseudo-element with 4px repeating gradient. Subtle, not distracting
- **Battle arena gradient**: dark-to-deep gradient background with cyan floor glow line (`::before`)
- **Arena flash messages** now use cyan glow + text-shadow instead of white
- **Hub world CSS classes**: crosshair, HUD positioning (top-left, top-right, bottom-left), interact prompt with pulse animation, overlay blur (`filter: blur(4px) brightness(0.4)`), pointer lock management

All screens automatically inherit the dark theme because they use CSS variables (`var(--bg)`, `var(--bg-card)`, `var(--text-primary)`, etc.) — no individual component changes needed.

#### Three.js First-Person Hub World (AMA_ThreeJS_Hub_Spec.md)

**New file: `src/screens/HubWorld.jsx`** (~350 lines) — replaces the PixiJS 2D overworld with a first-person 3D corridor:

**Room geometry:**
- 20x20 unit room with floor (subtle grid), ceiling (dark panels), 4 walls
- West alcove (Cmdr. Vex) and east alcove (Dr. Helix) — recessed spaces with walls
- 9 ceiling light panels with blue point lights (`#2244aa`)
- Scene fog (`near: 8, far: 25`, color matches background)

**Arena doors (4):**
- Positioned along north wall, spaced 4 units apart
- Each door: outer frame + inner dark panel + floor glow strip + point light
- Color-coded states: green = cleared, cyan pulsing = next, dark gray = locked
- Next door light intensity pulses via `sin(Date.now() * 0.003)`

**NPCs (2):**
- Dr. Helix (east alcove, green glow) and Cmdr. Vex (west alcove, purple glow)
- Box-geometry figures: head (0.35) + torso (0.45x0.6) + legs (0.35x0.5)
- Billboard rotation toward player (Y axis only)
- Idle bobbing animation on head
- Accent point light above each NPC

**Terminals (2):**
- Codex Terminal (cyan glow, x=-2 z=5) and Supplies (amber glow, x=3 z=6)
- Box-geometry base + emissive screen panel + point light

**Player controls:**
- WASD movement (0.08 units/frame, strafe at 0.7x)
- Mouse look via pointer lock (0.002 rad/px sensitivity, ±70° pitch limit)
- Sliding AABB wall collision (try full move → try X only → try Z only)
- Subtle head bob when moving (±0.04 units)
- Pointer lock acquired on canvas click, released when overlay opens or Escape pressed

**Interaction system:**
- Every frame: checks distance from camera to all interactable objects
- Shows `[E] Dr. Helix` prompt for nearest interactable within radius (2.0-2.5 units)
- Pressing E fires `onInteract(targetType)` callback
- Locked doors show no interact prompt

**HUD overlay (React DOM on top of canvas):**
- Top-left: `// orbital station — run #N`
- Top-right: W/L record, arena progress
- Center-bottom: `[E] target name` interact prompt with pulse animation
- Bottom-left: `wasd move / mouse look / e interact`
- Center: 2px cyan crosshair dot

**Performance:**
- `setPixelRatio(1)` — no HiDPI scaling (keeps low-fi look + saves GPU)
- All geometry uses `MeshLambertMaterial` with `flatShading: true`
- No real-time shadows
- ~45 total meshes — well within 60fps budget
- Clean disposal on unmount (geometry + material + renderer)

#### App.jsx Rearchitected

**Hub overlay system** replaces screen-level routing for hub interactions:

- `hubOverlay` state: `null`, `'doctor'`, `'scouting'`, `'codex'`, `'supplies'`
- Hub canvas stays mounted — overlays render on top via `.hub-overlay` (absolute positioned, fadeIn animation)
- Canvas blurs + darkens when overlay active
- `handleHubInteract(targetType)` routes: arena doors → scouting, helix → doctor, codex/supplies → their overlays
- `closeHubOverlay()` dismisses and re-enables hub controls

**New overlay screens:**
- **Codex terminal**: lists all encountered species from meta.codex with encounter/defeat counts
- **Supplies terminal**: shows current items and biomass count

**Preserved:** fight, harvest, victory, defeat still replace the hub entirely (full-screen transitions via `fadeToScreen`)

**OverworldScreen import removed** — PixiJS overworld no longer used (file still exists but orphaned alongside LadderScreen.jsx)

### File changes
```
Modified:
  src/index.css              — Complete dark sci-fi design system rewrite (127 → 235 lines)
  src/App.jsx                — Hub overlay architecture, OverworldScreen → HubWorld swap

New:
  src/screens/HubWorld.jsx   — Three.js first-person hub (~350 lines)

Orphaned (no longer imported):
  src/screens/OverworldScreen.jsx  — PixiJS 2D overworld (583 lines)
  src/screens/LadderScreen.jsx     — Tournament ladder display (57 lines)
```

---

## Session 9 — Hub Pivot: Three.js → 2D Canvas

### Why the pivot

The sprint spec (`AMA_Sprint_Hub_Economy.md`) and design system (`AMA_Design_System.md`) both specify a **2D top-down dungeon-crawl** hub, not a 3D first-person one. The design intent is that the contrast between walking a dark 2D pixelated station and then stepping through a door into a 3D Pokémon-style arena IS the dramatic reveal. A 3D-to-3D transition loses that. Additionally, a 3D hub requires art/technical investment (textures, lighting tuning, environment modeling) that doesn't serve the game's core loop.

### What was built

#### HubWorld2D.jsx (~270 lines)
New 2D Canvas hub replacing the Three.js version:

- **HTML5 Canvas 2D context** — no 3D library dependency
- **30x20 tile map** with walls, floor, west alcove (Vex), east alcove (Helix)
- **Dark sci-fi floor** (`#0b1018`) with subtle cyan grid lines at 4% opacity
- **Wall panels** (`#0a1220`) with `#1a2838` borders
- **WASD movement** with pixel-based sliding collision (10x10 hitbox, checks 4 corners against tile grid)
- **Camera follows player** (player stays centered, world scrolls)
- **Canvas rendered at 2x scale** with `image-rendering: pixelated`

**Arena doors (4):**
- Along north wall (row 1), spaced across corridor
- Dark recessed rectangles with colored glow strips at threshold
- Green = cleared, cyan = next (pulses via `sin(Date.now())`), dark gray = locked
- Labels: A1, A2, A3, A4

**NPCs (2):**
- Dr. Helix (east alcove, green radial glow, bobbing animation, nameplate)
- Cmdr. Vex (west alcove, purple radial glow, bobbing, nameplate)
- Simple pixel figures: head block + body block

**Terminals (2):**
- Codex Terminal (cyan, main corridor)
- Supplies (amber, main corridor)
- Box with glowing screen panel and label

**Interaction:**
- Proximity check each frame against all interactables
- `[E] Target Name` prompt with cyan pulse animation
- Pressing E fires `onInteract(type)` — same callback system as the Three.js hub
- Locked doors (beyond current progress) show no prompt

**HUD overlay (React DOM):**
- `// orbital station — run #N` (top-left)
- W/L record + arena progress (top-right)
- `[E] target` interact prompt (bottom-center)
- `wasd move / e interact` (bottom-left)

**Canvas dims + blurs** when hub overlay is active (doctor/scouting/codex/supplies)

#### App.jsx updated
- `HubWorld` import → `HubWorld2D`
- All overlay/interaction wiring unchanged — drop-in replacement

#### Three.js removed
- `npm uninstall three`
- **JS bundle: 795KB → 287KB** (63% reduction)
- `HubWorld.jsx` (Three.js) now orphaned

### File changes
```
New:
  src/screens/HubWorld2D.jsx    — 2D Canvas top-down hub (~270 lines)

Modified:
  src/App.jsx                   — HubWorld → HubWorld2D import swap

Removed (dependency):
  three                         — npm uninstalled, bundle -508KB

Orphaned (no longer imported):
  src/screens/HubWorld.jsx          — Three.js first-person hub (350 lines)
  src/screens/OverworldScreen.jsx   — PixiJS 2D overworld (583 lines)
  src/screens/LadderScreen.jsx      — Tournament ladder display (57 lines)
```

---

## What's Implemented vs. What's Remaining

### Fully Implemented
- [x] Resource pools (20/20/25/10)
- [x] Progressive disclosure tutorial (first fight only)
- [x] Counter-mechanic opponents (Echomorph, Hydravine, Parasitex)
- [x] Mutation scar system
- [x] Meta-progression (codex, run tracking, NPC dialogue)
- [x] Mutation HP pools and destruction
- [x] Parasitex graft steal
- [x] Target select phase (BODY vs mutation targeting)
- [x] Mutation weakness system (2x damage)
- [x] Secondary resource chip (25%)
- [x] AI weakness-aware mutation targeting
- [x] Fog of war on opponent mutation HP
- [x] Console diagnostics for debugging
- [x] Pokemon-style over-the-shoulder battle view (3D arena via BattleArena.jsx)
- [x] Spritesheet animation hook + AnimatedSprite component (scaffold, awaiting Aseprite exports)
- [x] Dark sci-fi terminal design system (Share Tech Mono, sharp edges, scanlines, full dark palette)
- [x] 2D top-down hub world (Canvas, WASD, tile collision, NPCs, doors, terminals)
- [x] Hub overlay architecture (doctor/scouting/codex/supplies as overlays on dimmed canvas)
- [x] Codex terminal in hub (species encounter tracking)
- [x] Supplies terminal in hub (inventory viewer)

---

## Session 10 — Design System Components + Pixi.js Compositor

### What was built

#### Full Design System Component Patterns (AMA_Design_System.md)
**index.css expanded** with all component patterns from the design system spec:

- **Panel/Card system:** `.panel`, `.card`, `.card.selected` with double-border glow effect
- **Section headers:** `.section-header` with `::before { content: '// ' }` convention, accent color variants
- **Resource bars:** `.res-row` with `.res-label` (GRD/CMP/BDY/STM abbreviations), `.res-bar-bg`, `.res-fill`, `.res-val` — color-coded per resource type
- **Mutation slots:** `.mut-slot` (28x28px compact slot boxes with mini HP bars)
- **Move type badges:** `.move-badge.power`, `.psychic`, `.area`, `.grab`, `.defense`, `.finisher`, `.evasion`, `.fast` — each with distinct bg/text/border colors
- **Tab navigation:** `.tab-nav`, `.tab`, `.tab.active`, `.tab-body` — for Doctor screen 4-tab layout
- **Action buttons:** `.btn`, `.btn.graft`, `.btn.danger` — transparent border style with hover fills
- **Status badges:** `.badge-ready`, `.badge-new`, `.badge-locked`, `.badge-weak`
- **NPC dialogue bar:** `.npc-bar` with colored left border (green=Helix, purple=Vex)
- **Move cards:** `.move-card` with hover/selected states, `.move-grid` (5-column layout)
- **Stamina push track:** `.push-track` with `.push-seg.filled` (10-segment glowing bar)
- **Character preview:** `.char-preview` with `.slot-indicator`, `.slot-mutation` for Doctor screen body map

#### Pixi.js v8 Character Compositor
**New file: `src/rendering/CharacterCompositor.js`** — layered sprite composition engine:

- Layer system: back, base, legs, chest, leftArm, rightArm, head, techGlow (rendered back-to-front)
- `loadBase(spritePath)` — loads species base sprite with nearest-neighbor scaling
- `attachMutation(slot, path)` — overlays mutation sprite at species-specific slot offset
- `addTechGlow(slot)` — additive blend glow behind enhanced mutations
- `flashHit(duration)` — brightness(2) filter on damage
- `shake(intensity, duration)` — decaying random horizontal shake
- `destroyMutation(slot)` — particle fragment VFX (5 fragments with gravity + fade)
- `animateLunge(compositor, dx, dy)` — quick 40% out / 60% return attack motion
- Compatible with Pixi.js v8 API (`texture.source.scaleMode`, `blendMode: 'add'`, async `app.init()`)

#### Slot Offsets Data
**New file: `src/data/slotOffsets.js`:**
- `SLOT_ORDER` — render order array
- `BODY_SLOTS` — slot metadata (label, abbreviation)
- `SLOT_OFFSETS` — per-species, per-view (front/back) pixel offsets for all 6 body slots
- All 7 species covered (4 playable with front+back, 3 opponent-only with front)

#### BattleArena Upgraded to Pixi.js
**`src/components/BattleArena.jsx` rewritten** — replaces static `<img>` tags:
- Pixi.js v8 async initialization (`app.init()`)
- Player composite (back view, bottom-left, scale 2.5) + Opponent composite (front view, top-right, scale 1.8)
- Mutation overlays attached from `playerBuild.slots` and `opponentBuild.slots`
- Idle bob animation on Pixi ticker
- Attack lunge, hit flash/shake driven by `playerAnimState`/`opponentAnimState` props
- Mutation destruction VFX via `destroyedSlot` prop
- Graceful fallback when mutation sprites don't exist yet (missing PNGs handled)

#### CharacterPreview Component (CSS-based)
**New file: `src/components/CharacterPreview.jsx`:**
- Pure React DOM composition (no Pixi.js) for Doctor screen body slot preview
- Base sprite + mutation overlays positioned via CSS absolute + slot offsets
- Empty slot indicators with abbreviation labels
- Highlighted slot state (cyan border + brightness boost)
- `onError` handler hides missing mutation sprites gracefully

#### Build Data Model Wired
- `playerBuild` state derived from mutations in both `App.jsx` (for Doctor) and `FightScreen.jsx` (for BattleArena)
- `opponentBuild` derived from `oppMutationHP` in FightScreen
- Build model: `{ slots: { head: { mutation: 'mutId', tech: [] }, ... } }`
- Doctor screen receives `playerSpecies` and `playerBuild` props for CharacterPreview

### File changes
```
New:
  src/data/slotOffsets.js              — Slot offsets per species, BODY_SLOTS constants
  src/rendering/CharacterCompositor.js — Pixi.js v8 layered sprite compositor
  src/components/CharacterPreview.jsx  — CSS-based body slot preview for Doctor screen
  src/assets/mutations/                — Empty dir, ready for mutation overlay PNGs

Modified:
  src/index.css                        — Added all design system component patterns (~200 lines)
  src/components/BattleArena.jsx       — Rewritten from static <img> to Pixi.js v8 canvas
  src/screens/FightScreen.jsx          — Added playerBuild/opponentBuild derivation, updated BattleArena props
  src/screens/DoctorScreen.jsx         — Added CharacterPreview, accepts playerSpecies/playerBuild props
  src/App.jsx                          — Added playerBuild useMemo, passes to DoctorScreen
  package.json                         — Added pixi.js dependency

Dependencies:
  + pixi.js v8.17.1
```

---

## Session 11 — Combat Engine, Progression & AI Spec Implementation

### What was built

Implemented the three core spec documents (`ama-combat-engine.md`, `ama-progression-mutations.md`, `ama-ai-behavior.md`) across 9 source files.

#### Characters — Combat Stats (characters.js)

All 7 species now have `stats: { attack, defense, willpower, toughness }`:

| Species | Attack | Defense | Willpower | Toughness |
|---|---|---|---|---|
| Cyber Gorilla | 75 | 50 | 30 | 50 |
| Psycho Squid | 35 | 30 | 75 | 40 |
| Bee Swarm | 60 | 25 | 40 | 55 |
| Terror Pin Turtle | 40 | 75 | 20 | 65 |
| Echomorph | 50 | 50 | 50 | 50 |
| Hydravine | 45 | 55 | 45 | 60 |
| Parasitex | 60 | 45 | 35 | 55 |

**Parasitex moves redesigned:**
- `parasite_drain` → `parasite_lunge` (FAST, beats power/finisher — enables Assimilate on matchup wins)
- `nerve_web` → `nerve_tap` (PSYCHIC, composure chip)
- `shell_crack` → `chitin_rend` (POWER, guard damage)
- NEW: `cocoon` (DEFENSE, heals 2 Body while blocking)
- NEW: `parasitic_bloom` (FINISHER, base 6 + 2 per stolen mutation, requires stolen mutation)

**Hydravine moves redesigned:**
- `spore_burst` → `spore_cloud` (AREA, composure, effect: `ghostMove` — creates fake move on player menu)
- NEW: `root_drain` (GRAB, body, effect: `lifeSteal` — heals 30% of damage dealt)

**Echomorph moves expanded:**
- NEW: `null_pulse` (AREA, body — always used Turn 1)
- Existing echo moves retained for copycat system

#### Full 25-Mutation Catalog (mutations.js)

Expanded from 16 to 25 mutations. Every mutation now has:
- `hp` — explicit HP value (8-15, boss mutations at 15)
- `shieldFor` — which resource this mutation absorbs damage for (`guard`, `composure`, `body`, `stamina`)
- `weakness` / `resistance` — type weakness (+50% damage) and resistance (-25% damage)
- `attrMod` — stat modifiers when grafted (e.g., `{ attack: 0.15, willpower: -0.05 }`)

**New species mutations added:**

| Mutation | Species | Slot | HP | Shield | Effect |
|---|---|---|---|---|---|
| Iron Knuckles | Gorilla | arms | 12 | guard | Adds Heavy Strike (POWER, base 3) |
| Thick Skull | Gorilla | head | 8 | composure | -2 Composure damage |
| Barrel Chest | Gorilla | chest | 12 | body | +5 Body max |
| Ground Stomp | Gorilla | legs | 10 | stamina | Adds Tremor (AREA, splash) |
| Tentacle Graft | Squid | arms | 12 | guard | Adds Tentacle Whip (GRAB) |
| Psionic Lobe | Squid | head | 8 | composure | -3 Composure damage |
| Chromatophore Skin | Squid | chest | 10 | body | Peek next move once/fight |
| Jet Siphon | Squid | legs | 10 | stamina | +2 Stamina max |
| Stinger Arms | Bee | arms | 10 | guard | Adds Venom Jab (FAST, DoT) |
| Hive Mind Node | Bee | head | 8 | composure | +1 stamina regen on Bee mutation death |
| Honeycomb Plating | Bee | chest | 10 | body | Body shield |
| Wing Cluster | Bee | legs | 8 | stamina | Adds Buzz Dodge (+2 stamina on dodge) |
| Shell Gauntlets | Turtle | arms | 12 | guard | +3 Guard max |
| Iron Dome | Turtle | head | 10 | composure | -1 ALL incoming damage |
| Shell Plate | Turtle | chest | 15 | body | -25% physical to this mutation |
| Anchor Legs | Turtle | legs | 12 | stamina | +3 Stamina max, adds Root Stance |
| Adaptive Membrane | Echomorph | chest | 15 | body | 30% resistance after 2 same-type hits |
| Mirror Reflex | Echomorph | arms | 15 | guard | Once/fight: lost matchup still lands at 50% |
| Echo Core | Echomorph | head | 15 | composure | See opponent move 0.5s before hidden |
| Regenerative Membrane | Hydravine | chest | 15 | body | +1 to most damaged resource/turn |
| Thorn Bark | Hydravine | arms | 15 | guard | Reflect 2 Body on block |
| Root Network | Hydravine | legs | 15 | stamina | +2 regen when Entangled |
| Parasitic Link | Parasitex | head | 15 | composure | Life steal (1 Body heal on Body damage) |
| Chitin Exoframe | Parasitex | chest | 15 | body | -1 ALL incoming damage |
| Assimilation Tendril | Parasitex | arms | 15 | guard | Temp copy destroyed opponent mutation |

#### Full 8×8 Matchup Chart (matchups.js)

Replaced the simpler type chart with the spec's full matrix:

| | POWER | FAST | GRAB | PSYCHIC | AREA | DEFENSE | EVASION | FINISHER |
|---|---|---|---|---|---|---|---|---|
| **POWER** | — | Lose | — | — | — | — | Win | — |
| **FAST** | Win | — | Lose | Win | Lose | Lose | — | Win |
| **GRAB** | — | Win | — | — | — | Win | Lose | — |
| **PSYCHIC** | — | Lose | — | — | — | Win | — | — |
| **AREA** | — | Win | — | — | — | Lose | Win | — |
| **DEFENSE** | — | Win | Lose | Lose | Win | — | — | — |
| **EVASION** | Lose | — | Win | — | Lose | — | — | Win |
| **FINISHER** | — | Lose | — | — | — | — | Lose | — |

Key new interactions: GRAB beats FAST, AREA beats FAST, DEFENSE beats AREA, FAST beats PSYCHIC.

#### Economy & Tech System (constants.js)

**Prize money per fight:**
| Fight | Prize | Cumulative |
|---|---|---|
| 1 | 200 | 200 |
| 2 | 400 | 600 |
| 3 | 700 | 1,300 |
| 4 | 0 | — |

**Tech Points:** 10 per run capacity. Between-fight Body heal changed from +10 to +5 (matches spec).

**17 Tech Enhancements defined:**

*Offensive:* Plasma Coating (200cr/2tp, +1 base dmg), Venom Injector (300cr/2tp, DoT), Neural Scrambler (400cr/3tp, +1 Composure chip)

*Defensive:* Titanium Reinforcement (200cr/2tp, +5 mutation HP), Shock Plating (150cr/1tp, 1 Body reflect), Auto-Repair Nanites (500cr/3tp, +1 mutation HP/turn)

*Utility:* Quick-Release (150cr/1tp, -1 stamina cost), Tracking Software (300cr/2tp, anti-evasion), Overclock (500cr/3tp, use move twice once/fight)

*Passive:* Momentum Capacitor (Gorilla, 400cr/3tp), Paranoia Amplifier (Squid, 400cr/3tp), Sting Synthesizer (Bee, 300cr/2tp), Tax Collector (Turtle, 300cr/2tp)

*Starter Techs (one per species, 200cr/2tp):*
- Rocket Fist: Gorilla Punch → Rocket Punch (split Guard + Body)
- Synapse Swap: Mind Spike → Synapse Spike (swaps 2 opponent moves)
- Hive Thrusters: Sting Barrage → Thruster Barrage (hits twice, half each)
- Spike Plating: Shell Block → Spike Shell (reflects stamina push as Body dmg)

#### New Damage Formula (FightScreen.jsx)

Replaced `baseDamage × staminaPush × matchupMult` with spec formula:

```
STEP 1: raw = baseDamage × staminaPush × (attackerAttack / 50)
STEP 2: reduced = raw × (50 / defenderDefense)    [or Willpower for PSYCHIC]
STEP 3: Mutation armor check with weakness (+50%), resistance (-25%), grab (+50%)
        Armor break: overkill passes through to resource
        Finishers bypass mutations, hit Body direct
STEP 4: Special mechanics (see below)
STEP 5: Random variance × 0.85-1.0
```

#### Special Combat Mechanics (FightScreen.jsx)

7 new mechanics implemented in `resolveTurn`:

| Mechanic | Trigger | Effect |
|---|---|---|
| **Rocket Fist (splitPierce)** | `guard+body` target | Splits damage evenly between Guard and Body, each checked against mutation armor |
| **Hive Thrusters (doubleHit)** | `doubleHit` effect | Runs damage twice at half each, each hit checked independently |
| **Spike Shell (spikeReflect)** | Opponent attacks while Spike Shell active | Opponent takes their own stamina push as Body damage |
| **Synapse Swap** | Synapse Spike hits + wins matchup | 2 random opponent moves swapped (persistent) |
| **Grab Bonus** | Any GRAB type vs mutation | +50% damage to mutation HP (stacks with weakness = ×2.25) |
| **Area Splash** | `areaSplash` effect | Primary target takes full damage + 1 damage to random alive mutation |
| **Venom DoT** | `venomDot` effect on hit | Applies X Body damage/turn for N turns (tracked in `playerDots`/`oppDots`) |

#### New Status Effects (FightScreen.jsx)

| Effect | Source | Duration | Implementation |
|---|---|---|---|
| **Entangled** | Hydravine Vine Grasp (every 3 turns) | 2 turns | All moves +1 cost, evasion disabled |
| **Ghost Move** | Hydravine Spore Cloud (on hit) | 1 turn | Fake move appears on player menu; selecting it wastes turn |
| **Venom DoT** | Bee Venom Jab / Venom Injector | 2-3 turns | X Body damage per turn end |
| **Parasitex Assimilate** | Parasitex wins matchup | Instant | 2× damage to targeted mutation, 0 to resources |
| **Cocoon Heal** | Parasitex Cocoon | Instant | +2 Body while blocking |
| **Life Steal** | Hydravine Root Drain | On hit | Heal 30% of damage dealt |
| **Parasitic Bloom** | Parasitex finisher | On conditions met | Base 6 + 2 per stolen mutation |

New state variables: `playerEntangled`, `oppEntangled`, `vineGraspTimer`, `playerDots`, `oppDots`, `ghostMove`, `playerSwappedMoves`, `oppSwappedMoves`, `echoResistance`, `parasitexStolenCount`, `playerMoveHistory`, `oppIntent`.

#### AI Overhaul (AIEngine.js)

**Full rewrite** replacing simple per-species weights with spec's decision architecture:

**Difficulty Scaling:**

| Fight | Difficulty | Behaviors |
|---|---|---|
| 1 | Easy | 50% random moves, never pushes >min+2, 30% fake finisher attempts, no pattern reading |
| 2 | Moderate | Full archetype weights, personality-based push, correct finisher use |
| 3 | Hard | Pattern reading (last 3 moves), counter repeated patterns 70%, prioritize teched mutations |
| 4 (Parasitex) | Boss | Three-phase AI, full pattern reading, heavy pushes |

**Decision Flowchart (universal, fires in order):**
1. Finisher conditions met? → 80% use it (70% at easy, 100% push heavy at hard+)
2. Body < 30%? → 50% defensive, 50% desperate attack
3. Opponent broken resource? → 60% exploit (skip at easy)
4. Opponent repeated move 2+ times? → 70% counter (hard/boss only)
5. Mutation targeting (species-weighted chance)
6. Boss-specific AI (if applicable)
7. Archetype-weighted move selection

**Boss-Specific AI:**

*Parasitex (3-phase):*
- Phase 1 (turns 1-5): FAST moves 50% (wins vs POWER/FINISHER for Assimilate), moderate push 3-4
- Phase 2 (turns 6-12): Stolen moves 20%, Cocoon when Body <17, push 4-6
- Phase 3 (turns 13+): Parasitic Bloom 70% when conditions met, bruiser mode, push 6-10

*Hydravine:*
- Root Drain 60% when Body <20 (life steal priority)
- Spore Cloud 40% when player repeats moves (ghost move punishment)
- Bloom Crush 50% when opponent Guard <10
- Default alternates Vine Lash / Thorn Barrage

*Echomorph:*
- Turn 1: always Null Pulse at 3 push
- Turn 2+: 80% copy opponent's last move type, mirror their previous push amount
- Fallback: Shatter Copy 20%

**Intent System:**

AI returns intent with each decision: `attacking`, `defending`, `targeting`, `setup`, `finishing`.

Intent display accuracy by difficulty:
| Difficulty | Accuracy | Feint Chance |
|---|---|---|
| Easy | 100% | None |
| Moderate | 90% | 10% wrong intent |
| Hard | 80% | 20% feint |
| Boss | 75% | 25% deliberate misdirection |

Intent displayed as colored badge next to opponent name during MOVE_SELECT:
- ⚔ ATK (red) — attacking
- 🛡 DEF (blue) — defending
- ⊕ TGT (amber) — targeting mutation
- ⚙ SET (green) — setup/utility
- ☠ KILL (red) — finisher incoming

#### Economy Wiring (App.jsx)

- `credits` state: tracks prize money earned per fight
- `techPoints` state: tracks tech capacity usage
- `playerTech` state: array of installed tech enhancement IDs
- Prize money awarded in `handleFightEnd` after win
- `fightNumber` (currentArena + 1) passed to FightScreen for difficulty scaling
- `playerTech` passed to FightScreen for tech effect resolution
- Supplies overlay updated to show Credits and Tech Points
- Hub runState expanded with `credits` and `techPoints`

#### Bug Fix: Item Consumption

Fixed `onItemUsed` removing ALL copies of same item ID. Now uses `findIndex` to remove only the first matching item.

### File changes
```
Modified:
  src/data/characters.js    — Added stats to all 7 species, redesigned Parasitex/Hydravine/Echomorph moves
  src/data/mutations.js     — Full 25-mutation catalog with hp/shieldFor/resistance/attrMod, helper functions
  src/data/matchups.js      — Full 8×8 MATCHUP_CHART, expanded TYPE_REASONS and TYPE_MATCHUPS
  src/data/constants.js     — Prize money, tech capacity, 17 TECH_ENHANCEMENTS, body heal +5, getAvailableTech()
  src/screens/FightScreen.jsx — New damage formula, 7 special mechanics, 7 status effects, intent display, new state vars
  src/engine/AIEngine.js    — Full rewrite: difficulty scaling, decision flowchart, 3 boss AIs, intent system, getIntentDisplay()
  src/App.jsx               — Credits/techPoints/playerTech state, prize money, fightNumber prop, item bug fix
```

---

## What's Implemented vs. What's Remaining

### Fully Implemented
- [x] Resource pools (20/20/25/10)
- [x] Progressive disclosure tutorial (first fight only)
- [x] Counter-mechanic opponents (Echomorph, Hydravine, Parasitex)
- [x] Mutation scar system
- [x] Meta-progression (codex, run tracking, NPC dialogue)
- [x] Mutation HP pools and destruction
- [x] Parasitex graft steal + 3-phase boss AI
- [x] Target select phase (BODY vs mutation targeting)
- [x] Mutation weakness (+50%) and resistance (-25%) system
- [x] Grab +50% damage to mutation HP
- [x] Armor break overkill (overflow → resource)
- [x] Finishers bypass mutations (direct Body)
- [x] Area splash (1 damage to random mutation)
- [x] AI weakness-aware mutation targeting
- [x] Fog of war on opponent mutation HP
- [x] Console diagnostics for debugging
- [x] Pokemon-style over-the-shoulder battle view (Pixi.js v8 canvas with layered compositor)
- [x] Spritesheet animation hook + AnimatedSprite component (scaffold, awaiting Aseprite exports)
- [x] Dark sci-fi terminal design system (full component patterns, move badges, push track, resource bars)
- [x] 2D top-down hub world (Canvas, WASD, tile collision, NPCs, doors, terminals)
- [x] Hub overlay architecture (doctor/scouting/codex/supplies as overlays on dimmed canvas)
- [x] Codex terminal in hub (species encounter tracking)
- [x] Supplies terminal in hub (inventory viewer with credits/tech display)
- [x] Slot data model (BODY_SLOTS, slotOffsets per species, playerBuild state)
- [x] Pixi.js character compositor (layered mutations, tech glow, hit/shake/destroy VFX)
- [x] Doctor screen character preview (CSS-based body slot visualization)
- [x] Combat stats per species (Attack/Defense/Willpower/Toughness)
- [x] Full damage formula (Attack/50, 50/Defense, Willpower for psychic, ×0.85-1.0 variance)
- [x] Full 8×8 matchup chart
- [x] Full 25-mutation catalog (4 per standard species + 3 per boss species)
- [x] 7 special combat mechanics (Rocket Fist, Hive Thrusters, Spike Shell, Synapse Swap, Area Splash, Venom DoT, Ghost Move)
- [x] Status effects (Entangle, Venom DoT, Ghost Move, Synapse Swap, Cocoon Heal, Life Steal, Assimilate)
- [x] AI difficulty scaling (easy/moderate/hard/boss by fight number)
- [x] AI decision flowchart (finisher → survival → exploit → pattern → target → boss → archetype)
- [x] AI pattern reading (hard/boss: counter repeated moves)
- [x] Boss-specific AI (Parasitex 3-phase, Hydravine Root Drain/Spore Cloud/Vine Grasp, Echomorph copycat+mirror)
- [x] Enemy intent system with accuracy decay by difficulty
- [x] Prize money system (200/400/700 per fight)
- [x] Tech enhancement catalog (17 techs defined in constants.js)
- [x] Starter tech move transformations (Rocket Fist, Synapse Swap, Hive Thrusters, Spike Plating)
- [x] Credits + Tech Points economy state in App.jsx
- [x] Item consumption bug fixed (removes only first matching copy)
- [x] Slot normalization (arms → leftArm compositor mapping)
- [x] Ark NPC in hub (RK-7 "Ark", amber glow, tech merchant)
- [x] Tech shop overlay (browse + buy tech with credits/tp)
- [x] Doctor Enhance tab (per-slot tech installation UI)
- [x] Tech purchase wiring (credits deducted, tech points tracked, installed on slot)
- [x] Mutation removal cascades to remove installed tech
- [x] playerBuild attaches tech to compositor slots

### Not Yet Implemented (from Prompts New)
- [ ] Harvest screen redesign (ADD/REPLACE cards with slot selection, skip option)
- [ ] Safe vs Free mutation removal (with random negative effects)
- [ ] Mutation Sealant item (protect mutation for 3 turns)
- [ ] Squid Paranoia corrupting target display
- [ ] Tournament bracket display in hub
- [ ] Hub ambient polish (wall panel details, alcove shading, NPC glow pulse)
- [ ] Art assets (54 sprites, VFX, arenas, UI — Scenario.gg pipeline, 11/54 generated)
- [ ] Mutation overlay sprites (Batch 3: 8 front + 8 back — prompts written, ready for Scenario)
- [ ] Aseprite frame animations (idle, attack, hit, KO) for all species
- [ ] Slot offset visual tuning tool (dev-only)
- [ ] Mutation catalog (research terminal)
- [ ] Stat modifiers applied from mutation attrMod when grafted
- [ ] Echomorph adaptive resistance tracking applied to damage reduction
- [ ] Mirror Reflex / Echo Core / Chromatophore Skin active effects in combat
- [ ] Tech enhancement effects applied in combat (Plasma Coating, Venom Injector, etc.)
- [ ] Starter tech move transformation on purchase (replace move in playerMoves)
- [ ] Clean up orphaned files (HubWorld.jsx, OverworldScreen.jsx, LadderScreen.jsx)
- [ ] Remove console.log diagnostics for production

---

## Session 12 — Tech Shop, Doctor Enhance Tab, Ark NPC

### What was built

Work done between sessions (2026-03-23 → 2026-03-25) to wire up the tech enhancement purchase system and add the Ark NPC to the hub.

#### Slot Normalization (App.jsx)

`SLOT_TO_COMPOSITOR` mapping added to convert mutation slot names (`arms`) to Pixi.js compositor slot names (`leftArm`). `playerBuild` useMemo now:
- Maps mutations through `SLOT_TO_COMPOSITOR` for correct compositor rendering
- Supports `SHIELD` type mutations alongside `ADD`/`REPLACE`
- Attaches installed tech entries to their corresponding slots (`slots[slot].tech.push(techId)`)

#### Ark NPC in Hub (HubWorld2D.jsx)

New NPC: **RK-7 "Ark"** (Tech Merchant)
- Positioned at col 19, row 13 (right wing, mirrored with Dr. Helix)
- Amber color `#ccaa22` with warm amber glow light source (intensity 0.85, radius 5 tiles)
- Custom ASCII art rendering with bob animation
- Interaction opens tech shop overlay

#### Tech Shop Overlay (App.jsx)

New `hubOverlay === 'techshop'` state shows when interacting with Ark:
- Header: `// rk-7 tech workshop` with amber accent
- NPC dialogue bar: *"Credits talk, customer. Everything else walks."*
- Resource display: Credits + Tech capacity used/remaining
- Lists all 17 `TECH_ENHANCEMENTS` as cards showing:
  - Name, category badge, cost (credits + tech points)
  - "Installed" badge for already-owned tech
  - Grayed out if can't afford
  - Description of effect

#### Doctor Screen Enhance Tab (DoctorScreen.jsx)

DoctorScreen now receives new props: `credits`, `techPoints`, `techCapacity`, `mutations`, `playerTech`, `onBuyTech`, `onGraft`, `onRemoveMutation`.

New **Enhance** tab added to the 4-tab Doctor layout:
- Shows instructions when no body slot selected
- Shows warning when selected slot has no mutation
- Lists already-installed tech on the selected slot
- Shows available tech filtered by species + slot compatibility via `getAvailableTech()`
- Tech cards display cost in credits and tech points, with disabled state for insufficient funds
- Calls `onBuyTech(tech, selectedSlot)` on purchase

New computed values:
- `techBySlot` — maps playerTech into slot-indexed lookup
- `techUsed` — sums all installed tech points
- `techRemaining` — capacity minus used
- `availableTech` — filtered compatible tech for current species + slot

Resource header updated with Tech chip showing `techUsed/techCapacity`.

#### Mutation Removal Cascade (App.jsx)

`onRemoveMutation` handler:
- Removes mutation from `mutations` state
- Removes associated move from `playerMoves`
- **Cascades**: removes any tech installed on that mutation's slot from `playerTech`

### File changes
```
Modified:
  src/App.jsx                  — SLOT_TO_COMPOSITOR, tech shop overlay, Ark interaction, enhanced Doctor props, mutation removal cascade
  src/screens/DoctorScreen.jsx — Enhance tab, tech purchase UI, tech computed values
  src/screens/HubWorld2D.jsx   — Ark NPC (RK-7), amber light source, custom rendering
```

---

## Session 3 — Sprites, Mutations, Tech Visuals, Items Rework, Victory/Defeat Screens

### What was built

#### Pixi v8 Sprite Migration
- Converted `CharacterCompositor.loadBase()` and `attachMutation()` from deprecated sync `PIXI.Texture.from()` to async `PIXI.Assets.load()` for Pixi v8 compatibility
- Changed sprite anchor from center (0.5, 0.5) to bottom-center (0.5, 1.0) so feet align with `CHAR_GROUND_Y`
- Reduced character scale from 1.0 to 0.85 on the 960x540 canvas
- Updated `BattleArena.jsx` to `await` all sprite loading with `Promise.all` for mutations

#### Base Character Sprites (11 PNGs)
All 7 species processed from 928x1232 originals to 120x160 RGBA with flood-fill background removal (per-sprite tuned tolerance 50-70). Dark gritty art style preserved — rejected the 2048x2048 "v2" versions which had completely different aesthetics.

Files in `src/assets/sprites/`:
- cyberGorilla_front.png, cyberGorilla_back.png
- psychoSquid_front.png, psychoSquid_back.png
- beeSwarm_front.png, beeSwarm_back.png
- terrorPinTurtle_front.png, terrorPinTurtle_back.png
- echomorph_front.png, hydravine_front.png, parasitex_front.png

#### Mutation Overlay Sprites (27 PNGs)
Generated all 27 mutation overlays as pixel art with species-specific color palettes, gritty texture, highlight scatter, and glow edges. Sized per body slot (head: 40x36, arms: 32x40, chest: 44x40, legs: 40x32, back: 48x44).

Served from `public/assets/mutations/MUT_{mutationId}_front.png` — matches `getMutationSpritePath()` URL pattern.

Species mutations:
- **Cyber Gorilla (4):** iron_knuckles (metal fist plates), thick_skull (reinforced dome), barrel_chest (ribcage armor), ground_stomp (impact legs)
- **Psycho Squid (4):** tentacle_graft (curling tentacles), psionic_lobe (glowing brain), chromatophore_skin (color-shifting spots), jet_siphon (propulsion tubes)
- **Bee Swarm (4):** stinger_arms (striped venom blades), hive_mind_node (hexagonal hive), honeycomb_plating (chitin hex armor), wing_cluster (insect wings)
- **Terror Pin Turtle (4):** shell_gauntlets (layered shell), iron_dome (concentric dome), shell_plate (scute pattern), anchor_legs (rooted columns)
- **Echomorph (3):** adaptive_membrane (phase-shift colors), mirror_reflex (crystalline shimmer), echo_core (concentric pulse rings)
- **Hydravine (3):** regenerative_membrane (healing veins), thorn_bark (thorny bark), root_network (spreading roots)
- **Parasitex (3):** parasitic_link (tendril mass + core eye), chitin_exoframe (segmented exoskeleton), assimilation_tendril (writhing tendrils)
- **Doctor (2):** adrenaline_glands (bio-tech injector), ink_sacs (squid ink pouches)

#### Tech Enhancement Visual System
Upgraded `addTechGlow()` in CharacterCompositor from a single cyan glow to a category-specific dual-layer system:

| Category  | Color     | Hex      | Alpha | Scale | Pulse Speed |
|-----------|-----------|----------|-------|-------|-------------|
| Offensive | Red       | 0xff4444 | 0.45  | 1.18  | 0.06        |
| Defensive | Blue      | 0x44aaff | 0.35  | 1.22  | 0.03        |
| Utility   | Green     | 0x44ff88 | 0.35  | 1.15  | 0.05        |
| Passive   | Amber     | 0xffaa00 | 0.30  | 1.12  | 0.02        |
| Starter   | Magenta   | 0xff44ff | 0.40  | 1.20  | 0.04        |

Each tech renders: outer glow (scaled +0.08, 40% alpha) + inner glow (category alpha) + floating tech icon above mutation. All glows use additive blend mode with animated pulsing via `requestAnimationFrame`.

#### Tech Icon Sprites (22 PNGs)
Generated 20x20 pixel art icons in `public/assets/tech/`:
- 5 category icons: offensive (red blade), defensive (blue shield), utility (green gear), passive (amber crystal), starter (magenta lightning)
- 17 individual tech icons: plasma_coating, venom_injector, neural_scrambler, titanium_reinforcement, shock_plating, auto_repair_nanites, quick_release, tracking_software, overclock, momentum_capacitor, paranoia_amplifier, sting_synthesizer, tax_collector, rocket_fist, synapse_swap, hive_thrusters, spike_plating

BattleArena updated to pass `getTechCategory(techId)` and `techId` to `addTechGlow()`.

#### Items System Rework
Expanded from 4 basic items to 15 items across 4 categories with rarity-based pricing:

**Restore (green):**
- Stamina Serum (common, 1 bio) — +5 Stamina
- Guard Patch (common, 1 bio) — +5 Guard
- Composure Stim (common, 1 bio) — +5 Composure
- Biofoam Canister (uncommon, 2 bio) — +4 Body
- Full Restore (rare, 3 bio) — +3 to all resources

**Buff (amber):**
- Adrenaline Shot (uncommon, 2 bio) — next attack double damage
- Iron Skin Vial (uncommon, 2 bio) — absorbs next 3 incoming damage
- Focus Lens (rare, 3 bio) — next matchup auto-wins

**Disrupt (red):**
- Flash Grenade (common, 1 bio) — opponent deals 0 damage this turn
- Scramble Dart (uncommon, 2 bio) — forces random AI moves for 2 turns
- Corrosive Spray (uncommon, 2 bio) — 2 damage to opponent's weakest mutation

**Tactical (blue):**
- Smoke Bomb (common, 1 bio) — use item without losing your turn
- Mutation Repair Kit (rare, 3 bio) — +5 HP to most damaged mutation
- Scanner Pulse (common, 1 bio) — see opponent's exact move for 3 turns

New FightScreen state: `damageShield`, `guaranteeWin`, `flashBlind`, `scrambleActive`, `revealTurns`. All effects wired into combat resolution, AI decision flow, and matchup resolution. Fixed race condition where old item UI called `setSelectedItem` + `handleItemCommit` in same click (state never updated).

Doctor shop updated: 3 offerings (2 common + 1 uncommon/rare), rarity colors, category border colors, flavor text, icons.

#### Victory Screen (Complete Rewrite)
New `VictoryScreen.jsx` — phased animation with:
- Green radial glow background + scanline overlay
- Gradient text title ("CHAMPION") with drop shadow
- Stats grid: fights won, total turns, avg turns/fight, scars, tech installed
- "NEW PERSONAL BEST" badge
- Defeated opponents with species colors
- Grafted mutations list
- Contextual Commander Vex quotes (flawless, no scars, speed run, veteran, etc.)
- Hover effects on New Run button

#### Defeat Screen (New Component)
Extracted from inline App.jsx to dedicated `DefeatScreen.jsx`:
- Red-tinted radial background + vignette + scanlines
- Glitch effect on title appearance
- Shows killer species name
- Run summary: fights survived, total turns, fight number, scars
- Defeated opponents + mutations at time of death
- Career record grid (runs/wins/losses)
- Contextual Vex quotes based on killer species, fight number, career stats
- "Try Again" button with hover state

### File changes
```
New:
  src/screens/DefeatScreen.jsx                      — Full defeat screen component
  public/assets/mutations/MUT_*_front.png (x27)     — Mutation overlay sprites
  public/assets/tech/TECH_*_icon.png (x22)          — Tech enhancement icons

Modified:
  src/data/items.js                                  — 15 items, 4 categories, rarity, icons, flavor text, helpers
  src/rendering/CharacterCompositor.js               — Async Pixi v8, bottom-center anchor, category-specific addTechGlow with dual glow + icon + pulse animation
  src/components/BattleArena.jsx                     — Async sprite loading, await mutations, getTechCategory pass-through, TECH_ENHANCEMENTS import
  src/screens/FightScreen.jsx                        — New item effects (damageShield, guaranteeWin, flashBlind, scrambleActive, revealTurns, corrosive, repairMutation, freeItem), scramble AI override, focus lens matchup override, scanner reveal display, fixed item use race condition
  src/screens/VictoryScreen.jsx                      — Complete rewrite with phased animation, stats, Vex quotes
  src/screens/DoctorScreen.jsx                       — Rarity-based item pricing, category colors, flavor text, getShopOfferings import
  src/App.jsx                                        — DefeatScreen import, expanded VictoryScreen props (playerSpecies, scars, meta, techCount), DefeatScreen props (killedBy, fightNumber, etc.)
  src/data/spriteMap.js                              — Vite imports for all 11 base sprites
  src/data/slotOffsets.js                            — Per-species slot offsets for mutation positioning
```
