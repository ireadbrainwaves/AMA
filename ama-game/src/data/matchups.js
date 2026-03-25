// Full 8x8 matchup chart from combat engine spec
// Row = YOUR move type, Column = OPPONENT's move type
// 'win' = your move lands, theirs canceled
// 'lose' = your move canceled
// 'neutral' = both land
const MATCHUP_CHART = {
  power:    { power: 'neutral', fast: 'lose',    grab: 'neutral', psychic: 'neutral', area: 'neutral', defense: 'neutral', evasion: 'win',     finisher: 'neutral' },
  fast:     { power: 'win',     fast: 'neutral',  grab: 'lose',   psychic: 'win',     area: 'lose',    defense: 'lose',    evasion: 'neutral', finisher: 'win' },
  grab:     { power: 'neutral', fast: 'win',      grab: 'neutral', psychic: 'neutral', area: 'neutral', defense: 'win',     evasion: 'lose',   finisher: 'neutral' },
  psychic:  { power: 'neutral', fast: 'lose',     grab: 'neutral', psychic: 'neutral', area: 'neutral', defense: 'win',     evasion: 'neutral', finisher: 'neutral' },
  area:     { power: 'neutral', fast: 'win',      grab: 'neutral', psychic: 'neutral', area: 'neutral', defense: 'lose',    evasion: 'win',    finisher: 'neutral' },
  defense:  { power: 'neutral', fast: 'win',      grab: 'lose',   psychic: 'lose',    area: 'win',     defense: 'neutral', evasion: 'neutral', finisher: 'neutral' },
  evasion:  { power: 'lose',    fast: 'neutral',  grab: 'win',    psychic: 'neutral', area: 'lose',    defense: 'neutral', evasion: 'neutral', finisher: 'win' },
  finisher: { power: 'neutral', fast: 'lose',     grab: 'neutral', psychic: 'neutral', area: 'neutral', defense: 'neutral', evasion: 'lose',   finisher: 'neutral' },
};

// Explanation text for why a type wins
const TYPE_REASONS = {
  'power>evasion':    'too big to dodge',
  'fast>power':       'landed before the swing',
  'fast>psychic':     'struck before the thought formed',
  'fast>finisher':    'interrupted the windup',
  'grab>fast':        'caught mid-strike',
  'grab>defense':     'pulled them out of their shell',
  'psychic>defense':  "can't block a thought",
  'area>fast':        'too wide to outrun',
  'area>evasion':     'nowhere to hide',
  'defense>fast':     'absorbed the quick hits',
  'defense>area':     'braced against the blast',
  'evasion>grab':     'slipped free',
  'evasion>finisher': 'dodged the slow blast',
};

export function resolveMatchup(moveA, moveB) {
  const tA = moveA.moveType;
  const tB = moveB.moveType;

  // Check the full chart first
  const chartResult = MATCHUP_CHART[tA]?.[tB];

  // Also check per-move beats/losesTo arrays for special overrides
  const aBeatsB = chartResult === 'win' || moveA.beats?.includes(tB);
  const bBeatsA = chartResult === 'lose' || moveB.beats?.includes(tA);

  if (aBeatsB && !bBeatsA) {
    const reason = TYPE_REASONS[`${tA}>${tB}`] || `${tA} beats ${tB}`;
    return {
      winner: 'a',
      reason: `${moveA.name} (${tA}) beats ${moveB.name} (${tB}) — ${reason}!`,
      typeReason: reason,
    };
  }
  if (bBeatsA && !aBeatsB) {
    const reason = TYPE_REASONS[`${tB}>${tA}`] || `${tB} beats ${tA}`;
    return {
      winner: 'b',
      reason: `${moveB.name} (${tB}) beats ${moveA.name} (${tA}) — ${reason}!`,
      typeReason: reason,
    };
  }
  // Both beat each other or neither does — neutral
  return {
    winner: 'both',
    reason: 'Both land — no type advantage!',
    typeReason: null,
  };
}

// Get matchup result for a specific move vs all opponent moves
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

// Full type chart for the guide overlay
export const TYPE_MATCHUPS = [
  { attacker: 'power', beats: 'evasion', reason: 'Too big to dodge' },
  { attacker: 'fast', beats: 'power', reason: 'Lands before the swing' },
  { attacker: 'fast', beats: 'psychic', reason: 'Struck before the thought' },
  { attacker: 'fast', beats: 'finisher', reason: 'Interrupts the windup' },
  { attacker: 'grab', beats: 'fast', reason: 'Caught mid-strike' },
  { attacker: 'grab', beats: 'defense', reason: 'Pulls them out' },
  { attacker: 'psychic', beats: 'defense', reason: "Can't block a thought" },
  { attacker: 'area', beats: 'fast', reason: 'Too wide to outrun' },
  { attacker: 'area', beats: 'evasion', reason: 'Nowhere to hide' },
  { attacker: 'defense', beats: 'fast', reason: 'Absorbs the quick hits' },
  { attacker: 'defense', beats: 'area', reason: 'Braced against the blast' },
  { attacker: 'evasion', beats: 'grab', reason: 'Slipped free' },
  { attacker: 'evasion', beats: 'finisher', reason: 'Dodge the slow blast' },
];

export { MATCHUP_CHART };
