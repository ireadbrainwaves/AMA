import { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { CharacterCompositor, animateLunge } from '../rendering/CharacterCompositor';
import SPRITES from '../data/spriteMap';

/**
 * Get the sprite path for a mutation overlay.
 */
function getMutationSpritePath(mutationId, view) {
  return `/assets/mutations/MUT_${mutationId}_${view}.png`;
}

/* ───────────────────────────────────────────────
 * ARENA VISUAL PIPELINE — FLAT 2D SIDE-VIEW
 *
 * Render order (back → front):
 *  0. Arena background art (AI-generated)
 *  1. Flat arena floor + grid
 *  2. Spotlight cones (additive)
 *  3. Characters (player left, opponent right)
 *  4. Ambient particles
 *  5. Impact particles
 *  6. Lighting overlay (multiply blend)
 *  7. Rim-light bloom (additive)
 *  8. Vignette + scanlines
 * ─────────────────────────────────────────────── */

const W = 960;
const H = 540;

// Character Y positions — both stand on the same ground plane
const FLOOR_Y = 400;         // Where the floor line is
const PLAYER_X = 200;        // Player on the left
const OPPONENT_X = 760;      // Opponent on the right
const CHAR_GROUND_Y = FLOOR_Y - 10; // Feet position

/** Draw flat 2D arena floor */
function createArenaFloor(container) {
  const g = new PIXI.Graphics();

  // Floor plane — gradient bands from floor line to bottom
  g.rect(0, FLOOR_Y, W, H - FLOOR_Y);
  g.fill({ color: 0x0a1828, alpha: 0.9 });

  // Floor surface highlight
  g.rect(0, FLOOR_Y, W, 3);
  g.fill({ color: 0x00ccff, alpha: 0.2 });

  // Horizontal grid lines on the floor
  g.setStrokeStyle({ width: 1, color: 0x1a3a5a, alpha: 0.15 });
  for (let i = 1; i <= 4; i++) {
    const y = FLOOR_Y + i * 22;
    g.moveTo(0, y);
    g.lineTo(W, y);
  }
  g.stroke();

  // Vertical grid lines on the floor
  g.setStrokeStyle({ width: 0.7, color: 0x1a3a5a, alpha: 0.1 });
  for (let i = 0; i <= 10; i++) {
    const x = (W / 10) * i;
    g.moveTo(x, FLOOR_Y);
    g.lineTo(x, H);
  }
  g.stroke();

  // Center line
  g.setStrokeStyle({ width: 1.5, color: 0x00ccff, alpha: 0.12 });
  g.moveTo(W / 2, FLOOR_Y);
  g.lineTo(W / 2, H);
  g.stroke();

  // Arena boundary markers — left and right edges
  g.setStrokeStyle({ width: 2, color: 0x00ccff, alpha: 0.15 });
  g.moveTo(40, FLOOR_Y - 20);
  g.lineTo(40, H);
  g.stroke();
  g.moveTo(W - 40, FLOOR_Y - 20);
  g.lineTo(W - 40, H);
  g.stroke();

  container.addChild(g);
  return g;
}

/** Create spotlight cone effects (additive blend) */
function createSpotlights(container) {
  const spotContainer = new PIXI.Container();
  spotContainer.blendMode = 'add';

  // Player spotlight — cyan cone from above
  const pSpot = new PIXI.Graphics();
  pSpot.moveTo(PLAYER_X - 30, -20);
  pSpot.lineTo(PLAYER_X - 80, FLOOR_Y + 30);
  pSpot.lineTo(PLAYER_X + 80, FLOOR_Y + 30);
  pSpot.lineTo(PLAYER_X + 30, -20);
  pSpot.closePath();
  pSpot.fill({ color: 0x0066aa, alpha: 0.08 });
  spotContainer.addChild(pSpot);

  // Opponent spotlight — warm cone from above
  const oSpot = new PIXI.Graphics();
  oSpot.moveTo(OPPONENT_X - 30, -20);
  oSpot.lineTo(OPPONENT_X - 80, FLOOR_Y + 30);
  oSpot.lineTo(OPPONENT_X + 80, FLOOR_Y + 30);
  oSpot.lineTo(OPPONENT_X + 30, -20);
  oSpot.closePath();
  oSpot.fill({ color: 0xaa4400, alpha: 0.06 });
  spotContainer.addChild(oSpot);

  // Center arena glow on the floor
  const cGlow = new PIXI.Graphics();
  cGlow.ellipse(W / 2, FLOOR_Y + 10, 180, 25);
  cGlow.fill({ color: 0x003355, alpha: 0.05 });
  spotContainer.addChild(cGlow);

  container.addChild(spotContainer);
  return spotContainer;
}

/** Animated particle system for ambient atmosphere */
class ArenaParticles {
  constructor(app, container) {
    this.particles = [];
    this.container = container;

    // Floating dust motes — mostly above the floor
    for (let i = 0; i < 20; i++) {
      const p = new PIXI.Graphics();
      const size = 1 + Math.random() * 2;
      const brightness = Math.random() > 0.7 ? 0x44aacc : 0x2a5570;
      p.circle(0, 0, size);
      p.fill({ color: brightness, alpha: 0.15 + Math.random() * 0.25 });
      p.x = Math.random() * W;
      p.y = Math.random() * FLOOR_Y;
      p.vx = (Math.random() - 0.5) * 0.3;
      p.vy = -0.1 - Math.random() * 0.3;
      p.baseAlpha = 0.15 + Math.random() * 0.25;
      p.phase = Math.random() * Math.PI * 2;
      container.addChild(p);
      this.particles.push(p);
    }

    // Slow energy sparks (brighter, rarer)
    for (let i = 0; i < 4; i++) {
      const p = new PIXI.Graphics();
      p.circle(0, 0, 1);
      p.fill({ color: 0x00ccff, alpha: 0.4 });
      p.x = 100 + Math.random() * 600;
      p.y = 50 + Math.random() * (FLOOR_Y - 100);
      p.vx = (Math.random() - 0.5) * 0.5;
      p.vy = (Math.random() - 0.5) * 0.4;
      p.baseAlpha = 0.3 + Math.random() * 0.3;
      p.phase = Math.random() * Math.PI * 2;
      p.isSpark = true;
      container.addChild(p);
      this.particles.push(p);
    }
  }

  update(time) {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = p.baseAlpha * (0.5 + 0.5 * Math.sin(time * 0.002 + p.phase));

      // Wrap around
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) { p.y = FLOOR_Y; p.x = Math.random() * W; }
      if (p.y > FLOOR_Y) { p.y = -10; p.x = Math.random() * W; }

      if (p.isSpark) {
        p.x += Math.sin(time * 0.001 + p.phase) * 0.2;
      }
    }
  }
}

