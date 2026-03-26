# AMA Session 14B — Pass Bug, Click-Advance Fix, Turtle Matchup, Harvest/Coin UI

**Four fixes. Paste into Claude Code.**

---

## PROMPT — Combined Fixes

```
FOUR ISSUES to fix. Read all four before touching code.

=== FIX 1: CRITICAL — PASS/SKIP TURN BREAKS ADVANCEMENT ===

BUG: When the player passes (skips their turn, does nothing), the game
gets stuck and won't advance to the next turn. The player can't click
forward.

ROOT CAUSE: The click-to-advance system creates an event queue after
each turn resolves. When the player passes, the turn produces NO events
(no damage, no matchup, no regen change worth showing). The event queue
is empty, but the game is still waiting for a click to advance through
events that don't exist.

FIX: After turn resolution, check if the event queue is empty or if
the turn was a pass/skip. If so, skip the click-to-advance phase entirely
and go straight back to MOVE SELECT for the next turn.

Pseudocode:
  function resolveTurn() {
    // ... existing resolution logic ...
    const events = buildEventQueue();
    
    if (events.length === 0 || turnWasPass) {
      // No events to show — skip straight to next turn
      // Add a brief pause (300ms) so the player sees "Pass" text
      // then auto-transition to move select
      showBriefMessage("Pass — no action");
      setTimeout(() => setPhase('MOVE_SELECT'), 400);
    } else {
      // Normal flow — wait for click to advance through events
      setEventQueue(events);
      setPhase('RESOLVING');
    }
  }

Also check: does "pass" even generate a proper turn resolution? It should
still trigger end-of-turn effects:
  - Stamina regen (+2 per the balance patch)
  - Guard/Composure regen (+1 each per the balance patch)
  - Status effect tick-down
  - Opponent's move still resolves (the opponent doesn't pass just because you did)

If the player passes but the OPPONENT attacks, that's NOT an empty queue.
The opponent's attack should still deal damage, and those events should
still show up in the click-through. The bug is specifically when BOTH
sides produce no events, or when the pass handler doesn't properly
build the opponent's events into the queue.

Search for: 'pass', 'skip', 'noAction', 'null move', or any code path
where the player selects no move. Trace what happens after that selection
all the way to the event queue.

VERIFY: Start a fight. Pass your turn (if there's a pass button) or
select a 0-damage defensive move. Confirm:
  1. The opponent's attack still resolves and shows damage
  2. End-of-turn regen still fires
  3. The game advances to the next turn without getting stuck
  4. If BOTH sides somehow produce 0 events, the game still advances


=== FIX 2: CLICK-TO-ADVANCE REFINEMENT ===

The previous prompt said click through EVERY event one at a time. 
That's too many clicks. Revised design:

FLOW PER TURN:
  1. Player picks move → immediate, no click needed
  2. Stamina commit → immediate, no click needed
  3. REVEAL — both moves appear simultaneously. Auto-play, no click.
     Show both move names, show the matchup result (winner highlight),
     show damage numbers, animate bars. ALL of this happens automatically
     over ~1.5 seconds with staggered timing:
       0.0s: Both moves appear
       0.3s: Matchup result text ("POWER beats EVASION!")
       0.6s: Damage numbers float up, bars animate
       0.9s: Any special effects (armor break, status applied)
       1.2s: End-of-turn regen ticks
  4. PAUSE — After all animations finish, show "▶" blink. WAIT FOR CLICK.
  5. Click → back to MOVE SELECT for next turn.

So it's ONE click per turn, after all the action has played out.
The player watches the turn unfold, processes what happened, then
clicks when they're ready for the next turn.

EXCEPTION — if a MAJOR event happens, add an extra pause + click:
  - Mutation destroyed (armor break): pause after the shatter, wait for click,
    THEN show remaining events
  - Fighter KO'd: pause at KO, don't auto-advance to results screen
  - Finisher lands: dramatic pause, wait for click

For normal turns (attack, damage, regen), it's: auto-play → one click.
For big turns (mutation break, KO), it's: auto-play → click → more → click.

Replace the per-event click queue from the previous prompt with this
staggered-auto-play + single-click model. Remove any code that waits
for clicks between individual events within a normal turn.

The "▶ CLICK TO CONTINUE" indicator should still pulse/blink at the
bottom of the screen when the game is waiting for input. Keep that.


=== FIX 3: GORILLA VS TURTLE MATCHUP — AI AND PLAYER GUIDANCE ===

The Gorilla vs Turtle matchup is designed as 50-50 but plays as nearly
unwinnable for the Gorilla. The problem is:

A) The Turtle AI spams Shell Block (DEFENSE type), which BEATS the
   Gorilla's main moves (POWER type). The Gorilla keeps losing matchups.

B) The player doesn't realize they need to use GRAB moves (Iron Grip)
   to counter Shell Block. GRAB beats DEFENSE — this is the Gorilla's
   answer to the Turtle. But if this isn't communicated, the player
   just keeps throwing Gorilla Punch into Shell Block and losing.

TWO-PART FIX:

PART A — AI variety for Turtle:
The Turtle AI should NOT spam Shell Block every turn. Give it a more
varied pattern:

  Turtle AI move selection weights:
    Shell Block:   30% (was probably 50%+)
    Snap Bite:     25% (fast counter-attack, type FAST)
    Anchor Slam:   20% (area control, type AREA)
    Fortress Mode: 15% (guard regen, type DEFENSE)
    Tidal Crush:   10% (finisher, only when conditions met)

The Turtle should rotate between defensive and offensive moves. It's
a DEFENSIVE fighter, not a PASSIVE fighter. Snap Bite is its punish
move — it should use it after blocking to exploit the Gorilla's
recovery. Anchor Slam should come out when the Gorilla uses evasion.

If the current AI has archetype-based or priority-based move selection,
adjust the weights/priorities for the Turtle specifically. The Turtle
should block 1-2 turns, then punish with Snap Bite, then block again.
Pattern: Block → Block → Snap Bite → Anchor Slam → Block. Predictable
enough for the player to learn, varied enough to not feel like a wall.

PART B — Visual move type hints:
On the player's move menu, each move already shows its TYPE badge
(POWER = red, GRAB = green, etc). Add a TOOLTIP or SUBTITLE on the
move that shows what it beats:

  GORILLA PUNCH (POWER)
  Beats: Evasion, Fast
  Loses: Defense, Grab

  IRON GRIP (GRAB)
  Beats: Defense, Evasion
  Loses: Power, Fast

When the player hovers or highlights Iron Grip, they should see
"Beats: Defense" — and if they're fighting a Turtle that keeps
blocking, the connection should be obvious: "Oh, GRAB beats DEFENSE.
I should use Iron Grip."

If the move detail panel already exists (from earlier sprint prompts),
make sure the "Beats / Loses to" info is prominent — not buried in
small text. Use the type badge colors: wins show in green, losses
show in red.

PART C — Scouting hint for Turtle fights:
If Vex commentary exists on the scouting screen, add (or verify) a
line specifically for Gorilla vs Turtle:

  "That Turtle's going to sit behind its shell all day.
   Don't punch the shell. Grab it. Rip it open.
   Iron Grip. Trust me."

This directly tells the player which move to use. It's not subtle.
It doesn't need to be — the player is stuck.


=== FIX 4: HARVEST SCREEN + CREDITS UI POLISH ===

The harvest screen and credits display need a visual upgrade to match
the game's dark sci-fi terminal aesthetic. Here's what to fix:

CREDITS DISPLAY (visible in hub and post-fight):
- Show credits with a terminal-style counter: "CR: 400" or "¢ 400"
- Use a bright color that stands out: #00ff88 (green) or #ffcc00 (gold)
- When credits change (earned or spent), animate the number counting up/down
  with a slot-machine tick effect (fast digit scroll for 0.5s then settle)
- Show credits earned after each fight as a separate line item on the
  victory screen: "+400 CREDITS" with a satisfying count-up animation
- Credits should be visible in the hub HUD (top corner) at all times
  so the player always knows their balance

HARVEST SCREEN REDESIGN:
The harvest screen appears after every fight victory. It should feel
like a medical/surgery terminal — Helix is examining the body.

Layout:
┌─────────────────────────────────────────────────────────┐
│  > OPPONENT NEUTRALIZED                                  │
│  > BIOLOGICAL MATERIAL AVAILABLE                         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  [MUTATION 1] │  │  [MUTATION 2] │  │   [BIOMASS]  │  │
│  │  Gorilla Arm  │  │  Turtle Shell │  │  Raw Material │  │
│  │  Arms Slot    │  │  Torso Slot   │  │  For Doctor   │  │
│  │              │  │              │  │              │  │
│  │  +15% ATK    │  │  +15% DEF    │  │  Currency    │  │
│  │  -5% WILL    │  │  -5% ATK     │  │  for mods    │  │
│  │              │  │              │  │              │  │
│  │  Type: POWER │  │  Type: DEF   │  │              │  │
│  │  12 HP       │  │  12 HP       │  │              │  │
│  │              │  │              │  │              │  │
│  │  [HARVEST]   │  │  [HARVEST]   │  │  [EXTRACT]   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  YOUR CURRENT BUILD:                                     │
│  Head: [empty]  Arms: [Gorilla]  Torso: [empty]  Legs: [empty] │
│  ⚠ Harvesting Arms will REPLACE your current Gorilla graft     │
│                                                          │
│  [SKIP — Take nothing]                                   │
└─────────────────────────────────────────────────────────┘

Key design elements:
- Cards/panels for each harvest option, not a plain text list
- Each card shows: mutation name, which body slot it fills, stat modifiers,
  type, HP, and one line of Helix flavor text
- Cards should have a border glow matching the mutation's species color:
    Gorilla mutations: steel blue (#4488cc) border
    Squid mutations:   purple (#8844cc) border
    Bee mutations:     amber (#cc8800) border
    Turtle mutations:  green (#44aa44) border
- Hovering a card shows a COMPARISON if that slot is occupied:
    "CURRENT: Gorilla Arm (+15% ATK)  →  NEW: Squid Tentacle (+15% WILL)"
    "⚠ WARNING: Replacing will lose Plasma Coating tech (200cr invested)"
- The SKIP option should be clearly available but not the default highlight
  — we want the player to WANT to harvest, not skip by accident
- Clicking a card pops a confirmation: "Harvest [mutation name]? [YES / NO]"
- After harvesting, show a brief "GRAFTING..." animation (terminal text
  scrolling, then "GRAFT COMPLETE" with the new body map updated)

BIOMASS OPTION:
- If biomass is implemented, show it as a third card option
- If it's not implemented yet, don't show it — an option that does nothing
  is worse than no option

POST-FIGHT RESULTS SCREEN (before harvest):
Make sure the victory screen shows:
  - "VICTORY" in large text
  - Fight stats: turns elapsed, damage dealt, damage taken
  - Credits earned: "+400 CREDITS" with count-up animation
  - Kill method: "Guard Break → Primal Rage" or "Body Attrition"
  - [CONTINUE] button to proceed to harvest

Style everything with:
  - Share Tech Mono font
  - Dark background (#0a0a0f)
  - Terminal green (#00ff88) for primary text
  - Amber (#ffaa00) for warnings and currency
  - White (#e0e0e0) for secondary text
  - Bright color accents for interactive elements
  - Subtle scan-line effect or CRT glow if it doesn't hurt readability

VERIFY: Play a full fight through victory → results screen → harvest.
Confirm:
  1. Credits display is readable and updates with animation
  2. Harvest cards show mutation details clearly
  3. Slot conflict warnings appear when replacing
  4. Skip option works without harvesting
  5. The flow doesn't get stuck at any point
```
