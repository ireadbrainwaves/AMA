# AMA: AI Behavior — How Opponents Think

**Four personalities. Four difficulty levels. Three boss brains.**

---

## AI Architecture (Three Layers)

Every AI opponent has three decision layers that fire each turn:

### Layer 1: Move Selection (weighted priorities)

**Aggressive AI (Gorilla, Parasitex Phase 2-3):**
- Highest damage move: 40%
- Move targeting opponent's weakest mutation: 30%
- Move building passive (Momentum): 20%
- Defensive/utility: 10%

**Control AI (Squid, Echomorph):**
- Composure attack: 35%
- Counter to opponent's last move: 25%
- Info/setup move: 20%
- Physical attack: 15%
- Defensive: 5%

**Attrition AI (Bee, Hydravine):**
- Cheapest move (stamina efficiency): 35%
- Evasion when opponent pushed heavy last turn: 25%
- Composure attack: 20%
- Body chip: 15%
- Defensive: 5%

**Defensive AI (Turtle):**
- Shell Block / Spike Shell: 35%
- Counter-attack after successful block: 25%
- Guard restoration: 20%
- Stamina-efficient chip: 15%
- Finisher when conditions met: 5% (jumps to 80% when available)

### Layer 2: Stamina Push Logic

| Personality | Push Behavior |
|---|---|
| Aggressive | 60-80% of available stamina. Goes big. |
| Control | 40-60%. Moderate. Saves gas for reactions. |
| Attrition | Minimum or minimum+1. Maximum efficiency. Never goes broke. |
| Defensive | Minimum on everything. Conserves all resources. |
| Finishing | 80-100% when finisher conditions met. Going for the kill. |

### Layer 3: Mutation Targeting Priority

When the AI's move type allows targeting, it prioritizes:

```
1. Teched mutation (highest value to destroy/steal)
2. Low-HP mutation (easiest armor break)
3. Mutation weak to this move type (bonus damage)
4. Resource closest to breaking (strategic pressure)
```

---

## Difficulty Scaling

| Fight | AI Level | Behaviors |
|---|---|---|
| **Fight 1** | Easy | Random move selection with slight archetype tendency. Pushes min to min+2. Sometimes tries finisher when conditions aren't met. Makes mistakes. |
| **Fight 2** | Moderate | Archetype weights active. Pushes based on personality. Uses finisher when available. Doesn't read player patterns. |
| **Fight 3** | Hard (Boss) | Full weights + boss mechanics. Reads player's last 3 moves, avoids countered patterns. Uses unique mechanics optimally. |
| **Fight 4** | Boss (Parasitex) | Three-phase AI. Targets most valuable mutations. Adapts stolen moves immediately. Heavy pushes when advantaged. |

### Easy AI Details (Fight 1)
```
Move selection:
  50% archetype-weighted (slight tendency toward species identity)
  50% random from available moves
  
Stamina push:
  random(minCost, minCost + 2)
  Never pushes more than minCost + 2
  
Finisher:
  30% chance to attempt finisher even when conditions NOT met
  (teaches the player what happens — move fizzles, wastes turn)
  70% uses finisher correctly when available
  
Targeting:
  Random mutation or resource. No strategic targeting.
```

### Moderate AI Details (Fight 2)
```
Move selection:
  Full archetype weights active
  No pattern reading — doesn't track player moves
  
Stamina push:
  Based on personality (see Layer 2 table)
  
Finisher:
  100% correct — only uses when conditions met
  Pushes heavy on finisher (70-90% of pool)
  
Targeting:
  Targets lowest-HP mutation (opportunistic)
  Falls back to resource closest to breaking
```

### Hard AI Details (Fight 3 — Bosses)
```
Move selection:
  Full archetype weights + boss-specific mechanics
  Tracks player's last 3 moves
  If player used same move 2+ times in last 3 turns:
    30% bonus weight toward counter-move
  
Stamina push:
  Based on personality + situation awareness
  Pushes heavier when opponent has broken resources
  Pulls back when own stamina is low
  
Finisher:
  100% correct. Pushes maximum on finisher.
  Reads opponent's available defensive options before committing.
  
Targeting:
  Targets teched mutations (highest value)
  If no teched mutations: targets weakest to this move type
```

### Boss AI Details (Fight 4 — Parasitex)
```
Three-phase behavior (see Boss-Specific AI section below)
Full pattern reading across entire fight
Adapts stolen moves into rotation within 1 turn
Prioritizes Assimilate over normal damage in Phase 1
Switches to kill mode in Phase 3
```

---

## Boss-Specific AI

### Echomorph (Fight 3 Mini-Boss)

**Core mechanic:** Copies player's previous move. Builds resistance to repeated moves.

