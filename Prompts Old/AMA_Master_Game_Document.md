# AMA: ALIEN MARTIAL ARTS — MASTER GAME DOCUMENT
### The Complete State of the Game — March 2026
### Evergreen Studios | A Scott Great Game

---

> *"Four species. One corridor. Seventy years of punching each other. Welcome to the tournament."*
> — Commander Vex

---

## WHAT IS AMA?

AMA: Alien Martial Arts is a roguelike combat game set in the Intergalactic Strongman Tournament on Axis-9 station. Four alien species fight in a bracket tournament. You win fights, harvest biological material from defeated opponents, graft it onto your body, enhance it with cybernetic technology, and walk into the next fight as a Frankenstein of alien body parts. By the final fight, you don't resemble the species you started as.

The game is mechanically serious and narratively absurd. The combat runs on a Pokémon-depth type system with simultaneous move reveals, stamina poker, and targetable mutation body parts. The story is told by a retired fighter running the tournament (Commander Vex) who treats inter-species organ harvesting as routine paperwork.

**Platform:** Steam (demo target)
**Engine:** React + PixiJS (2D hub), React (3D-style fight screen)
**Art Style:** 16-bit pixel art (SNES era), 64x96 character sprites, generated via Scenario.gg
**Design System:** Dark sci-fi terminal aesthetic, Share Tech Mono font, desktop-first
**Tone:** Black Dynamite meets Pokémon. Narrator treats everything as verified historical record even when it's clearly insane.

---

## THE WORLD

### The Corridor

Four spacefaring species discovered each other in a narrow band of navigable space. Diplomacy failed eleven times. All eleven attempts ended in physical altercations. The ninth summit lasted four minutes. They fight because they're biologically hardwired to fight — it's not cultural, it's evolutionary. The tournament is what happens when someone puts a fence around the inevitable and charges admission.

### Axis-9 Station

Neutral trade station at the center of The Corridor. Home of the Intergalactic Strongman Tournament for 70 years. Originally a cargo bay. Smells like engine coolant and old blood. Governed by rotating council. The tournament has been running longer than most of the station's other departments.

### The Tournament

Founded Year 41 after the Axis-9 Accord legalized organized interspecies combat. Commander Vex has run it for 29 years. One rule: nobody dies in his arena. Everything else is between the fighters. The mutation system was introduced in Year 56 by Dr. Helix and has never been formally approved. It has also never been formally disapproved. The crowds love it.

---

## THE FOUR PLAYABLE SPECIES

### Cyber Gorilla — Heavy Hitter, Glass Mind

**Homeworld:** Korgath-7. High-gravity jungle planet. 1.6x standard gravity. Everything is heavy, dense, and angry.

**Biology:** 7-9 feet tall, skeletal density 3x galactic average. Muscle fibers operate on a ratcheting system — consecutive strikes get harder, not weaker (momentum loading). Cybernetic augmentation is a species trait, not a subculture. A Gorilla without augmentation is considered either a monk or a criminal.

**Culture:** Disputes settled by demonstration. Scientific peer review has a 4% mortality rate. Their word for "respect" and "I saw you hit someone very hard" are the same word.

**Stats:** Attack 75 / Defense 50 / Willpower 25 / Toughness 50 (BST 200)

**Passive — Momentum:** Consecutive Guard hits add +1 free stamina to next push. Resets on miss.

**Starter Tech — Rocket Fist (200cr, 2tp):** Transforms Gorilla Punch into Rocket Punch. Split pierce damage — hits Guard AND Body simultaneously. Metal arm with jet vents, exhaust on impact. THE mascot move. The hero pose. The Steam capsule art.

**Kill Condition:** Break Guard → Primal Rage finisher (bypasses all mutations, direct Body damage).

**Signature color:** Steel gray + electric blue.

---

### Psycho Squid — Mentalist, Physically Fragile

**Homeworld:** Vorath Deep. Ocean planet, no solid landmass. Cities suspended from deep-sea thermal vents. No sunlight reaches Vorath Deep.

