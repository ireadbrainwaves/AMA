# AMA: ALIEN MARTIAL ARTS — OVERWORLD SPRINT PROMPT GUIDE

**Build the 2D hub world on top of the existing battle system**
**PixiJS overworld + React battle screens + 8-bit pixel art style**

---

## How to Use

Fire these prompts in order into Claude Code. Each one builds on the last. Test after each prompt before moving to the next. The battle system already works — this sprint adds the world around it.

---

# Prompt 1 — PixiJS Setup and Hub Map

```
I have an existing React/Vite game called AMA: Alien Martial Arts with a
working battle system (FightScreen, CharacterSelect, HarvestScreen,
DoctorScreen, VictoryScreen). I need to add a 2D top-down overworld hub
that connects everything together.

TECH:
- Install pixi.js (latest v7 or v8)
- Create an OverworldScreen React component that contains a PixiJS canvas
- The overworld renders inside this component
- When player enters an arena door, React swaps to FightScreen
- After fight, return to OverworldScreen
- All existing React screens (harvest, doctor, victory) render as overlays
  on top of the overworld OR as full screen swaps — whichever is simpler

HUB MAP:
- Tile-based, 30x20 grid
- Each tile is 32x32 pixels (960x640 canvas)
- Use colored rectangles as placeholder tiles for now:
  - #1a1a2e dark purple = floor
  - #00fff5 cyan = walls (impassable)
  - #e94560 red = arena door tiles (4 total)
  - #4ecca3 green = NPC tiles
  - #f9ed69 gold = mutation doctor
  - #ffffff white = player character

MAP LAYOUT:
Row 0:  WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
Row 1:  W..............D2..............W
Row 2:  W..............................W
Row 3:  W..............................W
Row 4:  W..............................W
Row 5:  W..............................W
Row 6:  W.D1...........C..........D3..W
Row 7:  W..............................W
Row 8:  W..............................W
Row 9:  W..........T.......M..........W
Row 10: W..............................W
Row 11: W..............................W
Row 12: W.....I............I..........W
Row 13: W..............................W
Row 14: W..............................W
Row 15: W..............................W
Row 16: W..............................W
Row 17: W..............................W
Row 18: W..............D4..............W
Row 19: WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW

W = wall, D1-D4 = arena doors, C = decorative center marker
T = trainer NPC, M = mutation doctor, I = item crates
Player spawns at row 17, column 15 (bottom center area)

PLAYER MOVEMENT:
- WASD or arrow keys
- Grid-based (snap to tiles, not smooth free movement)
- Can't walk through walls or NPCs
- Movement speed: respond immediately on keypress, slight delay between
  steps if key is held (~150ms per tile)

Just get the map rendering and player movement working. No interactions
yet. I should see the colored tile map and move my white square around it.
```

---

# Prompt 2 — Arena Doors and Fight Transitions

```
Add arena door functionality to the overworld hub.

ARENA DOORS:
- There are 4 arena doors (D1, D2, D3, D4) on the map
- Each door is assigned a random opponent species from the roster
  (excluding the player's species). Generate this at run start.
- Each door shows a label floating above it:
  "ARENA 1: CYBER GORILLA" (or whatever species was assigned)
  Use simple HTML/CSS text overlay positioned above each door tile,
  or render text in PixiJS — whichever is simpler.

ENTERING AN ARENA:
- When the player walks onto a door tile, show a prompt:
  "Enter arena? [E to enter, any other key to cancel]"
- On pressing E:
  1. Brief screen fade to black (0.3s)
  2. Swap to FightScreen with the assigned opponent
  3. Fight plays out using the existing battle system
  4. On win: show HarvestScreen (mutation or biomass choice)
  5. After harvest: fade back to overworld hub
  6. The cleared arena door changes color to gray (#666666)
     and shows "CLEARED" label
  7. On loss: show defeat screen with "RESTART RUN" button

DIFFICULTY SCALING:
- Track how many arenas the player has cleared (0-4)
- 1st fight (0 cleared): easy AI — picks randomly with slight tendencies
- 2nd fight (1 cleared): moderate AI — uses archetype weights
- 3rd fight (2 cleared): hard AI — reads player patterns from previous fights
- 4th fight (3 cleared): boss AI — aggressive, uses finisher ASAP when available

ARENA ORDER:
- Player chooses which door to enter first. Any order.
- Difficulty is based on how many fights you've done, not which door.

The existing fight system handles everything once we enter. This prompt
is just about the door interaction, transition, and return flow.
```

