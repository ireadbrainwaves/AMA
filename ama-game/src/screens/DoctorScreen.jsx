import React, { useState, useMemo } from 'react';
import { doctorMutations } from '../data/mutations';
import { items as allItems, ITEM_CATEGORIES, RARITY_COLORS, getShopOfferings } from '../data/items';
import { TECH_ENHANCEMENTS, getAvailableTech } from '../data/constants';
import CharacterPreview from '../components/CharacterPreview';

// Body slots as the mutation system sees them (not compositor's leftArm/rightArm)
const BODY_SLOTS = [
  { id: 'head', label: 'HEAD', icon: 'H' },
  { id: 'arms', label: 'ARMS', icon: 'A' },
  { id: 'chest', label: 'CHEST', icon: 'C' },
  { id: 'back', label: 'BACK', icon: 'B' },
  { id: 'legs', label: 'LEGS', icon: 'L' },
];

const TABS = [
  { id: 'graft', label: 'Graft' },
  { id: 'enhance', label: 'Enhance' },
  { id: 'remove', label: 'Remove' },
  { id: 'items', label: 'Items' },
];

function getDoctorDialogue(meta, tab) {
  const runs = meta?.totalRuns || 0;
  const lastDeath = meta?.lastDeathSpecies;

  if (tab === 'graft') {
    if (runs <= 1) return "First time? This might sting.";
    if (runs === 2) return "Back from the dead. Let's try something different.";
    if (runs <= 5) return `You again? At this point you're my best customer.`;
    if (runs <= 10) return "I've run out of places to attach things. Let's improvise.";
    return "You and I have been through a lot together. Let's make this one count.";
  }
  if (tab === 'enhance') return "Augmentation isn't cheap. But neither is dying.";
  if (tab === 'remove') return "Removal is messy. I'll do my best to keep you in one piece.";
  if (tab === 'items') return "Supplies are limited. Choose wisely.";

  if (lastDeath) {
    const names = { cyberGorilla: 'Gorilla', psychoSquid: 'Squid', beeSwarm: 'Bee Swarm', terrorPinTurtle: 'Turtle', echomorph: 'Echomorph', hydravine: 'Hydravine', parasitex: 'Parasitex' };
    return `Ah, the ${names[lastDeath] || lastDeath} got you. I might have something for that.`;
  }
  return "What'll it be?";
}

// Get mutation installed in a given slot
function getMutationInSlot(mutations, slotId) {
  if (!mutations) return null;
  return mutations.find(m => m.slot === slotId && (m.type === 'ADD' || m.type === 'REPLACE' || m.type === 'SHIELD'));
}

// Get non-slotted mutations (MODIFY, PASSIVE)
function getPassiveMutations(mutations) {
  if (!mutations) return [];
  return mutations.filter(m => !m.slot || (m.type !== 'ADD' && m.type !== 'REPLACE' && m.type !== 'SHIELD'));
}

