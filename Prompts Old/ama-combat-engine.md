# AMA: Combat Engine — Damage Formula, Turn Flow & Win Conditions

**The math. The phases. The kill.**

---

## The Damage Formula (Complete)

Every attack follows this pipeline:

```
STEP 1: RAW DAMAGE
  raw = baseDamage × staminaPush × (attackerAttack / 50)

STEP 2: DEFENSIVE REDUCTION
  IF move is POWER, FAST, GRAB, or AREA:
    reduced = raw × (50 / defenderDefense)
  IF move is PSYCHIC:
    reduced = raw × (50 / defenderWillpower)
  IF move is FINISHER:
    reduced = raw × (50 / defenderDefense)

STEP 3: MUTATION ARMOR CHECK
  IF target resource has a mutation protecting it:
    IF mutation has type weakness to this move type:
      mutationDamage = reduced × 1.5
    ELIF mutation has type resistance:
      mutationDamage = reduced × 0.75
    ELSE:
      mutationDamage = reduced
    
    IF mutationDamage >= mutation's remaining HP:
      mutation DIES → shatter animation
      overkillDamage = mutationDamage - mutation HP
      resource takes overkillDamage (ARMOR BREAK)
    ELSE:
      mutation absorbs all damage
      resource takes 0

  IF no mutation protecting target resource:
    resource takes full reduced damage

  IF move is FINISHER:
    SKIP mutation armor → hit Body direct

STEP 4: SPECIAL MECHANICS
  Rocket Fist: split reduced damage evenly between Guard and Body
  Hive Thrusters: run steps 1-3 twice at half baseDamage each
  Spike Shell: on successful block, reflect = opponent's staminaPush as Body damage (unmodified)
  Synapse Swap: on hit, swap 2 random opponent moves (permanent until Composure > threshold)
  Grab bonus: +50% damage to mutation HP (stacks with weakness = ×2.25)
  Area splash: primary target takes full damage, random adjacent mutation takes 1 damage

STEP 5: RANDOM VARIANCE
  finalDamage = floor(calculatedDamage × random(0.85, 1.0))
```

---

## Damage Formula Quick Reference

```
OUTGOING:           base × stamina × (Attack / 50)
PHYSICAL DEFENSE:   × (50 / Defense)
PSYCHIC DEFENSE:    × (50 / Willpower)
MUTATION WEAKNESS:  × 1.5 to mutation HP
MUTATION RESISTANCE:× 0.75 to mutation HP
GRAB vs MUTATION:   × 1.5 to mutation HP
ARMOR BREAK:        overkill passes through to resource
FINISHERS:          bypass mutations, hit Body direct
SPIKE SHELL:        reflect = opponent's stamina push as Body damage
RESIDUAL STING:     1 Body/turn (bypasses mutations, no modifiers)
RANDOM VARIANCE:    × 0.85-1.0 at the end
```

---

## Worked Examples

### Example 1: Gorilla Rocket Punch vs Squid

- Gorilla: Attack 75, Rocket Fist tech
- Squid: Defense 30, Arms mutation (Tentacle Graft, 12 HP, weak to POWER), no Torso mutation
- Move: Rocket Punch (POWER, base 2), wins matchup, pushes 5 stamina

```
raw = 2 × 5 × (75/50) = 15
reduced = 15 × (50/30) = 25
Rocket Fist splits: Guard 12, Body 13

Guard path → Arms mutation present, WEAK to POWER:
  12 × 1.5 = 18 mutation damage. Mutation has 12 HP.
  ARMOR BREAK: mutation dies, 6 overkill → Guard: 20 → 14

Body path → No torso mutation:
  13 hits Body directly. Body: 25 → 12.
```

**Result:** One hit destroys the arm mutation, deals 6 Guard through armor break, AND 13 Body. Devastating. This is WHY Gorilla beats Squid.

### Example 2: Squid Mind Spike vs Turtle

- Squid: Attack 35, Synapse Swap tech
- Turtle: Willpower 20, no Head mutation
- Move: Synapse Spike (PSYCHIC, base 2), wins matchup, pushes 4 stamina