---

# Prompt 3 — NPC Dialogue System

```
Add NPC interactions to the overworld.

DIALOGUE SYSTEM:
- When player is adjacent to an NPC (one tile away, facing them)
  and presses E, a dialogue box appears
- Dialogue box: dark semi-transparent background at bottom of screen,
  white text, NPC name at top in colored text
- Text appears with a typewriter effect (~30 chars per second)
- Press E or Space to advance to next line
- Press E on the last line to close dialogue
- Player can't move while dialogue is open

TRAINER NPC (green tile near bottom center):
Name: "Commander Vex"
Dialogue sequence (plays in order, one line per E press):
  "Welcome to the Intergalactic Strongman Tournament, rookie."
  "Every fighter has three vitals: Guard, Composure, and Body."
  "Guard is your physical defense. Composure is your mental state."
  "Body is your health. Lose all your Body and you're done."
  "In the arena, pick a move from your menu. Your opponent picks theirs."
  "Both reveal at the same time. Some moves beat others."
  "Read the move descriptions — they tell you what works against what."
  "After the reveal, you bet stamina. More stamina means more damage."
  "But spend too much and you won't have gas for your best moves next turn."
  "Every fighter has a finisher. Break the right vital to unlock it."
  "Check your kill condition — it's always on screen during fights."
  "Now go. Pick an arena. Show them what you've got."

If player talks to Commander Vex AFTER clearing 1+ arenas, alternate dialogue:
  "You're learning. [X] arenas down, [Y] to go."
  "Remember — mutations change your moveset. Use them."

MUTATION DOCTOR NPC (gold tile):
Name: "Dr. Helix"
If player has cleared < 2 arenas:
  "Come back after you've proven yourself. Two wins minimum."
  "I don't waste biomass on amateurs."
If player has cleared >= 2 arenas AND has biomass:
  Opens the existing DoctorScreen as an overlay on the overworld
If player has cleared >= 2 arenas AND has NO biomass:
  "No biomass? Nothing I can do. Harvest some next fight."
  "Choose biomass instead of a direct mutation. Then come see me."
```

---

# Prompt 4 — Item Crates

```
Add item crates to the overworld.

ITEM CRATES:
- There are 2-3 item crate tiles (I) on the map
- When the player walks onto a crate tile:
  1. Show a popup: "Found: [ITEM NAME]! [item description]"
  2. Add the item to the player's inventory
  3. The crate tile changes to a regular floor tile (picked up)
  4. Popup dismisses after 2 seconds or on any keypress

ITEMS:
- Randomly assigned from the item pool at run start:
  Stamina Serum — "Restore 5 stamina mid-fight"
  Guard Patch — "Restore 3 Guard mid-fight"
  Composure Stim — "Restore 3 Composure mid-fight"
  Adrenaline Shot — "Next turn's move deals double base damage"

- Max inventory: 3 items
- If inventory is full when walking on a crate:
  "Inventory full! Drop an item? [show current items, click to drop]"
  Or just show "Inventory full!" and leave the crate for later

INVENTORY DISPLAY:
- Show a small item counter in the overworld HUD
  "Items: 2/3" in the corner
- Press I to open a simple inventory overlay showing current items
  with names and descriptions
- Items are used during fights (already implemented in FightScreen)
```

---

# Prompt 5 — Overworld HUD and Run State

