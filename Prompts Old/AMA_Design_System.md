# AMA Design System — Sci-Fi Terminal Aesthetic

## Overview

Dark sci-fi terminal aesthetic. Military/research station feel. Every screen looks like a combat operations terminal aboard an orbital station. Monospace typography throughout. Subtle CRT scanline overlay on all screens.

---

## Color Palette

### Backgrounds
```css
--ama-bg-deepest:   #060a12;   /* Deepest: input fields, inset areas */
--ama-bg-deep:      #080c14;   /* Primary screen background */
--ama-bg-panel:     #0a1220;   /* Cards, panels, slot rows */
--ama-bg-surface:   #0f1a2e;   /* Active tab bodies, hover states */
--ama-bg-arena:     #0a1020;   /* Arena top gradient start */
--ama-bg-arena-mid: #0f1a2e;   /* Arena mid */
--ama-bg-arena-btm: #162040;   /* Arena floor */
```

### Accent Colors (functional, not decorative)
```css
--ama-cyan:     #00ccff;   /* Primary interactive: selections, phase labels, buttons */
--ama-green:    #00ff88;   /* Positive: health, grafts active, Dr. Helix, biomass */
--ama-amber:    #ccaa22;   /* Neutral resource: tech points, grab type */
--ama-red:      #ee6666;   /* Danger: body damage, finishers, remove actions */
--ama-purple:   #aa66ee;   /* Composure, psychic type */
```

### Text Hierarchy
```css
--ama-text-bright:   #e0f0f8;   /* Headlines, species names, selected items */
--ama-text-primary:  #c0d0d8;   /* Body text, move names, stat values */
--ama-text-muted:    #6a8a9a;   /* NPC dialogue, descriptions */
--ama-text-dim:      #4a6a7a;   /* Labels, section headers, secondary info */
--ama-text-ghost:    #2a4a5a;   /* Locked content, fog of war, empty slots */
--ama-text-dead:     #1a2a3a;   /* Barely visible: locked future content */
```

### Border Hierarchy
```css
--ama-border-subtle:  #111a28;   /* Separators inside panels */
--ama-border-default: #1a2838;   /* Card/panel borders */
--ama-border-medium:  #1a3040;   /* Slot icons, mutation borders */
--ama-border-hover:   #2a5878;   /* Hover state */
--ama-border-active:  #00ccff;   /* Selected item (cyan) */
--ama-border-graft:   #2a8a55;   /* Active graft indicator (green) */
```

### Resource Bar Colors
```css
/* Guard (blue) */
--ama-guard-fill:   #2288cc;
--ama-guard-text:   #44aadd;

/* Composure (purple) */
--ama-comp-fill:    #8844cc;
--ama-comp-text:    #aa66ee;

/* Body (red) */
--ama-body-fill:    #cc4444;
--ama-body-text:    #ee6666;

/* Stamina (green) */
--ama-stam-fill:    #44cc66;
--ama-stam-text:    #66ee88;

/* Mutation HP (bright green) */
--ama-mut-hp-fill:  #00ff88;
--ama-mut-hp-bg:    #0a2a15;
```

### Move Type Badge Colors
```css
/* Each type has: background, text color, border */
POWER:    bg #1a0a0a,  text #ee6644,  border #3a1a1a
PSYCHIC:  bg #1a0a2a,  text #aa66ee,  border #2a1a3a
AREA:     bg #0a1a0a,  text #66cc44,  border #1a2a1a
GRAB:     bg #1a1a0a,  text #ccaa22,  border #2a2a1a
DEFENSE:  bg #0a0a1a,  text #4488cc,  border #1a1a2a
FINISHER: bg #2a0a0a,  text #ff4444,  border #4a1a1a
```

---

## Typography

### Font
```css
@import url('https://cdn.jsdelivr.net/npm/share-tech-mono@1.0.0/index.min.css');
font-family: 'Share Tech Mono', monospace;
```

Monospace everywhere. No secondary font. The monospace IS the aesthetic.

### Scale
```
10px — Section headers (letter-spacing: 2-3px, uppercase)
11px — Body text, stat values, NPC names, move names
12px — Slightly emphasized body (used sparingly)
13px — Card titles, species names, push values
14px — Detail panel names, selected item names
15px — Species name in resource panels
22px — Card icons (inside 32px icon boxes)
```

