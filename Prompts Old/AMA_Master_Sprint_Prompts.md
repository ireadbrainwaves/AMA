# AMA: ALIEN MARTIAL ARTS — MASTER SPRINT PROMPT GUIDE

**Every Claude Code prompt needed to build the full prototype**
**Battle System + Overworld + UI/UX + Polish + Deploy**

---

## How to Use

1. Paste the GDD v3 into Claude Code's project context first
2. Fire prompts in order within each phase
3. Test after each prompt before moving on
4. Use emergency fix templates when things break
5. Don't optimize. Don't refactor. Ship ugly code that works.

---

# PART 1: BATTLE SYSTEM

---

## Phase 0: Setup and Strip (Hour 0-1)

**Goal:** Fork Open Mat, strip to clean React/Vite shell, get it running.

### ▶ PROMPT 0.1 — Fork and Strip

```
I'm building a new game called AMA: Alien Martial Arts. It's a two-phase
simultaneous-reveal combat game with a Pokemon-style move menu (NOT a card game).

I'm forking my Open Mat codebase as the starting point. I need you to:

1. Strip out everything related to the card/deck system, UI components for
   card hands, and any card-specific logic.
2. Keep the combat engine core - specifically the position state machine data,
   technique database, and any matchup/resolution logic we can repurpose.
3. Keep the React/Vite project structure, routing, and build config.
4. Clean up package.json - remove unused dependencies.
5. Create a blank FightScreen.jsx component that renders 'AMA Fight Screen'.
6. Make sure the dev server boots with no errors.

Don't add any new features yet. Just strip and clean.
```

### ▶ PROMPT 0.2 — Data Architecture

```
Now set up the core data structures for AMA. Create these files:

src/data/characters.js - Export an object with 4 characters:
  - cyberGorilla, psychoSquid, beeSwarm, terrorPinTurtle
  - Each has: name, description, passive (name + description), killCondition
  - Each has a moves array of 5 objects with:
    { id, name, minCost, baseDamage, target ('guard'|'composure'|'body'|'utility'|
    'evasion'|'defense'|'regen'|'finisher'),
    moveType ('power'|'fast'|'evasion'|'defense'|'psychic'|'area'|'grab'|'finisher'),
    beats: [], losesTo: [], description, notes, isFinisher, finisherCondition }

src/data/matchups.js - Export a function resolveMatchup(moveA, moveB) that
  returns { winner: 'a'|'b'|'both'|'neutral', reason: string }
  Based on the moveType relationships:
    Power beats Evasion (too big to dodge)
    Evasion beats Finisher (dodge the slow blast)
    Fast beats Power (land before the swing)
    Defense beats Fast (absorb quick hits)
    Psychic beats Defense (can't block a thought)
    Area beats Evasion (nowhere to hide)
    Grab beats Defense (pull them out)
    Fast beats Finisher (interrupt the windup)
  If no clear relationship: neutral (both land)

src/data/items.js - Export array of 4 items:
  { id, name, effect, description }
  Items: Stamina Serum (restore 5 stamina), Guard Patch (restore 3 guard),
  Composure Stim (restore 3 composure), Adrenaline Shot (next turn 2x base dmg)

Here are the exact move sets with types:

CYBER GORILLA:
  Gorilla Punch - cost 2, base 2, target guard, type POWER
    beats evasion, loses to fast. "Massive overhead strike. Too big to dodge."
  Chest Slam - cost 2, base 2, target body, type POWER
    beats defense, loses to evasion. "Raw force to the body. Smashes through blocks."
  Ground Pound - cost 3, base 1+1, target guard+composure, type AREA
    beats evasion, loses to psychic. "Shakes the whole arena. Nowhere to hide."
  Iron Grip - cost 2, base 0, utility, type GRAB
    beats defense, loses to fast. "Lock them down. Can't grab what hits you first."
  Primal Rage - cost 5, base 5, finisher body, type FINISHER
    beats power/defense/grab, loses to evasion/fast.
    finisherCondition: opponent guard <= 0
    "Devastating beam. Only the fastest escape."

PSYCHO SQUID:
  Tentacle Lash - cost 2, base 2, target guard, type GRAB
    beats evasion, loses to power. "Tendrils that track you. Can't outrun reach."
  Mind Spike - cost 2, base 2, target composure, type PSYCHIC
    beats defense, loses to fast. "Attacks the mind directly. No guard helps."
  Ink Cloud - cost 1, base 0, evasion, type EVASION
    beats power/finisher, loses to area/grab. "Disappear completely. Fails against wide attacks."
  Neural Bind - cost 3, base 1, target composure, type PSYCHIC
    beats defense, loses to fast. "Psychic grip. Grabs what fists can't."
  Psychic Crush - cost 5, base 5, finisher body, type FINISHER
    loses to fast. finisherCondition: opponent composure <= 0
    "Total mental collapse. Break focus to survive."

BEE SWARM:
  Sting Barrage - cost 1, base 2, target body, type FAST
    beats power/finisher, loses to area. "Faster than power. Scattered by wide hits."
  Scatter - cost 1, base 0, evasion, type EVASION
    beats power/finisher, loses to grab/area. "Disperse instantly. Regroup before grabs land."
  Swarm Pressure - cost 2, base 2, target composure, type AREA
    beats evasion, loses to defense. "Overwhelming numbers. Can't block every angle."
  Pollen Blind - cost 3, base 1, target composure, type PSYCHIC
    beats defense, loses to power/fast. "Cloud their senses. Raw power punches through."
  Death Cloud - cost 4, variable base, finisher body, type FINISHER
    loses to area/fast. finisherCondition: opponent composure <= 0
    damage = total composure damage dealt this fight
    "All the poison at once. Wide attacks disperse it."

TERROR PIN TURTLE:
  Shell Block - cost 1, base 0, defense, type DEFENSE
    beats fast, loses to grab/psychic. "Impenetrable shell. Pull me out if you can."
  Snap Bite - cost 2, base 2 (4 if opponent struck), target body, type FAST
    beats power/finisher, loses to evasion. "Counter snap. Deadly if you swung first."
  Anchor Slam - cost 3, base 2, target guard, type AREA
    beats evasion, loses to defense. "Ground-shaking slam. Can't dodge an earthquake."
  Fortress Mode - cost 2, base 0, regen 3 guard, type DEFENSE
    beats fast, loses to grab/psychic. "Rebuild defenses. Mental fortress holds."
  Tidal Crush - cost 4, base 5, finisher body, type FINISHER
    loses to evasion/fast. finisherCondition: opponent stamina < 3
    "Crushing wave. Only the quick escape."
```

