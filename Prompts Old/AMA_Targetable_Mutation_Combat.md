# AMA: TARGETABLE MUTATION COMBAT SYSTEM

**How targeting, mutation HP, fog of war, and destruction work in fights**

---

## Core Concept

Every fight in AMA is a war on two fronts. You're chipping resources (Guard, Composure, Body) to unlock your finisher AND dismantling the opponent's mutations to strip their strongest moves. Attacks to mutations also chip the resource they'd normally target — so you're never choosing between two separate goals. You're progressing both at once.

---

## Turn Structure (Updated with Targeting)

### Phase 1: Move Select + Target Select (Two Clicks)

**Click 1: Pick your move** from the menu. Same as before — see matchup panel, type advantages, damage preview.

**Click 2: Pick your target** on the opponent's body. The target panel appears after you select a move, showing all valid targets:

```
TARGET SELECT:
┌────────────────────────────────────────────┐
│  Where do you aim GORILLA PUNCH?           │
│                                            │
│  [BODY]        — Direct resource damage    │
│                  2 base × push = Guard dmg │
│                                            │
│  [RIGHT ARM]   — Tentacle Lash (mutation)  │
│    💀 HP: ???   | Weakness: Power (2x!)    │
│    2 base × push = mutation dmg            │
│    + chips Guard as secondary              │
│                                            │
│  [BACK]        — Bee Wings (mutation)      │
│    💀 HP: ???   | Weakness: Area           │
│    2 base × push = mutation dmg            │
│    + chips Guard as secondary              │
│                                            │
│  [CHEST]       — No mutation (base only)   │
│    Cannot target base body parts.          │
└────────────────────────────────────────────┘
```

**Then commit.** Both fighters reveal simultaneously. Matchup resolves. Then stamina push (Phase 2) as normal.

### Phase 2: Stamina Push (unchanged)

After reveal, commit stamina. Damage calculated against chosen target.

### Resolution

If targeting a mutation:
- Primary damage goes to the mutation's HP
- Secondary damage (reduced) chips the resource the move normally targets
- Secondary damage = 25% of primary damage (rounded down, minimum 1)

If targeting BODY (no specific mutation):
- Full damage goes to the targeted resource as normal
- No mutation takes damage

---

## The Target Panel

### What You See

When you select a move, the target panel shows the opponent's body layout:

```
OPPONENT BODY MAP:
        [HEAD] — Neural Implant (mutation)
           💀 HP: ??? | Weak: Power
    ┌──────┼──────┐
[L ARM]  [CHEST]  [R ARM] — Tentacle (mutation)
 base     base     💀 HP: 6/8 | Weak: Power
    └──────┼──────┘
        [LEGS]
         base
    ┌──────┼──────┐
  [BACK] — Shell Plating (mutation)
    💀 HP: ??? | Weak: Grab

  [BODY] — Direct resource damage (always available)
```

**Base body parts** (no mutation) cannot be individually targeted. They're protected by Guard. To damage the opponent's core, target BODY for resource damage.

**Mutated body parts** show the mutation name, weakness type, and HP status (fog of war rules apply).

**BODY target** is always available. This is the "ignore mutations, go straight for resources" option.

### Visual Presentation

The opponent's character sprite is displayed with mutation attachments visible. Each targetable mutation has a subtle highlight/outline when the target panel is active. Hovering over a mutation shows its info. Clicking commits the target.

Keep it fast — two clicks total. Move menu click → target click → committed. Should take under 5 seconds for an experienced player.

---

## Fog of War on Mutation HP

### Rules

Mutation HP is HIDDEN by default. The player doesn't know how tough a mutation is until they interact with it.

**HP Revealed When:**
1. You've dealt damage to that mutation at least once this fight — then you see current/max HP
2. The mutation was in your Species Codex at "third encounter" level — then you see max HP from the start
3. You used a Scanner Array tech upgrade — reveals all mutation HP at fight start

**HP Hidden When:**
- First encounter with a species
- Haven't hit that specific mutation yet
- Shows "???" instead of HP numbers

### Why Fog of War

- **First fights feel dangerous.** You don't know if that tentacle has 8 HP or 15 HP (with Titanium Reinforcement). You're probing.
- **Scouting screen matters more.** The scouting screen before a fight tells you what mutations the opponent has but NOT their HP. You plan your targeting priority based on type weaknesses, not health pools.
- **Knowledge compounds across runs.** The Species Codex fills over multiple runs. By run 5, you know exactly how tough a Gorilla's mutations are. Run 1, you're guessing. This is the "death as progress" meta-learning.
- **Creates drama.** You think one more hit will destroy the tentacle. You commit heavy stamina. The mutation survives at 1 HP because it had a Titanium Reinforcement you didn't know about. That's a story.

### Fog of War UI

