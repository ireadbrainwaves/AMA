// Bot vs Bot Fight Simulator — headless combat for balance testing
// Usage: node -e "import('./src/engine/BotSimulator.js')" or call from dev console

import { characters } from '../data/characters';
import { MAX_GUARD, MAX_COMPOSURE, MAX_BODY, MAX_STAMINA, STAMINA_REGEN, STAMINA_CAP, MAX_TURNS, GUARD_REGEN, COMPOSURE_REGEN } from '../data/constants';
import { resolveMatchup } from '../data/matchups';

// Diminishing push returns (same as FightScreen)
function effectivePush(push) {
  if (push <= 3) return push;
  return 3 + (push - 3) * 0.5;
}

function calcDamage(move, push, atkStat, defStat, wonMatchup) {
  if (!move || push <= 0) return 0;
  const atkMod = (atkStat || 50) / 50;
  const ePush = effectivePush(push);
  const raw = move.baseDamage * ePush * atkMod;
  const channel = move.channel || 'POWER';
  const dStat = channel === 'PSYCHIC' ? defStat : defStat;
  const reduced = raw * (50 / Math.max(1, dStat || 50));
  const matchMult = wonMatchup ? 1 : 0.5;
  const variance = 0.85 + Math.random() * 0.15;
  return Math.max(1, Math.floor(reduced * matchMult * variance));
}

function botPickMove(moves, stamina, broken) {
  const affordable = moves.filter(m => {
    let cost = m.minCost;
    if (broken.guard && (m.target === 'defense' || m.target === 'regen')) cost *= 2;
    if (broken.composure && (m.target === 'evasion' || m.target === 'utility')) cost *= 2;
    if (stamina < 3) cost += 1;
    return cost <= stamina;
  });
  if (affordable.length === 0) return null;
  // Random pick weighted toward higher damage
  const weights = affordable.map(m => m.baseDamage + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < affordable.length; i++) {
    r -= weights[i];
    if (r <= 0) return affordable[i];
  }
  return affordable[affordable.length - 1];
}

function botPickPush(move, stamina) {
  // Push 40-70% of current stamina
  const min = move.minCost;
  const ratio = 0.4 + Math.random() * 0.3;
  return Math.max(min, Math.min(stamina, Math.round(stamina * ratio)));
}

function routeDamage(dmg, channel, res) {
  if (channel === 'FINISHER') {
    res.body = Math.max(0, res.body - dmg);
    return;
  }
  if (channel === 'SELF') return;

  const armor = channel === 'PSYCHIC' ? 'composure' : 'guard';
  if (res[armor] <= 0) {
    res.body = Math.max(0, res.body - dmg);
  } else if (dmg >= res[armor]) {
    const overflow = dmg - res[armor];
    res[armor] = 0;
    if (overflow > 0) res.body = Math.max(0, res.body - overflow);
  } else {
    res[armor] = Math.max(0, res[armor] - dmg);
  }
}