### ✅ TEST: Phase 0 Complete When
- Dev server boots with no errors
- FightScreen.jsx renders
- characters.js exports all 4 characters with complete move data + moveType
- resolveMatchup() returns correct winner for 5 test cases

---

## Phase 1: The Fight Screen (Hour 1-3)

**Goal:** Full fight screen with detailed move menu, simultaneous reveal, stamina push.

### ▶ PROMPT 1.1 — Fight Screen Layout with Detailed Move Menu

```
Build the FightScreen component with a detailed move selection UI.
This is the most important screen in the game.

LAYOUT:
- Top bar: turn counter center, your character name left, opponent name right
- Center area: reveal zone where both moves appear during simultaneous flip
- Bottom: detailed move menu (see below)
- Left sidebar: your resource bars + stamina + passive counter + kill condition
- Right sidebar: opponent resource bars + stamina + passive indicator

RESOURCE DISPLAY (both sides):
  Guard:     [7/10]  ██████░░░░  (blue)
  Composure: [10/10] ██████████  (purple)
  Body:      [9/10]  █████████░  (red)
  Stamina:   [8/10]  ████████░░  (gold)
  
  Your side also shows:
  - Passive name and current state (e.g. "Momentum: 3")
  - Kill condition: "BREAK GUARD → PRIMAL RAGE" (always visible)

MOVE MENU — THIS IS CRITICAL:
The move menu takes up the bottom third of the screen.

Left side: selectable move rows
Right side: detail panel that updates on highlight

EACH MOVE ROW:
  [TYPE BADGE] MOVE NAME              [COST] stamina
  
  Type badges are colored:
  Power = red, Fast = yellow, Evasion = cyan, Defense = blue,
  Psychic = purple, Area = orange, Grab = green, Finisher = gold
  
  Grayed out if not enough stamina (show cost in red)
  Finishers show "LOCKED" if condition not met, glow gold if available

DETAIL PANEL (updates when move row is highlighted/hovered):
  ┌─────────────────────────────────────────┐
  │  GORILLA PUNCH                          │
  │  Type: POWER (red badge)                │
  │  Cost: 2 stamina                        │
  │  Base Damage: 2                         │
  │  Target: GUARD                          │
  │                                         │
  │  "Massive overhead strike. Too big      │
  │   to dodge."                            │
  │                                         │
  │  VS [OPPONENT NAME]:                    │
  │  ✅ Beats: Scatter (evasion)            │
  │  ✅ Beats: Swarm Pressure (defense)     │
  │  ❌ Loses to: Sting Barrage (fast)      │
  │  ❌ Loses to: Pollen Blind (psychic)    │
  │  ⚡ Neutral: Death Cloud (finisher)     │
  │                                         │
  │  DAMAGE PREVIEW:                        │
  │  Min push (2 stam): 4 Guard damage      │
  │  Max push (8 stam): 16 Guard damage     │
  │  Opponent Guard: 7 — need 4 to break    │
  └─────────────────────────────────────────┘

OPPONENT MOVES (toggle with TAB):
Press TAB to flip the detail panel to show opponent's move list:
  [OPPONENT] MOVES:
  ⚡ Sting Barrage   | Fast    | 1 cost | Body
  🎯 Scatter         | Evasion | 1 cost | Dodge
  💥 Swarm Pressure  | Area    | 2 cost | Composure
  🔮 Pollen Blind    | Psychic | 3 cost | Composure
  🔥 Death Cloud     | Finish  | 4 cost | Body
TAB again to flip back to your move detail.

ITEMS:
Separate button/row at bottom of move list: "ITEMS (X/3)"
Clicking opens item submenu. Selecting an item commits it as your turn.

COMMIT:
Click a move to select it (highlight). Click again or press ENTER to commit.
Show a clear "COMMITTED" state where your selection is locked.

Use the cyberGorilla as default player. Create a dummy opponent for now.
Dark background (#0a0a0f). Clean readable fonts. Monospace for numbers.
```

### ▶ PROMPT 1.2 — Simultaneous Reveal with Explanation

```
Implement the simultaneous reveal sequence with matchup explanation.

After both fighters commit:

1. Move menu disappears. Center area activates.
2. Both move names show face-down: "???" with the move's type color as border
3. 0.5 second pause — this is the tension beat. Nothing happens.
4. Both moves flip simultaneously:
   Left: "YOUR MOVE: GORILLA PUNCH [POWER]"
   Right: "OPPONENT: STING BARRAGE [FAST]"
5. 0.3 second pause
6. Matchup result appears with EXPLANATION:

   If you won:
   "✅ GORILLA PUNCH (power) beats SCATTER (evasion)
    — too big to dodge!"
   Your move pulses green. Opponent's move fades red.

   If you lost:
   "❌ STING BARRAGE (fast) beats GORILLA PUNCH (power)
    — landed before the swing connected!"
   Your move fades red. Opponent's move pulses green.

   If neutral:
   "⚡ BOTH LAND — no type advantage!"
   Both moves pulse yellow.

7. Result stays on screen for 2 seconds before Phase 2.

The explanation text is critical — it teaches the player WHY they won
or lost using plain language. After 10 fights the player has internalized
the type chart through experience, not memorization.

IMPORTANT: Losing moves still deal HALF damage, not zero.
Winner deals full damage. Loser deals half. This way the player
always does SOMETHING on their turn. Getting fully canceled feels awful.
A bad pick is punished but not wasted.

State machine: SELECTING -> COMMITTED -> REVEALING -> RESULT -> STAMINA_PUSH
```

