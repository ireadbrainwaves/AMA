// Mutation Scar System — when a mutation is destroyed, a scar remains

export const SCAR_BONUSES = {
  power:   { name: 'Power Scar',   description: '+1 damage to all power moves', effect: 'powerBonus' },
  fast:    { name: 'Speed Scar',   description: '+1 stamina regen per turn', effect: 'regenBonus' },
  evasion: { name: 'Ghost Scar',   description: '10% auto-dodge chance each turn', effect: 'dodgeChance' },
  defense: { name: 'Armor Scar',   description: 'All incoming damage reduced by 1', effect: 'damageReduction' },
  psychic: { name: 'Mind Scar',    description: '+1 Composure damage on all attacks', effect: 'compBonus' },
  area:    { name: 'Splash Scar',  description: 'All attacks chip 1 to a second resource', effect: 'splashDamage' },
  grab:    { name: 'Grip Scar',    description: "Opponent's stamina costs +1 for 3 turns", effect: 'costPenalty' },
  finisher:{ name: 'Rage Scar',    description: '+1 base damage to finisher', effect: 'finisherBonus' },
};

export function createScar(mutation) {
  const moveType = mutation.move?.moveType || mutation.moveType || 'power';
  const template = SCAR_BONUSES[moveType] || SCAR_BONUSES.power;
  return {
    id: `scar_${mutation.id}_${Date.now()}`,
    fromMutation: mutation.name || mutation.id,
    moveType,
    ...template,
  };
}

// Apply scar effects to damage calculation
export function applyScarEffects(scars, baseDamage, moveType, isAttacker) {
  let bonus = 0;
  for (const scar of scars) {
    if (scar.effect === 'powerBonus' && moveType === 'power') bonus += 1;
    if (scar.effect === 'compBonus' && isAttacker) bonus += 0; // handled separately
    if (scar.effect === 'finisherBonus' && moveType === 'finisher') bonus += 1;
  }
  return baseDamage + bonus;
}

// Check dodge chance from scars
export function checkScarDodge(scars) {
  const ghostScars = scars.filter(s => s.effect === 'dodgeChance');
  for (const scar of ghostScars) {
    if (Math.random() < 0.1) return true; // 10% per scar
  }
  return false;
}

// Get damage reduction from scars
export function getScarDamageReduction(scars) {
  return scars.filter(s => s.effect === 'damageReduction').length;
}

// Get extra regen from scars
export function getScarRegenBonus(scars) {
  return scars.filter(s => s.effect === 'regenBonus').length;
}

// Get composure bonus from scars
export function getScarCompBonus(scars) {
  return scars.filter(s => s.effect === 'compBonus').length;
}
