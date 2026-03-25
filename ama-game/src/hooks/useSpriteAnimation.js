import { useState, useEffect, useRef } from 'react';

export function useSpriteAnimation(sheetData, animationName, playing = true) {
  const [frameIndex, setFrameIndex] = useState(0);
  const timerRef = useRef(null);

  const tag = sheetData?.meta?.frameTags?.find(t => t.name === animationName);
  const frames = sheetData?.frames ? Object.values(sheetData.frames) : [];

  useEffect(() => {
    if (!tag || !playing || frames.length === 0) return;

    let current = tag.from;

    const advance = () => {
      setFrameIndex(current);
      const frame = frames[current];
      const duration = frame?.duration || 150;

      if (current >= tag.to) {
        if (tag.direction === 'forward') {
          return;
        }
        current = tag.from;
      } else {
        current++;
      }

      timerRef.current = setTimeout(advance, duration);
    };

    advance();
    return () => clearTimeout(timerRef.current);
  }, [animationName, playing]);

  const frame = frames[frameIndex];
  return frame ? frame.frame : { x: 0, y: 0, w: 128, h: 128 };
}