### ▶ PROMPT 1.3 — Stamina Push (Phase 2)

```
Add Phase 2: the stamina push. After the reveal result is shown:

1. Phase 2 UI appears. The reveal result stays visible at top for context.

2. YOUR PUSH (if your move landed — full or half):
   Show a stamina commitment slider or +/- buttons.
   Minimum = move's minCost. Maximum = current stamina pool.
   
   Show LIVE updating numbers as you adjust:
   
   ┌──────────────────────────────────────────────┐
   │  COMMIT STAMINA: [====|======] 4             │
   │                                              │
   │  Damage: 2 base × 4 stamina = 8 Guard dmg   │
   │  (Half damage — you lost the matchup)  = 4   │
   │                                              │
   │  Opponent Guard after: 7 - 4 = 3             │
   │  Your stamina after regen: 10 - 4 + 3 = 9   │
   │                                              │
   │  [PUSH]                                      │
   └──────────────────────────────────────────────┘
   
   If you WON the matchup, show full damage.
   If you LOST, show "HALF DAMAGE" and the halved number.
   If you're going to BREAK a resource, highlight: "WILL BREAK GUARD!"
   If breaking unlocks your finisher, show: "→ FINISHER UNLOCKED NEXT TURN"

3. If your move was fully countered by a specific mutation/override,
   show "BLOCKED — 0 damage" and skip the slider.

4. AI commits stamina based on archetype (random for now, minCost to minCost+2)

5. Both stamina amounts are hidden during commitment.
   After both commit: 0.3 second pause, then both numbers reveal.
   
   "YOU PUSHED: 4 stamina → 8 Guard damage (halved to 4)"
   "OPPONENT PUSHED: 2 stamina → 4 Body damage"

6. Resource bars animate down. Damage numbers float up from the bars.

7. End of turn:
   - Both fighters regen 3 stamina (cap at 10)
   - Passives trigger
   - Check win conditions (KO, finisher available)
   - Advance turn counter
   - Return to SELECTING phase

8. Grayed out moves update based on new stamina total.

State: SELECTING -> COMMITTED -> REVEALING -> RESULT -> STAMINA_PUSH -> PUSH_REVEAL -> RESOLUTION -> SELECTING
```

### ▶ PROMPT 1.4 — Win Conditions

```
Add win/loss detection:

- If either fighter's Body hits 0: KO. Show "KO — [winner] WINS"
- If a finisher lands and its precondition was met:
  Show "FINISHED — [move name]!" with gold emphasis and screen flash
- After turn 20: Decision. Higher sum of (guard + composure + body) wins.
  Show "DECISION — [winner] WINS"

Win screen shows:
- Winner declaration
- Final resource states for both fighters
- Total turns taken
- "CONTINUE" button

Finisher preconditions checked in move menu:
- Primal Rage: only selectable (not grayed) when opponent guard <= 0
- Psychic Crush: only selectable when opponent composure <= 0  
- Death Cloud: only selectable when opponent composure <= 0
- Tidal Crush: only selectable when opponent stamina < 3

When a finisher becomes available, show a prominent notification:
"⚡ PRIMAL RAGE UNLOCKED — their Guard is broken!"
And the finisher row on the menu glows gold with a pulse animation.
```

### ▶ PROMPT 1.5 — Pre-Fight Scouting Screen

```
Before entering any fight, show a scouting screen with opponent intel.

When player initiates a fight (from arena door or ladder), show:

SCOUTING SCREEN:
┌─────────────────────────────────────────────────┐
│  NEXT OPPONENT                                  │
│                                                 │
│  [PORTRAIT AREA]  BEE SWARM                     │
│                   "Elusive Attrition"            │
│                                                 │
│  FIGHTING STYLE:                                │
│  Fast and evasive. Death by a thousand cuts.     │
│  Wears you down with chip damage while           │
│  dodging your attacks. Can't pin them down.      │
│                                                 │
│  PASSIVE: Residual Sting                        │
│  You take 1 Body damage every turn. Always.      │
│                                                 │
│  STRONG AGAINST: Slow power moves, finishers    │
│  WEAK AGAINST: Area attacks, defensive counters  │
│                                                 │
│  THEIR MOVES:                                   │
│  ⚡ Sting Barrage  | Fast    | Body             │
│  🎯 Scatter        | Evasion | Dodge            │
│  💥 Swarm Pressure | Area    | Composure        │
│  🔮 Pollen Blind   | Psychic | Composure        │
│  🔥 Death Cloud    | Finisher| Body             │
│                                                 │
│  KILL CONDITION: Break Composure → Death Cloud   │
│                                                 │
│  [ENTER ARENA]          [BACK OUT]              │
└─────────────────────────────────────────────────┘

Also show YOUR moves on the left side for comparison so the player
can start planning before the fight begins.

This screen is mandatory before every fight. The player should walk
into every arena knowing what they're up against.
```

### ▶ PROMPT 1.6 — Matchup Guide (Reference Chart)

