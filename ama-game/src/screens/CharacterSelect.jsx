import React, { useState, useEffect, useRef } from 'react';
import { characters } from '../data/characters';
import SPRITES from '../data/spriteMap';
import { hasSavedRun, getSaveInfo, loadRun, clearSave } from '../engine/SaveManager';

/**
 * CharacterSelect — Cinematic fighter selection screen.
 * Animated card reveals, move preview, stat radar, continue run support.
 */

const PLAYABLE = ['cyberGorilla', 'psychoSquid', 'beeSwarm', 'terrorPinTurtle'];

const ARCHETYPE_LABELS = {
  cyberGorilla: 'HEAVY HITTER',
  psychoSquid: 'MENTALIST',
  beeSwarm: 'ATTRITION',
  terrorPinTurtle: 'FORTRESS',
};

// Floating particle background
function SelectParticles() {
  const particles = useRef(
    Array.from({ length: 18 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.5 + Math.random() * 2,
      speed: 0.2 + Math.random() * 0.5,
      delay: Math.random() * 6,
      opacity: 0.05 + Math.random() * 0.15,
    }))
  ).current;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.x}%`, bottom: '-4px',
          width: p.size, height: p.size, borderRadius: '50%',
          background: '#00ccff', opacity: p.opacity,
          animation: `floatUp ${10 / p.speed}s linear ${p.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.15; }
          90% { opacity: 0.05; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function CharacterSelect({ onSelect, onContinue, meta }) {
  const [selected, setSelected] = useState(null);
  const [cardsRevealed, setCardsRevealed] = useState(0);
  const [titleReady, setTitleReady] = useState(false);
  const [showMoves, setShowMoves] = useState(false);

  const runNum = (meta?.totalRuns || 0) + 1;
  const bestRun = meta?.bestRun || 0;
  const wins = meta?.totalWins || 0;
  const losses = meta?.totalLosses || 0;

  const savedRun = hasSavedRun() ? getSaveInfo() : null;

  // Staggered reveal animation
  useEffect(() => {
    const t0 = setTimeout(() => setTitleReady(true), 100);
    const timers = PLAYABLE.map((_, i) =>
      setTimeout(() => setCardsRevealed(i + 1), 300 + i * 150)
    );
    return () => { clearTimeout(t0); timers.forEach(clearTimeout); };
  }, []);

  // Show moves when a character is selected
  useEffect(() => {
    if (selected) {
      setShowMoves(false);
      const t = setTimeout(() => setShowMoves(true), 200);
      return () => clearTimeout(t);
    }
  }, [selected]);

  const selectedChar = selected ? characters[selected] : null;

  function handleContinueRun() {
    const save = loadRun();
    if (save && onContinue) {
      onContinue(save);
    }
  }

  function handleDeleteSave() {
    clearSave();
    // Force re-render by selecting nothing
    setSelected(null);
  }

  // Vex commentary — more variety
  const vexLine = (() => {
    if (runNum <= 1) return '"Fresh meat. Pick your species and try not to die in the first round."';
    if (wins >= 10) return '"The legend returns. The crowd\'s already chanting your name."';
    if (wins >= 5) return '"Champion. Back for more glory? The arena missed you."';
    if (wins >= 3 && losses > wins) return '"Stubborn. I respect it. Maybe this run is the one."';
    if (losses >= 10 && wins === 0) return '"...You\'re still here. That\'s either brave or insane. Pick your fighter."';
    if (losses >= 5) return '"Another run. Remember: adapt or die. Preferably adapt."';
    if (runNum <= 3) return `"Run ${runNum}. Let's see what you've learned."`;
    if (runNum <= 10) return '"Regular now. The arena staff know your name. Make them remember why."';
    return '"Season veteran. The rookies study your replays. Give them something new."';
  })();

  return (
    <div className="screen" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20,
      background: 'linear-gradient(180deg, #050810 0%, #0a1020 40%, #0f1830 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background effects */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(0,204,255,0.05) 0%, transparent 60%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
        background: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
      }} />
      <SelectParticles />

      {/* ── Title ── */}
      <div style={{
        textAlign: 'center', position: 'relative', zIndex: 1,
        opacity: titleReady ? 1 : 0, transform: titleReady ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'all 0.6s ease',
      }}>
        <div style={{
          fontSize: 10, color: 'var(--cyan)', letterSpacing: 4, textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          // intergalactic strongman tournament
        </div>
        <h1 style={{
          fontSize: 42, fontWeight: 900, letterSpacing: -1, textTransform: 'uppercase',
          color: 'var(--text-bright)', lineHeight: 1.1,
          background: 'linear-gradient(135deg, #e0f0f8, #00ccff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 20px rgba(0,204,255,0.2))',
        }}>
          Alien Martial Arts
        </h1>
        <div style={{
          fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2,
          textTransform: 'uppercase', marginTop: 6,
        }}>
          Choose Your Fighter
        </div>
      </div>

      {/* ── Run stats bar ── */}
      <div style={{
        display: 'flex', gap: 16, fontSize: 10, color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)', letterSpacing: 1, position: 'relative', zIndex: 1,
        opacity: titleReady ? 1 : 0, transition: 'opacity 0.4s ease 0.3s',
      }}>
        <span>RUN #{runNum}</span>
        {bestRun > 0 && <span style={{ color: 'var(--text-secondary)' }}>Best: {bestRun}/4</span>}
        {(meta?.totalRuns || 0) > 0 && (
          <span style={{ color: 'var(--text-secondary)' }}>
            Record: {wins}W - {losses}L
          </span>
        )}
      </div>

      {/* ── Continue Run Banner ── */}
      {savedRun && onContinue && (
        <div style={{
          background: '#0a1a2e', border: '1px solid #00ccff30', padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: 16, maxWidth: 500, width: '100%',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00ccff', textTransform: 'uppercase', letterSpacing: 1 }}>
              Continue Run
            </div>
            <div style={{ fontSize: 10, color: '#6a8a9a', marginTop: 2 }}>
              {characters[savedRun.playerCharKey]?.name || savedRun.playerCharKey} — {savedRun.arenasCleared}/4 cleared — {savedRun.mutations} mutations
            </div>
          </div>
          <button onClick={handleContinueRun} style={{
            padding: '6px 18px', background: '#00ccff15', border: '1px solid #00ccff',
            color: '#00ccff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            letterSpacing: 1, textTransform: 'uppercase',
          }}>
            Resume
          </button>
          <button onClick={handleDeleteSave} style={{
            padding: '6px 10px', background: 'none', border: '1px solid #333',
            color: '#4a6a7a', fontSize: 10, cursor: 'pointer',
          }}>
            Delete
          </button>
        </div>
      )}

      {/* ── Character grid ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12, width: '100%', maxWidth: 880, position: 'relative', zIndex: 1,
      }}>
        {PLAYABLE.map((key, idx) => {
          const c = characters[key];
          const isSel = selected === key;
          const sprite = SPRITES[key]?.front;
          const revealed = idx < cardsRevealed;

          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              style={{
                background: isSel ? '#0a1a2e' : 'var(--bg-card)',
                border: `1px solid ${isSel ? c.color : 'var(--border)'}`,
                padding: 0, textAlign: 'left', color: 'var(--text-primary)',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                boxShadow: isSel
                  ? `0 0 24px ${c.color}22, inset 0 0 30px ${c.color}08`
                  : 'none',
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
              }}
            >
              {/* Sprite + name header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                borderBottom: `1px solid ${isSel ? c.color + '44' : 'var(--border)'}`,
                background: isSel ? `${c.color}08` : 'transparent',
                transition: 'all 0.2s',
              }}>
                {sprite && (
                  <img src={sprite} alt={c.name} style={{
                    width: 48, height: 48, imageRendering: 'pixelated',
                    objectFit: 'contain',
                    filter: isSel ? `drop-shadow(0 0 8px ${c.color}60)` : 'brightness(0.6)',
                    transition: 'all 0.3s',
                    transform: isSel ? 'scale(1.1)' : 'scale(1)',
                  }} />
                )}
                <div>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: isSel ? c.color : 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: 1, transition: 'color 0.2s',
                  }}>
                    {c.name}
                  </div>
                  <div style={{
                    fontSize: 9, color: isSel ? `${c.color}aa` : 'var(--text-muted)',
                    letterSpacing: 1, fontWeight: 600, transition: 'color 0.2s',
                  }}>
                    {ARCHETYPE_LABELS[key]}
                  </div>
                </div>
              </div>

              {/* Info area */}
              <div style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 8 }}>
                  {c.description}
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border)', paddingTop: 8,
                }}>
                  <div style={{ marginBottom: 3 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Passive:</span> {c.passive.name}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Kill:</span> {c.killCondition}
                  </div>
                </div>
                {/* Stat bars */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[
                    { label: 'ATK', val: c.stats?.attack || 50, color: '#ee6644' },
                    { label: 'DEF', val: c.stats?.defense || 50, color: '#4488cc' },
                    { label: 'WIL', val: c.stats?.willpower || 50, color: '#aa66ee' },
                    { label: 'TGH', val: c.stats?.toughness || 50, color: '#66cc44' },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1 }}>
                      <div style={{ fontSize: 8, color: s.color, letterSpacing: 1, marginBottom: 2 }}>{s.label}</div>
                      <div style={{ height: 4, background: '#0a1525', border: '1px solid #1a2a3a' }}>
                        <div style={{
                          height: '100%',
                          width: isSel ? `${s.val}%` : '0%',
                          background: `linear-gradient(90deg, ${s.color}, ${s.color}88)`,
                          transition: 'width 0.5s ease 0.1s',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Move Preview Panel (appears when selected) ── */}
      {selectedChar && showMoves && (
        <div style={{
          background: '#0a1220', border: `1px solid ${selectedChar.color}30`,
          padding: '14px 18px', maxWidth: 880, width: '100%',
          position: 'relative', zIndex: 1,
          opacity: showMoves ? 1 : 0, transition: 'all 0.4s ease',
          transform: showMoves ? 'translateY(0)' : 'translateY(10px)',
        }}>
          <div style={{
            fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase',
            letterSpacing: 2, marginBottom: 10,
          }}>
            Moveset — {selectedChar.name}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selectedChar.moves.map((move, i) => (
              <div key={move.id} style={{
                flex: '1 1 140px', padding: '8px 10px', minWidth: 140,
                background: move.isFinisher ? '#ff444410' : '#0f1a2a',
                border: `1px solid ${move.isFinisher ? '#ff444440' : '#1a2838'}`,
                opacity: 0,
                animation: `fadeSlideIn 0.3s ease ${i * 0.08}s forwards`,
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 3,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: move.isFinisher ? '#ff4444' : selectedChar.color,
                  }}>
                    {move.name}
                  </span>
                  <span style={{
                    fontSize: 9, color: '#eab308', fontFamily: 'var(--font-mono)',
                  }}>
                    {move.minCost} SP
                  </span>
                </div>
                <div style={{ fontSize: 9, color: '#5a7a8a', lineHeight: 1.4 }}>
                  {move.flavor}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Start button ── */}
      <button
        disabled={!selected}
        onClick={() => selected && onSelect(selected)}
        className="btn"
        style={{
          padding: '14px 48px', fontSize: 14, fontWeight: 700, letterSpacing: 3,
          borderColor: selected ? characters[selected].color : 'var(--border)',
          color: selected ? characters[selected].color : 'var(--text-muted)',
          opacity: selected ? 1 : 0.3, transition: 'all 0.3s', position: 'relative', zIndex: 1,
          boxShadow: selected ? `0 0 20px ${characters[selected].color}22` : 'none',
          background: selected ? `${characters[selected].color}08` : 'transparent',
        }}
      >
        Enter Tournament
      </button>

      {/* ── Vex commentary ── */}
      <div className="npc-bar vex" style={{ maxWidth: 500, width: '100%', position: 'relative', zIndex: 1 }}>
        <div className="npc-name" style={{ color: 'var(--purple)' }}>Commander Vex</div>
        <div className="npc-text">{vexLine}</div>
      </div>
    </div>
  );
}
