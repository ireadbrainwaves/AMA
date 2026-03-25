import React, { useState, useEffect, useRef, useCallback } from 'react';

const SLIDES = [
  `> COMMANDER VEX — TOURNAMENT ADDRESS

Four species. One corridor of space.
We found each other about 70 years ago.
Tried diplomacy eleven times.
All eleven ended in fistfights.

The ninth summit lasted four minutes.
I was there for that one. Good times.`,

  `Fighting never stopped. Couldn't stop it.
Biology doesn't negotiate.

So they moved it off the loading docks
and put a fence around it.
Called it a sport.
Called it the Intergalactic Strongman Tournament.
The Squids hate the name. It stuck anyway.`,

  `I run this thing. Have for 29 years.
One rule: nobody dies in my arena.
Everything else is between you and
whoever's standing across from you.

You win, you come back.
You lose, you walk out.
Or get carried out. Depends on the fight.`,

  `Couple years in, a Squid doctor showed up.
Said he could graft pieces of one species
onto another. I asked if it was safe.
He said "mostly."

It's not safe. The crowds love it.

Beat an opponent, take a piece of them.
By fight four you won't recognize yourself.
That's the point.`,

  `You're here now. I don't care why.
Could be glory. Could be science.
Could be you've got nothing better to do.
Doesn't matter.

Pick an arena. Fight what's behind the door.
Win or don't.

I've seen a thousand fighters walk through
this hub. Most of them only walked through once.

Don't waste my time.

> [BRIEFING COMPLETE]
> [PRESS ANY KEY TO ENTER THE HUB]`,
];

const CHAR_INTERVAL_MS = 25;
const AUTO_ADVANCE_DELAY_MS = 2000;

export default function IntroSequence({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [opacity, setOpacity] = useState(1);
  const [slideComplete, setSlideComplete] = useState(false);

  const escPressedAt = useRef(null);
  const escTimerRef = useRef(null);
  const autoAdvanceTimer = useRef(null);
  const typewriterRef = useRef(null);
  const charIndexRef = useRef(0);
  const slideCompleteRef = useRef(false);
  const currentSlideRef = useRef(0);

  // Keep refs in sync
  useEffect(() => {
    slideCompleteRef.current = slideComplete;
  }, [slideComplete]);

  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);

  // Advance to next slide or finish
  const advanceSlide = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }

    const slide = currentSlideRef.current;

    if (!slideCompleteRef.current) {
      // Skip typewriter -- show full text immediately
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }
      setDisplayedText(SLIDES[slide]);
      setSlideComplete(true);
      slideCompleteRef.current = true;

      if (slide < SLIDES.length - 1) {
        autoAdvanceTimer.current = setTimeout(() => {
          doTransition();
        }, AUTO_ADVANCE_DELAY_MS);
      }
      return;
    }

    if (slide >= SLIDES.length - 1) {
      onComplete();
      return;
    }

    doTransition();
  }, [onComplete]);

  const doTransition = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }

    setOpacity(0);
    setTimeout(() => {
      setCurrentSlide((prev) => {
        const next = Math.min(prev + 1, SLIDES.length - 1);
        currentSlideRef.current = next;
        return next;
      });
      setDisplayedText('');
      charIndexRef.current = 0;
      setSlideComplete(false);
      slideCompleteRef.current = false;
      setTimeout(() => setOpacity(1), 50);
    }, 400);
  }, []);

  // Typewriter effect
  useEffect(() => {
    const fullText = SLIDES[currentSlide];
    charIndexRef.current = 0;
    setDisplayedText('');
    setSlideComplete(false);
    slideCompleteRef.current = false;

    typewriterRef.current = setInterval(() => {
      charIndexRef.current += 1;
      if (charIndexRef.current >= fullText.length) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
        setDisplayedText(fullText);
        setSlideComplete(true);
        slideCompleteRef.current = true;

        if (currentSlideRef.current < SLIDES.length - 1) {
          autoAdvanceTimer.current = setTimeout(() => {
            doTransition();
          }, AUTO_ADVANCE_DELAY_MS);
        }
      } else {
        setDisplayedText(fullText.slice(0, charIndexRef.current));
      }
    }, CHAR_INTERVAL_MS);

    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }
    };
  }, [currentSlide, doTransition]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!escPressedAt.current) {
          escPressedAt.current = Date.now();
          escTimerRef.current = setTimeout(() => {
            // 1 second held -- skip entire sequence
            onComplete();
          }, 1000);
        }
        return;
      }

      // Any other key advances
      advanceSlide();
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Escape') {
        escPressedAt.current = null;
        if (escTimerRef.current) {
          clearTimeout(escTimerRef.current);
          escTimerRef.current = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (escTimerRef.current) clearTimeout(escTimerRef.current);
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [advanceSlide, onComplete]);

  return (
    <div style={styles.container} onClick={advanceSlide}>
      {/* CRT scanline overlay */}
      <div style={styles.scanlines} />

      {/* Terminal header */}
      <div style={styles.header}>
        [TERMINAL DISPLAY — AXIS-9 STATION ARCHIVES]
      </div>

      {/* Slide text */}
      <div style={{ ...styles.textArea, opacity, transition: 'opacity 0.4s ease' }}>
        <pre style={styles.slideText}>
          {displayedText}
          <span style={styles.cursor}>_</span>
        </pre>
      </div>

      {/* Skip hint */}
      <div style={styles.skipHint}>
        HOLD ESC TO SKIP
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#0a0a0f',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Share Tech Mono', monospace",
    color: '#00ff88',
    cursor: 'pointer',
    overflow: 'hidden',
    zIndex: 1000,
  },
  scanlines: {
    position: 'absolute',
    inset: 0,
    background:
      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.15) 2px, rgba(0, 0, 0, 0.15) 4px)',
    pointerEvents: 'none',
    zIndex: 2,
  },
  header: {
    position: 'absolute',
    top: 40,
    color: '#00ff8844',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    userSelect: 'none',
  },
  textArea: {
    maxWidth: 640,
    width: '90%',
    minHeight: 320,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideText: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 16,
    lineHeight: 1.75,
    color: '#00ff88',
    whiteSpace: 'pre-wrap',
    margin: 0,
    textShadow: '0 0 8px rgba(0, 255, 136, 0.4)',
  },
  cursor: {
    animation: 'blink 1s step-end infinite',
    color: '#00ff88',
  },
  skipHint: {
    position: 'absolute',
    bottom: 30,
    color: '#00ff8833',
    fontSize: 12,
    letterSpacing: 3,
    userSelect: 'none',
  },
};

// Inject cursor blink keyframes
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes blink {
      50% { opacity: 0; }
    }
  `;
  document.head.appendChild(styleEl);
}