```
Create a matchup reference chart accessible from:
1. The overworld (talk to Commander Vex, select "Explain Matchups")
2. During fights (press M or a "?" button in corner)

THE MATCHUP CHART:
Show a simple visual grid or list:

  TYPE MATCHUPS — What beats what:
  
  ⚔️  POWER   beats  EVASION    "Too big to dodge"
  ⚡  FAST    beats  POWER      "Lands before the swing"
  🛡️  DEFENSE beats  FAST       "Absorbs the quick hits"  
  🔮  PSYCHIC beats  DEFENSE    "Can't block a thought"
  💥  AREA    beats  EVASION    "Nowhere to hide"
  🔒  GRAB    beats  DEFENSE    "Pulls them out"
  🎯  EVASION beats  FINISHER   "Dodge the slow blast"
  ⚡  FAST    beats  FINISHER   "Interrupts the windup"
  
  No advantage = BOTH LAND (neutral)
  Winner deals FULL damage
  Loser deals HALF damage

Show it as a clean, readable reference. Dark background, colored type
badges, clear arrows or layout showing relationships.

Dismissible with ESC or clicking X. During fights it overlays the
fight screen with a semi-transparent background.
```

### ✅ TEST: Phase 1 Complete When
- Move menu shows all moves with type badges, costs, descriptions
- Detail panel shows matchup context vs current opponent
- Tab toggles to opponent move list
- Scouting screen shows before each fight
- Simultaneous reveal with 0.5s pause works
- Matchup explanation text appears after reveal (tells you WHY)
- Losing moves deal half damage (not zero)
- Stamina push shows live damage preview and after-state
- Resource bars update correctly
- Finisher gating works
- Matchup guide accessible with M key
- Win conditions trigger (KO, finisher, decision)

---

## Phase 2: Full Roster + Passives (Hour 6-8)

**Goal:** All 4 characters playable with working passives.

### ▶ PROMPT 2.1 — Character Select + Full Roster

```
Create a CharacterSelect screen that shows all 4 characters:
  Cyber Gorilla, Psycho Squid, Bee Swarm, Terror Pin Turtle

Each character card shows:
- Name and species tagline
- Passive name and one-line description
- Kill condition in plain language
- Their 5 moves with type badges (compact list)
- A visual style hint (colored border matching their primary type)

Click to select, "START RUN" button.

Update FightScreen to accept ANY character as the player.
AI opponent should be randomly assigned for now.
Move menu dynamically shows selected character's moves.
Detail panel matchup context updates for the actual opponent faced.

Make sure resolveMatchup handles ALL cross-character move interactions
correctly using the moveType system.
```

### ▶ PROMPT 2.2 — Passive: Momentum (Gorilla)

```
Implement Cyber Gorilla's Momentum passive:

- Track 'momentumChain' counter, starts at 0
- Every turn gorilla's move deals Guard damage AND wasn't fully canceled:
  momentumChain increases by 1
- If a turn passes where gorilla didn't deal Guard damage: reset to 0
- Momentum bonus: during Phase 2 stamina push for a Guard-targeting move,
  add momentumChain as FREE stamina on top of their commitment
  Example: chain 3, player commits 2 → effective push is 5
- Show the counter on screen: "MOMENTUM: 3 ⚡" near gorilla's resource bars
- Show the bonus in the stamina push preview:
  "2 committed + 3 momentum = 5 effective → 10 Guard damage"
- Works for both player-as-gorilla AND AI-as-gorilla
```

### ▶ PROMPT 2.3 — Passive: Paranoia (Squid)

```
Implement Psycho Squid's Paranoia passive:

- When opponent has ANY composure damage (composure < 10),
  one move on their menu displays wrong information:
  wrong stamina cost (off by 1-2) OR swap displayed type badge
- At 5+ composure damage: TWO moves show wrong info
- The ACTUAL move still works correctly — only DISPLAY is corrupted
- Corruption re-randomizes each turn
- Show a visual indicator on corrupted moves: subtle glitch effect,
  static overlay, or "?" badge
- Only affects PLAYER's display when fighting against squid
- Show "PARANOIA ACTIVE — X moves corrupted" as a warning on screen
```

### ▶ PROMPT 2.4 — Passive: Residual Sting (Bee)

```
Implement Bee Swarm's Residual Sting passive:

- END of every turn, after all resolution complete,
  opponent takes 1 Body damage. Always. Unavoidable.
- Not blockable, not reducible by Shell Block
- Show "🐝 STING — 1 Body" notification after turn resolution
- Works whether bee is player or AI
- This is the very last thing each turn, after stamina regen
- If this KOs the opponent, show "DEATH BY A THOUSAND CUTS"
```

### ▶ PROMPT 2.5 — Passive: Stamina Tax (Turtle)

```
Implement Terror Pin Turtle's Stamina Tax passive:

- When opponent commits 3+ stamina in Phase 2, lose 1 ADDITIONAL stamina
- Example: push 4 → damage calculated on 4, but pool drops by 5
- Show "TAXED -1 ⚡" notification when triggered
- Works whether turtle is player or AI
- Interacts with Tidal Crush condition (opponent stamina < 3)
- Show the tax in the stamina push preview when fighting turtle:
  "Push 4 stamina (TAXED: -1 extra) → 5 total spent"
```

### ▶ PROMPT 2.6 — Broken State Penalties

```
Implement broken state penalties when resources hit 0:

BROKEN GUARD (guard <= 0):
- Defensive and grab moves cost double stamina
- Evasion and strike moves cost normal
- Show "⚠️ GUARD BROKEN" indicator pulsing on the fighter

BROKEN COMPOSURE (composure <= 0):
- Info/setup moves lose bonus effects (still deal damage, utility stripped)
- Setup moves cost double stamina
- Physical moves cost normal
- Show "⚠️ COMPOSURE BROKEN" indicator

BROKEN STAMINA (stamina < 3):
- ALL moves cost +1 additional stamina
- Regen drops from +3 to +1 per turn
- Show "⚠️ EXHAUSTED" indicator

Update move menu costs in real time when broken states activate.
Show the ORIGINAL cost crossed out with NEW cost next to it:
  "Shell Block  ~~1~~ 2 stamina (Guard Broken: doubled)"
```