### Text Conventions
- Section headers always prefixed with `//` (e.g., `// move select`, `// dr. helix laboratory`)
- All section headers: uppercase, letter-spacing 2-3px, color `--ama-text-dim`
- Accent headers (phase labels, screen titles) use cyan or green instead of dim
- Status badges: uppercase, letter-spacing 1px, 9px font

---

## Scanline Overlay

Applied to every screen via `::after` pseudo-element:

```css
.screen::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.06) 2px,
    rgba(0, 0, 0, 0.06) 4px
  );
  pointer-events: none;
  z-index: 50;
}
```

Subtle, not distracting. Just enough to sell the CRT terminal feel.

---

## Component Patterns

### Panel / Card
```css
background: var(--ama-bg-panel);     /* #0a1220 */
border: 1px solid var(--ama-border-default); /* #1a2838 */
padding: 16px;
/* No border-radius — angular/sharp edges throughout */
/* Exception: the outermost game container gets border-radius: 8px */
```

### Interactive Card (hoverable)
```css
.card {
  /* base panel styles */
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.card:hover {
  border-color: var(--ama-border-hover);  /* #2a5878 */
  background: var(--ama-bg-surface);      /* #0f1a2e */
}
.card.selected {
  border-color: var(--ama-cyan);          /* #00ccff */
  background: #0a1a2e;
}
/* Double-border glow on selected items */
.card.selected::before {
  content: '';
  position: absolute;
  inset: -1px;
  border: 1px solid rgba(0, 200, 255, 0.3);
}
```

### Resource Bar
```html
<div class="res-row guard">
  <span class="res-label">GRD</span>
  <div class="res-bar-bg">
    <div class="res-fill" style="width: 65%"></div>
  </div>
  <span class="res-val">13</span>
</div>
```
```css
.res-bar-bg {
  flex: 1;
  height: 8px;
  background: #0a1525;
  border: 1px solid #1a2a3a;
}
.res-fill {
  height: 100%;
  transition: width 0.3s;
}
/* Labels use abbreviated names: GRD, CMP, BDY, STM */
/* Label + value colored to match fill */
```

### Mutation Slot (compact, in resource panel)
```css
.mut-slot {
  width: 28px;
  height: 28px;
  border: 1px solid #1a3040;
  background: #0a1520;
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3a5a6a;
  position: relative;
}
.mut-slot.active {
  border-color: #2a8a55;
  background: #0a1a15;
}
/* Mini HP bar at bottom of slot */
```

### Tab Navigation
```css
.tab {
  padding: 8px 16px;
  font-size: 11px;
  letter-spacing: 1px;
  cursor: pointer;
  background: var(--ama-bg-panel);
  border: 1px solid var(--ama-border-default);
  border-bottom: none;
  color: var(--ama-text-dim);
  text-transform: uppercase;
}
.tab.active {
  background: var(--ama-bg-surface);
  border-color: #1a3848;
  color: var(--ama-green);
}
/* Tab body sits below with margin-top: -1px to overlap border */
```

### Action Button
```css
.btn {
  background: transparent;
  border: 1px solid var(--ama-cyan);
  color: var(--ama-cyan);
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  letter-spacing: 2px;
  padding: 8px 24px;
  cursor: pointer;
  text-transform: uppercase;
}
.btn:hover {
  background: rgba(0, 200, 255, 0.1);
}

/* Variant: positive action */
.btn.graft {
  border-color: #2a8a55;
  color: #66ee88;
}

/* Variant: danger action */
.btn.danger {
  border-color: #5a2a2a;
  color: #ee6666;
}
```

### Status Badge
```css
.badge {
  font-size: 9px;
  padding: 2px 6px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.badge-ready  { background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3); color: #66ee88; }
.badge-new    { background: rgba(0,200,255,0.1); border: 1px solid rgba(0,200,255,0.3); color: #44ccff; }
.badge-locked { background: rgba(100,100,100,0.1); border: 1px solid rgba(100,100,100,0.3); color: #4a5a5a; }
```

