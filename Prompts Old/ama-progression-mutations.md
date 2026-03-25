# AMA: Progression Systems — Economy, Healing, Mutation Catalog

**What happens between fights. What you can harvest. What you can buy.**

---

## Resource Restoration Between Fights

| Resource | Restoration | Rationale |
|---|---|---|
| Guard | Fully restore to max | Defensive readiness resets. |
| Composure | Fully restore to max | Mind clears. Synapse Swap effects don't carry over. |
| Body | Restore 5 points (NOT full) | Health lingers. This is run-level attrition. |
| Stamina | Fully restore to max | Full rest between fights. |
| Mutation HP | Fully restore to max | Helix patches grafts between fights. |

### Why Body Doesn't Fully Heal

- Clean win at 25/25 Body → enter next fight at full. No cost.
- Scrappy win at 8/25 → enter next fight at 13/25. Carrying damage.
- By Fight 4, a player scraping by might be at 15/25. Fragile. The Parasitex smells blood.

### Healing Options
- **Helix grafting bonus:** +3 Body when grafting a Torso mutation specifically (he's working on the area)
- **Ark's Repair Kit:** 200 credits, restores 5 Body. Forces choice between healing and tech.
- **Hydravine's Regenerative Membrane:** if harvested from Fight 3, passively heals 1 Body/turn during Fight 4

---

## Prize Money

| Fight | Prize | Cumulative | What It Buys |
|---|---|---|---|
| Fight 1 | 200 | 200 | Starter tech (Rocket Fist etc.) OR one cheap enhancement |
| Fight 2 | 400 | 600 | Mid-tier enhancement OR save for expensive ones |
| Fight 3 | 700 | 1,300 | Expensive enhancements (Overclock, Auto-Repair) |
| Fight 4 | — | — | Final fight. No shop after. |

### Tech Enhancement Catalog

**Tech Capacity:** 10 points per species. Starter tech costs 2. Remaining 8 for everything else.

**OFFENSIVE:**

| Enhancement | Cost | Tech | Effect | Compatible |
|---|---|---|---|---|
| Plasma Coating | 200cr | 2tp | Move deals +1 base damage | Any occupied slot |
| Venom Injector | 300cr | 2tp | Move applies 1 Body dmg/turn for 2 turns | Arms |
| Neural Scrambler | 400cr | 3tp | Move also chips 1 Composure as secondary | Arms, Head |

**DEFENSIVE:**

| Enhancement | Cost | Tech | Effect | Compatible |
|---|---|---|---|---|
| Titanium Reinforcement | 200cr | 2tp | Mutation gains +5 HP | Any occupied slot |
| Shock Plating | 150cr | 1tp | Attacker takes 1 Body damage when hitting this part | Any occupied slot |
| Auto-Repair Nanites | 500cr | 3tp | Mutation regenerates 1 HP/turn | Any occupied slot |

**UTILITY:**

| Enhancement | Cost | Tech | Effect | Compatible |
|---|---|---|---|---|
| Quick-Release | 150cr | 1tp | Reduce move's stamina cost by 1 | Any occupied slot |
| Tracking Software | 300cr | 2tp | Move gains advantage vs evasion | Arms, Legs |
| Overclock | 500cr | 3tp | Once per fight: use this move twice in one turn | Any occupied slot |

**PASSIVE UPGRADES:**

| Enhancement | Cost | Tech | Effect | Species |
|---|---|---|---|---|
| Momentum Capacitor | 400cr | 3tp | Momentum doesn't reset on miss | Gorilla |
| Paranoia Amplifier | 400cr | 3tp | Corrupted moves show completely wrong info | Squid |
| Sting Synthesizer | 300cr | 2tp | Residual Sting deals 2 damage instead of 1 | Bee |
| Tax Collector | 300cr | 2tp | Stamina Tax triggers on 2+ instead of 3+ | Turtle |

**STARTER TECHS (one per species):**

| Enhancement | Cost | Tech | Transforms | Species |
|---|---|---|---|---|
| Rocket Fist | 200cr | 2tp | Gorilla Punch → Rocket Punch (split pierce Guard + Body) | Gorilla |
| Synapse Swap | 200cr | 2tp | Mind Spike → Synapse Spike (swaps 2 opponent moves) | Squid |
| Hive Thrusters | 200cr | 2tp | Sting Barrage → Thruster Barrage (hits twice, half dmg each) | Bee |
| Spike Plating | 200cr | 2tp | Shell Block → Spike Shell (reflects stamina push as Body dmg) | Turtle |

**Critical rule:** Tech is attached to mutations. If mutation is replaced or destroyed, tech is LOST.

---

## Post-Fight Flow (Complete Sequence)

### Beat 1 — VICTORY SCREEN (5 seconds)
- "VICTORY" + fight stats (damage dealt/taken, turns, kill method)
- Prize money earned
- [Continue]

### Beat 2 — HARVEST SCREEN (player-paced, 30s-2min)
- Transition to Helix's surgery bay
- Defeated opponent's body shown with mutations highlighted
- Helix declares what's salvageable based on kill method:

| Kill Method | Salvageable | Damaged |
|---|---|---|
| Guard break → Finisher | Arms/torso intact | Head potentially damaged |
| Composure break → Finisher | Head/psychic intact | Torso potentially damaged |
| Body attrition | Everything partially damaged | Nothing pristine, more options |
| Dominant KO (fast win) | Almost everything viable | Best picks |
| Scrappy narrow win | Limited options | Most wrecked |

- Helix offers 1-3 mutations. Player picks one or passes.
- If target slot occupied: warning about replacement cost (lose mutation + tech)
- Destroyed mutations from the fight: NOT available
- Damaged mutations: available at 75% max HP
- Intact mutations: full HP

### Beat 3 — GRAFT SCENE (5-10 seconds)
- Animation: Helix grafts mutation onto player sprite
- If replacing: old mutation removed first
- Attribute modifiers update on body map
- "GRAFT COMPLETE"

### Beat 4 — RETURN TO HUB (player-paced)
- 2D overworld. Walk to Ark, bracket, Vex, or next arena door.

### Beat 5 — TECH SHOP (player-paced, 30s-2min)
- Ark's workshop. Shows available enhancements, credits, tech capacity, body map.
- Player buys or leaves.

### Beat 6 — SCOUT (player-paced, 15s)
- Bracket display shows next opponent: species, partial mutation reveal (1-2 visible, rest "???"), attribute descriptors (DEVASTATING/STRONG/AVERAGE/WEAK/PATHETIC)
- Vex commentary line about the matchup
- [Enter Arena] or [Back to Hub]

---

## Mutation Catalog (Demo Scope — 25 Total)

### Gorilla Mutations (4)

| Mutation | Slot | HP | Type | Effect | Attr Mod |
|---|---|---|---|---|---|
| **Iron Knuckles** | Arms | 12 | Shield | Absorbs Guard damage. Adds move: Heavy Strike (POWER, base 3, cost 3, Guard). | +15% Atk, -5% Will |
| **Thick Skull** | Head | 8 | Reduction | Reduce Composure damage by 2. | +15% Atk, -5% Will |
| **Barrel Chest** | Torso | 12 | Pool Expansion | +5 Body max. | +15% Atk, -5% Will |
| **Ground Stomp** | Legs | 10 | Shield | Absorbs Stamina damage. Adds move: Tremor (AREA, base 2, cost 2, Body + splash). | +15% Atk, -5% Will |

### Squid Mutations (4)

| Mutation | Slot | HP | Type | Effect | Attr Mod |
|---|---|---|---|---|---|
| **Tentacle Graft** | Arms | 12 | Shield | Absorbs Guard damage. Adds move: Tentacle Whip (GRAB, base 2, cost 2, Guard. +50% to mutation HP). | -5% Def, +15% Will |
| **Psionic Lobe** | Head | 8 | Reduction | Reduce Composure damage by 3. | -5% Def, +15% Will |
| **Chromatophore Skin** | Torso | 10 | Shield | Absorbs Body damage. Once/fight: when hit, see opponent's next move 0.5s early. | -5% Def, +15% Will |
| **Jet Siphon** | Legs | 10 | Pool Expansion | +2 Stamina max (10 → 12). | -5% Def, +15% Will |

### Bee Mutations (4)

| Mutation | Slot | HP | Type | Effect | Attr Mod |
|---|---|---|---|---|---|
| **Stinger Arms** | Arms | 10 | Shield | Absorbs Guard damage. Adds move: Venom Jab (FAST, base 1, cost 1, applies 1 Body/turn ×3 turns). | +10% Atk, -10% Def, +10% Tough |
| **Hive Mind Node** | Head | 8 | Reduction | Reduce Composure damage by 1. When any Bee mutation destroyed, +1 Stamina regen for rest of fight. | +10% Atk, -10% Def, +10% Tough |
| **Honeycomb Plating** | Torso | 10 | Shield | Absorbs Body damage. Lightweight chitin. | +10% Atk, -10% Def, +10% Tough |
| **Wing Cluster** | Legs | 8 | Shield | Absorbs Stamina damage. Adds move: Buzz Dodge (EVASION, cost 1, if dodge succeeds gain +2 stamina). | +10% Atk, -10% Def, +10% Tough |

### Turtle Mutations (4)

| Mutation | Slot | HP | Type | Effect | Attr Mod |
|---|---|---|---|---|---|
| **Shell Gauntlets** | Arms | 12 | Shield | Absorbs Guard damage. +3 Guard max (20 → 23). | -5% Atk, +15% Def |
| **Iron Dome** | Head | 10 | Reduction | Reduce ALL incoming damage by 1 (min 1). | -5% Atk, +15% Def |
| **Shell Plate** | Torso | 15 | Shield + Reduction | Absorbs Body damage + reduce physical damage to this mutation by 25%. | -5% Atk, +15% Def |
| **Anchor Legs** | Legs | 12 | Pool Expansion | +3 Stamina max (10 → 13). Adds move: Root Stance (DEFENSE, cost 1, restores 2 Guard). | -5% Atk, +15% Def |

### Echomorph Mutations (3 — Boss Loot, Fight 3)

| Mutation | Slot | HP | Effect | Attr Mod |
|---|---|---|---|---|
| **Adaptive Membrane** | Torso | 15 | After being hit by same move type twice, gain 30% resistance to that type. | +10% to lowest attribute |
| **Mirror Reflex** | Arms | 15 | Once/fight: when you LOSE a matchup, your move still lands at 50%. | +10% to lowest attribute |
| **Echo Core** | Head | 15 | Start of each turn: see opponent's move for 0.5s before hidden. | +10% to lowest attribute |

### Hydravine Mutations (3 — Boss Loot, Fight 3)

| Mutation | Slot | HP | Effect | Attr Mod |
|---|---|---|---|---|
| **Regenerative Membrane** | Torso | 15 | Restore 1 to most damaged resource end of every turn. | +5% Def, +10% Tough |
| **Thorn Bark** | Arms | 15 | On successful block/defend, attacker takes 2 Body damage. | +5% Def, +10% Tough |
| **Root Network** | Legs | 15 | When Entangled/Grabbed/restricted, gain +2 stamina regen. | +5% Def, +10% Tough |

### Parasitex Mutations (3 — Victory Reward, Fight 4)

| Mutation | Slot | HP | Effect | Attr Mod |
|---|---|---|---|---|
| **Parasitic Link** | Head | 15 | When you deal Body damage, heal 1 Body. Life steal. | +10% Atk, +10% Will |
| **Chitin Exoframe** | Torso | 15 | All incoming damage reduced by 1 (min 1). | +10% Atk, +10% Will |
| **Assimilation Tendril** | Arms | 15 | Once/fight: when you destroy opponent's mutation, gain temp copy for 3 turns. | +10% Atk, +10% Will |

---

## Mutation Type Weaknesses

| Mutation Origin | Weak To | Resistant To |
|---|---|---|
| Gorilla (muscle/bone) | FAST (+50%) | POWER (-25%) |
| Squid (neural/tentacle) | POWER (+50%) | PSYCHIC (-25%) |
| Bee (swarm/chitin) | AREA (+50%) | FAST (-25%) |
| Turtle (shell/armor) | GRAB (+50%) | POWER (-25%) |
| Echomorph (adaptive) | No weakness | Repeated same-type (-25%/hit) |
| Hydravine (vine/regen) | FAST (+50%) | Sustained low damage (heals through) |
| Parasitex (chitin/stolen) | PSYCHIC (+50%) | GRAB (-25%) |

---

## Player Build Progression Per Fight

| Fight | Opponent | Player After |
|---|---|---|
| 1 | Standard (0 mutations) | 1/4 slots, starter tech, 0 credits remaining |
| 2 | Standard (1 mutation) | 2/4 slots, 1-3 tech, 0-400 credits remaining |
| 3 | Boss (2+ mutations) | 3/4 slots, 2-4 tech, 0-800 credits remaining |
| 4 | PARASITEX (3 mutations) | Final build. No more shopping. Win or die. |
