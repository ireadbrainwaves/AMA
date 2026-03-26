import React, { useState, useCallback, useMemo } from 'react';
import FightScreen from './screens/FightScreen';
import CharacterSelect from './screens/CharacterSelect';
import HubWorld2D from './screens/HubWorld2D';
import HarvestScreen from './screens/HarvestScreen';
import DoctorScreen from './screens/DoctorScreen';
import VictoryScreen from './screens/VictoryScreen';
import DefeatScreen from './screens/DefeatScreen';
import ScoutingScreen from './screens/ScoutingScreen';
import IntroSequence from './screens/IntroSequence';
import { characters } from './data/characters';
import { items as allItemPool } from './data/items';
import { playSound } from './engine/SoundManager';
import { MAX_BODY, PRIZE_MONEY, TECH_CAPACITY, TECH_ENHANCEMENTS, loadMeta, saveMeta } from './data/constants';

const STANDARD_SPECIES = ['cyberGorilla', 'psychoSquid', 'beeSwarm', 'terrorPinTurtle'];
const COUNTER_SPECIES = ['echomorph', 'hydravine'];

function generateArenaStates(playerSpecies) {
  const standard = STANDARD_SPECIES.filter(s => s !== playerSpecies);
  return [0, 1, 2, 3].map(i => {
    let opponent;
    if (i <= 1) {
      // Fights 1-2: standard species
      opponent = standard[Math.floor(Math.random() * standard.length)];
    } else if (i === 2) {
      // Fight 3: standard or counter-mechanic (50/50)
      const pool = Math.random() < 0.5 ? COUNTER_SPECIES : standard;
      opponent = pool[Math.floor(Math.random() * pool.length)];
    } else {
      // Fight 4 (boss): always Parasitex
      opponent = 'parasitex';
    }
    return { id: i, opponent, cleared: false };
  });
}