**Biology:** Three parallel brain structures — motor, awareness, and a third dedicated to projecting psychic interference. Always on. Standing near an unshielded Squid feels like "someone reading your diary from inside your skull." Eight tentacles with independent neural pathways can execute different tasks simultaneously.

**Culture:** Information hierarchy. Privacy is a weapon. Withholding information is the highest aggression. Political system: "competitive omniscience."

**Stats:** Attack 35 / Defense 30 / Willpower 80 / Toughness 55 (BST 200)

**Passive — Paranoia:** While opponent has ANY Composure damage, 1-2 moves on their menu display incorrect information (wrong cost, wrong damage, wrong matchup). The more Composure damage, the more moves are corrupted.

**Starter Tech — Synapse Swap (200cr, 2tp):** Transforms Mind Spike into Synapse Spike. On hit, randomly swaps the effects of 2 opponent moves. Permanent until Composure restored above threshold. Opponent doesn't know which moves are swapped. If a swapped move triggers a finisher without preconditions, it fizzles — wasted turn and stamina.

**Kill Condition:** Break Composure → Psychic Crush finisher.

**Signature color:** Deep purple + toxic green.

---

### Bee Swarm — Attrition, Can't Take a Hit

**Homeworld:** Mellaxis Prime. Temperate world with continent-spanning mega-flora. Pollen clouds visible from orbit. Everything stings.

**Biology:** Not one organism — approximately 12,000 drones operating as a single distributed consciousness. Each drone is fist-sized with a stinger that penetrates light armor and venom sacs that replenish every 90 seconds. The swarm can split, disperse, and reform at will. Targeting them is like punching fog that stings back.

**Culture:** No individual identity. Each Swarm has a harmonic signature — a unique vibrational pattern. When a Swarm dies, the harmonic is archived. They mourn harmonics, not individuals.

**Stats:** Attack 60 / Defense 25 / Willpower 55 / Toughness 60 (BST 200)

**Passive — Residual Sting:** 1 Body damage to opponent at end of every turn regardless of what happened. Always ticking. The clock is always running.

**Starter Tech — Hive Thrusters (200cr, 2tp):** Transforms Sting Barrage into Thruster Barrage. Hits twice at half damage each. Doubles proc triggers for any on-hit effects. Tiny jet packs on individual bees.

**Kill Condition:** Break Composure → Death Cloud finisher (damage = total Composure damage dealt this fight).

**Signature color:** Amber yellow + black.

---

### Terror Pin Turtle — Fortress, Zero Mental Game

**Homeworld:** Ironshell Basin. Tectonically active planet where earthquakes are weather. The Turtles didn't evolve to survive it — they evolved to not notice.

**Biology:** Biocite shell harder than surgical steel. Can withstand low-yield ordnance. The Turtle's defensive capability is not a strategy — it's an anatomical fact. Internal systems operate at roughly 40% the metabolic rate of other species, making them phenomenally efficient at waiting.

**Culture:** Disputes settled through competitive patience. Longest legal trial: nine months. Neither party remembers what it was about. Both consider it formative.

**Stats:** Attack 30 / Defense 75 / Willpower 20 / Toughness 75 (BST 200)

**Passive — Stamina Tax:** Every time opponent commits 3+ stamina on a single push, they lose 1 additional stamina. Punishes big commitments. Funnels opponents into weak conservative pushes — exactly where the Turtle wants them.

**Starter Tech — Spike Plating (200cr, 2tp):** Transforms Shell Block into Spike Shell. On successful block, reflects Body damage equal to opponent's stamina push. The harder they hit, the more it hurts them.

**Kill Condition:** Opponent stamina below 3 → Tidal Crush finisher.

**Signature color:** Forest green + rust orange.

---

## THE TYPE CHART

Circular dominance: **Gorilla → Squid → Turtle → Bee → Gorilla.**
Two neutral matchups: Gorilla/Turtle and Squid/Bee (50-50).