```
Add a HUD to the overworld and track run state properly.

OVERWORLD HUD (always visible on the hub screen):
- Top left: Character name and species with a small colored indicator
- Top right: "Arenas Cleared: X/4"
- Bottom left: "Items: X/3" + "Biomass: X"
- Bottom right: "Mutations: X" (count of mutations acquired)

RUN STATE:
- Create a central RunState manager (or use existing if you have one)
  that tracks across the entire run:
  {
    character: selected character data,
    arenasCleared: 0,
    arenaStates: [
      { id: 1, opponent: 'psychoSquid', cleared: false },
      { id: 2, opponent: 'beeSwarm', cleared: false },
      { id: 3, opponent: 'terrorPinTurtle', cleared: false },
      { id: 4, opponent: 'cyberGorilla', cleared: false }
    ],
    mutations: [],
    items: [],
    biomass: 0,
    currentResources: { guard: 10, composure: 10, body: 10, stamina: 10 },
    totalTurns: 0,
    fightHistory: []
  }

RESOURCE PERSISTENCE:
- After each fight, the player's resources carry over to the next fight
  BUT they heal partially between fights:
  - Body: restore 5 (cap at 10)
  - Guard: fully restore to 10
  - Composure: fully restore to 10
  - Stamina: fully restore to 10
  This means Body is the permanent scar — take too much Body damage
  across fights and you enter the final arena at a disadvantage.

GAME FLOW UPDATE:
1. CharacterSelect → spawn in hub
2. Explore hub, talk to trainer, pick up items
3. Enter arena door → fight → harvest → return to hub
4. Arena door marked cleared. Resources partially restored.
5. Repeat until all 4 cleared OR defeated
6. After 4th win: VictoryScreen shows full run stats
7. Defeat at any point: "DEFEATED" screen with run stats + restart

Make sure the fight system receives the current run state (mutations,
items, current resources) and sends back the updated state after the fight.
```

---

# Prompt 6 — Visual Polish Pass

```
Visual polish on the overworld. Keep the 8-bit placeholder style but
make it look intentional, not broken.

TILE IMPROVEMENTS:
- Floor tiles: add a subtle grid pattern (slightly different shade every
  other tile in a checkerboard) so the grid is visible
- Wall tiles: add a 1px darker border on inner edges to look like blocks
- Arena doors: make them 2 tiles wide. Add a simple arch shape using
  2-3 different colored tiles stacked. Red base with darker red top.
- NPC tiles: show a simple 2-color character shape (just a head and body,
  4-5 pixels, not a full sprite). Trainer = green, Doctor = gold.
- Player character: 2-color shape that changes based on facing direction
  (even just a triangle or arrow showing which way you face)
- Item crates: yellow/gold small square with a dark border

ATMOSPHERE:
- The hub floor should feel like a dark alien colosseum
- Add some decorative tiles scattered around:
  - Small glowing dots on some floor tiles (arena lights)
  - A center ring or platform shape using slightly lighter floor tiles
  - Arena door areas should have a slightly lighter floor leading to them
    like pathways

LABELS:
- Arena door labels should be clearly readable
- NPC names should float above them in small text
- "CLEARED" labels should be distinct (green checkmark or strikethrough)

SCREEN TRANSITIONS:
- Entering an arena: quick fade to black → fight screen
- Returning from fight: fade from black → hub
- Opening dialogue: slight dim on the background
- Opening doctor/harvest screen: slight dim on background

HUD STYLING:
- Semi-transparent dark background behind HUD text
- Clean pixel font or monospace font for HUD
- Color-code the resource counts to match the battle screen
  (Guard blue, Composure purple, Body red, Stamina gold)

Keep it simple. Colored rectangles with intention > bad pixel art.
```

---

# Prompt 7 — Tutorial Flow (First-Time Player)

