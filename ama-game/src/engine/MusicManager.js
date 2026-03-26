/**
 * MusicManager — Background music system for AMA.
 * Handles per-screen track looping with crossfade transitions.
 * Uses Web Audio API for precise control.
 */

let audioCtx = null;
let currentTrack = null;
let currentGain = null;
let masterVolume = 0.5;
let musicEnabled = true;

// Track assignments per screen
const SCREEN_TRACKS = {
  select: 'menu',
  overworld: 'hub',
  fight: 'battle',
  victory: 'victory',
  defeat: 'defeat',
  harvest: 'hub',
  intro: 'intro',
};

// Cache loaded audio buffers
const bufferCache = {};

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

async function loadTrack(name) {
  if (bufferCache[name]) return bufferCache[name];
  try {
    const response = await fetch(`/assets/music/${name}.mp3`);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const ctx = getCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    bufferCache[name] = audioBuffer;
    return audioBuffer;
  } catch (e) {
    // Music files may not exist yet — that's fine
    return null;
  }
}

function fadeOut(gainNode, duration = 0.8) {
  if (!gainNode || !audioCtx) return;
  try {
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
  } catch (e) {}
}

export async function playMusic(screen) {
  if (!musicEnabled) return;

  const trackName = SCREEN_TRACKS[screen];
  if (!trackName) return;

  // Don't restart if same track is already playing
  if (currentTrack?.name === trackName && currentTrack?.source) return;

  // Fade out current
  if (currentGain) {
    fadeOut(currentGain, 0.6);
    // Clean up old source after fade
    const oldSource = currentTrack?.source;
    setTimeout(() => {
      try { oldSource?.stop(); } catch (e) {}
    }, 700);
  }

  const buffer = await loadTrack(trackName);
  if (!buffer) {
    currentTrack = { name: trackName, source: null };
    return;
  }

  const ctx = getCtx();
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();

  source.buffer = buffer;
  source.loop = true;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(masterVolume, ctx.currentTime + 0.8);

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0);

  currentTrack = { name: trackName, source };
  currentGain = gain;
}

export function stopMusic(fadeDuration = 1.0) {
  if (currentGain) {
    fadeOut(currentGain, fadeDuration);
    const oldSource = currentTrack?.source;
    setTimeout(() => {
      try { oldSource?.stop(); } catch (e) {}
    }, (fadeDuration + 0.1) * 1000);
  }
  currentTrack = null;
  currentGain = null;
}

export function setMusicVolume(vol) {
  masterVolume = Math.max(0, Math.min(1, vol));
  if (currentGain && audioCtx) {
    try {
      currentGain.gain.setValueAtTime(masterVolume, audioCtx.currentTime);
    } catch (e) {}
  }
  // Persist
  try { localStorage.setItem('ama_music_vol', String(masterVolume)); } catch (e) {}
}

export function setSfxVolume(vol) {
  // SFX volume stored for SoundManager to read
  try { localStorage.setItem('ama_sfx_vol', String(Math.max(0, Math.min(1, vol)))); } catch (e) {}
}

export function getMusicVolume() {
  try {
    const v = localStorage.getItem('ama_music_vol');
    return v !== null ? parseFloat(v) : 0.5;
  } catch (e) { return 0.5; }
}

export function getSfxVolume() {
  try {
    const v = localStorage.getItem('ama_sfx_vol');
    return v !== null ? parseFloat(v) : 0.5;
  } catch (e) { return 0.5; }
}

export function setMusicEnabled(enabled) {
  musicEnabled = enabled;
  if (!enabled) stopMusic(0.3);
  try { localStorage.setItem('ama_music_on', enabled ? '1' : '0'); } catch (e) {}
}

export function isMusicEnabled() {
  try {
    const v = localStorage.getItem('ama_music_on');
    return v !== '0';
  } catch (e) { return true; }
}

// Initialize volume from saved settings
try {
  masterVolume = getMusicVolume();
  musicEnabled = isMusicEnabled();
} catch (e) {}