| Matchup | Advantage | Why (Mechanical) | Why (Lore) |
|---|---|---|---|
| Gorilla beats Squid (55-45) | Gorilla's 75 Attack vs Squid's 30 Defense = 2.5x damage. Guard pressure overwhelms setup time. | Raw power doesn't negotiate with telepathy. By the time the Squid reads your mind, the fist has already landed. |
| Squid beats Turtle (60-40) | Squid's Mind Spike bypasses the shell entirely. Turtle's 20 Willpower amplifies psychic damage by 2.5x. | The shell stops everything physical. It stops nothing mental. The Turtle's brain is the softest part of the hardest creature. |
| Turtle beats Bee (60-40) | Shell Block beats FAST. Spike Shell reflects even small pushes. Residual Sting barely scratches 75 Defense. | Twelve thousand stings against surgical steel. The math doesn't work for the Bee. The Turtle doesn't even notice. |
| Bee beats Gorilla (55-45) | FAST beats POWER. Scatter dodges everything. Residual Sting chips Body every turn while the Gorilla swings at air. | The Gorilla can't build Momentum against something that won't stand still. Every missed swing is a turn the venom keeps working. |

Advantages are mechanical (stats and move types), not hidden modifiers. Mutations can flip matchups — a Gorilla who harvests Squid tentacles gains Willpower, patching the mental weakness.

---

## THE THREE NPCs

### Commander Vex — Authority

**Role:** Tournament operator. Bracket display. Fight entry. Matchup advice.
**Economy:** None. Information is free.
**Personality:** Military discipline. Grudging respect for winners. Treats everything as routine even when it's insane. His pre-fight briefings are the closest thing to affection he shows — he'd rather not care, but he does.
**Location:** Near arena doors / bracket display, north wall of hub.
**Voice:** Flat, efficient, occasionally annoyed. Silence when impressed.

### Dr. Helix — Biology

**Role:** Mutation harvesting. Biomass grafting. The mad scientist.
**Economy:** Mutations (free, harvested from opponents). Cost is what you destroyed during the fight.
**Personality:** Manic enthusiasm. Every graft is an experiment. Refers to patients as "projects." Medical license revoked by three species' boards. Having the time of his life. His safety record is "mostly" clean.
**Location:** Surgery bay alcove. Dim lighting, specimen jars, operating table.
**Voice:** Excited, fast-talking, genuinely delighted by biological horror.

### RK-7 "Ark" — Technology

**Role:** Cybernetic enhancements. Tech shopping. Upgrades for mutations, moves, passives.
**Economy:** Credits (prize money from fights, scaling 200/400/700 per fight).
**Personality:** Greedy merchant. Purely transactional. Respects money the way Vex respects winning. Calls everyone "customer." Never uses names. Honest because return customers spend more.
**Species:** Autonomous construct. No species, no homeworld, no biological needs. Nobody knows who built it or where its inventory comes from.
**Location:** Workshop alcove opposite Helix. Workbench, tools, sparks, mounted display.
**Voice:** Precise, transactional, occasionally sardonic. Every sentence is a price quote or a product description.

---

## THE FOUR ATTRIBUTES

| Attribute | Effect | Formula |
|---|---|---|
| **Attack** | Multiplies outgoing damage | damage × (Attack / 50) |
| **Defense** | Reduces incoming physical damage | damage × (50 / Defense) |
| **Willpower** | Reduces Composure/psychic damage | damage × (50 / Willpower) |
| **Toughness** | Bonus HP to all mutations | +(Toughness / 10) HP per mutation |

Baseline is 50 = 1.0x. Above 50 = bonus. Below 50 = penalty.

**Player sees own stats as exact numbers.** Opponent stats shown as descriptors on scouting screen: DEVASTATING (70+), STRONG (55-69), AVERAGE (40-54), WEAK (25-39), PATHETIC (<25).

Mutations shift attributes with percentage modifiers: Gorilla grafts give +15% Attack / -5% Willpower. Turtle grafts give +15% Defense / -5% Attack. Etc.

---

## THE FOUR MUTATION SLOTS

| Slot | Protects Resource | Fantasy |
|---|---|---|
| **Head** | Composure | Your mind, your focus |
| **Arms** | Guard | Your physical defense |
| **Torso** | Body | Your health, your vitals |
| **Legs** | Stamina | Your fuel, your ability to act |

