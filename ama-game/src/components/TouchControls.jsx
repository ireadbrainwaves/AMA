import { useRef, useEffect, useCallback } from 'react';

/**
 * TouchControls — virtual joystick + action button for mobile.
 * Only renders on touch devices. Injects keyboard events so the rest
 * of the game doesn't need to know about touch at all.
 */

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function simulateKey(key, type) {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
}

export default function TouchControls() {
  const joystickRef = useRef(null);
  const knobRef = useRef(null);
  const activeKeys = useRef(new Set());
  const touchId = useRef(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const pressKey = useCallback((key) => {
    if (!activeKeys.current.has(key)) {
      activeKeys.current.add(key);
      simulateKey(key, 'keydown');
    }
  }, []);

  const releaseKey = useCallback((key) => {
    if (activeKeys.current.has(key)) {
      activeKeys.current.delete(key);
      simulateKey(key, 'keyup');
    }
  }, []);

  const releaseAll = useCallback(() => {
    for (const key of ['w', 'a', 's', 'd']) releaseKey(key);
  }, [releaseKey]);

  const handleJoystickStart = useCallback((e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    const rect = joystickRef.current.getBoundingClientRect();
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  const handleJoystickMove = useCallback((e) => {
    e.preventDefault();
    const touch = [...e.changedTouches].find(t => t.identifier === touchId.current);
    if (!touch) return;

    const dx = touch.clientX - centerRef.current.x;
    const dy = touch.clientY - centerRef.current.y;
    const dist = Math.hypot(dx, dy);
    const maxDist = 40;
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);

    // Move knob visually
    if (knobRef.current) {
      const nx = Math.cos(angle) * clampedDist;
      const ny = Math.sin(angle) * clampedDist;
      knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }

    // Dead zone
    if (dist < 12) { releaseAll(); return; }

    // Map angle to WASD
    const deg = (angle * 180 / Math.PI + 360) % 360;
    // Right: 315-45, Down: 45-135, Left: 135-225, Up: 225-315
    if (deg > 315 || deg <= 45) { pressKey('d'); releaseKey('a'); }
    else if (deg > 135 && deg <= 225) { pressKey('a'); releaseKey('d'); }
    else { releaseKey('a'); releaseKey('d'); }

    if (deg > 45 && deg <= 135) { pressKey('s'); releaseKey('w'); }
    else if (deg > 225 && deg <= 315) { pressKey('w'); releaseKey('s'); }
    else { releaseKey('w'); releaseKey('s'); }
  }, [pressKey, releaseKey, releaseAll]);

  const handleJoystickEnd = useCallback((e) => {
    e.preventDefault();
    touchId.current = null;
    releaseAll();
    if (knobRef.current) knobRef.current.style.transform = 'translate(0, 0)';
  }, [releaseAll]);

  const handleAction = useCallback((e) => {
    e.preventDefault();
    simulateKey('e', 'keydown');
    setTimeout(() => simulateKey('e', 'keyup'), 100);
  }, []);

  // Only render on touch devices
  if (typeof window !== 'undefined' && !isTouchDevice()) return null;

  const baseStyle = {
    position: 'fixed', zIndex: 1000, pointerEvents: 'auto',
    touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
  };

  return (
    <>
      {/* Joystick — bottom left */}
      <div
        ref={joystickRef}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
        style={{
          ...baseStyle, bottom: 40, left: 30,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(0,204,255,0.08)',
          border: '2px solid rgba(0,204,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          ref={knobRef}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(0,204,255,0.25)',
            border: '2px solid rgba(0,204,255,0.4)',
            transition: 'transform 0.05s ease-out',
          }}
        />
      </div>

      {/* Action button — bottom right */}
      <button
        onTouchStart={handleAction}
        style={{
          ...baseStyle, bottom: 60, right: 40,
          width: 70, height: 70, borderRadius: '50%',
          background: 'rgba(0,204,255,0.12)',
          border: '2px solid rgba(0,204,255,0.3)',
          color: '#00ccff', fontSize: 16, fontWeight: 800,
          fontFamily: 'var(--font-mono)', letterSpacing: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        E
      </button>
    </>
  );
}
