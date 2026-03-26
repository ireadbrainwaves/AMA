# AMA Session 13 — Master Implementation Prompts

**Everything that's designed but not yet wired.**

Run these prompts sequentially in Claude Code. Each prompt is self-contained with full context so the agent knows what exists, what to touch, and what to leave alone.

---

## Prompt 1: Harvest Screen Redesign

### Context

`src/screens/HarvestScreen.jsx` exists but is basic. The design spec calls for a full redesign where combat style affects harvest quality, mutations are presented as cards with slot info, and the player can skip or replace existing mutations (with tech loss warnings).

The fight already tracks `destroyedMutations` and passes kill method data. `mutations.js` has the full 25-mutation catalog with `slot`, `weakness`, `hp`, `shieldFor`, `attrMod` per mutation. `App.jsx` already has `onGraft` and `onRemoveMutation` handlers.

### What to build

**Rewrite `HarvestScreen.jsx`** with these features:

**1. Kill Method Assessment**
- Receive props: `opponentSpecies`, `opponentMutations`, `destroyedMutations`, `killMethod` (string: `'guardBreak'`, `'composureBreak'`, `'attrition'`, `'dominant'`, `'scrappy'`), `fightNumber`
- `killMethod` should be computed in `App.jsx handleFightEnd` based on fight outcome:
  - `dominant` = won in ≤8 turns with player Body > 50%
  - `guardBreak` = opponent Guard was at 0 when fight ended
  - `composureBreak` = opponent Composure was at 0 when fight ended
  - `attrition` = fight lasted 15+ turns
  - `scrappy` = player Body was ≤ 30% at fight end
  - Default fallback: `attrition`

**2. Salvage Assessment**
- Based on `killMethod`, determine which of the opponent's mutations are salvageable vs damaged:
  - `dominant`: all mutations salvageable (1-3 options)
  - `guardBreak`: arms/torso intact, head potentially damaged (50% chance removed)
  - `composureBreak`: head/psychic intact, torso potentially damaged (50% chance removed)
  - `attrition`: everything partially damaged — all available but player only picks from 1-2
  - `scrappy`: only 1 option (random survivor)
- Mutations the player destroyed during combat (`destroyedMutations` array) are NEVER salvageable
- If opponent had no mutations (Fight 1), offer 1 species-default mutation from `mutations.js` using `getSpeciesMutations(opponentSpecies)`

**3. UI Layout (dark sci-fi terminal style)**
- Top: `// harvest bay` section header with green accent
- NPC dialogue bar (green left border): Dr. Helix assessment line based on kill method (use the dialogue from the lore doc — good harvest, bad harvest, first harvest, etc.)
- Mutation cards in a row (1-3 cards):
  - Card shows: mutation name, species origin badge, slot (HEAD/ARMS/TORSO/LEGS), mutation HP, weakness type, the move it grants, `attrMod` preview (e.g., "+15% ATK, -5% WILL")
  - If the player already has a mutation in that slot: show a REPLACE warning — "Replaces [existing mutation]. Tech on that slot will be lost." with the existing mutation shown dimmed below
  - If slot is empty: show "NEW GRAFT" badge
  - Card has a "HARVEST" button
- Bottom: "SKIP — Return to hub empty-handed" button
- After selection: brief confirmation — "Grafting [mutation name] to [slot]..." then transition back to hub

**4. Wiring in App.jsx**
- `handleFightEnd` computes `killMethod` from fight result data and passes it to HarvestScreen
- On harvest: call existing `onGraft(mutation)` which adds mutation + move to player state
- On skip: return to hub directly
- If replacing: call `onRemoveMutation(existingSlot)` first (cascades tech removal), then `onGraft(newMutation)`
- After Fight 4 (final fight), skip harvest entirely — go to VictoryScreen

**Files to modify:**
- `src/screens/HarvestScreen.jsx` — full rewrite
- `src/App.jsx` — add `killMethod` computation in `handleFightEnd`, pass new props to HarvestScreen

**Do NOT modify:** FightScreen.jsx, mutations.js, DoctorScreen.jsx

---

## Prompt 2: Tech Enhancement Effects in Combat

### Context