export default function DoctorScreen({
  biomass, credits, techPoints, techCapacity, meta, playerSpecies, playerBuild,
  mutations, playerTech, onGraft, onRemoveMutation, onBuyTech, onDone, items, onBuyItem,
}) {
  const [activeTab, setActiveTab] = useState('graft');
  const [selectedSlot, setSelectedSlot] = useState(null);

  const dialogue = getDoctorDialogue(meta, activeTab);

  // Pick 3 random doctor mutations (stable per visit)
  const offerings = useMemo(() => {
    const shuffled = [...doctorMutations].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  // Pick 3 items for sale (2 common + 1 better)
  const itemOfferings = useMemo(() => getShopOfferings(), []);

  // Tech installed per slot
  const techBySlot = useMemo(() => {
    const map = {};
    if (playerTech) {
      playerTech.forEach(t => {
        if (!map[t.slot]) map[t.slot] = [];
        map[t.slot].push(t.techId);
      });
    }
    return map;
  }, [playerTech]);

  // Total tech points used
  const techUsed = useMemo(() => {
    if (!playerTech) return 0;
    return playerTech.reduce((sum, t) => {
      const def = TECH_ENHANCEMENTS[t.techId];
      return sum + (def?.techCost || 0);
    }, 0);
  }, [playerTech]);

  const techRemaining = (techCapacity || 10) - techUsed;

  // Available tech for selected slot
  const availableTech = useMemo(() => {
    if (!selectedSlot) return [];
    const mutInSlot = getMutationInSlot(mutations, selectedSlot);
    if (!mutInSlot) return [];
    // Get tech compatible with this slot + species
    return getAvailableTech(playerSpecies, selectedSlot).filter(tech => {
      // Already installed?
      const installed = techBySlot[selectedSlot] || [];
      if (installed.includes(tech.id)) return false;
      return true;
    });
  }, [selectedSlot, mutations, playerSpecies, techBySlot]);

  return (
    <div className="screen" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      padding: 0, maxWidth: 800, width: '100%', margin: '0 auto',
    }}>
      {/* Resource Header */}
      <div style={{
        display: 'flex', gap: 20, padding: '16px 20px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
        justifyContent: 'center', flexWrap: 'wrap',
      }}>
        <ResourceChip label="Credits" value={credits} color="var(--amber)" />
        <ResourceChip label="Tech" value={`${techUsed}/${techCapacity || 10}`} color="var(--cyan)" />
        <ResourceChip label="Biomass" value={biomass} color="var(--green)" />
        <ResourceChip label="Items" value={`${items?.length || 0}/3`} color="var(--text-secondary)" />
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav" style={{ padding: '0 20px', paddingTop: 12 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setSelectedSlot(null); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="tab-body" style={{
        flex: 1, margin: '0 20px', display: 'flex', gap: 16, minHeight: 0,
      }}>
        {/* Left Column: Body Slots */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="section-header accent-green">Body Slots</div>
          {BODY_SLOTS.map(slot => {
            const mut = getMutationInSlot(mutations, slot.id);
            const tech = techBySlot[slot.id] || [];
            const isSelected = selectedSlot === slot.id;
            return (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(isSelected ? null : slot.id)}
                style={{
                  background: isSelected ? '#0a1a2e' : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? 'var(--cyan)' : mut ? 'var(--border-graft)' : 'var(--border)'}`,
                  padding: '8px 10px', textAlign: 'left', color: 'var(--text-primary)',
                  cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <div style={{
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${mut ? 'var(--border-graft)' : '#1a3040'}`,
                  background: mut ? '#0a1a15' : '#0a1520',
                  fontSize: 10, color: mut ? 'var(--green)' : '#3a5a6a', flexShrink: 0,
                }}>
                  {slot.icon}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
                    {slot.label}
                  </div>
                  {mut ? (
                    <div style={{ fontSize: 11, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {mut.name}
                      {tech.length > 0 && <span style={{ color: 'var(--cyan)', fontSize: 9, marginLeft: 4 }}>+{tech.length} tech</span>}
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: 'var(--text-ghost)' }}>Empty</div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Passive / Modify mutations (no slot) */}
          {getPassiveMutations(mutations).length > 0 && (
            <>
              <div className="section-header" style={{ marginTop: 8 }}>Passives</div>
              {getPassiveMutations(mutations).map(m => (
                <div key={m.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  padding: '6px 10px', fontSize: 10, color: 'var(--text-secondary)',
                }}>
                  {m.name} <span style={{ color: 'var(--text-muted)' }}>({m.type})</span>
                </div>
              ))}
            </>
          )}

          {/* Character Preview */}
          {playerSpecies && (
            <div style={{ marginTop: 8 }}>
              <CharacterPreview
                species={playerSpecies}
                view="front"
                playerBuild={playerBuild}
                highlightedSlot={selectedSlot === 'arms' ? 'leftArm' : selectedSlot}
              />
            </div>
          )}
        </div>

        {/* Right Column: Tab Content */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {activeTab === 'graft' && (
            <GraftTab
              offerings={offerings}
              biomass={biomass}
              mutations={mutations}
              selectedSlot={selectedSlot}
              onGraft={onGraft}
            />
          )}
          {activeTab === 'enhance' && (
            <EnhanceTab
              selectedSlot={selectedSlot}
              mutations={mutations}
              availableTech={availableTech}
              credits={credits}
              techRemaining={techRemaining}
              techBySlot={techBySlot}
              onBuyTech={onBuyTech}
              playerSpecies={playerSpecies}
            />
          )}
          {activeTab === 'remove' && (
            <RemoveTab
              selectedSlot={selectedSlot}
              mutations={mutations}
              onRemoveMutation={onRemoveMutation}
            />
          )}
          {activeTab === 'items' && (
            <ItemsTab
              itemOfferings={itemOfferings}
              biomass={biomass}
              items={items}
              onBuyItem={onBuyItem}
            />
          )}
        </div>
      </div>

      {/* NPC Dialogue + Done button */}
      <div style={{ padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div className="npc-bar" style={{ flex: 1 }}>
          <div className="npc-name" style={{ color: 'var(--green)' }}>Dr. Helix</div>
          <div className="npc-text">"{dialogue}"</div>
        </div>
        <button className="btn" onClick={onDone} style={{ flexShrink: 0 }}>
          Done
        </button>
      </div>
    </div>
  );
}

/* ============ SUB-COMPONENTS ============ */

function ResourceChip({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function GraftTab({ offerings, biomass, mutations, selectedSlot, onGraft }) {
  const [bought, setBought] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="section-header accent-green">Available Grafts</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
        {selectedSlot
          ? `Showing grafts for ${selectedSlot.toUpperCase()} slot`
          : 'Select a body slot to filter, or graft directly'}
      </div>
      {offerings.map(mut => {
        const canAfford = biomass >= mut.cost;
        // Check if slot already occupied
        const slotOccupied = mut.slot && mutations?.some(m => m.slot === mut.slot && (m.type === 'ADD' || m.type === 'REPLACE' || m.type === 'SHIELD'));
        // Filter by selected slot if one is chosen
        const slotMatch = !selectedSlot || !mut.slot || mut.slot === selectedSlot;
        const dimmed = !slotMatch || !canAfford || bought || slotOccupied;

        return (
          <button
            key={mut.id}
            disabled={dimmed}
            onClick={() => {
              onGraft(mut, mut.cost);
              setBought(true);
            }}
            className="card"
            style={{
              textAlign: 'left', opacity: dimmed ? 0.35 : 1,
              cursor: dimmed ? 'not-allowed' : 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-bright)' }}>{mut.name}</span>
                {mut.slot && (
                  <span className="badge-new" style={{ marginLeft: 6, fontSize: 8, padding: '1px 4px' }}>
                    {mut.slot.toUpperCase()}
                  </span>
                )}
                <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 6 }}>{mut.type}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{mut.cost} bio</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{mut.description}</div>
            {slotOccupied && mut.slot && (
              <div style={{ fontSize: 9, color: 'var(--red)', marginTop: 4 }}>Slot occupied — remove first</div>
            )}
          </button>
        );
      })}
      {bought && (
        <div style={{ fontSize: 10, color: 'var(--green)', textAlign: 'center', padding: 8 }}>
          Grafted successfully. Switch tabs or press Done.
        </div>
      )}
    </div>
  );
}

function EnhanceTab({ selectedSlot, mutations, availableTech, credits, techRemaining, techBySlot, onBuyTech, playerSpecies }) {
  if (!selectedSlot) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="section-header accent-cyan">Tech Enhancements</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
          Select an occupied body slot to view available enhancements.
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-ghost)', textAlign: 'center' }}>
          Tech remaining: {techRemaining} TP
        </div>
      </div>
    );
  }

  const mutInSlot = getMutationInSlot(mutations, selectedSlot);
  if (!mutInSlot) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="section-header accent-cyan">Tech Enhancements</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
          {selectedSlot.toUpperCase()} slot is empty. Graft a mutation first.
        </div>
      </div>
    );
  }

  const installedHere = techBySlot[selectedSlot] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="section-header accent-cyan">Enhance: {mutInSlot.name}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
        Slot: {selectedSlot.toUpperCase()} | Tech remaining: {techRemaining} TP | Credits: {credits}
      </div>

      {/* Already installed */}
      {installedHere.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Installed</div>
          {installedHere.map(tId => {
            const def = TECH_ENHANCEMENTS[tId];
            return def ? (
              <div key={tId} style={{
                background: '#0a1a25', border: '1px solid var(--cyan)', padding: '6px 10px',
                fontSize: 10, color: 'var(--cyan)', marginBottom: 2,
              }}>
                {def.name} <span style={{ color: 'var(--text-muted)' }}>— {def.description}</span>
              </div>
            ) : null;
          })}
        </div>
      )}

      {/* Available to buy */}
      {availableTech.length === 0 ? (
        <div style={{ fontSize: 10, color: 'var(--text-ghost)', padding: 12, textAlign: 'center' }}>
          No more enhancements available for this slot.
        </div>
      ) : (
        availableTech.map(tech => {
          const canAfford = credits >= tech.cost && techRemaining >= tech.techCost;
          return (
            <button
              key={tech.id}
              disabled={!canAfford}
              onClick={() => onBuyTech(tech, selectedSlot)}
              className="card"
              style={{
                textAlign: 'left', opacity: canAfford ? 1 : 0.35,
                cursor: canAfford ? 'pointer' : 'not-allowed',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-bright)' }}>{tech.name}</span>
                  <span className={`badge-${tech.category === 'offensive' ? 'weak' : tech.category === 'defensive' ? 'ready' : 'new'}`}
                    style={{ marginLeft: 6, fontSize: 8, padding: '1px 4px' }}>
                    {tech.category}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                  <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{tech.cost}c</span>
                  <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{tech.techCost}tp</span>
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tech.description}</div>
            </button>
          );
        })
      )}
    </div>
  );
}

