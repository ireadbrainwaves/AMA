// Resource pool defaults
export const MAX_GUARD = 25;
export const MAX_COMPOSURE = 25;
export const MAX_BODY = 30;
export const MAX_STAMINA = 10;
export const STAMINA_REGEN = 2;  // Nerfed from 3 — stamina is a real resource now
export const STAMINA_CAP = MAX_STAMINA;
export const MAX_TURNS = 20;

// Passive shield regen per turn
export const GUARD_REGEN = 1;
export const COMPOSURE_REGEN = 1;

export const INITIAL_RESOURCES = {
  guard: MAX_GUARD,
  composure: MAX_COMPOSURE,
  body: MAX_BODY,
  stamina: MAX_STAMINA,
};

// Between-fight healing (Guard/Comp/Stamina full, Body +8)
export const BETWEEN_FIGHT_HEAL = {
  guard: MAX_GUARD,
  composure: MAX_COMPOSURE,
  body: 8,                // Partial — Body is the permanent scar
  stamina: MAX_STAMINA,
};

// Mutation HP pools
export const MUTATION_HP_SMALL = 8;   // Move additions
export const MUTATION_HP_LARGE = 12;  // Move replacements
export const MUTATION_HP_CYBER = 5;   // Bonus HP for cyber-enhanced

// Prize money per fight
export const PRIZE_MONEY = {
  1: 200,
  2: 400,
  3: 700,
  4: 0,   // Final fight — no shop after
};

// Tech Points system
export const TECH_CAPACITY = 10;  // Total tech points per run

