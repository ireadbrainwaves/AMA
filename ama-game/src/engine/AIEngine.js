// AI Decision Engine — difficulty scaling, pattern reading, boss AI, intent system

// fightState shape:
// { lastOpponentPush, lastPlayerMove, targetableMutations, stolenMoves,
//   mutationDamageDealt, fightNumber (1-4), playerMoveHistory: [move, move, ...],
//   turn, echoResistance: { moveType: hitCount }, parasitexStolenCount }

export function getAIDecision(aiCharKey, aiMoves, aiResources, opponentResources, fightState) {
  const fightNum = fightState?.fightNumber || 1;
  const difficulty = getDifficulty(fightNum, aiCharKey);

  // Include stolen moves for Parasitex
  const allMoves = fightState?.stolenMoves?.length > 0
    ? [...aiMoves, ...fightState.stolenMoves]
    : aiMoves;

  const affordable = allMoves.filter(m => {
    let cost = m.minCost;
    if (aiResources.guard <= 0 && (m.target === 'defense' || m.target === 'regen' || m.effect === 'costIncrease')) cost *= 2;
    if (aiResources.composure <= 0 && (m.target === 'evasion' || m.target === 'utility')) cost *= 2;
    if (aiResources.stamina < 3) cost += 1;
    return cost <= aiResources.stamina;
  });
  if (affordable.length === 0) return null;

  // === DECISION FLOWCHART (from spec) ===

  // 1. Finisher check: 80% use if conditions met (100% at moderate+)
  const finisher = affordable.find(m => m.isFinisher && checkFinisherCondition(m, opponentResources, fightState));
  if (finisher) {
    const useChance = difficulty === 'easy' ? 0.7 : 0.8;
    if (Math.random() < useChance) {
      const push = difficulty === 'easy'
        ? Math.min(finisher.minCost + 2, aiResources.stamina)
        : Math.min(aiResources.stamina, finisher.minCost + 4); // push heavy on finisher
      return withIntent({ move: finisher, staminaPush: push }, 'finishing');
    }
  }

  // Easy AI: 30% chance to attempt finisher even when conditions NOT met (teaches player)
  if (difficulty === 'easy' && Math.random() < 0.3) {
    const anyFinisher = affordable.find(m => m.isFinisher);
    if (anyFinisher) {
      return withIntent({ move: anyFinisher, staminaPush: anyFinisher.minCost }, 'finishing');
    }
  }

  // 2. Low body survival check: 50% defensive, 50% desperate attack
  if (aiResources.body <= 8) { // ~30% of 25
    const defensive = affordable.filter(m => m.target === 'defense' || m.target === 'regen');
    if (defensive.length > 0 && Math.random() < 0.5) {
      const move = defensive[Math.floor(Math.random() * defensive.length)];
      return withIntent({ move, staminaPush: move.minCost }, 'defending');
    }
  }

  // 3. Exploit broken resource: 60% exploit (channel-aware: POWER→Guard broken = Body dmg, PSYCHIC→Comp broken = Body dmg)
  if (difficulty !== 'easy' && Math.random() < 0.6) {
    if (opponentResources.guard <= 0) {
      // Guard broken: POWER moves now hit Body directly — prefer them
      const powerMoves = affordable.filter(m => (m.channel === 'POWER' || m.target === 'guard') && m.baseDamage > 0);
      if (powerMoves.length > 0) {
        const move = powerMoves[Math.floor(Math.random() * powerMoves.length)];
        const push = getStaminaPush(aiCharKey, move, aiResources.stamina, difficulty);
        return withIntent({ move, staminaPush: push }, 'attacking');
      }
    }
    if (opponentResources.composure <= 0) {
      // Composure broken: PSYCHIC moves now hit Body directly
      const psychicMoves = affordable.filter(m => (m.channel === 'PSYCHIC' || m.target === 'composure') && m.baseDamage > 0);
      if (psychicMoves.length > 0) {
        const move = psychicMoves[Math.floor(Math.random() * psychicMoves.length)];
        const push = getStaminaPush(aiCharKey, move, aiResources.stamina, difficulty);
        return withIntent({ move, staminaPush: push }, 'attacking');
      }
    }
  }

  // 4. Pattern reading (hard/boss only): counter repeated moves
  if ((difficulty === 'hard' || difficulty === 'boss') && fightState?.playerMoveHistory?.length >= 2) {
    const history = fightState.playerMoveHistory;
    const lastTypes = history.slice(-3).map(m => m.moveType);
    const repeated = lastTypes.filter(t => t === lastTypes[lastTypes.length - 1]).length >= 2;
    if (repeated && Math.random() < 0.7) {
      const counterType = getCounterType(lastTypes[lastTypes.length - 1]);
      if (counterType) {
        const counters = affordable.filter(m => m.moveType === counterType);
        if (counters.length > 0) {
          const move = counters[Math.floor(Math.random() * counters.length)];
          const push = getStaminaPush(aiCharKey, move, aiResources.stamina, difficulty);
          return withIntent({ move, staminaPush: push }, 'attacking');
        }
      }
    }
  }

  // 5. Mutation targeting
  const targetableMutations = fightState?.targetableMutations || [];
  if (targetableMutations.length > 0) {
    const targetChance = {
      parasitex: 0.8,
      beeSwarm: 0.5,
      psychoSquid: 0.4,
      cyberGorilla: 0.2,
      terrorPinTurtle: 0.15,
    }[aiCharKey] || 0.3;

    if (Math.random() < targetChance) {
      const attackMoves = affordable.filter(m => !m.isFinisher && m.baseDamage > 0);
      if (attackMoves.length > 0) {
        let bestTarget = null, bestMove = null, bestScore = -1;
        for (const mut of targetableMutations) {
          for (const move of attackMoves) {
            let score = 10;
            if (mut.weakness && move.moveType === mut.weakness) score += 50;
            if (mut.currentHP <= mut.maxHP * 0.5) score += 30;
            const threat = fightState?.mutationDamageDealt?.[mut.id] || 0;
            score += threat * 2;
            // Hard/boss: prioritize teched mutations
            if ((difficulty === 'hard' || difficulty === 'boss') && mut.hasTech) score += 40;
            if (score > bestScore) { bestScore = score; bestTarget = mut; bestMove = move; }
          }
        }
        if (bestTarget && bestMove) {
          const push = getStaminaPush(aiCharKey, bestMove, aiResources.stamina, difficulty);
          return withIntent({ move: bestMove, staminaPush: push, targetMutation: bestTarget.id }, 'targeting');
        }
      }
    }
  }

  // 6. Boss-specific AI
  if (aiCharKey === 'parasitex') {
    const result = parasitexAI(affordable, aiResources, opponentResources, fightState, difficulty);
    if (result) return result;
  }
  if (aiCharKey === 'hydravine') {
    const result = hydravineAI(affordable, aiResources, opponentResources, fightState, difficulty);
    if (result) return result;
  }
  if (aiCharKey === 'echomorph') {
    const result = echomorphAI(affordable, aiResources, opponentResources, fightState, difficulty);
    if (result) return result;
  }

  // 7. Archetype-weighted move selection
  let weights;
  switch (aiCharKey) {
    case 'cyberGorilla': weights = gorillaWeights(affordable, opponentResources); break;
    case 'psychoSquid': weights = squidWeights(affordable, aiResources); break;
    case 'beeSwarm': weights = beeWeights(affordable, fightState); break;
    case 'terrorPinTurtle': weights = turtleWeights(affordable, aiResources, opponentResources); break;
    default: weights = affordable.map(() => 1);
  }

  // Easy AI: 50% random instead of weighted
  if (difficulty === 'easy' && Math.random() < 0.5) {
    const move = affordable[Math.floor(Math.random() * affordable.length)];
    const push = getStaminaPush(aiCharKey, move, aiResources.stamina, difficulty);
    return withIntent({ move, staminaPush: push }, inferIntent(move));
  }

  const move = weightedPick(affordable, weights);
  const push = getStaminaPush(aiCharKey, move, aiResources.stamina, difficulty);
  return withIntent({ move, staminaPush: push }, inferIntent(move));
}

