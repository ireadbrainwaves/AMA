import { useState, useEffect, useRef } from 'react';
import ANIMATIONS, { ANIM_CONFIG } from '../data/animationMap';
import SPRITES from '../data/spriteMap';

/**
 * Animated fighter sprite for the fight screen.
 *
 * Props:
 *   species    - character key (e.g. 'cyberGorilla')
 *   side       - 'player' (faces right/east) or 'opponent' (faces left/west)
 *   animState  - 'idle' | 'attack' | 'hit' | 'special' | 'ko'
 *   onAnimEnd  - callback when a non-looping animation completes
 *   style      - additional CSS styles
 *   scale      - render scale (default 2.5)
 */
export default function FighterSprite({ species, side, animState = 'idle', onAnimEnd, style = {}, scale = 2.5 }) {
  const direction = side === 'player' ? 'east' : 'west';
  const spriteKey = side === 'player' ? 'front' : 'back';

  const speciesAnims = ANIMATIONS[species];
  const config = ANIM_CONFIG[animState] || ANIM_CONFIG.idle;
  let animFrames = speciesAnims?.[animState]?.[direction] || [];

  // Trim idle to maxFrames to avoid the slam/charge at end
  if (config.maxFrames && animFrames.length > config.maxFrames) {
    animFrames = animFrames.slice(0, config.maxFrames);
  }

  const [frameIdx, setFrameIdx] = useState(0);
  const intervalRef = useRef(null);
  const prevAnimRef = useRef(animState);

  // Reset frame when anim changes
  useEffect(() => {
    if (prevAnimRef.current !== animState) {
      setFrameIdx(0);
      prevAnimRef.current = animState;
    }
  }, [animState]);

  // Frame ticker
  useEffect(() => {
    if (animFrames.length <= 1) return;

    const ms = 1000 / config.fps;
    intervalRef.current = setInterval(() => {
      setFrameIdx(prev => {
        const next = prev + 1;
        if (next >= animFrames.length) {
          if (config.loop) return 0;
          clearInterval(intervalRef.current);
          if (onAnimEnd) onAnimEnd(animState);
          return prev; // hold last frame
        }
        return next;
      });
    }, ms);

    return () => clearInterval(intervalRef.current);
  }, [animFrames.length, config.fps, config.loop, animState]);

  const frameUrl = animFrames[Math.min(frameIdx, animFrames.length - 1)] || SPRITES[species]?.[spriteKey] || '';
  if (!frameUrl) return null;

  // Visual effects per anim state
  let filter = 'none';
  let transform = '';
  if (animState === 'hit') {
    filter = 'brightness(1.8) saturate(0.3)';
    transform = side === 'player' ? 'translateX(-8px)' : 'translateX(8px)';
  } else if (animState === 'attack') {
    transform = side === 'player' ? 'translateX(12px)' : 'translateX(-12px)';
  }

  return (
    <img
      src={frameUrl}
      alt={`${species} ${animState}`}
      style={{
        imageRendering: 'pixelated',
        width: 156 * scale,
        height: 156 * scale,
        objectFit: 'contain',
        pointerEvents: 'none',
        filter,
        transform,
        transition: 'filter 0.15s, transform 0.2s ease-out',
        ...style,
      }}
    />
  );
}
