import React, { useState } from 'react';
import { characters } from '../data/characters';
import SPRITES from '../data/spriteMap';

const PLAYABLE = ['cyberGorilla', 'psychoSquid', 'beeSwarm', 'terrorPinTurtle'];

export default function CharacterSelect({ onSelect, meta }) {
  const [selected, setSelected] = useState(null);
  const runNum = (meta?.totalRuns || 0) + 1;
  const bestRun = meta?.bestRun || 0;
  const record = `${meta?.totalWins || 0}W - ${meta?.totalLosses || 0}L`;

  return (
    <div className="screen" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24,
      background: 'linear-gradient(180deg, #050810 0%, #0a1020 40%, #0f1830 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background atmosphere */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(0,204,255,0.04) 0%, transparent 60%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
        background: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
      }} />

      {/* Title */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: 10, color: 'var(--cyan)', letterSpacing: 4, textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          // intergalactic strongman tournament
        </div>
        <h1 style={{
          fontSize: 38, fontWeight: 800, letterSpacing: -1, textTransform: 'uppercase',
          color: 'var(--text-bright)', lineHeight: 1.1,
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

      {/* Run stats */}
      <div style={{
        display: 'flex', gap: 16, fontSize: 10, color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)', letterSpacing: 1, position: 'relative', zIndex: 1,
      }}>
        <span>RUN #{runNum}</span>
        {bestRun > 0 && <span style={{ color: 'var(--text-secondary)' }}>Best: {bestRun}/4</span>}
        {(meta?.totalRuns || 0) > 0 && <span style={{ color: 'var(--text-secondary)' }}>Record: {record}</span>}
      </div>

      {/* Character grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12, width: '100%', maxWidth: 880, position: 'relative', zIndex: 1,
      }}>
        {PLAYABLE.map(key => {
          const c = characters[key];
          const isSel = selected === key;
          const sprite = SPRITES[key]?.front;
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              style={{
                background: isSel ? '#0a1a2e' : 'var(--bg-card)',
                border: `1px solid ${isSel ? c.color : 'var(--border)'}`,
                padding: 0, textAlign: 'left', color: 'var(--text-primary)',
                transition: 'all 0.2s', overflow: 'hidden',
                boxShadow: isSel ? `0 0 24px ${c.color}22, inset 0 0 30px ${c.color}08` : 'none',
              }}
            >
              {/* Sprite + name header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                borderBottom: `1px solid ${isSel ? c.color + '44' : 'var(--border)'}`,
                background: isSel ? `${c.color}08` : 'transparent',
              }}>
                {sprite && (
                  <img src={sprite} alt={c.name} style={{
                    width: 40, height: 40, imageRendering: 'pixelated',
                    objectFit: 'contain', filter: isSel ? 'none' : 'brightness(0.6)',
                    transition: 'filter 0.2s',
                  }} />
                )}
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: isSel ? c.color : 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: 1, transition: 'color 0.2s',
                  }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>
                    {key === 'cyberGorilla' ? 'HEAVY HITTER' :
                     key === 'psychoSquid' ? 'MENTALIST' :
                     key === 'beeSwarm' ? 'ATTRITION' : 'FORTRESS'}
                  </div>
                </div>
              </div>

              {/* Stats area */}
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
                {/* Stat bars (compact) */}
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
                        <div style={{ height: '100%', width: `${s.val}%`, background: s.color, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Start button */}
      <button
        disabled={!selected}
        onClick={() => selected && onSelect(selected)}
        className="btn"
        style={{
          padding: '14px 48px', fontSize: 14, fontWeight: 700, letterSpacing: 3,
          borderColor: selected ? characters[selected].color : 'var(--border)',
          color: selected ? characters[selected].color : 'var(--text-muted)',
          opacity: selected ? 1 : 0.3, transition: 'all 0.2s', position: 'relative', zIndex: 1,
          boxShadow: selected ? `0 0 20px ${characters[selected].color}22` : 'none',
        }}
      >
        Enter Tournament
      </button>

      {/* Vex commentary */}
      <div className="npc-bar vex" style={{ maxWidth: 500, width: '100%', position: 'relative', zIndex: 1 }}>
        <div className="npc-name" style={{ color: 'var(--purple)' }}>Commander Vex</div>
        <div className="npc-text">
          {runNum <= 1
            ? '"New contestant. Pick your species. I\'ll handle the rest."'
            : runNum <= 3
            ? `"Run ${runNum}. Your record speaks for itself. Or doesn't."`
            : `"Still here? Good. The crowd remembers persistence."`}
        </div>
      </div>
    </div>
  );
}