function RemoveTab({ selectedSlot, mutations, onRemoveMutation }) {
  if (!selectedSlot) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="section-header accent-red">Remove Mutation</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
          Select an occupied body slot to remove its mutation.
        </div>
      </div>
    );
  }

  const mutInSlot = getMutationInSlot(mutations, selectedSlot);
  if (!mutInSlot) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="section-header accent-red">Remove Mutation</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
          {selectedSlot.toUpperCase()} slot is already empty.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="section-header accent-red">Remove Mutation</div>
      <div className="panel" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-bright)', marginBottom: 4 }}>{mutInSlot.name}</div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>{mutInSlot.description}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
          Slot: {selectedSlot.toUpperCase()} | Type: {mutInSlot.type} | HP: {mutInSlot.hp || '—'}
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--red)', marginBottom: 8, lineHeight: 1.5 }}>
        Warning: Removal is permanent. Any moves and tech enhancements on this mutation will be lost.
      </div>
      <button
        className="btn danger"
        onClick={() => onRemoveMutation(mutInSlot.id)}
      >
        Remove {mutInSlot.name}
      </button>
    </div>
  );
}

function ItemsTab({ itemOfferings, biomass, items, onBuyItem }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="section-header accent-amber">Supplies</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
        Items: {items?.length || 0}/3 | Using an item costs your turn (opponent attacks free)
      </div>
      {itemOfferings.map(item => {
        const cost = item.cost || 1;
        const canAfford = biomass >= cost;
        const atMax = (items?.length || 0) >= 3;
        const disabled = !canAfford || atMax;
        const catColor = ITEM_CATEGORIES[item.category]?.color || 'var(--text-muted)';
        const rarityColor = RARITY_COLORS[item.rarity] || '#6a8a9a';
        return (
          <button
            key={item.id}
            disabled={disabled}
            onClick={() => onBuyItem({ ...item }, cost)}
            className="card"
            style={{
              textAlign: 'left', opacity: disabled ? 0.35 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
              borderLeft: `2px solid ${catColor}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{item.icon || '•'}</span>
                {item.name}
                <span style={{ fontSize: 8, color: rarityColor, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 400 }}>
                  {item.rarity}
                </span>
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>{cost} bio</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.description}</div>
            {item.flavor && (
              <div style={{ fontSize: 9, color: 'var(--text-ghost)', fontStyle: 'italic', marginTop: 2 }}>{item.flavor}</div>
            )}
          </button>
        );
      })}
      {(items?.length || 0) >= 3 && (
        <div style={{ fontSize: 10, color: 'var(--amber)', textAlign: 'center', padding: 8 }}>
          Item capacity full (3/3)
        </div>
      )}

      {/* Current inventory */}
      {items && items.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 12 }}>Current Inventory</div>
          {items.map((item, idx) => {
            const catColor = ITEM_CATEGORIES[item.category]?.color || 'var(--text-muted)';
            return (
              <div key={`${item.id}_${idx}`} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderLeft: `2px solid ${catColor}`,
                padding: '6px 10px',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13 }}>{item.icon || '•'}</span>
                  {item.name}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{item.description}</div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
