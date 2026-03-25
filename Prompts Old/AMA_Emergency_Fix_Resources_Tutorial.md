# AMA: EMERGENCY FIX — Resource Pools + Tutorial

**The game is still using old resource values and the tutorial isn't triggering**

---

## Fix 1 — Resource Pools Not Applied

```
CRITICAL BUG: Fights are ending in 1-2 turns because resource pools
are still at their old values. The balance patch didn't take effect.

Search the ENTIRE codebase for where initial resource values are set.
Check:
- Character data files (characters.js or similar)
- Fight initialization logic (where fighters are created at fight start)
- Any hardcoded values in FightScreen or combat engine
- State management (zustand/redux store initial state)
- Any reset functions that run between fights

The values MUST be:
- Guard: 20 (was 10)
- Composure: 20 (was 10)
- Body: 25 (was 10)
- Stamina: 10 (unchanged)
- Stamina regen: +3 per turn (unchanged)

ALSO check the damage formula. Make sure it's:
  damage = baseDamage × staminaCommitted

And NOT something like:
  damage = baseDamage × staminaCommitted × someMultiplier

If there's an accidental multiplier or the base damage values got
inflated, that would also cause one-taps.

Print to console at fight start:
  console.log('PLAYER INIT:', player.guard, player.composure, player.body, player.stamina)
  console.log('OPPONENT INIT:', opponent.guard, opponent.composure, opponent.body, opponent.stamina)

And print on every damage event:
  console.log('DAMAGE:', moveName, 'base:', baseDmg, 'stamina:', push, 'total:', total, 'target:', target, 'before:', valueBefore, 'after:', valueAfter)

This will immediately show if the pools are wrong or the damage is
too high. Fix whatever is wrong. After fixing, a fight should last
15-20 turns minimum, not 1-2.

VERIFY BY PLAYING: After the fix, play a full fight as Cyber Gorilla
vs any opponent. The fight should take at least 10 turns. If you can
still win in under 5 turns with base moves, the numbers are still wrong.
```

---

## Fix 2 — Tutorial Not Triggering

```
BUG: The progressive disclosure tutorial for first-run players is
not working. The game jumps straight to full combat with all systems
visible instead of gradually revealing Body → Guard → Composure.

Check the following:

1. Is there a first-run flag in localStorage?
   Expected: localStorage.getItem('ama_first_run') should be null
   on first ever play, then set to 'false' after completing fight 1.
   
   Open browser dev tools → Application → Local Storage and check
   if the key exists. If it's already set to 'false', clear it:
   localStorage.removeItem('ama_first_run')

2. Is the tutorial phase state being tracked during fight 1?
   There should be a tutorialPhase variable: 'A' | 'B' | 'C' | null
   - Phase A (turns 1-3): only Body visible, simplified moves
   - Phase B (turns 4-6): Guard revealed, matchups activate
   - Phase C (turns 7+): Composure revealed, full system
   
   If tutorialPhase is null or undefined, the tutorial logic isn't
   being initialized. Find where the fight starts and add:
   
   const isFirstRun = localStorage.getItem('ama_first_run') !== 'false';
   let tutorialPhase = isFirstRun ? 'A' : null;

3. Is the tutorial actually hiding UI elements?
   During Phase A, the following should be HIDDEN (display:none or 
   conditional render):
   - Guard bars (both player and opponent)
   - Composure bars (both player and opponent)
   - Moves that target Guard or Composure (grayed out or removed from menu)
   - Matchup panel (no type advantages yet)
   - Full stamina slider (replaced with LIGHT/MEDIUM/HEAVY buttons)
   
   Check the FightScreen component for conditional rendering based on
   tutorialPhase. If there are no conditions, the tutorial render
   logic was never implemented.

4. Is the turn counter advancing tutorialPhase?
   At end of each turn during first run:
   if (tutorialPhase === 'A' && turnNumber >= 4) tutorialPhase = 'B';
   if (tutorialPhase === 'B' && turnNumber >= 7) tutorialPhase = 'C';
   
   When phase transitions happen, show an animation:
   Phase A → B: Guard bars slide in with flash, tutorial text appears
   Phase B → C: Composure bars slide in, full slider appears

5. Is the AI respecting tutorial phases?
   During Phase A: AI should ONLY use Body-targeting moves
   During Phase B: AI can use Body and Guard moves
   Phase C: full AI behavior
   
   Check AIEngine.js for tutorial phase filtering.

6. After fight 1 completes, set the flag:
   localStorage.setItem('ama_first_run', 'false');
   
   All subsequent fights (including fight 2-4 of the SAME run)
   should have tutorialPhase = null (full system from turn 1).

QUICK TEST:
1. Clear localStorage completely: localStorage.clear()
2. Start a new run
3. Fight 1 should start with ONLY Body bars visible
4. Turn 4: Guard bars should appear with a notification
5. Turn 7: Composure bars should appear
6. Fight 2: all systems visible from turn 1
```

---

## Fix 3 — AI Opponent Too Weak

```
If after fixing the resource pools the fight is now the right length
BUT the AI opponent is barely fighting back, check:

1. Is the AI actually committing stamina in Phase 2?
   The AI should push between minCost and minCost+2 for normal moves,
   and 60-80% of pool for aggressive archetypes (Gorilla).
   
   If the AI is always pushing minCost (1-2 stamina), damage will be
   tiny and fights will drag instead of being too fast.

2. Is the AI selecting moves or defaulting to the weakest option?
   Print AI move selection: 
   console.log('AI CHOSE:', selectedMove.name, 'type:', selectedMove.moveType, 'cost:', selectedMove.minCost)
   
   If the AI is always picking the cheapest move, the weighting
   logic isn't working.

3. Does the AI use finishers when available?
   When the finisher condition is met, the AI should ALWAYS pick
   the finisher. If it's not, check the finisher condition evaluation.

4. Is the AI affected by broken states?
   When the AI's Guard or Composure breaks, its move costs should
   double for affected moves. Make sure this penalty applies to the
   AI the same way it applies to the player.
```

---

## Verification Checklist

After applying all fixes, verify:

- [ ] Player starts fight 1 with Guard: 20, Composure: 20, Body: 25
- [ ] Opponent starts with same values
- [ ] Console logs confirm correct initial values
- [ ] A base Gorilla Punch (2 stamina push) deals 4 Guard damage, NOT 20+
- [ ] First fight lasts at least 10-15 turns
- [ ] Tutorial Phase A: only Body bars visible (turns 1-3)
- [ ] Tutorial Phase B: Guard bars appear at turn 4 with notification
- [ ] Tutorial Phase C: Composure appears at turn 7
- [ ] Fight 2 starts with all systems visible (no tutorial)
- [ ] AI actually fights back and commits reasonable stamina
- [ ] Cannot one-tap the opponent with any single move

**If you're still one-tapping after these fixes, paste the console logs
from fight initialization and first damage event and I'll diagnose
the exact problem.**