```
BEFORE hitting a mutation:
  [R ARM] Tentacle Lash
  💀 HP: ???
  Weakness: Power (2x)

AFTER hitting it once (dealt 5 damage, it has 8 max):
  [R ARM] Tentacle Lash
  💀 HP: 3/8 ████░░░░
  Weakness: Power (2x)
  
CODEX KNOWLEDGE (3+ encounters with this species):
  [R ARM] Tentacle Lash
  💀 HP: ?/8 (max known, current unknown)
  Weakness: Power (2x)
```

---

## Damage to Mutations

### Primary Damage (to mutation HP)

When you target a mutation, your move's full damage goes to the mutation's HP pool.

```
Gorilla Punch (base 2) × 4 stamina push = 8 damage to mutation HP
```

### Weakness Multiplier

If your move type matches the mutation's weakness, damage is DOUBLED.

```
Gorilla Punch (POWER type) vs Tentacle (weak to POWER):
2 base × 4 stamina × 2 weakness = 16 damage to mutation HP

This can one-shot an 8 HP mutation with a moderate stamina push.
That's the "right tool for the job" reward.
```

### Secondary Resource Chip

Attacks aimed at mutations ALSO chip the resource the move normally targets. This means targeting mutations is never a waste — you're progressing toward your finisher condition AND dismantling their build.

```
Secondary damage = 25% of primary damage (rounded down, minimum 1)

Gorilla Punch targeting tentacle:
Primary: 8 damage to tentacle HP
Secondary: 2 Guard chip (25% of 8)

With weakness multiplier:
Primary: 16 damage to tentacle HP
Secondary: 4 Guard chip (25% of 16)
```

### Losing the Matchup

If your move loses the matchup, it deals HALF damage as normal. This applies to both primary (mutation damage) and secondary (resource chip).

```
Lost matchup Gorilla Punch targeting tentacle:
Primary: 8 ÷ 2 = 4 mutation damage
Secondary: 1 Guard chip (25% of 4)
```

### Targeting BODY (no mutation)

If you target BODY instead of a specific mutation, full damage goes to the resource as normal. No mutation takes damage. This is the "ignore their build, race for the finisher" strategy.

---

## Mutation Destruction

### When HP Hits 0

When a mutation's HP reaches 0:

1. **Destruction Animation:** The mutation visually shatters off the character. Sprite pieces fly outward with particle effects. Sound effect: cracking/breaking.

2. **Move Removed:** The mutation's move is immediately removed from the opponent's menu. If it was a REPLACE mutation, that move slot is now EMPTY — the base move does NOT return.

3. **Scar Formed:** A scar passive bonus is granted (see Mutation Economy doc). Brief notification: "MUTATION DESTROYED → SCAR: +1 damage to power moves"

4. **Tech Lost:** Any tech points invested in that mutation are gone. No refund in combat. The notification shows: "2 TECH LOST" as a secondary line.

5. **Momentum Shift:** This is the equivalent of KOing a Pokémon on their team. The crowd roars. Brief screen flash. The player feels a surge of progress.

### What the Opponent Loses

| Mutation Type | What's Lost |
|---------------|-------------|
| ADD mutation destroyed | The added move. Menu shrinks by 1. Tech invested is lost. |
| REPLACE mutation destroyed | The replacement move AND the original base move (already gone). Menu shrinks by 1 and that slot is permanently empty. Tech invested is lost. |

### What the Opponent Gains (Scars)

Small passive bonus based on the destroyed mutation's type (see Mutation Economy doc). This prevents full snowball — the opponent is weaker but not helpless.

---

## AI Targeting Behavior

The AI needs to target player mutations intelligently.

### AI Targeting Priority

1. **Highest threat mutation:** If the player has a mutation that's been dealing massive damage, the AI prioritizes destroying it. Track "damage dealt by this mutation this fight" and target the highest.

2. **Weakness matching:** If the AI has a move whose type matches a player mutation's weakness, it will preferentially target that mutation (2x damage = efficient destruction).

3. **Low HP mutation:** If a player mutation is below 50% HP, the AI sees a chance to finish it off and goes for it.

4. **Tech-heavy mutation:** If the AI can detect (or estimate) that a mutation has tech upgrades, it prioritizes destroying it to waste the player's tech investment.

5. **Default to BODY:** If no mutation is an efficient target (no weakness match, all at high HP), the AI targets BODY for straight resource damage.

### AI Archetype Modifiers

- **Gorilla AI:** Favors direct BODY targeting. Brute force, doesn't bother with surgical mutation targeting unless a weakness lines up.
- **Squid AI:** Targets mutations that grant physical defense. Strips the player's protection before going for the mind.
- **Bee AI:** Targets the weakest/lowest HP mutation. Picks off easy kills.
- **Turtle AI:** Doesn't target mutations much. Focuses on draining stamina through BODY targeting and passive tax.
- **Parasitex AI (boss):** ALWAYS targets mutations. It wants to steal them.

---

## Target Selection UX Details

### Move Menu Integration

When you highlight a move in your menu, the detail panel now shows an additional section:

