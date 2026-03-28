import React, { useState } from 'react';
import { speciesMutations, getSpeciesMutations, SPECIES_WEAKNESS } from '../data/mutations';
import { characters, TYPE_COLORS } from '../data/characters';
import SPRITES from '../data/spriteMap';

const HELIX_LINES = {
  dominant: '"Excellent work. Barely a scratch on the specimen. Take your pick — everything looks viable."',
  guardBreak: '"Guard shattered clean. Arms and torso are pristine. The head... I\'ll see what I can do."',
  composureBreak: '"Mental collapse. Neural tissue is intact — head grafts are beautiful. Torso took some hits."',
  attrition: '"Long fight. Everything\'s a bit banged up, but I can pull something usable."',
  scrappy: '"You... really went to town on this one. I can salvage one piece. Maybe."',
  default: '"Let me see what we\'ve got to work with."',
};

function getAttrModLabel(attrMod) {
  if (!attrMod) return null;
  return Object.entries(attrMod)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => {
      const pct = Math.round((v - (v > 0 && v < 1 ? 0 : 1)) * 100) || Math.round(v * 100);
      const label = k.charAt(0).toUpperCase() + k.slice(1, 3).toUpperCase();
      // Handle both multiplier (0.15) and percentage (already) formats
      const val = Math.abs(v) < 1 ? Math.round(v * 100) : Math.round((v - 1) * 100);
      const sign = v > 0 ? '+' : '';
      return `${sign}${val}% ${label}`;
    })
    .join(', ');
}

