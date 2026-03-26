/**
 * Items — consumables used during fights.
 * Using an item costs your turn (opponent attacks unopposed).
 * Categories: RESTORE (heal a resource), BUFF (temporary boost), DISRUPT (debuff opponent), TACTICAL (special utility)
 * Rarity: common (1 biomass), uncommon (2 biomass), rare (3 biomass)
 */

export const items = [
  // ── RESTORE ──────────────────────────────────
  {
    id: 'stamina_serum',
    name: 'Stamina Serum',
    category: 'restore',
    rarity: 'common',
    cost: 1,
    effect: 'restoreStamina',
    value: 5,
    description: 'Restore 5 Stamina immediately.',
    flavor: 'Synthetic adrenaline. Burns fast.',
    icon: '⚡',
  },
  {
    id: 'guard_patch',
    name: 'Guard Patch',
    category: 'restore',
    rarity: 'common',
    cost: 1,
    effect: 'restoreGuard',
    value: 5,
    description: 'Restore 5 Guard.',
    flavor: 'Emergency armor sealant.',
    icon: '🛡',
  },
  {
    id: 'composure_stim',
    name: 'Composure Stim',
    category: 'restore',
    rarity: 'common',
    cost: 1,
    effect: 'restoreComposure',
    value: 5,
    description: 'Restore 5 Composure.',
    flavor: 'Neural stabilizer. Calm under fire.',
    icon: '💎',
  },
  {
    id: 'biofoam_canister',
    name: 'Biofoam Canister',
    category: 'restore',
    rarity: 'uncommon',
    cost: 2,
    effect: 'restoreBody',
    value: 4,
    description: 'Restore 4 Body HP.',
    flavor: 'Alien tissue regenerator. Hurts like hell.',
    icon: '❤',
  },
  {
    id: 'full_restore',
    name: 'Full Restore',
    category: 'restore',
    rarity: 'rare',
    cost: 3,
    effect: 'restoreAll',
    value: 3,
    description: 'Restore 3 to every resource (Guard, Composure, Body, Stamina).',
    flavor: 'Dr. Helix\'s personal blend. Don\'t ask what\'s in it.',
    icon: '✦',
  },

  // ── BUFF ──────────────────────────────────
  {
    id: 'adrenaline_shot',
    name: 'Adrenaline Shot',
    category: 'buff',
    rarity: 'uncommon',
    cost: 2,
    effect: 'doubleDamage',
    value: 1,
    description: 'Next attack deals double base damage.',
    flavor: 'One hit. Make it count.',
    icon: '🔥',
  },
  {
    id: 'iron_skin_vial',
    name: 'Iron Skin Vial',
    category: 'buff',
    rarity: 'uncommon',
    cost: 2,
    effect: 'damageShield',
    value: 3,
    description: 'Block the next 3 incoming damage (any source).',
    flavor: 'Temporary chitin hardening agent.',
    icon: '🪨',
  },
  {
    id: 'focus_lens',
    name: 'Focus Lens',
    category: 'buff',
    rarity: 'rare',
    cost: 3,
    effect: 'guaranteeWin',
    value: 1,
    description: 'Your next move automatically wins its matchup.',
    flavor: 'Predictive combat overlay. One-time neural sync.',
    icon: '🎯',
  },

  // ── DISRUPT ──────────────────────────────────
  {
    id: 'flash_grenade',
    name: 'Flash Grenade',
    category: 'disrupt',
    rarity: 'common',
    cost: 1,
    effect: 'skipOpponentTurn',
    value: 1,
    description: 'Opponent\'s move this turn deals 0 damage.',
    flavor: 'Photon burst. They\'ll swing blind.',
    icon: '💥',
  },
  {
    id: 'scramble_dart',
    name: 'Scramble Dart',
    category: 'disrupt',
    rarity: 'uncommon',
    cost: 2,
    effect: 'scrambleOpponent',
    value: 2,
    description: 'Opponent uses a random move next turn (ignores AI).',
    flavor: 'Neural disruptor. Scrambles fight instinct.',
    icon: '🌀',
  },
  {
    id: 'corrosive_spray',
    name: 'Corrosive Spray',
    category: 'disrupt',
    rarity: 'uncommon',
    cost: 2,
    effect: 'corrosive',
    value: 2,
    description: 'Deal 2 damage to opponent\'s most damaged mutation.',
    flavor: 'Acid mist. Eats through grafts.',
    icon: '☠',
  },

  // ── TACTICAL ──────────────────────────────────
  {
    id: 'smoke_bomb',
    name: 'Smoke Bomb',
    category: 'tactical',
    rarity: 'common',
    cost: 1,
    effect: 'freeItem',
    value: 1,
    description: 'Use this item without giving the opponent a free turn.',
    flavor: 'Cover and recover. Classic.',
    icon: '💨',
  },
  {
    id: 'mutation_repair_kit',
    name: 'Mutation Repair Kit',
    category: 'tactical',
    rarity: 'rare',
    cost: 3,
    effect: 'repairMutation',
    value: 5,
    description: 'Restore 5 HP to your most damaged mutation.',
    flavor: 'Emergency graft stabilizer.',
    icon: '🔧',
  },
  {
    id: 'scanner_pulse',
    name: 'Scanner Pulse',
    category: 'tactical',
    rarity: 'common',
    cost: 1,
    effect: 'revealIntent',
    value: 3,
    description: 'See opponent\'s exact move choice for the next 3 turns.',
    flavor: 'Brainwave decoder. Short range.',
    icon: '📡',
  },
];

// Category metadata for UI
export const ITEM_CATEGORIES = {
  restore:  { label: 'Restore',  color: '#44cc66', description: 'Heal your resources' },
  buff:     { label: 'Buff',     color: '#eab308', description: 'Temporary power boost' },
  disrupt:  { label: 'Disrupt',  color: '#cc4444', description: 'Hinder your opponent' },
  tactical: { label: 'Tactical', color: '#44aaff', description: 'Strategic utility' },
};

export const RARITY_COLORS = {
  common:   '#6a8a9a',
  uncommon: '#44cc66',
  rare:     '#eab308',
};

// Helper: get items by category
export function getItemsByCategory(category) {
  return items.filter(i => i.category === category);
}

// Helper: get random shop offerings (2 common + 1 uncommon/rare)
export function getShopOfferings() {
  const commons = items.filter(i => i.rarity === 'common').sort(() => Math.random() - 0.5);
  const better = items.filter(i => i.rarity !== 'common').sort(() => Math.random() - 0.5);
  return [commons[0], commons[1], better[0]].filter(Boolean);
}