### ✅ TEST: Phase 2 Complete When
- All 4 characters selectable and playable
- Momentum counter works and shows in push preview
- Paranoia corrupts displayed move info
- Residual Sting chips 1 Body every turn
- Stamina Tax takes extra on 3+ pushes
- Broken states double appropriate costs and show on menu
- All finishers gate correctly

---

## Phase 3: AI Behavior (Hour 8-9)

**Goal:** Each species AI feels different.

### ▶ PROMPT 3.1 — AI Decision Engine

```
Replace random AI with archetype-based decision making.
Create src/engine/AIEngine.js that returns { selectedMove, staminaPush }.

Each archetype has weighted tendencies:

CYBER GORILLA AI:
- 50% Guard-targeting moves (building Momentum)
- 20% Iron Grip if opponent has high stamina
- 20% Chest Slam if opponent Guard already broken
- 10% Ground Pound for variety
- Primal Rage: ALWAYS pick when available
- Stamina push: aggressive, 60-80% of pool

PSYCHO SQUID AI:
- 40% Mind Spike (primary Composure attack)
- 20% Neural Bind
- 20% Tentacle Lash (physical variety)
- 15% Ink Cloud (when below 50% on any resource)
- 5% random
- Psychic Crush: ALWAYS when available
- Stamina push: moderate, 40-60% of pool

BEE SWARM AI:
- 30% Sting Barrage (cheap chip)
- 25% Swarm Pressure (Composure target)
- 25% Scatter (when under pressure)
- 15% Pollen Blind
- Death Cloud: ALWAYS when available
- Stamina push: conservative, minCost to minCost+1

TERROR PIN TURTLE AI:
- 35% Shell Block (especially vs high-stamina opponents)
- 25% Fortress Mode (when Guard damaged)
- 20% Snap Bite
- 15% Anchor Slam
- Tidal Crush: ALWAYS when available
- Stamina push: minimum commits, save for the crush

Add +/- 10% randomness so AI isn't perfectly predictable.
```

### ✅ TEST: Phase 3 Complete When
- Gorilla AI chains Guard attacks aggressively
- Squid AI focuses Composure
- Bee AI plays cheap and evasive
- Turtle AI blocks and waits
- Each fight feels different in rhythm

---

# PART 2: THE RUN

---

## Phase 4: Roguelike Run Structure (Hour 9-11)

**Goal:** Full 4-fight run with harvest and mutation doctor.

### ▶ PROMPT 4.1 — Ladder Screen

```
Create a LadderScreen showing 4 fight nodes in sequence:

Each node shows:
- Opponent species name and type badge color
- Arena name (flavor text)
- "DOCTOR AVAILABLE" badge on nodes 2 and 4

Generated at run start:
- Player's species excluded from opponent pool
- 4 opponents randomly selected (duplicates allowed)
- Arena names randomly from: "Toxic Hive", "Psionic Reef",
  "Deep Trench", "Volcanic Pit", "Gravity Well"

Current node highlighted. Completed nodes show "CLEARED" or "DEFEATED".
Click "FIGHT" → goes to scouting screen → then fight.
After loss → "DEFEATED" + "RESTART RUN" button.
```

### ▶ PROMPT 4.2 — Harvest Screen

```
Create HarvestScreen after each victory. Two options side by side:

LEFT: "HARVEST MUTATION"
- Shows 2 mutation options from defeated species' pool
- Each shows: name, type (ADD or MODIFY), description, effect on moveset
- Click one to take it. Other disappears.

RIGHT: "HARVEST BIOMASS"
- Shows amount: 3 biomass per harvest
- Shows species DNA tag
- Click to collect biomass

After choosing:
- If next node has doctor → DoctorScreen
- Else → return to LadderScreen, advance to next node
```

### ▶ PROMPT 4.3 — Mutation System

```
Create src/data/mutations.js with pools per species:

GORILLA MUTATIONS (beat a gorilla):
  ADD: 'Power Slam' - cost 3, base 3, type POWER, target body
  MODIFY: 'Bone Density' - any strike now also chips 1 Guard

SQUID MUTATIONS (beat a squid):
  ADD: 'Psychic Echo' - cost 2, base 1 composure, type PSYCHIC. If wins matchup: 2 instead
  MODIFY: 'Psionic Residue' - any Guard attack also chips 1 Composure

BEE MUTATIONS (beat a bee):
  ADD: 'Swarm Burst' - cost 2, base 1, type AREA, hits ALL three resources for 1
  MODIFY: 'Reflex Membrane' - any move, if canceled still deals 1 Body damage

TURTLE MUTATIONS (beat a turtle):
  ADD: 'Counter Shell' - cost 2, type DEFENSE, if opponent struck: reflect 2 Body
  MODIFY: 'Adaptive Shell' - any defensive move also regenerates 1 stamina

ADD mutations: new move appears on move menu (menu grows to 6, 7, 8+)
MODIFY mutations: show picker to choose which move to modify. Data updates.

Move menu must handle variable number of moves. Scroll or wrap if needed.
New moves show a "NEW" badge for the first fight after acquiring them.
```

### ▶ PROMPT 4.4 — Mutation Doctor

```
Create DoctorScreen. Appears at nodes marked "DOCTOR AVAILABLE".

Doctor shows 3 offerings. Each costs biomass (2-4 each).
Insufficient biomass = grayed out.

Doctor-exclusive mutations:
  'Adrenaline Glands' (3 biomass) - ADD: cost 0, utility, +2 stamina this turn
  'Neural Weave' (4 biomass) - MODIFY: any move gains 'beats psychic' in matchup
  'Chitin Plating' (3 biomass) - MODIFY: any move, reduce incoming damage by 1 when active
  'Ink Sacs' (4 biomass) - ADD: cost 3, once per fight force re-reveal
  'Regenerative Tissue' (2 biomass) - passive: +1 Body regen per turn
  'Berserker Glands' (3 biomass) - MODIFY: any strike, +1 base damage permanently

Pick up to 1 (or skip). Remaining biomass carries to next doctor.

Doctor personality in UI text:
- "Oh you brought me [species] biomass? I've been DYING to try something."
- "Hold still. Actually don't hold still, I haven't attached the
  anesthetic tentacle yet."
- Keep it goofy but brief.
```

