import React, { useState, useEffect, useRef } from 'react';
import { characters } from '../data/characters';

/**
 * DefeatScreen — Run ended in defeat.
 * Atmospheric, moody screen with glitch FX, animated stats,
 * falling ember particles, and Commander Vex commentary.
 */

// ── Animated counter hook ─────────────────────────────────
function useCountUp(target, duration = 800, active = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || target <= 0) { setValue(target); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [target, duration, active]);
  return value;
}

// ── Falling ember particles ───────────────────────────────
function Embers({ count = 20 }) {
  const embers = useRef(
    Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      speed: 0.5 + Math.random() * 1,
      delay: Math.random() * 8,
      opacity: 0.15 + Math.random() * 0.3,
      drift: (Math.random() - 0.5) * 30,
    }))
  ).current;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {embers.map((e, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${e.x}%`,
          top: '-4px',
          width: e.size,
          height: e.size,
          borderRadius: '50%',
          background: i % 3 === 0 ? '#ee6666' : '#cc4444',
          opacity: e.opacity,
          boxShadow: `0 0 ${e.size * 3}px ${i % 3 === 0 ? '#ee666680' : '#cc444480'}`,
          animation: `emberFall ${8 / e.speed}s linear ${e.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes emberFall {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          5% { opacity: 0.6; }
          85% { opacity: 0.2; }
          100% { transform: translateY(100vh) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Glitch title ──────────────────────────────────────────
function GlitchTitle() {
  const [glitchFrame, setGlitchFrame] = useState(0);

  useEffect(() => {
    // Initial heavy glitch burst
    const burstTimers = [];
    for (let i = 0; i < 6; i++) {
      burstTimers.push(setTimeout(() => setGlitchFrame(f => f + 1), 100 + i * 60));
    }
    // Settle
    burstTimers.push(setTimeout(() => setGlitchFrame(-1), 600));

    // Occasional random glitches
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        setGlitchFrame(f => f + 1);
        setTimeout(() => setGlitchFrame(-1), 80 + Math.random() * 120);
      }
    }, 2000);

    return () => { burstTimers.forEach(clearTimeout); clearInterval(interval); };
  }, []);

  const isGlitching = glitchFrame >= 0 && glitchFrame % 2 === 0;
  const offset = isGlitching ? (Math.random() * 6 - 3) : 0;

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      {/* Red shadow layer */}
      {isGlitching && (
        <div style={{
          position: 'absolute', top: 0, left: offset - 2,
          fontSize: 56, fontWeight: 900, fontFamily: 'var(--font-display)',
          textTransform: 'uppercase', letterSpacing: 6, color: '#ff0000',
          opacity: 0.6, clipPath: 'inset(10% 0 30% 0)',
        }}>DEFEATED</div>
      )}
      {/* Blue shadow layer */}
      {isGlitching && (
        <div style={{
          position: 'absolute', top: 0, left: offset + 2,
          fontSize: 56, fontWeight: 900, fontFamily: 'var(--font-display)',
          textTransform: 'uppercase', letterSpacing: 6, color: '#0066ff',
          opacity: 0.5, clipPath: 'inset(50% 0 0% 0)',
        }}>DEFEATED</div>
      )}
      {/* Main text */}
      <div style={{
        fontSize: 56, fontWeight: 900, fontFamily: 'var(--font-display)',
        textTransform: 'uppercase', letterSpacing: 6, lineHeight: 1.1,
        color: '#ee6666',
        textShadow: isGlitching
          ? `${offset}px 0 #ff0000, ${-offset}px 0 #0066ff`
          : '0 0 30px rgba(238,102,102,0.35)',
        transform: isGlitching ? `translateX(${offset * 0.5}px)` : 'none',
        transition: isGlitching ? 'none' : 'all 0.1s ease',
      }}>
        DEFEATED
      </div>
    </div>
  );
}

export default function DefeatScreen({ stats, playerSpecies, killedBy, mutations, scars, meta, fightNumber, onNewRun }) {
  const [phase, setPhase] = useState(0);

  const playerChar = characters[playerSpecies] || {};
  const killerChar = characters[killedBy] || {};
  const totalFights = stats.defeated?.length || 0;
  const runs = meta?.totalRuns || 0;
  const wins = meta?.totalWins || 0;
  const losses = meta?.totalLosses || 0;

  // Animated counters
  const fightDisplay = useCountUp(totalFights, 600, phase >= 1);
  const turnDisplay = useCountUp(stats.totalTurns, 800, phase >= 1);
  const scarDisplay = useCountUp(scars?.length || 0, 500, phase >= 1);
  const runsDisplay = useCountUp(runs, 700, phase >= 2);
  const winsDisplay = useCountUp(wins, 700, phase >= 2);
  const lossDisplay = useCountUp(losses, 700, phase >= 2);

  // Phased reveal
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),   // run summary
      setTimeout(() => setPhase(2), 1600),   // career + opponents
      setTimeout(() => setPhase(3), 2400),   // vex + button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Vex commentary — deeply contextual
  const vexLine = (() => {
    if (runs <= 1) return '"Get up." ... "Or don\'t. There\'s always next season."';
    if (fightNumber === 1 && totalFights === 0) return '"First fight? Really? ...We\'ll work on it. Everyone starts somewhere."';
    if (fightNumber === 4) return '"You made it to the final. That\'s more than most can say. Come back hungrier."';
    if (killedBy === 'parasitex') return '"The Parasitex is... different. It learns. It steals. Next time, don\'t let it get inside your head. Or your grafts."';
    if (killedBy === 'echomorph') return '"The Echomorph adapts. You can\'t use the same trick twice. Variety is survival against that thing."';
    if (killedBy === 'hydravine') return '"Hydravine outlasts everyone. You need to hit harder, faster. Don\'t let it root. Chip damage is futile."';
    if (losses >= 10 && wins === 0) return '"...I respect the persistence more than you know. But maybe try a different species. Just a thought."';
    if (losses >= 5 && wins === 0) return '"Persistence. I respect that more than talent. But talent would help."';
    if (wins >= 5) return '"Even champions fall. The crowd remembers your record, not this moment."';
    if (scars?.length >= 4) return '"Those scars are piling up. Your body\'s taking a beating. Maybe visit Dr. Helix before your next run."';
    if (scars?.length >= 2) return '"Battle scars. Wear them or fix them. Either way, learn from them."';
    if (fightNumber === 2 && totalFights === 1) return '"One down, three to go... or not. The second fight always separates pretenders from contenders."';
    if (fightNumber === 3) return '"Three fights deep. You were close to something. Close isn\'t good enough in the arena."';
    if (mutations?.length >= 3) return '"All those grafts and still fell. Maybe the build needs rethinking. Or maybe you just need practice."';
    if (runs >= 15) return '"At this point the tournament is YOUR story. Write a better chapter. I believe you can."';
    if (runs >= 10) return '"Run after run. Season after season. That\'s what separates the forgettable from the unforgettable."';
    if (totalFights >= 2) return '"You took down ${totalFights} before falling. Not bad. Not great. Let\'s fix that."'.replace('${totalFights}', totalFights);
    return `"Run ${runs}. Record: ${wins}-${losses}. Get back in there."`;
  })();

  const fadeIn = (p, delay = 0) => ({
    opacity: phase >= p ? 1 : 0,
    transition: `all 0.6s ease ${delay}s`,
    transform: phase >= p ? 'translateY(0)' : 'translateY(14px)',
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px 16px', gap: 16,
      background: '#060a10', position: 'relative', overflow: 'hidden',
    }}>
      {/* Red radial bleed */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(180,40,40,0.1) 0%, transparent 55%)',
      }} />

      {/* Noise scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* Ember particles */}
      <Embers count={18} />

      {/* ── Title ── */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <GlitchTitle />
        <div style={{
          fontSize: 13, color: '#4a6a7a', letterSpacing: 2, textTransform: 'uppercase',
          marginTop: 8, opacity: phase >= 0 ? 1 : 0, transition: 'opacity 0.8s ease 0.5s',
        }}>
          {playerChar.name || 'Unknown'} fell to{' '}
          <span style={{ color: killerChar.color || '#ee6666', fontWeight: 600 }}>
            {killerChar.name || 'Unknown'}
          </span>
        </div>
      </div>

      {/* ── Run Summary Card ── */}
      <div style={{
        background: '#0a1220', border: '1px solid #1a2838', padding: 18,
        maxWidth: 440, width: '100%', zIndex: 1, ...fadeIn(1),
      }}>
        <div style={{
          fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase',
          letterSpacing: 2, marginBottom: 12,
        }}>
          Run Summary
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
          <StatBlock label="Survived" value={`${fightDisplay} fight${totalFights !== 1 ? 's' : ''}`} color="#e0f0f8" />
          <StatBlock label="Total Turns" value={turnDisplay} color="#e0f0f8" />
          <StatBlock label="Fell In Fight" value={`#${fightNumber || '?'}`} color="#ee6666" />
          <StatBlock label="Scars" value={scarDisplay} color={(scars?.length || 0) > 0 ? '#ee6666' : '#44cc66'} />
        </div>

        {/* Defeated opponents */}
        {totalFights > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #111a28' }}>
            <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Defeated</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(stats.defeated || []).map((key, i) => {
                const ch = characters[key];
                return (
                  <span key={i} style={{
                    fontSize: 11, color: ch?.color || '#6a8a9a', padding: '3px 10px',
                    border: `1px solid ${ch?.color || '#333'}35`,
                    background: `${ch?.color || '#333'}10`,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: ch?.color || '#666', display: 'inline-block',
                    }} />
                    {ch?.name || key}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Mutations at time of death */}
        {mutations && mutations.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #111a28' }}>
            <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Mutations Grafted</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {mutations.map((m, i) => (
                <span key={i} style={{
                  fontSize: 10, color: '#8844cc', padding: '2px 8px',
                  border: '1px solid #88228830', background: '#88228810',
                }}>
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Career Record ── */}
      <div style={{
        background: '#0a1220', border: '1px solid #1a2838', padding: 18,
        maxWidth: 440, width: '100%', zIndex: 1, ...fadeIn(2),
      }}>
        <div style={{ fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Career Record
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#e0f0f8', fontFamily: 'var(--font-mono)' }}>{runsDisplay}</div>
            <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase' }}>Runs</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#00ff88', fontFamily: 'var(--font-mono)' }}>{winsDisplay}</div>
            <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase' }}>Wins</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ee6666', fontFamily: 'var(--font-mono)' }}>{lossDisplay}</div>
            <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase' }}>Losses</div>
          </div>
        </div>
      </div>

      {/* ── Vex Commentary ── */}
      <div style={{
        background: '#0a1220', border: '1px solid #1a2838',
        borderLeft: '2px solid #aa66ee', padding: 18,
        maxWidth: 440, width: '100%', zIndex: 1, ...fadeIn(3),
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#aa66ee',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#aa66ee',
            boxShadow: '0 0 8px #aa66ee', display: 'inline-block',
          }} />
          Commander Vex
        </div>
        <div style={{ fontSize: 13, color: '#7a9aaa', fontStyle: 'italic', lineHeight: 1.8 }}>
          {vexLine}
        </div>
      </div>

      {/* ── Try Again Button ── */}
      <button
        onClick={onNewRun}
        className="btn"
        style={{
          padding: '14px 40px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 2, background: 'transparent', color: '#6a8a9a',
          border: '1px solid #2a3a4a', cursor: 'pointer', zIndex: 1,
          ...fadeIn(3, 0.2),
        }}
        onMouseEnter={e => {
          e.target.style.borderColor = '#ee6666';
          e.target.style.color = '#ee6666';
          e.target.style.boxShadow = '0 0 15px rgba(238,102,102,0.15)';
        }}
        onMouseLeave={e => {
          e.target.style.borderColor = '#2a3a4a';
          e.target.style.color = '#6a8a9a';
          e.target.style.boxShadow = 'none';
        }}
      >
        Try Again
      </button>
    </div>
  );
}

function StatBlock({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
      <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  );
}