/**
 * Create lighting overlay using a pre-baked canvas with smooth radial gradients.
 * Canvas 2D createRadialGradient() gives perfectly smooth falloff, then we
 * convert it to a Pixi texture ONE TIME (no per-frame updates).
 */
function createLightingOverlay(container) {
  // --- Bake the lighting map on an offscreen canvas ---
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Ambient darkness base — lighter base so multiply doesn't crush everything
  ctx.fillStyle = '#3a4860';
  ctx.fillRect(0, 0, W, H);

  // Draw smooth radial lights additively
  ctx.globalCompositeOperation = 'lighter';

  // Helper: draw an elliptical radial gradient light
  function drawLight(cx, cy, rx, ry, r, g, b, peakAlpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx); // squash circle into ellipse
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    grad.addColorStop(0, `rgba(${r},${g},${b},${peakAlpha})`);
    grad.addColorStop(0.25, `rgba(${r},${g},${b},${peakAlpha * 0.7})`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},${peakAlpha * 0.35})`);
    grad.addColorStop(0.75, `rgba(${r},${g},${b},${peakAlpha * 0.1})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Player spotlight — soft cyan (left side)
  drawLight(PLAYER_X, CHAR_GROUND_Y - 60, 200, 180, 80, 160, 200, 0.55);

  // Opponent spotlight — warm amber (right side)
  drawLight(OPPONENT_X, CHAR_GROUND_Y - 60, 200, 180, 160, 100, 55, 0.45);

  // Center arena floor glow — wide soft blue along floor
  drawLight(W / 2, FLOOR_Y, 350, 100, 40, 80, 120, 0.3);

  // Upper ambient fill — gentle overhead wash
  ctx.globalCompositeOperation = 'lighter';
  const topGrad = ctx.createLinearGradient(0, 0, 0, 120);
  topGrad.addColorStop(0, 'rgba(40,50,80,0.2)');
  topGrad.addColorStop(1, 'rgba(40,50,80,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 120);

  ctx.globalCompositeOperation = 'source-over';

  // --- Convert canvas to Pixi sprite (one-time) ---
  const texture = PIXI.Texture.from(canvas);
  const sprite = new PIXI.Sprite(texture);
  sprite.blendMode = 'multiply';
  sprite.alpha = 0.7;

  container.addChild(sprite);
  return sprite;
}

