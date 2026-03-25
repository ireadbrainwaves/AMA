# AMA: BALANCE & UX FIXES — SPRINT PROMPTS

**Resource pool rebalancing + Progressive disclosure tutorial system**
**Apply these AFTER the base game and overworld are working**

---

## Prompt 1 — Increase Resource Pools for Longer Fights

```
Two critical balance and UX changes to the existing game.

CHANGE 1 — INCREASE ALL RESOURCE POOLS FOR LONGER FIGHTS

Current pools are too low. Fights end in under a minute. Target fight
length: 15-20 turns, roughly 10-12 minutes per fight.

New values:
- Guard: 20 (was 10)
- Composure: 20 (was 10)
- Body: 25 (was 10)
- Stamina: 10 (unchanged — stamina stays tight)
- Stamina regen: +3 (unchanged)

Mutation HP pools (for targetable grafted parts):
- Small mutations (move additions): 8 HP
- Large mutations (move replacements): 12 HP
- Cyber-enhanced mutations: +5 HP on top of base

Base damage stays the same (2-3 per move). This means:
- A base Gorilla Punch at minimum push (2 stamina) deals 4 Guard damage
  against a 20 Guard pool. That's 5 clean hits to break Guard.
- With Momentum chain at 3, effective push is 5, dealing 10 Guard damage.
  Now it's 2 hits. That's EARNED power from building the chain.
- A finisher (base 5) at full 10 stamina push deals 50 Body damage.
  Against 25 Body, that's a near-kill but not guaranteed instant death.
  The opponent might survive with items or defensive mutations.

This means fights have an arc:
  Early (turns 1-5): probing, learning patterns, light chip damage
  Mid (turns 6-12): resources cracking, mutations taking damage,
    strategic targeting decisions matter
  Late (turns 13-20): resources broken, mutations destroyed,
    stripped-down desperate scramble, finisher attempts

Update ALL damage calculations, win condition checks, broken state
thresholds, finisher conditions, AI decision weights, and the
stamina push damage preview to work with these new pools.

Broken state thresholds stay at 0 (when the resource hits 0).
Turtle's Tidal Crush condition stays at opponent stamina < 3.

Also: losing moves deal HALF damage (already implemented) but make
sure the damage preview shows this clearly:
  "HALF DAMAGE: 2 base x 3 stamina = 6 / 2 = 3 Guard damage"
```

---

## Prompt 2 — Progressive Disclosure Tutorial (First Run Only)

```
CHANGE 2 — PROGRESSIVE DISCLOSURE FOR FIRST RUN

On a player's FIRST EVER RUN (track in localStorage), the game
teaches one system at a time across the first fight.

FIGHT 1 PROGRESSIVE REVEAL:

Phase A (turns 1-3): BODY ONLY
- Only show Body bar for both fighters (hide Guard and Composure)
- Only show moves that target Body in the move menu
  For Gorilla: Chest Slam and Gorilla Punch (show GP as targeting Body temporarily)
- Move detail panel is simplified: just name, cost, damage, description
- No matchup panel yet. Moves don't counter each other yet — both land every turn.
- Stamina push is simplified: just a "LIGHT / MEDIUM / HEAVY" choice
  that maps to minCost / midrange / max
- Tutorial text at top: "Pick a move. Both fighters reveal at the same time."
- After first reveal: "Nice! You dealt [X] damage. They dealt [Y]."
- After turn 3: "You're getting the hang of it. Let's add more depth..."

Phase B (turns 4-6): ADD GUARD
- Guard bars appear on both fighters with a flash animation
- Tutorial: "GUARD protects fighters. Break their Guard to weaken them."
- Guard-targeting moves unlock on the menu
- Matchup system activates: moves now beat/lose to each other
- Tutorial on first matchup win: "Your POWER move beat their EVASION!
  The type chart matters — check the matchup panel."
- Tutorial on first matchup loss: "Their FAST move beat your POWER.
  Fast beats Power. You still dealt half damage though."

Phase C (turns 7+): ADD COMPOSURE + FULL SYSTEM
- Composure bars appear
- Tutorial: "COMPOSURE is mental state. Psychic attacks target this.
  Break it to unlock certain finishers."
- Full stamina slider replaces the simple Light/Medium/Heavy
- Tutorial: "Now you control exactly how much stamina to commit.
  More stamina = more damage, but watch your gas."
- All moves fully unlocked
- Matchup panel fully active
- Kill condition reminder appears: "BREAK GUARD → PRIMAL RAGE"

FIGHT 2 ONWARD: Full system from turn 1. No tutorials.
Player has learned Guard, Composure, Body, matchups, and stamina
through doing, not reading.

SUBSEQUENT RUNS: Skip ALL progressive disclosure. Full system
from turn 1 of fight 1. Check localStorage for first-run flag.

IMPORTANT: The AI opponent in fight 1 should also play progressively.
During Phase A, AI only uses Body-targeting moves.
During Phase B, AI introduces Guard attacks.
Phase C, full AI behavior.
This prevents the AI from using systems the player hasn't learned yet.
```