// === DIFFICULTY SYSTEM ===
function getDifficulty(fightNum, charKey) {
  if (charKey === 'parasitex') return 'boss';
  if (fightNum <= 1) return 'easy';
  if (fightNum <= 2) return 'moderate';
  return 'hard'; // fight 3+
}

// === BOSS-SPECIFIC AI ===

// Parasitex 3-phase AI
function parasitexAI(moves, aiRes, oppRes, state, difficulty) {
  const turn = state?.turn || 1;
  const stolenCount = state?.parasitexStolenCount || 0;

  // Phase 1: Hunting (turns 1-5) — fast moves to win matchups, Assimilate on win
  if (turn <= 5) {
    const fastMoves = moves.filter(m => m.moveType === 'fast');
    if (fastMoves.length > 0 && Math.random() < 0.5) {
      const move = fastMoves[Math.floor(Math.random() * fastMoves.length)];
      return withIntent({ move, staminaPush: getStaminaPush('parasitex', move, aiRes.stamina, difficulty) }, 'targeting');
    }
  }

  // Phase 2: Building (turns 6-12) — use stolen moves + continue hunting
  if (turn > 5 && turn <= 12) {
    const stolen = state?.stolenMoves || [];
    if (stolen.length > 0 && Math.random() < 0.2) {
      const move = stolen[Math.floor(Math.random() * stolen.length)];
      return withIntent({ move, staminaPush: getStaminaPush('parasitex', move, aiRes.stamina, difficulty) }, 'attacking');
    }
    // Cocoon when hurt
    if (aiRes.body < 17) {
      const cocoon = moves.find(m => m.effect === 'cocoonHeal');
      if (cocoon && Math.random() < 0.5) {
        return withIntent({ move: cocoon, staminaPush: cocoon.minCost }, 'defending');
      }
    }
  }

  // Phase 3: Finishing (turns 13+) — go for kill
  if (turn > 12) {
    const finisher = moves.find(m => m.isFinisher);
    if (finisher && stolenCount > 0 && Math.random() < 0.7) {
      return withIntent({ move: finisher, staminaPush: Math.min(aiRes.stamina, finisher.minCost + 4) }, 'finishing');
    }
    // Bruiser mode: heavy power
    const powerMoves = moves.filter(m => m.moveType === 'power' && m.baseDamage > 0);
    if (powerMoves.length > 0) {
      const move = powerMoves[Math.floor(Math.random() * powerMoves.length)];
      return withIntent({ move, staminaPush: Math.min(aiRes.stamina, move.minCost + 3) }, 'attacking');
    }
  }

  // Fall through to default weights
  const weights = moves.map(m => {
    if (m.target === 'guard') return 40;
    if (m.target === 'body') return 30;
    if (m.target === 'composure') return 20;
    return 10;
  });
  const move = weightedPick(moves, weights);
  return withIntent({ move, staminaPush: getStaminaPush('parasitex', move, aiRes.stamina, difficulty) }, inferIntent(move));
}

