// Bot vs Bot Simulator — Node.js runner
// Run: node ama-game/run-sim.mjs

// Inline the data we need (can't import JSX modules in Node)
const MAX_GUARD = 25, MAX_COMPOSURE = 25, MAX_BODY = 30, MAX_STAMINA = 10;
const STAMINA_REGEN = 3, STAMINA_CAP = 10, MAX_TURNS = 20;
const GUARD_REGEN = 1, COMPOSURE_REGEN = 1;

const KEYWORD_CHART = {
  GRAB:    { GRAB: 'neutral', FAST: 'lose', AREA: 'neutral', DEFENSE: 'win', EVASION: 'lose', null: 'neutral' },
  FAST:    { GRAB: 'win', FAST: 'neutral', AREA: 'lose', DEFENSE: 'lose', EVASION: 'neutral', null: 'win' },
  AREA:    { GRAB: 'neutral', FAST: 'win', AREA: 'neutral', DEFENSE: 'lose', EVASION: 'win', null: 'neutral' },
  DEFENSE: { GRAB: 'lose', FAST: 'win', AREA: 'win', DEFENSE: 'neutral', EVASION: 'neutral', null: 'neutral' },
  EVASION: { GRAB: 'win', FAST: 'neutral', AREA: 'lose', DEFENSE: 'neutral', EVASION: 'neutral', null: 'neutral' },
  null:    { GRAB: 'neutral', FAST: 'lose', AREA: 'neutral', DEFENSE: 'neutral', EVASION: 'neutral', null: 'neutral' },
};

// Simplified species data (matches characters.js)
const SPECIES = {
  cyberGorilla: {
    name: 'Cyber Gorilla', stats: { attack: 65, defense: 50, willpower: 40, toughness: 50 },
    moves: [
      { id: 'gorilla_punch', name: 'Gorilla Punch', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: null, moveType: 'power' },
      { id: 'ground_pound', name: 'Ground Pound', minCost: 3, baseDamage: 3, channel: 'POWER', keyword: 'AREA', moveType: 'area' },
      { id: 'iron_grip', name: 'Iron Grip', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'GRAB', moveType: 'grab' },
      { id: 'chest_beat', name: 'Chest Beat', minCost: 1, baseDamage: 0, channel: 'SELF', keyword: 'DEFENSE', moveType: 'defense' },
      { id: 'primal_rage', name: 'Primal Rage', minCost: 4, baseDamage: 5, channel: 'FINISHER', keyword: null, moveType: 'finisher', isFinisher: true },
    ],
  },
  psychoSquid: {
    name: 'Psycho Squid', stats: { attack: 40, defense: 40, willpower: 65, toughness: 45 },
    moves: [
      { id: 'tentacle_lash', name: 'Tentacle Lash', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'FAST', moveType: 'fast' },
      { id: 'mind_spike', name: 'Mind Spike', minCost: 2, baseDamage: 2, channel: 'PSYCHIC', keyword: null, moveType: 'psychic' },
      { id: 'ink_cloud', name: 'Ink Cloud', minCost: 1, baseDamage: 1, channel: 'PSYCHIC', keyword: 'EVASION', moveType: 'evasion' },
      { id: 'neural_bind', name: 'Neural Bind', minCost: 3, baseDamage: 2, channel: 'POWER', keyword: 'GRAB', moveType: 'grab' },
      { id: 'psychic_crush', name: 'Psychic Crush', minCost: 4, baseDamage: 5, channel: 'FINISHER', keyword: null, moveType: 'finisher', isFinisher: true },
    ],
  },
  beeSwarm: {
    name: 'Bee Swarm', stats: { attack: 50, defense: 40, willpower: 45, toughness: 50 },
    moves: [
      { id: 'sting_barrage', name: 'Sting Barrage', minCost: 1, baseDamage: 2, channel: 'POWER', keyword: 'FAST', moveType: 'fast' },
      { id: 'swarm_pressure', name: 'Swarm Pressure', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'AREA', moveType: 'area' },
      { id: 'pollen_blind', name: 'Pollen Blind', minCost: 1, baseDamage: 1, channel: 'PSYCHIC', keyword: null, moveType: 'psychic' },
      { id: 'scatter', name: 'Scatter', minCost: 1, baseDamage: 0, channel: 'SELF', keyword: 'EVASION', moveType: 'evasion' },
      { id: 'death_cloud', name: 'Death Cloud', minCost: 4, baseDamage: 5, channel: 'FINISHER', keyword: null, moveType: 'finisher', isFinisher: true },
    ],
  },
  terrorPinTurtle: {
    name: 'Terror Pin Turtle', stats: { attack: 40, defense: 60, willpower: 40, toughness: 60 },
    moves: [
      { id: 'snap_bite', name: 'Snap Bite', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'GRAB', moveType: 'grab' },
      { id: 'shell_block', name: 'Shell Block', minCost: 1, baseDamage: 0, channel: 'SELF', keyword: 'DEFENSE', moveType: 'defense' },
      { id: 'tremor_stomp', name: 'Tremor Stomp', minCost: 2, baseDamage: 2, channel: 'POWER', keyword: 'AREA', moveType: 'area' },
      { id: 'fortress_mode', name: 'Fortress Mode', minCost: 2, baseDamage: 0, channel: 'SELF', keyword: 'DEFENSE', moveType: 'defense' },
      { id: 'tidal_crush', name: 'Tidal Crush', minCost: 5, baseDamage: 5, channel: 'FINISHER', keyword: null, moveType: 'finisher', isFinisher: true },
    ],
  },
};