### ▶ PROMPT 4.5 — Items Integration

```
Add items to the run:

- Player starts with 1 random item
- Doctor sells items for 1 biomass each (show 2 random)
- Max 3 items

In fights: "ITEMS" button on move menu.
Selecting item = your turn. No move selected.
Opponent acts unopposed (their move auto-wins matchup).
Item effect applies immediately. Item consumed.

Items: Stamina Serum (+5 stamina), Guard Patch (+3 guard),
Composure Stim (+3 composure), Adrenaline Shot (2x base next turn)
```

### ▶ PROMPT 4.6 — Victory and Defeat

```
Victory (all 4 fights won):
- "TOURNAMENT CHAMPION" header
- Final character state: resources, mutations acquired, items used
- List of opponents defeated with turns per fight
- Total biomass earned and spent
- "NEW RUN" button

Defeat (any fight lost):
- "DEFEATED" with opponent that beat you
- Run stats so far
- "RESTART RUN" button

Resource persistence between fights:
- Body: restore 5 (cap at 10) — Body is the permanent scar
- Guard: fully restore to 10
- Composure: fully restore to 10
- Stamina: fully restore to 10
```

### ✅ TEST: Phase 4 Complete When
- Full run: character select → 4 fights → victory or defeat
- Harvest works (mutation or biomass)
- Mutations add/modify moves correctly
- Doctor appears at right nodes, biomass spending works
- Items usable mid-fight
- Permadeath works
- Resources partially restore between fights

---

# PART 3: THE OVERWORLD

---

## Phase 5: Hub World (Hour 11-13)

**Goal:** 2D top-down hub connecting everything.

### ▶ PROMPT 5.1 — PixiJS Setup and Hub Map

```
Add a 2D top-down overworld hub to the existing React/Vite game.

TECH:
- Install pixi.js (v7 or v8)
- OverworldScreen React component containing a PixiJS canvas
- When player enters arena door, React swaps to scouting → FightScreen
- After fight, return to OverworldScreen

HUB MAP:
- Tile-based, 30x20 grid, 32x32px tiles (960x640 canvas)
- Placeholder colored rectangles:
  #1a1a2e dark purple = floor
  #00fff5 cyan = walls (impassable)
  #e94560 red = arena doors (4 total)
  #4ecca3 green = NPC
  #f9ed69 gold = mutation doctor
  #ffffff white = player

MAP:
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
W..............D2..............W
W..............................W
W..............................W
W..............................W
W.D1...........C..........D3..W
W..............................W
W..........T.......M..........W
W..............................W
W.....I............I..........W
W..............................W
W..............D4..............W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW

W=wall, D1-D4=arena doors, T=trainer, M=doctor, I=item crates
Player spawns bottom center.

MOVEMENT:
- WASD or arrow keys
- Grid-based snap movement
- Can't walk through walls or NPCs
- ~150ms per tile when holding key
```

### ▶ PROMPT 5.2 — Arena Doors

```
Arena door functionality:

- 4 doors assigned random opponents at run start (exclude player species)
- Labels above doors: "ARENA 1: BEE SWARM"
- Walk onto door + press E: "Enter arena? [E to enter]"
- On E: fade to black → scouting screen → FightScreen
- After win: harvest screen → fade back to hub
- Cleared door changes to gray with "CLEARED"
- After loss: defeat screen with restart

Difficulty based on arenas cleared count (not door order):
- 0 cleared: easy AI
- 1 cleared: moderate
- 2 cleared: hard
- 3 cleared: boss level

Player chooses which door first. Any order.
```

### ▶ PROMPT 5.3 — NPC Dialogue

```
NPC interaction system:

DIALOGUE:
- Adjacent to NPC + press E = dialogue box appears
- Dark semi-transparent box at bottom, white text, NPC name colored
- Typewriter effect ~30 chars/sec
- E or Space to advance, E on last line to close
- Player can't move during dialogue

COMMANDER VEX (trainer, green tile):
First visit:
  "Welcome to the Intergalactic Strongman Tournament, rookie."
  "Every fighter has three vitals — Guard, Composure, and Body."
  "Guard is your physical defense. Composure is your mental state."
  "Body is your health. Lose it all and you're done."
  "Pick a move from your menu. Opponent picks theirs. Both reveal."
  "Check the type badges — they tell you what beats what."
  "After the reveal, bet stamina. More stamina, more damage."
  "But spend too much and your best moves gray out next turn."
  "Every fighter has a finisher. Break the right vital to unlock it."
  "Your kill condition is always on screen. Follow the plan."
  "Now go. Pick an arena. Show them what you're made of."

After 1+ clears:
  "You're learning. [X] arenas down, [Y] to go."
  "[Comment on mutations if any]: I don't even know what species you are anymore."

Has option: "Explain Matchups" → opens the matchup chart overlay.

DR. HELIX (doctor, gold tile):
Before 2 clears:
  "Come back after two wins. I don't waste biomass on amateurs."
After 2 clears + has biomass:
  Opens DoctorScreen overlay
After 2 clears + no biomass:
  "No biomass? Harvest some next fight. Choose biomass over the
   direct mutation. Then come see me."
  "I've got ideas. You've got... potential. Bring me materials."
```

### ▶ PROMPT 5.4 — Item Crates and HUD

```
ITEM CRATES:
- 2-3 crate tiles on map
- Walk onto crate: "Found: [ITEM]!" popup
- Item added to inventory, crate becomes floor tile
- Max 3 items. If full: "Inventory full!"

OVERWORLD HUD:
- Top left: character name + species
- Top right: "Arenas: X/4 Cleared"
- Bottom left: "Items: X/3" + "Biomass: X"
- Bottom right: "Mutations: X"
- Press I: inventory overlay showing items with descriptions
- Semi-transparent dark background behind HUD text
```

