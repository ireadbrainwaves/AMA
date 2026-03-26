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

  /**
   * Add tech enhancement visual to a slot.
   * @param {string} slot       - compositor slot name (head, chest, leftArm, etc.)
   * @param {string} category   - tech category: 'offensive','defensive','utility','passive','starter'
   * @param {string} [techId]   - specific tech ID for unique visuals
   */
  addTechGlow(slot, category = 'offensive', techId = null) {
    const mutSprite = this.layers[slot]?.mutationSprite;
    if (!mutSprite) return;

    // Category-specific glow colors and styles
    const TECH_STYLES = {
      offensive: { color: 0xff4444, alpha: 0.45, scale: 1.18, pulseSpeed: 0.06 },
      defensive: { color: 0x44aaff, alpha: 0.35, scale: 1.22, pulseSpeed: 0.03 },
      utility:   { color: 0x44ff88, alpha: 0.35, scale: 1.15, pulseSpeed: 0.05 },
      passive:   { color: 0xffaa00, alpha: 0.30, scale: 1.12, pulseSpeed: 0.02 },
      starter:   { color: 0xff44ff, alpha: 0.40, scale: 1.20, pulseSpeed: 0.04 },
    };
    const style = TECH_STYLES[category] || TECH_STYLES.offensive;

    // Outer glow ring (additive, larger)
    const outerGlow = new PIXI.Sprite(mutSprite.texture);
    outerGlow.anchor.set(0.5);
    outerGlow.x = mutSprite.x;
    outerGlow.y = mutSprite.y;
    outerGlow.scale.set(style.scale + 0.08);
    outerGlow.tint = style.color;
    outerGlow.alpha = style.alpha * 0.4;
    outerGlow.blendMode = 'add';
    this.layers.techGlow.addChild(outerGlow);

    // Inner glow (additive, tighter)
    const innerGlow = new PIXI.Sprite(mutSprite.texture);
    innerGlow.anchor.set(0.5);
    innerGlow.x = mutSprite.x;
    innerGlow.y = mutSprite.y;
    innerGlow.scale.set(style.scale);
    innerGlow.tint = style.color;
    innerGlow.alpha = style.alpha;
    innerGlow.blendMode = 'add';
    this.layers.techGlow.addChild(innerGlow);

    // Tech icon overlay sprite (if available)
    const techSpritePath = techId
      ? `/assets/tech/TECH_${techId}_icon.png`
      : `/assets/tech/TECH_${category}_icon.png`;

    PIXI.Assets.load(techSpritePath).then(texture => {
      if (texture?.source) texture.source.scaleMode = 'nearest';
      const icon = new PIXI.Sprite(texture);
      icon.anchor.set(0.5);
      icon.x = mutSprite.x;
      icon.y = mutSprite.y - 14; // Float above the mutation
      icon.scale.set(0.6);
      icon.alpha = 0.85;
      this.layers.techGlow.addChild(icon);
      // Store reference for animation
      icon._techIcon = true;
    }).catch(() => {
      // No custom icon — that's fine, glow alone works
    });

    // Animated pulse — store animation data for tick updates
    innerGlow._techPulse = { speed: style.pulseSpeed, baseAlpha: style.alpha, phase: Math.random() * Math.PI * 2 };
    outerGlow._techPulse = { speed: style.pulseSpeed * 0.7, baseAlpha: style.alpha * 0.4, phase: Math.random() * Math.PI * 2 };

    // Register pulse animation if not already running
    if (!this._techAnimFrame) {
      this._techAnimFrame = true;
      const pulse = () => {
        if (!this.container?.parent) return; // destroyed
        const t = Date.now() * 0.001;
        this.layers.techGlow.children.forEach(child => {
          if (child._techPulse) {
            const p = child._techPulse;
            child.alpha = p.baseAlpha + Math.sin(t * p.speed * 60 + p.phase) * p.baseAlpha * 0.3;
          }
          if (child._techIcon) {
            child.y += Math.sin(t * 2) * 0.03; // gentle bob
          }
        });
        requestAnimationFrame(pulse);
      };
      requestAnimationFrame(pulse);
    }
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