export default function App() {
  const [screen, setScreen] = useState('select');
  const [playerCharKey, setPlayerCharKey] = useState(null);
  const [playerMoves, setPlayerMoves] = useState(null);
  const [mutations, setMutations] = useState([]);
  const [biomass, setBiomass] = useState(0);
  const [items, setItems] = useState([]);
  const [arenaStates, setArenaStates] = useState([]);
  const [arenasCleared, setArenasCleared] = useState(0);
  const [currentArena, setCurrentArena] = useState(null);
  const [runStats, setRunStats] = useState({ totalTurns: 0, defeated: [] });
  const [lastDefeated, setLastDefeated] = useState(null);
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [tutorialDone, setTutorialDone] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [scars, setScars] = useState([]);
  const [meta, setMeta] = useState(loadMeta());

  // Economy
  const [credits, setCredits] = useState(0);
  const [techPoints, setTechPoints] = useState(0);
  const [playerTech, setPlayerTech] = useState([]); // installed tech enhancement IDs
  const [techFlashMsg, setTechFlashMsg] = useState(null); // flash message for move transformations

  // Map mutation slot names to compositor slot names
  // Mutations use 'arms'; compositor uses 'leftArm'/'rightArm'
  const SLOT_TO_COMPOSITOR = { arms: 'leftArm', head: 'head', chest: 'chest', back: 'back', legs: 'legs' };

  // Derive player build from mutations for Pixi.js compositor and Doctor preview
  const playerBuild = useMemo(() => {
    const slots = {
      head: { mutation: null, tech: [] },
      chest: { mutation: null, tech: [] },
      leftArm: { mutation: null, tech: [] },
      rightArm: { mutation: null, tech: [] },
      back: { mutation: null, tech: [] },
      legs: { mutation: null, tech: [] },
    };
    if (mutations) {
      mutations.forEach(m => {
        if ((m.type === 'ADD' || m.type === 'REPLACE' || m.type === 'SHIELD') && m.slot) {
          const compositorSlot = SLOT_TO_COMPOSITOR[m.slot] || m.slot;
          if (slots[compositorSlot] !== undefined) {
            slots[compositorSlot] = { mutation: m.id, tech: [] };
          }
        }
      });
    }
    // Attach installed tech to their slots
    if (playerTech && playerTech.length > 0) {
      playerTech.forEach(techEntry => {
        const compositorSlot = SLOT_TO_COMPOSITOR[techEntry.slot] || techEntry.slot;
        if (slots[compositorSlot]) {
          slots[compositorSlot].tech.push(techEntry.techId);
        }
      });
    }
    return { slots };
  }, [mutations, playerTech]);

  // Compute effective player attributes by applying mutation modifiers to base stats
  const playerAttributes = useMemo(() => {
    const char = characters[playerCharKey];
    if (!char?.stats) return { attack: 50, defense: 50, willpower: 50, toughness: 50 };
    const base = { ...char.stats };
    mutations.forEach(mut => {
      if (mut.attrMod) {
        Object.entries(mut.attrMod).forEach(([attr, val]) => {
          if (attr.startsWith('_')) return; // skip special keys like _lowestStat
          if (base[attr] !== undefined) {
            base[attr] = Math.round(base[attr] * (1 + val));
          }
        });
      }
    });
    return base;
  }, [playerCharKey, mutations]);

  function startRun(charKey) {
    const char = characters[charKey];
    setPlayerCharKey(charKey);
    setPlayerMoves([...char.moves]);
    setMutations([]);
    setBiomass(0);
    setCredits(0);
    setTechPoints(0);
    setPlayerTech([]);

    // Start with 1 random item
    const randomItem = allItemPool[Math.floor(Math.random() * allItemPool.length)];
    setItems([{ ...randomItem }]);

    setArenaStates(generateArenaStates(charKey));
    setArenasCleared(0);
    setCurrentArena(null);
    setRunStats({ totalTurns: 0, defeated: [] });
    setTutorialDone(false);
    setScars([]);

    // Meta-progression
    const currentMeta = loadMeta();
    const newMeta = { ...currentMeta, totalRuns: currentMeta.totalRuns + 1 };
    setMeta(newMeta);
    saveMeta(newMeta);
    setIsFirstRun(currentMeta.isFirstRun);

    // Show intro on first ever run
    const introSeen = localStorage.getItem('ama_intro_seen');
    if (!introSeen && currentMeta.totalRuns <= 1) {
      fadeToScreen('intro');
    } else {
      fadeToScreen('overworld');
    }
  }

  function fadeToScreen(target) {
    setTransitioning(true);
    setTimeout(() => {
      setScreen(target);
      setTransitioning(false);
    }, 300);
  }

  // Hub overlay state — doctor/scouting/codex appear ON TOP of the hub
  const [hubOverlay, setHubOverlay] = useState(null); // null, 'doctor', 'scouting', 'codex', 'supplies'
  const isInHub = screen === 'overworld';
  const overlayActive = hubOverlay !== null;

  function handleHubInteract(targetType) {
    if (targetType === 'helix') {
      setHubOverlay('doctor');
    } else if (targetType === 'ark') {
      setHubOverlay('techshop');
    } else if (targetType === 'vex' || targetType.startsWith('arena')) {
      const arenaIndex = targetType.startsWith('arena') ? parseInt(targetType.replace('arena', '')) : null;
      if (arenaIndex !== null) {
        setCurrentArena(arenaIndex);
        playSound('door');
        setHubOverlay('scouting');
      }
    } else if (targetType === 'codex') {
      setHubOverlay('codex');
    } else if (targetType === 'supplies') {
      setHubOverlay('supplies');
    } else if (targetType === 'bracket') {
      setHubOverlay('bracket');
    }
  }

  function closeHubOverlay() {
    setHubOverlay(null);
  }

  function handleEnterArena(doorIndex) {
    setCurrentArena(doorIndex);
    playSound('door');
    setHubOverlay('scouting');
  }

  // Last fight result for harvest screen
  const [lastFightResult, setLastFightResult] = useState(null);

  function computeKillMethod(result) {
    if (!result.won) return 'attrition';
    if (result.turns <= 8 && (result.playerBodyPct || 1) > 0.5) return 'dominant';
    if (result.opponentGuardBroken) return 'guardBreak';
    if (result.opponentComposureBroken) return 'composureBreak';
    if ((result.playerBodyPct || 1) <= 0.3) return 'scrappy';
    if (result.turns >= 15) return 'attrition';
    return 'attrition';
  }

  function handleFightEnd(result) {
    const oppKey = arenaStates[currentArena].opponent;

    // Remove moves, mutations, and tech from destroyed mutations
    if (result.destroyedMutations?.length > 0) {
      const destroyedIds = new Set(result.destroyedMutations);
      setPlayerMoves(prev => prev.filter(m => !destroyedIds.has(m.id)));
      setMutations(prev => {
        const destroyed = prev.filter(m => destroyedIds.has(m.id));
        const destroyedSlots = new Set(destroyed.map(m => m.slot).filter(Boolean));
        if (destroyedSlots.size > 0) {
          setPlayerTech(pt => pt.filter(t => !destroyedSlots.has(t.slot)));
        }
        return prev.filter(m => !destroyedIds.has(m.id));
      });
    }

    // Compute kill method for harvest
    const killMethod = computeKillMethod(result);
    setLastFightResult({ ...result, killMethod, destroyedMutations: result.destroyedMutations || [] });

    setRunStats(prev => ({
      totalTurns: prev.totalTurns + result.turns,
      defeated: result.won ? [...prev.defeated, oppKey] : prev.defeated,
    }));

    // Update meta codex
    setMeta(prev => {
      const codex = { ...prev.codex };
      if (!codex[oppKey]) codex[oppKey] = { encounters: 0, defeated: 0 };
      codex[oppKey].encounters += 1;
      if (result.won) codex[oppKey].defeated += 1;
      const updated = {
        ...prev,
        codex,
        isFirstRun: false,
        lastDeathSpecies: result.won ? prev.lastDeathSpecies : oppKey,
      };
      if (!result.won) updated.totalLosses = (prev.totalLosses || 0) + 1;
      saveMeta(updated);
      return updated;
    });

    if (!result.won) {
      fadeToScreen('defeat');
      return;
    }

    // Mark arena cleared
    setArenaStates(prev => prev.map((a, i) => i === currentArena ? { ...a, cleared: true } : a));
    const newCleared = arenasCleared + 1;
    setArenasCleared(newCleared);
    setLastDefeated(arenaStates[currentArena].opponent);

    // Award prize money
    const fightNum = currentArena + 1;
    const prize = PRIZE_MONEY[fightNum] || 0;
    if (prize > 0) setCredits(prev => prev + prize);

    if (newCleared >= 4) {
      // Update meta wins
      setMeta(prev => {
        const updated = { ...prev, totalWins: (prev.totalWins || 0) + 1, bestRun: Math.max(prev.bestRun || 0, 4) };
        saveMeta(updated);
        return updated;
      });
      fadeToScreen('victory');
    } else {
      fadeToScreen('harvest');
    }
  }

  function handleHarvestDone() {
    localStorage.setItem('ama_has_played', 'true');
    localStorage.setItem('ama_first_run', 'false');
    fadeToScreen('overworld');
  }

  function handleOpenDoctor() {
    setHubOverlay('doctor');
  }

  function handleDoctorDone() {
    closeHubOverlay();
  }

  const handlePickupItem = useCallback((row, col) => {
    if (items.length >= 3) return;
    const randomItem = allItemPool[Math.floor(Math.random() * allItemPool.length)];
    setItems(prev => [...prev, { ...randomItem }]);
  }, [items]);

  function handleTutorialDone() {
    setTutorialDone(true);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      {/* Fade transition overlay */}
      {transitioning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 100,
          animation: 'fadeIn 0.15s ease',
        }} />
      )}

      {screen === 'select' && (
        <CharacterSelect onSelect={startRun} meta={meta} />
      )}

      {/* Hub world — stays mounted during overworld, overlays render on top */}
      {screen === 'overworld' && (
        <>
          <HubWorld2D
            runState={{ biomass, credits, items, mutations, arenasCleared, techPoints }}
            meta={meta}
            arenaStates={arenaStates}
            onInteract={handleHubInteract}
            overlayActive={overlayActive}
          />

          {/* Hub overlays */}
          {hubOverlay === 'scouting' && currentArena !== null && (
            <div className="hub-overlay">
              <ScoutingScreen
                playerCharKey={playerCharKey}
                opponentCharKey={arenaStates[currentArena].opponent}
                onEnter={() => { closeHubOverlay(); fadeToScreen('fight'); }}
                onBack={closeHubOverlay}
                codex={meta.codex}
              />
            </div>
          )}

          {hubOverlay === 'doctor' && (
            <div className="hub-overlay">
              <DoctorScreen
                biomass={biomass}
                credits={credits}
                techPoints={techPoints}
                techCapacity={TECH_CAPACITY}
                meta={meta}
                playerSpecies={playerCharKey}
                playerBuild={playerBuild}
                mutations={mutations}
                playerTech={playerTech}
                onGraft={(mutation, cost) => {
                  setBiomass(prev => prev - cost);
                  setMutations(prev => [...prev, mutation]);
                  if (mutation.type === 'ADD' && mutation.move) {
                    setPlayerMoves(prev => [...prev, mutation.move]);
                  }
                }}
                onRemoveMutation={(mutationId) => {
                  // Find slot BEFORE filtering so we can cascade tech removal
                  setMutations(prev => {
                    const mut = prev.find(m => m.id === mutationId);
                    if (mut?.slot) {
                      setPlayerTech(pt => pt.filter(t => t.slot !== mut.slot));
                    }
                    return prev.filter(m => m.id !== mutationId);
                  });
                  setPlayerMoves(prev => prev.filter(m => m.id !== mutationId));
                }}
                onBuyTech={(tech, slot) => {
                  setCredits(prev => prev - tech.cost);
                  setTechPoints(prev => prev + tech.techCost);
                  setPlayerTech(prev => [...prev, { techId: tech.id, slot }]);
                }}
                onDone={closeHubOverlay}
                items={items}
                onBuyItem={(item, cost) => {
                  setBiomass(prev => prev - cost);
                  setItems(prev => [...prev, item]);
                }}
              />
            </div>
          )}

          {hubOverlay === 'techshop' && (
            <div className="hub-overlay">
              <div className="screen" style={{ background: 'var(--bg)', padding: 40, maxWidth: 600, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ fontSize: 10, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>// rk-7 tech workshop</div>
                <div className="npc-bar" style={{ borderLeftColor: 'var(--amber)', marginBottom: 16 }}>
                  <div className="npc-name" style={{ color: 'var(--amber)' }}>RK-7 "Ark"</div>
                  <div className="npc-text">"Credits talk, customer. Everything else walks. What do you need?"</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Credits: {credits} | Tech: {techPoints}/{TECH_CAPACITY}
                </div>
                {Object.values(TECH_ENHANCEMENTS).map(tech => {
                  const canAfford = credits >= tech.cost;
                  const alreadyOwned = playerTech.some(t => t.techId === tech.id);
                  const isStarterTech = !!tech.transformsMove;
                  const isIncompatible = isStarterTech && typeof tech.compatible === 'string' && tech.compatible !== 'any_occupied' && tech.compatible !== playerCharKey;
                  const disabled = !canAfford || alreadyOwned || isIncompatible;
                  return (
                    <div key={tech.id} style={{
                      background: alreadyOwned ? '#0a1a15' : isIncompatible ? '#1a0a0a' : 'var(--bg-card)',
                      border: `1px solid ${alreadyOwned ? 'var(--border-graft)' : isIncompatible ? '#3a1515' : 'var(--border)'}`,
                      padding: '10px 14px', marginBottom: 4,
                      opacity: disabled && !alreadyOwned ? 0.4 : 1,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: alreadyOwned ? 'var(--green)' : isIncompatible ? 'var(--text-ghost)' : 'var(--text-bright)' }}>{tech.name}</span>
                          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 6 }}>{tech.category}</span>
                        </div>
                        {alreadyOwned ? (
                          <span style={{ fontSize: 9, color: 'var(--green)', letterSpacing: 1, textTransform: 'uppercase' }}>Installed</span>
                        ) : isIncompatible ? (
                          <span style={{ fontSize: 9, color: '#8a3030', letterSpacing: 1, textTransform: 'uppercase' }}>Incompatible with your biology</span>
                        ) : (
                          <button
                            disabled={!canAfford}
                            onClick={() => {
                              // Re-validate before purchase (guard against stale UI)
                              if (credits < tech.cost || playerTech.some(t => t.techId === tech.id)) return;
                              setCredits(prev => prev - tech.cost);
                              setTechPoints(prev => prev + tech.techCost);
                              setPlayerTech(prev => [...prev, { techId: tech.id, slot: tech.compatible }]);
                              if (tech.transformsMove && tech.newMove) {
                                const oldMove = playerMoves.find(m => m.id === tech.transformsMove);
                                setPlayerMoves(prev => prev.map(m =>
                                  m.id === tech.transformsMove ? { ...tech.newMove, fromSlot: tech.newMove.fromSlot || null } : m
                                ));
                                const oldName = oldMove ? oldMove.name : tech.transformsMove;
                                const msg = `MOVE TRANSFORMED: ${oldName} → ${tech.newMove.name}`;
                                setTechFlashMsg(msg);
                                setTimeout(() => setTechFlashMsg(null), 2000);
                              }
                            }}
                            style={{
                              background: 'transparent', border: '1px solid var(--amber)', color: 'var(--amber)',
                              fontSize: 10, padding: '3px 10px', letterSpacing: 1, textTransform: 'uppercase',
                              cursor: canAfford ? 'pointer' : 'not-allowed', opacity: canAfford ? 1 : 0.4,
                            }}
                          >
                            {tech.cost}c / {tech.techCost}tp
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{tech.description}</div>
                    </div>
                  );
                })}
                {techFlashMsg && (
                  <div style={{
                    position: 'fixed', top: 40, left: '50%', transform: 'translateX(-50%)',
                    background: '#0a2a1a', border: '1px solid var(--green)', color: 'var(--green)',
                    padding: '10px 24px', fontSize: 13, fontWeight: 700, letterSpacing: 2,
                    textTransform: 'uppercase', zIndex: 200, animation: 'fadeIn 0.15s ease',
                  }}>
                    {techFlashMsg}
                  </div>
                )}
                <button onClick={closeHubOverlay} className="btn" style={{ marginTop: 16, borderColor: 'var(--amber)', color: 'var(--amber)' }}>
                  Done
                </button>
              </div>
            </div>
          )}

          {hubOverlay === 'codex' && (
            <div className="hub-overlay">
              <div className="screen" style={{ background: 'var(--bg)', padding: 40, maxWidth: 600, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ fontSize: 10, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16 }}>// species codex</div>
                {Object.entries(meta.codex || {}).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>No species encountered yet. Enter an arena to begin.</div>
                ) : (
                  Object.entries(meta.codex).map(([key, data]) => (
                    <div key={key} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
                      <div style={{ fontSize: 13, color: 'var(--text-bright)' }}>{characters[key]?.name || key}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        Encounters: {data.encounters} | Defeated: {data.defeated}
                      </div>
                    </div>
                  ))
                )}
                <button onClick={closeHubOverlay} style={{ marginTop: 16, padding: '8px 24px', background: 'transparent', border: '1px solid var(--cyan)', color: 'var(--cyan)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
                  Close
                </button>
              </div>
            </div>
          )}

          {hubOverlay === 'supplies' && (
            <div className="hub-overlay">
              <div className="screen" style={{ background: 'var(--bg)', padding: 40, maxWidth: 500, width: '100%' }}>
                <div style={{ fontSize: 10, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16 }}>// supplies</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Credits: {credits} | Biomass: {biomass} | Tech: {techPoints}/{TECH_CAPACITY} | Items: {items.length}/3
                </div>
                {items.length > 0 ? items.map((item, idx) => (
                  <div key={`${item.id}_${idx}`} style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.description}</div>
                  </div>
                )) : (
                  <div style={{ color: 'var(--text-ghost)', fontSize: 11 }}>No items. Visit Dr. Helix to purchase.</div>
                )}
                <button onClick={closeHubOverlay} style={{ marginTop: 16, padding: '8px 24px', background: 'transparent', border: '1px solid var(--amber)', color: 'var(--amber)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
                  Close
                </button>
              </div>
            </div>
          )}

          {hubOverlay === 'bracket' && (
            <div className="hub-overlay">
              <div className="screen" style={{
                background: '#0a1220', padding: '32px 40px', maxWidth: 700, width: '100%',
                maxHeight: '85vh', overflowY: 'auto', border: '1px solid #1a2838',
                fontFamily: '"Share Tech Mono", monospace',
              }}>
                <div style={{ fontSize: 10, color: '#00ffee', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 20 }}>// tournament bracket</div>

                <div style={{ display: 'flex', gap: 24 }}>
                  {/* Player info — left side */}
                  <div style={{
                    flex: '0 0 160px', padding: '14px 16px',
                    background: '#0d1828', border: '1px solid #1a2838', borderRadius: 2,
                  }}>
                    <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>// combatant</div>
                    <div style={{ fontSize: 14, color: characters[playerCharKey]?.color || '#00ccff', fontWeight: 700, marginBottom: 4 }}>
                      {characters[playerCharKey]?.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 10, color: '#4a6a7a', marginBottom: 12 }}>
                      {characters[playerCharKey]?.description || ''}
                    </div>
                    <div style={{ fontSize: 10, color: '#6a8a9a', marginBottom: 4 }}>
                      Mutations: <span style={{ color: '#00ff88' }}>{mutations.length}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#6a8a9a' }}>
                      Credits: <span style={{ color: '#ccaa22' }}>{credits}c</span>
                    </div>
                  </div>

                  {/* Bracket — right side */}
                  <div style={{ flex: 1 }}>
                    {arenaStates.map((arena, i) => {
                      const opp = characters[arena.opponent];
                      const isCleared = arena.cleared;
                      const isNext = !isCleared && i === arenaStates.filter(a => a.cleared).length;
                      const isLocked = !isCleared && !isNext;

                      let statusLabel, statusColor, statusBg;
                      if (isCleared) { statusLabel = 'CLEARED'; statusColor = '#00ff88'; statusBg = '#0a2a1a'; }
                      else if (isNext) { statusLabel = 'NEXT'; statusColor = '#00ffee'; statusBg = '#0a1a2a'; }
                      else { statusLabel = 'LOCKED'; statusColor = '#3a4a5a'; statusBg = '#0c1018'; }

                      return (
                        <div key={arena.id} style={{
                          display: 'flex', alignItems: 'stretch', marginBottom: 6,
                          background: '#0d1828', border: `1px solid ${isNext ? '#00ffee33' : '#1a2838'}`,
                          borderRadius: 2, overflow: 'hidden',
                          opacity: isLocked ? 0.5 : 1,
                        }}>
                          {/* Arena number strip */}
                          <div style={{
                            flex: '0 0 44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: statusBg, borderRight: '1px solid #1a2838',
                          }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: statusColor, letterSpacing: 1 }}>A{i + 1}</span>
                          </div>

                          {/* Opponent info */}
                          <div style={{ flex: 1, padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                              {/* Color indicator dot */}
                              <div style={{
                                width: 8, height: 8, borderRadius: 1,
                                background: isLocked ? '#1a2838' : (opp?.color || '#4a6a7a'),
                                boxShadow: isLocked ? 'none' : `0 0 6px ${opp?.color || '#4a6a7a'}44`,
                              }} />
                              <span style={{
                                fontSize: 13, fontWeight: 600,
                                color: isLocked ? '#3a4a5a' : (isCleared ? '#6a8a9a' : '#ddeeff'),
                              }}>
                                {isLocked ? '???' : (opp?.name || 'Unknown')}
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: isCleared ? '#00ff8888' : (isNext ? '#00ffee99' : '#2a3a4a'), marginTop: 2 }}>
                              {isCleared && 'DEFEATED'}
                              {isNext && (opp?.description || '')}
                              {isLocked && '???'}
                            </div>
                          </div>

                          {/* Status badge */}
                          <div style={{
                            flex: '0 0 72px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{
                              fontSize: 9, fontWeight: 700, color: statusColor, letterSpacing: 2,
                              textTransform: 'uppercase',
                              padding: '3px 8px', border: `1px solid ${statusColor}44`,
                              background: statusBg,
                            }}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button onClick={closeHubOverlay} style={{
                  marginTop: 20, padding: '8px 28px', background: 'transparent',
                  border: '1px solid #00ffee', color: '#00ffee', fontSize: 11,
                  letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
                  fontFamily: '"Share Tech Mono", monospace',
                }}>
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {screen === 'intro' && (
        <IntroSequence onComplete={() => {
          localStorage.setItem('ama_intro_seen', 'true');
          fadeToScreen('overworld');
        }} />
      )}

      {screen === 'fight' && currentArena !== null && (
        <FightScreen
          playerCharKey={playerCharKey}
          playerMoves={playerMoves}
          opponentCharKey={arenaStates[currentArena].opponent}
          items={items}
          onItemUsed={(itemId) => setItems(prev => {
            const idx = prev.findIndex(i => i.id === itemId);
            if (idx === -1) return prev;
            return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
          })}
          mutations={mutations}
          onEnd={handleFightEnd}
          isFirstFight={isFirstRun && arenasCleared === 0}
          scars={scars}
          onScar={(scar) => setScars(prev => [...prev, scar])}
          meta={meta}
          fightNumber={currentArena + 1}
          playerTech={playerTech}
          playerAttributes={playerAttributes}
        />
      )}

      {screen === 'harvest' && (
        <HarvestScreen
          defeatedSpecies={lastDefeated}
          killMethod={lastFightResult?.killMethod || 'attrition'}
          destroyedMutations={lastFightResult?.destroyedMutations || []}
          fightNumber={currentArena + 1}
          playerMutations={mutations}
          onHarvest={(mutation, replacingId) => {
            // If replacing, remove old mutation first (cascades tech)
            if (replacingId) {
              setMutations(prev => {
                const old = prev.find(m => m.id === replacingId);
                if (old?.slot) setPlayerTech(pt => pt.filter(t => t.slot !== old.slot));
                return prev.filter(m => m.id !== replacingId);
              });
              setPlayerMoves(prev => prev.filter(m => m.id !== replacingId));
            }
            // Add new mutation
            setMutations(prev => [...prev, mutation]);
            if ((mutation.type === 'ADD' || mutation.type === 'SHIELD') && mutation.move) {
              setPlayerMoves(prev => [...prev, { ...mutation.move, fromSlot: mutation.slot }]);
            }
            handleHarvestDone();
          }}
          onSkip={handleHarvestDone}
        />
      )}

      {screen === 'victory' && (
        <VictoryScreen
          stats={runStats}
          mutations={mutations}
          playerSpecies={selectedSpecies}
          scars={scars}
          meta={meta}
          techCount={playerTech?.length || 0}
          onNewRun={() => setScreen('select')}
        />
      )}

      {screen === 'defeat' && (
        <DefeatScreen
          stats={runStats}
          playerSpecies={selectedSpecies}
          killedBy={arenaStates[currentArena]?.opponent}
          mutations={mutations}
          scars={scars}
          meta={meta}
          fightNumber={currentArena != null ? currentArena + 1 : 1}
          onNewRun={() => setScreen('select')}
        />
      )}
    </div>
  );
}