```
TURN 1:
  Always plays Null Pulse (AREA, base 2, Body)
  Pushes 3 stamina

TURN 2+:
  80%: play opponent's last move (Echo passive)
  15%: play Null Pulse
  5%: play Shatter Copy (POWER, base 3, Body)
  
  IF Echo would copy a finisher whose precondition ISN'T met:
    play Shatter Copy instead (avoid fizzle)

STAMINA PUSH:
  Mirrors opponent's PREVIOUS push.
  If opponent pushed 4 last turn → Echomorph pushes 4.
  If opponent pushed 2 → Echomorph pushes 2.
  
ADAPTIVE RESISTANCE:
  Track hit count per move:
    1st hit: 0% reduction
    2nd hit: 50% reduction
    3rd hit: 75% reduction
    4th+: 90% reduction
  Applied to damage AFTER all other calculations.
  Tracked independently per move name.
```

**What beats the Echomorph:**
- Vary moves every turn (resistance never stacks)
- Bait with cheap moves, follow with expensive ones
- Use moves with setup requirements (Echo copies the move but lacks the context)

---

### Hydravine (Fight 3 Mini-Boss)

**Core mechanic:** Regenerates 2 to most damaged resource/mutation per turn. Entangles every 3 turns.

```
MOVE SELECTION:
  IF Body < 20: Root Drain — 60% weight (life steal priority)
  IF opponent used same move 2+ times: Spore Cloud — 40% weight (punish with ghost move)
  IF opponent Guard < 10: Bloom Crush — 80% weight (finisher available)
  DEFAULT: alternate Vine Lash (GRAB, Guard) and Thorn Burst (AREA, Body)

STAMINA PUSH:
  Moderate: 3-4 range. Never pushes heavy.
  Exception: Bloom Crush finisher pushes 6-8.
  
VINE GRASP (free action, automatic):
  Fires end of Turn 3, Turn 6, Turn 9, Turn 12...
  Applies ENTANGLED to player for 2 turns:
    All player move costs +1 stamina
    Evasion-type moves disabled
  Player can see a vine timer on Hydravine's HUD (countdown to next Grasp)
  
  AFTER Vine Grasp:
    Next turn priority shifts to Root Drain or Vine Lash
    (exploit entangled opponent who can't evade)

REGROWTH (passive, automatic):
  End of every turn:
    IF any mutation HP is damaged: heal 2 HP to most damaged mutation
    ELSE: heal 2 to most damaged resource (Guard/Composure/Body)
  
SPORE CLOUD ghost move mechanic:
  When Spore Cloud hits:
    Next turn, one fake move appears on player's menu
    Fake move name is plausible (e.g., "Vine Counter" or "Root Shield")
    If player selects fake move: turn is wasted, no stamina spent, no action
    Fake move disappears after 1 turn whether selected or not
```