```
Add a first-time tutorial flow that teaches through the overworld.

When a NEW RUN starts (after character select), the game should guide
the player naturally:

SPAWN:
- Player spawns near Commander Vex (trainer NPC)
- A subtle arrow or pulsing indicator points toward Vex
- Small text at top: "Talk to Commander Vex to prepare for the tournament"

AFTER TALKING TO VEX:
- The arena doors "activate" — before talking to Vex, arena doors
  are dimmed/locked and show "LOCKED" instead of opponent names
- After Vex dialogue completes, doors light up with a brief flash
- Text: "Arenas are now open. Choose your first opponent."
- This ensures every player gets the basic explanation before fighting

FIRST FIGHT:
- During the player's FIRST fight of the run, add contextual hints
  in the battle UI (not the overworld):
  - Turn 1: "Pick a move. Read the descriptions to learn what beats what."
    (shown above the move menu, fades after 5 seconds)
  - First reveal: "You won the matchup!" or "Your move was countered!"
    (extra emphasis text, fades after 3 seconds)
  - First stamina push: "Commit stamina. More = more damage. Watch your gas."
    (shown near the slider, fades after 5 seconds)
  - When a resource breaks: "Their [GUARD] is broken! Your finisher is ready!"
    (if applicable, shown prominently)

AFTER FIRST WIN:
- On returning to hub after first victory, text appears:
  "Well done. Three more to go."
- If player took biomass: arrow points to doctor with
  "Visit Dr. Helix after your next win to spend biomass."
- If player took mutation: "New move added to your menu!"
  with a brief highlight on the mutations counter

SUBSEQUENT RUNS:
- On second+ runs, skip the tutorial hints entirely.
- Vex still has dialogue but arena doors start unlocked.
- Track whether this is a first run in localStorage or run state.
```

---

# Prompt 8 — Sound Effects (Quick Pass)

```
Add minimal sound effects to both the overworld and battle system.
Spend no more than 30 minutes on this. Use the Web Audio API or Howler.js.

For speed, generate simple synthesized sounds programmatically
(oscillator-based bleeps, noise bursts) instead of loading audio files.
8-bit style fits the visual aesthetic anyway.

OVERWORLD SOUNDS:
- Player step: short quiet click/tap on each tile move
- Door interaction: deeper two-tone bleep
- NPC dialogue: soft chirp on each new line of text
- Item pickup: ascending three-note arpeggio
- Menu open/close: quick swoosh

BATTLE SOUNDS:
- Move commit: solid click/lock
- Reveal (tension): brief rising tone during 0.5s pause
- Reveal (flip): short whoosh
- Win matchup: bright positive two-note tone
- Lose matchup: low dull thud
- Stamina push commit: drum-like thud
- Damage dealt: crack/impact scaled to damage amount
  (louder for higher damage)
- Resource break: dramatic shattering sound
- Finisher available: ominous charging tone
- Finisher landed: explosive hit + crowd roar (noise burst)
- Passive trigger: subtle notification ping
- KO: heavy slam + silence
- Turn end: quiet ambient tick

Generate all sounds with Web Audio API oscillators and noise nodes.
Wrap them in a simple SoundManager with methods like:
  playSound('commit'), playSound('reveal'), playSound('impact', volume)

If this takes more than 30 minutes, skip it and move on.
Only the battle reveal sounds really matter — those create the tension.
```

---

# Prompt 9 — Build and Deploy

```
Build and deploy the full game (overworld + battles) as a web game.

1. Make sure all routes work:
   CharacterSelect → Overworld Hub → FightScreen → HarvestScreen →
   back to Hub → DoctorScreen → Hub → VictoryScreen / DefeatScreen

2. Test a full run in dev mode:
   - Pick a character
   - Explore hub, talk to Vex
   - Enter arena, win fight, harvest mutation
   - Enter second arena, win, harvest biomass
   - Visit doctor, buy mutation
   - Clear remaining arenas
   - Victory screen

3. Run the Vite production build: npm run build

4. Test the production build locally with: npx serve dist

5. Prepare for Itch.io:
   - Zip the dist/ folder
   - Make sure index.html is at the root of the zip
   - Canvas/game area should be 960x640 or responsive

6. Itch.io page details:
   Title: "AMA: Alien Martial Arts (Prototype)"
   Description:
     "A two-phase combat roguelike set in an alien tournament.
     Explore the hub. Enter the arena. Pick a move — both fighters
     reveal at the same time. Then bet stamina like a poker hand.
     Harvest mutations from the fallen. Build your alien body.
     Survive four fights to become champion.

     Prototype build — feedback welcome!
     WASD to move. E to interact. Arrow keys work too."

   Tags: prototype, roguelike, strategy, sci-fi, turn-based, 8-bit, aliens
   Kind: HTML5
   Set to: Public

7. Test the live Itch.io link in an incognito browser window
```