function resolveMatchup(moveA, moveB) {
  const kwA = moveA.keyword || null;
  const kwB = moveB.keyword || null;
  const row = KEYWORD_CHART[kwA] || KEYWORD_CHART[null];
  const result = row?.[kwB] || 'neutral';
  if (result === 'win') return 'a';
  if (result === 'lose') return 'b';
  return 'both';
}

function effectivePush(push) {
  if (push <= 3) return push;
  return 3 + (push - 3) * 0.5;
}

function calcDamage(move, push, atkStat, defStat, wonMatchup) {
  if (!move || push <= 0 || move.baseDamage === 0) return 0;
  // PSYCHIC uses willpower for attack (passed as atkStat by caller)
  const raw = move.baseDamage * effectivePush(push) * ((atkStat || 50) / 50);
  const reduced = raw * (50 / Math.max(1, defStat || 50));
  const matchMult = wonMatchup ? 1 : 0.5;
  const variance = 0.85 + Math.random() * 0.15;
  return Math.max(1, Math.floor(reduced * matchMult * variance));
}

function botPickMove(moves, stamina) {
  const affordable = moves.filter(m => m.minCost <= stamina && !m.isFinisher);
  if (affordable.length === 0) return null;
  return affordable[Math.floor(Math.random() * affordable.length)];
}

function botPickPush(move, stamina) {
  const min = move.minCost;
  const ratio = 0.4 + Math.random() * 0.3;
  return Math.max(min, Math.min(stamina, Math.round(stamina * ratio)));
}

function routeDamage(dmg, channel, res) {
  if (channel === 'FINISHER') { res.body = Math.max(0, res.body - dmg); return; }
  if (channel === 'SELF') return;
  const armor = channel === 'PSYCHIC' ? 'composure' : 'guard';
  if (res[armor] <= 0) { res.body = Math.max(0, res.body - dmg); }
  else if (dmg >= res[armor]) { const ov = dmg - res[armor]; res[armor] = 0; if (ov > 0) res.body = Math.max(0, res.body - ov); }
  else { res[armor] -= dmg; }
}