**What beats the Hydravine:**
- Focus fire one resource (don't spread damage — regen heals the most damaged)
- Burst during turns between Vine Grasps (turns 1-2, 4-5, 7-8)
- Use GRAB to break Entangle early (costs a turn but clears debuff)
- Use FAST attacks (Hydravine grafts are weak to FAST)

---

### Parasitex (Fight 4 Final Boss — ALWAYS)

**Core mechanic:** Steals player mutations via Assimilate. Three-phase AI.

```
PHASE 1 — HUNTING (Turns 1-5):
  GOAL: steal 1-2 mutations before player adapts.
  
  Move selection:
    Parasite Lunge (FAST): 50% — wins vs POWER and FINISHERS
    Nerve Tap (PSYCHIC): 25% — chip Composure, bypass armor
    Chitin Rend (POWER): 15% — raw Body damage
    Cocoon (DEFENSE): 10% — only if took heavy damage
  
  On matchup WIN:
    ALWAYS choose Assimilate over normal damage.
    Assimilate target priority:
      1. Mutation with tech enhancements (most valuable)
      2. Mutation with lowest remaining HP (easiest steal)
      3. Most recently grafted mutation
    Assimilate doubles damage to targeted mutation, 0 to resources.
    
  Stamina push: 3-4 (moderate, saving resources)

PHASE 2 — BUILDING (Turns 6-12):
  GOAL: use stolen moves + continue hunting.
  
  Move selection:
    Assimilate (if more mutations to steal): 40%
    Chitin Rend (Body damage): 30%
    Stolen moves: 20% (uses them at 75% effectiveness)
    Nerve Tap (Composure): 10%
    Cocoon: when Body < 17 (50% of max)
  
  Stamina push: 4-6 (getting aggressive)
  
  Cocoon behavior:
    Triggers when Body < 17
    Heals 2 Body while blocking
    Uses once, then returns to attack
    Uses again if Body drops below 10

PHASE 3 — FINISHING (Turns 13+):
  IF has stolen 1+ mutations:
    Parasitic Bloom (FINISHER): 70% when conditions met
      Conditions: has stolen at least 1 mutation
      Damage: base 6 + 2 per stolen mutation
      With 2 stolen: base 10. At 8 stamina push: massive.
    Setup moves to create opening: 30%
    Stamina push: 6-10 (all-in)
    
  IF has stolen 0 mutations:
    No finisher available. Pure bruiser mode.
    Chitin Rend at max push: 60%
    Nerve Tap: 20%
    Cocoon when hurt: 20%
    Stamina push: 5-7

ASSIMILATE COMMUNICATION:
  When Parasitex wins a matchup, before damage:
    Screen shows "ASSIMILATE?" with targeted mutation highlighted
    Player sees WHICH part is being hunted
    Creates desperation: "It's going after my Rocket Fist"
```

**What beats the Parasitex:**
1. **Race it** — all-in Body damage from turn 1. Kill before it steals more than 1 mutation.
2. **Sacrifice strategically** — LET it steal a weak mutation. Use those turns to deal massive damage.
3. **Win every matchup** — if it never wins a matchup, it can never Assimilate.
4. **Break its Composure** — Synapse Swap on the Parasitex scrambles its growing moveset.
5. **Deny finisher** — keep it from stealing ANY mutation = no Parasitic Bloom.
6. **Echomorph mutations** — Adaptive Membrane and Mirror Reflex from Fight 3 directly counter the steal pattern.

---

## Enemy Intent System

Following Slay the Spire's transparency principle. Before each turn, opponent shows a PARTIAL intent:

| Intent | Icon | Meaning |
|---|---|---|
| **Attacking** | Sword | "I'm attacking" (not which move) |
| **Defending** | Shield | "I'm blocking or evading" |
| **Targeting mutation** | Crosshair on body part | "I'm going after your [Arms]" |
| **Building/Setup** | Gear | "I'm using a utility move" |
| **Finishing** | Skull | "Finisher conditions met. Kill shot incoming." |

### What Intent Shows vs Hides

**Shows:** General category (attack/defend/target/setup/finish).
**Hides:** Specific move, move type, stamina commitment.

The player knows the Parasitex is targeting their Arms (crosshair icon) but doesn't know if it's using Parasite Lunge (FAST) or Chitin Rend (POWER). They still have to predict the move type to win the matchup.

The **Skull** (finisher) intent is critical. When finisher conditions are met and the AI will attempt it, the skull appears. This prevents "died to a finisher I didn't see coming" — you KNOW it's coming, you just have to outplay it.

### Intent by AI Level

| AI Level | Intent Accuracy |
|---|---|
| Easy (Fight 1) | 100% accurate. Always shows true intent. Training wheels. |
| Moderate (Fight 2) | 90% accurate. 10% chance of showing wrong intent (telegraphs attack, plays defense). |
| Hard (Fight 3) | 80% accurate. Bosses occasionally feint. |
| Boss (Fight 4) | 75% accurate. Parasitex deliberately misleads. Shows "Defend" then attacks. |

Lower accuracy at higher difficulty adds another layer of uncertainty. The player learns to trust intent in Fight 1, then gets burned by a feint in Fight 3. That teaches: "intent is a hint, not a guarantee."

---

## Standard Species AI Profiles

### Cyber Gorilla (Aggressive)
```
Priorities: Gorilla Punch → build Momentum → Iron Grip to pin → Primal Rage to finish
Opens with Gorilla Punch 70% of the time
Pushes heavy (5-7 stamina) when Momentum is building
Goes for finisher immediately when Guard is broken
Weakness: predictable opener. Counter with FAST moves.
```

### Psycho Squid (Control)
```
Priorities: Mind Spike → Ink Cloud → Neural Bind → Psychic Crush
Opens with Mind Spike 60% of the time (start Composure pressure)
Uses Ink Cloud to dodge when opponent pushed heavy last turn
Saves Neural Bind for turns when info advantage matters most
Pushes moderate (3-5). Never goes broke.
Weakness: low physical damage. Rush it with POWER.
```

### Bee Swarm (Attrition)
```
Priorities: Sting Barrage → Scatter → Swarm Pressure → Death Cloud
Uses cheapest move available 50% of the time
Scatter dodges whenever opponent showed "Attacking" intent
Swarm Pressure to chip Composure for finisher setup
Pushes minimum. Always has gas. Residual Sting does the real work.
Weakness: AREA attacks catch the swarm. Turtle's Shell Block walls it.
```

### Terror Pin Turtle (Defensive)
```
Priorities: Shell Block → Fortress Mode → Snap Bite → Tidal Crush
Blocks 40% of turns. Waiting for the opponent to overcommit.
Fortress Mode to restore Guard when it's been chipped
Snap Bite as counter-attack after successful blocks
Finisher (Tidal Crush) only when opponent stamina < 3
Pushes minimum. Conserves everything. Lets the opponent gas themselves.
Weakness: PSYCHIC attacks bypass the shell. GRAB pulls it out.
```

---

## AI Decision Flowchart (Universal)

```
START OF TURN
  │
  ├── Is finisher condition met?
  │     ├── YES → 80% use finisher, 20% setup/bait
  │     └── NO → continue
  │
  ├── Am I below 30% Body?
  │     ├── YES → 50% defensive/healing, 50% desperate attack
  │     └── NO → continue
  │
  ├── Does opponent have a broken resource?
  │     ├── YES → 60% exploit the break, 40% normal play
  │     └── NO → continue
  │
  ├── Did opponent use same move last 2 turns?
  │     ├── YES → 70% use counter to that move type
  │     └── NO → continue
  │
  └── Use archetype-weighted move selection
        Push stamina based on personality
        Target based on priority list
```
