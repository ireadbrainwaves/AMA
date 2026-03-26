import React, { useState, useEffect } from 'react';
import { characters } from '../data/characters';
import { findMutation } from '../data/mutations';

/**
 * VictoryScreen — Tournament Champion end screen.
 * Animated reveal of run stats, mutations collected, and Commander Vex commentary.
 */
export default function VictoryScreen({ stats, mutations, playerSpecies, scars, meta, techCount, onNewRun }) {
  const [phase, setPhase] = useState(0); // 0=title fade, 1=stats, 2=roster, 3=vex, 4=ready
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [glowPulse, setGlowPulse] = useState(0);

  const playerChar = characters[playerSpecies] || {};
  const totalFights = stats.defeated?.length || 0;
  const avgTurns = totalFights > 0 ? Math.round(stats.totalTurns / totalFights) : 0;
  const perfectRun = totalFights >= 4;
  const bestRun = (meta?.bestRun || 0);
  const isNewBest = totalFights > bestRun;

  // Animated phase progression
  useEffect(() => {
    const timers = [
      setTimeout(() => setTitleOpacity(1), 100),
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 3200),
      setTimeout(() => setPhase(4), 4200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Glow pulse animation
  useEffect(() => {
    const interval = setInterval(() => setGlowPulse(Date.now()), 50);
    return () => clearInterval(interval);
  }, []);

  const glowAlpha = 0.15 + 0.1 * Math.sin(glowPulse * 0.003);

  // Vex commentary based on performance
  const vexLine = (() => {
    const runs = meta?.totalRuns || 0;
    const wins = meta?.totalWins || 0;
    if (perfectRun && stats.totalTurns < 30) return '"Flawless execution. The arena hasn\'t seen speed like that since the Kepler Incident."';
    if (perfectRun && scars?.length === 0) return '"Not a single scar. Either you\'re that good, or they weren\'t trying. ...You\'re that good."';
    if (perfectRun) return '"Four down, none standing. That\'s what a champion looks like."';
    if (wins >= 5) return '"Another trophy for the collection. The crowd knows your name now."';
    if (isNewBest) return '"New personal best. You\'re getting sharper every run."';
    if (runs >= 10) return '"Veteran status. The rookies whisper about you in the corridors."';
    return '"Tournament champion. Not bad for an upstart from the outer ring."';
  })();

  const s = {
    container: {
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20,
      background: `radial-gradient(ellipse at 50% 30%, rgba(0,255,136,${glowAlpha}) 0%, transparent 60%), #060a10`,
      position: 'relative', overflow: 'hidden',
    },
    title: {
      fontSize: 52, fontWeight: 800, fontFamily: 'var(--font-display)',
      textTransform: 'uppercase', letterSpacing: 4,
      background: 'linear-gradient(135deg, #00ff88, #44ffaa, #00ccff)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      opacity: titleOpacity, transition: 'opacity 1s ease',
      textShadow: 'none', filter: 'drop-shadow(0 0 20px rgba(0,255,136,0.4))',
    },
    subtitle: {
      fontSize: 14, color: '#6a8a9a', letterSpacing: 3, textTransform: 'uppercase',
      opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.6s ease',
    },
    card: {
      background: '#0a1220', border: '1px solid #1a2838', padding: 20,
      maxWidth: 480, width: '100%',
      opacity: phase >= 1 ? 1 : 0, transition: 'all 0.6s ease',
      transform: phase >= 1 ? 'translateY(0)' : 'translateY(10px)',
    },
    statRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '6px 0', borderBottom: '1px solid #111a28',
    },
    statLabel: { fontSize: 12, color: '#6a8a9a' },
    statValue: { fontSize: 16, fontWeight: 700, color: '#e0f0f8', fontFamily: 'var(--font-mono)' },
  };

  return (
    <div style={s.container}>
      {/* Scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
      }} />

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={s.title}>Champion</div>
        <div style={s.subtitle}>
          {playerChar.name || 'Unknown'} — Tournament {(meta?.totalWins || 0)} Victory
        </div>
      </div>

      {/* Stats card */}
      <div style={s.card}>
        <div style={{ fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Run Statistics
        </div>

        <div style={s.statRow}>
          <span style={s.statLabel}>Fights Won</span>
          <span style={{ ...s.statValue, color: '#00ff88' }}>{totalFights}</span>
        </div>
        <div style={s.statRow}>
          <span style={s.statLabel}>Total Turns</span>
          <span style={s.statValue}>{stats.totalTurns}</span>
        </div>
        <div style={s.statRow}>
          <span style={s.statLabel}>Avg Turns/Fight</span>
          <span style={s.statValue}>{avgTurns}</span>
        </div>
        <div style={s.statRow}>
          <span style={s.statLabel}>Scars Earned</span>
          <span style={{ ...s.statValue, color: scars?.length > 0 ? '#ee6666' : '#44cc66' }}>
            {scars?.length || 0}
          </span>
        </div>
        <div style={s.statRow}>
          <span style={s.statLabel}>Tech Installed</span>
          <span style={s.statValue}>{techCount || 0}</span>
        </div>
        {isNewBest && (
          <div style={{ textAlign: 'center', padding: '8px 0', marginTop: 8, color: '#eab308', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>
            ★ NEW PERSONAL BEST ★
          </div>
        )}
      </div>

      {/* Defeated opponents */}
      <div style={{ ...s.card, opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(10px)' }}>
        <div style={{ fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Opponents Defeated
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(stats.defeated || []).map((key, i) => {
            const ch = characters[key];
            return (
              <div key={i} style={{
                padding: '6px 12px', background: `${ch?.color || '#666'}15`,
                border: `1px solid ${ch?.color || '#666'}40`,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: ch?.color || '#aaa' }}>
                  {ch?.name || key}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mutations collected */}
      {mutations && mutations.length > 0 && (
        <div style={{ ...s.card, opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(10px)' }}>
          <div style={{ fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
            Grafted Mutations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mutations.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #111a28' }}>
                <span style={{ fontSize: 12, color: '#8844cc' }}>{m.name}</span>
                <span style={{ fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase' }}>{m.slot}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vex commentary */}
      <div style={{
        ...s.card, borderLeft: '2px solid #00ff88',
        opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'translateY(0)' : 'translateY(10px)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#00ff88', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Commander Vex
        </div>
        <div style={{ fontSize: 12, color: '#6a8a9a', fontStyle: 'italic', lineHeight: 1.7 }}>
          {vexLine}
        </div>
      </div>

      {/* New Run button */}
      <button
        onClick={onNewRun}
        style={{
          padding: '16px 56px', fontSize: 16, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 3, background: 'transparent', color: '#00ff88',
          border: '2px solid #00ff88', cursor: 'pointer',
          opacity: phase >= 4 ? 1 : 0, transition: 'all 0.6s ease',
          transform: phase >= 4 ? 'translateY(0)' : 'translateY(10px)',
        }}
        onMouseEnter={e => { e.target.style.background = 'rgba(0,255,136,0.1)'; }}
        onMouseLeave={e => { e.target.style.background = 'transparent'; }}
      >
        New Run
      </button>
    </div>
  );
}
