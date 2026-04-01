import { useRef, useEffect } from 'react';
import FighterSprite from './FighterSprite';

/**
 * FightArena — HTML/CSS fight screen arena with animated sprites.
 * Replaces the PIXI-based BattleArena for the prototype.
 *
 * Dark arena floor, spotlight effects, two fighters facing each other.
 */
export default function FightArena({ playerSpecies, opponentSpecies, playerAnimState, opponentAnimState, playerColor, opponentColor }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'linear-gradient(180deg, #020408 0%, #060c18 40%, #0a1828 100%)',
    }}>
      {/* Arena background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 25% 60%, ${playerColor || '#00ccff'}08 0%, transparent 50%),
                     radial-gradient(ellipse at 75% 60%, ${opponentColor || '#ff4444'}08 0%, transparent 50%)`,
      }} />

      {/* Floor plane */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
        background: 'linear-gradient(180deg, rgba(10,24,40,0.9) 0%, rgba(5,12,25,0.95) 100%)',
        borderTop: '2px solid rgba(0,204,255,0.15)',
      }}>
        {/* Floor grid lines */}
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.08 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i + 1) * 20}%`} x2="100%" y2={`${(i + 1) * 20}%`} stroke="#00ccff" strokeWidth="1" />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="#00ccff" strokeWidth="0.5" />
          ))}
          {/* Center line */}
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#00ccff" strokeWidth="1.5" opacity="0.5" />
        </svg>

        {/* Floor hazard stripes at center */}
        <div style={{
          position: 'absolute', top: 0, left: '45%', width: '10%', height: 4,
          background: 'repeating-linear-gradient(90deg, #ccaa00 0px, #ccaa00 8px, transparent 8px, transparent 16px)',
          opacity: 0.15,
        }} />
      </div>

      {/* Player spotlight */}
      <div style={{
        position: 'absolute', bottom: '35%', left: '15%', width: 300, height: 200,
        background: `radial-gradient(ellipse, ${playerColor || '#00ccff'}12 0%, transparent 70%)`,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }} />

      {/* Opponent spotlight */}
      <div style={{
        position: 'absolute', bottom: '35%', right: '15%', width: 300, height: 200,
        background: `radial-gradient(ellipse, ${opponentColor || '#ff4444'}12 0%, transparent 70%)`,
        transform: 'translateX(50%)',
        pointerEvents: 'none',
      }} />

      {/* Player sprite — left side, facing right */}
      <div style={{
        position: 'absolute', bottom: '28%', left: '8%',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
      }}>
        <FighterSprite
          species={playerSpecies}
          side="player"
          animState={playerAnimState || 'idle'}
          scale={2.8}
        />
        {/* Ground shadow */}
        <div style={{
          position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 16, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${playerColor || '#00ccff'}30 0%, transparent 70%)`,
        }} />
      </div>

      {/* Opponent sprite — right side, facing left */}
      <div style={{
        position: 'absolute', bottom: '28%', right: '8%',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
      }}>
        <FighterSprite
          species={opponentSpecies}
          side="opponent"
          animState={opponentAnimState || 'idle'}
          scale={2.8}
        />
        {/* Ground shadow */}
        <div style={{
          position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 16, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${opponentColor || '#ff4444'}30 0%, transparent 70%)`,
        }} />
      </div>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
      }} />

      {/* CRT scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
        background: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
      }} />
    </div>
  );
}
