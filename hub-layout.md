# AMA Hub Layout — Connected Rooms

## Map Overview

```
                    NORTH
    ┌──────┬──────┬──────┬──────┐
    │Arena1│Arena2│Arena3│Arena4│   <- 4 arena bays (square rooms)
    └──┬───┴──┬───┴──┬───┴──┬───┘
       │      │      │      │
    ┌──┴──────┴──────┴──────┴───┐
    │     ARENA GALLERY          │   <- wide viewing corridor
    │     (wide horizontal)      │
    └────────────┬───────────────┘
                 │
    ┌────────────┴───────────────┐
    │     CENTRAL CORRIDOR       │   <- main spine (wide horizontal)
    └──┬─────────┬───────────┬───┘
       │         │           │
  ┌────┴───┐ ┌───┴────┐ ┌───┴────┐
  │MUTATION│ │  TECH   │ │COMMAND │
  │  LAB   │ │WORKSHOP │ │  POST  │   <- 3 NPC rooms (square)
  │(Helix) │ │ (Ark)   │ │ (Vex)  │
  └────────┘ └───┬─────┘ └────────┘
                 │
            ┌────┴─────┐
            │TERMINALS │   <- supply/codex alcove (small)
            └──────────┘
                SOUTH
```

## Room Dimensions (in tiles, TILE = 32px)

| Room             | Tiles W x H | Pixels          | Aspect  | Art Shape         |
|------------------|-------------|-----------------|---------|-------------------|
| Arena 1-4        | 8 x 8       | 256 x 256       | 1:1     | Square room       |
| Arena Gallery    | 32 x 6      | 1024 x 192      | ~5:1    | Wide horizontal   |
| Central Corridor | 32 x 4      | 1024 x 128      | 8:1     | Wide horizontal   |
| Mutation Lab     | 10 x 10     | 320 x 320       | 1:1     | Square room       |
| Tech Workshop    | 10 x 10     | 320 x 320       | 1:1     | Square room       |
| Command Post     | 10 x 10     | 320 x 320       | 1:1     | Square room       |
| Terminal Alcove  | 8 x 6       | 256 x 192       | 4:3     | Small rectangle   |
| Connecting halls | 2 x 4       | 64 x 128        | 1:2     | Short vertical    |

## Total Map Size
- Width:  ~32 tiles = 1024px
- Height: ~34 tiles = 1088px
- Canvas: 1024 x 1088 (or nearest clean size)

## Art Needed from Scenario

### Square rooms (1:1 aspect ratio):
1. **Arena Bay** x1 (reuse for all 4, maybe tint per arena)
2. **Mutation Lab** x1 (green/purple — Helix)
3. **Tech Workshop** x1 (amber — Ark) ← ALREADY HAVE THIS
4. **Command Post** x1 (purple/magenta — Vex) ← ALREADY HAVE THIS

### Wide rooms (use 16:9 or custom wide):
5. **Arena Gallery** — wide viewing corridor with glass floor/railings
6. **Central Corridor** — main hallway with cyan LED strip

### Small room:
7. **Terminal Alcove** — supply crates + data terminals (4:3)

### Connectors:
8. **Vertical hallway segment** — short passage connecting rooms (1:2 tall)

## How Rooms Connect

Each room is a separate image placed at fixed pixel coordinates on the canvas.
Doorways are drawn where rooms meet — the connecting hallways bridge gaps.
Player walks freely across the whole map with camera following.

Collision map = room boundaries. Inside a room = walkable. Walls = blocked.
Doorway positions defined per room for NPC interaction triggers.
```