`constants.js` defines 17 `TECH_ENHANCEMENTS` with IDs, costs, descriptions. `App.jsx` tracks `playerTech` (array of `{ id, slot }` objects). `FightScreen.jsx` receives `playerTech` as a prop but doesn't use it yet. The damage formula already exists in `resolveTurn` inside FightScreen.

### What to build

**Wire tech effects into FightScreen.jsx `resolveTurn`:**

At the top of `resolveTurn`, compute active tech effects from `playerTech`:

```js
const activeTech = playerTech.map(t => ({
  ...TECH_ENHANCEMENTS.find(e => e.id === t.id),
  slot: t.slot
}));
```

Then apply each tech at the appropriate point in the damage pipeline:

**Offensive techs (apply during player damage calculation):**

| Tech ID | Effect | Where in pipeline |
|---|---|---|
| `plasma_coating` | +1 to base damage of moves from the teched slot's mutation | Before stamina multiplication. If the attacking move came from a mutation in the slot that has Plasma Coating, `baseDamage += 1` |
| `venom_injector` | On hit, apply 1 Body damage/turn for 2 turns | After damage resolves, if hit landed and move is from teched slot, push `{ damage: 1, turns: 2 }` to `oppDots` array |
| `neural_scrambler` | On hit, also chip 1 Composure | After primary damage resolves, apply 1 additional Composure damage to opponent |

**Defensive techs (apply during opponent damage calculation against player):**

| Tech ID | Effect | Where in pipeline |
|---|---|---|
| `titanium_reinforcement` | +5 HP to mutation in this slot | At fight initialization, when setting up mutation HP pools, add 5 to the mutation HP for the slot that has this tech |
| `shock_plating` | Attacker takes 1 Body damage when hitting this body part | After opponent damage resolves against a mutation in the teched slot, deal 1 Body damage back to opponent |
| `auto_repair_nanites` | Mutation in this slot regenerates 1 HP per turn | At end of turn, if mutation is alive, heal 1 mutation HP (not above max) |

**Utility techs:**

| Tech ID | Effect | Where in pipeline |
|---|---|---|
| `quick_release` | -1 stamina cost for moves from this slot | When computing move costs in the move select phase, if move is from a mutation in this slot, reduce `minCost` by 1 (min 1) |
| `tracking_software` | Moves from this slot gain advantage vs EVASION | In matchup resolution, if player move is from teched slot and opponent move type is EVASION, treat as a WIN for the player regardless of normal matchup |
| `overclock` | Once per fight, use a move from this slot twice | Add `overclockUsed` state (boolean). In move select, show an "OVERCLOCK" toggle button next to moves from the teched slot. If toggled on and not yet used, the move fires twice in resolveTurn (run damage calc twice). Set `overclockUsed = true` after use. |

**Passive techs (species-specific):**

| Tech ID | Species | Effect |
|---|---|---|
| `momentum_capacitor` | Gorilla | Momentum passive doesn't reset on matchup loss (still resets on defensive move) |
| `paranoia_amplifier` | Squid | Corrupted intent display shows completely wrong type (not just slightly off) |
| `sting_synthesizer` | Bee | Residual Sting passive deals 2 Body/turn instead of 1 |
| `tax_collector` | Turtle | Stamina Tax triggers on opponent push of 2+ instead of 3+ |

**Starter tech move transformations** are already implemented as special mechanics (Rocket Fist splitPierce, Hive Thrusters doubleHit, Spike Shell spikeReflect, Synapse Swap). These fire based on move effect flags — no additional wiring needed.

**Also wire for AI opponent:**
- If the opponent has tech (passed via `opponentTech` prop for Fight 3-4 opponents), apply the same effects in reverse during AI damage calculations
- Fight 1-2 opponents have no tech. Fight 3 may have 1-2 techs. Fight 4 boss has 2-3 techs.

**Implementation notes:**
- Import `TECH_ENHANCEMENTS` from constants.js in FightScreen
- Tech effects stack — a mutation can have multiple techs
- "Move is from this slot" means the move was granted by the mutation occupying that slot. Base species moves (not from mutations) don't benefit from slot-specific tech unless a mutation is in that slot AND the move is associated with it. Check `move.fromMutation` or `move.slot` to determine source.
- Add `fromSlot` property to moves when they're added via mutation graft in App.jsx, so FightScreen can match moves to tech slots