export function simulateFight(speciesA, speciesB) {
  const charA = characters[speciesA];
  const charB = characters[speciesB];
  if (!charA || !charB) return { error: `Unknown species: ${speciesA} or ${speciesB}` };

  const resA = { guard: MAX_GUARD, composure: MAX_COMPOSURE, body: MAX_BODY, stamina: MAX_STAMINA };
  const resB = { guard: MAX_GUARD, composure: MAX_COMPOSURE, body: MAX_BODY, stamina: MAX_STAMINA };
  const statsA = charA.stats || { attack: 50, defense: 50, willpower: 50 };
  const statsB = charB.stats || { attack: 50, defense: 50, willpower: 50 };

  let turn = 0;
  let staminaStarvedA = 0; // turns where A couldn't act
  let staminaStarvedB = 0;

  for (turn = 1; turn <= MAX_TURNS; turn++) {
    const brokenA = { guard: resA.guard <= 0, composure: resA.composure <= 0, stamina: resA.stamina < 3 };
    const brokenB = { guard: resB.guard <= 0, composure: resB.composure <= 0, stamina: resB.stamina < 3 };

    const moveA = botPickMove(charA.moves, resA.stamina, brokenA);
    const moveB = botPickMove(charB.moves, resB.stamina, brokenB);

    if (!moveA) staminaStarvedA++;
    if (!moveB) staminaStarvedB++;
    if (!moveA && !moveB) {
      // Both starved — regen and continue
      resA.stamina = Math.min(STAMINA_CAP, resA.stamina + STAMINA_REGEN);
      resB.stamina = Math.min(STAMINA_CAP, resB.stamina + STAMINA_REGEN);
      continue;
    }

    // Resolve matchup
    let winner = 'both';
    if (moveA && moveB) {
      const result = resolveMatchup(moveA, moveB);
      winner = result.winner === 'a' ? 'a' : result.winner === 'b' ? 'b' : 'both';
    } else if (moveA && !moveB) {
      winner = 'a';
    } else {
      winner = 'b';
    }

    const aWon = winner === 'a' || winner === 'both';
    const bWon = winner === 'b' || winner === 'both';

    // Push
    const pushA = moveA ? botPickPush(moveA, resA.stamina) : 0;
    const pushB = moveB ? botPickPush(moveB, resB.stamina) : 0;

    // Damage
    if (moveA && pushA > 0) {
      const defStat = (moveA.channel === 'PSYCHIC') ? statsB.willpower : statsB.defense;
      const dmg = calcDamage(moveA, pushA, statsA.attack, defStat, aWon);
      routeDamage(dmg, moveA.channel || 'POWER', resB);
      resA.stamina -= pushA;
    }
    if (moveB && pushB > 0) {
      const defStat = (moveB.channel === 'PSYCHIC') ? statsA.willpower : statsA.defense;
      const dmg = calcDamage(moveB, pushB, statsB.attack, defStat, bWon);
      routeDamage(dmg, moveB.channel || 'POWER', resA);
      resB.stamina -= pushB;
    }

    // Regen
    resA.stamina = Math.min(STAMINA_CAP, resA.stamina + STAMINA_REGEN);
    resB.stamina = Math.min(STAMINA_CAP, resB.stamina + STAMINA_REGEN);
    if (resA.guard > 0 && resA.guard < MAX_GUARD) resA.guard = Math.min(MAX_GUARD, resA.guard + GUARD_REGEN);
    if (resA.composure > 0 && resA.composure < MAX_COMPOSURE) resA.composure = Math.min(MAX_COMPOSURE, resA.composure + COMPOSURE_REGEN);
    if (resB.guard > 0 && resB.guard < MAX_GUARD) resB.guard = Math.min(MAX_GUARD, resB.guard + GUARD_REGEN);
    if (resB.composure > 0 && resB.composure < MAX_COMPOSURE) resB.composure = Math.min(MAX_COMPOSURE, resB.composure + COMPOSURE_REGEN);

    // KO check
    if (resB.body <= 0) return { winner: speciesA, turns: turn, reason: 'KO', staminaStarvedA, staminaStarvedB, finalA: resA, finalB: resB };
    if (resA.body <= 0) return { winner: speciesB, turns: turn, reason: 'KO', staminaStarvedA, staminaStarvedB, finalA: resA, finalB: resB };
  }

  // Decision
  const totalA = resA.guard + resA.composure + resA.body;
  const totalB = resB.guard + resB.composure + resB.body;
  return {
    winner: totalA >= totalB ? speciesA : speciesB,
    turns: MAX_TURNS,
    reason: 'Decision',
    staminaStarvedA,
    staminaStarvedB,
    finalA: resA,
    finalB: resB,
  };
}

export function runBatch(speciesA, speciesB, count = 100) {
  const results = { aWins: 0, bWins: 0, totalTurns: 0, koCount: 0, decisionCount: 0, totalStarvedA: 0, totalStarvedB: 0, turnDistribution: {} };

  for (let i = 0; i < count; i++) {
    const r = simulateFight(speciesA, speciesB);
    if (r.winner === speciesA) results.aWins++;
    else results.bWins++;
    results.totalTurns += r.turns;
    if (r.reason === 'KO') results.koCount++;
    else results.decisionCount++;
    results.totalStarvedA += r.staminaStarvedA;
    results.totalStarvedB += r.staminaStarvedB;
    const bucket = Math.ceil(r.turns / 5) * 5; // 5, 10, 15, 20
    results.turnDistribution[bucket] = (results.turnDistribution[bucket] || 0) + 1;
  }

  return {
    matchup: `${speciesA} vs ${speciesB}`,
    games: count,
    winRate: `${speciesA}: ${results.aWins}% | ${speciesB}: ${results.bWins}%`,
    avgTurns: (results.totalTurns / count).toFixed(1),
    koRate: `${results.koCount}% KO | ${results.decisionCount}% Decision`,
    avgStaminaStarved: `${speciesA}: ${(results.totalStarvedA / count).toFixed(1)} turns | ${speciesB}: ${(results.totalStarvedB / count).toFixed(1)} turns`,
    turnDistribution: results.turnDistribution,
  };
}

// Run all standard matchups
export function runFullReport() {
  const species = ['cyberGorilla', 'psychoSquid', 'beeSwarm', 'terrorPinTurtle'];
  const report = [];

  for (let i = 0; i < species.length; i++) {
    for (let j = i; j < species.length; j++) {
      report.push(runBatch(species[i], species[j], 100));
    }
  }
  return report;
}