// Hydravine boss AI
function hydravineAI(moves, aiRes, oppRes, state, difficulty) {
  // Root Drain priority when hurt
  if (aiRes.body < 20) {
    const drain = moves.find(m => m.effect === 'lifeSteal');
    if (drain && Math.random() < 0.6) {
      return withIntent({ move: drain, staminaPush: getStaminaPush('hydravine', drain, aiRes.stamina, difficulty) }, 'attacking');
    }
  }

  // Spore Cloud if player repeating moves
  const history = state?.playerMoveHistory || [];
  if (history.length >= 2) {
    const last2 = history.slice(-2).map(m => m.id);
    if (last2[0] === last2[1]) {
      const spore = moves.find(m => m.effect === 'ghostMove');
      if (spore && Math.random() < 0.4) {
        return withIntent({ move: spore, staminaPush: getStaminaPush('hydravine', spore, aiRes.stamina, difficulty) }, 'attacking');
      }
    }
  }

  // Bloom Crush finisher when guard is low
  if (oppRes.guard < 10) {
    const bloom = moves.find(m => m.id === 'bloom_crush');
    if (bloom && Math.random() < 0.5) {
      return withIntent({ move: bloom, staminaPush: Math.min(aiRes.stamina, bloom.minCost + 3) }, 'attacking');
    }
  }

  // Default: alternate vine_lash and thorn_barrage
  const alternating = moves.filter(m => m.id === 'vine_lash' || m.id === 'thorn_burst');
  if (alternating.length > 0) {
    const move = alternating[Math.floor(Math.random() * alternating.length)];
    return withIntent({ move, staminaPush: getStaminaPush('hydravine', move, aiRes.stamina, difficulty) }, inferIntent(move));
  }

  return null; // fall through to default
}

// Echomorph boss AI
function echomorphAI(moves, aiRes, oppRes, state, difficulty) {
  const lastPlayerMove = state?.lastPlayerMove;
  const turn = state?.turn || 1;

  // Turn 1: always Null Pulse
  if (turn === 1) {
    const nullPulse = moves.find(m => m.id === 'null_pulse');
    if (nullPulse) return withIntent({ move: nullPulse, staminaPush: 3 }, 'attacking');
  }

  // Turn 2+: 80% copy opponent's last move type, mirror their push
  if (lastPlayerMove && Math.random() < 0.8) {
    const copies = moves.filter(m => m.moveType === lastPlayerMove.moveType);
    if (copies.length > 0) {
      const move = copies[Math.floor(Math.random() * copies.length)];
      // Mirror opponent's previous push
      const mirrorPush = Math.max(move.minCost, Math.min(aiRes.stamina, state?.lastOpponentPush || move.minCost));
      return withIntent({ move, staminaPush: mirrorPush }, inferIntent(move));
    }
  }

  // Fallback: Shatter Copy
  const shatter = moves.find(m => m.id === 'shatter_copy');
  if (shatter) return withIntent({ move: shatter, staminaPush: getStaminaPush('echomorph', shatter, aiRes.stamina, difficulty) }, 'attacking');

  return null;
}

// === ARCHETYPE WEIGHTS ===