**Files to modify:**
- `src/screens/FightScreen.jsx` — tech effect application in `resolveTurn`, move cost adjustment, overclock UI
- `src/App.jsx` — add `fromSlot` to moves when grafting mutations

**Do NOT modify:** constants.js, DoctorScreen.jsx, AIEngine.js (unless adding opponent tech support)

---

## Prompt 3: Mutation Attribute Modifiers

### Context

`mutations.js` defines `attrMod` on each mutation, e.g., a Gorilla graft has `attrMod: { attack: 1.15, willpower: 0.95 }`. `characters.js` defines base stats per species: `stats: { attack, defense, willpower, toughness }`. The damage formula in FightScreen already uses Attack/Defense/Willpower/Toughness values but currently reads them from the species base stats directly.

### What to build

**1. Computed player attributes in App.jsx**

Add a `useMemo` that computes effective player attributes by applying mutation modifiers to base stats:

```js
const playerAttributes = useMemo(() => {
  const base = { ...selectedSpecies.stats }; // { attack, defense, willpower, toughness }
  
  // Apply each equipped mutation's attrMod
  mutations.forEach(mut => {
    if (mut.attrMod) {
      Object.keys(mut.attrMod).forEach(attr => {
        base[attr] = Math.floor(base[attr] * mut.attrMod[attr]);
      });
    }
  });
  
  return base;
}, [selectedSpecies, mutations]);
```

Pass `playerAttributes` to FightScreen, ScoutingScreen, CharacterSelect, DoctorScreen, HubWorld2D (for HUD display).

**2. FightScreen uses computed attributes**

Replace all references to `playerSpeciesData.stats.attack` (etc.) with the `playerAttributes` prop. The damage formula already does `raw × (Attack / 50)` — just ensure it reads from the computed attributes instead of base stats.

Compute opponent attributes the same way: base species stats + opponent mutation attrMods.

**3. Toughness → Mutation HP bonus**

At fight initialization, when setting mutation HP pools:
- Player mutations: `baseHP + Math.floor(playerAttributes.toughness / 10)`
- Opponent mutations: `baseHP + Math.floor(opponentAttributes.toughness / 10)`

This stacks with Titanium Reinforcement tech bonus.

**4. Display attribute changes**

- **DoctorScreen**: When previewing a graft, show attribute change preview — "ATK: 75 → 86 (+15%), WILL: 25 → 24 (-5%)"
- **HarvestScreen**: Mutation cards show `attrMod` as "+15% ATK, -5% WILL" badges
- **CharacterSelect**: Show base stats as bar chart (already partially done)
- **Hub HUD** (top-left area of HubWorld2D): Show current computed attributes as small stat readout

**5. Scouting screen attribute descriptors**

On ScoutingScreen, show opponent attributes as vague text descriptors instead of numbers:
- 70+ = "DEVASTATING"
- 55-69 = "STRONG"
- 40-54 = "AVERAGE"
- 25-39 = "WEAK"
- Below 25 = "PATHETIC"

Display as: `// combat assessment` section with `ATK: DEVASTATING | DEF: AVERAGE | WILL: PATHETIC | TGH: STRONG`

**Files to modify:**
- `src/App.jsx` — computed `playerAttributes` useMemo, pass as prop
- `src/screens/FightScreen.jsx` — use `playerAttributes` prop, compute opponent attributes, Toughness → mutation HP
- `src/screens/DoctorScreen.jsx` — attribute change preview on graft
- `src/screens/HarvestScreen.jsx` — attrMod display on cards
- `src/screens/ScoutingScreen.jsx` — attribute descriptors
- `src/screens/HubWorld2D.jsx` — stat readout in HUD

---

## Prompt 4: Starter Tech Move Transformations on Purchase

### Context

The four starter techs are defined in `constants.js` as `TECH_ENHANCEMENTS` with IDs `rocket_fist`, `synapse_swap`, `hive_thrusters`, `spike_plating`. Each costs 200 credits / 2 tech points. The COMBAT mechanics for these are already implemented in FightScreen (splitPierce, doubleHit, spikeReflect, synapse swap effect). But when the player BUYS one from Ark, the move transformation doesn't actually happen — the old move stays.

### What to build

