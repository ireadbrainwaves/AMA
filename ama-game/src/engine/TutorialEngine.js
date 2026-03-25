// Progressive disclosure tutorial — first fight of first run only

export const TUTORIAL_PHASES = {
  BODY_ONLY: 'BODY_ONLY',       // turns 1-3: only Body, no matchups
  ADD_GUARD: 'ADD_GUARD',       // turns 4-6: add Guard, matchups activate
  FULL_SYSTEM: 'FULL_SYSTEM',   // turns 7+: add Composure, full stamina slider
};

export function getTutorialPhase(turn) {
  if (turn <= 3) return TUTORIAL_PHASES.BODY_ONLY;
  if (turn <= 6) return TUTORIAL_PHASES.ADD_GUARD;
  return TUTORIAL_PHASES.FULL_SYSTEM;
}

export function getTutorialHint(turn, phase, event) {
  switch (event) {
    case 'start':
      if (turn === 1) return 'Pick a move. Both fighters reveal at the same time.';
      if (turn === 4) return 'GUARD protects fighters. Break their Guard to weaken them.';
      if (turn === 7) return 'COMPOSURE is mental state. Full system unlocked!';
      return null;
    case 'reveal_win':
      if (phase === TUTORIAL_PHASES.ADD_GUARD)
        return 'You won the matchup! The type chart matters — check the matchup panel.';
      return null;
    case 'reveal_lose':
      if (phase === TUTORIAL_PHASES.ADD_GUARD)
        return 'Their move beat yours. You still dealt half damage though!';
      return null;
    case 'push':
      if (turn === 1) return 'Choose: LIGHT, MEDIUM, or HEAVY commitment.';
      if (turn === 7) return 'Full stamina slider unlocked. Control your exact commitment.';
      return null;
    case 'resource_break':
      return 'Resource broken! Finisher time — check your kill condition!';
    default:
      return null;
  }
}

// Filter moves based on tutorial phase
export function filterMovesForTutorial(moves, phase) {
  if (phase === TUTORIAL_PHASES.BODY_ONLY) {
    // Phase A: only Body-targeting moves (no Guard, no Composure, no finishers)
    return moves.filter(m => m.target === 'body' && !m.isFinisher);
  }
  if (phase === TUTORIAL_PHASES.ADD_GUARD) {
    // Phase B: Body + Guard moves, matchups active, no Composure/finishers
    return moves.filter(m => m.target !== 'composure' && m.moveType !== 'psychic' && !m.isFinisher);
  }
  return moves; // full system
}

// Should matchups be active?
export function shouldUseMatchups(phase) {
  return phase !== TUTORIAL_PHASES.BODY_ONLY;
}

// Simple push options for tutorial Phase A
export const SIMPLE_PUSH_OPTIONS = [
  { label: 'LIGHT', factor: 'min' },
  { label: 'MEDIUM', factor: 'mid' },
  { label: 'HEAVY', factor: 'max' },
];
