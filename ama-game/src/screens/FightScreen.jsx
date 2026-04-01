import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { characters, TYPE_COLORS, TYPE_LABELS } from '../data/characters';
import { resolveMatchup, getMatchupPreview } from '../data/matchups';
import { getAIDecision, getIntentDisplay } from '../engine/AIEngine';
import { playSound } from '../engine/SoundManager';
import MatchupGuide from '../components/MatchupGuide';
import BattleArena from '../components/BattleArena';
import FightArena from '../components/FightArena';
import { INITIAL_RESOURCES, MAX_GUARD, MAX_COMPOSURE, MAX_BODY, MAX_STAMINA, STAMINA_CAP, STAMINA_REGEN, MAX_TURNS, MUTATION_HP_SMALL, MUTATION_HP_LARGE, TECH_ENHANCEMENTS, GUARD_REGEN, COMPOSURE_REGEN } from '../data/constants';
import { speciesMutations, SPECIES_WEAKNESS, SPECIES_RESISTANCE, findMutation } from '../data/mutations';
import { getTutorialPhase, getTutorialHint, filterMovesForTutorial, shouldUseMatchups, TUTORIAL_PHASES, SIMPLE_PUSH_OPTIONS } from '../engine/TutorialEngine';
import { createScar, applyScarEffects, checkScarDodge, getScarDamageReduction, getScarRegenBonus, getScarCompBonus } from '../engine/ScarEngine';

const DEBUG_COMBAT = false;

