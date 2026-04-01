import { useState } from 'react';
import { characters, TYPE_COLORS, TYPE_LABELS } from '../data/characters';
import SPRITES from '../data/spriteMap';

/**
 * LibraryScreen — in-game encyclopedia showing all species, moves, and effects.
 * Accessed from the Library room in the hub world.
 */

const SPECIES_ORDER = [
  'cyberGorilla', 'psychoSquid', 'beeSwarm', 'terrorPinTurtle',
  'ironMantis', 'voltamander', 'mycelith',
  'echomorph', 'hydravine', 'glassViper', 'nullWorm', 'boneHydra', 'parasitex',
];

export default function LibraryScreen({ onClose, meta }) {
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [tab, setTab] = useState('moves'); // 'moves' | 'passive' | 'stats'

  const glassPanel = {
    background: 'linear-gradient(160deg, rgba(5,10,25,0.92) 0%, rgba(3,6,15,0.95) 100%)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(100,136,204,0.15)',
  };

  const species = selectedSpecies ? characters[selectedSpecies] : null;

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#020408', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ ...glassPanel, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 'none' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#6688cc', fontFamily: 'var(--font-display)', letterSpacing: 2 }}>LIBRARY</div>
          <div style={{ fontSize: 10, color: '#445566', letterSpacing: 1 }}>SPECIES DATABASE // MOVES // MECHANICS</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899aa', padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}>
          BACK
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Species list — left panel */}
        <div style={{ width: 200, ...glassPanel, borderTop: 'none', borderLeft: 'none', overflowY: 'auto', padding: '8px 0' }}>
          {SPECIES_ORDER.map(key => {
            const ch = characters[key];
            if (!ch) return null;
            const isSelected = selectedSpecies === key;
            const isBoss = ch.isBoss || ch.isCounterMechanic;
            return (
              <button key={key} onClick={() => setSelectedSpecies(key)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px',
                background: isSelected ? `${ch.color}15` : 'transparent',
                borderLeft: `3px solid ${isSelected ? ch.color : 'transparent'}`,
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
                color: isSelected ? ch.color : '#667788', cursor: 'pointer', textAlign: 'left',
              }}>
                <img src={SPRITES[key]?.front} alt="" style={{ width: 32, height: 32, imageRendering: 'pixelated', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{ch.name}</div>
                  <div style={{ fontSize: 8, color: '#445566' }}>{isBoss ? 'BOSS' : 'PLAYABLE'}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel — right */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {!species ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#334455' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📖</div>
              <div style={{ fontSize: 14, letterSpacing: 2 }}>SELECT A SPECIES</div>
            </div>
          ) : (
            <div>
              {/* Species header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                <img src={SPRITES[selectedSpecies]?.front} alt="" style={{ width: 96, height: 96, imageRendering: 'pixelated', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: species.color, fontFamily: 'var(--font-display)' }}>{species.name}</div>
                  {species.archetype && <div style={{ fontSize: 11, color: species.color, opacity: 0.7, letterSpacing: 1, marginTop: 2 }}>{species.archetype}</div>}
                  {species.passive && (
                    <div style={{ fontSize: 11, color: '#8899aa', marginTop: 6, maxWidth: 400 }}>
                      <span style={{ color: species.color, fontWeight: 700 }}>Passive: {species.passive.name}</span> — {species.passive.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats bar */}
              {species.stats && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                  {Object.entries(species.stats).map(([stat, val]) => (
                    <div key={stat} style={{ ...glassPanel, padding: '8px 14px', minWidth: 80 }}>
                      <div style={{ fontSize: 8, color: '#556677', textTransform: 'uppercase', letterSpacing: 1 }}>{stat}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: val >= 60 ? '#44ff66' : val >= 40 ? '#cccc44' : '#ff6644', fontFamily: 'var(--font-mono)' }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Moves */}
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6688cc', letterSpacing: 1, marginBottom: 12 }}>MOVES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {species.moves?.map((move, i) => {
                  const moveColor = TYPE_COLORS[move.moveType] || '#888';
                  return (
                    <div key={move.id || i} style={{ ...glassPanel, padding: '12px 16px', borderLeft: `3px solid ${moveColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#ddd' }}>{move.name}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', background: moveColor + '22', color: moveColor, borderRadius: 2, textTransform: 'uppercase' }}>
                            {TYPE_LABELS[move.moveType] || move.moveType}
                          </span>
                          {move.isFinisher && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', background: 'rgba(255,68,68,0.15)', color: '#ff4444', borderRadius: 2 }}>FINISHER</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: '#aaa' }}>{move.baseDamage > 0 ? `${move.baseDamage} DMG` : 'UTIL'}</span>
                          <span style={{ color: 'var(--stamina)' }}>{move.minCost} STM</span>
                        </div>
                      </div>
                      {/* Channel + target */}
                      <div style={{ fontSize: 10, color: '#667788', marginTop: 4, display: 'flex', gap: 12 }}>
                        {move.channel && <span>Channel: <span style={{ color: moveColor }}>{move.channel}</span></span>}
                        {move.target && <span>Target: {move.target}</span>}
                      </div>
                      {/* Matchups */}
                      {move.keyword && (
                        <div style={{ fontSize: 9, marginTop: 6, display: 'flex', gap: 8 }}>
                          {move.beats?.length > 0 && <span style={{ color: '#44ff66' }}>▲ Beats: {move.beats.map(b => TYPE_LABELS[b] || b).join(', ')}</span>}
                          {move.losesTo?.length > 0 && <span style={{ color: '#ff4455' }}>▼ Loses: {move.losesTo.map(b => TYPE_LABELS[b] || b).join(', ')}</span>}
                        </div>
                      )}
                      {/* Flavor text */}
                      {move.flavor && <div style={{ fontSize: 10, color: '#445566', fontStyle: 'italic', marginTop: 4 }}>{move.flavor}</div>}
                      {/* Effect */}
                      {move.effect && <div style={{ fontSize: 10, color: species.color, marginTop: 4 }}>Effect: {move.effect}</div>}
                      {/* Finisher condition */}
                      {move.finisherCondition && <div style={{ fontSize: 10, color: '#ff8844', marginTop: 2 }}>Requires: {move.finisherCondition}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Kill hint */}
              {species.killHint && (
                <div style={{ marginTop: 20, ...glassPanel, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ff6644', letterSpacing: 1, marginBottom: 4 }}>SCOUT WARNING</div>
                  <div style={{ fontSize: 12, color: '#aabbcc' }}>{species.killHint}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