/** Additive glow bloom pass — character rim lights */
function createRimLightLayer(container) {
  const rimContainer = new PIXI.Container();
  rimContainer.blendMode = 'add';
  container.addChild(rimContainer);
  return rimContainer;
}

function updateRimLights(rimContainer, playerComp, opponentComp, time) {
  rimContainer.removeChildren();

  // Player rim light — cyan glow behind character
  if (playerComp?.container) {
    const glow = new PIXI.Graphics();
    const pulse = 0.6 + 0.4 * Math.sin(time * 0.003);
    glow.ellipse(PLAYER_X, CHAR_GROUND_Y - 50, 55, 70);
    glow.fill({ color: 0x0088cc, alpha: 0.07 * pulse });
    // Floor reflection
    glow.ellipse(PLAYER_X, FLOOR_Y + 5, 50, 10);
    glow.fill({ color: 0x006699, alpha: 0.04 * pulse });
    rimContainer.addChild(glow);
  }

  // Opponent rim light — warm/red glow
  if (opponentComp?.container) {
    const glow = new PIXI.Graphics();
    const pulse = 0.6 + 0.4 * Math.sin(time * 0.003 + 1.5);
    glow.ellipse(OPPONENT_X, CHAR_GROUND_Y - 50, 55, 70);
    glow.fill({ color: 0xcc6622, alpha: 0.06 * pulse });
    // Floor reflection
    glow.ellipse(OPPONENT_X, FLOOR_Y + 5, 50, 10);
    glow.fill({ color: 0x994411, alpha: 0.03 * pulse });
    rimContainer.addChild(glow);
  }
}

/** Vignette overlay — simplified edge darkening */
function createVignette(container) {
  const g = new PIXI.Graphics();

  // Top shadow
  g.rect(0, 0, W, 50);
  g.fill({ color: 0x000000, alpha: 0.25 });

  // Bottom shadow
  g.rect(0, H - 30, W, 30);
  g.fill({ color: 0x000000, alpha: 0.15 });

  // Left edge
  g.rect(0, 0, 50, H);
  g.fill({ color: 0x000000, alpha: 0.18 });

  // Right edge
  g.rect(W - 50, 0, 50, H);
  g.fill({ color: 0x000000, alpha: 0.18 });

  container.addChild(g);
  return g;
}

/** Scanline overlay — sparse lines only for subtle CRT feel */
function createScanlines(container) {
  const g = new PIXI.Graphics();
  // Only draw every 6px to minimize draw calls (64 rects instead of 126)
  for (let y = 0; y < H; y += 6) {
    g.rect(0, y, W, 1);
  }
  g.fill({ color: 0x000000, alpha: 0.03 });
  container.addChild(g);
  return g;
}

/* ─────────────────────────────────────
 *  HIT IMPACT PARTICLES — spawned on damage
 * ───────────────────────────────────── */
class ImpactParticleSystem {
  constructor(container) {
    this.container = container;
    this.active = [];
  }

  spawn(x, y, color = 0x00ccff, count = 12) {
    for (let i = 0; i < count; i++) {
      const p = new PIXI.Graphics();
      const size = 1.5 + Math.random() * 3;
      p.circle(0, 0, size);
      p.fill({ color, alpha: 0.9 });
      p.x = x + (Math.random() - 0.5) * 20;
      p.y = y + (Math.random() - 0.5) * 20;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 1.0;
      p.decay = 0.02 + Math.random() * 0.03;
      this.container.addChild(p);
      this.active.push(p);
    }
  }

  update() {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.vx *= 0.97; // drag
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);
      p.scale.set(p.life);
      if (p.life <= 0) {
        this.container.removeChild(p);
        this.active.splice(i, 1);
      }
    }
  }
}


/**
 * BattleArena — Pixi.js v8 canvas with full visual pipeline.
 * Isometric arena floor, spotlight lighting, ambient particles,
 * rim-light bloom, vignette, scanlines, and hit impact VFX.
 */
