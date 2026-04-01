/**
 * Animation frame map for fight screen sprites.
 * Each species has animations: idle, attack, hit, special, ko
 * Each animation has east (player-side) and west (opponent-side) frames.
 * Frames are imported statically for Vite bundling.
 */

// Helper: import all frames from a directory via glob
const animModules = import.meta.glob('../assets/sprites/animations/**/*.png', { eager: true, import: 'default' });

// Parse the glob into a structured map:
// { cyberGorilla: { idle: { east: [url, url, ...], west: [...] }, attack: {...}, ... } }
const ANIMATIONS = {};

for (const [path, url] of Object.entries(animModules)) {
  // path like: ../assets/sprites/animations/cyberGorilla/idle/frame_000.png
  // or:        ../assets/sprites/animations/cyberGorilla/idle_west/frame_000.png
  const parts = path.split('/');
  const animIdx = parts.indexOf('animations');
  if (animIdx < 0) continue;

  const species = parts[animIdx + 1];
  let animName = parts[animIdx + 2];
  let direction = 'east'; // default

  // Handle _west suffix
  if (animName.endsWith('_west')) {
    animName = animName.replace('_west', '');
    direction = 'west';
  }

  if (!ANIMATIONS[species]) ANIMATIONS[species] = {};
  if (!ANIMATIONS[species][animName]) ANIMATIONS[species][animName] = { east: [], west: [] };
  ANIMATIONS[species][animName][direction].push(url);
}

// Sort frames by filename (frame_000, frame_001, etc.)
for (const species of Object.values(ANIMATIONS)) {
  for (const anim of Object.values(species)) {
    anim.east.sort();
    anim.west.sort();
  }
}

// Animation timing config
export const ANIM_CONFIG = {
  idle:    { fps: 6,  loop: true, maxFrames: 8 },
  attack:  { fps: 12, loop: false },
  hit:     { fps: 10, loop: false },
  special: { fps: 10, loop: false },
  ko:      { fps: 6,  loop: false },
};

export default ANIMATIONS;