```
raw = 2 × 4 × (35/50) = 5.6 → 5
reduced = 5 × (50/20) = 12.5 → 12
No head mutation → 12 hits Composure directly.
Turtle Composure: 20 → 8.
Synapse Swap triggers: 2 random Turtle moves swapped.
```

**Result:** 12 Composure damage from one hit despite low Attack. Turtle's 20 Willpower amplifies psychic damage by 2.5x. Two Mind Spikes = broken Composure. This is WHY Squid beats Turtle 60-40.

### Example 3: Bee Hive Thrusters vs Gorilla

- Bee: Attack 60
- Gorilla: Defense 50, Torso mutation (Barrel Chest, 12 HP, Gorilla graft = weak to FAST)
- Move: Thruster Barrage (FAST, base 1+1), wins matchup, pushes 3 stamina

```
Hit 1: raw = 1 × 3 × (60/50) = 3.6 → 3
  reduced = 3 × (50/50) = 3
  Torso mutation weak to FAST: 3 × 1.5 = 4.5 → 4
  Mutation: 12 → 8

Hit 2: same = 4 mutation damage
  Mutation: 8 → 4

Plus Residual Sting: 1 Body (bypasses mutations)
```

**Result:** 8 mutation damage + 1 Body chip. Bee spent 3 stamina (has full gas next turn). Gorilla's torso armor is almost gone after one exchange.

### Example 4: Spike Shell Reflect

- Turtle: Spike Plating tech. Plays Spike Shell (DEFENSE).
- Gorilla: Plays Gorilla Punch (POWER). Pushes 6 stamina.
- POWER vs DEFENSE = Neutral. Both land.

```
Gorilla attacks Turtle:
  raw = 2 × 6 × (75/50) = 18
  reduced = 18 × (50/75) = 12
  Hits Turtle's Arms mutation (if present)

Spike Shell reflects:
  reflect damage = opponent's stamina push = 6
  Direct Body damage to Gorilla (unmodified)
  Gorilla Body: 25 → 19
```

**Result:** Gorilla deals 12 to Turtle's arm mutation. Turtle reflects 6 Body back. The Gorilla took damage for attacking.

### Example 5: Parasitex Assimilate

- Parasitex: Attack 60, wins matchup, pushes 4 stamina
- Player: Rocket Fist arm mutation (12 base + 3 Plasma Coating + 5 Toughness = 20 HP)

```
raw = 2 × 4 × (60/50) = 9.6 → 9
Assimilate doubles mutation damage: 9 × 2 = 18
Mutation HP: 20 → 2. Survives barely.
Base resources take 0 (Assimilate targets mutation only).
```

**Result:** Rocket Fist at 2 HP. One more Assimilate and it's stolen.

---

## Turn-by-Turn Fight Flow

### Phase 1 — MOVE SELECT (simultaneous, 15-30 seconds)

Both fighters choose moves secretly. Player sees:
- Move menu: name, min stamina cost, base damage, target, type badge, beats/loses to
- Grayed moves if stamina too low
- Both fighters' resource bars (Guard/Composure/Body/Stamina)
- Opponent's visible mutations on sprite
- Active effects (Synapse Swap, Entangle, etc.)
- Enemy intent indicator (attack/defend/targeting/finishing)

60-second timer. Auto-select random move on timeout.

### Phase 2 — REVEAL + STAMINA PUSH (5-10 seconds)

Both moves revealed simultaneously. Matchup resolved:

| Outcome | What Happens |
|---|---|
| **WIN** | Your move lands. Their move canceled. They push 0 stamina. |
| **LOSE** | Your move canceled. You push 0 stamina. |
| **NEUTRAL** | Both moves land. Both push stamina. |

Winner chooses stamina push (min = move cost, max = current pool). Damage preview shows approximate damage before committing.

### Phase 3 — RESOLUTION (3-5 seconds, animated)

