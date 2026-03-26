// Channel colors (where damage goes)
export const CHANNEL_COLORS = {
  POWER: '#ee6644',
  PSYCHIC: '#aa66ee',
  FINISHER: '#ff4444',
  SELF: '#4488cc',
};

// Keyword colors (how matchup resolves)
export const KEYWORD_COLORS = {
  GRAB: '#ccaa22',
  FAST: '#ca8a04',
  AREA: '#66cc44',
  DEFENSE: '#4488cc',
  EVASION: '#06b6d4',
};

// Legacy compat — maps old moveType to channel+keyword
export const TYPE_COLORS = {
  power: '#ee6644',
  fast: '#ca8a04',
  evasion: '#06b6d4',
  defense: '#4488cc',
  psychic: '#aa66ee',
  area: '#66cc44',
  grab: '#ccaa22',
  finisher: '#ff4444',
};

export const TYPE_LABELS = {
  power: 'Power',
  fast: 'Fast',
  evasion: 'Evasion',
  defense: 'Defense',
  psychic: 'Psychic',
  area: 'Area',
  grab: 'Grab',
  finisher: 'Finisher',
};

export const characters = {
  cyberGorilla: {
    id: 'cyberGorilla',
    name: 'Cyber Gorilla',
    description: 'Relentless pressure fighter. Break their Guard, then break them.',
    passive: { name: 'Momentum', description: 'Consecutive Guard hits grant +1 free stamina on next Guard move. Chain resets on miss.' },
    killCondition: 'Break Guard → Primal Rage',
    killHint: 'BREAK THEIR GUARD → PRIMAL RAGE',
    style: 'Aggressive pressure. Chains Guard damage to build momentum, then finishes with a devastating beam.',
    strongAgainst: 'Evasion-heavy fighters, defensive turtles',
    weakAgainst: 'Fast strikers, psychic attacks',
    color: '#ff6b35',
    stats: { attack: 75, defense: 50, willpower: 30, toughness: 50 },
    moves: [
      { id: 'gorilla_punch', name: 'Gorilla Punch', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: null, moveType: 'power', flavor: 'Massive overhead strike. Pure POWER through Guard.', isFinisher: false, finisherCondition: null },
      { id: 'ground_pound', name: 'Ground Pound', minCost: 3, baseDamage: 3, channel: 'POWER', keyword: 'AREA', moveType: 'area', flavor: 'Shakes the whole arena. Guard damage + mutation splash.', isFinisher: false, finisherCondition: null, effect: 'areaSplash' },
      { id: 'iron_grip', name: 'Iron Grip', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'GRAB', moveType: 'grab', flavor: "Lock them down. Rips through mutations.", isFinisher: false, finisherCondition: null },
      { id: 'chest_beat', name: 'Chest Beat', minCost: 1, baseDamage: 0, channel: 'SELF', keyword: 'DEFENSE', moveType: 'defense', flavor: 'Pound chest. Brace for impact.', isFinisher: false, finisherCondition: null, effect: 'halfDamage' },
      { id: 'primal_rage', name: 'Primal Rage', minCost: 4, baseDamage: 5, channel: 'FINISHER', keyword: null, moveType: 'finisher', flavor: 'Devastating beam. Requires Guard broken.', isFinisher: true, finisherCondition: 'opponentGuardBroken' },
    ],
  },

  psychoSquid: {
    id: 'psychoSquid',
    name: 'Psycho Squid',
    description: 'Mind breaker. Shatter their composure. Own their menu.',
    passive: { name: 'Paranoia', description: 'When opponent has Composure damage, one move on their menu shows wrong info. At 5+ damage, two moves corrupted.' },
    killCondition: 'Break Composure → Psychic Crush',
    killHint: 'BREAK THEIR COMPOSURE → PSYCHIC CRUSH',
    style: 'Mental warfare. Erodes composure while corrupting your information with Paranoia.',
    strongAgainst: 'Defensive fighters, slow power moves',
    weakAgainst: 'Fast strikers, area attacks',
    color: '#8b5cf6',
    stats: { attack: 35, defense: 30, willpower: 75, toughness: 40 },
    moves: [
      { id: 'tentacle_lash', name: 'Tentacle Lash', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'FAST', moveType: 'fast', flavor: "Quick tendrils through Guard. Faster than raw power.", isFinisher: false, finisherCondition: null },
      { id: 'mind_spike', name: 'Mind Spike', minCost: 2, baseDamage: 2, channel: 'PSYCHIC', keyword: null, moveType: 'psychic', flavor: 'Attacks the mind directly. Composure damage.', isFinisher: false, finisherCondition: null },
      { id: 'ink_cloud', name: 'Ink Cloud', minCost: 1, baseDamage: 1, channel: 'PSYCHIC', keyword: 'EVASION', moveType: 'evasion', flavor: 'Disappear + chip Composure. Dodge and damage.', isFinisher: false, finisherCondition: null },
      { id: 'neural_bind', name: 'Neural Bind', minCost: 3, baseDamage: 2, channel: 'POWER', keyword: 'GRAB', moveType: 'grab', flavor: "Psychic grip through Guard. Rips mutations.", isFinisher: false, finisherCondition: null },
      { id: 'psychic_crush', name: 'Psychic Crush', minCost: 4, baseDamage: 5, channel: 'FINISHER', keyword: null, moveType: 'finisher', flavor: 'Total mental collapse. Requires Composure broken.', isFinisher: true, finisherCondition: 'opponentComposureBroken' },
    ],
  },

  beeSwarm: {
    id: 'beeSwarm',
    name: 'Bee Swarm',
    description: "Elusive attrition. Can't pin them down. Death by a thousand cuts.",
    passive: { name: 'Residual Sting', description: 'End of every turn, opponent takes 1 Body damage. Always ticking.' },
    killCondition: 'Break Composure → Death Cloud',
    killHint: 'BREAK THEIR COMPOSURE → DEATH CLOUD',
    style: 'Fast and evasive. Chips Guard with FAST moves or Composure with Pollen Blind to enable finisher.',
    strongAgainst: 'Slow power moves, raw attackers',
    weakAgainst: 'Area attacks, defensive counters',
    color: '#ca8a04',
    stats: { attack: 60, defense: 25, willpower: 40, toughness: 55 },
    moves: [
      { id: 'sting_barrage', name: 'Sting Barrage', minCost: 1, baseDamage: 2, channel: 'POWER', keyword: 'FAST', moveType: 'fast', flavor: 'Quick stings through Guard. Beats raw power.', isFinisher: false, finisherCondition: null },
      { id: 'swarm_pressure', name: 'Swarm Pressure', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'AREA', moveType: 'area', flavor: "Guard pressure + mutation splash. Can't block every angle.", isFinisher: false, finisherCondition: null, effect: 'areaSplash' },
      { id: 'pollen_blind', name: 'Pollen Blind', minCost: 1, baseDamage: 1, channel: 'PSYCHIC', keyword: null, moveType: 'psychic', flavor: 'Cloud their senses. Composure damage. Death Cloud setup.', isFinisher: false, finisherCondition: null },
      { id: 'scatter', name: 'Scatter', minCost: 1, baseDamage: 0, channel: 'SELF', keyword: 'EVASION', moveType: 'evasion', flavor: 'Disperse instantly. Dodge everything.', isFinisher: false, finisherCondition: null },
      { id: 'death_cloud', name: 'Death Cloud', minCost: 4, baseDamage: 5, channel: 'FINISHER', keyword: null, moveType: 'finisher', flavor: 'All the poison at once. Requires Composure broken.', isFinisher: true, finisherCondition: 'opponentComposureBroken', variableDamage: true },
    ],
  },

  terrorPinTurtle: {
    id: 'terrorPinTurtle',
    name: 'Terror Pin Turtle',
    description: 'Defensive powerhouse. Tire yourself out. Then I end it.',
    passive: { name: 'Stamina Tax', description: 'Every time opponent commits 3+ stamina, they lose 1 additional stamina.' },
    killCondition: 'Break Guard → Tidal Crush',
    killHint: 'BREAK THEIR GUARD → TIDAL CRUSH',
    style: 'Patient and defensive. Blocks everything, taxes your stamina, then crushes when Guard breaks.',
    strongAgainst: 'Fast strikers, aggressive spenders',
    weakAgainst: 'Grabs, psychic attacks',
    color: '#14b8a6',
    stats: { attack: 40, defense: 75, willpower: 20, toughness: 65 },
    moves: [
      { id: 'snap_bite', name: 'Snap Bite', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'GRAB', moveType: 'grab', flavor: 'Counter snap. Rips through Guard and mutations.', isFinisher: false, finisherCondition: null, effect: 'counterHit' },
      { id: 'shell_block', name: 'Shell Block', minCost: 1, baseDamage: 0, channel: 'SELF', keyword: 'DEFENSE', moveType: 'defense', flavor: 'Impenetrable shell. Halves incoming damage.', isFinisher: false, finisherCondition: null, effect: 'halfDamage' },
      { id: 'tremor_stomp', name: 'Tremor Stomp', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'AREA', moveType: 'area', flavor: "Ground-shaking slam. Guard pressure + mutation splash.", isFinisher: false, finisherCondition: null, effect: 'areaSplash' },
      { id: 'fortress_mode', name: 'Fortress Mode', minCost: 2, baseDamage: 0, channel: 'SELF', keyword: 'DEFENSE', moveType: 'defense', flavor: 'Rebuild defenses. +3 Guard.', isFinisher: false, finisherCondition: null, effect: 'regenGuard' },
      { id: 'tidal_crush', name: 'Tidal Crush', minCost: 5, baseDamage: 5, channel: 'FINISHER', keyword: null, moveType: 'finisher', flavor: 'Crushing wave. Requires Guard broken.', isFinisher: true, finisherCondition: 'opponentGuardBroken' },
    ],
  },

  // === COUNTER-MECHANIC OPPONENTS (fights 3-4) ===

  echomorph: {
    id: 'echomorph',
    name: 'Echomorph',
    description: 'Copies your last move. Builds resistance to repeated attacks. Vary your approach.',
    passive: { name: 'Copycat', description: 'Copies your previous move type. Builds resistance to repeated move types (2nd hit -25%, 3rd -50%, 4th+ -75%).' },
    killCondition: 'KO or Decision',
    killHint: 'VARY YOUR MOVES — PREDICTABILITY IS DEATH',
    style: 'Mirrors your fighting style. Builds resistance to repeated attacks. Punishes predictable play.',
    strongAgainst: 'Spam strategies, predictable patterns',
    weakAgainst: 'Varied play, unpredictable fighters',
    color: '#94a3b8',
    isCounterMechanic: true,
    scoutWarning: 'WARNING: Copies your last move. Builds resistance to repeated attacks.',
    stats: { attack: 50, defense: 50, willpower: 50, toughness: 50 },
    moves: [
      { id: 'null_pulse', name: 'Null Pulse', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'AREA', moveType: 'area', flavor: 'Energy blast + splash.', isFinisher: false, finisherCondition: null, effect: 'areaSplash' },
      { id: 'shatter_copy', name: 'Shatter Copy', minCost: 3, baseDamage: 3, channel: 'POWER', keyword: null, moveType: 'power', flavor: 'Emergency fallback. Raw power.', isFinisher: false, finisherCondition: null },
      { id: 'echo_punch', name: 'Echo Punch', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: null, moveType: 'power', flavor: 'Copied strike. Your own power turned back.', isFinisher: false, finisherCondition: null },
      { id: 'echo_dodge', name: 'Echo Dodge', minCost: 1, baseDamage: 0, channel: 'SELF', keyword: 'EVASION', moveType: 'evasion', flavor: 'Copied evasion.', isFinisher: false, finisherCondition: null },
      { id: 'echo_guard', name: 'Echo Guard', minCost: 1, baseDamage: 0, channel: 'SELF', keyword: 'DEFENSE', moveType: 'defense', flavor: 'Copied defense.', isFinisher: false, finisherCondition: null, effect: 'halfDamage' },
      { id: 'echo_spike', name: 'Echo Spike', minCost: 2, baseDamage: 2, channel: 'PSYCHIC', keyword: null, moveType: 'psychic', flavor: 'Copied mind attack. Composure damage.', isFinisher: false, finisherCondition: null },
    ],
  },

  hydravine: {
    id: 'hydravine',
    name: 'Hydravine',
    description: 'Regenerates constantly. Entangles every 3 turns. Commit hard or lose ground.',
    passive: { name: 'Regrowth', description: 'End of every turn, regenerates 2 on its most damaged resource. Vine Grasp fires every 3 turns.' },
    killCondition: 'KO via burst damage',
    killHint: 'COMMIT HARD — CHIP DAMAGE IS FUTILE',
    style: 'Regenerating tank. Slowly heals back chip damage. Entangles to restrict movement.',
    strongAgainst: 'Attrition fighters, low-commitment play',
    weakAgainst: 'Burst damage, FAST attacks',
    color: '#22c55e',
    isCounterMechanic: true,
    scoutWarning: 'WARNING: Regenerates every turn. Entangles every 3 turns.',
    stats: { attack: 45, defense: 55, willpower: 45, toughness: 60 },
    moves: [
      { id: 'vine_lash', name: 'Vine Lash', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'GRAB', moveType: 'grab', flavor: 'Living vines through Guard. Rips mutations.', isFinisher: false, finisherCondition: null },
      { id: 'thorn_burst', name: 'Thorn Burst', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'AREA', moveType: 'area', flavor: 'Guard pressure + mutation splash.', isFinisher: false, finisherCondition: null, effect: 'areaSplash' },
      { id: 'root_drain', name: 'Root Drain', minCost: 3, baseDamage: 2, channel: 'POWER', keyword: 'GRAB', moveType: 'grab', flavor: 'Life-stealing roots. Guard + heal.', isFinisher: false, finisherCondition: null, effect: 'lifeSteal' },
      { id: 'spore_cloud', name: 'Spore Cloud', minCost: 2, baseDamage: 1, channel: 'PSYCHIC', keyword: null, moveType: 'psychic', flavor: 'Toxic spores. Composure + ghost move.', isFinisher: false, finisherCondition: null, effect: 'ghostMove' },
      { id: 'bloom_crush', name: 'Bloom Crush', minCost: 5, baseDamage: 5, channel: 'FINISHER', keyword: null, moveType: 'finisher', flavor: 'Full bloom slam. Requires Guard broken.', isFinisher: true, finisherCondition: 'opponentGuardBroken' },
    ],
  },

  parasitex: {
    id: 'parasitex',
    name: 'Parasitex',
    description: 'Steals your mutations via Assimilate. Three-phase boss. Kill it fast.',
    passive: { name: 'Graft Steal', description: 'When it wins a matchup, it Assimilates: doubles damage to targeted mutation. Destroyed mutations are stolen.' },
    killCondition: 'KO before it steals',
    killHint: 'KILL IT FAST — EVERY STOLEN MUTATION MAKES IT STRONGER',
    style: 'Three-phase parasitic thief. Phase 1: hunts mutations. Phase 2: uses stolen moves. Phase 3: finisher.',
    strongAgainst: 'Heavily mutated players, slow starters',
    weakAgainst: 'Early aggression, psychic attacks',
    color: '#be185d',
    isCounterMechanic: true,
    isBoss: true,
    scoutWarning: 'WARNING: Steals your destroyed mutations. Protect your grafts or kill fast.',
    stats: { attack: 60, defense: 45, willpower: 35, toughness: 55 },
    moves: [
      { id: 'parasite_lunge', name: 'Parasite Lunge', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'FAST', moveType: 'fast', flavor: 'Quick Guard chip. Sets up Assimilate.', isFinisher: false, finisherCondition: null },
      { id: 'chitin_rend', name: 'Chitin Rend', minCost: 3, baseDamage: 3, channel: 'POWER', keyword: null, moveType: 'power', flavor: 'Heavy Guard hit. Raw power.', isFinisher: false, finisherCondition: null },
      { id: 'nerve_tap', name: 'Nerve Tap', minCost: 2, baseDamage: 2, channel: 'PSYCHIC', keyword: null, moveType: 'psychic', flavor: 'Composure pressure. Bypasses Guard.', isFinisher: false, finisherCondition: null },
      { id: 'cocoon', name: 'Cocoon', minCost: 2, baseDamage: 0, channel: 'SELF', keyword: 'DEFENSE', moveType: 'defense', flavor: 'Defensive cocoon. Heals 2 Body.', isFinisher: false, finisherCondition: null, effect: 'cocoonHeal' },
      { id: 'parasitic_bloom', name: 'Parasitic Bloom', minCost: 6, baseDamage: 6, channel: 'FINISHER', keyword: null, moveType: 'finisher', flavor: '+2 per stolen mutation. Requires Guard OR Composure broken.', isFinisher: true, finisherCondition: 'opponentArmorBroken', effect: 'stolenBonus' },
    ],
  },
};
