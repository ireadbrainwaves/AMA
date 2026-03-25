import React from 'react';
import { TYPE_MATCHUPS } from '../data/matchups';
import { TYPE_COLORS, TYPE_LABELS } from '../data/characters';

function TypeBadge({ type }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 10,
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      background: TYPE_COLORS[type] || '#666', color: '#fff', minWidth: 55, textAlign: 'center',
    }}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

export default function MatchupGuide({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 28, maxWidth: 480, width: '90%',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Type Matchups</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 18, color: 'var(--text-muted)', padding: 4,
          }}>ESC</button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Winner deals <strong>full damage</strong>. Loser deals <strong>half damage</strong>.
          No advantage = both land at full.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TYPE_MATCHUPS.map((m, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <TypeBadge type={m.attacker} />
              <span style={{ fontSize: 14, color: 'var(--win)', fontWeight: 700 }}>beats</span>
              <TypeBadge type={m.beats} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', flex: 1, textAlign: 'right' }}>
                {m.reason}
              </span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16, textAlign: 'center' }}>
          Press M or ESC to close
        </div>
      </div>
    </div>
  );
}
