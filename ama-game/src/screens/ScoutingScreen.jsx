import React from 'react';
import { characters, TYPE_COLORS, TYPE_LABELS } from '../data/characters';
import { speciesMutations } from '../data/mutations';
import SPRITES from '../data/spriteMap';

function TypeBadge({ type }) {
  const className = `move-badge ${type}`;
  return <span className={className}>{TYPE_LABELS[type] || type}</span>;
}

function getAttrDescriptor(value) {
  if (value >= 70) return { label: 'DEVASTATING', color: '#ee6666' };
  if (value >= 55) return { label: 'STRONG', color: '#eea844' };
  if (value >= 40) return { label: 'AVERAGE', color: '#66cccc' };
  if (value >= 25) return { label: 'WEAK', color: '#6a8a9a' };
  return { label: 'PATHETIC', color: '#444a55' };
}

function computeEffectiveStats(charKey) {
  const char = characters[charKey];
  if (!char?.stats) return { attack: 50, defense: 50, willpower: 50, toughness: 50 };
  const base = { ...char.stats };
  const muts = speciesMutations[charKey] || [];
  muts.forEach(mut => {
    if (mut.attrMod) {
      Object.entries(mut.attrMod).forEach(([attr, val]) => {
        if (attr.startsWith('_')) return;
        if (base[attr] !== undefined) {
          base[attr] = Math.round(base[attr] * (1 + val));
        }
      });
    }
  });
  return base;
}

const SPECIES_FLAVOR = {
  cyberGorilla: [
    '"Gorilla. Hits like a freight shuttle. The momentum builds — don\'t let it."',
    '"Cyber Gorilla. Seventy-five attack power. That\'s not a typo."',
    '"Break the rhythm or it breaks you. Simple as that."',
  ],
  psychoSquid: [
    '"Squid. Gets in your head. Literally. Watch your composure bar."',
    '"The Paranoia passive is the real threat. Your own menu lies to you."',
    '"Fast strikes. Don\'t give it time to think — or make YOU stop thinking."',
  ],
  beeSwarm: [
    '"Twelve thousand individual organisms. Each one wants you dead."',
    '"Residual Sting is the clock. You\'re always losing 1 Body. Don\'t stall."',
    '"Cheap moves, constant evasion. Pin it down with area attacks."',
  ],
  terrorPinTurtle: [
    '"Turtle. You\'ll hit it. It won\'t care. Then your stamina runs out."',
    '"Stamina Tax on every big push. Death by a thousand paper cuts to your gas tank."',
    '"Grabs pull it out. Psychic goes through the shell. Use them."',
  ],
  echomorph: [
    '"It copies you. Vary your moves or fight a mirror match."',
    '"Builds resistance to repeated attacks. Third hit of the same type barely scratches it."',
    '"Bait cheap, hit expensive. Don\'t let it find your rhythm."',
  ],
  hydravine: [
    '"Regenerates everything. Chip damage is literally futile."',
    '"Vine Grasp every three turns. When it grabs you, your evasion is gone."',
    '"Burst it down between entangles. FAST attacks hit its weakness."',
  ],
  parasitex: [
    '"This is it. It steals your mutations. Every graft you lose makes it stronger."',
    '"Three phases. It hunts, it builds, it finishes. Kill it before phase three."',
    '"Protect your teched mutations. Those are what it wants most."',
  ],
};

