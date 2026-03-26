import React, { useState, useEffect, useRef } from 'react';
import { characters } from '../data/characters';

/**
 * VictoryScreen — Tournament Champion end screen.
 * Cinematic phased reveal with animated counters, performance grade,
 * floating particles, character showcase, and Commander Vex commentary.
 */

// ── Animated counter hook ─────────────────────────────────
function useCountUp(target, duration = 1200, active = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || target <= 0) { setValue(target); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [target, duration, active]);
  return value;
}

// ── Performance grade calculator ──────────────────────────
function getPerformanceGrade(stats, scars, totalFights) {
  let score = 0;
  // Fights won
  score += totalFights * 25; // max 100
  // Speed bonus (fewer turns = better)
  if (stats.totalTurns < 20) score += 40;
  else if (stats.totalTurns < 30) score += 30;
  else if (stats.totalTurns < 40) score += 20;
  else if (stats.totalTurns < 50) score += 10;
  // Scar penalty
  score -= (scars?.length || 0) * 15;

  if (score >= 120) return { grade: 'S', color: '#eab308', glow: '#eab30880', label: 'PERFECT' };
  if (score >= 100) return { grade: 'A', color: '#00ff88', glow: '#00ff8860', label: 'EXCELLENT' };
  if (score >= 75) return { grade: 'B', color: '#44aaff', glow: '#44aaff50', label: 'GREAT' };
  if (score >= 50) return { grade: 'C', color: '#6a8a9a', glow: '#6a8a9a40', label: 'GOOD' };
  return { grade: 'D', color: '#ee6666', glow: '#ee666640', label: 'SURVIVED' };
}

// ── Floating particle component ───────────────────────────
function Particles({ color = '#00ff88', count = 30 }) {
  const particles = useRef(
    Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      speed: 0.3 + Math.random() * 0.8,
      delay: Math.random() * 5,
      opacity: 0.1 + Math.random() * 0.4,
      drift: (Math.random() - 0.5) * 0.3,
    }))
  ).current;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`,
          bottom: `-${p.size}px`,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: color,
          opacity: p.opacity,
          boxShadow: `0 0 ${p.size * 2}px ${color}`,
          animation: `floatUp ${6 / p.speed}s linear ${p.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-100vh) translateX(${30}px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Grade reveal animation ────────────────────────────────
function GradeReveal({ grade, active }) {
  const [revealed, setRevealed] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!active) return;
    const t1 = setTimeout(() => setFlash(true), 0);
    const t2 = setTimeout(() => { setRevealed(true); setFlash(false); }, 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active]);

  if (!active) return null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      opacity: revealed ? 1 : 0, transition: 'opacity 0.6s ease',
    }}>
      <div style={{
        fontSize: 80, fontWeight: 900, fontFamily: 'var(--font-display)',
        color: grade.color,
        textShadow: flash
          ? `0 0 60px ${grade.glow}, 0 0 120px ${grade.glow}`
          : `0 0 30px ${grade.glow}`,
        transform: revealed ? 'scale(1)' : 'scale(2)',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        lineHeight: 1,
      }}>
        {grade.grade}
      </div>
      <div style={{
        fontSize: 11, color: grade.color, letterSpacing: 4, textTransform: 'uppercase',
        fontWeight: 700, opacity: 0.8,
      }}>
        {grade.label}
      </div>
    </div>
  );
}