const PHASE = {
  MOVE_SELECT: 'MOVE_SELECT',
  TARGET_SELECT: 'TARGET_SELECT',
  COMMITTED: 'COMMITTED',
  REVEAL: 'REVEAL',
  STAMINA_PUSH: 'STAMINA_PUSH',
  PUSH_REVEAL: 'PUSH_REVEAL',
  RESOLUTION: 'RESOLUTION',
  FIGHT_OVER: 'FIGHT_OVER',
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export default function FightScreen({ playerCharKey, playerMoves, opponentCharKey, items, onItemUsed, mutations, onEnd, isFirstFight, scars = [], onScar, meta, fightNumber = 1, playerTech = [], playerAttributes }) {
  const playerChar = characters[playerCharKey];
  const oppChar = characters[opponentCharKey];

  // Resources
  const [pRes, setPRes] = useState(() => {
    const init = { ...INITIAL_RESOURCES };
    if (DEBUG_COMBAT) console.log('PLAYER INIT:', init.guard, init.composure, init.body, init.stamina);
    return init;
  });
  const [oRes, setORes] = useState(() => {
    const init = { ...INITIAL_RESOURCES };
    if (DEBUG_COMBAT) console.log('OPPONENT INIT:', init.guard, init.composure, init.body, init.stamina);
    return init;
  });

  // Fight state
  const [phase, setPhase] = useState(PHASE.MOVE_SELECT);
  const [turn, setTurn] = useState(1);
  const [selectedMove, setSelectedMove] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState('body'); // 'body' or mutation ID
  const [showItems, setShowItems] = useState(false);
  const [aiMove, setAiMove] = useState(null);
  const [matchupResult, setMatchupResult] = useState(null);
  const [staminaPush, setStaminaPush] = useState(0);
  const [aiStaminaPush, setAiStaminaPush] = useState(0);
  const [aiTargetMutation, setAiTargetMutation] = useState(null); // mutation ID the AI is targeting
  const [turnLog, setTurnLog] = useState([]);
  const [fightResult, setFightResult] = useState(null);
  const [shaking, setShaking] = useState(false);
  const [playerAnimState, setPlayerAnimState] = useState('idle');
  const [opponentAnimState, setOpponentAnimState] = useState('idle');

  // Passive state
  const [momentumChain, setMomentumChain] = useState(0);
  const [totalCompDamage, setTotalCompDamage] = useState(0);
  const [costModifier, setCostModifier] = useState(0); // from Iron Grip
  const [aiCostModifier, setAiCostModifier] = useState(0);
  const [adrenalineActive, setAdrenalineActive] = useState(false);
  const [damageShield, setDamageShield] = useState(0);         // absorbs next N incoming damage
  const [guaranteeWin, setGuaranteeWin] = useState(false);     // next matchup auto-wins
  const [flashBlind, setFlashBlind] = useState(false);          // opponent deals 0 this turn
  const [scrambleActive, setScrambleActive] = useState(0);      // turns of forced random AI
  const [revealTurns, setRevealTurns] = useState(0);            // turns of seeing opponent's move

  // Tutorial disabled — always full system
  const isTutorial = false;
  const tutorialPhase = TUTORIAL_PHASES.FULL_SYSTEM;

  // Track last player move for Echomorph copycat
  const [lastPlayerMove, setLastPlayerMove] = useState(null);

  // Flow Bonus: +1 base damage when using different move type than last turn
  const [playerLastType, setPlayerLastType] = useState(null);
  const [oppLastType, setOppLastType] = useState(null);

  // Stamina interaction state: regen bonus/debuff from DEFENSE/PSYCHIC
  const [playerRegenBonus, setPlayerRegenBonus] = useState(0);
  const [oppRegenBonus, setOppRegenBonus] = useState(0);
  const [playerRegenDebuff, setPlayerRegenDebuff] = useState(0);
  const [oppRegenDebuff, setOppRegenDebuff] = useState(0);

  // Synapse Swap: indices of swapped moves on opponent (or player if opponent uses it)
  const [playerSwappedMoves, setPlayerSwappedMoves] = useState(null); // [idxA, idxB] or null
  const [oppSwappedMoves, setOppSwappedMoves] = useState(null);

  // Entangle status: { turnsRemaining: N } or null
  const [playerEntangled, setPlayerEntangled] = useState(null);
  const [oppEntangled, setOppEntangled] = useState(null);

  // Hydravine Vine Grasp timer (fires every 3 turns)
  const [vineGraspTimer, setVineGraspTimer] = useState(3);

  // Venom DoT: array of { damage, turnsLeft, source }
  const [playerDots, setPlayerDots] = useState([]);
  const [oppDots, setOppDots] = useState([]);

  // Opponent intent (from AI)
  const [oppIntent, setOppIntent] = useState(null);

  // Echomorph adaptive resistance tracking: { moveType: hitCount }
  const [echoResistance, setEchoResistance] = useState({});

  // Echomorph Chromatophore Skin camo
  const [echoCamoTurns, setEchoCamoTurns] = useState(0);
  const [echoCamoUsed, setEchoCamoUsed] = useState(false);

  // Ghost move from Hydravine Spore Cloud
  const [ghostMove, setGhostMove] = useState(null);

  // === NEW SPECIES PASSIVES ===
  // Iron Mantis — Vice Grip: clamped mutations { mutId: turnsLeft }
  const [clampedMutations, setClampedMutations] = useState({});
  // Voltamander — Bioelectric Charge: 0-10
  const [voltCharge, setVoltCharge] = useState(0);
  // Mycelith — Sporulation: array of { id, hp, maxHp }
  const [sporeConstructs, setSporeConstructs] = useState([]);
  // Glass Viper — Stealth Strike
  const [viperStealth, setViperStealth] = useState(() => opponentCharKey === 'glassViper');
  const [viperVisibleTurns, setViperVisibleTurns] = useState(0);
  // Bone Hydra — Regrowth: heads array [{ hp, maxHp, regenTimer, alive }]
  const [hydraHeads, setHydraHeads] = useState(() =>
    opponentCharKey === 'boneHydra' ? [
      { hp: 8, maxHp: 8, regenTimer: 0, alive: true, moveIndex: 0 },
      { hp: 8, maxHp: 8, regenTimer: 0, alive: true, moveIndex: 1 },
      { hp: 8, maxHp: 8, regenTimer: 0, alive: true, moveIndex: 2 },
    ] : []
  );
  // Null Worm — Null Field: strip techs at fight start (handled in move filtering)

  // Click-to-continue: tracks whether player has clicked through auto-advance phases
  const [waitingForClick, setWaitingForClick] = useState(false);
  // Previous turn's log persists into next MOVE_SELECT
  const [prevTurnLog, setPrevTurnLog] = useState([]);
  // Resource change indicators: { guard: -3, composure: 0, body: -5, stamina: +2 }
  const [pResChanges, setPResChanges] = useState({});
  const [oResChanges, setOResChanges] = useState({});

  // Parasitex phase tracking
  const [parasitexStolenCount, setParasitexStolenCount] = useState(0);

  // Player move history for AI pattern reading
  const [playerMoveHistory, setPlayerMoveHistory] = useState([]);

  // Overclock (tech): once per fight double-use
  const [overclockUsed, setOverclockUsed] = useState(false);

  // Resolve playerTech into lookup helpers
  const activeTech = useMemo(() => {
    if (!playerTech || playerTech.length === 0) return [];
    return playerTech.map(t => {
      const def = TECH_ENHANCEMENTS[t.techId] || Object.values(TECH_ENHANCEMENTS).find(e => e.id === t.techId);
      return def ? { ...def, slot: t.slot } : null;
    }).filter(Boolean);
  }, [playerTech]);

  function hasTechOnSlot(slot, techEffect) {
    return activeTech.some(t => t.slot === slot && t.effect === techEffect);
  }
  function hasTechEffect(techEffect) {
    return activeTech.some(t => t.effect === techEffect);
  }

  // Mutation HP tracking — each grafted mutation gets HP from catalog or defaults
  const [mutationHP, setMutationHP] = useState(() => {
    const hp = {};
    if (mutations) {
      mutations.forEach(m => {
        if ((m.type === 'ADD' || m.type === 'REPLACE' || m.type === 'SHIELD') && (m.move || m.shieldFor)) {
          let maxHP = m.hp || (m.type === 'REPLACE' ? MUTATION_HP_LARGE : MUTATION_HP_SMALL);
          hp[m.id] = {
            maxHP, currentHP: maxHP, mutation: m, weakness: m.weakness || null,
            resistance: m.resistance || null, slot: m.slot || null, shieldFor: m.shieldFor || null,
            ablativeCharges: hasTechOnSlot(m.slot, 'ablativeArmor') ? 3 : 0, // Ablative Armor: first 3 hits reduced
            emergencyUsed: false, // Emergency Rebuild: once per fight
          };
        }
      });
    }
    return hp;
  });
  const [destroyedMutations, setDestroyedMutations] = useState([]);
  const [mutationDestroyMsg, setMutationDestroyMsg] = useState(null);

  // Opponent mutation HP — generated from species data at fight start
  const [oppMutationHP, setOppMutationHP] = useState(() => {
    const hp = {};
    const specMuts = speciesMutations[opponentCharKey] || [];
    // Give opponent all their mutations with moves or shields
    specMuts.filter(m => (m.type === 'ADD' || m.type === 'SHIELD') && (m.move || m.shieldFor)).forEach(m => {
      const maxHP = m.hp || MUTATION_HP_SMALL;
      hp[m.id] = {
        maxHP, currentHP: maxHP, mutation: m,
        weakness: m.weakness || SPECIES_WEAKNESS[opponentCharKey] || null,
        resistance: m.resistance || SPECIES_RESISTANCE?.[opponentCharKey] || null,
        slot: m.slot || null, shieldFor: m.shieldFor || null, revealed: false,
      };
    });
    return hp;
  });
  const [oppDestroyedMutations, setOppDestroyedMutations] = useState([]);

  // Track damage dealt by each player mutation this fight (for AI threat targeting)
  const [mutationDamageDealt, setMutationDamageDealt] = useState({});

  // Opponent's extra moves (from Parasitex stealing)
  const [oppStolenMoves, setOppStolenMoves] = useState([]);

  // Active (non-destroyed) mutation move IDs
  const activeMutationIds = Object.keys(mutationHP).filter(id => mutationHP[id].currentHP > 0);

  // Build slot model for Pixi.js BattleArena — derived from mutations
  const playerBuild = useMemo(() => {
    const slots = { head: { mutation: null, tech: [] }, chest: { mutation: null, tech: [] }, leftArm: { mutation: null, tech: [] }, rightArm: { mutation: null, tech: [] }, back: { mutation: null, tech: [] }, legs: { mutation: null, tech: [] } };
    if (mutations) {
      mutations.forEach(m => {
        if ((m.type === 'ADD' || m.type === 'REPLACE') && m.slot && slots[m.slot] !== undefined) {
          // Only show if mutation is still alive
          if (mutationHP[m.id] && mutationHP[m.id].currentHP > 0) {
            slots[m.slot] = { mutation: m.id, tech: [] };
          }
        }
      });
    }
    return { slots };
  }, [mutations, mutationHP]);

  const opponentBuild = useMemo(() => {
    const slots = { head: { mutation: null, tech: [] }, chest: { mutation: null, tech: [] }, leftArm: { mutation: null, tech: [] }, rightArm: { mutation: null, tech: [] }, back: { mutation: null, tech: [] }, legs: { mutation: null, tech: [] } };
    Object.values(oppMutationHP).forEach(entry => {
      if (entry.slot && entry.currentHP > 0 && slots[entry.slot] !== undefined) {
        slots[entry.slot] = { mutation: entry.mutation.id, tech: [] };
      }
    });
    return { slots };
  }, [oppMutationHP]);

  // Paranoia (squid passive)
  const [corruptedMoves, setCorruptedMoves] = useState([]);
  const [paranoiaData, setParanoiaData] = useState({});

  // UI state: detail panel, matchup guide, TAB toggle
  const [hoveredMove, setHoveredMove] = useState(null);
  const [showOpponentMoves, setShowOpponentMoves] = useState(false);
  const [showMatchupGuide, setShowMatchupGuide] = useState(false);

  const containerRef = useRef(null);

  // Tutorial hints on turn start
  useEffect(() => {
    if (!isTutorial) return;
    const hint = getTutorialHint(turn, tutorialPhase, 'start');
    if (hint) setTutorialHint(hint);
  }, [turn, isTutorial, tutorialPhase]);

  // Keyboard shortcuts: TAB for opponent moves, M for matchup guide
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (phase === PHASE.MOVE_SELECT) setShowOpponentMoves(prev => !prev);
      }
      if (e.key === 'm' || e.key === 'M') {
        setShowMatchupGuide(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowMatchupGuide(false);
        setShowOpponentMoves(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase]);

  // Determine broken states
  const pBroken = {
    guard: pRes.guard <= 0,
    composure: pRes.composure <= 0,
    stamina: pRes.stamina < 3,
  };
  const oBroken = {
    guard: oRes.guard <= 0,
    composure: oRes.composure <= 0,
    stamina: oRes.stamina < 3,
  };

  // Refs for values accessed inside setTimeout closures to avoid stale reads
  const pBrokenRef = useRef(pBroken);
  pBrokenRef.current = pBroken;
  const costModifierRef = useRef(costModifier);
  costModifierRef.current = costModifier;
  const pResRef = useRef(pRes);
  pResRef.current = pRes;
  const oResRef = useRef(oRes);
  oResRef.current = oRes;

  // Calculate effective cost for a move considering broken states and modifiers
  function getEffectiveCost(move, broken, modifier) {
    let cost = move.minCost;
    // Broken guard: defensive and grab moves cost double
    if (broken.guard && (move.target === 'defense' || move.target === 'regen' || move.effect === 'costIncrease')) {
      cost *= 2;
    }
    // Broken composure: setup/info moves cost double
    if (broken.composure && (move.target === 'evasion' || move.target === 'utility')) {
      cost *= 2;
    }
    // Broken stamina: all moves +1
    if (broken.stamina) cost += 1;
    // Iron Grip modifier
    cost += modifier;
    // Entangle: all moves +1 cost
    if (playerEntangled && playerEntangled.turnsRemaining > 0) cost += 1;
    // Quick-Release tech: -1 cost for moves from teched slot
    if (move.fromSlot && hasTechOnSlot(move.fromSlot, 'costReduction')) cost = Math.max(1, cost - 1);
    // Voltamander Overcharged (7+): -1 cost
    if (playerCharKey === 'voltamander' && voltCharge >= 7) cost = Math.max(1, cost - 1);
    return cost;
  }

  // Finisher availability check
  function canUseFinisher(move, oppResources) {
    if (!move.isFinisher) return true;
    switch (move.finisherCondition) {
      case 'opponentGuardBroken': return oppResources.guard <= 0;
      case 'opponentComposureBroken': return oppResources.composure <= 0;
      case 'opponentArmorBroken': return oppResources.guard <= 0 || oppResources.composure <= 0;
      case 'opponentStaminaLow': return oppResources.stamina < 3;
      case 'hasStolenMutation': return oppStolenMoves.length > 0;
      default: return false;
    }
  }

  // Regenerate paranoia corruption each turn
  useEffect(() => {
    if (phase !== PHASE.MOVE_SELECT) return;
    if (opponentCharKey !== 'psychoSquid') return;

    const compDmg = MAX_COMPOSURE - pRes.composure;
    if (compDmg <= 0) {
      setCorruptedMoves([]);
      setParanoiaData({});
      return;
    }

    const numCorrupt = compDmg >= 5 ? 2 : 1;
    const moveIndices = playerMoves.map((_, i) => i);
    const shuffled = moveIndices.sort(() => Math.random() - 0.5);
    const corrupted = shuffled.slice(0, numCorrupt);
    setCorruptedMoves(corrupted);

    const data = {};
    corrupted.forEach(idx => {
      const otherIdx = moveIndices.filter(i => i !== idx);
      const swapWith = otherIdx[Math.floor(Math.random() * otherIdx.length)];
      data[idx] = {
        fakeName: playerMoves[swapWith]?.name || '???',
        fakeCost: playerMoves[idx].minCost + (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2)),
      };
    });
    setParanoiaData(data);
  }, [phase, turn, opponentCharKey, pRes.composure, playerMoves]);

  // Get AI's available moves, filtered for tutorial if needed
  function getAIMoves() {
    let moves = oppChar.moves;
    if (isTutorial) moves = filterMovesForTutorial(moves, tutorialPhase);
    return moves.filter(m => getEffectiveCost(m, oBroken, aiCostModifier) <= oRes.stamina && canUseFinisher(m, pRes));
  }

  // Build fight state for AI decisions, including mutation info
  function getAIFightState() {
    const targetableMutations = Object.entries(mutationHP)
      .filter(([, v]) => v.currentHP > 0)
      .map(([id, v]) => ({ id, currentHP: v.currentHP, maxHP: v.maxHP, weakness: v.weakness }));
    return {
      lastOpponentPush: staminaPush,
      lastPlayerMove,
      targetableMutations,
      stolenMoves: oppStolenMoves,
      mutationDamageDealt,
      fightNumber,
      turn,
      playerMoveHistory,
      echoResistance,
      parasitexStolenCount,
    };
  }

  // Get alive opponent mutations for targeting
  const aliveOppMutations = Object.entries(oppMutationHP)
    .filter(([, v]) => v.currentHP > 0)
    .map(([id, v]) => ({ id, ...v }));

  // Should we show target select? (non-finisher move, opponent has alive mutations)
  function shouldShowTargetSelect(move) {
    if (!move) return false;
    if (move.isFinisher) return false; // finishers always target BODY
    if (move.target === 'evasion' || move.target === 'defense' || move.target === 'utility' || move.target === 'regen') return false;
    return aliveOppMutations.length > 0;
  }

  // COMMIT — either go to target select or straight to committed
  function handleCommit() {
    if (phase === PHASE.MOVE_SELECT) {
      if (shouldShowTargetSelect(selectedMove)) {
        setSelectedTarget('body'); // default to body
        setPhase(PHASE.TARGET_SELECT);
        return;
      }
      // No mutations to target — go straight to commit
      setSelectedTarget('body');
      executeCommit();
    } else if (phase === PHASE.TARGET_SELECT) {
      // Target already selected, commit now
      executeCommit();
    }
  }

  function executeCommit() {
    // Ghost move: wastes turn, no stamina spent
    if (selectedMove?._isGhost) {
      setGhostMove(null);
      setTurnLog(['The move fizzles... it was a Spore Cloud illusion!']);
      setPhase(PHASE.RESOLUTION);
      setTimeout(() => endTurn(), 2000);
      return;
    }

    // AI decision — scramble overrides AI with random move
    let aiDecision;
    const aiMoves = getAIMoves();
    if (scrambleActive > 0 && aiMoves.length > 0) {
      const randomMove = aiMoves[Math.floor(Math.random() * aiMoves.length)];
      aiDecision = { move: randomMove, staminaPush: Math.min(2, oRes.stamina), intent: 'scrambled' };
      setScrambleActive(prev => prev - 1);
    } else {
      aiDecision = getAIDecision(
        opponentCharKey,
        aiMoves,
        oRes, pRes,
        getAIFightState()
      );
    }

    if (!aiDecision) {
      // AI has no affordable moves — auto-lose
      setFightResult({ won: true, reason: 'Opponent exhausted', turns: turn });
      setPhase(PHASE.FIGHT_OVER);
      return;
    }

    setAiMove(aiDecision.move);
    setAiStaminaPush(aiDecision.staminaPush);
    setAiTargetMutation(aiDecision.targetMutation || null);
    // Intent system: display with accuracy based on difficulty
    const displayIntent = getIntentDisplay(aiDecision.intent || 'attacking', fightNumber, opponentCharKey);
    setOppIntent(displayIntent);
    setPhase(PHASE.COMMITTED);
    playSound('commit');
    playSound('revealTension');
    // Auto-advance: COMMITTED → REVEAL after brief tension beat
    setTimeout(() => { setPhase(PHASE.REVEAL); playSound('revealFlip'); }, 400);
  }

  // Handle item use — called when player clicks an item to use
  function handleItemUse(item) {
    if (!item) return;
    const isFreeItem = item.effect === 'freeItem'; // Smoke Bomb: no opponent turn

    // AI still picks a move (unless it's a free item)
    let aiDecision = null;
    if (!isFreeItem) {
      aiDecision = getAIDecision(
        opponentCharKey,
        getAIMoves(),
        oRes, pRes, getAIFightState()
      );
      if (aiDecision) {
        setAiMove(aiDecision.move);
        setAiStaminaPush(aiDecision.staminaPush);
      }
    }

    // Apply item effect
    const log = [];
    switch (item.effect) {
      case 'restoreStamina':
        setPRes(prev => ({ ...prev, stamina: clamp(prev.stamina + item.value, 0, STAMINA_CAP) }));
        log.push(`+${item.value} Stamina`);
        break;
      case 'restoreGuard':
        setPRes(prev => ({ ...prev, guard: clamp(prev.guard + item.value, 0, MAX_GUARD) }));
        log.push(`+${item.value} Guard`);
        break;
      case 'restoreComposure':
        setPRes(prev => ({ ...prev, composure: clamp(prev.composure + item.value, 0, MAX_COMPOSURE) }));
        log.push(`+${item.value} Composure`);
        break;
      case 'restoreBody':
        setPRes(prev => ({ ...prev, body: clamp(prev.body + item.value, 0, MAX_BODY) }));
        log.push(`+${item.value} Body`);
        break;
      case 'restoreAll':
        setPRes(prev => ({
          ...prev,
          guard: clamp(prev.guard + item.value, 0, MAX_GUARD),
          composure: clamp(prev.composure + item.value, 0, MAX_COMPOSURE),
          body: clamp(prev.body + item.value, 0, MAX_BODY),
          stamina: clamp(prev.stamina + item.value, 0, STAMINA_CAP),
        }));
        log.push(`+${item.value} to all resources`);
        break;
      case 'doubleDamage':
        setAdrenalineActive(true);
        log.push('Next attack deals DOUBLE damage');
        break;
      case 'damageShield':
        setDamageShield(prev => prev + item.value);
        log.push(`Damage shield: absorbs next ${item.value} damage`);
        break;
      case 'guaranteeWin':
        setGuaranteeWin(true);
        log.push('Next matchup: GUARANTEED WIN');
        break;
      case 'skipOpponentTurn':
        setFlashBlind(true);
        log.push('Flash! Opponent deals 0 damage this turn');
        break;
      case 'scrambleOpponent':
        setScrambleActive(prev => prev + item.value);
        log.push(`Scrambled! Opponent uses random moves for ${item.value} turns`);
        break;
      case 'corrosive': {
        // Deal damage to opponent's most damaged mutation
        const activeMuts = Object.entries(oMutHP).filter(([, hp]) => hp > 0);
        if (activeMuts.length > 0) {
          const [targetMut] = activeMuts.sort((a, b) => a[1] - b[1]);
          setOMutHP(prev => ({
            ...prev,
            [targetMut[0]]: Math.max(0, prev[targetMut[0]] - item.value),
          }));
          log.push(`Corrosive: -${item.value} HP to mutation`);
        } else {
          // No mutations — deal Body damage instead
          setORes(prev => ({ ...prev, body: Math.max(0, prev.body - item.value) }));
          log.push(`Corrosive: -${item.value} Body (no mutations)`);
        }
        break;
      }
      case 'freeItem':
        // Smoke Bomb — item is "free", no opponent turn happens
        log.push('Smoke cover! No turn lost');
        break;
      case 'repairMutation': {
        // Repair most damaged player mutation
        const pMuts = Object.entries(pMutHP).filter(([, hp]) => hp > 0 && hp < 99);
        if (pMuts.length > 0) {
          const [targetMut] = pMuts.sort((a, b) => a[1] - b[1]);
          setPMutHP(prev => ({
            ...prev,
            [targetMut[0]]: prev[targetMut[0]] + item.value,
          }));
          log.push(`Mutation repaired: +${item.value} HP`);
        }
        break;
      }
      case 'revealIntent':
        setRevealTurns(prev => prev + item.value);
        log.push(`Scanner active for ${item.value} turns`);
        break;
    }

    // Log the item use
    setTurnLog(prev => [...prev, `Used ${item.name}: ${log.join(', ')}`]);

    // Consume the item
    onItemUsed(item.id);
    setSelectedItem(null);
    setShowItems(false);

    if (isFreeItem) {
      // Smoke Bomb — skip to next turn without opponent attacking
      endTurn();
    } else if (aiDecision) {
      // Opponent's move lands unopposed — resolve after brief display
      setMatchupResult({ winner: 'b', reason: `Item used — ${aiDecision.move.name} lands unopposed` });
      setPhase(PHASE.PUSH_REVEAL);
      setTimeout(() => resolveTurn(null, aiDecision.move, 'b', 0, aiDecision.staminaPush), 800);
    } else {
      endTurn();
    }
  }

  // REVEAL phase
  useEffect(() => {
    if (phase !== PHASE.REVEAL) return;
    if (!selectedMove || !aiMove) return;

    // In tutorial Phase A, no matchups — both always land
    const useMatchups = shouldUseMatchups(tutorialPhase);
    let result = useMatchups
      ? resolveMatchup(selectedMove, aiMove)
      : { winner: 'both', reason: 'Both land!', typeReason: null };

    // Focus Lens: guarantee player wins this matchup
    if (guaranteeWin && result.winner !== 'a') {
      result = { winner: 'a', reason: 'Focus Lens override — guaranteed win!', typeReason: null };
      setGuaranteeWin(false);
    }
    setMatchupResult(result);

    // Tutorial hints on matchup result
    if (isTutorial && useMatchups) {
      if (result.winner === 'a') {
        const hint = getTutorialHint(turn, tutorialPhase, 'reveal_win');
        if (hint) setTutorialHint(hint);
      } else if (result.winner === 'b') {
        const hint = getTutorialHint(turn, tutorialPhase, 'reveal_lose');
        if (hint) setTutorialHint(hint);
      }
    }

    if (result.winner === 'a' || result.winner === 'both') playSound('winMatchup');
    else playSound('loseMatchup');

    // Auto-advance: REVEAL → STAMINA_PUSH after showing matchup
    setTimeout(() => {
      const minCost = getEffectiveCost(selectedMove, pBrokenRef.current, costModifierRef.current);
      setStaminaPush(minCost);
      setPhase(PHASE.STAMINA_PUSH);
    }, 1000);
  }, [phase]);

  // STAMINA PUSH — auto-advance through push reveal to resolution
  function handlePushCommit() {
    playSound('pushCommit');
    setPhase(PHASE.PUSH_REVEAL);
    // Auto-advance: show push values briefly, then resolve
    setTimeout(() => resolveTurn(selectedMove, aiMove, matchupResult.winner, staminaPush, aiStaminaPush), 800);
  }

  // RESOLUTION
  function resolveTurn(pMove, oMove, winner, pPush, oPush) {
    // Staggered combat animations:
    // 1. Player attacks → opponent gets hit
    // 2. Opponent attacks → player gets hit
    const playerLanded = winner === 'a' || winner === 'both';
    const oppLanded = winner === 'b' || winner === 'both';
    const pAnim = pMove?.isFinisher ? 'special' : 'attack';
    const oAnim = oMove?.isFinisher ? 'special' : 'attack';
    if (pMove && pPush > 0) {
      setPlayerAnimState(pAnim);
      setTimeout(() => {
        setPlayerAnimState('idle');
        if (playerLanded) setOpponentAnimState('hit');
        setTimeout(() => {
          setOpponentAnimState('idle');
          if (oMove && oPush > 0) {
            setOpponentAnimState(oAnim);
            setTimeout(() => {
              setOpponentAnimState('idle');
              if (oppLanded) setPlayerAnimState('hit');
              setTimeout(() => setPlayerAnimState('idle'), 500);
            }, 600);
          }
        }, 500);
      }, 600);
    } else if (oMove && oPush > 0) {
      setOpponentAnimState(oAnim);
      setTimeout(() => {
        setOpponentAnimState('idle');
        if (oppLanded) setPlayerAnimState('hit');
        setTimeout(() => setPlayerAnimState('idle'), 500);
      }, 600);
    }

    let newPRes = { ...pRes };
    let newORes = { ...oRes };
    const log = [];
    let newMomentum = momentumChain;
    let newTotalCompDmg = totalCompDamage;
    let newCostMod = 0;
    let newAiCostMod = 0;

    // Deep copy mutation HP for this resolution (player's mutations)
    const newMutHP = {};
    Object.entries(mutationHP).forEach(([id, v]) => {
      newMutHP[id] = { ...v };
    });
    const mutationsDestroyedThisTurn = [];

    // Deep copy opponent mutation HP
    const newOppMutHP = {};
    Object.entries(oppMutationHP).forEach(([id, v]) => {
      newOppMutHP[id] = { ...v };
    });
    const oppMutationsDestroyedThisTurn = [];

    // Determine matchup winners
    const pWon = winner === 'a' || winner === 'both';
    const oWon = winner === 'b' || winner === 'both';

    // === DIMINISHING PUSH RETURNS ===
    // First 3 stamina = 1x each, additional = 0.5x each
    // Push of 5 = 3 + (2×0.5) = 4 effective
    function effectivePush(push) {
      if (push <= 3) return push;
      return 3 + (push - 3) * 0.5;
    }

    // === DAMAGE CALCULATION HELPER (Channel + Keyword model) ===
    // Step 1: raw = base × effectivePush × (Attack/50)
    // Step 2: POWER channel → reduced by Defense. PSYCHIC channel → reduced by Willpower.
    // Step 3: Matchup mult from keyword chart (win=1.0, lose=0.5)
    // Step 4: Random variance × 0.85-1.0
    function calcDamage(move, push, attackerStats, defenderStats, wonMatchup, isVariableDmg, compDmgTotal) {
      if (!move || push <= 0) return 0;
      let base = move.baseDamage;
      if (isVariableDmg) base = compDmgTotal;

      // POWER/FINISHER use Attack stat, PSYCHIC uses Willpower stat
      const channel = move.channel || 'POWER';
      const atkStat = channel === 'PSYCHIC' ? (attackerStats?.willpower || 50) : (attackerStats?.attack || 50);
      const atkMod = atkStat / 50;
      const ePush = effectivePush(push);
      let raw = isVariableDmg ? base : base * ePush * atkMod;

      // POWER/FINISHER reduced by Defense, PSYCHIC reduced by Willpower
      let defStat = defenderStats?.defense || 50;
      if (channel === 'PSYCHIC') defStat = defenderStats?.willpower || 50;
      const reduced = raw * (50 / Math.max(1, defStat));

      const matchMult = wonMatchup ? 1 : 0.5;
      const variance = 0.85 + Math.random() * 0.15;

      return Math.max(1, Math.floor(reduced * matchMult * variance));
    }

    // === CHANNEL ROUTING HELPER ===
    // Routes damage based on channel: POWER→Guard (overflow to Body), PSYCHIC→Composure (overflow to Body), FINISHER→Body direct
    function routeChannelDamage(dmg, move, targetRes, mutHPMap, log, destroyedList, isPlayer) {
      const channel = move.channel || 'POWER';

      // SELF channel: no damage
      if (channel === 'SELF') return;

      // FINISHER: bypass everything, direct Body
      if (channel === 'FINISHER') {
        if (isPlayer) {
          newORes.body = Math.max(0, newORes.body - dmg);
          log.push(`${move.name}: ${dmg} Body (FINISHER — direct hit)`);
        } else {
          newPRes.body = Math.max(0, newPRes.body - dmg);
          log.push(`${move.name}: ${dmg} Body to you (FINISHER)`);
        }
        return;
      }

      // POWER → Guard. PSYCHIC → Composure.
      const armorResource = channel === 'PSYCHIC' ? 'composure' : 'guard';
      const armorMax = channel === 'PSYCHIC' ? MAX_COMPOSURE : MAX_GUARD;
      const currentArmor = isPlayer ? newORes[armorResource] : newPRes[armorResource];

      // Check if armor is already broken — damage goes straight to Body
      if (currentArmor <= 0) {
        if (isPlayer) {
          newORes.body = Math.max(0, newORes.body - dmg);
          log.push(`${move.name}: ${dmg} Body (${armorResource} BROKEN — direct hit)`);
        } else {
          newPRes.body = Math.max(0, newPRes.body - dmg);
          log.push(`${move.name}: ${dmg} Body to you (${armorResource} broken)`);
        }
        return;
      }

      // Check for mutation shield on this armor layer
      const shieldSlot = channel === 'PSYCHIC' ? 'composure' : 'guard';
      const shieldEntry = Object.entries(mutHPMap).find(([, v]) => v.shieldFor === shieldSlot && v.currentHP > 0);

      if (shieldEntry) {
        const [, mut] = shieldEntry;
        let mutDmg = dmg;
        // Weakness/resistance
        if (mut.weakness && move.moveType === mut.weakness) { mutDmg = Math.floor(dmg * 1.5); log.push(`WEAK! (+50%)`); }
        if (mut.resistance && move.moveType === mut.resistance) { mutDmg = Math.floor(dmg * 0.75); log.push(`Resisted! (-25%)`); }
        // GRAB keyword: +50% to mutation HP
        if (move.keyword === 'GRAB') { mutDmg = Math.floor(mutDmg * 1.5); log.push('GRAB: +50% to mutation'); }

        const before = mut.currentHP;
        mut.currentHP = Math.max(0, mut.currentHP - mutDmg);
        if (mut.revealed !== undefined) mut.revealed = true;
        log.push(`${move.name}: ${Math.min(mutDmg, before)} to ${mut.mutation.name} (${mut.currentHP}/${mut.maxHP})`);

        if (mut.currentHP <= 0) {
          const overkill = mutDmg - before;
          // Overkill goes to armor resource
          if (overkill > 0) {
            applyArmorDamage(overkill, armorResource, isPlayer, log, 'ARMOR BREAK');
          }
          if (before > 0) { destroyedList.push(mut.mutation); log.push(`MUTATION DESTROYED: ${mut.mutation.name}!`); }
        }
        return;
      }

      // No mutation shield — apply to armor resource with overflow to Body
      applyArmorDamage(dmg, armorResource, isPlayer, log, move.name);
    }

    // Apply damage to armor (Guard/Composure) with overflow to Body on break
    function applyArmorDamage(dmg, resource, isPlayer, log, source) {
      const res = isPlayer ? newORes : newPRes;
      const current = res[resource];
      const suffix = isPlayer ? '' : ' to you';

      if (dmg >= current && current > 0) {
        // Breaking hit — overflow to Body
        const overflow = dmg - current;
        res[resource] = 0;
        log.push(`${source}: ${current} ${resource}${suffix} — ${resource.toUpperCase()} BROKEN!`);
        if (overflow > 0) {
          res.body = Math.max(0, res.body - overflow);
          log.push(`Overflow: ${overflow} Body${suffix}`);
        }
        if (resource === 'composure') newTotalCompDmg += current;
      } else {
        res[resource] = Math.max(0, res[resource] - dmg);
        log.push(`${source}: ${dmg} ${resource}${suffix}`);
        if (resource === 'composure') newTotalCompDmg += dmg;
      }
    }

    // Helper: find mutation shielding a resource
    function findShieldMutation(mutHPMap, resource) {
      return Object.entries(mutHPMap).find(([, v]) => v.shieldFor === resource && v.currentHP > 0);
    }

    // Helper: apply damage to a resource, checking for mutation armor
    function applyDamageToResource(dmg, resource, mutHPMap, move, log, targetName, destroyedList, isFinisher) {
      // Finishers bypass mutations, hit Body direct
      if (isFinisher) {
        newORes.body = Math.max(0, newORes.body - dmg);
        log.push(`${move.name}: ${dmg} Body (FINISHER — bypasses mutations)`);
        return dmg;
      }

      // Check for shielding mutation
      const shieldEntry = findShieldMutation(mutHPMap, resource);
      if (shieldEntry) {
        const [mutId, mut] = shieldEntry;
        let mutDmg = dmg;

        // Weakness: +50% to mutation HP
        if (mut.weakness && move.moveType === mut.weakness) {
          mutDmg = Math.floor(dmg * 1.5);
          log.push(`WEAK! ${move.moveType} vs ${mut.weakness} (+50%)`);
        }
        // Resistance: -25%
        if (mut.resistance && move.moveType === mut.resistance) {
          mutDmg = Math.floor(dmg * 0.75);
          log.push(`Resisted! ${move.moveType} vs ${mut.resistance} (-25%)`);
        }
        // Grab bonus: +50% to mutation HP
        if (move.keyword === 'GRAB') {
          mutDmg = Math.floor(mutDmg * 1.5);
          log.push('Grab: +50% to mutation HP');
        }

        const beforeHP = mut.currentHP;
        mut.currentHP = Math.max(0, mut.currentHP - mutDmg);
        if (mut.revealed !== undefined) mut.revealed = true;
        log.push(`${move.name}: ${Math.min(mutDmg, beforeHP)} to ${mut.mutation.name} (${mut.currentHP}/${mut.maxHP} HP)`);

        // Armor break: overkill passes through to resource
        if (mut.currentHP <= 0) {
          const overkill = mutDmg - beforeHP;
          if (overkill > 0) {
            applyResourceDirect(overkill, resource, log, 'ARMOR BREAK');
          }
          if (beforeHP > 0) {
            destroyedList.push(mut.mutation);
            log.push(`MUTATION DESTROYED: ${mut.mutation.name}!`);
          }
        }
        return mutDmg;
      }

      // No shield — direct resource damage
      applyResourceDirect(dmg, resource, log, move.name);
      return dmg;
    }

    // Helper: apply direct damage to opponent resource
    function applyResourceDirect(dmg, resource, log, source) {
      if (resource === 'guard') {
        newORes.guard = Math.max(0, newORes.guard - dmg);
        log.push(`${source}: ${dmg} Guard`);
      } else if (resource === 'composure') {
        newORes.composure = Math.max(0, newORes.composure - dmg);
        newTotalCompDmg += dmg;
        log.push(`${source}: ${dmg} Composure`);
      } else if (resource === 'body') {
        newORes.body = Math.max(0, newORes.body - dmg);
        log.push(`${source}: ${dmg} Body`);
      }
    }

    // Get attacker/defender stats (player uses mutation-modified attributes from App)
    const pStats = playerAttributes || playerChar.stats || { attack: 50, defense: 50, willpower: 50, toughness: 50 };
    // Compute opponent effective stats by applying their species mutation attrMods
    const oStatsBase = oppChar.stats || { attack: 50, defense: 50, willpower: 50, toughness: 50 };
    const oppSpecMuts = speciesMutations[opponentCharKey] || [];
    const oStats = { ...oStatsBase };
    oppSpecMuts.forEach(mut => {
      if (mut.attrMod) {
        Object.entries(mut.attrMod).forEach(([attr, val]) => {
          if (attr.startsWith('_')) return;
          if (oStats[attr] !== undefined) {
            oStats[attr] = Math.round(oStats[attr] * (1 + val));
          }
        });
      }
    });

    // === PLAYER'S MOVE DAMAGE ===
    if (pMove && pPush > 0) {
      let baseDmg = pMove.baseDamage;
      if (adrenalineActive) { baseDmg *= 2; setAdrenalineActive(false); }
      const isVariableDmg = pMove.variableDamage;
      if (isVariableDmg) baseDmg = totalCompDamage;
      baseDmg = applyScarEffects(scars, baseDmg, pMove.moveType, true);
      // Plasma Coating tech: +1 base damage for moves from teched slot
      if (pMove.fromSlot && hasTechOnSlot(pMove.fromSlot, 'bonusDamage')) baseDmg += 1;
      // Berserker Cortex mutation: +1 base when composure below 50%
      if (pRes.composure < MAX_COMPOSURE * 0.5 && mutations?.some(m => m.effect === 'berserkerCortex')) baseDmg += 1;
      // Psionic Amplifier mutation: +1 base to PSYCHIC moves
      if (pMove.channel === 'PSYCHIC' && mutations?.some(m => m.effect === 'psionicAmplifier')) baseDmg += 1;
      // Flow Bonus: +1 base when using different type than last turn
      const playerHasFlow = playerLastType !== null && pMove.moveType !== playerLastType;
      if (playerHasFlow || pMove.isFinisher) { baseDmg += 1; log.push('Flow bonus! +1 base damage'); }

      // Voltamander Charge bonus (player)
      if (playerCharKey === 'voltamander' && voltCharge >= 4) {
        baseDmg += voltCharge >= 7 ? 2 : 1;
        log.push(`Bioelectric Charge: +${voltCharge >= 7 ? 2 : 1} damage (${voltCharge >= 7 ? 'Overcharged' : 'Charged'})`);
      }

      // Scar: composure bonus
      const compBonus = getScarCompBonus(scars);
      if (compBonus > 0 && pMove.target !== 'composure') {
        newORes.composure = Math.max(0, newORes.composure - compBonus);
        log.push(`Mind Scar: +${compBonus} Composure`);
      }

      // Calculate base damage via spec formula
      let dmg = calcDamage({ ...pMove, baseDamage: baseDmg }, pPush, pStats, oStats, pWon, isVariableDmg, totalCompDamage);

      // Gorilla Momentum bonus (POWER channel = Guard pressure)
      if (playerCharKey === 'cyberGorilla' && pMove.channel === 'POWER' && pWon) {
        dmg += Math.floor(newMomentum * pMove.baseDamage * (pStats.attack / 50));
      }

      // Shell Block halves damage
      if (oMove?.effect === 'halfDamage' && oWon) {
        dmg = Math.ceil(dmg / 2);
        log.push('Shell Block halves damage!');
      }

      // Echomorph Adaptive Resistance
      if (opponentCharKey === 'echomorph' && pMove) {
        const hits = echoResistance[pMove.moveType] || 0;
        if (hits > 0) {
          const reduction = Math.min(0.75, hits * 0.25); // 25% per previous hit, cap 75%
          dmg = Math.max(1, Math.floor(dmg * (1 - reduction)));
          log.push(`Echomorph adapts: -${Math.round(reduction * 100)}% ${pMove.moveType} resistance`);
        }
      }

      // Chromatophore Skin camo miss
      if (opponentCharKey === 'echomorph' && echoCamoTurns > 0 && Math.random() < 0.3) {
        dmg = 0;
        log.push('MISS — Echomorph camouflaged!');
      }

      if (!pWon) log.push('(Half damage — lost matchup)');

      // === CHANNEL-BASED DAMAGE ROUTING ===

      // Special mechanics first (Rocket Fist, Hive Thrusters, Synapse Swap)
      if (pMove.effect === 'splitPierce') {
        // Rocket Fist: split evenly between Guard and Body (both through Defense)
        const guardDmg = Math.ceil(dmg / 2);
        const bodyDmg = Math.floor(dmg / 2);
        applyArmorDamage(guardDmg, 'guard', true, log, pMove.name + ' (Guard)');
        newORes.body = Math.max(0, newORes.body - bodyDmg);
        log.push(`${pMove.name} (Body): ${bodyDmg} Body`);
      } else if (pMove.effect === 'doubleHit') {
        // Hive Thrusters: route through channel twice at half
        const halfDmg = Math.max(1, Math.ceil(dmg / 2));
        for (let hit = 0; hit < 2; hit++) {
          log.push(`Hit ${hit + 1}:`);
          routeChannelDamage(halfDmg, pMove, newORes, newOppMutHP, log, oppMutationsDestroyedThisTurn, true);
        }
      } else if (pMove.effect === 'synapseSwap' && pWon && oppChar.moves.length >= 2) {
        // Synapse Swap: apply PSYCHIC damage normally + swap moves
        const indices = oppChar.moves.map((_, i) => i).sort(() => Math.random() - 0.5);
        setOppSwappedMoves([indices[0], indices[1]]);
        log.push(`Synapse Swap: ${oppChar.moves[indices[0]].name} ↔ ${oppChar.moves[indices[1]].name} swapped!`);
        routeChannelDamage(dmg, pMove, newORes, newOppMutHP, log, oppMutationsDestroyedThisTurn, true);
      } else if (selectedTarget && selectedTarget !== 'body' && newOppMutHP[selectedTarget] && newOppMutHP[selectedTarget].currentHP > 0) {
        // Player targeting a specific mutation directly
        const targetMut = newOppMutHP[selectedTarget];
        let mutDmg = dmg;
        if (targetMut.weakness && pMove.moveType === targetMut.weakness) { mutDmg = Math.floor(dmg * 1.5); log.push(`WEAK! (+50%)`); }
        if (targetMut.resistance && pMove.moveType === targetMut.resistance) { mutDmg = Math.floor(dmg * 0.75); log.push(`Resisted! (-25%)`); }
        if (pMove.keyword === 'GRAB') { mutDmg = Math.floor(mutDmg * 1.5); log.push('GRAB: +50% to mutation'); }
        const beforeHP = targetMut.currentHP;
        targetMut.currentHP = Math.max(0, targetMut.currentHP - mutDmg);
        targetMut.revealed = true;
        log.push(`${pMove.name}: ${Math.min(mutDmg, beforeHP)} to ${targetMut.mutation.name} (${targetMut.currentHP}/${targetMut.maxHP})`);
        if (targetMut.currentHP <= 0 && mutDmg > beforeHP) {
          const overkill = mutDmg - beforeHP;
          const resTarget = pMove.channel === 'PSYCHIC' ? 'composure' : 'guard';
          applyArmorDamage(overkill, resTarget, true, log, 'ARMOR BREAK');
        }
        if (targetMut.currentHP <= 0 && beforeHP > 0) { oppMutationsDestroyedThisTurn.push(targetMut.mutation); log.push(`MUTATION DESTROYED: ${targetMut.mutation.name}!`); }
      } else {
        // Standard channel routing: POWER→Guard, PSYCHIC→Composure, FINISHER→Body, SELF→nothing
        routeChannelDamage(dmg, pMove, newORes, newOppMutHP, log, oppMutationsDestroyedThisTurn, true);
      }

      // AREA keyword splash: after primary damage, 1 damage to random alive mutation
      if (pMove.keyword === 'AREA' || pMove.effect === 'areaSplash') {
        const aliveMuts = Object.entries(newOppMutHP).filter(([, v]) => v.currentHP > 0);
        if (aliveMuts.length > 0) {
          const [, splashMut] = aliveMuts[Math.floor(Math.random() * aliveMuts.length)];
          splashMut.currentHP = Math.max(0, splashMut.currentHP - 1);
          log.push(`AREA Splash: 1 to ${splashMut.mutation.name}`);
          if (splashMut.currentHP <= 0) { oppMutationsDestroyedThisTurn.push(splashMut.mutation); log.push(`MUTATION DESTROYED: ${splashMut.mutation.name}!`); }
        }
      }

      // Regen effects (SELF channel moves)
      if (pMove.effect === 'regenGuard') {
        const regenAmt = pMove.regenAmount || 3;
        newPRes.guard = Math.min(MAX_GUARD, newPRes.guard + regenAmt);
        log.push(`${pMove.name}: +${regenAmt} Guard`);
      }

      // Deduct player stamina (EVASION gets -1 cost discount)
      const pEffectivePush = pMove.moveType === 'evasion' ? Math.max(0, pPush - 1) : pPush;
      newPRes.stamina -= pEffectivePush;

      // Stamina interactions per move type
      if (pMove.moveType === 'fast' && pWon) {
        newPRes.stamina = Math.min(STAMINA_CAP, newPRes.stamina + 1);
        log.push('FAST refund: +1 stamina');
      }
      if (pMove.moveType === 'grab' && pWon) {
        newPRes.stamina = Math.min(STAMINA_CAP, newPRes.stamina + 1);
        newORes.stamina = Math.max(0, newORes.stamina - 1);
        log.push('GRAB steal: +1 stamina, opponent -1');
      }
      if (pMove.moveType === 'psychic' && pWon) {
        setOppRegenDebuff(1);
        log.push('PSYCHIC: opponent regen -1 next turn');
      }
      if (pMove.moveType === 'defense') {
        setPlayerRegenBonus(1);
        log.push('DEFENSE: +1 regen next turn');
      }

      // Update last move type for Flow tracking
      setPlayerLastType(pMove.moveType);

      // Gorilla Momentum tracking (POWER channel = Guard hits)
      if (playerCharKey === 'cyberGorilla') {
        if (pMove.channel === 'POWER') {
          newMomentum++;
          log.push(`Momentum: ${newMomentum}`);
        } else {
          newMomentum = 0;
        }
      }
    }

    // === OPPONENT'S MOVE DAMAGE ===
    if (oMove && oPush > 0) {
      // Scar: ghost scar dodge check
      if (checkScarDodge(scars)) {
        log.push('Ghost Scar: auto-dodged!');
      } else {

      let dmg = calcDamage(oMove, oPush, oStats, pStats, oWon, oMove.variableDamage, MAX_COMPOSURE - newPRes.composure);

      // Glass Viper stealth bonus: +50% damage from stealth
      if (opponentCharKey === 'glassViper' && viperStealth && oMove.moveType !== 'defense') {
        dmg = Math.floor(dmg * 1.5);
        log.push('STEALTH STRIKE: +50% damage!');
      }

      // Voltamander Charge bonus (opponent)
      if (opponentCharKey === 'voltamander' && voltCharge >= 4) {
        const bonus = voltCharge >= 7 ? 2 : 1;
        dmg += bonus;
        log.push(`Bioelectric Charge: +${bonus} damage`);
      }

      // Scar: damage reduction
      const scarReduction = getScarDamageReduction(scars);
      if (scarReduction > 0) {
        dmg = Math.max(1, dmg - scarReduction);
        log.push(`Armor Scar: -${scarReduction} damage`);
      }

      // Snap Bite counter hit: double damage if opponent used power/guard/body move
      if (oMove.effect === 'counterHit' && pMove && (pMove.moveType === 'power' || pMove.target === 'guard' || pMove.target === 'body')) {
        dmg = Math.floor(dmg * 2);
        log.push('Counter hit! Double damage!');
      }

      // Spike Shell reflect: opponent takes their stamina push as Body damage
      if (oMove.effect === 'spikeReflect' && pMove && pPush > 0) {
        newPRes.body = Math.max(0, newPRes.body - pPush);
        log.push(`Spike Shell: reflects ${pPush} Body damage!`);
      }

      // Shell Block from player side
      if (pMove?.effect === 'halfDamage' && pWon) {
        dmg = Math.ceil(dmg / 2);
        log.push('Shell Block halves damage!');
      }

      // Echo Core resonance: same move type = +50% damage
      if (opponentCharKey === 'echomorph' && pMove && oMove && pMove.moveType === oMove.moveType) {
        dmg = Math.floor(dmg * 1.5);
        log.push('Echo Core resonance: +50% damage (same type)');
      }

      // Cocoon heal (Parasitex)
      if (oMove.effect === 'cocoonHeal') {
        newORes.body = Math.min(MAX_BODY, newORes.body + 2);
        log.push('Cocoon: +2 Body healed');
      }

      // Life steal (Hydravine Root Drain)
      if (oMove.effect === 'lifeSteal' && dmg > 0) {
        newORes.body = Math.min(MAX_BODY, newORes.body + Math.ceil(dmg * 0.3));
        log.push(`Life Steal: healed ${Math.ceil(dmg * 0.3)} Body`);
      }

      if (!oWon) log.push('(Half damage — lost matchup)');

      // Flash Grenade: opponent deals 0 damage this turn
      if (flashBlind) {
        dmg = 0;
        log.push('FLASH BLIND: opponent deals 0 damage!');
        setFlashBlind(false);
      }

      // Damage Shield: absorb incoming damage
      if (damageShield > 0 && dmg > 0) {
        const absorbed = Math.min(damageShield, dmg);
        dmg -= absorbed;
        setDamageShield(prev => prev - absorbed);
        log.push(`Shield absorbed ${absorbed} damage (${damageShield - absorbed} remaining)`);
      }

      // Apply AI damage to player resources with mutation armor
      // Helper for player-side mutation armor
      function applyDmgToPlayer(amount, resource, move, isFinisher) {
        if (isFinisher) {
          newPRes.body = Math.max(0, newPRes.body - amount);
          log.push(`${move.name}: ${amount} Body (FINISHER)`);
          return;
        }
        const shieldEntry = findShieldMutation(newMutHP, resource);
        if (shieldEntry) {
          const [, mut] = shieldEntry;
          let mutDmg = amount;
          if (mut.weakness && move.moveType === mut.weakness) { mutDmg = Math.floor(amount * 1.5); log.push(`WEAK! (+50%)`); }
          if (mut.resistance && move.moveType === mut.resistance) { mutDmg = Math.floor(amount * 0.75); log.push(`Resisted! (-25%)`); }
          if (move.keyword === 'GRAB') { mutDmg = Math.floor(mutDmg * 1.5); log.push('Grab +50%'); }
          const before = mut.currentHP;
          mut.currentHP = Math.max(0, mut.currentHP - mutDmg);
          log.push(`${move.name}: ${Math.min(mutDmg, before)} to ${mut.mutation.name} (${mut.currentHP}/${mut.maxHP})`);
          if (mut.currentHP <= 0) {
            const overkill = mutDmg - before;
            if (overkill > 0) {
              if (resource === 'guard') newPRes.guard = Math.max(0, newPRes.guard - overkill);
              else if (resource === 'composure') newPRes.composure = Math.max(0, newPRes.composure - overkill);
              else newPRes.body = Math.max(0, newPRes.body - overkill);
              log.push(`ARMOR BREAK: ${overkill} ${resource}`);
            }
            if (before > 0) { mutationsDestroyedThisTurn.push(mut.mutation); log.push(`MUTATION DESTROYED: ${mut.mutation.name}!`); }
          }
        } else {
          if (resource === 'guard') { newPRes.guard = Math.max(0, newPRes.guard - amount); log.push(`${move.name}: ${amount} Guard to you`); }
          else if (resource === 'composure') { newPRes.composure = Math.max(0, newPRes.composure - amount); log.push(`${move.name}: ${amount} Composure to you`); }
          else { newPRes.body = Math.max(0, newPRes.body - amount); log.push(`${move.name}: ${amount} Body to you`); }
        }
      }

      // AI targeting player mutation directly
      if (aiTargetMutation && newMutHP[aiTargetMutation] && newMutHP[aiTargetMutation].currentHP > 0) {
        const mut = newMutHP[aiTargetMutation];
        let mutDmg = dmg;
        if (mut.weakness && oMove.moveType === mut.weakness) { mutDmg = Math.floor(dmg * 1.5); log.push('WEAK! (+50%)'); }
        if (mut.resistance && oMove.moveType === mut.resistance) { mutDmg = Math.floor(dmg * 0.75); log.push('Resisted!'); }
        if (oMove.keyword === 'GRAB') { mutDmg = Math.floor(mutDmg * 1.5); log.push('Grab +50%'); }
        // Parasitex Assimilate: double damage to mutation, 0 to resources
        if (opponentCharKey === 'parasitex' && oWon) { mutDmg *= 2; log.push('ASSIMILATE: 2x mutation damage!'); }
        const before = mut.currentHP;
        mut.currentHP = Math.max(0, mut.currentHP - mutDmg);
        log.push(`${oMove.name}: ${Math.min(mutDmg, before)} to ${mut.mutation.name} (${mut.currentHP}/${mut.maxHP})`);
        if (mut.currentHP <= 0 && mutDmg > before) {
          const overkill = mutDmg - before;
          newPRes.body = Math.max(0, newPRes.body - overkill);
          log.push(`ARMOR BREAK: ${overkill} Body`);
        }
        if (mut.currentHP <= 0 && before > 0) { mutationsDestroyedThisTurn.push(mut.mutation); log.push(`MUTATION DESTROYED: ${mut.mutation.name}!`); }
      } else if (oMove.isFinisher) {
        applyDmgToPlayer(dmg, 'body', oMove, true);
      } else if (oMove.target === 'guard') {
        applyDmgToPlayer(dmg, 'guard', oMove, false);
      } else if (oMove.target === 'composure') {
        applyDmgToPlayer(dmg, 'composure', oMove, false);
      } else if (oMove.target === 'body') {
        applyDmgToPlayer(dmg, 'body', oMove, false);
      } else if (oMove.target === 'guard+composure') {
        const each = Math.ceil(dmg / 2);
        applyDmgToPlayer(each, 'guard', oMove, false);
        applyDmgToPlayer(each, 'composure', oMove, false);
      } else if (oMove.target === 'utility' && oMove.effect === 'costIncrease') {
        newCostMod = 2;
        log.push(`${oMove.name}: your moves +2 cost next turn`);
      } else if (oMove.target === 'regen' || oMove.effect === 'regenGuard') {
        const regenAmt = oMove.regenAmount || 3;
        newORes.guard = Math.min(MAX_GUARD, newORes.guard + regenAmt);
        log.push(`${oMove.name}: opponent +${regenAmt} Guard`);
      }

      // Deduct AI stamina (EVASION gets -1 discount)
      const oEffectivePush = oMove.moveType === 'evasion' ? Math.max(0, oPush - 1) : oPush;
      newORes.stamina -= oEffectivePush;

      // AI stamina interactions
      if (oMove.moveType === 'fast' && oWon) {
        newORes.stamina = Math.min(STAMINA_CAP, newORes.stamina + 1);
        log.push('Opponent FAST refund: +1 stamina');
      }
      if (oMove.moveType === 'grab' && oWon) {
        newORes.stamina = Math.min(STAMINA_CAP, newORes.stamina + 1);
        newPRes.stamina = Math.max(0, newPRes.stamina - 1);
        log.push('Opponent GRAB steal: +1 stamina, you -1');
      }
      if (oMove.moveType === 'psychic' && oWon) {
        setPlayerRegenDebuff(1);
        log.push('Opponent PSYCHIC: your regen -1 next turn');
      }
      if (oMove.moveType === 'defense') {
        setOppRegenBonus(1);
      }

      // AI flow bonus (applied in damage calc above via oppLastType)
      setOppLastType(oMove.moveType);

      // Turtle Stamina Tax passive
      const taxThreshold = 3;
      if (playerCharKey === 'terrorPinTurtle' && oPush >= taxThreshold) {
        newORes.stamina -= 1;
        log.push('Stamina Tax: -1 extra stamina');
      }

      } // close ghost scar dodge else
    }

    // Scar: splash damage — chip 1 to a second resource on player attacks
    if (pMove && pMove.baseDamage > 0) {
      const splashScars = scars.filter(s => s.effect === 'splashDamage');
      if (splashScars.length > 0) {
        const splashTargets = ['guard', 'composure', 'body'].filter(t => t !== pMove.target);
        if (splashTargets.length > 0) {
          const splashTarget = splashTargets[Math.floor(Math.random() * splashTargets.length)];
          newORes[splashTarget] = Math.max(0, newORes[splashTarget] - splashScars.length);
          log.push(`Splash Scar: ${splashScars.length} ${splashTarget} chip`);
        }
      }
    }

    // Turtle Stamina Tax passive (opponent is turtle)
    if (opponentCharKey === 'terrorPinTurtle' && pPush >= 3) {
      newPRes.stamina -= 1;
      log.push('Stamina Tax: -1 extra stamina to you');
    }

    // Screen shake + sound on hits
    const totalDmg = Math.abs(pRes.body - newPRes.body) + Math.abs(oRes.body - newORes.body);
    if (totalDmg > 0) playSound('impact', Math.min(totalDmg, 10));
    if (totalDmg >= 5) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
    // Resource break sounds
    if (newORes.guard <= 0 && oRes.guard > 0) playSound('resourceBreak');
    if (newORes.composure <= 0 && oRes.composure > 0) playSound('resourceBreak');
    if (newPRes.guard <= 0 && pRes.guard > 0) playSound('resourceBreak');
    if (newPRes.composure <= 0 && pRes.composure > 0) playSound('resourceBreak');

    // Stamina regen (with DEFENSE bonus / PSYCHIC debuff applied)
    const pBaseRegen = newPRes.stamina < 3 ? 1 : STAMINA_REGEN;
    const oBaseRegen = newORes.stamina < 3 ? 1 : STAMINA_REGEN;
    const pRegenRate = Math.max(0, pBaseRegen + playerRegenBonus - playerRegenDebuff);
    const oRegenRate = Math.max(0, oBaseRegen + oppRegenBonus - oppRegenDebuff);
    newPRes.stamina = clamp(newPRes.stamina + pRegenRate, 0, STAMINA_CAP);
    newORes.stamina = clamp(newORes.stamina + oRegenRate, 0, STAMINA_CAP);
    // Reset regen modifiers after application
    setPlayerRegenBonus(0); setOppRegenBonus(0);
    setPlayerRegenDebuff(0); setOppRegenDebuff(0);

    // Passive shield regen: +1 Guard and +1 Composure per turn (if not broken)
    if (newPRes.guard > 0 && newPRes.guard < MAX_GUARD) {
      newPRes.guard = Math.min(MAX_GUARD, newPRes.guard + GUARD_REGEN);
    }
    if (newPRes.composure > 0 && newPRes.composure < MAX_COMPOSURE) {
      newPRes.composure = Math.min(MAX_COMPOSURE, newPRes.composure + COMPOSURE_REGEN);
    }
    if (newORes.guard > 0 && newORes.guard < MAX_GUARD) {
      newORes.guard = Math.min(MAX_GUARD, newORes.guard + GUARD_REGEN);
    }
    if (newORes.composure > 0 && newORes.composure < MAX_COMPOSURE) {
      newORes.composure = Math.min(MAX_COMPOSURE, newORes.composure + COMPOSURE_REGEN);
    }

    // Bee Residual Sting passive (Sting Synthesizer tech: 2 instead of 1)
    if (playerCharKey === 'beeSwarm') {
      const stingDmg = 1;
      newORes.body = Math.max(0, newORes.body - stingDmg);
      log.push(`Residual Sting: ${stingDmg} Body to opponent`);
      playSound('passive');
    }
    if (opponentCharKey === 'beeSwarm') {
      newPRes.body = Math.max(0, newPRes.body - 1);
      log.push('Residual Sting: 1 Body to you');
      playSound('passive');
    }

    // Regenerative Tissue mutation
    if (mutations?.some(m => m.id === 'regenerative_tissue')) {
      newPRes.body = Math.min(MAX_BODY, newPRes.body + 1);
      log.push('Regenerative Tissue: +1 Body');
    }

    // Emergency Rebuild tech: when mutation drops below 30% HP, restore 5 (once/fight)
    Object.values(newMutHP).forEach(mut => {
      if (mut.currentHP > 0 && mut.currentHP <= mut.maxHP * 0.3 && !mut.emergencyUsed && hasTechOnSlot(mut.slot, 'emergencyRebuild')) {
        mut.currentHP = Math.min(mut.maxHP, mut.currentHP + 5);
        mut.emergencyUsed = true;
        log.push(`Emergency Rebuild: ${mut.mutation.name} restored to ${mut.currentHP} HP!`);
      }
    });

    // Endurance Core tech: restore 3 to most damaged resource on turns 10 and 15
    if (hasTechEffect('enduranceCore') && (turn === 10 || turn === 15)) {
      const resources = [
        { key: 'guard', val: newPRes.guard, max: MAX_GUARD },
        { key: 'composure', val: newPRes.composure, max: MAX_COMPOSURE },
        { key: 'body', val: newPRes.body, max: MAX_BODY },
      ];
      const mostDamaged = resources.reduce((a, b) => (b.max - b.val) > (a.max - a.val) ? b : a);
      if (mostDamaged.max - mostDamaged.val > 0) {
        const heal = Math.min(3, mostDamaged.max - mostDamaged.val);
        newPRes[mostDamaged.key] += heal;
        log.push(`Endurance Core: +${heal} ${mostDamaged.key} (turn ${turn} heal)`);
      }
    }

    // Fortress Protocol mutation: DEFENSE moves also restore 1 Composure
    if (pMove && pMove.moveType === 'defense' && mutations?.some(m => m.effect === 'fortressProtocol')) {
      newPRes.composure = Math.min(MAX_COMPOSURE, newPRes.composure + 1);
      log.push('Fortress Protocol: +1 Composure (defense move)');
    }

    // Deep Roots mutation: +1 stamina regen, +2 if below 30% in any resource
    if (mutations?.some(m => m.effect === 'deepRoots')) {
      const lowResource = newPRes.guard < MAX_GUARD * 0.3 || newPRes.composure < MAX_COMPOSURE * 0.3 || newPRes.body < MAX_BODY * 0.3;
      const deepRootsBonus = lowResource ? 2 : 1;
      newPRes.stamina = Math.min(STAMINA_CAP, newPRes.stamina + deepRootsBonus);
      log.push(`Deep Roots: +${deepRootsBonus} stamina`);
    }

    // Parasitic Drain mutation: on hit, drain 1 from opponent's most damaged mutation, heal 1 on yours
    if (pMove && pPush > 0 && pWon && mutations?.some(m => m.effect === 'parasiticDrain')) {
      const oppAlive = Object.values(newOppMutHP).filter(m => m.currentHP > 0);
      const myDamaged = Object.values(newMutHP).filter(m => m.currentHP > 0 && m.currentHP < m.maxHP);
      if (oppAlive.length > 0) {
        const target = oppAlive.reduce((a, b) => a.currentHP < b.currentHP ? a : b);
        target.currentHP = Math.max(0, target.currentHP - 1);
        log.push(`Parasitic Drain: -1 from ${target.mutation.name}`);
        if (target.currentHP <= 0) { oppMutationsDestroyedThisTurn.push(target.mutation); log.push(`MUTATION DESTROYED: ${target.mutation.name}!`); }
      }
      if (myDamaged.length > 0) {
        const heal = myDamaged.reduce((a, b) => a.currentHP < b.currentHP ? a : b);
        heal.currentHP = Math.min(heal.maxHP, heal.currentHP + 1);
        log.push(`Parasitic Drain: +1 to ${heal.mutation.name}`);
      }
    }

    // Shock Plating tech: if opponent hit a teched mutation this turn, deal 1 Body back
    if (oMove && oPush > 0 && aiTargetMutation) {
      const hitMut = newMutHP[aiTargetMutation];
      if (hitMut && hasTechOnSlot(hitMut.slot, 'shockReflect')) {
        newORes.body = Math.max(0, newORes.body - 1);
        log.push('Shock Plating: 1 Body reflected to attacker');
      }
    }

    // Neural Overload tech: on hit, 30% chance opponent next move costs +1
    if (pMove && pPush > 0 && pWon && pMove.fromSlot && hasTechOnSlot(pMove.fromSlot, 'neuralOverload')) {
      if (Math.random() < 0.3) {
        newAiCostMod += 1;
        log.push('Neural Overload: opponent next move costs +1 stamina!');
      }
    }

    // Reflex Amplifier tech: lose matchup → gain +2 stamina
    if (!pWon && hasTechEffect('reflexAmplifier')) {
      newPRes.stamina = Math.min(STAMINA_CAP, newPRes.stamina + 2);
      log.push('Reflex Amplifier: +2 stamina (lost matchup)');
    }

    // Adrenaline Regulator tech: win matchup → next push costs 1 less
    if (pWon && hasTechEffect('adrenalineRegulator')) {
      newCostMod -= 1;
      log.push('Adrenaline Regulator: next push costs -1');
    }

    // Siege Protocol tech: +2 to mutation damage, -1 to resource damage (applied in damage routing above)

    // Venom Injector tech: on player hit, apply DoT
    if (pMove && pPush > 0 && pWon && pMove.fromSlot && hasTechOnSlot(pMove.fromSlot, 'venomDot')) {
      setOppDots(prev => [...prev, { damage: 1, turnsLeft: 2 }]);
      log.push('Venom Injector: poison applied (1/turn, 2 turns)');
    }

    // Plasma Coating is applied earlier in damage calc (baseDmg += 1)

    // Scar: stamina regen bonus
    const scarRegen = getScarRegenBonus(scars);
    if (scarRegen > 0) {
      newPRes.stamina = clamp(newPRes.stamina + scarRegen, 0, STAMINA_CAP);
      log.push(`Speed Scar: +${scarRegen} stamina regen`);
    }

    // Scar: grip scar — opponent stamina cost +1 (tracked via costModifier, lasts 3 turns)
    const gripScars = scars.filter(s => s.effect === 'costPenalty');
    if (gripScars.length > 0) {
      // Apply as persistent AI cost modifier
      newAiCostMod = Math.max(newAiCostMod, gripScars.length);
    }

    // === COUNTER-MECHANIC PASSIVES ===

    // ── Iron Mantis — Vice Grip ──
    // On GRAB win, clamp opponent's target mutation for 2 turns
    if (opponentCharKey === 'ironMantis' && oMove?.moveType === 'grab' && oWon) {
      // Clamp player's most damaged mutation (or random alive one)
      const playerAlive = Object.entries(newMutHP).filter(([, v]) => v.currentHP > 0);
      if (playerAlive.length > 0) {
        const [targetId, targetMut] = playerAlive.reduce((a, b) => a[1].currentHP < b[1].currentHP ? a : b);
        setClampedMutations(prev => ({ ...prev, [targetId]: 2 }));
        log.push(`VICE GRIP: ${targetMut.mutation.name} clamped for 2 turns!`);
      }
    }
    if (playerCharKey === 'ironMantis' && pMove?.moveType === 'grab' && pWon) {
      const oppAlive = Object.entries(newOppMutHP).filter(([, v]) => v.currentHP > 0);
      if (oppAlive.length > 0) {
        const [targetId, targetMut] = oppAlive.reduce((a, b) => a[1].currentHP < b[1].currentHP ? a : b);
        log.push(`VICE GRIP: ${targetMut.mutation.name} clamped for 2 turns!`);
        // Clamped opponent mutations lose 1 HP/turn (tracked below)
      }
    }
    // Clamp tick: clamped mutations lose 1 HP/turn, decrement timer
    if (Object.keys(clampedMutations).length > 0) {
      const newClamped = {};
      for (const [mutId, turnsLeft] of Object.entries(clampedMutations)) {
        if (newMutHP[mutId] && newMutHP[mutId].currentHP > 0) {
          newMutHP[mutId].currentHP = Math.max(0, newMutHP[mutId].currentHP - 1);
          log.push(`Vice Grip: ${newMutHP[mutId].mutation.name} -1 HP (clamped)`);
          if (newMutHP[mutId].currentHP <= 0) {
            mutationsDestroyedThisTurn.push(newMutHP[mutId].mutation);
            log.push(`MUTATION DESTROYED: ${newMutHP[mutId].mutation.name}!`);
          }
        }
        if (turnsLeft > 1) newClamped[mutId] = turnsLeft - 1;
      }
      setClampedMutations(newClamped);
    }

    // ── Voltamander — Bioelectric Charge ──
    if (opponentCharKey === 'voltamander' || playerCharKey === 'voltamander') {
      const isPlayer = playerCharKey === 'voltamander';
      const didAct = isPlayer ? (pMove && pPush > 0) : (oMove && oPush > 0);
      if (didAct) {
        const move = isPlayer ? pMove : oMove;
        const chargeGain = move?.effect === 'doubleCharge' ? 2 : 1;
        const newCharge = Math.min(10, voltCharge + chargeGain);

        if (newCharge >= 10) {
          // AoE discharge: 4 to all opponent resources
          if (isPlayer) {
            newORes.guard = Math.max(0, newORes.guard - 4);
            newORes.composure = Math.max(0, newORes.composure - 4);
            newORes.body = Math.max(0, newORes.body - 4);
            log.push('BIOELECTRIC DISCHARGE! 4 damage to ALL opponent resources! Charge reset.');
          } else {
            newPRes.guard = Math.max(0, newPRes.guard - 4);
            newPRes.composure = Math.max(0, newPRes.composure - 4);
            newPRes.body = Math.max(0, newPRes.body - 4);
            log.push('BIOELECTRIC DISCHARGE! 4 damage to ALL your resources!');
          }
          setVoltCharge(0);
        } else {
          setVoltCharge(newCharge);
          if (newCharge === 4) log.push('Bioelectric Charge: CHARGED (4+) — +15% Attack');
          else if (newCharge === 7) log.push('Bioelectric Charge: OVERCHARGED (7+) — +30% Attack, -1 cost');
          else log.push(`Bioelectric Charge: ${newCharge}/10`);
        }
      }
    }

    // ── Mycelith — Sporulation ──
    if (opponentCharKey === 'mycelith') {
      // Spawn 1 construct end of turn (max 3)
      const currentConstructs = [...sporeConstructs].filter(c => c.hp > 0);
      if (currentConstructs.length < 3) {
        const newId = `spore_${turn}`;
        currentConstructs.push({ id: newId, hp: 4, maxHp: 4 });
        log.push(`Sporulation: Spore Construct spawned (${currentConstructs.length}/3)`);
      }
      // Each living construct deals 1 Body chip to player
      let sporeChip = 0;
      currentConstructs.forEach(c => { if (c.hp > 0) sporeChip++; });
      if (sporeChip > 0) {
        newPRes.body = Math.max(0, newPRes.body - sporeChip);
        log.push(`Spore Constructs: ${sporeChip} Body damage (${currentConstructs.filter(c => c.hp > 0).length} active)`);
      }
      // AREA attacks hit all constructs
      if (pMove && pWon && pMove.channel === 'AREA') {
        const areaDmg = Math.floor((pMove.baseDamage || 3) * 0.5);
        currentConstructs.forEach(c => {
          if (c.hp > 0) {
            c.hp = Math.max(0, c.hp - areaDmg);
            if (c.hp <= 0) log.push(`Spore Construct destroyed by AREA attack!`);
          }
        });
      }
      setSporeConstructs(currentConstructs.filter(c => c.hp > 0));
    }
    if (playerCharKey === 'mycelith') {
      // Player Mycelith spawns constructs that chip opponent
      // (simplified: same logic but damages opponent)
      const currentConstructs = [...sporeConstructs].filter(c => c.hp > 0);
      if (currentConstructs.length < 3) {
        currentConstructs.push({ id: `spore_${turn}`, hp: 4, maxHp: 4 });
        log.push(`Sporulation: Spore Construct spawned (${currentConstructs.length}/3)`);
      }
      let sporeChip = 0;
      currentConstructs.forEach(c => { if (c.hp > 0) sporeChip++; });
      if (sporeChip > 0) {
        newORes.body = Math.max(0, newORes.body - sporeChip);
        log.push(`Spore Constructs: ${sporeChip} Body to opponent`);
      }
      if (oMove && oWon && oMove.channel === 'AREA') {
        const areaDmg = Math.floor((oMove.baseDamage || 3) * 0.5);
        currentConstructs.forEach(c => {
          if (c.hp > 0) {
            c.hp = Math.max(0, c.hp - areaDmg);
            if (c.hp <= 0) log.push(`Your Spore Construct destroyed!`);
          }
        });
      }
      setSporeConstructs(currentConstructs.filter(c => c.hp > 0));
    }

    // ── Glass Viper — Stealth Strike ──
    if (opponentCharKey === 'glassViper') {
      // After attacking, become visible for 2 turns
      if (oMove && oPush > 0 && viperStealth) {
        setViperStealth(false);
        setViperVisibleTurns(2);
        log.push('Glass Viper revealed! Visible for 2 turns.');
      }
      // Re-stealth via Fade move
      if (oMove?.effect === 'restealth') {
        setViperStealth(true);
        setViperVisibleTurns(0);
        log.push('Glass Viper fades into stealth!');
      }
      // Visibility timer tick
      if (viperVisibleTurns > 0) {
        const newVisible = viperVisibleTurns - 1;
        setViperVisibleTurns(newVisible);
        if (newVisible <= 0) {
          setViperStealth(true);
          log.push('Glass Viper re-enters stealth.');
        }
      }
    }

    // ── Bone Hydra — Regrowth (3 heads) ──
    if (opponentCharKey === 'boneHydra' && hydraHeads.length > 0) {
      const newHeads = hydraHeads.map(h => ({ ...h }));
      // Regen timer: dead heads regenerate after 3 turns
      newHeads.forEach((head, i) => {
        if (!head.alive) {
          head.regenTimer--;
          if (head.regenTimer <= 0) {
            head.hp = head.maxHp;
            head.alive = true;
            head.regenTimer = 0;
            log.push(`Bone Hydra: Head ${i + 1} regenerated at full HP!`);
          }
        }
      });
      // Player can target heads — damage dealt to Bone Hydra goes to targeted head
      if (pMove && pPush > 0 && pWon && selectedTarget?.startsWith?.('hydra_head_')) {
        const headIdx = parseInt(selectedTarget.split('_').pop());
        if (newHeads[headIdx] && newHeads[headIdx].alive) {
          const headDmg = Math.min(newHeads[headIdx].hp, pMove.baseDamage || 3);
          newHeads[headIdx].hp -= headDmg;
          log.push(`Hit Hydra Head ${headIdx + 1}: -${headDmg} HP (${newHeads[headIdx].hp}/${newHeads[headIdx].maxHp})`);
          if (newHeads[headIdx].hp <= 0) {
            newHeads[headIdx].alive = false;
            newHeads[headIdx].regenTimer = 3;
            log.push(`HEAD ${headIdx + 1} DESTROYED! Move disabled. Regrows in 3 turns.`);
          }
        }
      }
      setHydraHeads(newHeads);
    }

    // Hydravine Regrowth: regen 2 on most damaged resource/mutation
    if (opponentCharKey === 'hydravine') {
      // First check mutations
      const damagedMuts = Object.entries(newOppMutHP).filter(([, v]) => v.currentHP > 0 && v.currentHP < v.maxHP);
      if (damagedMuts.length > 0) {
        const [, most] = damagedMuts.sort((a, b) => (a[1].maxHP - a[1].currentHP) - (b[1].maxHP - b[1].currentHP)).pop();
        most.currentHP = Math.min(most.maxHP, most.currentHP + 2);
        log.push(`Regrowth: +2 HP to ${most.mutation.name}`);
      } else {
        const damages = { guard: MAX_GUARD - newORes.guard, composure: MAX_COMPOSURE - newORes.composure, body: MAX_BODY - newORes.body };
        const maxDmgKey = Object.entries(damages).sort((a, b) => b[1] - a[1])[0];
        if (maxDmgKey[1] > 0) {
          const maxes = { guard: MAX_GUARD, composure: MAX_COMPOSURE, body: MAX_BODY };
          newORes[maxDmgKey[0]] = Math.min(maxes[maxDmgKey[0]], newORes[maxDmgKey[0]] + 2);
          log.push(`Regrowth: +2 ${maxDmgKey[0]}`);
        }
      }

      // Vine Grasp timer: fires every 3 turns, entangles player
      const newTimer = vineGraspTimer - 1;
      if (newTimer <= 0) {
        setPlayerEntangled({ turnsRemaining: 2 });
        setVineGraspTimer(3);
        log.push('VINE GRASP! Entangled for 2 turns (+1 cost, no evasion)');
      } else {
        setVineGraspTimer(newTimer);
      }
    }

    // Entangle tick-down
    if (playerEntangled && playerEntangled.turnsRemaining > 0) {
      setPlayerEntangled(prev => prev ? { turnsRemaining: prev.turnsRemaining - 1 } : null);
    }
    if (oppEntangled && oppEntangled.turnsRemaining > 0) {
      setOppEntangled(prev => prev ? { turnsRemaining: prev.turnsRemaining - 1 } : null);
    }

    // DoT ticks (Venom, etc.)
    if (oppDots.length > 0) {
      let totalDot = 0;
      const remaining = [];
      oppDots.forEach(dot => {
        newORes.body = Math.max(0, newORes.body - dot.damage);
        totalDot += dot.damage;
        if (dot.turnsLeft > 1) remaining.push({ ...dot, turnsLeft: dot.turnsLeft - 1 });
      });
      if (totalDot > 0) log.push(`Venom: ${totalDot} Body (DoT)`);
      setOppDots(remaining);
    }
    if (playerDots.length > 0) {
      let totalDot = 0;
      const remaining = [];
      playerDots.forEach(dot => {
        newPRes.body = Math.max(0, newPRes.body - dot.damage);
        totalDot += dot.damage;
        if (dot.turnsLeft > 1) remaining.push({ ...dot, turnsLeft: dot.turnsLeft - 1 });
      });
      if (totalDot > 0) log.push(`Venom: ${totalDot} Body to you (DoT)`);
      setPlayerDots(remaining);
    }

    // Venom Jab DoT application
    if (pMove?.effect === 'venomDot' && pWon) {
      setOppDots(prev => [...prev, { damage: pMove.dotDamage || 1, turnsLeft: pMove.dotDuration || 3 }]);
      log.push(`Venom applied: ${pMove.dotDamage || 1}/turn for ${pMove.dotDuration || 3} turns`);
    }
    if (oMove?.effect === 'venomDot' && oWon) {
      setPlayerDots(prev => [...prev, { damage: oMove.dotDamage || 1, turnsLeft: oMove.dotDuration || 3 }]);
      log.push('Venom applied to you!');
    }

    // Echomorph adaptive resistance tracking
    if (opponentCharKey === 'echomorph' && pMove) {
      setEchoResistance(prev => {
        const next = { ...prev };
        next[pMove.moveType] = (next[pMove.moveType] || 0) + 1;
        return next;
      });
    }

    // Chromatophore Skin: activate camo when Echomorph drops below 50% Body
    if (opponentCharKey === 'echomorph' && !echoCamoUsed && newORes.body < MAX_BODY * 0.5) {
      setEchoCamoTurns(2);
      setEchoCamoUsed(true);
      log.push('Chromatophore Skin: Echomorph is camouflaged! (30% miss chance, 2 turns)');
    }

    // Decrement Echomorph camo turns
    if (echoCamoTurns > 0) {
      setEchoCamoTurns(prev => Math.max(0, prev - 1));
    }

    // Ghost Move from Spore Cloud
    if (oMove?.effect === 'ghostMove' && oWon) {
      const fakeNames = ['Vine Counter', 'Root Shield', 'Thorn Wall', 'Spore Burst', 'Bloom Strike'];
      setGhostMove({
        id: 'ghost_move',
        name: fakeNames[Math.floor(Math.random() * fakeNames.length)],
        minCost: 2,
        baseDamage: 0,
        target: 'utility',
        moveType: 'defense',
        flavor: 'Something feels wrong about this move...',
        isFinisher: false,
        _isGhost: true,
      });
      log.push('Spore Cloud: a strange new move appears on your menu...');
    }

    // Track last player move for Echomorph + pattern reading
    if (pMove) {
      setLastPlayerMove(pMove);
      setPlayerMoveHistory(prev => [...prev, pMove]);
    }

    // === MUTATION DESTRUCTION + SCAR CREATION ===
    if (mutationsDestroyedThisTurn.length > 0) {
      mutationsDestroyedThisTurn.forEach(mut => {
        // Create scar
        const scar = createScar(mut.move || mut);
        if (onScar) onScar(scar);
        log.push(`SCAR FORMED: ${scar.description}`);

        // Parasitex graft steal — opponent gains the stolen move at 75% damage
        if (opponentCharKey === 'parasitex' && mut.move) {
          const stolenMove = {
            ...mut.move,
            id: `stolen_${mut.move.id}`,
            name: `${mut.move.name} (stolen)`,
            baseDamage: Math.ceil(mut.move.baseDamage * 0.75),
            _stolen: true,
          };
          setOppStolenMoves(prev => [...prev, stolenMove]);
          log.push(`GRAFT STEAL: ${oppChar.name} absorbed ${mut.move.name}!`);
        }
      });

      // Update destroyed mutations list
      setDestroyedMutations(prev => [...prev, ...mutationsDestroyedThisTurn.map(m => m.id)]);

      // Show destroy message
      const names = mutationsDestroyedThisTurn.map(m => m.name || m.id).join(', ');
      setMutationDestroyMsg(names);
      setTimeout(() => setMutationDestroyMsg(null), 3000);
    }

    // Handle opponent mutation destruction (from player targeting)
    if (oppMutationsDestroyedThisTurn.length > 0) {
      oppMutationsDestroyedThisTurn.forEach(mut => {
        const scar = createScar(mut.move || mut);
        // Opponent gets a scar (minor — just log it)
        log.push(`Opponent scar: ${scar.description}`);
      });
      setOppDestroyedMutations(prev => [...prev, ...oppMutationsDestroyedThisTurn.map(m => m.id)]);
      const names = oppMutationsDestroyedThisTurn.map(m => m.name || m.id).join(', ');
      setMutationDestroyMsg(names);
      setTimeout(() => setMutationDestroyMsg(null), 3000);
    }

    // Update mutation HP state
    setMutationHP(newMutHP);
    setOppMutationHP(newOppMutHP);

    // Compute resource changes for display
    setPResChanges({
      guard: newPRes.guard - pResRef.current.guard,
      composure: newPRes.composure - pResRef.current.composure,
      body: newPRes.body - pResRef.current.body,
      stamina: newPRes.stamina - pResRef.current.stamina,
    });
    setOResChanges({
      guard: newORes.guard - oResRef.current.guard,
      composure: newORes.composure - oResRef.current.composure,
      body: newORes.body - oResRef.current.body,
      stamina: newORes.stamina - oResRef.current.stamina,
    });

    // Update state
    setPRes(newPRes);
    setORes(newORes);
    setMomentumChain(newMomentum);
    setTotalCompDamage(newTotalCompDmg);
    setCostModifier(newCostMod);
    setAiCostModifier(newAiCostMod);
    setTurnLog(log);
    setPhase(PHASE.RESOLUTION);

    // Check win conditions immediately (KO/Decision auto-trigger, next turn waits for click)
    if (newORes.body <= 0) {
      setOpponentAnimState('ko');
      const isFinisher = pMove?.isFinisher && (winner === 'a' || winner === 'both');
      playSound(isFinisher ? 'finisherLand' : 'ko');
      setFightResult({
        won: true,
        reason: isFinisher ? `FINISHED — ${pMove.name}` : 'KO',
        turns: turn,
      });
      setTimeout(() => setPhase(PHASE.FIGHT_OVER), 1000);
      return;
    }
    if (newPRes.body <= 0) {
      setPlayerAnimState('ko');
      const isFinisher = oMove?.isFinisher && (winner === 'b' || winner === 'both');
      playSound(isFinisher ? 'finisherLand' : 'ko');
      setFightResult({
        won: false,
        reason: isFinisher ? `FINISHED — ${oMove.name}` : 'KO',
        turns: turn,
      });
      setTimeout(() => setPhase(PHASE.FIGHT_OVER), 1000);
      return;
    }
    if (turn >= MAX_TURNS) {
      const pTotal = newPRes.guard + newPRes.composure + newPRes.body;
      const oTotal = newORes.guard + newORes.composure + newORes.body;
      setFightResult({
        won: pTotal >= oTotal,
        reason: `Decision (${pTotal} vs ${oTotal})`,
        turns: turn,
      });
      setTimeout(() => setPhase(PHASE.FIGHT_OVER), 1000);
      return;
    }

    // Normal turn end: wait for player click
    setWaitingForClick(true);
  }

  // Click to proceed from RESOLUTION → next turn
  function handleResolutionContinue() {
    setWaitingForClick(false);
    setPResChanges({});
    setOResChanges({});
    setPrevTurnLog([...turnLog]);
    endTurn();
  }

  // Filter moves for tutorial and remove destroyed mutations
  let aliveMoves = playerMoves.filter(m => !destroyedMutations.includes(m.id));
  // Entangled: disable evasion moves
  if (playerEntangled && playerEntangled.turnsRemaining > 0) {
    aliveMoves = aliveMoves.filter(m => m.moveType !== 'evasion');
  }
  // Null Worm — Null Field: strip tech-enhanced moves, revert to base moves
  if (opponentCharKey === 'nullWorm') {
    aliveMoves = aliveMoves.filter(m => !m.fromTech);
  }
  // Vice Grip — clamped mutations can't use their moves
  if (Object.keys(clampedMutations).length > 0) {
    aliveMoves = aliveMoves.filter(m => !m.fromMutation || !clampedMutations[m.fromMutation]);
  }
  // Bone Hydra — disable moves from destroyed heads
  if (opponentCharKey === 'boneHydra' && hydraHeads.length > 0) {
    // Bone Hydra's dead heads disable its own moves (handled in AI move selection)
  }
  // Add ghost move from Spore Cloud (disappears after 1 turn)
  if (ghostMove) aliveMoves = [...aliveMoves, ghostMove];
  const visibleMoves = isTutorial ? filterMovesForTutorial(aliveMoves, tutorialPhase) : aliveMoves;

  // Check if player has any affordable moves
  const hasAffordableMove = visibleMoves.some(m => {
    const eff = getEffectiveCost(m, pBroken, costModifier);
    return eff <= pRes.stamina && canUseFinisher(m, oRes);
  });

  function handlePass() {
    // AI still acts
    const aiDecision = getAIDecision(
      opponentCharKey,
      getAIMoves(),
      oRes, pRes, getAIFightState()
    );

    if (aiDecision) {
      setAiMove(aiDecision.move);
      setAiStaminaPush(aiDecision.staminaPush);
      setMatchupResult({ winner: 'b', reason: 'You passed — opponent acts unopposed' });
      setPhase(PHASE.PUSH_REVEAL);
      // Auto-resolve after brief display
      setTimeout(() => resolveTurn(null, aiDecision.move, 'b', 0, aiDecision.staminaPush), 800);
    } else {
      // Both exhausted — just regen
      setPRes(prev => ({ ...prev, stamina: clamp(prev.stamina + (prev.stamina < 3 ? 1 : STAMINA_REGEN), 0, STAMINA_CAP) }));
      setORes(prev => ({ ...prev, stamina: clamp(prev.stamina + (prev.stamina < 3 ? 1 : STAMINA_REGEN), 0, STAMINA_CAP) }));
      setTurnLog(['Both fighters rest. Stamina regenerates.']);
      setPhase(PHASE.RESOLUTION);
      if (turn >= MAX_TURNS) {
        const p = pResRef.current;
        const o = oResRef.current;
        const pTotal = p.guard + p.composure + p.body;
        const oTotal = o.guard + o.composure + o.body;
        setFightResult({ won: pTotal >= oTotal, reason: `Decision (${pTotal} vs ${oTotal})`, turns: turn });
        setTimeout(() => setPhase(PHASE.FIGHT_OVER), 1000);
      } else {
        setWaitingForClick(true);
      }
    }
  }

  function endTurn() {
    setTurn(t => t + 1);
    setSelectedMove(null);
    setSelectedItem(null);
    setSelectedTarget('body');
    setAiMove(null);
    setMatchupResult(null);
    setStaminaPush(0);
    setAiStaminaPush(0);
    setAiTargetMutation(null);
    setTurnLog([]);
    setPlayerAnimState('idle');
    setOpponentAnimState('idle');
    setGhostMove(null);
    setWaitingForClick(false);
    // Decrement scanner reveal
    if (revealTurns > 0) setRevealTurns(prev => prev - 1);
    setPhase(PHASE.MOVE_SELECT);
  }

  // Resource bar component with change indicator
  function ResourceBar({ label, value, max, color, change }) {
    const pct = Math.max(0, (value / max) * 100);
    const hasChange = change !== undefined && change !== 0;
    const changeColor = change > 0 ? '#44ff66' : '#ff4444';
    const changeText = change > 0 ? `+${change}` : `${change}`;
    return (
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2, color: '#8899aa' }}>
          <span style={{ fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10 }}>{label}</span>
          <span style={{ fontFamily: 'var(--font-mono)', color, fontWeight: 700 }}>
            {value}/{max}
            {hasChange && (
              <span style={{ color: changeColor, fontSize: 10, marginLeft: 4, fontWeight: 800 }}>{changeText}</span>
            )}
          </span>
        </div>
        <div style={{ height: 10, background: '#1a2030', borderRadius: 4, overflow: 'hidden', border: '1px solid #2a3040' }}>
          <div style={{
            height: '100%', width: `${pct}%`, background: color, borderRadius: 3,
            transition: 'width 0.4s ease',
            boxShadow: value <= max * 0.25 ? `0 0 8px ${color}88` : 'none',
          }} />
        </div>
      </div>
    );
  }

  // Broken indicator
  function BrokenTag({ label }) {
    return (
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--lose)', textTransform: 'uppercase', letterSpacing: 1, animation: 'pulse 1.5s infinite', marginTop: 2 }}>
        {label}
      </div>
    );
  }

  const phaseLabel = {
    [PHASE.MOVE_SELECT]: 'Select Your Move',
    [PHASE.TARGET_SELECT]: 'Select Target',
    [PHASE.COMMITTED]: 'Both Committed...',
    [PHASE.REVEAL]: 'Revealing!',
    [PHASE.STAMINA_PUSH]: 'Commit Stamina',
    [PHASE.PUSH_REVEAL]: 'Stamina Reveal!',
    [PHASE.RESOLUTION]: 'Resolution',
    [PHASE.FIGHT_OVER]: fightResult?.reason || 'Fight Over',
  };

  // Shared overlay style for glass panels — angled aesthetic
  const glassPanel = {
    background: 'linear-gradient(160deg, rgba(5,10,25,0.85) 0%, rgba(3,6,15,0.9) 100%)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(0,204,255,0.1)',
    borderTop: '1px solid rgba(0,204,255,0.2)',
  };

  return (
    <div
      ref={containerRef}
      className={shaking ? 'anim-big-shake' : ''}
      style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden', background: '#050a14' }}
    >
      {/* ═══ FULL-SCREEN ARENA (layer 0) ═══ */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <FightArena
          playerSpecies={playerCharKey}
          opponentSpecies={opponentCharKey}
          playerAnimState={playerAnimState}
          opponentAnimState={opponentAnimState}
          playerColor={playerChar.color}
          opponentColor={oppChar.color}
        />
      </div>

      {/* ═══ HUD OVERLAYS (layer 1) ═══ */}

      {/* Top bar — names + turn counter + intent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'stretch',
        padding: 0, ...glassPanel, borderTop: 'none', borderLeft: 'none', borderRight: 'none', zIndex: 10,
      }}>
        {/* Player name plate */}
        <div style={{ padding: '10px 20px', borderRight: '1px solid rgba(255,255,255,0.05)', minWidth: 160 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: playerChar.color, fontFamily: 'var(--font-display)', letterSpacing: 1 }}>{playerChar.name}</div>
          <div style={{ fontSize: 9, fontWeight: 600, color: playerChar.color, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 }}>
            {playerChar.killHint}
          </div>
        </div>

        {/* Center — turn counter + phase */}
        <div style={{ padding: '8px 24px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#556677', fontFamily: 'var(--font-mono)', letterSpacing: 2 }}>
            TURN {turn} / {MAX_TURNS}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#aabbcc', textTransform: 'uppercase', letterSpacing: 3, marginTop: 2 }}>
            {phaseLabel[phase]}
          </div>
        </div>

        {/* Opponent name plate + intent */}
        <div style={{ padding: '10px 20px', borderLeft: '1px solid rgba(255,255,255,0.05)', minWidth: 160, textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: oppChar.color, fontFamily: 'var(--font-display)', letterSpacing: 1 }}>
            {oppChar.name}
          </div>
          {/* Intent display — prominent, StS-style */}
          {oppIntent && phase === PHASE.MOVE_SELECT && (() => {
            const intentConfig = {
              finishing: { label: 'FINISHING MOVE', color: '#ff4444', icon: '💀' },
              defending: { label: 'DEFENDING', color: '#4488cc', icon: '🛡' },
              targeting: { label: 'TARGETING GRAFT', color: '#ccaa22', icon: '🎯' },
              setup: { label: 'BUILDING UP', color: '#66cc44', icon: '⚡' },
              attacking: { label: 'ATTACKING', color: '#ee6644', icon: '⚔' },
            };
            const cfg = intentConfig[oppIntent] || intentConfig.attacking;
            return (
              <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 12 }}>{cfg.icon}</span>
                <span style={{ letterSpacing: 1 }}>{cfg.label}</span>
              </div>
            );
          })()}
          {revealTurns > 0 && aiMove && phase === PHASE.COMMITTED && (
            <div style={{ fontSize: 10, fontWeight: 700, color: '#44aaff', marginTop: 3 }}>
              📡 SCANNED: {aiMove.name}
            </div>
          )}
          {!oppIntent && phase === PHASE.MOVE_SELECT && (
            <div style={{ fontSize: 9, color: '#334455', marginTop: 3, letterSpacing: 1 }}>INTENT UNKNOWN</div>
          )}
        </div>
      </div>

      {/* Tutorial hint banner */}
      {isTutorial && tutorialHint && (
        <div style={{
          position: 'absolute', top: 52, left: '50%', transform: 'translateX(-50%)',
          padding: '6px 20px', ...glassPanel, background: 'rgba(234,179,8,0.15)',
          border: '1px solid var(--stamina)', fontSize: 12, fontWeight: 600, color: 'var(--stamina)',
          zIndex: 10, whiteSpace: 'nowrap',
        }}>
          {tutorialHint}
        </div>
      )}

      {/* Player resources — left side overlay */}
      <div style={{
        position: 'absolute', top: 56, left: 8, width: 148, padding: '10px 10px 8px',
        background: 'rgba(5,10,25,0.85)', backdropFilter: 'blur(6px)',
        borderLeft: `2px solid ${playerChar.color}88`, borderRight: '1px solid rgba(0,204,255,0.08)',
        borderTop: '1px solid rgba(0,204,255,0.08)', borderBottom: '1px solid rgba(0,204,255,0.08)',
        borderRadius: '0 4px 4px 0', zIndex: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: playerChar.color, textTransform: 'uppercase', letterSpacing: 1 }}>YOU</div>
        {(tutorialPhase !== TUTORIAL_PHASES.BODY_ONLY) && (
          <ResourceBar label="Guard" value={pRes.guard} max={MAX_GUARD} color="var(--guard)" change={pResChanges.guard} />
        )}
        {(tutorialPhase === TUTORIAL_PHASES.FULL_SYSTEM) && (
          <ResourceBar label="Composure" value={pRes.composure} max={MAX_COMPOSURE} color="var(--composure)" change={pResChanges.composure} />
        )}
        <ResourceBar label="Body" value={pRes.body} max={MAX_BODY} color="var(--body-hp)" change={pResChanges.body} />
        <ResourceBar label="Stamina" value={pRes.stamina} max={MAX_STAMINA} color="var(--stamina)" change={pResChanges.stamina} />
        {pBroken.guard && tutorialPhase !== TUTORIAL_PHASES.BODY_ONLY && <BrokenTag label="Guard Broken" />}
        {pBroken.composure && tutorialPhase === TUTORIAL_PHASES.FULL_SYSTEM && <BrokenTag label="Composure Broken" />}
        {pBroken.stamina && <BrokenTag label="Exhausted" />}
        {playerCharKey === 'cyberGorilla' && momentumChain > 0 && (
          <div style={{ fontSize: 10, color: 'var(--stamina)', marginTop: 4, fontWeight: 600 }}>
            Momentum: {momentumChain}
          </div>
        )}
        {Object.keys(mutationHP).length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Grafts</div>
            {Object.entries(mutationHP).map(([id, m]) => (
              <div key={id} style={{ marginBottom: 3, opacity: m.currentHP <= 0 ? 0.3 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: m.currentHP <= 0 ? 'var(--lose)' : 'var(--text-muted)' }}>
                  <span>{m.mutation.name}{m.currentHP <= 0 ? ' (X)' : ''}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{Math.max(0, m.currentHP)}/{m.maxHP}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(Math.max(0, m.currentHP) / m.maxHP) * 100}%`, background: m.currentHP <= 0 ? 'var(--lose)' : 'var(--composure)', borderRadius: 2, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {scars.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Scars</div>
            {scars.map(scar => (
              <div key={scar.id} title={scar.description} style={{ fontSize: 9, color: 'var(--composure)', marginBottom: 2, cursor: 'help' }}>
                {scar.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active buffs/debuffs display */}
      {(damageShield > 0 || guaranteeWin || flashBlind || scrambleActive > 0 || revealTurns > 0 || adrenalineActive || playerEntangled || playerDots.length > 0 || echoCamoTurns > 0 || Object.keys(clampedMutations).length > 0 || voltCharge > 0 || sporeConstructs.length > 0 || viperStealth || hydraHeads.some(h => !h.alive)) && (
        <div style={{ position: 'absolute', bottom: 230, left: 8, maxWidth: 140, padding: 8, ...glassPanel, zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {damageShield > 0 && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(0, 200, 255, 0.2)', borderLeft: '3px solid #00c8ff', color: '#00c8ff', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(0, 200, 255, 0.4)' }}>
                🛡 SHIELD ×{damageShield}
              </div>
            )}
            {guaranteeWin && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(255, 200, 0, 0.2)', borderLeft: '3px solid #ffc800', color: '#ffc800', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(255, 200, 0, 0.4)' }}>
                🎯 FOCUS
              </div>
            )}
            {flashBlind && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderLeft: '3px solid #fff', color: '#ddd', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(255, 255, 255, 0.3)' }}>
                💥 FLASH
              </div>
            )}
            {scrambleActive > 0 && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(200, 0, 255, 0.2)', borderLeft: '3px solid #c800ff', color: '#d080ff', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(200, 0, 255, 0.4)' }}>
                🌀 SCRAMBLE ×{scrambleActive}
              </div>
            )}
            {revealTurns > 0 && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(0, 120, 255, 0.2)', borderLeft: '3px solid #0078ff', color: '#0078ff', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(0, 120, 255, 0.4)' }}>
                📡 SCAN ×{revealTurns}
              </div>
            )}
            {adrenalineActive && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(255, 255, 0, 0.2)', borderLeft: '3px solid #ffff00', color: '#ffff00', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(255, 255, 0, 0.4)' }}>
                ⚡ ADRENALINE
              </div>
            )}
            {echoCamoTurns > 0 && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(100, 200, 100, 0.2)', borderLeft: '3px solid #64c864', color: '#64c864', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(100, 200, 100, 0.4)' }}>
                👻 CAMO ×{echoCamoTurns}
              </div>
            )}
            {playerEntangled && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(100, 200, 100, 0.2)', borderLeft: '3px solid #64c864', color: '#64c864', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(100, 200, 100, 0.4)' }}>
                🌿 ENTANGLED ×{playerEntangled.turnsRemaining}
              </div>
            )}
            {playerDots.length > 0 && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(255, 0, 0, 0.2)', borderLeft: '3px solid #ff0000', color: '#ff4444', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(255, 0, 0, 0.4)' }}>
                ☠ VENOM ×{playerDots.reduce((sum, dot) => sum + dot.damage, 0)}
              </div>
            )}
            {Object.keys(clampedMutations).length > 0 && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(255, 100, 0, 0.2)', borderLeft: '3px solid #ff6400', color: '#ff8844', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(255, 100, 0, 0.4)' }}>
                CLAMPED ×{Object.keys(clampedMutations).length}
              </div>
            )}
            {voltCharge > 0 && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: voltCharge >= 7 ? 'rgba(0, 229, 255, 0.3)' : voltCharge >= 4 ? 'rgba(0, 229, 255, 0.2)' : 'rgba(0, 229, 255, 0.1)', borderLeft: `3px solid ${voltCharge >= 7 ? '#00e5ff' : voltCharge >= 4 ? '#00bbdd' : '#006688'}`, color: voltCharge >= 7 ? '#00e5ff' : voltCharge >= 4 ? '#00bbdd' : '#006688', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: `0 0 8px rgba(0, 229, 255, ${voltCharge >= 7 ? 0.6 : 0.3})` }}>
                CHARGE {voltCharge}/10{voltCharge >= 7 ? ' OVER' : voltCharge >= 4 ? ' CHG' : ''}
              </div>
            )}
            {sporeConstructs.length > 0 && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(102, 255, 102, 0.2)', borderLeft: '3px solid #66ff66', color: '#66ff66', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(102, 255, 102, 0.4)' }}>
                SPORES ×{sporeConstructs.length} ({sporeConstructs.reduce((s, c) => s + c.hp, 0)}HP)
              </div>
            )}
            {viperStealth && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(0, 255, 68, 0.15)', borderLeft: '3px solid #00ff44', color: '#00ff44', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(0, 255, 68, 0.4)' }}>
                STEALTH (+50% DMG)
              </div>
            )}
            {hydraHeads.some(h => !h.alive) && (
              <div style={{ fontSize: 8, fontWeight: 700, padding: '4px 6px', backgroundColor: 'rgba(136, 26, 26, 0.2)', borderLeft: '3px solid #881a1a', color: '#cc4444', textTransform: 'uppercase', letterSpacing: 0.5, textShadow: '0 0 8px rgba(136, 26, 26, 0.4)' }}>
                HEADS {hydraHeads.filter(h => h.alive).length}/3
              </div>
            )}
          </div>
        </div>
      )}

      {/* Opponent resources — right side overlay */}
      <div style={{
        position: 'absolute', top: 56, right: 8, width: 148, padding: '10px 10px 8px',
        background: 'rgba(5,10,25,0.85)', backdropFilter: 'blur(6px)',
        borderRight: `2px solid ${oppChar.color}88`, borderLeft: '1px solid rgba(0,204,255,0.08)',
        borderTop: '1px solid rgba(0,204,255,0.08)', borderBottom: '1px solid rgba(0,204,255,0.08)',
        borderRadius: '4px 0 0 4px', zIndex: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: oppChar.color, textTransform: 'uppercase', letterSpacing: 1 }}>OPPONENT</div>
        {(tutorialPhase !== TUTORIAL_PHASES.BODY_ONLY) && (
          <ResourceBar label="Guard" value={oRes.guard} max={MAX_GUARD} color="var(--guard)" change={oResChanges.guard} />
        )}
        {(tutorialPhase === TUTORIAL_PHASES.FULL_SYSTEM) && (
          <ResourceBar label="Composure" value={oRes.composure} max={MAX_COMPOSURE} color="var(--composure)" change={oResChanges.composure} />
        )}
        <ResourceBar label="Body" value={oRes.body} max={MAX_BODY} color="var(--body-hp)" change={oResChanges.body} />
        <ResourceBar label="Stamina" value={oRes.stamina} max={MAX_STAMINA} color="var(--stamina)" change={oResChanges.stamina} />
        {oBroken.guard && tutorialPhase !== TUTORIAL_PHASES.BODY_ONLY && <BrokenTag label="Guard Broken" />}
        {oBroken.composure && tutorialPhase === TUTORIAL_PHASES.FULL_SYSTEM && <BrokenTag label="Composure Broken" />}
        {oBroken.stamina && <BrokenTag label="Exhausted" />}
        {Object.keys(oppMutationHP).length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Grafts</div>
            {Object.entries(oppMutationHP).map(([id, m]) => (
              <div key={id} style={{ marginBottom: 3, opacity: m.currentHP <= 0 ? 0.3 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: m.currentHP <= 0 ? 'var(--lose)' : 'var(--text-muted)' }}>
                  <span>{m.mutation.name}{m.currentHP <= 0 ? ' (X)' : ''}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{m.revealed ? `${Math.max(0, m.currentHP)}/${m.maxHP}` : '???'}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: m.revealed ? `${(Math.max(0, m.currentHP) / m.maxHP) * 100}%` : '100%', background: m.currentHP <= 0 ? 'var(--lose)' : m.revealed ? oppChar.color : 'var(--text-muted)', borderRadius: 2, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opponent passive status — below opponent resources */}
      {(viperStealth || voltCharge > 0 || sporeConstructs.length > 0 || hydraHeads.length > 0 || oppDots.length > 0) && (
        <div style={{ position: 'absolute', top: 220, right: 8, maxWidth: 140, padding: 6, background: 'rgba(5,10,25,0.75)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {opponentCharKey === 'glassViper' && viperStealth && (
              <div style={{ fontSize: 7, fontWeight: 700, padding: '3px 5px', backgroundColor: 'rgba(0, 255, 68, 0.15)', borderLeft: '2px solid #00ff44', color: '#00ff44', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                STEALTH
              </div>
            )}
            {opponentCharKey === 'voltamander' && voltCharge > 0 && (
              <div style={{ fontSize: 7, fontWeight: 700, padding: '3px 5px', backgroundColor: 'rgba(0, 229, 255, 0.15)', borderLeft: `2px solid ${voltCharge >= 7 ? '#00e5ff' : '#006688'}`, color: voltCharge >= 7 ? '#00e5ff' : '#00bbdd', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                CHARGE {voltCharge}/10
              </div>
            )}
            {opponentCharKey === 'mycelith' && sporeConstructs.length > 0 && (
              <div style={{ fontSize: 7, fontWeight: 700, padding: '3px 5px', backgroundColor: 'rgba(102, 255, 102, 0.15)', borderLeft: '2px solid #66ff66', color: '#66ff66', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                SPORES ×{sporeConstructs.length}
              </div>
            )}
            {opponentCharKey === 'boneHydra' && hydraHeads.length > 0 && (
              <div style={{ fontSize: 7, fontWeight: 700, padding: '3px 5px', backgroundColor: 'rgba(136, 26, 26, 0.15)', borderLeft: '2px solid #881a1a', color: '#cc4444', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                HEADS: {hydraHeads.map((h, i) => h.alive ? `[${h.hp}]` : '[X]').join(' ')}
              </div>
            )}
            {oppDots.length > 0 && (
              <div style={{ fontSize: 7, fontWeight: 700, padding: '3px 5px', backgroundColor: 'rgba(255, 0, 0, 0.15)', borderLeft: '2px solid #ff0000', color: '#ff4444', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                VENOM ×{oppDots.reduce((s, d) => s + d.damage, 0)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CENTER OVERLAY — reveal area, stamina push, fight result ═══ */}
      <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>

        {/* Mutation destroyed flash */}
        {mutationDestroyMsg && (
          <div style={{ textAlign: 'center', animation: 'pulse 0.5s ease-out' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--lose)', textTransform: 'uppercase', letterSpacing: 2 }}>
              MUTATION DESTROYED
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 4 }}>
              {mutationDestroyMsg}
            </div>
          </div>
        )}

        {/* Target select panel */}
        {phase === PHASE.TARGET_SELECT && selectedMove && (
          <div style={{ ...glassPanel, padding: 20, maxWidth: 400, width: 380 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, textAlign: 'center' }}>
              Where do you aim {selectedMove.name}?
            </div>
            <button
              onClick={() => setSelectedTarget('body')}
              style={{
                width: '100%', padding: '10px 14px', marginBottom: 6, textAlign: 'left',
                background: selectedTarget === 'body' ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: `1.5px solid ${selectedTarget === 'body' ? 'var(--guard)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 4, color: 'var(--text-primary)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>BODY — Direct resource damage</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {selectedMove.baseDamage} base x push = {selectedMove.target} damage
              </div>
            </button>
            {aliveOppMutations.map(mut => {
              const isWeak = mut.weakness && selectedMove.moveType === mut.weakness;
              const isSel = selectedTarget === mut.id;
              return (
                <button
                  key={mut.id}
                  onClick={() => setSelectedTarget(mut.id)}
                  style={{
                    width: '100%', padding: '10px 14px', marginBottom: 6, textAlign: 'left',
                    background: isSel ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: `1.5px solid ${isSel ? (isWeak ? 'var(--win)' : 'var(--composure)') : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 4, color: 'var(--text-primary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>[{mut.slot || '???'}]</span>
                    <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{mut.mutation.name}</span>
                    {isWeak && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--win)', textTransform: 'uppercase' }}>WEAK! 2x</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    HP: {mut.revealed ? `${mut.currentHP}/${mut.maxHP}` : '???'} | Weakness: {TYPE_LABELS[mut.weakness] || '???'}
                  </div>
                </button>
              );
            })}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
              <button
                onClick={() => { setPhase(PHASE.MOVE_SELECT); setSelectedTarget('body'); }}
                style={{ padding: '8px 20px', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: 'var(--text-muted)' }}
              >Back</button>
              <button
                onClick={handleCommit}
                style={{ padding: '8px 24px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', background: 'var(--guard)', color: '#fff', border: 'none', borderRadius: 4, letterSpacing: 1 }}
              >Commit</button>
            </div>
          </div>
        )}

        {/* Committed — hidden cards + click to reveal */}
        {phase === PHASE.COMMITTED && (
          <div style={{ ...glassPanel, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, clipPath: 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 100%, 0% 100%)' }}>
            <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
              <MoveCard label="YOUR MOVE" name="???" color="var(--text-muted)" />
              <MoveCard label="OPPONENT" name="???" color="var(--text-muted)" />
            </div>
            {selectedTarget && selectedTarget !== 'body' && oppMutationHP[selectedTarget] && (
              <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--composure)' }}>
                Targeting: {oppMutationHP[selectedTarget]?.mutation?.name}
              </div>
            )}
            <div style={{ fontSize: 11, color: '#4a6a7a', marginTop: 4, animation: 'pulse 1.5s infinite' }}>Revealing...</div>
          </div>
        )}

        {/* Reveal / Push / Resolution cards */}
        {(phase === PHASE.REVEAL || phase === PHASE.STAMINA_PUSH || phase === PHASE.PUSH_REVEAL || phase === PHASE.RESOLUTION) && (
          <div style={{ ...glassPanel, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, clipPath: 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 100%, 0% 100%)' }}>
            <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
              <MoveCard
                label="YOUR MOVE"
                name={selectedMove?.name || 'Item Used'}
                color={matchupResult?.winner === 'a' || matchupResult?.winner === 'both' ? 'var(--win)' : 'var(--lose)'}
              />
              <MoveCard
                label="OPPONENT"
                name={aiMove?.name || '???'}
                color={matchupResult?.winner === 'b' || matchupResult?.winner === 'both' ? 'var(--win)' : 'var(--lose)'}
              />
            </div>
            {aiTargetMutation && mutationHP[aiTargetMutation]?.currentHP > 0 && (
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lose)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Targeting: {mutationHP[aiTargetMutation]?.mutation?.name}
              </div>
            )}
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>
              {matchupResult?.reason}
            </div>

            {/* REVEAL auto-advances to stamina push */}

            {/* Stamina push values + click to resolve */}
            {phase === PHASE.PUSH_REVEAL && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ display: 'flex', gap: 40 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#8899aa' }}>Your Push</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--stamina)', fontFamily: 'var(--font-mono)' }}>{staminaPush}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#8899aa' }}>Their Push</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--stamina)', fontFamily: 'var(--font-mono)' }}>{aiStaminaPush}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#4a6a7a', animation: 'pulse 1.5s infinite' }}>Resolving...</div>
              </div>
            )}

            {/* Resolution log + click to continue */}
            {phase === PHASE.RESOLUTION && turnLog.length > 0 && (
              <div style={{ padding: 8, maxWidth: 340, width: '100%' }}>
                {turnLog.map((line, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#aabbcc', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{line}</div>
                ))}
                {waitingForClick && (
                  <button onClick={handleResolutionContinue} className="btn" style={{ marginTop: 8, width: '100%', padding: '8px 24px', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Next Turn
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stamina push controls */}
        {phase === PHASE.STAMINA_PUSH && selectedMove && (
          <div style={{ ...glassPanel, padding: 20, maxWidth: 320, width: 300, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Commit Stamina</div>
            {isTutorial && tutorialPhase === TUTORIAL_PHASES.BODY_ONLY ? (
              <>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {SIMPLE_PUSH_OPTIONS.map(opt => {
                    const minCost = getEffectiveCost(selectedMove, pBroken, costModifier);
                    const val = opt.factor === 'min' ? minCost : opt.factor === 'mid' ? Math.ceil((minCost + pRes.stamina) / 2) : pRes.stamina;
                    const pushVal = Math.max(minCost, Math.min(pRes.stamina, val));
                    return (
                      <button key={opt.label}
                        onClick={() => {
                          setStaminaPush(pushVal);
                          playSound('pushCommit');
                          setPhase(PHASE.PUSH_REVEAL);
                          setTimeout(() => resolveTurn(selectedMove, aiMove, matchupResult.winner, pushVal, aiStaminaPush), 800);
                        }}
                        style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--stamina)', borderRadius: 4, color: 'var(--stamina)' }}
                      >
                        {opt.label} ({pushVal})
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>More stamina = more damage</div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <button
                    onClick={() => setStaminaPush(p => Math.max(getEffectiveCost(selectedMove, pBroken, costModifier), p - 1))}
                    style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--text-primary)', fontSize: 18 }}
                  >-</button>
                  <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--stamina)', fontFamily: 'var(--font-mono)', minWidth: 60 }}>{staminaPush}</div>
                  <button
                    onClick={() => setStaminaPush(p => Math.min(pRes.stamina, p + 1))}
                    style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--text-primary)', fontSize: 18 }}
                  >+</button>
                </div>
                {(() => {
                  const won = matchupResult?.winner === 'a' || matchupResult?.winner === 'both';
                  const fullDmg = selectedMove.baseDamage * staminaPush;
                  const actualDmg = won ? fullDmg : Math.ceil(fullDmg * 0.5);
                  return (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                      <div>Base {selectedMove.baseDamage} x {staminaPush} = {fullDmg} {selectedMove.target}</div>
                      {!won && <div style={{ color: 'var(--lose)', fontSize: 11 }}>HALF DAMAGE: {selectedMove.baseDamage} base x {staminaPush} stamina = {fullDmg} / 2 = {actualDmg}</div>}
                      {won && matchupResult?.winner === 'a' && <div style={{ color: 'var(--win)', fontSize: 11 }}>Full damage (won matchup)</div>}
                    </div>
                  );
                })()}
                <button
                  onClick={handlePushCommit}
                  style={{ marginTop: 12, padding: '10px 32px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', background: 'var(--stamina)', color: '#fff', border: 'none', borderRadius: 4 }}
                >Push</button>
              </>
            )}
          </div>
        )}

        {/* Fight over */}
        {phase === PHASE.FIGHT_OVER && fightResult && (
          <div
            className={fightResult.reason.startsWith('FINISHED') ? 'anim-finisher-flash' : ''}
            style={{ ...glassPanel, textAlign: 'center', padding: 32 }}
          >
            <div style={{ fontSize: 42, fontWeight: 800, color: fightResult.won ? 'var(--win)' : 'var(--lose)', marginBottom: 8 }}>
              {fightResult.won ? 'VICTORY' : 'DEFEAT'}
            </div>
            <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 20 }}>{fightResult.reason}</div>
            <button
              onClick={() => onEnd({
                ...fightResult,
                destroyedMutations,
                opponentGuardBroken: oRes.guard <= 0,
                opponentComposureBroken: oRes.composure <= 0,
                playerBodyPct: pRes.body / MAX_BODY,
              })}
              style={{ padding: '14px 40px', fontSize: 16, fontWeight: 700, textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: 'var(--text-primary)' }}
            >Continue</button>
          </div>
        )}
      </div>

      {/* ═══ BOTTOM OVERLAY — prev turn log + move list + actions ═══ */}
      {phase === PHASE.MOVE_SELECT && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          background: 'linear-gradient(180deg, rgba(5,10,25,0.7) 0%, rgba(5,10,25,0.95) 30%)',
          backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(0,204,255,0.15)', padding: '12px 20px',
          clipPath: 'polygon(1% 0%, 99% 0%, 100% 100%, 0% 100%)',
        }}>
          {/* Previous turn log — collapsed summary */}
          {prevTurnLog.length > 0 && (
            <div style={{ marginBottom: 6, padding: '4px 8px', background: '#0a1220', borderRadius: 3, maxHeight: 48, overflowY: 'auto' }}>
              {prevTurnLog.slice(-3).map((line, i) => (
                <div key={i} style={{ fontSize: 10, color: '#667788', fontFamily: 'var(--font-mono)', marginBottom: 1 }}>{line}</div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'center' }}>
            {visibleMoves.map((move, idx) => {
              const effCost = getEffectiveCost(move, pBroken, costModifier);
              const canAfford = effCost <= pRes.stamina;
              const canFinish = canUseFinisher(move, oRes);
              const usable = canAfford && canFinish;
              const isSelected = selectedMove === move;
              const isCorrupted = corruptedMoves.includes(idx);
              const displayName = isCorrupted && paranoiaData[idx] ? paranoiaData[idx].fakeName : move.name;
              const displayCost = isCorrupted && paranoiaData[idx] ? paranoiaData[idx].fakeCost : effCost;
              const moveColor = TYPE_COLORS[move.moveType] || '#888';
              const hasFlow = usable && playerLastType !== null && move.moveType !== playerLastType;
              const dmgPreview = move.baseDamage > 0 ? `${move.baseDamage}${hasFlow ? '+1' : ''} dmg` : move.moveType === 'defense' ? 'Block' : 'Utility';
              const MATCHUP_MAP = { GRAB: { FAST: 'lose', DEFENSE: 'win', EVASION: 'lose' }, FAST: { GRAB: 'win', AREA: 'lose', DEFENSE: 'lose' }, AREA: { FAST: 'win', DEFENSE: 'lose', EVASION: 'win' }, DEFENSE: { GRAB: 'lose', FAST: 'win', AREA: 'win' }, EVASION: { GRAB: 'win', AREA: 'lose' } };
              const beats = move.keyword ? Object.entries({ GRAB: 'GRB', FAST: 'FST', AREA: 'ARA', DEFENSE: 'DEF', EVASION: 'EVA' }).filter(([k]) => MATCHUP_MAP[move.keyword]?.[k] === 'win').map(([,v]) => v) : [];
              const loses = move.keyword ? Object.entries({ GRAB: 'GRB', FAST: 'FST', AREA: 'ARA', DEFENSE: 'DEF', EVASION: 'EVA' }).filter(([k]) => MATCHUP_MAP[move.keyword]?.[k] === 'lose').map(([,v]) => v) : [];

              return (
                <button
                  key={move.id || idx}
                  onClick={() => usable && setSelectedMove(isSelected ? null : move)}
                  disabled={!usable}
                  style={{
                    padding: '10px 14px', minWidth: 130, textAlign: 'left', position: 'relative',
                    background: isSelected ? `${moveColor}18` : 'rgba(8,14,26,0.9)',
                    borderLeft: `3px solid ${isSelected ? moveColor : usable ? moveColor + '66' : '#1a2030'}`,
                    borderTop: `1px solid ${isSelected ? moveColor + '44' : '#1a2838'}`,
                    borderRight: `1px solid ${isSelected ? moveColor + '44' : '#1a2838'}`,
                    borderBottom: `1px solid ${isSelected ? moveColor + '44' : '#1a2838'}`,
                    color: usable ? '#fff' : 'rgba(255,255,255,0.25)',
                    opacity: usable ? 1 : 0.3, cursor: usable ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? `0 0 16px ${moveColor}30, inset 0 0 20px ${moveColor}08` : 'none',
                  }}
                >
                  {/* Move name + type badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? moveColor : '#fff' }}>
                      {displayName}
                    </span>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 5px', background: moveColor + '22', color: moveColor, borderRadius: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {TYPE_LABELS[move.moveType]}
                    </span>
                  </div>

                  {/* Damage + Cost row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
                    <span style={{ color: move.baseDamage > 0 ? '#ddd' : '#668', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {dmgPreview}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: displayCost <= pRes.stamina ? 'var(--stamina)' : '#ff4444', fontWeight: 700 }}>
                      {displayCost} STM
                    </span>
                  </div>

                  {/* Matchup bar — beats/loses */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 5, fontSize: 8, fontWeight: 600 }}>
                    {beats.length > 0 && <span style={{ color: '#44ff66' }}>▲ {beats.join(' ')}</span>}
                    {loses.length > 0 && <span style={{ color: '#ff4455' }}>▼ {loses.join(' ')}</span>}
                  </div>

                  {/* Bonus indicators */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {hasFlow && <span style={{ fontSize: 7, color: '#00ccff', fontWeight: 800, padding: '1px 4px', background: 'rgba(0,204,255,0.1)', borderRadius: 2 }}>FLOW +1</span>}
                    {move.moveType === 'fast' && <span style={{ fontSize: 7, color: '#44ff66', padding: '1px 4px', background: 'rgba(68,255,102,0.08)', borderRadius: 2 }}>WIN: +1 STM</span>}
                    {move.moveType === 'grab' && <span style={{ fontSize: 7, color: '#ccaa22', padding: '1px 4px', background: 'rgba(204,170,34,0.08)', borderRadius: 2 }}>WIN: STEAL</span>}
                    {move.moveType === 'defense' && <span style={{ fontSize: 7, color: '#4488cc', padding: '1px 4px', background: 'rgba(68,136,204,0.08)', borderRadius: 2 }}>+1 REGEN</span>}
                    {move.isFinisher && <span style={{ fontSize: 7, color: '#ff4444', fontWeight: 800, padding: '1px 4px', background: 'rgba(255,68,68,0.12)', borderRadius: 2 }}>FINISHER</span>}
                    {isCorrupted && <span style={{ fontSize: 7, color: '#aa66ee', fontWeight: 700, padding: '1px 4px', background: 'rgba(170,102,238,0.1)', borderRadius: 2 }}>CORRUPTED?</span>}
                  </div>

                  {/* After-turn stamina preview */}
                  {isSelected && (
                    <div style={{ marginTop: 6, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 9, color: '#6688aa', fontFamily: 'var(--font-mono)' }}>
                      After: {pRes.stamina - effCost + STAMINA_REGEN} STM
                    </div>
                  )}
                </button>
              );
            })}

            {/* Items button */}
            {items && items.length > 0 && (
              <button
                onClick={() => setShowItems(!showItems)}
                style={{
                  padding: '8px 12px', minWidth: 80, textAlign: 'center',
                  background: showItems ? 'rgba(234,179,8,0.15)' : 'transparent',
                  border: '1.5px solid rgba(234,179,8,0.3)', borderRadius: 4,
                  color: 'var(--stamina)', fontSize: 12, fontWeight: 700,
                }}
              >
                ITEMS ({items.length})
              </button>
            )}

            {/* Commit / Pass buttons */}
            <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
              {selectedMove && (
                <button
                  onClick={handleCommit}
                  style={{
                    padding: '10px 24px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
                    background: 'var(--guard)', color: '#fff', border: 'none', borderRadius: 4, letterSpacing: 1,
                  }}
                >COMMIT</button>
              )}
              {!hasAffordableMove && (
                <button
                  onClick={handlePass}
                  style={{
                    padding: '10px 20px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: 'var(--text-muted)',
                  }}
                >PASS</button>
              )}
            </div>
          </div>

          {/* Items dropdown */}
          {showItems && items && items.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {items.map((item, idx) => {
                const catColors = { restore: '#44cc66', buff: '#eab308', disrupt: '#cc4444', tactical: '#44aaff' };
                const borderCol = catColors[item.category] || 'rgba(234,179,8,0.3)';
                return (
                  <button
                    key={`${item.id}_${idx}`}
                    onClick={() => handleItemUse(item)}
                    title={item.description}
                    style={{
                      padding: '6px 14px', fontSize: 11, fontWeight: 600,
                      background: `${borderCol}15`, border: `1px solid ${borderCol}50`,
                      borderRadius: 4, color: borderCol, display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{item.icon || '•'}</span>
                    {item.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Matchup guide toggle */}
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <button
              onClick={() => setShowMatchupGuide(prev => !prev)}
              style={{
                fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                textDecoration: 'underline', opacity: 0.6,
              }}
            >[M] Matchup Guide</button>
          </div>
        </div>
      )}

      {/* Matchup guide overlay */}
      {showMatchupGuide && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowMatchupGuide(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '80vh', overflow: 'auto', ...glassPanel, padding: 16 }}>
            <MatchupGuide />
          </div>
        </div>
      )}
    </div>
  );
}

function MoveCard({ label, name, color }) {
  const isHidden = name === '???';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div
        className={!isHidden ? 'anim-flip' : ''}
        style={{
          padding: '16px 24px', background: isHidden ? 'var(--bg-surface)' : 'var(--bg-card)',
          border: `2px solid ${isHidden ? 'var(--border)' : color}`,
          borderRadius: 'var(--radius-md)', fontSize: 16, fontWeight: 700,
          color: isHidden ? 'var(--text-muted)' : color, minWidth: 150,
          boxShadow: isHidden ? 'none' : `0 2px 12px ${color}22`,
          transition: 'box-shadow 0.3s',
        }}
      >
        {name}
      </div>
    </div>
  );
}
