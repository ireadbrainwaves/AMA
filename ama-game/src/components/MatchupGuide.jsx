import React from 'react';
import { TYPE_MATCHUPS } from '../data/matchups';
import { KEYWORD_COLORS, CHANNEL_COLORS } from '../data/characters';

function KeywordBadge({ keyword }) {
  const color = KEYWORD_COLORS[keyword] || '#888';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px',
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      background: color + '22', border: `1px solid ${color}44`, color,
      minWidth: 55, textAlign: 'center', letterSpacing: 1,
    }}>
      {keyword || 'raw'}
    </span>
  );
}

export default function MatchupGuide({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0a1220', border: '1px solid #1a2838',
          padding: 28, maxWidth: 520, width: '90%',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#00ccff', textTransform: 'uppercase', letterSpacing: 3 }}>// matchup guide</div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #1a2838', fontSize: 10, color: '#4a6a7a', padding: '4px 8px', letterSpacing: 1,
          }}>ESC</button>
        </div>

        {/* Channel explanation */}
        <div style={{ fontSize: 10, color: '#6a8a9a', marginBottom: 12, lineHeight: 1.6, padding: '8px 10px', background: '#080c14', border: '1px solid #111a28' }}>
          <span style={{ color: CHANNEL_COLORS.POWER }}>POWER</span> moves hit <strong style={{ color: '#2288cc' }}>Guard</strong>. When Guard breaks, overflow hits Body.
          <br/>
          <span style={{ color: CHANNEL_COLORS.PSYCHIC }}>PSYCHIC</span> moves hit <strong style={{ color: '#8844cc' }}>Composure</strong>. When Composure breaks, overflow hits Body.
          <br/>
          <span style={{ color: CHANNEL_COLORS.FINISHER }}>FINISHER</span> moves bypass everything — direct Body damage. Requires armor broken.
          <br/><br/>
          <strong style={{ color: '#c0d0d8' }}>Keywords</strong> determine which move wins the exchange:
        </div>

        {/* Keyword matchup list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {TYPE_MATCHUPS.map((m, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0',
              borderBottom: '1px solid #111a28',
            }}>
              <KeywordBadge keyword={m.attacker} />
              <span style={{ fontSize: 12, color: '#00ff88', fontWeight: 700 }}>beats</span>
              <KeywordBadge keyword={m.beats} />
              <span style={{ fontSize: 10, color: '#4a6a7a', fontStyle: 'italic', flex: 1, textAlign: 'right' }}>
                {m.reason}
              </span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: '#4a6a7a', marginBottom: 8, lineHeight: 1.5 }}>
          Winner deals <strong style={{ color: '#c0d0d8' }}>full damage</strong>. Loser deals <strong style={{ color: '#c0d0d8' }}>half damage</strong>. Neutral = both land full.
        </div>

        <div style={{ fontSize: 9, color: '#2a4a5a', textAlign: 'center' }}>
          Press M or ESC to close
        </div>
      </div>
    </div>
  );
}