// Tech enhancement catalog
export const TECH_ENHANCEMENTS = {
  // OFFENSIVE
  plasma_coating: {
    id: 'plasma_coating',
    name: 'Plasma Coating',
    category: 'offensive',
    cost: 200,
    techCost: 2,
    compatible: 'any_occupied',
    description: 'Move deals +1 base damage.',
    effect: 'bonusDamage',
    value: 1,
  },
  venom_injector: {
    id: 'venom_injector',
    name: 'Venom Injector',
    category: 'offensive',
    cost: 300,
    techCost: 2,
    compatible: ['arms'],
    description: 'Move applies 1 Body dmg/turn for 2 turns.',
    effect: 'venomDot',
    dotDamage: 1,
    dotDuration: 2,
  },
  neural_scrambler: {
    id: 'neural_scrambler',
    name: 'Neural Scrambler',
    category: 'offensive',
    cost: 400,
    techCost: 3,
    compatible: ['arms', 'head'],
    description: 'Move also chips 1 Composure as secondary.',
    effect: 'chipComposure',
    value: 1,
  },

  // DEFENSIVE
  titanium_reinforcement: {
    id: 'titanium_reinforcement',
    name: 'Titanium Reinforcement',
    category: 'defensive',
    cost: 200,
    techCost: 2,
    compatible: 'any_occupied',
    description: 'Mutation gains +5 HP.',
    effect: 'bonusHP',
    value: 5,
  },
  shock_plating: {
    id: 'shock_plating',
    name: 'Shock Plating',
    category: 'defensive',
    cost: 150,
    techCost: 1,
    compatible: 'any_occupied',
    description: 'Attacker takes 1 Body damage when hitting this part.',
    effect: 'shockReflect',
    value: 1,
  },
  auto_repair: {
    id: 'auto_repair',
    name: 'Auto-Repair Nanites',
    category: 'defensive',
    cost: 500,
    techCost: 3,
    compatible: 'any_occupied',
    description: 'Mutation regenerates 1 HP/turn.',
    effect: 'mutationRegen',
    value: 1,
  },

  // UTILITY
  quick_release: {
    id: 'quick_release',
    name: 'Quick-Release',
    category: 'utility',
    cost: 150,
    techCost: 1,
    compatible: 'any_occupied',
    description: 'Reduce move stamina cost by 1.',
    effect: 'costReduction',
    value: 1,
  },
  tracking_software: {
    id: 'tracking_software',
    name: 'Tracking Software',
    category: 'utility',
    cost: 300,
    techCost: 2,
    compatible: ['arms', 'legs'],
    description: 'Move gains advantage vs evasion.',
    effect: 'antiEvasion',
  },
  overclock: {
    id: 'overclock',
    name: 'Overclock',
    category: 'utility',
    cost: 500,
    techCost: 3,
    compatible: 'any_occupied',
    description: 'Once per fight: use this move twice in one turn.',
    effect: 'doubleUse',
  },

  // PASSIVE UPGRADES (species-specific)
  momentum_capacitor: {
    id: 'momentum_capacitor',
    name: 'Momentum Capacitor',
    category: 'passive',
    cost: 400,
    techCost: 3,
    compatible: 'cyberGorilla',
    description: "Momentum doesn't reset on miss.",
    effect: 'momentumPersist',
  },
  paranoia_amplifier: {
    id: 'paranoia_amplifier',
    name: 'Paranoia Amplifier',
    category: 'passive',
    cost: 400,
    techCost: 3,
    compatible: 'psychoSquid',
    description: 'Corrupted moves show completely wrong info.',
    effect: 'paranoiaAmplify',
  },
  sting_synthesizer: {
    id: 'sting_synthesizer',
    name: 'Sting Synthesizer',
    category: 'passive',
    cost: 300,
    techCost: 2,
    compatible: 'beeSwarm',
    description: 'Residual Sting deals 2 damage instead of 1.',
    effect: 'stingBoost',
  },
  tax_collector: {
    id: 'tax_collector',
    name: 'Tax Collector',
    category: 'passive',
    cost: 300,
    techCost: 2,
    compatible: 'terrorPinTurtle',
    description: 'Stamina Tax triggers on 2+ instead of 3+.',
    effect: 'taxLower',
  },

  // STARTER TECHS (one per species, cost 200, 2tp)
  rocket_fist: {
    id: 'rocket_fist',
    name: 'Rocket Fist',
    category: 'starter',
    cost: 200,
    techCost: 2,
    compatible: 'cyberGorilla',
    description: 'Gorilla Punch → Rocket Punch (split pierce Guard + Body).',
    effect: 'rocketFist',
    transformsMove: 'gorilla_punch',
    newMove: { id: 'rocket_punch', name: 'Rocket Punch', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: null, moveType: 'power', flavor: 'Splits damage between Guard and Body.', isFinisher: false, finisherCondition: null, effect: 'splitPierce' },
  },
  synapse_swap: {
    id: 'synapse_swap',
    name: 'Synapse Swap',
    category: 'starter',
    cost: 200,
    techCost: 2,
    compatible: 'psychoSquid',
    description: 'Mind Spike → Synapse Spike (swaps 2 opponent moves on hit).',
    effect: 'synapseSwap',
    transformsMove: 'mind_spike',
    newMove: { id: 'synapse_spike', name: 'Synapse Spike', minCost: 2, baseDamage: 2, channel: 'PSYCHIC', keyword: null, moveType: 'psychic', flavor: 'Scrambles neural pathways. Swaps 2 opponent moves.', isFinisher: false, finisherCondition: null, effect: 'synapseSwap' },
  },
  hive_thrusters: {
    id: 'hive_thrusters',
    name: 'Hive Thrusters',
    category: 'starter',
    cost: 200,
    techCost: 2,
    compatible: 'beeSwarm',
    description: 'Sting Barrage → Thruster Barrage (hits twice at half damage each).',
    effect: 'hiveThrusters',
    transformsMove: 'sting_barrage',
    newMove: { id: 'thruster_barrage', name: 'Thruster Barrage', minCost: 1, baseDamage: 2, channel: 'POWER', keyword: 'FAST', moveType: 'fast', flavor: 'Twin thruster strikes. Hits twice, half each.', isFinisher: false, finisherCondition: null, effect: 'doubleHit' },
  },
  spike_plating: {
    id: 'spike_plating',
    name: 'Spike Plating',
    category: 'starter',
    cost: 200,
    techCost: 2,
    compatible: 'terrorPinTurtle',
    description: 'Shell Block → Spike Shell (reflects stamina push as Body damage).',
    effect: 'spikePlating',
    transformsMove: 'shell_block',
    newMove: { id: 'spike_shell', name: 'Spike Shell', minCost: 1, baseDamage: 0, channel: 'SELF', keyword: 'DEFENSE', moveType: 'defense', flavor: 'Spiked shell. Reflects attacker stamina as Body damage.', isFinisher: false, finisherCondition: null, effect: 'spikeReflect' },
  },
};

// Helper: get available tech for a species + slot
export function getAvailableTech(speciesId, slotName) {
  return Object.values(TECH_ENHANCEMENTS).filter(tech => {
    if (tech.compatible === 'any_occupied') return true;
    if (tech.compatible === speciesId) return true;
    if (Array.isArray(tech.compatible) && tech.compatible.includes(slotName)) return true;
    return false;
  });
}

// Meta-progression localStorage key
export const META_KEY = 'ama_meta';

export function getDefaultMeta() {
  return {
    totalRuns: 0,
    totalWins: 0,
    totalLosses: 0,
    bestRun: 0,
    codex: {},
    mutationCatalog: {},
    isFirstRun: true,
    doctorVisits: 0,
    lastDeathSpecies: null,
  };
}

export function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return { ...getDefaultMeta(), ...JSON.parse(raw) };
  } catch (e) {}
  return getDefaultMeta();
}

export function saveMeta(meta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {}
}