Mutations act as armor — damage hits the mutation first. When mutation HP reaches 0: **ARMOR BREAK** (overkill damage bursts through to the resource + full shatter animation + move removed from menu).

Three mutation types: **Shield** (own HP pool absorbs damage), **Pool Expansion** (+max to protected resource), **Reduction** (passively reduces incoming damage).

Tech enhancements attach to mutations. If mutation is replaced or destroyed, tech is LOST.

---

## THE DAMAGE FORMULA

```
raw = baseDamage × staminaPush × (Attack / 50)
reduced = raw × (50 / Defense)  [or Willpower for PSYCHIC]
→ Check mutation armor → Apply weakness/resistance
→ Armor break on mutation death (overkill flows to resource)
→ Finishers bypass ALL mutations, hit Body direct
→ Random variance: × 0.85-1.0
```

Move type determines targeting: POWER → Arms/Guard, FAST → Torso/Body, PSYCHIC → Head/Composure (bypasses physical armor), GRAB → Arms/Guard (+50% to mutation HP), AREA → Torso/Body + 1 splash to adjacent mutation, FINISHER → Body direct.

---

## THE THREE BOSSES

### Echomorph — "The Mirror" (Fight 3 Mini-Boss, Random)
Copies your previous turn's move. Builds adaptive resistance to repeated attacks (0% → 50% → 75% → 90%). Featureless shapeshifter that becomes a distorted copy of you. Punishes spammers, rewards variety.
**Stats:** 50/55/55/60 (BST 220). **Loot:** Adaptive Membrane, Mirror Reflex, Echo Core.

### Hydravine — "The Regenerator" (Fight 3 Mini-Boss, Random)
Regenerates 2 to most damaged resource/mutation per turn. Vine Grasp entangles every 3 turns (+1 costs, evasion disabled). Life steal with Root Drain. Plant-animal hybrid tangle of vines from a jungle planet. Punishes cautious play, rewards burst damage.
**Stats:** 45/60/40/75 (BST 220). **Loot:** Regenerative Membrane, Thorn Bark, Root Network.

### Parasitex — "The Thief" (Fight 4 ALWAYS)
Steals your mutations when destroyed via Assimilate (doubles damage to targeted mutation, 0 to resources). Uses stolen moves at 75% effectiveness. Finisher (Parasitic Bloom) requires 1+ stolen mutation, damage scales with count. Three-phase AI: Hunt → Build → Finish. The fixed final boss every run.
**Stats:** 60/55/50/55 (BST 220). **Loot:** Parasitic Link, Chitin Exoframe, Assimilation Tendril.

Fight 3 boss loot directly prepares you for the Parasitex. Echomorph drops defensive/info mutations. Hydravine drops sustain mutations.

---

## THE POST-FIGHT LOOP

Every fight follows this sequence:

1. **VICTORY SCREEN** (5s) — Stats, kill method, prize money
2. **HARVEST** (player-paced) — Helix examines body, offers 1-3 mutations based on kill method. Destroyed mutations unavailable. Damaged mutations start at 75% HP. Choose one or pass.
3. **GRAFT SCENE** (5-10s) — Cinematic: mutation attaches to sprite. Attributes update.
4. **RETURN TO HUB** (player-paced) — Walk between NPCs. Breathing room.
5. **TECH SHOP** (player-paced) — Ark's workshop. Buy enhancements with credits.
6. **SCOUT** (player-paced) — Bracket display. Next opponent species, partial mutations, attribute descriptors, Vex commentary.
7. **ENTER ARENA** — Walk to door. 2D hub → fight screen transition.

---

## THE ECONOMY

### Resources Between Fights
- Guard: fully restore
- Composure: fully restore
- Body: **restore only 5** (run-level attrition — damage lingers)
- Stamina: fully restore
- Mutation HP: fully restore (Helix patches grafts)

### Prize Money
| Fight | Prize | Cumulative |
|---|---|---|
| 1 | 200 | 200 |
| 2 | 400 | 600 |
| 3 | 700 | 1,300 |
| 4 | — | — |

