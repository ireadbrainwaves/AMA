import { useSpriteAnimation } from '../hooks/useSpriteAnimation';

export default function AnimatedSprite({ sheetSrc, sheetData, animation, className }) {
  const frame = useSpriteAnimation(sheetData, animation);

  return (
    <div
      className={className}
      style={{
        width: frame.w,
        height: frame.h,
        backgroundImage: `url(${sheetSrc})`,
        backgroundPosition: `-${frame.x}px -${frame.y}px`,
        backgroundSize: `${sheetData.meta.size.w}px ${sheetData.meta.size.h}px`,
        imageRendering: 'pixelated',
      }}
    />
  );
}