export default function ScoutingScreen({ playerCharKey, opponentCharKey, onEnter, onBack, codex }) {
  const player = characters[playerCharKey];
  const opp = characters[opponentCharKey];
  const oppSprite = SPRITES[opponentCharKey]?.front;

  // Codex-based progressive reveal
  const codexEntry = codex?.[opponentCharKey];
  const encounters = codexEntry?.encounters || 0;
  const showStyle = encounters >= 1;
  const showPassive = encounters >= 2;
  const showMoves = encounters >= 3;

  return (
    <div className="screen" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      background: 'linear-gradient(180deg, #050810 0%, #0a1020 50%, #0f1830 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Atmospheric effects */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 60% 30%, ${opp.color}06 0%, transparent 50%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
        background: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
      }} />

      {/* Header */}
      <div style={{ fontSize: 10, color: 'var(--purple)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        // pre-fight scouting report
      </div>

      <div style={{
        display: 'flex', gap: 24, maxWidth: 900, width: '100%', flexWrap: 'wrap',
        justifyContent: 'center', position: 'relative', zIndex: 1,
      }}>
        {/* Your moves — left */}
        <div style={{ flex: '1 1 260px', maxWidth: 340 }}>
          <div className="section-header accent-cyan">Your Moves</div>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {player.moves.map((m, i) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0',
                borderBottom: i < player.moves.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <TypeBadge type={m.moveType} />
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1, color: 'var(--text-primary)' }}>{m.name}</span>
                <span style={{ fontSize: 10, color: 'var(--stamina-text)', fontFamily: 'var(--font-mono)' }}>{m.minCost}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.target}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: player.color, fontWeight: 600, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Kill: {player.killHint || player.killCondition}
          </div>
        </div>

        {/* Opponent intel — right */}
        <div style={{ flex: '1 1 360px', maxWidth: 500 }}>
          <div className="panel" style={{ borderColor: opp.color + '44' }}>
            {/* Opponent header with sprite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              {oppSprite && (
                <img src={oppSprite} alt={opp.name} style={{
                  width: 64, height: 64, imageRendering: 'pixelated', objectFit: 'contain',
                  filter: encounters === 0 ? 'brightness(0.3) saturate(0)' : 'none',
                  transition: 'filter 0.3s',
                }} />
              )}
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2 }}>Next Opponent</div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: opp.color, lineHeight: 1.1 }}>{opp.name}</h2>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 2 }}>{opp.description}</div>
              </div>
            </div>

            {/* Scout warning */}
            {opp.scoutWarning && (
              <div style={{
                background: 'rgba(238,102,102,0.06)', border: '1px solid rgba(238,102,102,0.3)',
                padding: '8px 12px', marginBottom: 12,
                fontSize: 10, fontWeight: 700, color: 'var(--lose)', textTransform: 'uppercase', letterSpacing: 1,
              }}>
                {opp.scoutWarning}
              </div>
            )}

            {/* Fighting style */}
            {showStyle ? (
              <div style={{ marginBottom: 12 }}>
                <div className="section-header">Fighting Style</div>
                <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>{opp.style}</div>
              </div>
            ) : (
              <div style={{ marginBottom: 12, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Fighting style unknown. Fight them to learn more.
              </div>
            )}

            {/* Matchup hints */}
            {showStyle && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)', padding: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--win)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Strong</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{opp.strongAgainst}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(238,102,102,0.04)', border: '1px solid rgba(238,102,102,0.15)', padding: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--lose)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Weak</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{opp.weakAgainst}</div>
                </div>
              </div>
            )}

            {/* Passive */}
            {showPassive ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--composure-text)', marginBottom: 3 }}>
                  Passive: {opp.passive.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{opp.passive.description}</div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 3 }}>Passive: ???</div>
                <div style={{ fontSize: 10, color: 'var(--text-ghost)', fontStyle: 'italic' }}>Fight them again to reveal.</div>
              </div>
            )}

            {/* Moves */}
            {showMoves ? (
              <>
                <div className="section-header">Their Moves</div>
                {opp.moves.map((m, i) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                    borderBottom: i < opp.moves.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <TypeBadge type={m.moveType} />
                    <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{m.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--stamina-text)', fontFamily: 'var(--font-mono)' }}>{m.minCost}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.target}</span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Moves unknown. {encounters === 0 ? 'Going in blind.' : 'Fight them more to reveal moves.'}
              </div>
            )}

            {/* Kill condition + codex */}
            <div style={{ fontSize: 10, color: opp.color, fontWeight: 600, marginTop: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Kill: {opp.killCondition}
            </div>
            {encounters > 0 && (
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 6 }}>
                Codex: {encounters} encounter{encounters !== 1 ? 's' : ''} | {codexEntry?.defeated || 0} defeated
              </div>
            )}

            {/* Combat assessment — attribute descriptors */}
            {showStyle && (() => {
              const oppStats = computeEffectiveStats(opponentCharKey);
              const attrs = [
                { key: 'attack', label: 'ATK' },
                { key: 'defense', label: 'DEF' },
                { key: 'willpower', label: 'WILL' },
                { key: 'toughness', label: 'TGH' },
              ];
              return (
                <div style={{ marginTop: 12, background: 'rgba(100,140,180,0.04)', border: '1px solid rgba(100,140,180,0.15)', padding: '8px 12px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
                    // combat assessment
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                    {attrs.map((a, i) => {
                      const desc = getAttrDescriptor(oppStats[a.key]);
                      return (
                        <span key={a.key}>
                          <span style={{ color: 'var(--text-muted)' }}>{a.label}: </span>
                          <span style={{ color: desc.color, fontWeight: 700 }}>{desc.label}</span>
                          {i < attrs.length - 1 && <span style={{ color: 'var(--text-ghost)', margin: '0 2px' }}> | </span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center' }}>
            <button onClick={onBack} className="btn" style={{ flex: 1 }}>
              Back Out
            </button>
            <button onClick={onEnter} className="btn graft" style={{
              flex: 2, fontWeight: 700, fontSize: 12,
              borderColor: opp.color, color: opp.color,
              boxShadow: `0 0 16px ${opp.color}22`,
            }}>
              Enter Arena
            </button>
          </div>
        </div>
      </div>

      {/* Vex scouting commentary */}
      <div className="npc-bar vex" style={{ maxWidth: 600, width: '100%', marginTop: 8, position: 'relative', zIndex: 1 }}>
        <div className="npc-name" style={{ color: 'var(--purple)' }}>Cmdr. Vex</div>
        <div className="npc-text">
          {(() => {
            const flavors = SPECIES_FLAVOR[opponentCharKey];
            if (flavors) return flavors[Math.floor(Math.random() * flavors.length)];
            if (encounters === 0) return '"First time facing this one. Stay sharp. Or don\'t. I get paid either way."';
            if (encounters >= 3) return '"You\'ve seen everything they\'ve got. No excuses."';
            return '"You\'ve faced this one before. Use what you learned."';
          })()}
        </div>
      </div>
    </div>
  );
}