---

## Prompt 3 — Counter-Mechanic Opponents

```
Add 3 special opponent types that counter specific player strategies.
These appear in later fights (fight 3 and 4) to test whether the
player can adapt their approach.

OPPONENT 1: THE MIRROR (Species: Echomorph)
- Passive: COPYCAT — every turn, the Echomorph copies the player's
  PREVIOUS turn's move. Turn 1 it picks randomly. Turn 2+ it plays
  whatever you played last turn.
- This means: if you spam Gorilla Punch, the Echomorph is always
  playing Gorilla Punch back at you. You're fighting yourself.
- Counter-strategy: vary your moves. Never play the same thing twice.
  The player who adapts and mixes up wins. The player who found
  "one good move" and spams it gets punished.
- Moves: copies from player, but has 1 unique move "Shatter Copy"
  (type: AREA, cost 3, base 3 Body) that it uses when it has no
  previous move to copy (turn 1) or randomly 20% of the time.
- Weakness: unpredictable players. If you vary moves, the Echomorph
  is always one step behind.

OPPONENT 2: THE REGENERATOR (Species: Hydravine)
- Passive: REGROWTH — at the end of every turn, the Hydravine
  regenerates 2 HP on its most damaged mutation. If no mutations
  are damaged, it regenerates 1 Guard instead.
- This means: you can't slowly chip mutations down. You need to
  commit to destroying one mutation in 2-3 turns or it heals back.
- Counter-strategy: focus fire. Pick ONE mutation and dump everything
  into it before the regen outheals you. Or ignore mutations entirely
  and go straight for the base species body damage.
- Moves: 5 standard moves for its species, nothing special.
  The passive does all the work.
- Weakness: burst damage. High stamina pushes that kill a mutation
  in one or two turns before regen kicks in.

OPPONENT 3: THE THIEF (Species: Parasitex) — BOSS FIGHT ONLY
- Passive: GRAFT STEAL — when the Parasitex destroys one of your
  mutations, it doesn't just remove it. It GRAFTS YOUR MUTATION
  ONTO ITSELF and gains that move. Your tentacle is now on their body.
- This means: the stakes of losing a mutation are doubled. Not only
  do you lose the move, your opponent GAINS it. Every mutation
  destroyed makes them stronger and you weaker simultaneously.
- Counter-strategy: protect your mutations. Play defensively around
  your grafted parts. Or go on pure offense and try to kill the
  Parasitex before it can steal anything. Or — the galaxy brain play —
  deliberately let it steal a WEAK mutation to waste its action while
  you target its core.
- Moves: 3 base species moves + whatever it steals from you.
  Starts with a smaller moveset but grows during the fight.
- Weakness: it starts with only 3 moves. Early aggression before
  it steals anything is the window. Also, stolen mutations keep
  YOUR tech upgrades — but Parasitex doesn't know how to use
  the tech optimally, so enhanced moves deal 75% damage when stolen.

IMPLEMENTATION:
- These are additional species in the character roster, not replacements
- They appear in fight 3 and fight 4 slots on the ladder
- Fight 1-2 are always standard species (Gorilla, Squid, Bee, Turtle)
- Fight 3 can be standard or Echomorph/Hydravine (random)
- Fight 4 (boss) is always Parasitex

SCOUTING SCREEN:
Each counter-mechanic opponent should have a clear warning on their
scouting screen:
  Echomorph: "WARNING: Copies your last move. Predictability is death."
  Hydravine: "WARNING: Regenerates mutations. Commit or lose ground."
  Parasitex: "WARNING: Steals your destroyed mutations. Protect your grafts."
```

---

## Prompt 4 — Mutation Scars (Anti-Snowball)