1. Attack animation plays
2. Damage numbers pop (red=Body, blue=Guard, purple=Composure, yellow=Stamina)
3. Mutation HP bar drains (if hit)
4. If mutation destroyed: SHATTER ANIMATION (0.7s)
5. If armor break: overkill number flashes on resource bar
6. Resource bars update
7. Passives trigger (Residual Sting, Regrowth, Momentum, etc.)
8. Stamina regen (+3)
9. Next turn or KO

---

## Move Type Targeting

| Move Type | Targets | Mutation Interaction |
|---|---|---|
| **POWER** | Guard (Arms mutation absorbs) | Standard |
| **FAST** | Body (Torso mutation absorbs) | Standard |
| **GRAB** | Guard (Arms mutation absorbs) | +50% damage to mutation HP |
| **PSYCHIC** | Composure (Head mutation absorbs) | Ignores Arms/Torso/Legs mutations |
| **AREA** | Body (Torso mutation absorbs) + 1 splash to random mutation | Wide damage |
| **DEFENSE** | Self (block/protect) | N/A |
| **EVASION** | Self (dodge) | N/A |
| **FINISHER** | Body DIRECT (bypasses ALL mutations) | Requires precondition met |

---

## Matchup Chart (Move Type vs Move Type)

| | POWER | FAST | GRAB | PSYCHIC | AREA | DEFENSE | EVASION | FINISHER |
|---|---|---|---|---|---|---|---|---|
| **POWER** | Neutral | Lose | Neutral | Neutral | Neutral | Neutral | Win | Neutral |
| **FAST** | Win | Neutral | Lose | Win | Lose | Lose | Neutral | Win |
| **GRAB** | Neutral | Win | Neutral | Neutral | Neutral | Win | Lose | Neutral |
| **PSYCHIC** | Neutral | Lose | Neutral | Neutral | Neutral | Win | Neutral | Neutral |
| **AREA** | Neutral | Win | Neutral | Neutral | Neutral | Lose | Win | Neutral |
| **DEFENSE** | Neutral | Win | Lose | Lose | Win | Neutral | Neutral | Neutral |
| **EVASION** | Lose | Neutral | Win | Neutral | Lose | Neutral | Neutral | Win |
| **FINISHER** | Neutral | Lose | Neutral | Neutral | Neutral | Neutral | Lose | Neutral |

Reading: Row is YOUR move, Column is OPPONENT's move. "Win" = your move lands, theirs canceled.

---

## Status Effects

| Effect | Source | Duration | Impact |
|---|---|---|---|
| **Broken Guard** | Guard = 0 | Until restored | Defense/grab moves cost double stamina |
| **Broken Composure** | Composure = 0 | Until restored | Info/setup moves lose bonus, cost double |
| **Broken Stamina** | Stamina < 3 | Until regen above 3 | All moves +1 cost, regen drops to +1 |
| **Synapse Swap** | Squid's Synapse Spike | Until Composure > threshold | 2 random moves have swapped effects |
| **Paranoia** | Squid passive | While Composure < max | 1-2 opponent moves show wrong info |
| **Momentum** | Gorilla passive | Resets on Guard miss | Consecutive Guard hits = +1 free stamina |
| **Residual Sting** | Bee passive | Permanent | 1 Body damage to opponent end of turn |
| **Stamina Tax** | Turtle passive | Permanent | Opponent pays +1 on 3+ pushes |
| **Entangled** | Hydravine Vine Grasp | 2 turns | All moves +1 cost, evasion disabled |

---

## Win Conditions

Only one way to win: **Body reaches 0 = KO**. But five paths to get there:

1. **Guard break → Finisher:** Destroy arm mutations → break Guard → land finisher (direct Body)
2. **Composure break → Psychic Finisher:** Break Composure → Psychic Crush
3. **Body attrition:** Chip Body through torso armor over many turns
4. **Stamina drain → Turtle Finisher:** Destroy leg mutations → deplete stamina < 3 → Tidal Crush
5. **Rocket Fist attrition:** Split pierce chips Guard AND Body. Body may hit 0 before Guard breaks.
