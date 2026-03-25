# AMA: MUTATION ECONOMY & TECH UPGRADE SYSTEM

**Complete design specification for harvesting, mutations, tech upgrades, and removal**
**The core progression loop that makes every run unique**

---

## System Overview

Three currencies. Two progression types. One mad scientist.

| Currency | Source | Spent On |
|----------|--------|----------|
| **Mutations** | Free — harvested from defeated opponents | Bolted onto your body as new or replacement moves |
| **Biomass** | Harvested instead of mutations, or from other sources | Doctor mutations, items, safe mutation removal |
| **Tech Points** | Fixed pool of 10 per run | Cyber enhancements on ANY body part (base moves or mutations) |

**Key rule: Mutations are free. Tech costs tech. Biomass buys everything else.**

---

## The Harvest Screen

Appears after every victory. Three options plus a skip.

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│                     HARVEST THE FALLEN                           │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ MUTATION A   │    │ MUTATION B   │    │  BIOMASS    │         │
│  │             │    │             │    │             │         │
│  │ [ADD] or    │    │ [ADD] or    │    │  Collect    │         │
│  │ [REPLACE]   │    │ [REPLACE]   │    │  3 biomass  │         │
│  │             │    │             │    │             │         │
│  │ FREE        │    │ FREE        │    │  Species    │         │
│  │             │    │             │    │  DNA tag    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ YOUR CURRENT BUILD                                        │   │
│  │ Moves: 5/5 base + 2 mutations | Tech: 4/10 | Biomass: 6 │   │
│  │ [visual of your character with current grafts]            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│                        [ SKIP — TAKE NOTHING ]                   │
└──────────────────────────────────────────────────────────────────┘
```

### Mutation Offerings

Each offering is randomly tagged as ADD or REPLACE:
- Sometimes 2 ADDs
- Sometimes 2 REPLACEs
- Sometimes one of each
- Weighted by what the defeated species has available

### ADD Mutation Card

```
┌─────────────────────────────────┐
│  [ADD] TENTACLE LASH            │
│  Type: GRAB | Cost: 2 stamina   │
│  Base Damage: 2 | Target: Guard │
│  FREE — No tech cost to graft   │
│                                 │
│  "Tendrils that track you.      │
│   Can't outrun reach."          │
│                                 │
│  Mutation HP: 8                 │
│  Slot: Right Arm                │
│  Weakness: Power attacks (2x)   │
│                                 │
│  Adds a new move to your menu.  │
│  This is a targetable body part │
│  opponents can destroy.         │
│                                 │
│         [ GRAFT THIS ]          │
└─────────────────────────────────┘
```

### REPLACE Mutation Card

```
┌─────────────────────────────────┐
│  [REPLACE] NEURAL TENTACLE      │
│  Type: PSYCHIC | Cost: 2 stam   │
│  Base Damage: 3 | Target: Comp  │
│  FREE — No tech cost to graft   │
│                                 │
│  "Psychic tendrils that bypass  │
│   physical defenses entirely."  │
│                                 │
│  Mutation HP: 12                │
│  Slot: Right Arm                │
│  Weakness: Fast attacks (2x)    │
│                                 │
│  ⚠️ PERMANENTLY REMOVES:        │
│  Gorilla Punch (your base move) │
│                                 │
│  ⚠️ If destroyed in combat,     │
│  this move slot is EMPTY.       │
│  Gorilla Punch does NOT return. │
│                                 │
│         [ REPLACE ARM ]         │
│                                 │
│  Are you sure? [CONFIRM] [BACK] │
└─────────────────────────────────┘
```

### Biomass Card

```
┌─────────────────────────────────┐
│  HARVEST BIOMASS                │
│                                 │
│  Collect 3 biomass              │
│  Species DNA: Psycho Squid      │
│                                 │
│  Current biomass: 3             │
│  After harvest: 6               │
│                                 │
│  Spend at Dr. Helix for:       │
│  • Custom mutations             │
│  • Tech upgrades (cost tech pts)│
│  • Items (1 biomass each)       │
│  • Safe mutation removal (1)    │
│                                 │
│       [ HARVEST BIOMASS ]       │
└─────────────────────────────────┘
```

### Skip Option

"Take nothing. Move on."

Sometimes neither mutation fits your build and biomass isn't needed. Skipping is a valid strategic choice — especially if both offerings would give opponents easy targets without enough upside.

---

## Mutation Properties

Every mutation (ADD or REPLACE) has these properties:

| Property | Description |
|----------|-------------|
| **Name** | Display name (Tentacle Lash, Chitin Strike, etc.) |
| **Type** | ADD or REPLACE |
| **Move Data** | Full move stats (type, cost, damage, target, beats, loses to) |
| **HP** | How much damage it takes before destroyed. ADD: 8 HP. REPLACE: 12 HP. |
| **Slot** | Which body slot it occupies (Left Arm, Right Arm, Back, Chest, Head, Legs) |
| **Weakness** | A move type that deals 2x damage to this mutation. Each mutation has one. |
| **Source Species** | Which species it came from (affects doctor offerings if harvested as biomass) |
| **Tech Upgrades** | Array of tech enhancements applied to this mutation (starts empty) |
| **Replaced Move** | If REPLACE type: which base move was permanently removed |

### Mutation HP Values

| Mutation Type | Base HP | With Defensive Tech | Notes |
|---------------|---------|--------------------|----|
| ADD mutation | 8 | 8 + tech bonus | Easier to destroy, less investment |
| REPLACE mutation | 12 | 12 + tech bonus | Tougher because more is at stake |
| Doctor mutation | 10 | 10 + tech bonus | Middle ground |

### Mutation Weaknesses

Every mutation has ONE weakness — a move type that deals double damage to it. This is determined by the source species:

| Source Species | Mutation Weakness | Why |
|---------------|-------------------|-----|
| Gorilla mutations | Psychic (2x dmg) | Brute force can't resist mental attacks |
| Squid mutations | Power (2x dmg) | Tentacles are physically fragile |
| Bee mutations | Area (2x dmg) | Swarm parts scatter under wide attacks |
| Turtle mutations | Grab (2x dmg) | Shell can be pried open |
| Doctor mutations | Varies per mutation | Custom work, custom weakness |

This means scouting matters. If your opponent has squid mutations, your power moves are the key to dismantling them. If they have turtle shell plating, bring grabs.

---

## Tech Upgrade System

### Tech Capacity

- **Fixed at 10 per run.** Cannot be increased.
- Spent on cyber enhancements for ANY body part (base moves AND mutations).
- Tech invested in a mutation is LOST if that mutation is destroyed in combat.
- Tech invested in base moves is PERMANENT (base moves can't be destroyed).
- Tech can only be spent at Dr. Helix between fights.

### Tech Upgrade Categories

**OFFENSIVE (make moves hit harder or differently)**

| Enhancement | Tech Cost | Effect |
|-------------|-----------|--------|
| Rocket Propulsion | 2 | Move gains PIERCE — hits Body directly, ignoring Guard |
| Plasma Coating | 2 | Move deals +1 base damage permanently |
| Neural Scrambler | 3 | Move also chips 1 Composure as secondary effect |
| Venom Injector | 2 | Move applies 1 Body damage per turn for 3 turns (poison) |
| Overcharge Capacitor | 3 | Once per fight: this move's stamina push is doubled |

**DEFENSIVE (make body parts harder to destroy)**

| Enhancement | Tech Cost | Effect |
|-------------|-----------|--------|
| Titanium Reinforcement | 2 | Mutation gains +5 HP |
| Auto-Repair Nanites | 3 | Mutation regenerates 1 HP per turn |
| Decoy Module | 2 | First hit on this mutation misses (once per fight) |
| Shock Plating | 1 | Attacker takes 1 Body damage when hitting this body part |
| Ablative Armor | 2 | Mutation takes half damage from non-weakness attacks |

**UTILITY (change how moves and systems function)**

| Enhancement | Tech Cost | Effect |
|-------------|-----------|--------|
| Tracking Software | 2 | Move now also beats Evasion type (adds to matchup chart) |
| Quick-Release | 1 | Reduce move's stamina cost by 1 (min 1) |
| Overclock | 3 | Once per fight: use this move and another move on same turn |
| Scanner Array | 2 | See opponent's move selection 0.5s before reveal (once per fight) |
| Feedback Loop | 2 | When this move wins a matchup, refund 1 stamina |

**PASSIVE ENHANCEMENTS (upgrade your species passive ability)**

| Enhancement | Tech Cost | Effect |
|-------------|-----------|--------|
| Momentum Capacitor | 3 | Gorilla: Momentum chain doesn't reset on miss, just pauses |
| Paranoia Amplifier | 3 | Squid: Corrupted moves show completely wrong info |
| Sting Synthesizer | 2 | Bee: Residual Sting deals 2 damage instead of 1 |
| Tax Collector | 2 | Turtle: Stamina Tax triggers on 2+ commitment instead of 3+ |

### Tech Investment Risk Matrix

| Where You Invest | Safety | Power | Risk If Destroyed |
|-----------------|--------|-------|-------------------|
| Base move + tech | SAFE — can't be destroyed | Moderate — base moves are weaker | N/A — never lost |
| ADD mutation + tech | MEDIUM — targetable but you keep base moves | High — mutation moves are strong | Lose move + tech points |
| REPLACE mutation + tech | HIGH RISK — targetable AND no base move backup | Maximum — replacement moves are strongest | Lose move + tech + the slot is EMPTY |

This creates three distinct build archetypes:

**The Fortress:** Tech-enhanced base moves. Nothing can be destroyed. Slower to ramp but impossible to dismantle. Spends all 10 tech on making the base 5 moves as strong as possible.

**The Hybrid:** Mix of base moves and 1-2 mutations. Tech split between safe base investments and risky mutation enhancements. Balanced risk/reward.

**The Abomination:** All-in on mutations and replacements. Maximum mutations, maximum tech on the strongest parts. Devastating when intact, catastrophic if dismantled. Glass cannon body horror build.

---

## The Doctor Screen (Redesigned)

Dr. Helix's workshop has four tabs:

### Tab 1: GRAFT (Biomass → Mutations)

Doctor-exclusive mutations. Cost biomass, not tech.

Shows 3 offerings (randomly selected from doctor pool).
Each costs 2-4 biomass. Same ADD/REPLACE rules as harvest mutations.

Doctor dialogue on entry:
- "What are we working with today? Let me see that biomass."
- "I've got ideas. Some of them are even safe."
- "You know what would look great on you? Everything."

### Tab 2: ENHANCE (Tech Points → Cyber Upgrades)

Shows your full body layout — every base move and every mutation.
Click on a body part to see available tech upgrades.
Each upgrade shows tech cost and remaining capacity.

```
YOUR BODY — Tech: 7/10 remaining

