import React, { useState, useEffect } from 'react';
import { characters } from '../data/characters';

/**
 * DefeatScreen — Run ended in defeat.
 * Atmospheric, moody screen with Commander Vex commentary and run recap.
 */
export default function DefeatScreen({ stats, playerSpecies, killedBy, mutations, scars, meta, fightNumber, onNewRun }) {
  const [phase, setPhase] = useState(0);
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [glitch, setGlitch] = useState(false);

  const playerChar = characters[playerSpecies] || {};
  const killerChar = characters[killedBy] || {};
  const totalFights = stats.defeated?.length || 0;
  const runs = meta?.totalRuns || 0;
  const wins = meta?.totalWins || 0;
  const losses = meta?.totalLosses || 0;

  // Animated phase progression
  useEffect(() => {
    // Glitch flash on title appear
    const t0 = setTimeout(() => { setGlitch(true); }, 200);
    const t1 = setTimeout(() => { setGlitch(false); setTitleOpacity(1); }, 400);
    const t2 = setTimeout(() => setPhase(1), 1000);
    const t3 = setTimeout(() => setPhase(2), 1800);
    const t4 = setTimeout(() => setPhase(3), 2600);
    return () => [t0, t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  // Vex commentary — contextual based on performance
  const vexLine = (() => {
    if (runs <= 1) return '"Get up." ... "Or don\'t. There\'s always next season."';
    if (fightNumber === 1 && totalFights === 0) return '"First fight? Really? ...We\'ll work on it."';
    if (fightNumber === 4) return '"You made it to the final. That\'s more than most can say. Come back hungrier."';
    if (killedBy === 'parasitex') return '"The Parasitex is... different. It learns. Next time, don\'t let it get inside your head."';
    if (killedBy === 'echomorph') return '"The Echomorph adapts. You can\'t use the same trick twice. Remember that."';
    if (killedBy === 'hydravine') return '"Hydravine outlasts everyone. You need to hit harder, faster. Don\'t let it root."';
    if (losses >= 5 && wins === 0) return '"Persistence. I respect that more than talent. But talent would help."';
    if (wins >= 3) return '"Even champions fall. The crowd remembers your record, not this."';
    if (scars?.length >= 3) return '"Those scars are piling up. Maybe visit Dr. Helix before your next run."';
    if (runs >= 10) return '"At this point the tournament is YOUR story. Write a better chapter."';
    return `"Run ${runs}. Record: ${wins}-${losses}. Get back in there."`;
  })();

  const s = {
    container: {
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20,
      background: 'radial-gradient(ellipse at 50% 40%, rgba(180,40,40,0.08) 0%, transparent 60%), #060a10',
      position: 'relative', overflow: 'hidden',
    },
    title: {
      fontSize: 56, fontWeight: 800, fontFamily: 'var(--font-display)',
      textTransform: 'uppercase', letterSpacing: 6,
      color: '#ee6666',
      opacity: titleOpacity, transition: 'opacity 0.5s ease',
      textShadow: glitch ? '3px 0 #ff0000, -3px 0 #0000ff' : '0 0 30px rgba(238,102,102,0.3)',
    },
    subtitle: {
      fontSize: 13, color: '#4a6a7a', letterSpacing: 2, textTransform: 'uppercase',
      opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.6s ease',
    },
    card: {
      background: '#0a1220', border: '1px solid #1a2838', padding: 18,
      maxWidth: 440, width: '100%',
    },
    fadeIn: (p) => ({
      opacity: phase >= p ? 1 : 0, transition: 'all 0.6s ease',
      transform: phase >= p ? 'translateY(0)' : 'translateY(10px)',
    }),
  };

  return (
    <div style={s.container}>
      {/* Noise overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
      }} />

      {/* Title */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <div style={s.title}>Defeated</div>
        <div style={s.subtitle}>
          {playerChar.name || 'Unknown'} fell to {killerChar.name || 'Unknown'}
        </div>
      </div>

      {/* Run summary card */}
      <div style={{ ...s.card, ...s.fadeIn(1) }}>
        <div style={{ fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Run Summary
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
          <StatBlock label="Survived" value={`${totalFights} fight${totalFights !== 1 ? 's' : ''}`} color="#e0f0f8" />
          <StatBlock label="Total Turns" value={stats.totalTurns} color="#e0f0f8" />
          <StatBlock label="Fell In Fight" value={`#${fightNumber || '?'}`} color="#ee6666" />
          <StatBlock label="Scars" value={scars?.length || 0} color={scars?.length > 0 ? '#ee6666' : '#44cc66'} />
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
                    fontSize: 11, color: ch?.color || '#6a8a9a', padding: '2px 8px',
                    border: `1px solid ${ch?.color || '#333'}40`, background: `${ch?.color || '#333'}10`,
                  }}>
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
                <span key={i} style={{ fontSize: 10, color: '#8844cc', padding: '2px 6px', border: '1px solid #882288', background: '#88228810' }}>
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Career record */}
      <div style={{ ...s.card, ...s.fadeIn(2) }}>
        <div style={{ fontSize: 10, color: '#4a6a7a', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Career Record
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e0f0f8', fontFamily: 'var(--font-mono)' }}>{runs}</div>
            <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase' }}>Runs</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#00ff88', fontFamily: 'var(--font-mono)' }}>{wins}</div>
            <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase' }}>Wins</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ee6666', fontFamily: 'var(--font-mono)' }}>{losses}</div>
            <div style={{ fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase' }}>Losses</div>
          </div>
        </div>
      </div>

      {/* Vex commentary */}
      <div style={{
        ...s.card, borderLeft: '2px solid #aa66ee',
        ...s.fadeIn(3),
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#aa66ee', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Commander Vex
        </div>
        <div style={{ fontSize: 12, color: '#6a8a9a', fontStyle: 'italic', lineHeight: 1.7 }}>
          {vexLine}
        </div>
      </div>

      {/* New Run button */}
      <button
        onClick={onNewRun}
        className="btn"
        style={{
          padding: '14px 40px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 2, background: 'transparent', color: '#6a8a9a',
          border: '1px solid #2a3a4a', cursor: 'pointer',
          ...s.fadeIn(3),
        }}
        onMouseEnter={e => { e.target.style.borderColor = '#ee6666'; e.target.style.color = '#ee6666'; }}
        onMouseLeave={e => { e.target.style.borderColor = '#2a3a4a'; e.target.style.color = '#6a8a9a'; }}
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
