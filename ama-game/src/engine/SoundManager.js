// Web Audio API synthesized 8-bit sound effects
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function osc(freq, type, duration, vol = 0.15) {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  o.connect(g);
  g.connect(c.destination);
  o.start(c.currentTime);
  o.stop(c.currentTime + duration);
}

function noise(duration, vol = 0.08) {
  const c = getCtx();
  const bufSize = c.sampleRate * duration;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = vol;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.connect(g);
  g.connect(c.destination);
  src.start(c.currentTime);
}

export function playSound(name, intensity = 1) {
  try {
    switch (name) {
      // Overworld
      case 'step':
        osc(800, 'square', 0.04, 0.04);
        break;
      case 'door':
        osc(220, 'square', 0.1, 0.1);
        setTimeout(() => osc(330, 'square', 0.1, 0.1), 100);
        break;
      case 'dialogue':
        osc(600 + Math.random() * 200, 'square', 0.05, 0.06);
        break;
      case 'itemPickup':
        osc(523, 'square', 0.08, 0.1);
        setTimeout(() => osc(659, 'square', 0.08, 0.1), 80);
        setTimeout(() => osc(784, 'square', 0.12, 0.1), 160);
        break;
      case 'menuOpen':
        osc(400, 'sine', 0.08, 0.08);
        osc(600, 'sine', 0.06, 0.06);
        break;

      // Battle
      case 'commit':
        osc(300, 'square', 0.08, 0.12);
        noise(0.04, 0.06);
        break;
      case 'revealTension':
        osc(200, 'sawtooth', 0.5, 0.06);
        break;
      case 'revealFlip':
        osc(800, 'sine', 0.1, 0.1);
        noise(0.06, 0.05);
        break;
      case 'winMatchup':
        osc(523, 'square', 0.1, 0.12);
        setTimeout(() => osc(784, 'square', 0.15, 0.12), 100);
        break;
      case 'loseMatchup':
        osc(200, 'sawtooth', 0.2, 0.1);
        noise(0.1, 0.06);
        break;
      case 'pushCommit':
        osc(150, 'square', 0.12, 0.1);
        noise(0.06, 0.08);
        break;
      case 'impact':
        const vol = 0.05 + intensity * 0.1;
        osc(100 + intensity * 30, 'sawtooth', 0.1, vol);
        noise(0.08, vol);
        break;
      case 'resourceBreak':
        noise(0.15, 0.15);
        osc(100, 'sawtooth', 0.3, 0.12);
        setTimeout(() => osc(80, 'sawtooth', 0.2, 0.08), 150);
        break;
      case 'finisherReady':
        osc(220, 'sawtooth', 0.4, 0.06);
        setTimeout(() => osc(330, 'sawtooth', 0.3, 0.08), 200);
        break;
      case 'finisherLand':
        noise(0.3, 0.2);
        osc(80, 'sawtooth', 0.4, 0.15);
        setTimeout(() => noise(0.5, 0.1), 200);
        break;
      case 'passive':
        osc(880, 'sine', 0.08, 0.05);
        break;
      case 'ko':
        osc(100, 'square', 0.3, 0.15);
        noise(0.2, 0.12);
        break;
      case 'tick':
        osc(1200, 'sine', 0.02, 0.03);
        break;
    }
  } catch (e) {
    // Silently fail — audio is nice but not required
  }
}
