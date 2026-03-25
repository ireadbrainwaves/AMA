import * as PIXI from 'pixi.js';
import { SLOT_ORDER, SLOT_OFFSETS } from '../data/slotOffsets';

/**
 * CharacterCompositor — layered sprite composition for fight screen.
 * Base body + mutation overlays at body-part offsets + optional tech glow.
 * Each character on screen gets one compositor instance.
 */
export class CharacterCompositor {
  constructor(app, config, parentContainer) {
    this.app = app;
    this.container = new PIXI.Container();
    this.layers = {};
    this.species = config.species;
    this.view = config.view; // 'front' or 'back'
    this.parentContainer = parentContainer || app.stage;

    // Create layer containers in render order (back to front)
    this.layers.back = new PIXI.Container();
    this.layers.base = new PIXI.Container();
    this.layers.legs = new PIXI.Container();
    this.layers.chest = new PIXI.Container();
    this.layers.leftArm = new PIXI.Container();
    this.layers.rightArm = new PIXI.Container();
    this.layers.head = new PIXI.Container();
    this.layers.techGlow = new PIXI.Container();

    // Add in render order
    this.container.addChild(this.layers.back);
    this.container.addChild(this.layers.base);
    this.container.addChild(this.layers.legs);
    this.container.addChild(this.layers.chest);
    this.container.addChild(this.layers.leftArm);
    this.container.addChild(this.layers.rightArm);
    this.container.addChild(this.layers.head);
    this.container.addChild(this.layers.techGlow);

    this.parentContainer.addChild(this.container);
  }

  /** Load the base body sprite (async for Pixi v8) */
  async loadBase(spritePath) {
    if (!spritePath) return;
    try {
      const texture = await PIXI.Assets.load(spritePath);
      if (texture.source) texture.source.scaleMode = 'nearest';
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5, 1.0); // Bottom-center so feet align with ground
      this.layers.base.addChild(sprite);
      this.baseSprite = sprite;
    } catch (e) {
      console.warn('[CharacterCompositor] Failed to load base sprite:', spritePath, e);
    }
  }

  /** Attach a mutation overlay to a slot (async for Pixi v8) */
  async attachMutation(slot, mutationSpritePath) {
    if (!mutationSpritePath || !this.layers[slot]) return;

    // Clear existing mutation in this slot
    this.clearSlot(slot);

    let texture;
    try {
      texture = await PIXI.Assets.load(mutationSpritePath);
      if (texture.source) texture.source.scaleMode = 'nearest';
    } catch (e) {
      console.warn('[CharacterCompositor] Failed to load mutation sprite:', mutationSpritePath);
      return;
    }
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);

    // Position at the slot offset for this species + view
    const offsets = SLOT_OFFSETS[this.species]?.[this.view];
    if (offsets?.[slot]) {
      sprite.x = offsets[slot].x;
      sprite.y = offsets[slot].y;
    }

    this.layers[slot].addChild(sprite);
    this.layers[slot].mutationSprite = sprite;
  }

  /** Remove a mutation from a slot */
  clearSlot(slot) {
    if (!this.layers[slot]) return;
    this.layers[slot].removeChildren();
    this.layers[slot].mutationSprite = null;
  }

  /** Add tech glow effect to a slot (additive blend) */
  addTechGlow(slot, glowColor = 0x00ccff) {
    const mutSprite = this.layers[slot]?.mutationSprite;
    if (!mutSprite) return;

    const glow = new PIXI.Sprite(mutSprite.texture);
    glow.anchor.set(0.5);
    glow.x = mutSprite.x;
    glow.y = mutSprite.y;
    glow.scale.set(1.15);
    glow.tint = glowColor;
    glow.alpha = 0.4;
    glow.blendMode = 'add';

    this.layers.techGlow.addChild(glow);
  }

  /** Set position of the entire composite */
  setPosition(x, y) {
    this.container.x = x;
    this.container.y = y;
  }

  /** Set scale (player is larger than opponent in Pokemon-style layout) */
  setScale(s) {
    this.container.scale.set(s);
  }

  /** Flash white on hit */
  flashHit(duration = 200) {
    const filter = new PIXI.ColorMatrixFilter();
    filter.brightness(2, false);
    this.container.filters = [filter];
    setTimeout(() => {
      this.container.filters = [];
    }, duration);
  }

  /** Shake on damage */
  shake(intensity = 4, duration = 300) {
    const originalX = this.container.x;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed > duration) {
        this.container.x = originalX;
        return;
      }
      const decay = 1 - elapsed / duration;
      this.container.x = originalX + (Math.random() - 0.5) * intensity * 2 * decay;
      requestAnimationFrame(tick);
    };
    tick();
  }

  /** Mutation destruction particle effect */
  destroyMutation(slot) {
    const mutSprite = this.layers[slot]?.mutationSprite;
    if (!mutSprite) return;

    // Create 4-6 fragment sprites from the mutation
    const fragments = [];
    for (let i = 0; i < 5; i++) {
      const frag = new PIXI.Sprite(PIXI.Texture.WHITE);
      frag.width = 8;
      frag.height = 8;
      frag.tint = mutSprite.tint || 0xcccccc;
      frag.anchor.set(0.5);
      frag.x = mutSprite.x + (Math.random() - 0.5) * 16;
      frag.y = mutSprite.y + (Math.random() - 0.5) * 16;
      frag.vx = (Math.random() - 0.5) * 6;
      frag.vy = -Math.random() * 4 - 2;
      this.container.addChild(frag);
      fragments.push(frag);
    }

    // Remove the mutation sprite
    this.clearSlot(slot);

    // Animate fragments outward + fade
    const start = Date.now();
    const animateFragments = () => {
      const elapsed = Date.now() - start;
      if (elapsed > 500) {
        fragments.forEach(f => this.container.removeChild(f));
        return;
      }
      fragments.forEach(f => {
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.3; // gravity
        f.alpha = 1 - elapsed / 500;
      });
      requestAnimationFrame(animateFragments);
    };
    animateFragments();
  }

  /** Clean up all resources */
  destroy() {
    this.parentContainer.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}

/**
 * Lunge animation — quick attack motion toward target then return.
 */
export function animateLunge(compositor, dx, dy, duration = 400) {
  const startX = compositor.container.x;
  const startY = compositor.container.y;
  const start = Date.now();

  const tick = () => {
    const elapsed = Date.now() - start;
    const t = Math.min(1, elapsed / duration);

    // Quick lunge out (0-40%) then return (40-100%)
    let progress;
    if (t < 0.4) {
      progress = t / 0.4;
    } else {
      progress = 1 - (t - 0.4) / 0.6;
    }

    const ease = progress * (2 - progress); // ease-out
    compositor.container.x = startX + dx * ease;
    compositor.container.y = startY + dy * ease;

    if (t < 1) requestAnimationFrame(tick);
  };
  tick();
}
