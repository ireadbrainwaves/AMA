// Slot offsets relative to base sprite center (in pixels at 128px scale)
// x: negative = left, positive = right
// y: negative = up, positive = down
// anchor is center of the base sprite

export const SLOT_ORDER = ['back', 'legs', 'chest', 'leftArm', 'rightArm', 'head'];

export const BODY_SLOTS = {
  head:     { label: 'Head',      abbr: 'H' },
  chest:    { label: 'Chest',     abbr: 'C' },
  leftArm:  { label: 'Left Arm',  abbr: 'L' },
  rightArm: { label: 'Right Arm', abbr: 'R' },
  back:     { label: 'Back',      abbr: 'B' },
  legs:     { label: 'Legs',      abbr: 'G' },
};

export const SLOT_OFFSETS = {
  cyberGorilla: {
    front: {
      leftArm:  { x: -34, y: 6 },
      rightArm: { x: 34, y: 6 },
      back:     { x: 0, y: -6 },
      chest:    { x: 0, y: 6 },
      head:     { x: 0, y: -30 },
      legs:     { x: 0, y: 34 },
    },
    back: {
      leftArm:  { x: -32, y: 8 },
      rightArm: { x: 32, y: 8 },
      back:     { x: 0, y: -4 },
      chest:    { x: 0, y: 8 },
      head:     { x: 0, y: -28 },
      legs:     { x: 0, y: 36 },
    },
  },
  psychoSquid: {
    front: {
      leftArm:  { x: -28, y: 10 },
      rightArm: { x: 28, y: 10 },
      back:     { x: 0, y: -8 },
      chest:    { x: 0, y: 4 },
      head:     { x: 0, y: -26 },
      legs:     { x: 0, y: 30 },
    },
    back: {
      leftArm:  { x: -26, y: 12 },
      rightArm: { x: 26, y: 12 },
      back:     { x: 0, y: -6 },
      chest:    { x: 0, y: 6 },
      head:     { x: 0, y: -24 },
      legs:     { x: 0, y: 32 },
    },
  },
  beeSwarm: {
    front: {
      leftArm:  { x: -22, y: 8 },
      rightArm: { x: 22, y: 8 },
      back:     { x: 0, y: -10 },
      chest:    { x: 0, y: 4 },
      head:     { x: 0, y: -22 },
      legs:     { x: 0, y: 26 },
    },
    back: {
      leftArm:  { x: -20, y: 10 },
      rightArm: { x: 20, y: 10 },
      back:     { x: 0, y: -8 },
      chest:    { x: 0, y: 6 },
      head:     { x: 0, y: -20 },
      legs:     { x: 0, y: 28 },
    },
  },
  terrorPinTurtle: {
    front: {
      leftArm:  { x: -30, y: 4 },
      rightArm: { x: 30, y: 4 },
      back:     { x: 0, y: -8 },
      chest:    { x: 0, y: 2 },
      head:     { x: 0, y: -24 },
      legs:     { x: 0, y: 28 },
    },
    back: {
      leftArm:  { x: -28, y: 6 },
      rightArm: { x: 28, y: 6 },
      back:     { x: 0, y: -6 },
      chest:    { x: 0, y: 4 },
      head:     { x: 0, y: -22 },
      legs:     { x: 0, y: 30 },
    },
  },
  // Opponent-only species (front only needed)
  parasitex: {
    front: {
      leftArm:  { x: -26, y: 8 },
      rightArm: { x: 26, y: 8 },
      back:     { x: 0, y: -6 },
      chest:    { x: 0, y: 4 },
      head:     { x: 0, y: -24 },
      legs:     { x: 0, y: 28 },
    },
  },
  echomorph: {
    front: {
      leftArm:  { x: -24, y: 10 },
      rightArm: { x: 24, y: 10 },
      back:     { x: 0, y: -8 },
      chest:    { x: 0, y: 4 },
      head:     { x: 0, y: -24 },
      legs:     { x: 0, y: 28 },
    },
  },
  hydravine: {
    front: {
      leftArm:  { x: -26, y: 6 },
      rightArm: { x: 26, y: 6 },
      back:     { x: 0, y: -8 },
      chest:    { x: 0, y: 4 },
      head:     { x: 0, y: -26 },
      legs:     { x: 0, y: 30 },
    },
  },
};
