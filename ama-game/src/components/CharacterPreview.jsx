import SPRITES from '../data/spriteMap';
import { SLOT_OFFSETS, BODY_SLOTS } from '../data/slotOffsets';

/**
 * CharacterPreview — CSS-based character composite for the Doctor screen.
 * Shows base body + mutation overlays positioned at slot offsets.
 * No Pixi.js dependency — pure React DOM with absolute positioning.
 *
 * Props:
 *   species         - species key
 *   view            - 'front' or 'back'
 *   playerBuild     - { slots: { leftArm: { mutation: null, tech: [] }, ... } }
 *   highlightedSlot - slot key to highlight, or null
 */
export default function CharacterPreview({ species, view = 'front', playerBuild, highlightedSlot }) {
  const offsets = SLOT_OFFSETS[species]?.[view];
  const spriteUrl = SPRITES[species]?.[view];

  if (!spriteUrl || !offsets) return null;

  return (
    <div className="char-preview">
      {/* Base body sprite */}
      <img
        src={spriteUrl}
        alt={species}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          imageRendering: 'pixelated',
          width: 128,
        }}
      />

      {/* Mutation overlays for occupied slots */}
      {playerBuild?.slots && Object.entries(playerBuild.slots).map(([slot, data]) => {
        if (!data.mutation || !offsets[slot]) return null;
        const offset = offsets[slot];
        const isHighlighted = slot === highlightedSlot;

        return (
          <img
            key={slot}
            src={new URL(`../assets/mutations/mut_${data.mutation}.png`, import.meta.url).href}
            alt={data.mutation}
            className={`slot-mutation${isHighlighted ? ' highlighted' : ''}`}
            style={{
              left: `calc(50% + ${offset.x}px)`,
              top: `calc(50% + ${offset.y}px)`,
            }}
            onError={(e) => { e.target.style.display = 'none'; }} // Hide if sprite doesn't exist yet
          />
        );
      })}

      {/* Empty slot indicators for unoccupied slots */}
      {offsets && Object.entries(offsets).map(([slot, offset]) => {
        const hasMutation = playerBuild?.slots?.[slot]?.mutation;
        if (hasMutation) return null;
        const isHighlighted = slot === highlightedSlot;
        const slotInfo = BODY_SLOTS[slot];

        return (
          <div
            key={slot}
            className={`slot-indicator${isHighlighted ? ' highlighted' : ''}`}
            style={{
              left: `calc(50% + ${offset.x}px)`,
              top: `calc(50% + ${offset.y}px)`,
            }}
          >
            {slotInfo?.abbr || slot.charAt(0).toUpperCase()}
          </div>
        );
      })}
    </div>
  );
}
