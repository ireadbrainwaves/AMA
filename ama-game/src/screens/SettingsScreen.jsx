import React, { useState } from 'react';
import { getMusicVolume, getSfxVolume, setMusicVolume, setSfxVolume, isMusicEnabled, setMusicEnabled } from '../engine/MusicManager';

/**
 * SettingsScreen — Volume sliders, music toggle, run history.
 * Renders as a modal overlay on the hub world.
 */
export default function SettingsScreen({ meta, onClose }) {
  const [musicVol, setMusicVol] = useState(() => Math.round(getMusicVolume() * 100));
  const [sfxVol, setSfxVol] = useState(() => Math.round(getSfxVolume() * 100));
  const [musicOn, setMusicOn] = useState(() => isMusicEnabled());

  const handleMusicVol = (e) => {
    const v = Number(e.target.value);
    setMusicVol(v);
    setMusicVolume(v / 100);
  };

  const handleSfxVol = (e) => {
    const v = Number(e.target.value);
    setSfxVol(v);
    setSfxVolume(v / 100);
  };

  const handleMusicToggle = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  };

  const runs = meta?.totalRuns || 0;
  const wins = meta?.totalWins || 0;
  const losses = meta?.totalLosses || 0;
  const bestRun = meta?.bestRun || 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#0a1220', border: '1px solid #1a2838', padding: 28,
        width: 400, maxHeight: '80vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24,
        }}>
          <div style={{
            fontSize: 16, fontWeight: 700, color: '#e0f0f8',
            textTransform: 'uppercase', letterSpacing: 3,
          }}>
            Settings
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #2a3a4a', color: '#6a8a9a',
            padding: '4px 12px', fontSize: 12, cursor: 'pointer',
          }}>
            Close
          </button>
        </div>

        {/* Audio Section */}
        <Section title="Audio">
          <SliderRow
            label="Music Volume"
            value={musicVol}
            onChange={handleMusicVol}
            color="#00ccff"
          />
          <SliderRow
            label="SFX Volume"
            value={sfxVol}
            onChange={handleSfxVol}
            color="#eab308"
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0',
          }}>
            <span style={{ fontSize: 12, color: '#8aaabc' }}>Music Enabled</span>
            <button onClick={handleMusicToggle} style={{
              background: musicOn ? '#00ccff15' : '#1a2838',
              border: `1px solid ${musicOn ? '#00ccff' : '#2a3a4a'}`,
              color: musicOn ? '#00ccff' : '#4a6a7a',
              padding: '4px 16px', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase',
            }}>
              {musicOn ? 'ON' : 'OFF'}
            </button>
          </div>
        </Section>

        {/* Career Stats */}
        <Section title="Career Stats">
          <StatLine label="Total Runs" value={runs} />
          <StatLine label="Wins" value={wins} color="#00ff88" />
          <StatLine label="Losses" value={losses} color="#ee6666" />
          <StatLine label="Win Rate" value={runs > 0 ? `${Math.round((wins / runs) * 100)}%` : '—'} />
          <StatLine label="Best Run" value={`${bestRun}/8 fights`} />
        </Section>

        {/* Codex Summary */}
        {meta?.codex && Object.keys(meta.codex).length > 0 && (
          <Section title="Codex">
            {Object.entries(meta.codex).map(([key, data]) => (
              <div key={key} style={{
                display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                fontSize: 11, borderBottom: '1px solid #111a28',
              }}>
                <span style={{ color: '#8aaabc', textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span style={{ color: '#6a8a9a', fontFamily: 'var(--font-mono)' }}>
                  {data.defeated || 0}/{data.encounters || 0}
                </span>
              </div>
            ))}
          </Section>
        )}

        {/* Controls Reference */}
        <Section title="Controls">
          <ControlRow keys="Click" action="Select move / Commit action" />
          <ControlRow keys="Items" action="Use items (costs your turn)" />
          <ControlRow keys="Push" action="Spend extra stamina for damage" />
        </Section>

        {/* Version */}
        <div style={{
          fontSize: 9, color: '#2a3a4a', textAlign: 'center', marginTop: 16,
          letterSpacing: 2, textTransform: 'uppercase',
        }}>
          AMA v0.1 — Alien Martial Arts
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 9, color: '#4a6a7a', textTransform: 'uppercase',
        letterSpacing: 2, marginBottom: 10, paddingBottom: 6,
        borderBottom: '1px solid #1a2838',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function SliderRow({ label, value, onChange, color }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: 6,
      }}>
        <span style={{ fontSize: 12, color: '#8aaabc' }}>{label}</span>
        <span style={{ fontSize: 11, color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{value}%</span>
      </div>
      <input
        type="range" min="0" max="100" value={value} onChange={onChange}
        style={{
          width: '100%', height: 4, appearance: 'none',
          background: `linear-gradient(to right, ${color} ${value}%, #1a2838 ${value}%)`,
          outline: 'none', cursor: 'pointer', borderRadius: 2,
        }}
      />
    </div>
  );
}

function StatLine({ label, value, color = '#e0f0f8' }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '5px 0',
      borderBottom: '1px solid #111a28',
    }}>
      <span style={{ fontSize: 12, color: '#6a8a9a' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}

function ControlRow({ keys, action }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '4px 0',
      fontSize: 11, borderBottom: '1px solid #111a28',
    }}>
      <span style={{
        color: '#00ccff', fontFamily: 'var(--font-mono)', fontWeight: 600,
        padding: '1px 6px', background: '#00ccff10', border: '1px solid #00ccff30',
      }}>
        {keys}
      </span>
      <span style={{ color: '#6a8a9a' }}>{action}</span>
    </div>
  );
}