function simulateFight(speciesA, speciesB) {
  const charA = SPECIES[speciesA], charB = SPECIES[speciesB];
  const resA = { guard: MAX_GUARD, composure: MAX_COMPOSURE, body: MAX_BODY, stamina: MAX_STAMINA };
  const resB = { guard: MAX_GUARD, composure: MAX_COMPOSURE, body: MAX_BODY, stamina: MAX_STAMINA };
  let starvedA = 0, starvedB = 0;

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const moveA = botPickMove(charA.moves, resA.stamina);
    const moveB = botPickMove(charB.moves, resB.stamina);
    if (!moveA) starvedA++;
    if (!moveB) starvedB++;
    if (!moveA && !moveB) { resA.stamina = Math.min(STAMINA_CAP, resA.stamina + STAMINA_REGEN); resB.stamina = Math.min(STAMINA_CAP, resB.stamina + STAMINA_REGEN); continue; }

    let winner = 'both';
    if (moveA && moveB) winner = resolveMatchup(moveA, moveB);
    else if (moveA) winner = 'a';
    else winner = 'b';

    const pushA = moveA ? botPickPush(moveA, resA.stamina) : 0;
    const pushB = moveB ? botPickPush(moveB, resB.stamina) : 0;

    if (moveA && pushA > 0 && moveA.baseDamage > 0) {
      const atk = moveA.channel === 'PSYCHIC' ? charA.stats.willpower : charA.stats.attack;
      const def = moveA.channel === 'PSYCHIC' ? charB.stats.willpower : charB.stats.defense;
      const dmg = calcDamage(moveA, pushA, atk, def, winner === 'a' || winner === 'both');
      routeDamage(dmg, moveA.channel, resB);
      resA.stamina -= pushA;
    }
    if (moveB && pushB > 0 && moveB.baseDamage > 0) {
      const atk = moveB.channel === 'PSYCHIC' ? charB.stats.willpower : charB.stats.attack;
      const def = moveB.channel === 'PSYCHIC' ? charA.stats.willpower : charA.stats.defense;
      const dmg = calcDamage(moveB, pushB, atk, def, winner === 'b' || winner === 'both');
      routeDamage(dmg, moveB.channel, resA);
      resB.stamina -= pushB;
    }

    // Regen
    resA.stamina = Math.min(STAMINA_CAP, resA.stamina + STAMINA_REGEN);
    resB.stamina = Math.min(STAMINA_CAP, resB.stamina + STAMINA_REGEN);
    if (resA.guard > 0 && resA.guard < MAX_GUARD) resA.guard = Math.min(MAX_GUARD, resA.guard + GUARD_REGEN);
    if (resA.composure > 0 && resA.composure < MAX_COMPOSURE) resA.composure = Math.min(MAX_COMPOSURE, resA.composure + COMPOSURE_REGEN);
    if (resB.guard > 0 && resB.guard < MAX_GUARD) resB.guard = Math.min(MAX_GUARD, resB.guard + GUARD_REGEN);
    if (resB.composure > 0 && resB.composure < MAX_COMPOSURE) resB.composure = Math.min(MAX_COMPOSURE, resB.composure + COMPOSURE_REGEN);

    if (resB.body <= 0) return { winner: speciesA, turns: turn, reason: 'KO', starvedA, starvedB };
    if (resA.body <= 0) return { winner: speciesB, turns: turn, reason: 'KO', starvedA, starvedB };
  }

  const tA = resA.guard + resA.composure + resA.body, tB = resB.guard + resB.composure + resB.body;
  return { winner: tA >= tB ? speciesA : speciesB, turns: MAX_TURNS, reason: 'Decision', starvedA, starvedB };
}

// Run simulations
const species = ['cyberGorilla', 'psychoSquid', 'beeSwarm', 'terrorPinTurtle'];
const N = 200;

console.log(`\n=== AMA BOT VS BOT REPORT (${N} games each) ===\n`);
console.log(`Balance: Guard=${MAX_GUARD} Comp=${MAX_COMPOSURE} Body=${MAX_BODY} Stam=${MAX_STAMINA} Regen=${STAMINA_REGEN}`);
console.log(`Diminishing push: first 3=1x, additional=0.5x`);
console.log(`Shield regen: +${GUARD_REGEN} Guard, +${COMPOSURE_REGEN} Comp per turn\n`);

for (let i = 0; i < species.length; i++) {
  for (let j = i; j < species.length; j++) {
    let aW = 0, turns = 0, kos = 0, sA = 0, sB = 0;
    const turnBuckets = {};
    for (let g = 0; g < N; g++) {
      const r = simulateFight(species[i], species[j]);
      if (r.winner === species[i]) aW++;
      turns += r.turns;
      if (r.reason === 'KO') kos++;
      sA += r.starvedA;
      sB += r.starvedB;
      const b = r.turns <= 5 ? '1-5' : r.turns <= 10 ? '6-10' : r.turns <= 15 ? '11-15' : '16-20';
      turnBuckets[b] = (turnBuckets[b] || 0) + 1;
    }
    const nameA = SPECIES[species[i]].name, nameB = SPECIES[species[j]].name;
    console.log(`--- ${nameA} vs ${nameB} ---`);
    console.log(`  Win: ${nameA} ${aW}/${N} (${Math.round(aW/N*100)}%) | ${nameB} ${N-aW}/${N} (${Math.round((N-aW)/N*100)}%)`);
    console.log(`  Avg turns: ${(turns/N).toFixed(1)} | KO rate: ${Math.round(kos/N*100)}%`);
    console.log(`  Stamina starved: ${nameA} ${(sA/N).toFixed(1)} turns | ${nameB} ${(sB/N).toFixed(1)} turns`);
    console.log(`  Turn distribution: ${JSON.stringify(turnBuckets)}`);
    console.log('');
  }
}

console.log('=== TARGETS ===');
console.log('Avg turns: 10-15 (sweet spot for strategy)');
console.log('KO rate: >60% (fights should end decisively)');
console.log('Stamina starved: <1 turn avg (always have options)');