---

# Emergency Fix Templates

### Bug Fix

```
Bug: [what's happening]
Expected: [what should happen]
Actual: [what's actually happening]
Steps to reproduce: [how to trigger]

Fix this without changing other working functionality.
Don't refactor. Just fix the bug.
```

### Overworld/Battle Bridge Broken

```
The transition between overworld and battle screen is broken.
[Describe: does it crash? Does it not return to hub? Does state get lost?]

The flow should be:
Hub → player walks on door tile → press E → fade to black →
FightScreen loads with correct opponent and player state →
fight completes → HarvestScreen → fade to black → return to hub
with updated state (mutations, items, biomass, cleared arena)

Check the state passing between OverworldScreen and FightScreen.
Make sure RunState persists across the transition.
```

### NPC Interaction Broken

```
[NPC name] interaction isn't working.
[Describe: dialogue doesn't appear? Can't trigger it? Text is wrong?]

The interaction should be:
Player faces NPC from adjacent tile → press E → dialogue box appears →
E advances text → last line closes dialogue → player can move again

Check the interaction detection (is it checking adjacency and facing?)
and the dialogue state machine.
```

### Movement Broken

```
Player movement in the overworld is broken.
[Describe: stuck? Walking through walls? Not responding to input?]

Movement should be:
WASD or arrow keys → grid-based snap movement → collision check
against wall tiles and NPC tiles → can't move into impassable tiles →
~150ms delay between steps when holding a key

Check the keypress handler and collision detection against the tile map.
```

### State Lost Between Fights

```
After returning from a fight to the hub, [describe what's missing:
mutations not showing? Items gone? Arena not marked cleared?]

The RunState should persist:
- Before entering fight: save current RunState
- During fight: FightScreen reads RunState for player resources/mutations/items
- After fight: FightScreen writes back updated resources + fight result
- HarvestScreen writes back mutation or biomass choice
- On return to hub: OverworldScreen reads updated RunState
  and reflects changes (cleared door, HUD counts, etc.)

Check where RunState is stored (context? zustand? prop drilling?)
and make sure all screens read from and write to the same source.
```

### Just Make It Work

```
I need [feature] working in the next 10 minutes. Don't worry about
code quality, edge cases, or elegance. Hardcode values if needed.
Just make it functional so I can keep building.
I'll clean it up later. Ship speed > code quality right now.
```

---

# End of Sprint Checklist

Before you ship, verify:

- [ ] Character select works
- [ ] Player spawns in hub overworld
- [ ] WASD/arrow movement works with wall collision
- [ ] Arena doors show opponent names
- [ ] Walking on door + pressing E starts a fight
- [ ] Fight system works (reveal, stamina push, damage, win/loss)
- [ ] Harvest screen appears after win (mutation or biomass)
- [ ] Return to hub after harvest, door marked cleared
- [ ] Trainer NPC dialogue works (E to talk, E to advance, teaches basics)
- [ ] Doctor NPC available after 2 clears, opens doctor screen
- [ ] Item crates give items on pickup
- [ ] Items usable in fights
- [ ] Resources partially restore between fights (Body +5, others full)
- [ ] Mutations add moves or modify existing moves
- [ ] Difficulty scales with number of arenas cleared
- [ ] All 4 arenas cleared triggers victory screen
- [ ] Defeat at any point shows game over + restart
- [ ] Deployed to Itch.io and playable via link
- [ ] Sent to at least 1 person for feedback

**If you hit 75% of this list, ship it. Patch the rest tomorrow.**