export default function VictoryScreen({ stats, mutations, playerSpecies, scars, meta, techCount, onNewRun }) {
  const [phase, setPhase] = useState(0);
  const [titleLetters, setTitleLetters] = useState(0);
  const [showGrade, setShowGrade] = useState(false);

  const playerChar = characters[playerSpecies] || {};
  const totalFights = stats.defeated?.length || 0;
  const avgTurns = totalFights > 0 ? Math.round(stats.totalTurns / totalFights) : 0;
  const perfectRun = totalFights >= 4;
  const bestRun = meta?.bestRun || 0;
  const isNewBest = totalFights > bestRun;
  const runs = meta?.totalRuns || 0;
  const wins = meta?.totalWins || 0;
  const grade = getPerformanceGrade(stats, scars, totalFights);

  // Animated counters (activate when stats card appears)
  const fightsDisplay = useCountUp(totalFights, 800, phase >= 2);
  const turnsDisplay = useCountUp(stats.totalTurns, 1000, phase >= 2);
  const avgDisplay = useCountUp(avgTurns, 800, phase >= 2);
  const scarsDisplay = useCountUp(scars?.length || 0, 600, phase >= 2);
  const techDisplay = useCountUp(techCount || 0, 600, phase >= 2);
  const runsDisplay = useCountUp(runs, 800, phase >= 4);
  const winsDisplay = useCountUp(wins, 800, phase >= 4);

  // Phased animation timeline
  useEffect(() => {
    const title = 'CHAMPION';
    const letterTimers = [];
    for (let i = 0; i <= title.length; i++) {
      letterTimers.push(setTimeout(() => setTitleLetters(i), 200 + i * 80));
    }

    const timers = [
      setTimeout(() => setPhase(1), 200 + title.length * 80 + 300), // subtitle
      setTimeout(() => setPhase(2), 200 + title.length * 80 + 800), // stats
      setTimeout(() => setPhase(3), 200 + title.length * 80 + 1600), // opponents + mutations
      setTimeout(() => setShowGrade(true), 200 + title.length * 80 + 2200), // grade reveal
      setTimeout(() => setPhase(4), 200 + title.length * 80 + 3000), // career + vex
      setTimeout(() => setPhase(5), 200 + title.length * 80 + 3800), // button
    ];
    return () => { [...letterTimers, ...timers].forEach(clearTimeout); };
  }, []);

  // Vex commentary — rich contextual dialogue
  const vexLine = (() => {
    if (perfectRun && stats.totalTurns < 20) return '"Flawless execution. The arena hasn\'t seen speed like that since the Kepler Incident. They\'ll be talking about this for cycles."';
    if (perfectRun && (scars?.length || 0) === 0) return '"Not a single scar. Either you\'re that good, or they weren\'t trying. ...You\'re that good."';
    if (perfectRun && avgTurns <= 5) return '"Speed kills. You didn\'t give them time to breathe. That\'s how legends fight."';
    if (perfectRun) return '"Four down, none standing. That\'s what a champion looks like. The outer ring sends its regards."';
    if (grade.grade === 'S') return '"S-rank performance. I\'ve managed fighters for twenty cycles. You\'re in the top three. Don\'t let it go to your head."';
    if (wins >= 10) return '"Double digits. You\'ve transcended \\"champion.\\" You\'re an institution now."';
    if (wins >= 5) return '"Another trophy for the collection. The crowd knows your name. They chant it in the corridors."';
    if (isNewBest) return '"New personal best. You\'re getting sharper every run. I can see it in the way you move."';
    if (runs >= 10 && wins >= 3) return '"Veteran champion. The rookies study your fight tapes. Give them something new to analyze."';
    if (runs >= 10) return '"Veteran status. The rookies whisper about you in the corridors. They should be afraid."';
    if (techCount >= 3) return '"All that tech paid off. Dr. Ark will be insufferable about this. Don\'t tell him I said that."';
    if ((scars?.length || 0) >= 3) return '"Champion with battle scars. Respect. Those marks tell a story of someone who refused to quit."';
    if (mutations?.length >= 4) return '"Fully loaded with grafts and still standing. Dr. Helix outdid herself this time."';
    return '"Tournament champion. Not bad for an upstart from the outer ring. Get some rest. Next season starts soon."';
  })();

  const fadeIn = (p, delay = 0) => ({
    opacity: phase >= p ? 1 : 0,
    transition: `all 0.6s ease ${delay}s`,
    transform: phase >= p ? 'translateY(0)' : 'translateY(16px)',
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px 16px', gap: 16,
      background: '#060a10', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(0,255,136,0.12) 0%, transparent 55%)',
      }} />

      {/* Scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
      }} />

      {/* Floating particles */}
      <Particles color={grade.grade === 'S' ? '#eab308' : '#00ff88'} count={25} />

      {/* ── Title: letter-by-letter reveal ── */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: 56, fontWeight: 900, fontFamily: 'var(--font-display)',
          textTransform: 'uppercase', letterSpacing: 6, lineHeight: 1.1,
          display: 'flex', justifyContent: 'center', gap: 2,
        }}>
          {'CHAMPION'.split('').map((letter, i) => (
            <span key={i} style={{
              display: 'inline-block',
              background: i < titleLetters
                ? 'linear-gradient(135deg, #00ff88, #44ffaa, #00ccff)'
                : 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: i < titleLetters ? 'transparent' : 'rgba(0,0,0,0)',
              filter: i < titleLetters ? 'drop-shadow(0 0 20px rgba(0,255,136,0.5))' : 'none',
              transition: 'all 0.3s ease',
              transform: i < titleLetters ? 'translateY(0)' : 'translateY(-10px)',
            }}>
              {letter}
            </span>
          ))}
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 13, color: '#6a8a9a', letterSpacing: 3, textTransform: 'uppercase',
          marginTop: 8, ...fadeIn(1),
        }}>
          {playerChar.name || 'Unknown'} — Tournament {wins} Victory
        </div>
      </div>

      {/* ── Performance Grade ── */}
      <GradeReveal grade={grade} active={showGrade} />

      {/* ── Stats Card ── */}
      <div style={{
        background: '#0a1220', border: '1px solid #1a2838', padding: 20,
        maxWidth: 480, width: '100%', position: 'relative', zIndex: 1,
        ...fadeIn(2),
      }}>
        <div style={{
          fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase',
          letterSpacing: 2, marginBottom: 14, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>Run Statistics</span>
          {isNewBest && (
            <span style={{
              color: '#eab308', fontSize: 10, fontWeight: 700, letterSpacing: 1,
              animation: 'pulse 2s ease infinite',
            }}>
              ★ NEW BEST ★
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
          <StatRow label="Fights Won" value={fightsDisplay} color="#00ff88" />
          <StatRow label="Total Turns" value={turnsDisplay} color="#e0f0f8" />
          <StatRow label="Avg Turns/Fight" value={avgDisplay} color="#e0f0f8" />
          <StatRow label="Scars Earned" value={scarsDisplay} color={scarsDisplay > 0 ? '#ee6666' : '#44cc66'} />
          <StatRow label="Tech Installed" value={techDisplay} color="#44aaff" />
          <StatRow label="Mutations" value={mutations?.length || 0} color="#8844cc" />
        </div>

        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>

      {/* ── Defeated Opponents ── */}
      <div style={{
        background: '#0a1220', border: '1px solid #1a2838', padding: 18,
        maxWidth: 480, width: '100%', zIndex: 1, ...fadeIn(3),
      }}>
        <div style={{ fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Opponents Defeated
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(stats.defeated || []).map((key, i) => {
            const ch = characters[key];
            return (
              <div key={i} style={{
                padding: '8px 14px', background: `${ch?.color || '#666'}12`,
                border: `1px solid ${ch?.color || '#666'}35`,
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: phase >= 3 ? 1 : 0,
                transition: `all 0.4s ease ${i * 0.15}s`,
                transform: phase >= 3 ? 'translateX(0)' : 'translateX(-10px)',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: ch?.color || '#666',
                  boxShadow: `0 0 6px ${ch?.color || '#666'}`,
                }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: ch?.color || '#aaa' }}>
                  {ch?.name || key}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Grafted Mutations ── */}
      {mutations && mutations.length > 0 && (
        <div style={{
          background: '#0a1220', border: '1px solid #1a2838', padding: 18,
          maxWidth: 480, width: '100%', zIndex: 1, ...fadeIn(3, 0.2),
        }}>
          <div style={{ fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
            Grafted Mutations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mutations.map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '5px 0',
                borderBottom: '1px solid #111a28',
              }}>
                <span style={{ fontSize: 12, color: '#8844cc', fontWeight: 500 }}>{m.name}</span>
                <span style={{ fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase' }}>{m.slot}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Career Record ── */}
      <div style={{
        background: '#0a1220', border: '1px solid #1a2838', padding: 18,
        maxWidth: 480, width: '100%', zIndex: 1, ...fadeIn(4),
      }}>
        <div style={{ fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Career Record
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#e0f0f8', fontFamily: 'var(--font-mono)' }}>{runsDisplay}</div>
            <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase' }}>Runs</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#00ff88', fontFamily: 'var(--font-mono)' }}>{winsDisplay}</div>
            <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase' }}>Wins</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#6a8a9a', fontFamily: 'var(--font-mono)' }}>
              {runs > 0 ? Math.round((wins / runs) * 100) : 0}%
            </div>
            <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase' }}>Win Rate</div>
          </div>
        </div>
      </div>

      {/* ── Vex Commentary ── */}
      <div style={{
        background: '#0a1220', borderLeft: '2px solid #00ff88', border: '1px solid #1a2838',
        borderLeftColor: '#00ff88', borderLeftWidth: 2,
        padding: 18, maxWidth: 480, width: '100%', zIndex: 1, ...fadeIn(4, 0.2),
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#00ff88',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#00ff88',
            boxShadow: '0 0 8px #00ff88', display: 'inline-block',
          }} />
          Commander Vex
        </div>
        <div style={{ fontSize: 13, color: '#8aaabc', fontStyle: 'italic', lineHeight: 1.8 }}>
          {vexLine}
        </div>
      </div>

      {/* ── New Run Button ── */}
      <button
        onClick={onNewRun}
        style={{
          padding: '16px 56px', fontSize: 15, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 3, background: 'transparent', color: '#00ff88',
          border: '2px solid #00ff88', cursor: 'pointer', position: 'relative', zIndex: 1,
          ...fadeIn(5),
        }}
        onMouseEnter={e => {
          e.target.style.background = 'rgba(0,255,136,0.1)';
          e.target.style.boxShadow = '0 0 20px rgba(0,255,136,0.2)';
        }}
        onMouseLeave={e => {
          e.target.style.background = 'transparent';
          e.target.style.boxShadow = 'none';
        }}
      >
        New Run
      </button>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0' }}>
      <span style={{ fontSize: 12, color: '#6a8a9a' }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}