**In App.jsx `handleBuyTech`** (or create it if it doesn't exist):

When a starter tech is purchased, find and replace the corresponding move in `playerMoves`:

| Tech ID | Original Move | New Move | Changes |
|---|---|---|---|
| `rocket_fist` | `gorillaPunch` | `rocketPunch` | name: "Rocket Punch", effect: `splitPierce`, target: "guard+body" |
| `synapse_swap` | `mindSpike` | `synapseSpike` | name: "Synapse Spike", effect: `synapseSwap` |
| `hive_thrusters` | `stingBarrage` | `thrusterBarrage` | name: "Thruster Barrage", effect: `doubleHit` |
| `spike_plating` | `shellBlock` | `spikeShell` | name: "Spike Shell", effect: `spikeReflect` |

The replacement move should keep the same `type`, `cost`, `baseDamage`, `beats`/`loses` — only change the name, add the effect flag, and update the target if applicable.

Define the transformed moves in `characters.js` alongside the originals (or in a `STARTER_TRANSFORMS` map in constants.js) so the data is centralized.

**Ark dialogue update:**
When viewing a starter tech in the tech shop overlay, if the player's species matches, show Ark's species-specific pitch line (from the lore doc). If species doesn't match, show "Incompatible with your biology, customer."

**Visual feedback:**
After purchase, show a brief flash message in the tech shop: "MOVE TRANSFORMED: Gorilla Punch → Rocket Punch"

**Files to modify:**
- `src/App.jsx` — move transformation logic in tech purchase handler
- `src/data/constants.js` or `src/data/characters.js` — `STARTER_TRANSFORMS` data map

---

## Prompt 5: Tournament Bracket Display

### Context

The hub (`HubWorld2D.jsx`) has a reference to a bracket display area but it's not built as an interactive terminal. The design spec calls for a holographic tournament bracket on the north wall that shows all 4 opponents, their species, visible mutations, and matchup indicators.

### What to build

**1. Bracket Terminal in Hub**

Add a new interactable object in `HubWorld2D.jsx`:
- Position: center of the north wall, between arena doors (row 2, col ~14)
- Visual: wide terminal (3 tiles wide) with cyan glow, labeled "BRACKET"
- Interaction range: 2.5 tiles
- `onInteract('bracket')` triggers the bracket overlay

**2. Bracket Overlay in App.jsx**

New `hubOverlay === 'bracket'` renders a bracket display:

- Header: `// tournament bracket — season [runNumber]`
- 4-fight bracket layout (vertical ladder, Fight 1 at top, Fight 4 at bottom)
- Each bracket slot shows:
  - Arena number (A1-A4)
  - Opponent species name + small species icon/color indicator
  - Status: CLEARED (green), NEXT (cyan pulse), LOCKED (gray)
  - Opponent's visible mutations listed by slot (HEAD/ARMS/TORSO/LEGS) — show mutation name + species origin color
  - Opponent's tech count (if any): "TECH: 2"
  - Matchup indicator vs player species: green ▲ (advantage), red ▼ (disadvantage), yellow — (neutral)
- Player's current build shown on the left side:
  - Species name
  - Current mutations by slot
  - Current tech count
  - Current credits
- Vex commentary at bottom: one-liner about the next fight based on opponent species

**3. Generate bracket data**

In App.jsx, the bracket opponents should be generated at run start and stored in state:
- Fight 1: random standard species, 0 mutations, easy AI
- Fight 2: random standard species (different from Fight 1), 1 mutation, moderate AI
- Fight 3: random standard species or counter-mechanic (50/50), 2 mutations, hard AI
- Fight 4: always Parasitex, 3 mutations + 2-3 tech, boss AI

If the bracket isn't already pre-generated (check existing `handleFightEnd` / arena scheduling), add a `bracketOpponents` state array generated in `startNewRun` or equivalent.

Store each opponent as: `{ species, mutations: [...], tech: [...], difficulty }` so the bracket can display them and the fight can load them.

**Files to modify:**
- `src/screens/HubWorld2D.jsx` — bracket terminal interactable
- `src/App.jsx` — bracket overlay UI, bracket opponent generation, `hubOverlay === 'bracket'`

---

## Prompt 6: Boss Mutation Active Effects

### Context

Three boss species have mutations with active combat effects that are defined in `mutations.js` but not implemented in FightScreen:

- **Echomorph** mutations: Adaptive Membrane, Mirror Reflex, Echo Core, Chromatophore Skin
- **Hydravine** mutations: Regenerative Membrane (already partially wired via Hydravine Regrowth passive)
- **Parasitex** mutations: Parasitic Link (already partially wired via graft steal)

The Echomorph's adaptive resistance tracking is the biggest gap.

### What to build

**Echomorph Adaptive Resistance:**
- Track `echoResistance` state: `{ [moveType]: hitCount }` — how many times each move type has hit the Echomorph
- Each mutation of Echomorph origin reduces damage from a move type by -25% per previous hit of that same type (stacks)
- First hit of any type: full damage. Second hit of same type: -25%. Third: -50%. Cap at -75%.
- Different move types reset to full damage
- Display in combat log: "Echomorph adapts — [TYPE] resistance increased"

**Mirror Reflex (Echomorph arms mutation):**
- When the Echomorph wins a matchup, it copies the player's move type for its next turn (AI already does this via copycat behavior, but the mutation should add a flat +2 damage bonus when mimicking)

**Echo Core (Echomorph torso mutation):**
- Passive: if the Echomorph and player select the same move TYPE in a turn, the Echomorph's version deals +50% damage (resonance bonus)

**Chromatophore Skin (Echomorph head mutation):**
- Once per fight, when the Echomorph drops below 50% Body, it becomes "camouflaged" for 2 turns — all player attacks have a 30% miss chance

**These only apply to Echomorph opponents, not to player-equipped Echomorph mutations** (player gets the passive stat bonus from attrMod, not the active effect — harvested mutations lose their active powers, keeping only the move + stats + weakness).

**Files to modify:**
- `src/screens/FightScreen.jsx` — Echomorph resistance tracking, Mirror Reflex bonus, Echo Core resonance, Chromatophore Skin miss chance

---

## Prompt 7: Intro Lore Sequence

### Context

The game currently goes Character Select → Hub directly. The lore doc specifies a 5-slide intro sequence that plays ONCE on the very first run.

### What to build

**New file: `src/screens/IntroSequence.jsx`**

- 5 slides of Commander Vex's tournament briefing (text provided below)
- Dark background (`#0a0a0f`), green monospace text (`#00ff88`), Share Tech Mono font
- Typewriter effect: ~40 characters/second
- Each slide auto-advances after text completes + 2 second pause, OR player presses any key to advance
- Hold ESC for 1 second to skip entire sequence
- Terminal header: `[TERMINAL DISPLAY — AXIS-9 STATION ARCHIVES]` / `[BRIEFING: TOURNAMENT ORIENTATION]` / `[CLEARANCE: FIGHTER]`
- Final slide ends with `> [BRIEFING COMPLETE]` / `> [PRESS ANY KEY TO ENTER THE HUB]`

**Slide text:**

SLIDE 1 — THE CORRIDOR:
```
> COMMANDER VEX — TOURNAMENT ADDRESS

Four species. One corridor of space.
We found each other about 70 years ago.
Tried diplomacy eleven times.
All eleven ended in fistfights.

The ninth summit lasted four minutes.
I was there for that one. Good times.
```

SLIDE 2 — THE BRAWLS:
```
Fighting never stopped. Couldn't stop it.
Biology doesn't negotiate.

So they moved it off the loading docks
and put a fence around it.
Called it a sport.
Called it the Intergalactic Strongman Tournament.
The Squids hate the name. It stuck anyway.
```

SLIDE 3 — THE TOURNAMENT:
```
I run this thing. Have for 29 years.
One rule: nobody dies in my arena.
Everything else is between you and
whoever's standing across from you.

You win, you come back.
You lose, you walk out.
Or get carried out. Depends on the fight.
```

SLIDE 4 — MUTATIONS:
```
Couple years in, a Squid doctor showed up.
Said he could graft pieces of one species
onto another. I asked if it was safe.
He said "mostly."

It's not safe. The crowds love it.

Beat an opponent, take a piece of them.
By fight four you won't recognize yourself.
That's the point.
```

SLIDE 5 — YOU:
```
You're here now. I don't care why.
Could be glory. Could be science.
Could be you've got nothing better to do.
Doesn't matter.

Pick an arena. Fight what's behind the door.
Win or don't.

I've seen a thousand fighters walk through
this hub. Most of them only walked through once.

Don't waste my time.

> [BRIEFING COMPLETE]
> [PRESS ANY KEY TO ENTER THE HUB]
```

**Wiring in App.jsx:**
- Check `localStorage.getItem('ama_intro_seen')`
- If not seen and `meta.totalRuns === 0`: show IntroSequence after CharacterSelect, before Hub
- On sequence complete: `localStorage.setItem('ama_intro_seen', 'true')`, transition to Hub
- On subsequent runs: skip directly to Hub

**Files to create:**
- `src/screens/IntroSequence.jsx`

**Files to modify:**
- `src/App.jsx` — intro sequence routing

---

## Prompt 8: NPC Lore Dialogue Upgrade

### Context

Vex and Helix have basic functional dialogue. The lore doc provides upgraded lines that add personality and world-building while keeping mechanical teaching intact. Lines marked [LORE] are additions. Lines marked [REPLACE] swap out generic versions.

### What to build

**Update Commander Vex dialogue** in whatever component renders his dialogue (likely App.jsx overlay or a dialogue component):

- First visit (before any fights): Replace generic welcome with:
  "Welcome to Axis-9. I'm Vex. I run this tournament. Twenty-nine years and counting. Try not to lower the average."
- Add lore line after mechanical teaching:
  "Four arenas. Four opponents. Beat them all and your name goes on the wall. The wall isn't long."
- Before Fight 2: "One down. Don't get comfortable. [Next opponent species] has been watching your fight."
- Before Fight 3: "You're still here. That's more than I expected. [Opponent] has two mutations. You should visit the doc."
- Before Fight 4: "Finals. [Opponent] has three grafts and a tech rig. Whatever you've built, I hope it's enough."

**Post-fight Vex lines** (shown as brief terminal popup after fight victory, before harvest):

- After Fight 1: "One. You beat one. Don't celebrate yet."
- After Fight 2: "Halfway. The next two are worse."
- After Fight 3: "Three down. One door left. Whatever's behind it heard you coming."
- After Fight 4 (victory): "..." (2 second pause) → "Huh." → "Your name goes on the wall." → "Don't let it go to your head. The wall isn't that long."

**Opponent-specific Vex lines** (shown after the fight-number line):
- Beat a Gorilla: "You beat a Gorilla. That's not easy. I would know. I used to be one. Technically I still am. It's complicated."
- Beat a Squid: "Squid's down. Good. Those things give me a headache. Literally."
- Beat a Bee: "You beat a Swarm. Twelve thousand individual organisms and you outlasted all of them."
- Beat a Turtle: "You beat a Turtle. I'm impressed. Do you know how hard it is to beat something that genuinely does not care if you hit it?"

**Defeat line:**
- "Get up." → "..." → "Or don't. There's always next season."

**Update Dr. Helix dialogue** in DoctorScreen:

Add harvest-quality-aware lines:
- First harvest: "Oh, you brought me a body! Let me see what's... yes, the [mutation] is intact. Beautiful. Hold still."
- Good harvest (dominant/guardBreak): "You barely touched the [body part]! I can pull three viable grafts off this. Christmas morning for me."
- Bad harvest (scrappy): "You... really went to town on this one, didn't you. I can salvage [one option], maybe. That's it."
- Slot replacement: "That [old mutation] served you well. But it's going in the waste bin if you want this [new mutation]. Along with everything you bolted onto it."

**Scouting screen species flavor text:**

In ScoutingScreen, add a randomly-selected flavor text (1 of 3 variants per species) below the opponent stats. Use the scouting text from the lore doc. Display with slight delay after stats appear.

**Files to modify:**
- `src/App.jsx` — Vex post-fight popup, pre-fight dialogue
- `src/screens/DoctorScreen.jsx` — Helix harvest-quality dialogue
- `src/screens/HarvestScreen.jsx` — Helix assessment line
- `src/screens/ScoutingScreen.jsx` — species flavor text

---

## Prompt 9: Hub Ambient Polish

### Context

`HubWorld2D.jsx` renders a functional but visually sparse hub. The design system specifies additional visual polish.

### What to build

**Wall panel details:**
- North wall: add panel segments between arena doors with faint grid lines (same as floor but at 8% opacity)
- Side walls: add subtle cable/pipe details — horizontal lines at 30% and 70% height, slightly lighter than wall color
- Add faint wall-mounted light strips above each arena door (short horizontal line in the door's color)

**Alcove shading:**
- Vex and Helix alcoves should have darker backgrounds than the main corridor (`#060a10` vs `#0b1018`)
- Add a subtle radial gradient at the alcove entrance — brighter at the NPC, darker at the edges

**NPC glow pulse:**
- Vex's purple glow and Helix's green glow should pulse smoothly (sine wave on intensity, 0.5-1.0 range, ~2 second cycle)
- Ark's amber glow already pulses — match the same timing

**Floor details:**
- Add very subtle scuff marks / wear patterns near arena doors and NPC positions (slightly lighter floor tiles, random placement, generated once per hub load)

**Bracket display visual:**
- The bracket terminal (from Prompt 5) should have a faint holographic effect — slight vertical scanline overlay and a subtle cyan flicker

**Ambient particles (optional, performance permitting):**
- 3-5 slow-drifting dust motes in the main corridor area (tiny 1px dots with slow random movement and low opacity, 10-20% alpha)
- Only render if performance is above 25fps

**Files to modify:**
- `src/screens/HubWorld2D.jsx` — all visual polish additions in the canvas render loop

---

## Prompt 10: Orphaned File Cleanup + Console Log Removal

### Context

Several files are no longer imported but still exist in the codebase. Console diagnostics were added for debugging and should be wrapped for production.

### What to do

**Delete orphaned files:**
- `src/screens/HubWorld.jsx` — Three.js first-person hub (replaced by HubWorld2D)
- `src/screens/OverworldScreen.jsx` — PixiJS 2D overworld (replaced by HubWorld2D)
- `src/screens/LadderScreen.jsx` — Tournament ladder display (replaced by bracket overlay)

**Console log cleanup in FightScreen.jsx:**
- Find all `console.log` calls added for diagnostics (PLAYER INIT, OPPONENT INIT, DAMAGE, AI CHOSE)
- Wrap them in a debug flag: `const DEBUG_COMBAT = false;` at the top of the file
- `if (DEBUG_COMBAT) console.log(...)` — preserves them for future debugging but silences them in normal play

**Do the same for AIEngine.js** — wrap diagnostic logs in `DEBUG_AI` flag.

**Files to delete:**
- `src/screens/HubWorld.jsx`
- `src/screens/OverworldScreen.jsx`
- `src/screens/LadderScreen.jsx`

**Files to modify:**
- `src/screens/FightScreen.jsx` — debug flag wrapper
- `src/engine/AIEngine.js` — debug flag wrapper

---

## Implementation Order

The prompts are numbered in dependency order:

1. **Harvest Screen Redesign** — standalone, no dependencies
2. **Tech Enhancement Effects** — standalone, no dependencies
3. **Mutation Attribute Modifiers** — depends on nothing, but HarvestScreen (Prompt 1) should show attrMod
4. **Starter Tech Move Transformations** — depends on tech purchase flow (already exists)
5. **Tournament Bracket Display** — standalone, but benefits from bracket opponent pre-generation
6. **Boss Mutation Active Effects** — standalone FightScreen work
7. **Intro Lore Sequence** — standalone new screen
8. **NPC Lore Dialogue** — touches multiple files, do after Harvest Screen is done
9. **Hub Ambient Polish** — pure visual, do last
10. **Cleanup** — always last

Prompts 1-3 are the highest impact. Prompts 7-10 are polish. Do 1-3 first, then pick based on energy.

---

## What's NOT in These Prompts (Separate Tracks)

These are intentionally excluded because they're either art pipeline work or future features:

- **Art assets** (43 remaining sprites) — Scenario.gg generation sessions
- **Aseprite frame animations** — manual pixel art work
- **Mutation overlay sprites** — Scenario Batch 3
- **Slot offset visual tuning tool** — dev-only utility
- **Mutation catalog research terminal** — future feature
- **Safe vs Free mutation removal** — future DoctorScreen feature
- **Mutation Sealant item** — future item
- **Squid Paranoia corrupting target display** — future mechanic polish
- **Multiplayer spectating** — future feature
