import React from 'react';
import { characters } from '../data/characters';

export default function VictoryScreen({ stats, mutations, onNewRun }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 24 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: 'var(--stamina)', textTransform: 'uppercase', letterSpacing: 2 }}>
        Tournament Champion
      </h1>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 400, width: '100%' }}>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Run Stats</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{stats.totalTurns} Total Turns</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>{stats.defeated.length} opponents defeated</div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Defeated</div>
          {stats.defeated.map((key, i) => (
            <div key={i} style={{ fontSize: 14, color: characters[key]?.color || 'var(--text-primary)', marginBottom: 4 }}>
              {characters[key]?.name || key}
            </div>
          ))}
        </div>

        {mutations.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Mutations</div>
            {mutations.map((m, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--composure)', marginBottom: 4 }}>{m.name}</div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onNewRun}
        style={{
          padding: '16px 48px', fontSize: 18, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 2, background: 'var(--stamina)', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-md)', marginTop: 12,
        }}
      >
        New Run
      </button>
    </div>
  );
}