### NPC Dialogue Bar
```css
.npc-bar {
  background: var(--ama-bg-panel);
  border: 1px solid var(--ama-border-default);
  border-left: 2px solid var(--ama-green);  /* NPC accent color */
  border-radius: 0;  /* Sharp edges, no rounding */
  padding: 10px 14px;
}
/* NPC name in accent color, dialogue in --ama-text-muted */
```

### Move Card (Fight Screen)
```css
.move-card {
  background: var(--ama-bg-panel);
  border: 1px solid var(--ama-border-default);
  padding: 8px 6px;
  cursor: pointer;
  text-align: center;
}
/* Contains: move-name (11px) + move-type badge (9px) */
/* Grid: 5 columns for base 5 moves, expands if mutations add more */
```

### Stamina Push Track
```css
/* 10 segments in a row, filled segments glow green */
.push-seg {
  flex: 1;
  border-right: 1px solid #111a28;
}
.push-seg.filled {
  background: rgba(0, 255, 136, 0.15);
}
.push-seg.filled::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid rgba(0, 255, 136, 0.2);
}
```

---

## Screen-Specific Layout Notes

### Fight Screen
- **Arena** (top): 380px tall, gradient background, sprites positioned absolutely
  - Opponent: top-right, 120px sprite
  - Player: bottom-left, 160px sprite
  - Floor line with subtle cyan glow at bottom
  - Resource panels overlay the arena corners (opponent top-left, player bottom-right)
- **UI Bottom** (below arena): move grid, push track, commit button
  - Phase bar with `// phase name` label + turn counter
  - 5-column move grid (expandable with mutations)
  - Push track + commit button

### Overworld Hub (2D Top-Down Dungeon Crawl)
- HTML5 Canvas 2D rendering, tile map based
- WASD movement, camera follows player (centered)
- Dark sci-fi floor (#0b1018) with subtle cyan grid lines, wall borders (#1a2a3a)
- 4 arena doors along north wall with color-coded glow lines (green=cleared, cyan=next, dark=locked)
- NPCs in alcoves with colored accent glows (Helix=green, Vex=purple) and nameplates
- Codex and Supplies as terminal objects with cyan/amber accents
- Tournament bracket as a wall display near arena doors
- Proximity + E interaction: walk near, prompt appears, press E
- NPC/terminal interaction opens screen overlay on top of dimmed hub
- Arena door interaction: fade to black → FightScreen (the 2D-to-3D shift is the drama)

### Doctor Screen
- Resource display (Biomass + Tech Points) in header
- 4-tab navigation: Graft / Enhance / Remove / Items
- Tab body: left column = 6 body slots, right column = detail/preview panel
- NPC dialogue bar at bottom (Dr. Helix)

### Character Select
- 4-column species grid with portrait areas, names, styles, passives
- Detail panel below: base moves (left) + base stats (right)
- Launch button + meta-progression bar at bottom

### Scouting Screen
- Same panel/card system as hub
- Progressive reveal based on codex level (0 = name only, 1+ = style, 2+ = passive, 3+ = full moves)
- Fog of war uses `--ama-text-ghost` (#2a4a5a) and `???` placeholder text
- Scout warnings rendered as amber badges

### Harvest Screen (post-fight)
- Defeated opponent's available mutations displayed as cards
- ADD vs REPLACE clearly labeled per mutation
- Slot selection if REPLACE (shows what you're losing)
- Skip option always available
- Biomass reward displayed

---

## Design Principles

1. **No border-radius on inner elements.** Only the outermost game container gets rounded corners. Everything inside is sharp/angular. Military terminal feel.

2. **Color means something.** Cyan = interactive/info. Green = positive/bio. Amber = tech/neutral. Red = danger/damage. Purple = composure/psychic. Never decorative.

3. **The `//` prefix is the brand.** Every section header uses it. It reads like code comments in a terminal readout.

4. **Dim by default, bright on interaction.** Unselected items are muted (#4a6a7a borders, #3a5a6a text). Selection pops with accent color borders and double-glow effect.

5. **Information density is a feature.** This is a strategy game — players want data visible. Resource bars, mutation HP, type badges, tech costs all shown at a glance. No hiding behind tooltips for critical combat info.

6. **Pixel art gets `image-rendering: pixelated`.** Always. On every sprite. The Scenario art is meant to be crisp at scale, not smoothed.