```
Add the mutation scar system as an anti-snowball mechanic.

When a grafted mutation is destroyed in combat (HP reaches 0),
it doesn't just disappear. It leaves a SCAR — a permanent small
passive bonus for the rest of the run.

SCAR SYSTEM:
- When a mutation is destroyed, the move is removed from your menu
- BUT a "scar" entry appears in a new "Scars" section of your HUD
- Each scar gives a small passive bonus based on what the mutation was

SCAR BONUSES:
- Destroyed POWER mutation: +1 damage to all remaining power moves
- Destroyed FAST mutation: +1 stamina regen per turn
- Destroyed EVASION mutation: 10% chance to auto-dodge any attack each turn
- Destroyed DEFENSE mutation: all incoming damage reduced by 1
- Destroyed PSYCHIC mutation: +1 Composure damage on all attacks
- Destroyed AREA mutation: all attacks gain small splash (chip 1 to a second resource)
- Destroyed GRAB mutation: opponent's stamina costs +1 for 3 turns after the scar forms

DISPLAY:
- Show scars as small icons near your character portrait
- Hover/click to see what each scar does
- When a mutation is destroyed mid-fight, show:
  "MUTATION DESTROYED: [name]"
  then 0.5 second pause
  "SCAR FORMED: [bonus description]"
  The scar bonus activates immediately.

WHY THIS MATTERS:
- Losing a mutation still hurts (you lose the move)
- But it doesn't compound into a death spiral
- A player who loses 2 mutations has 2 scars giving small bonuses
- This keeps them in the fight instead of slowly bleeding out
- It also makes the decision to REPLACE a base move with a mutation
  less terrifying — even if it dies, you get something back
- Creates stories: "I lost my tentacle but the scar gave me +1 regen
  which kept me alive long enough to land Primal Rage"

BALANCE: Scar bonuses are deliberately small. They don't replace
the mutation. They soften the blow. A player with 3 scars and
2 remaining mutations is weaker than a player with 5 mutations,
but they're not helpless.
```

---

## Prompt 5 — Death-As-Progress Meta Systems

```
Add persistent meta-progression that makes death feel like scouting.

These systems persist across ALL runs via localStorage.

SPECIES CODEX:
- Every species you fight gets a codex entry after the fight
  (win or lose — you learned about them either way)
- First encounter: basic info (name, fighting style description)
- Second encounter: reveals their passive ability details
- Third encounter: reveals exact move types and matchup weaknesses
- This info appears on the SCOUTING SCREEN before fights
- First run against a new species: scouting screen shows "???"
  for most info. You're going in blind. That's scary and exciting.
- Fifth run: scouting screen is fully detailed. You know exactly
  what you're facing. Now it's about execution, not discovery.

MUTATION CATALOG:
- Every mutation you've SEEN (harvested, been offered, or seen on
  an opponent) gets cataloged
- Accessible from the overworld as a "Research Terminal" NPC or
  menu option
- Shows: mutation name, type, source species, effect description
- Mutations you've actually USED show usage stats:
  "Times grafted: 3, Times destroyed: 1, Fights won with: 2"
- This helps players plan future runs: "Last run I saw Nerve Tendrils
  offered but took biomass instead. Next run I'll grab it."

DOCTOR'S NOTES:
- Dr. Helix remembers previous runs
- His dialogue references your history:
  Run 1: "First time? This might sting."
  Run 2: "Back from the dead. Let's try something different."
  Run 5: "You again? At this point you're my best customer."
  Run 10: "I've run out of places to attach things. Let's improvise."
- If you died to a specific opponent last run:
  "Ah, the [species] got you. I might have something for that."
  Then his offerings are weighted toward counter-mutations for
  the species that killed you. Subtle, helpful, in-character.

COMMANDER VEX TRACKING:
- Vex tracks your overall record
- "Run [X]. Record: [wins]-[losses]."
- After 3+ losses: "Persistence. I respect that more than talent."
- After first win: "Champion. But can you do it again?"
- After 3+ wins: "You're becoming a regular. The crowd loves you."
- After 10+ runs: "At this point the tournament is YOUR story."

VISUAL: RUN COUNTER
- Show "RUN #[X]" on the character select screen
- Show your best run (how many arenas cleared) as a record
- Simple but tells the player: your history matters here

IMPLEMENTATION:
- All data stored in localStorage under a 'ama_meta' key
- Structure:
  {
    totalRuns: number,
    totalWins: number,
    totalLosses: number,
    bestRun: number (max arenas cleared),
    codex: { [speciesId]: { encounters: number, defeated: number } },
    mutationCatalog: { [mutationId]: { seen: bool, used: bool, timesUsed: number } },
    isFirstRun: boolean
  }
- Load on game start, save after every fight and on run end
```

---

## End of Day Checklist (After All Fixes)

- [ ] Fights last 15-20 turns (10-12 minutes)
- [ ] Resource pools feel right (not too spongy, not too fragile)
- [ ] Base moves chip slowly, upgraded moves hit meaningfully
- [ ] Finishers are powerful but not always instant kills
- [ ] First-run tutorial teaches Body → Guard → Composure progressively
- [ ] Second run skips tutorial entirely
- [ ] AI plays progressively during tutorial fight
- [ ] Counter-mechanic opponents appear in fights 3-4
- [ ] Echomorph punishes spam, Hydravine punishes chip, Parasitex steals mutations
- [ ] Destroyed mutations leave scars with small passive bonuses
- [ ] Species codex fills across runs
- [ ] Doctor and Vex remember you across runs
- [ ] Run counter visible on character select

**Priority: Prompts 1-2 are critical. Ship those first. Prompts 3-5 can layer in after.**