export default function HarvestScreen({
  defeatedSpecies,
  killMethod = 'attrition',
  destroyedMutations = [],
  fightNumber = 1,
  playerMutations = [],
  onHarvest,
  onSkip,
}) {
  const [selected, setSelected] = useState(null);
  const [grafting, setGrafting] = useState(false);

  const opp = characters[defeatedSpecies];
  const sprite = SPRITES[defeatedSpecies]?.front;
  const allMuts = getSpeciesMutations(defeatedSpecies);

  // Filter out destroyed mutations
  const destroyedSet = new Set(destroyedMutations);
  const survivingMuts = allMuts.filter(m => !destroyedSet.has(m.id));

  // Apply kill method salvage rules
  let salvageable = [];
  switch (killMethod) {
    case 'dominant':
      salvageable = survivingMuts.slice(0, 3);
      break;
    case 'guardBreak':
      salvageable = survivingMuts.filter(m => {
        if (m.slot === 'head' && Math.random() < 0.5) return false;
        return true;
      }).slice(0, 3);
      break;
    case 'composureBreak':
      salvageable = survivingMuts.filter(m => {
        if (m.slot === 'chest' && Math.random() < 0.5) return false;
        return true;
      }).slice(0, 3);
      break;
    case 'attrition':
      salvageable = survivingMuts.slice(0, 2);
      break;
    case 'scrappy':
      salvageable = survivingMuts.length > 0
        ? [survivingMuts[Math.floor(Math.random() * survivingMuts.length)]]
        : [];
      break;
    default:
      salvageable = survivingMuts.slice(0, 2);
  }

  // Fallback: if no mutations available, offer first species mutation
  if (salvageable.length === 0 && allMuts.length > 0) {
    salvageable = [allMuts[0]];
  }

  // Check if player already has a mutation in each slot
  function getExistingInSlot(slot) {
    return playerMutations.find(m => m.slot === slot);
  }

  function handleHarvest(mut) {
    setSelected(mut);
    setGrafting(true);
    setTimeout(() => {
      const existing = getExistingInSlot(mut.slot);
      onHarvest(mut, existing?.id || null);
    }, 1500);
  }

  const helixLine = HELIX_LINES[killMethod] || HELIX_LINES.default;

  return (
    <div className="screen" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16,
      background: 'linear-gradient(180deg, #050810 0%, #0a1520 50%, #0f1a2e 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
        background: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
      }} />

      {/* Grafting overlay */}
      {grafting && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,20,10,0.9)', zIndex: 50,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 10, color: '#00ff88', letterSpacing: 3, textTransform: 'uppercase' }}>// grafting in progress</div>
          <div style={{ fontSize: 18, color: '#e0f0f8', fontWeight: 600 }}>{selected?.name}</div>
          <div style={{ fontSize: 11, color: '#6a8a9a' }}>Slot: {(selected?.slot || 'unknown').toUpperCase()}</div>
          <div style={{ width: 200, height: 4, background: '#111a28', marginTop: 8 }}>
            <div style={{ width: '100%', height: '100%', background: '#00ff88', animation: 'graftBar 1.5s ease forwards' }} />
          </div>
          <style>{`@keyframes graftBar { from { width: 0% } to { width: 100% } }`}</style>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 10, color: '#00ff88', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
          // harvest bay
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#e0f0f8', margin: 0 }}>
          Specimen Harvest
        </h2>
      </div>

      {/* Defeated species */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px',
        background: '#0a1220', border: '1px solid #1a2838', position: 'relative', zIndex: 1,
      }}>
        {sprite && (
          <img src={sprite} alt={opp?.name} style={{
            width: 48, height: 48, imageRendering: 'pixelated', objectFit: 'contain',
            filter: 'brightness(0.5) saturate(0.5)',
          }} />
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: opp?.color || '#c0d0d8' }}>
            {opp?.name} — Fight {fightNumber}
          </div>
          <div style={{ fontSize: 10, color: '#6a8a9a' }}>
            Kill method: <span style={{ color: killMethod === 'dominant' ? '#00ff88' : killMethod === 'scrappy' ? '#ee6666' : '#ccaa22', textTransform: 'uppercase', letterSpacing: 1 }}>{killMethod}</span>
          </div>
        </div>
      </div>

      {/* Helix dialogue */}
      <div style={{
        maxWidth: 600, width: '100%', background: '#0a1220', border: '1px solid #1a2838',
        borderLeft: '2px solid #00ff88', padding: '10px 14px', position: 'relative', zIndex: 1,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#00ff88', letterSpacing: 1, marginBottom: 4 }}>DR. HELIX</div>
        <div style={{ fontSize: 11, color: '#6a8a9a', fontStyle: 'italic' }}>{helixLine}</div>
      </div>

      {/* Mutation cards */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
        maxWidth: 800, width: '100%', position: 'relative', zIndex: 1,
      }}>
        {salvageable.map(mut => {
          const existing = getExistingInSlot(mut.slot);
          const isReplace = !!existing;
          const weakness = mut.weakness || SPECIES_WEAKNESS[defeatedSpecies];
          const attrLabel = getAttrModLabel(mut.attrMod);

          const speciesColor = opp?.color || '#4488cc';
          return (
            <div key={mut.id} style={{
              flex: '1 1 220px', maxWidth: 260, background: '#0a1220',
              border: `1px solid ${speciesColor}40`,
              boxShadow: `0 0 12px ${speciesColor}15, inset 0 0 20px ${speciesColor}08`,
              padding: 14, cursor: 'pointer', transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = speciesColor; e.currentTarget.style.boxShadow = `0 0 20px ${speciesColor}30`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${speciesColor}40`; e.currentTarget.style.boxShadow = `0 0 12px ${speciesColor}15, inset 0 0 20px ${speciesColor}08`; }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e0f0f8' }}>{mut.name}</div>
                <span style={{
                  fontSize: 8, padding: '2px 6px', letterSpacing: 1, textTransform: 'uppercase',
                  background: isReplace ? 'rgba(238,102,102,0.1)' : 'rgba(0,255,136,0.1)',
                  border: `1px solid ${isReplace ? 'rgba(238,102,102,0.3)' : 'rgba(0,255,136,0.3)'}`,
                  color: isReplace ? '#ee6666' : '#66ee88',
                }}>
                  {isReplace ? 'REPLACE' : 'NEW GRAFT'}
                </span>
              </div>

              {/* Info row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9, color: opp?.color, border: `1px solid ${opp?.color}40`, padding: '1px 4px' }}>
                  {opp?.name}
                </span>
                <span style={{ fontSize: 9, color: '#4a6a7a', border: '1px solid #1a2838', padding: '1px 4px' }}>
                  {(mut.slot || 'passive').toUpperCase()}
                </span>
                {mut.hp && <span style={{ fontSize: 9, color: '#00ff88' }}>{mut.hp} HP</span>}
                {weakness && <span style={{ fontSize: 9, color: TYPE_COLORS[weakness] || '#ee6666' }}>Weak: {weakness.toUpperCase()}</span>}
              </div>

              {/* Description */}
              <div style={{ fontSize: 10, color: '#6a8a9a', lineHeight: 1.5, marginBottom: 6 }}>{mut.description}</div>

              {/* Move granted */}
              {mut.move && (
                <div style={{ fontSize: 9, color: '#00ccff', marginBottom: 4 }}>
                  + {mut.move.name} ({mut.move.moveType.toUpperCase()}, base {mut.move.baseDamage}, cost {mut.move.minCost})
                </div>
              )}

              {/* Attr mod */}
              {attrLabel && (
                <div style={{ fontSize: 9, color: '#ccaa22', marginBottom: 8 }}>{attrLabel}</div>
              )}

              {/* Replace warning */}
              {isReplace && (
                <div style={{ fontSize: 9, color: '#ee6666', background: 'rgba(238,102,102,0.05)', border: '1px solid rgba(238,102,102,0.15)', padding: '4px 6px', marginBottom: 8 }}>
                  Replaces <strong>{existing.name}</strong>. Tech on this slot will be lost.
                </div>
              )}

              {/* Harvest button */}
              <button
                onClick={() => handleHarvest(mut)}
                disabled={grafting}
                className="btn graft"
                style={{ width: '100%' }}
              >
                Harvest
              </button>
            </div>
          );
        })}
      </div>

      {/* Current build display */}
      {playerMutations.length > 0 && (
        <div style={{
          maxWidth: 600, width: '100%', background: '#080e18', border: '1px solid #1a2838',
          padding: '10px 14px', position: 'relative', zIndex: 1,
        }}>
          <div style={{ fontSize: 9, color: '#4a6a7a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>// your current grafts</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {['head', 'arms', 'chest', 'back', 'legs'].map(slot => {
              const mut = playerMutations.find(m => m.slot === slot);
              return (
                <div key={slot} style={{ fontSize: 10, color: mut ? '#8899aa' : '#2a3a4a' }}>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{slot}</span>
                  {': '}
                  <span style={{ color: mut ? '#c0d0d8' : '#2a3a4a' }}>{mut ? mut.name : 'empty'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skip button */}
      <button
        onClick={onSkip}
        disabled={grafting}
        className="btn-ghost"
        style={{ position: 'relative', zIndex: 1 }}
      >
        Skip - Return to Hub
      </button>
    </div>
  );
}
