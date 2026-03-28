// Resource pool defaults
export const MAX_GUARD = 25;
export const MAX_COMPOSURE = 25;
export const MAX_BODY = 30;
export const MAX_STAMINA = 10;
export const STAMINA_REGEN = 3;  // Restored — diminishing push already prevents burst
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

// Prize money per fight (8-fight ladder)
export const PRIZE_MONEY = {
  1: 150,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
  6: 600,
  7: 700,
  8: 0,   // Final fight — no shop after
};

// Total fights in tournament
export const TOTAL_FIGHTS = 8;

// Unlockable species — beat them as opponents to unlock as playable
export const UNLOCKABLE_SPECIES = ['ironMantis', 'voltamander', 'mycelith'];

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
  neural_overload: {
    id: 'neural_overload',
    name: 'Neural Overload',
    category: 'offensive',
    cost: 400,
    techCost: 3,
    compatible: ['arms', 'head'],
    description: 'On hit, 30% chance opponent next move costs +1 stamina.',
    effect: 'neuralOverload',
    chance: 0.3,
    value: 1,
  },

  // DEFENSIVE
  ablative_armor: {
    id: 'ablative_armor',
    name: 'Ablative Armor',
    category: 'defensive',
    cost: 200,
    techCost: 2,
    compatible: 'any_occupied',
    description: 'First 3 hits to this mutation reduced by 2 each.',
    effect: 'ablativeArmor',
    charges: 3,
    reduction: 2,
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
  emergency_rebuild: {
    id: 'emergency_rebuild',
    name: 'Emergency Rebuild',
    category: 'defensive',
    cost: 500,
    techCost: 3,
    compatible: 'any_occupied',
    description: 'When mutation drops below 30% HP, restore 5 HP (once/fight).',
    effect: 'emergencyRebuild',
    threshold: 0.3,
    healAmount: 5,
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
  target_lock: {
    id: 'target_lock',
    name: 'Target Lock',
    category: 'utility',
    cost: 300,
    techCost: 2,
    compatible: ['arms', 'legs'],
    description: 'Ignores mutation resistance. +3 overkill on mutation destroy.',
    effect: 'targetLock',
    overkillBonus: 3,
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

  // UNIVERSAL BUILD IDENTITY TECHS
  adrenaline_regulator: {
    id: 'adrenaline_regulator',
    name: 'Adrenaline Regulator',
    category: 'identity',
    cost: 400,
    techCost: 3,
    compatible: 'any_occupied',
    description: 'Win matchup → next stamina push costs 1 less.',
    effect: 'adrenalineRegulator',
  },
  siege_protocol: {
    id: 'siege_protocol',
    name: 'Siege Protocol',
    category: 'identity',
    cost: 400,
    techCost: 3,
    compatible: 'any_occupied',
    description: 'Attacks vs mutations deal +2. Attacks vs resources deal -1.',
    effect: 'siegeProtocol',
    bonusMutation: 2,
    penaltyResource: 1,
  },
  endurance_core: {
    id: 'endurance_core',
    name: 'Endurance Core',
    category: 'identity',
    cost: 300,
    techCost: 2,
    compatible: 'any_occupied',
    description: 'Turn 10 and 15: restore 3 to most damaged resource.',
    effect: 'enduranceCore',
    healAmount: 3,
    triggerTurns: [10, 15],
  },
  reflex_amplifier: {
    id: 'reflex_amplifier',
    name: 'Reflex Amplifier',
    category: 'identity',
    cost: 300,
    techCost: 2,
    compatible: 'any_occupied',
    description: 'Lose matchup → gain +2 stamina immediately.',
    effect: 'reflexAmplifier',
    staminaGain: 2,
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

  // NEW SPECIES STARTER TECHS
  mantis_hydraulics: {
    id: 'mantis_hydraulics',
    name: 'Mantis Hydraulics',
    category: 'starter',
    cost: 200,
    techCost: 2,
    compatible: 'ironMantis',
    description: 'Pincer Crush → Hydraulic Vice (clamp lasts 3 turns instead of 2).',
    effect: 'mantisHydraulics',
    transformsMove: 'pincer_crush',
    newMove: { id: 'hydraulic_vice', name: 'Hydraulic Vice', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'GRAB', moveType: 'grab', flavor: 'Enhanced pincers. Extended clamp duration.', isFinisher: false, finisherCondition: null, effect: 'extendedClamp' },
  },
  surge_capacitor: {
    id: 'surge_capacitor',
    name: 'Surge Capacitor',
    category: 'starter',
    cost: 200,
    techCost: 2,
    compatible: 'voltamander',
    description: 'Static Lick → Surge Lick (gains 2 charge instead of 1).',
    effect: 'surgeCapacitor',
    transformsMove: 'static_lick',
    newMove: { id: 'surge_lick', name: 'Surge Lick', minCost: 1, baseDamage: 1, channel: 'POWER', keyword: 'FAST', moveType: 'fast', flavor: 'Supercharged lick. Double charge gain.', isFinisher: false, finisherCondition: null, effect: 'doubleChargeGain' },
  },
  mycorrhizal_boost: {
    id: 'mycorrhizal_boost',
    name: 'Mycorrhizal Boost',
    category: 'starter',
    cost: 200,
    techCost: 2,
    compatible: 'mycelith',
    description: 'Fungal Wall → Spore Fortress (block + spawn 3 constructs instead of 2).',
    effect: 'mycorrhizalBoost',
    transformsMove: 'fungal_wall',
    newMove: { id: 'spore_fortress', name: 'Spore Fortress', minCost: 2, baseDamage: 0, channel: 'SELF', keyword: 'DEFENSE', moveType: 'defense', flavor: 'Enhanced growth. Triple spore spawn.', isFinisher: false, finisherCondition: null, effect: 'tripleSpawn' },
  },
};

export const RUN_MODIFIERS = [
  { id: 'specialist', name: 'Specialist', description: '15 tech capacity instead of 10. Only 2 mutation slots.', unlockCondition: 'Win 10 runs', unlockKey: 'wins >= 10' },
  { id: 'glass_cannon', name: 'Glass Cannon', description: 'Attack x2. Body halved.', unlockCondition: 'Win with 0 mutations', unlockKey: 'puristWin' },
  { id: 'scavenger', name: 'Scavenger', description: 'Start each fight with 1 random item. Credits halved.', unlockCondition: 'Use 20 items total', unlockKey: 'totalItemsUsed >= 20' },
  { id: 'gauntlet', name: 'Gauntlet', description: '6 fights instead of 4. No healing between. Double credits.', unlockCondition: 'Win 5 runs', unlockKey: 'wins >= 5' },
  { id: 'overclocked', name: 'Overclocked', description: 'Tech capacity 20. All tech costs doubled.', unlockCondition: 'Install 15 tech total', unlockKey: 'totalTechInstalled >= 15' },
];

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
    unlockedSpecies: ['cyberGorilla', 'psychoSquid', 'beeSwarm', 'terrorPinTurtle'],  // species IDs unlocked by defeating them
    totalItemsUsed: 0,
    totalTechInstalled: 0,
    puristWin: false,
    unlockedModifiers: [],
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