**Tech capacity:** 10 points per species. Starter tech costs 2. Most enhancements cost 2-3. Player fits 3-5 total enhancements.

---

## THE DEMO STRUCTURE

| Fight | Opponent | Player State After |
|---|---|---|
| 1 | Standard species, 0 mutations, Easy AI | 1/4 slots, starter tech, 0 credits |
| 2 | Standard species, 1 mutation, Moderate AI | 2/4 slots, 1-3 tech enhancements |
| 3 | Echomorph OR Hydravine, Hard AI | 3/4 slots, 2-4 tech, boss loot |
| 4 | PARASITEX (always), Boss AI | Win or die. Everything you built is tested. |

The Pokémon itch: see opponent mutations on bracket (desire) → fight to harvest them (action) → graft onto your body (reward) → see next opponent (desire restarts). By Fight 4, the player IS the build they made. The Parasitex tries to take it apart.

---

## THE VISUAL IDENTITY

**Overworld:** 2D top-down dungeon-crawl aesthetic. WASD movement. Walk to NPCs/doors to interact. Arena doors along north wall, NPC alcoves, holographic tournament bracket on a wall display. Dark sci-fi terminal aesthetic.

**Fight Screen:** Pokémon-style over-the-shoulder view. Player back sprite bottom-left, opponent front sprite top-right. Static sprites with CSS animations (idle bob, attack lunge, hit shake, KO fall). The 3D reveal contrasts with the 2D hub — intentional.

**Mutation Visuals:** Modular sprite system. Base body + attachment layers per slot. Mutations visibly change the sprite. By Fight 4, the player is a Frankenstein of mismatched alien parts. That visual transformation IS the game's identity.

**Shatter Animation:** When a mutation is destroyed mid-fight — crack lines appear, fragments fly off the sprite, the exposed resource bar flashes red, the move grays out on the menu. 0.7 seconds. The momentum-swing moment.

**Art Pipeline:** 16-bit pixel art generated in Scenario.gg. Consistent style locked. 64x96 character sprites, 32x32 overworld tiles. Species color palettes defined. Modular mutation overlays generated as separate assets.

---

## THE MASCOT

**The Cyber Gorilla with the Rocket Fist.** Metal arm forward, jet exhaust trailing, mid-punch. The other arm shows a harvested mutation (tentacle or bee appendage). Torso shows a graft. The silhouette tells the whole game: it's a gorilla, it fights, and it's been changed by fighting.

This image is the Steam capsule art, the title screen, the loading screen, and the social media avatar.

---

## ALL DESIGN DOCUMENTS (Reference)

| Document | Covers |
|---|---|
| `ama-combat-engine.md` | Damage formula, turn flow, matchup chart, status effects, win conditions |
| `ama-progression-mutations.md` | Economy, healing, tech catalog, all 25 mutations, post-fight flow |
| `ama-ai-behavior.md` | AI personalities, difficulty scaling, boss AI, enemy intent |
| `pokemon-pipeline-ama.md` | How Pokémon's design maps to AMA |
| `ama-system-design.md` | Three NPCs, economies, compulsion loop |
| `rocket-fist-spec.md` | Mascot move, hero pose, visual spec |
| `ama-starters-typechart.md` | All 4 starter techs + type chart |
| `ama-boss-design.md` | Echomorph, Hydravine, Parasitex |
| `ama-mutation-combat.md` | Targetable body parts, armor break, slot-to-resource map |
| `ama-attributes.md` | Four stats, BST budgets, mutation modifiers |
| `AMA_Lore_Bible_v1.md` | Complete world history, species lore, NPC backstories, timeline |
| `AMA_In_Game_Lore_Delivery.md` | Intro sequence, dialogue scripts, flavor text, tone guide |
| `The_Art_and_Science_of_Game_Balance.md` | Research doc: lessons from roguelikes, card games, and Pokémon |

---

*"You will enter the arena as whatever species you are. You will leave it as something else entirely. Whether that's a champion or a medical curiosity depends entirely on how well you fight."*
*— Axis-9 Archives Division*