```
GORILLA PUNCH
Type: POWER | Cost: 2 stamina
Base Damage: 2 | Target: Guard

VS BEE SWARM:
✅ Beats: Scatter (evasion)
❌ Loses to: Sting Barrage (fast)

TARGET OPTIONS:
→ BODY: 2×push Guard damage (standard)
→ [BACK] Bee Wings: 2×push mutation dmg (WEAK! 2x)
  + chips Guard as secondary
→ [R ARM] Stinger Arm: 2×push mutation dmg
  + chips Guard as secondary
```

The weakness callout (WEAK! 2x) should be prominently highlighted in red or gold. This is the "super effective" moment — the player should feel smart for matching types.

### Quick Target

For speed, provide defaults:
- If you've been targeting the same mutation for 2+ turns, default to that target on your next move selection
- Press TAB to cycle targets quickly
- BODY is always the first/default target (safe option)

### Target Lock Indicator

After committing, your chosen target is shown with a crosshair or highlight on the opponent's character sprite. This confirms your aim before the reveal.

```
COMMITTED: GORILLA PUNCH → [BACK] Bee Wings
           Waiting for opponent...
```

---

## Interaction with Existing Systems

### Passives and Targeting

**Gorilla Momentum:** Chain only counts if the move targeted BODY or a mutation where the secondary chip hits Guard. Targeting a mutation whose secondary chips Composure doesn't build the Guard chain.

**Squid Paranoia:** Can corrupt the TARGET DISPLAY — a mutation might show the wrong weakness type, or its HP display (if revealed) might be off by a few points. The player thinks the tentacle is weak to Power but it's actually not corrupted, the display is wrong.

**Bee Residual Sting:** Sting damage goes to BODY, not mutations. It's unavoidable Body chip, not targetable damage.

**Turtle Stamina Tax:** Works the same regardless of target. Stamina cost is stamina cost.

### Broken States and Targeting

When Guard is broken, the opponent's mutations DON'T become more vulnerable. Broken Guard affects the opponent's move costs, not their mutation toughness.

When a mutation is destroyed, it doesn't affect other mutations. Each mutation is independent.

### Items and Targeting

Items don't target mutations. Stamina Serum, Guard Patch, etc. affect your own resources. They're self-buffs, not attacks.

The one exception: **Mutation Sealant** (item) makes one of YOUR mutations take no damage for 3 turns. You choose which mutation to protect when you use it.

### Finishers and Targeting

Finishers target BODY, not mutations. They're the kill shot — they go for the core. You can't aim a finisher at a mutation.

This means mutations are never the win condition — they're the obstacles you clear on the way to the win condition. Destroying mutations is PROGRESS, not VICTORY. Victory comes from the finisher hitting Body.

---

## Damage Flow Example

**Turn 8 of a fight. Player is Cyber Gorilla vs Bee Swarm.**

Bee has:
- Body: 18/25
- Guard: 12/20
- Composure: 15/20
- [BACK] Bee Wings (mutation, 5/8 HP, weak to AREA)
- [R ARM] Stinger Arm (mutation, 8/8 HP, weak to GRAB)

Player selects: **Ground Pound** (AREA type, base 1+1, targets Guard+Composure)
Player targets: **[BACK] Bee Wings** (weak to AREA!)

Both reveal. Ground Pound vs Scatter. AREA beats EVASION. Player wins matchup.

Stamina push: Player commits 4 stamina.

**Resolution:**
```
Ground Pound base: 1+1 (Guard+Composure)
Total base for mutation targeting: 2
Stamina: 4
Weakness multiplier: 2x (AREA vs Bee Wings weakness)

PRIMARY (to Bee Wings HP):
2 base × 4 stamina × 2 weakness = 16 mutation damage
Bee Wings HP: 5 - 16 = DESTROYED (overkill)

SECONDARY (resource chip):
25% of 16 = 4, split across Guard and Composure
Guard: 12 - 2 = 10
Composure: 15 - 2 = 13

RESULT:
"BEE WINGS DESTROYED!" — mutation shatters off
"SCAR FORMED: +10% auto-dodge chance"
Guard: 10/20
Composure: 13/20
Bee Swarm loses the Bee Wings move from their menu.
```

One well-aimed attack with weakness matching destroyed a mutation AND chipped two resources. The player feels like a genius. That's the target state.

---

## Summary: What Targeting Adds to Each Turn

Without targeting (old system):
1. Pick move
2. Reveal
3. Push stamina
→ Damage goes to a resource bar

With targeting (new system):
1. Pick move + pick target (two clicks, one phase)
2. Reveal
3. Push stamina
→ Damage goes to a mutation AND chips a resource bar
→ OR damage goes straight to a resource bar (if targeting BODY)

One extra click per turn. Massive strategic depth added. Every turn you're asking: "Do I go for their mutation or their resources? Which mutation is the priority? Do I have the right type to exploit a weakness?"

That's the Pokémon depth. That's a 10-minute fight with real decisions every turn.