### ▶ PROMPT 5.5 — Tutorial Flow

```
First-time player guidance:

ON SPAWN:
- Subtle pulsing arrow toward Commander Vex
- Top text: "Talk to Commander Vex to prepare"
- Arena doors LOCKED and dimmed until Vex dialogue complete
- After Vex: doors flash and activate with opponent labels

FIRST FIGHT HINTS (in battle UI, fade after 5 seconds each):
- Turn 1: "Check the matchup panel. Green = you win, red = you lose."
- First reveal: "You [won/lost]! [Type] beats [type]. Remember that."
- First push: "Slide to commit stamina. Watch the damage preview."
- First resource break: "Their [GUARD] is broken! Finisher time!"

AFTER FIRST WIN (returning to hub):
- "Well done. Three more to go."
- If took biomass: arrow to doctor with tooltip
- If took mutation: "New move added! Check your menu next fight."

SECOND+ RUNS: skip all hints. Doors start unlocked.
Track first-run state in localStorage.
```

### ✅ TEST: Phase 5 Complete When
- Hub renders with colored tiles
- Player moves with WASD, wall collision works
- Arena doors show opponents, E to enter triggers scouting → fight
- Return to hub after fight with cleared indicator
- Vex dialogue teaches basics
- Doctor accessible after 2 clears
- Item crates work
- HUD shows run state
- Tutorial guides first-time players

---

# PART 4: POLISH AND SHIP

---

## Phase 6: Polish Sprint (Hour 13-15)

### ▶ PROMPT 6.1 — Visual Polish

```
Visual polish pass. Keep 8-bit placeholder style but make it intentional.

OVERWORLD:
- Floor: subtle checkerboard pattern (two shades of dark purple)
- Walls: 1px darker inner border to look like blocks
- Arena doors: 2 tiles wide, simple arch shape, glowing when active
- NPCs: simple 2-color character shapes (head + body, 4-5px)
- Player: directional indicator (arrow or facing shape)
- Decorative: glowing dots on some floor tiles, center ring platform,
  lighter floor pathways leading to arena doors
- Arena labels clearly readable, "CLEARED" in green

BATTLE SCREEN:
- Dark background #0a0a0f
- Move menu buttons: rounded, subtle border glow on hover
- Type badges: bright colored pills with white text
- Resource bars: horizontal with color fills, smooth animation on change
- Grayed moves: reduced opacity, cost in red
- Broken state: pulsing border + warning text
- Finisher available: gold glow pulse on the move row
- Phase labels always clear: "SELECT MOVE" / "COMMIT STAMINA" / "REVEALING..."
- Detail panel: clean bordered box with consistent spacing
- Damage numbers: float up from resource bars on hit

TRANSITIONS:
- Hub → arena: fade to black (0.3s)
- Arena → hub: fade from black
- Dialogue open: background dims
- Reveal moment: slight vignette effect during tension pause

Clean monospace font for numbers. One sans-serif font for everything else.
Consistent spacing throughout.
```

### ▶ PROMPT 6.2 — Reveal Feel

```
Tighten the simultaneous reveal — this is the most important moment.

BEFORE REVEAL:
- After both commit: move menu slides down/fades
- Two face-down placeholders appear center screen
  Your move: bordered in your type color, shows "???"
  Their move: bordered in mystery gray, shows "???"
- Background dims slightly

THE PAUSE:
- 0.5 seconds of NOTHING. This is the tension.
- Maybe a subtle rising tone or heartbeat pulse (if sound exists)

THE FLIP:
- Both moves snap to revealed simultaneously
- Brief flash/pulse on reveal
- Type badges appear with move names
- 0.3 second pause

THE RESULT:
- Winner move scales up slightly, bordered in green, pulses
- Loser move shrinks slightly, fades to red/gray
- Explanation text appears:
  "POWER beats EVASION — too big to dodge!"
- Winner side gets a subtle particle burst or glow

SCREEN SHAKE:
- On hits dealing 5+ damage: subtle CSS transform shake (2px, 100ms)
- On finisher: larger shake (4px, 200ms) + flash

STAMINA PUSH REVEAL:
- Both numbers hidden behind "?"
- 0.3 second pause
- Both slam into view simultaneously
- Damage numbers animate from the bars
```

### ▶ PROMPT 6.3 — Sound Effects (30 Min Max)

```
Add synthesized sound effects using Web Audio API. 8-bit style.
Generate sounds programmatically — no audio files needed.

Create src/audio/SoundManager.js with playSound(name) method.

SOUNDS:
- 'step': quiet click (overworld movement)
- 'interact': two-tone bleep (NPC/door interaction)
- 'dialogue': soft chirp (each dialogue line)
- 'pickup': ascending 3-note arpeggio (item crate)
- 'commit': solid click (move committed)
- 'tension': rising tone (during reveal pause)
- 'reveal': whoosh (cards flip)
- 'win_matchup': bright two-note positive tone
- 'lose_matchup': low dull thud
- 'push_reveal': drum hit
- 'damage': crack/impact (scale volume to damage amount)
- 'break': dramatic shatter (resource broken)
- 'finisher_ready': ominous charge tone
- 'finisher_land': explosion + noise burst
- 'passive': subtle ping
- 'ko': heavy slam then silence
- 'sting': tiny buzz (bee passive)
- 'victory': triumphant 4-note fanfare
- 'defeat': descending 3-note sad tone

All oscillator-based. Keep it simple. If this takes more than
30 minutes, ship without sound.
```

### ▶ PROMPT 6.4 — Balance Pass