function gorillaWeights(moves, oppRes) {
  return moves.map(m => {
    if (m.target === 'guard') return 50;
    if (m.id === 'iron_grip' && oppRes.stamina > 6) return 20;
    if (m.id === 'chest_beat' && oppRes.guard <= 0) return 20;
    if (m.id === 'ground_pound') return 10;
    return 5;
  });
}

function squidWeights(moves, aiRes) {
  const anyLow = aiRes.guard < 5 || aiRes.composure < 5 || aiRes.body < 5;
  return moves.map(m => {
    if (m.id === 'mind_spike' || m.id === 'synapse_spike') return 40;
    if (m.id === 'neural_bind') return 20;
    if (m.id === 'tentacle_lash') return 20;
    if (m.id === 'ink_cloud') return anyLow ? 30 : 15;
    return 5;
  });
}

function beeWeights(moves, fightState) {
  const oppHeavy = fightState?.lastOpponentPush > 3;
  return moves.map(m => {
    if (m.id === 'sting_barrage' || m.id === 'thruster_barrage') return 30;
    if (m.id === 'swarm_pressure') return 25;
    if (m.id === 'scatter') return oppHeavy ? 35 : 25;
    if (m.id === 'pollen_blind') return 15;
    return 5;
  });
}

function turtleWeights(moves, aiRes, oppRes) {
  return moves.map(m => {
    if ((m.id === 'shell_block' || m.id === 'spike_shell') && oppRes.stamina > 5) return 40;
    if (m.id === 'shell_block' || m.id === 'spike_shell') return 35;
    if (m.id === 'fortress_mode' && aiRes.guard < 7) return 30;
    if (m.id === 'fortress_mode') return 25;
    if (m.id === 'snap_bite') return 20;
    if (m.id === 'tremor_stomp') return 15;
    return 5;
  });
}

// === STAMINA PUSH with difficulty awareness ===
function getStaminaPush(charKey, move, currentStamina, difficulty) {
  const min = move.minCost;
  const max = currentStamina;
  let ratio;

  switch (charKey) {
    case 'cyberGorilla': ratio = 0.6 + Math.random() * 0.2; break;
    case 'psychoSquid': ratio = 0.4 + Math.random() * 0.2; break;
    case 'beeSwarm': return Math.min(min + 1, max);
    case 'terrorPinTurtle': return min;
    default: ratio = 0.5;
  }

  // Easy AI never pushes more than min+2
  if (difficulty === 'easy') {
    return Math.min(min + Math.floor(Math.random() * 3), max);
  }

  return Math.max(min, Math.min(max, Math.round(max * ratio)));
}

// === INTENT SYSTEM ===
function inferIntent(move) {
  if (!move) return 'attacking';
  if (move.isFinisher) return 'finishing';
  if (move.target === 'defense' || move.target === 'regen' || move.moveType === 'defense') return 'defending';
  if (move.target === 'evasion' || move.moveType === 'evasion') return 'defending';
  if (move.target === 'utility') return 'setup';
  return 'attacking';
}

function withIntent(decision, intent) {
  return { ...decision, intent };
}

// Get counter move type for pattern reading
function getCounterType(moveType) {
  const counters = {
    power: 'fast',
    fast: 'grab',
    grab: 'evasion',
    psychic: 'fast',
    area: 'defense',
    defense: 'grab',
    evasion: 'area',
    finisher: 'fast',
  };
  return counters[moveType] || null;
}

// === INTENT ACCURACY (feints at higher difficulty) ===
export function getIntentDisplay(intent, fightNumber, charKey) {
  const difficulty = getDifficulty(fightNumber, charKey);
  let accuracy;
  switch (difficulty) {
    case 'easy': accuracy = 1.0; break;
    case 'moderate': accuracy = 0.9; break;
    case 'hard': accuracy = 0.8; break;
    case 'boss': accuracy = 0.75; break;
    default: accuracy = 1.0;
  }

  if (Math.random() < accuracy) return intent; // true intent

  // Feint: show wrong intent
  const intents = ['attacking', 'defending', 'targeting', 'setup', 'finishing'];
  const others = intents.filter(i => i !== intent);
  return others[Math.floor(Math.random() * others.length)];
}

function weightedPick(items, weights) {
  const jittered = weights.map(w => w * (0.9 + Math.random() * 0.2));
  const total = jittered.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= jittered[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function checkFinisherCondition(move, oppRes, fightState) {
  switch (move.finisherCondition) {
    case 'opponentGuardBroken': return oppRes.guard <= 0;
    case 'opponentComposureBroken': return oppRes.composure <= 0;
    case 'opponentArmorBroken': return oppRes.guard <= 0 || oppRes.composure <= 0;
    case 'opponentStaminaLow': return oppRes.stamina < 3;
    case 'hasStolenMutation': return (fightState?.parasitexStolenCount || 0) > 0;
    default: return false;
  }
}
