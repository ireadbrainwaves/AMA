// Keyword-only matchup chart (Channel determines WHERE damage goes, Keyword determines IF it lands)
// Row = YOUR keyword, Column = OPPONENT's keyword
// null keyword = raw attack (no keyword modifier)
const KEYWORD_CHART = {
  GRAB:    { GRAB: 'neutral', FAST: 'lose',    AREA: 'neutral', DEFENSE: 'win',  EVASION: 'lose',    null: 'neutral' },
  FAST:    { GRAB: 'win',     FAST: 'neutral',  AREA: 'lose',   DEFENSE: 'lose', EVASION: 'neutral', null: 'win' },
  AREA:    { GRAB: 'neutral', FAST: 'win',      AREA: 'neutral', DEFENSE: 'lose', EVASION: 'win',    null: 'neutral' },
  DEFENSE: { GRAB: 'lose',    FAST: 'win',      AREA: 'win',    DEFENSE: 'neutral', EVASION: 'neutral', null: 'neutral' },
  EVASION: { GRAB: 'win',     FAST: 'neutral',  AREA: 'lose',   DEFENSE: 'neutral', EVASION: 'neutral', null: 'neutral' },
  null:    { GRAB: 'neutral', FAST: 'lose',     AREA: 'neutral', DEFENSE: 'neutral', EVASION: 'neutral', null: 'neutral' },
};

const KEYWORD_REASONS = {
  'GRAB>DEFENSE':  'pulled them out of their shell',
  'FAST>GRAB':     'too quick to grab',
  'FAST>null':     'faster than raw power',
  'AREA>FAST':     'too wide to outrun',
  'AREA>EVASION':  'nowhere to hide',
  'DEFENSE>FAST':  'absorbed the quick hits',
  'DEFENSE>AREA':  'braced against the blast',
  'EVASION>GRAB':  'slipped free',
};

export function resolveMatchup(moveA, moveB) {
  const kwA = moveA.keyword || null;
  const kwB = moveB.keyword || null;

  // FINISHER channel: always neutral matchup (lands if precondition met, fizzles if not)
  // SELF channel: defensive — resolved via keyword
  const chartRow = KEYWORD_CHART[kwA] || KEYWORD_CHART[null];
  const result = chartRow?.[kwB] || 'neutral';

  if (result === 'win') {
    const reason = KEYWORD_REASONS[`${kwA}>${kwB}`] || `${kwA || 'raw'} beats ${kwB || 'raw'}`;
    return {
      winner: 'a',
      reason: `${moveA.name} (${kwA || 'raw'}) beats ${moveB.name} (${kwB || 'raw'}) — ${reason}!`,
      typeReason: reason,
    };
  }
  if (result === 'lose') {
    const reason = KEYWORD_REASONS[`${kwB}>${kwA}`] || `${kwB || 'raw'} beats ${kwA || 'raw'}`;
    return {
      winner: 'b',
      reason: `${moveB.name} (${kwB || 'raw'}) beats ${moveA.name} (${kwA || 'raw'}) — ${reason}!`,
      typeReason: reason,
    };
  }
  return {
    winner: 'both',
    reason: 'Both land — no keyword advantage!',
    typeReason: null,
  };
}

export function getMatchupPreview(myMove, opponentMoves) {
  return opponentMoves.map(oppMove => {
    const result = resolveMatchup(myMove, oppMove);
    return {
      move: oppMove,
      result: result.winner === 'a' ? 'win' : result.winner === 'b' ? 'lose' : 'neutral',
      reason: result.typeReason,
    };
  });
}

// For the matchup guide overlay
export const TYPE_MATCHUPS = [
  { attacker: 'FAST', beats: 'GRAB', reason: 'Too quick to grab' },
  { attacker: 'FAST', beats: '(raw)', reason: 'Faster than raw power' },
  { attacker: 'GRAB', beats: 'DEFENSE', reason: 'Pulls them out' },
  { attacker: 'AREA', beats: 'FAST', reason: 'Too wide to outrun' },
  { attacker: 'AREA', beats: 'EVASION', reason: 'Nowhere to hide' },
  { attacker: 'DEFENSE', beats: 'FAST', reason: 'Absorbs the quick hits' },
  { attacker: 'DEFENSE', beats: 'AREA', reason: 'Braced against the blast' },
  { attacker: 'EVASION', beats: 'GRAB', reason: 'Slipped free' },
];

export { KEYWORD_CHART };
