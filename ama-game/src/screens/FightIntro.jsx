import React, { useState, useEffect, useRef } from 'react';
import { characters } from '../data/characters';
import SPRITES from '../data/spriteMap';

/**
 * FightIntro — Cinematic VS splash before each fight.
 * Shows both fighters sliding in from opposite sides with a dramatic "VS" in center.
 * Auto-advances after animation completes.
 */
export default function FightIntro({ playerCharKey, opponentCharKey, fightNumber, onComplete }) {
  const [phase, setPhase] = useState(0); // 0=hidden, 1=slide-in, 2=vs-flash, 3=fight-label, 4=exit
  const playerChar = characters[playerCharKey] || {};
  const oppChar = characters[opponentCharKey] || {};
  const playerSprite = SPRITES[playerCharKey]?.front;
  const oppSprite = SPRITES[opponentCharKey]?.front;

  // Animation timeline
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 50),     // slide in fighters
      setTimeout(() => setPhase(2), 600),     // VS flash
      setTimeout(() => setPhase(3), 1100),    // fight label
      setTimeout(() => setPhase(4), 2200),    // begin exit
      setTimeout(() => onComplete(), 2600),   // hand off to fight
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const isBoss = oppChar.isBoss;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: '#050a14', overflow: 'hidden',
      opacity: phase >= 4 ? 0 : 1,
      transition: phase >= 4 ? 'opacity 0.4s ease' : 'none',
    }}>
      {/* Diagonal split background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${playerChar.color}10 0%, ${playerChar.color}10 48%, transparent 48%, transparent 52%, ${oppChar.color}10 52%, ${oppChar.color}10 100%)`,
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
      }} />

      {/* Fight number banner */}
      <div style={{
        position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)',
        fontSize: 11, fontWeight: 700, color: '#4a6a7a', letterSpacing: 4,
        textTransform: 'uppercase',
        opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.4s ease',
      }}>
        {isBoss ? 'BOSS FIGHT' : `Fight ${fightNumber} of 4`}
      </div>

      {/* ── Player Side (left) ── */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '45%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transform: phase >= 1 ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {playerSprite && (
          <img src={playerSprite} alt={playerChar.name} style={{
            width: 120, height: 160, imageRendering: 'pixelated',
            objectFit: 'contain',
            filter: `drop-shadow(0 0 20px ${playerChar.color}50)`,
            transform: phase >= 2 ? 'scale(1)' : 'scale(0.8)',
            transition: 'transform 0.3s ease',
          }} />
        )}
        <div style={{
          marginTop: 16, textAlign: 'center',
          opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.3s ease 0.2s',
        }}>
          <div style={{
            fontSize: 20, fontWeight: 800, color: playerChar.color,
            textTransform: 'uppercase', letterSpacing: 2,
            textShadow: `0 0 15px ${playerChar.color}40`,
          }}>
            {playerChar.name}
          </div>
          <div style={{ fontSize: 9, color: '#6a8a9a', letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' }}>
            You
          </div>
        </div>
      </div>

      {/* ── Opponent Side (right) ── */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transform: phase >= 1 ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {oppSprite && (
          <img src={oppSprite} alt={oppChar.name} style={{
            width: 120, height: 160, imageRendering: 'pixelated',
            objectFit: 'contain',
            filter: `drop-shadow(0 0 20px ${oppChar.color}50)`,
            transform: `scaleX(-1) ${phase >= 2 ? 'scale(1)' : 'scale(0.8)'}`,
            transition: 'transform 0.3s ease',
          }} />
        )}
        <div style={{
          marginTop: 16, textAlign: 'center',
          opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.3s ease 0.2s',
        }}>
          <div style={{
            fontSize: 20, fontWeight: 800, color: oppChar.color,
            textTransform: 'uppercase', letterSpacing: 2,
            textShadow: `0 0 15px ${oppChar.color}40`,
          }}>
            {oppChar.name}
          </div>
          <div style={{ fontSize: 9, color: '#6a8a9a', letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' }}>
            {isBoss ? 'Boss' : 'Opponent'}
          </div>
          {oppChar.isCounterMechanic && (
            <div style={{
              fontSize: 9, color: '#eab308', marginTop: 6, fontWeight: 600,
              padding: '2px 8px', border: '1px solid #eab30840',
              background: '#eab30810', letterSpacing: 1,
            }}>
              COUNTER-MECHANIC
            </div>
          )}
        </div>
      </div>

      {/* ── VS Center ── */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10, textAlign: 'center',
      }}>
        {/* VS text */}
        <div style={{
          fontSize: phase >= 2 ? 72 : 0, fontWeight: 900,
          fontFamily: 'var(--font-display)',
          color: '#e0f0f8',
          textShadow: phase >= 2
            ? '0 0 30px rgba(0,204,255,0.4), 0 0 60px rgba(0,204,255,0.2)'
            : 'none',
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'scale(1) rotate(0deg)' : 'scale(3) rotate(-10deg)',
          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          lineHeight: 1,
          letterSpacing: 8,
        }}>
          VS
        </div>

        {/* FIGHT label */}
        <div style={{
          fontSize: 14, fontWeight: 700, color: '#4a6a7a',
          letterSpacing: 6, textTransform: 'uppercase', marginTop: 12,
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.3s ease',
        }}>
          FIGHT
        </div>
      </div>

      {/* Flash overlay on VS reveal */}
      {phase === 2 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.15)',
          animation: 'flashFade 0.3s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}

      <style>{`
        @keyframes flashFade {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