[LEFT ARM] Gorilla Punch (base)
  → Available: Plasma Coating (2 tech), Quick-Release (1 tech)

[RIGHT ARM] Tentacle Lash (mutation, 8 HP)
  → Available: Rocket Propulsion (2 tech), Tracking Software (2 tech)
  → Already installed: Shock Plating (1 tech)

[BACK] Empty slot
[CHEST] Empty slot
[HEAD] Empty slot
[LEGS] Base (not upgradeable individually)

[PASSIVE] Momentum
  → Available: Momentum Capacitor (3 tech)
```

Doctor dialogue for enhancements:
- "Rocket on the tentacle? Now THAT'S what I went to med school for."
- "This is going to void your warranty. You don't have a warranty? Perfect."
- "Hold still. Actually, don't. The vibrations help the plasma bond."

### Tab 3: REMOVE (Biomass or Free → Remove Mutation)

Shows all currently grafted mutations. Click one to remove.

**Safe Removal (1 biomass):**
- Mutation is cleanly removed
- Move is gone from menu
- If it was a REPLACE, the slot is now EMPTY (base move doesn't return)
- Tech points invested in that mutation are REFUNDED
- "Clean cut. Professional work. You won't feel a thing. Much."

**Free Removal (0 biomass):**
- Mutation is ripped out
- Move is gone from menu
- Tech points invested are REFUNDED
- Random negative effect applied:
  - 33% chance: -3 Body max permanently for the run
  - 33% chance: -5 Guard max permanently for the run
  - 33% chance: -1 stamina regen permanently for the run
- "This is gonna hurt. Don't say I didn't warn you."
- After removal: "See? Still alive. Mostly."

### Tab 4: ITEMS (Biomass → Consumables)

Shows 2-3 random items. Each costs 1 biomass. Max 3 items in inventory.

Items:
- Stamina Serum (+5 stamina mid-fight)
- Guard Patch (+3 Guard mid-fight)
- Composure Stim (+3 Composure mid-fight)
- Adrenaline Shot (2x base damage next turn)
- Mutation Sealant (one mutation takes no damage for 3 turns)

---

## Mutation Removal: Free Removal Negative Effects

| Roll | Effect | Severity | Dr. Helix Quote |
|------|--------|----------|-----------------|
| 1 | -3 Body max (permanent) | High | "Oops. That was load-bearing tissue." |
| 2 | -5 Guard max (permanent) | Medium | "Your defensive matrix is... compromised." |
| 3 | -1 stamina regen (permanent) | Medium | "The nerve damage should heal. Probably." |
| 4 | -3 Composure max (permanent) | Medium | "You might hear some voices. That's normal. Mostly." |
| 5 | +1 cost to all moves for next fight | Low | "Your motor control is a bit wonky. Give it a fight." |
| 6 | Random mutation takes 3 damage | Low | "Collateral damage. Sorry about the tentacle." |

Roll is random. Player doesn't know which effect they'll get until after the removal. This makes free removal genuinely scary — you might get a minor inconvenience or you might lose 3 Body permanently.

---

## Run Economy Flow

Here's how the full economy plays out across a 4-fight run:

### Fight 1 → Harvest Screen
- Start: 5 base moves, 0 mutations, 10/10 tech, 0 biomass
- Win fight 1. Harvest screen offers 2 mutations or 3 biomass.
- Player takes [ADD] Tentacle Lash. Free.
- Now: 6 moves (5 base + 1 mutation), 10/10 tech, 0 biomass
- No doctor this node. Move on.

### Fight 2 → Harvest Screen → Doctor
- Win fight 2. Harvest screen offers mutations or biomass.
- Player takes biomass (3). Wants to save for doctor.
- Doctor is available at this node.
- Player visits Dr. Helix:
  - Tab 2 (Enhance): Puts Rocket Propulsion (2 tech) on Tentacle Lash
  - Tab 2 (Enhance): Puts Quick-Release (1 tech) on base Gorilla Punch
  - Tab 4 (Items): Buys Stamina Serum for 1 biomass
- Now: 6 moves, 7/10 tech, 2 biomass, 1 item
- Tentacle Lash now has pierce damage. Gorilla Punch costs 1 less.

### Fight 3 → Harvest Screen
- Mid-fight: opponent targets Tentacle Lash (it has Rocket — it's dangerous)
- Tentacle Lash takes 5 damage. Survives (8 HP, now at 3 HP).
- Win fight 3 (close call).
- Harvest screen: player takes [REPLACE] Chitin Crusher, replacing Chest Slam.
- Now: 6 moves (4 base + 1 ADD mutation + 1 REPLACE mutation), 7/10 tech, 2 biomass
- Chitin Crusher is a REPLACE — if destroyed, that slot is empty. Chest Slam is gone forever.
- Tentacle Lash is at 3 HP going into fight 4. Vulnerable.

### Fight 4 (Boss) → Doctor → Final Fight
- Doctor available before the boss.
- Player decision: spend remaining tech on...
  - Titanium Reinforcement (2 tech) on damaged Tentacle Lash to boost its HP?
  - Plasma Coating (2 tech) on Chitin Crusher to make the replacement stronger?
  - Momentum Capacitor (3 tech) on passive to make Gorilla's chain unstoppable?
- Spends 2 tech on Titanium Reinforcement (Tentacle now has 3+5=8 HP again)
- Spends 3 tech on Momentum Capacitor (chain doesn't reset)
- Now: 6 moves, 2/10 tech remaining, 1 biomass, 1 item
- Enters boss fight as a cyber-enhanced gorilla with a rocket tentacle and chitin chest plate.

That's a STORY. That's a run that a player describes to their friends.

---

## Design Principles (Why This Works)

### From Balatro: "Breaking vs Destroying"
Mutations let you break the game (stacking power). The risk of destruction prevents you from destroying it (trivializing challenge). A fully loaded mutation build is devastating but fragile.

### From Pokémon: "Every choice has a trade-off"
ADD vs REPLACE. Tech on base vs tech on mutations. Biomass for doctor vs biomass for items. No decision is purely upside. Every choice closes a door.

### From Slay the Spire: "The run is the build"
Your character at fight 4 is completely different from fight 1. The mutation choices, tech investments, and removal decisions across the run create a unique build that nobody else has. That's replayability.

### From Hades: "Death teaches"
If your build gets dismantled and you lose, you learned which mutations are fragile, which tech investments are risky, and which opponents target which parts. Next run you build differently. The meta-knowledge carries across runs even when the mutations don't.

### Anti-Snowball: "Scars soften the blow"
When mutations are destroyed, the scar system (designed separately) gives small passive bonuses. You're weaker but not helpless. Comebacks are always possible.

---

## Implementation Priority

1. **Harvest screen with ADD/REPLACE/BIOMASS** — this is the core decision point
2. **Tech upgrade tab in doctor screen** — this is where builds get interesting  
3. **Mutation HP and destruction in combat** — requires targeting system (next design session)
4. **Removal system** — nice to have, adds depth to doctor visits
5. **Scar system on destruction** — anti-snowball safety net