export default function BattleArena({
  playerSpecies,
  opponentSpecies,
  playerBuild,
  opponentBuild,
  playerAnimState = 'idle',
  opponentAnimState = 'idle',
  flashMessage,
  destroyedSlot,
}) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const playerComp = useRef(null);
  const opponentComp = useRef(null);
  const prevPlayerAnim = useRef('idle');
  const prevOpponentAnim = useRef('idle');
  const initDone = useRef(false);
  const impactRef = useRef(null);

  // Initialize Pixi.js v8 app with full visual pipeline
  useEffect(() => {
    if (!canvasRef.current || initDone.current) return;
    initDone.current = true;

    let cancelled = false;

    async function setup() {
      const app = new PIXI.Application();
      await app.init({
        canvas: canvasRef.current,
        width: W,
        height: H,
        backgroundAlpha: 1,
        backgroundColor: 0x050a14,
        resolution: 1,
        antialias: false,
      });

      if (cancelled) {
        app.destroy(false);
        return;
      }

      appRef.current = app;

      // === LAYER 0: Arena background art ===
      try {
        const bgTexture = await PIXI.Assets.load('/art/arena-1.png');
        const bgSprite = new PIXI.Sprite(bgTexture);
        bgSprite.width = W;
        bgSprite.height = H;
        bgSprite.alpha = 0.6; // Subdued so lighting pipeline can paint over it
        app.stage.addChild(bgSprite);
      } catch (e) {
        console.warn('[BattleArena] Arena background art not found, using procedural only');
      }

      // === LAYER 1: Arena floor ===
      const floorContainer = new PIXI.Container();
      app.stage.addChild(floorContainer);
      createArenaFloor(floorContainer);

      // === LAYER 2: Spotlights ===
      createSpotlights(floorContainer);

      // === LAYER 3: Characters ===
      const charContainer = new PIXI.Container();
      app.stage.addChild(charContainer);

      // Opponent (right side, facing left — use front view)
      const opponent = new CharacterCompositor(app, {
        species: opponentSpecies,
        view: 'front',
      }, charContainer);
      await opponent.loadBase(SPRITES[opponentSpecies]?.front);
      opponent.setPosition(OPPONENT_X, CHAR_GROUND_Y);
      opponent.setScale(0.85);
      // Flip horizontally so opponent faces left
      if (opponent.container) opponent.container.scale.x = -Math.abs(opponent.container.scale.x);
      opponentComp.current = opponent;

      // Player (left side, facing right — use front view)
      const player = new CharacterCompositor(app, {
        species: playerSpecies,
        view: 'front',
      }, charContainer);
      await player.loadBase(SPRITES[playerSpecies]?.front);
      player.setPosition(PLAYER_X, CHAR_GROUND_Y);
      player.setScale(0.85);
      playerComp.current = player;

      // Attach mutations
      if (playerBuild?.slots) {
        const mutPromises = Object.entries(playerBuild.slots).map(async ([slot, data]) => {
          if (data.mutation) {
            await player.attachMutation(slot, getMutationSpritePath(data.mutation, 'front'));
            if (data.tech?.length > 0) player.addTechGlow(slot);
          }
        });
        await Promise.all(mutPromises);
      }
      if (opponentBuild?.slots) {
        const oppMutPromises = Object.entries(opponentBuild.slots).map(async ([slot, data]) => {
          if (data.mutation) {
            await opponent.attachMutation(slot, getMutationSpritePath(data.mutation, 'front'));
          }
        });
        await Promise.all(oppMutPromises);
      }

      // === LAYER 4: Ambient particles ===
      const particleContainer = new PIXI.Container();
      app.stage.addChild(particleContainer);
      const particles = new ArenaParticles(app, particleContainer);

      // === LAYER 5: Impact particles ===
      const impactContainer = new PIXI.Container();
      app.stage.addChild(impactContainer);
      const impacts = new ImpactParticleSystem(impactContainer);
      impactRef.current = impacts;

      // === LAYER 6: Lighting overlay (multiply, static bake) ===
      createLightingOverlay(app.stage);

      // === LAYER 7: Rim light bloom (additive) ===
      const rimContainer = createRimLightLayer(app.stage);

      // === LAYER 8: Vignette + scanlines ===
      const postContainer = new PIXI.Container();
      app.stage.addChild(postContainer);
      createVignette(postContainer);
      createScanlines(postContainer);

      // === MAIN LOOP ===
      app.ticker.add(() => {
        const time = Date.now();

        // Idle bob — same magnitude, both on same ground plane
        const bob = Math.sin(time * 0.002) * 2;
        if (player.container) player.container.y = CHAR_GROUND_Y + bob;
        if (opponent.container) opponent.container.y = CHAR_GROUND_Y + bob * 0.85;

        // Update particles
        particles.update(time);
        impacts.update();

        // Update rim lights
        updateRimLights(rimContainer, playerComp.current, opponentComp.current, time);
      });
    }

    setup();

    return () => {
      cancelled = true;
      if (playerComp.current) playerComp.current.destroy();
      if (opponentComp.current) opponentComp.current.destroy();
      if (appRef.current) appRef.current.destroy(false);
      playerComp.current = null;
      opponentComp.current = null;
      appRef.current = null;
      initDone.current = false;
      impactRef.current = null;
    };
  }, [playerSpecies, opponentSpecies]);

  // Rebuild mutations when build changes
  useEffect(() => {
    const player = playerComp.current;
    if (!player) return;

    ['head', 'chest', 'leftArm', 'rightArm', 'back', 'legs'].forEach(slot => player.clearSlot(slot));
    if (player.layers.techGlow) player.layers.techGlow.removeChildren();

    if (playerBuild?.slots) {
      Object.entries(playerBuild.slots).forEach(([slot, data]) => {
        if (data.mutation) {
          player.attachMutation(slot, getMutationSpritePath(data.mutation, 'front'));
          if (data.tech?.length > 0) player.addTechGlow(slot);
        }
      });
    }
  }, [playerBuild, playerSpecies]);

  useEffect(() => {
    const opponent = opponentComp.current;
    if (!opponent) return;

    ['head', 'chest', 'leftArm', 'rightArm', 'back', 'legs'].forEach(slot => opponent.clearSlot(slot));
    if (opponent.layers.techGlow) opponent.layers.techGlow.removeChildren();

    if (opponentBuild?.slots) {
      Object.entries(opponentBuild.slots).forEach(([slot, data]) => {
        if (data.mutation) {
          opponent.attachMutation(slot, getMutationSpritePath(data.mutation, 'front'));
        }
      });
    }
  }, [opponentBuild, opponentSpecies]);

  // Handle animation state changes — spawn impact particles on hit
  useEffect(() => {
    const comp = playerComp.current;
    if (!comp || playerAnimState === prevPlayerAnim.current) return;
    prevPlayerAnim.current = playerAnimState;
    if (playerAnimState === 'attacking') {
      animateLunge(comp, 40, 0); // Lunge right toward opponent
      setTimeout(() => {
        impactRef.current?.spawn(OPPONENT_X, CHAR_GROUND_Y - 50, 0xff6644, 14);
      }, 160);
    }
    else if (playerAnimState === 'hit') {
      comp.flashHit();
      comp.shake();
      impactRef.current?.spawn(PLAYER_X, CHAR_GROUND_Y - 50, 0x00ccff, 10);
    }
  }, [playerAnimState]);

  useEffect(() => {
    const comp = opponentComp.current;
    if (!comp || opponentAnimState === prevOpponentAnim.current) return;
    prevOpponentAnim.current = opponentAnimState;
    if (opponentAnimState === 'attacking') {
      animateLunge(comp, -40, 0); // Lunge left toward player
      setTimeout(() => {
        impactRef.current?.spawn(PLAYER_X, CHAR_GROUND_Y - 50, 0xff6644, 14);
      }, 160);
    }
    else if (opponentAnimState === 'hit') {
      comp.flashHit();
      comp.shake();
      impactRef.current?.spawn(OPPONENT_X, CHAR_GROUND_Y - 50, 0x00ccff, 10);
    }
  }, [opponentAnimState]);

  // Mutation destruction VFX
  useEffect(() => {
    if (!destroyedSlot) return;
    const { side, slot } = destroyedSlot;
    const comp = side === 'player' ? playerComp.current : opponentComp.current;
    if (comp) {
      comp.destroyMutation(slot);
      const x = side === 'player' ? PLAYER_X : OPPONENT_X;
      const y = CHAR_GROUND_Y - 50;
      impactRef.current?.spawn(x, y, 0xff4444, 20);
    }
  }, [destroyedSlot]);

  return (
    <div className="battle-arena" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          display: 'block',
        }}
      />
      {flashMessage && <div className="arena-flash">{flashMessage}</div>}
    </div>
  );
}