```
Balance check after playtesting:

THINGS TO VERIFY:
- No character auto-wins. Test 5+ runs per character.
- Finishers land in approximately 30-50% of fights (not too easy, not too rare)
- Stamina feels tight by turn 8-10 (not turn 3, not never)
- Fights typically last 8-15 turns (not 3, not 25)
- Losing moves dealing half damage means you're never fully useless
- Bee Residual Sting doesn't auto-win long fights
- Turtle Stamina Tax doesn't make fights unfun
- Mutations feel impactful (new move should change your gameplan)
- Items are useful but not mandatory

LIKELY ADJUSTMENTS:
- If fights end too fast: increase Body from 10 to 15
- If finishers are too rare: lower resource pools to 8
- If stamina is never tight: reduce regen from 3 to 2
- If one character dominates: adjust their base damages by 1
- If Bee is too strong: Residual Sting every other turn
- If Turtle is annoying: Stamina Tax threshold from 3 to 4

Adjust by 1 point at a time. Ship slightly imbalanced over not shipping.
```

---

## Phase 7: Build and Deploy (Hour 15-16)

### ▶ PROMPT 7.1 — Build and Ship

```
Build and deploy:

1. Verify full flow in dev mode:
   CharacterSelect → Hub → explore → talk to Vex →
   enter arena → scout screen → fight → harvest → hub →
   repeat × 4 → victory

2. npm run build

3. Test production build: npx serve dist

4. Zip dist/ folder for Itch.io upload

5. Itch.io page:
   Title: "AMA: Alien Martial Arts (Prototype)"
   
   Description:
   "A two-phase combat roguelike set in an alien tournament.
   
   Explore the hub. Scout your opponent. Pick a move — both reveal
   at the same time. Then bet stamina like a poker hand.
   
   Win fights. Harvest mutations from the fallen — graft their body
   parts onto yourself. Visit the mutation doctor for custom upgrades.
   By the final fight you're an alien Frankenstein with a moveset
   nobody else has ever built.
   
   It's Pokemon meets roguelike, but instead of catching creatures
   you're grafting their mutations onto yourself.
   
   CONTROLS:
   WASD / Arrow Keys — Move
   E — Interact / Advance dialogue
   TAB — Toggle opponent moves (in fight)
   M — Matchup guide (in fight)
   I — Inventory
   
   Prototype build — feedback welcome!"
   
   Tags: prototype, roguelike, strategy, sci-fi, turn-based, 8-bit, aliens
   Kind: HTML5
   Public: Yes

6. Test live link in incognito browser
7. Send to 3 people for feedback
```

---

# EMERGENCY FIX TEMPLATES

### Bug Fix
```
Bug: [what's happening]
Expected: [what should happen]
Actual: [what's actually happening]
Steps: [how to trigger]
Fix without changing other working functionality. Don't refactor.
```

### Overworld/Battle Bridge Broken
```
Transition between overworld and battle is broken.
[Describe: crash? State lost? Won't return to hub?]
Flow should be: Hub → door → E → scouting → fight → harvest → hub
Check state passing between OverworldScreen and FightScreen.
```

### Move Matchup Wrong
```
[Move A] vs [Move B] is resolving incorrectly.
[Move A] is type [X], [Move B] is type [Y].
According to the type chart, [X] should beat [Y] because [reason].
Check resolveMatchup() and the moveType on both moves in characters.js.
```

### Detail Panel Not Updating
```
The move detail panel isn't showing correct matchup info.
When I highlight [move name] against [opponent species],
it should show which opponent moves I beat and lose to.
It's showing [wrong info / nothing / stale data].
Check that the detail panel reads the current opponent's move list
and runs resolveMatchup against each one.
```

### State Lost Between Fights
```
After returning from fight to hub, [what's missing].
RunState should persist: mutations, items, biomass, cleared arenas,
current resources. Check where RunState lives and that all screens
read/write to the same source.
```

### Just Make It Work
```
I need [feature] working in 10 minutes. Don't worry about code quality.
Hardcode values if needed. Just make it functional.
Ship speed > code quality right now.
```

---

# END OF DAY CHECKLIST

### Core Battle
- [ ] Move menu shows type badges, costs, descriptions
- [ ] Detail panel shows matchup context vs current opponent
- [ ] TAB toggles to opponent move list
- [ ] Scouting screen shows before each fight
- [ ] Matchup guide accessible with M key
- [ ] Simultaneous reveal with 0.5s tension pause
- [ ] Post-reveal explanation tells you WHY you won/lost
- [ ] Losing moves deal half damage (not zero cancel)
- [ ] Stamina push with live damage preview
- [ ] All 4 characters playable with 5 moves each
- [ ] All 4 passives working
- [ ] Broken state penalties apply and show on menu
- [ ] Finishers gate correctly and glow when available
- [ ] Win conditions: KO, finisher, 20-turn decision

### The Run
- [ ] 4-fight run structure works
- [ ] Harvest screen: mutation or biomass
- [ ] Mutations add moves or modify existing
- [ ] Doctor at marked nodes, biomass spending works
- [ ] Items usable mid-fight with turn sacrifice
- [ ] Resources partially restore between fights
- [ ] Permadeath and restart work

### Overworld
- [ ] Hub renders with tile map
- [ ] WASD movement with wall collision
- [ ] Arena doors show opponents, E to enter
- [ ] Fight → harvest → return to hub works
- [ ] Cleared arenas marked
- [ ] Vex dialogue teaches mechanics
- [ ] Doctor NPC gates on 2 clears
- [ ] Item crates work
- [ ] Tutorial flow for first run

### Polish
- [ ] Reveal moment feels tense (0.5s pause works)
- [ ] UI is readable (not pretty, but clear)
- [ ] No game-breaking bugs in a full run

### Ship
- [ ] Deployed to Itch.io
- [ ] Playable via link in fresh browser
- [ ] Sent to at least 1 person

**Hit 75% of this list → ship it. Patch the rest tomorrow.**
