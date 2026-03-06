/* ============================================================
   SECTION EFFECTS — Themed particles + Neon characters per section
   OPTIMIZED: no shadowBlur, pre-rendered glow sprites, 30fps cap,
              squared-distance connections, batched draws
   ============================================================ */

// Fix hero accent badge after GSAP split-text animation
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    var ht = document.querySelector('.hero__title');
    if (!ht) return;
    var kids = ht.children;
    if (kids.length > 0 && !document.querySelector('.hero__title-accent')) {
      kids[kids.length - 1].className = 'hero__title-accent';
    }
  }, 150);
});

(function () {
  'use strict';

  // ─── Guard checks ───
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const isMobile = window.innerWidth < 768;

  // ─── Brand colors ───
  const CYAN   = { r: 0, g: 240, b: 255 };
  const VIOLET = { r: 139, g: 92, b: 246 };
  const PINK   = { r: 244, g: 114, b: 182 };
  const GREEN  = { r: 74, g: 222, b: 128 };

  function rgba(c, a) { return `rgba(${c.r},${c.g},${c.b},${a})`; }
  function rgb(c)     { return `rgb(${c.r},${c.g},${c.b})`; }

  // ─── FPS limiter ───
  const TARGET_FPS = 30;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  // ─── Pre-rendered glow sprites (avoid shadowBlur per frame) ───
  const glowCache = new Map();

  function getGlowSprite(color, radius) {
    const key = `${color.r},${color.g},${color.b},${radius}`;
    if (glowCache.has(key)) return glowCache.get(key);

    const size = Math.ceil(radius * 6);
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const cx = c.getContext('2d');
    const half = size / 2;

    const grad = cx.createRadialGradient(half, half, 0, half, half, radius * 2.5);
    grad.addColorStop(0, rgba(color, 0.4));
    grad.addColorStop(0.4, rgba(color, 0.1));
    grad.addColorStop(1, 'transparent');
    cx.fillStyle = grad;
    cx.fillRect(0, 0, size, size);

    glowCache.set(key, c);
    return c;
  }

  // ─── Section configurations ───
  const CONFIGS = {
    'social-proof': {
      particles: {
        type: 'digits', count: isMobile ? 4 : 8,
        pool: ['5+', '1K', '98%', '4.9'],
        colors: [CYAN], speed: 0.15, opacity: 0.08, connections: true
      },
      characters: [
        { action: 'celebrate', x: 0.08, y: 0.55, color: CYAN, scale: 0.7, opacity: 0.2 },
        { action: 'celebrate', x: 0.92, y: 0.55, color: VIOLET, scale: 0.7, opacity: 0.2, flip: true }
      ]
    },
    'benefits': {
      particles: {
        type: 'stars', count: isMobile ? 6 : 14,
        colors: [CYAN, VIOLET, PINK], speed: 0.2, opacity: 0.1
      },
      characters: [
        { action: 'saber_swing', x: 0.88, y: 0.35, color: CYAN, scale: 0.9, opacity: 0.18 },
        { action: 'dodge', x: 0.12, y: 0.7, color: PINK, scale: 0.75, opacity: 0.15, flip: true }
      ]
    },
    'how-it-works': {
      particles: {
        type: 'flowing', count: isMobile ? 8 : 18,
        colors: [CYAN], speed: 0.6, opacity: 0.06
      },
      characters: [
        { action: 'walk', x: 0.1, y: 0.5, color: VIOLET, scale: 0.8, opacity: 0.18 }
      ]
    },
    'tariffs': {
      particles: {
        type: 'bubbles', count: isMobile ? 5 : 10,
        colors: [VIOLET, CYAN], speed: 0.25, opacity: 0.08
      },
      characters: [
        { action: 'saber_swing', x: 0.05, y: 0.6, color: CYAN, scale: 0.6, opacity: 0.12 },
        { action: 'shoot', x: 0.95, y: 0.4, color: VIOLET, scale: 0.5, opacity: 0.12, flip: true }
      ]
    },
    'safety': {
      particles: {
        type: 'shields', count: isMobile ? 4 : 8,
        colors: [CYAN, GREEN], speed: 0.15, opacity: 0.07
      },
      characters: [
        { action: 'block', x: 0.88, y: 0.5, color: CYAN, scale: 0.85, opacity: 0.2 },
        { action: 'shoot', x: 0.12, y: 0.45, color: PINK, scale: 0.7, opacity: 0.15, flip: true }
      ]
    },
    'reviews': {
      particles: {
        type: 'hearts', count: isMobile ? 5 : 10,
        colors: [PINK, CYAN], speed: 0.2, opacity: 0.09
      },
      characters: [
        { action: 'dance', x: 0.9, y: 0.55, color: PINK, scale: 0.75, opacity: 0.18 }
      ]
    },
    'faq': {
      particles: {
        type: 'questions', count: isMobile ? 4 : 8,
        colors: [VIOLET], speed: 0.12, opacity: 0.07
      },
      characters: [
        { action: 'think', x: 0.08, y: 0.45, color: VIOLET, scale: 0.8, opacity: 0.18 }
      ]
    },
    'booking': {
      particles: {
        type: 'confetti', count: isMobile ? 6 : 14,
        colors: [CYAN, VIOLET, PINK, GREEN], speed: 0.35, opacity: 0.1
      },
      characters: [
        { action: 'saber_swing', x: 0.08, y: 0.55, color: CYAN, scale: 0.85, opacity: 0.2 },
        { action: 'saber_swing', x: 0.92, y: 0.55, color: VIOLET, scale: 0.85, opacity: 0.2, flip: true }
      ]
    }
  };


  /* ═══════════════════════════════════════════
     THEMED PARTICLES (optimized — no shadowBlur)
     ═══════════════════════════════════════════ */

  class ThemedParticles {
    constructor(config, w, h) {
      this.cfg = config;
      this.w = w; this.h = h;
      this.particles = [];
      this.create();
    }

    create() {
      this.particles = [];
      for (let i = 0; i < this.cfg.count; i++) {
        const c = this.cfg.colors[Math.floor(Math.random() * this.cfg.colors.length)];
        this.particles.push({
          x: Math.random() * this.w,
          y: Math.random() * this.h,
          size: Math.random() * 4 + 2,
          speedX: (Math.random() - 0.5) * this.cfg.speed,
          speedY: this.cfg.type === 'flowing'
            ? (Math.random() - 0.5) * 0.1
            : -(Math.random() * this.cfg.speed + 0.05),
          opacity: this.cfg.opacity * (0.5 + Math.random() * 0.5),
          color: c,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
          variant: Math.floor(Math.random() * 3),
          text: this.cfg.pool
            ? this.cfg.pool[Math.floor(Math.random() * this.cfg.pool.length)]
            : null
        });
      }
    }

    resize(w, h) { this.w = w; this.h = h; this.create(); }

    update() {
      for (const p of this.particles) {
        if (this.cfg.type === 'flowing') {
          p.x += this.cfg.speed;
          p.y += p.speedY;
        } else {
          p.x += p.speedX;
          p.y += p.speedY;
        }
        p.rotation += p.rotSpeed;

        // Wrap
        if (p.y < -20)           p.y = this.h + 20;
        if (p.y > this.h + 20)   p.y = -20;
        if (p.x < -20)           p.x = this.w + 20;
        if (p.x > this.w + 20)   p.x = -20;
      }
    }

    draw(ctx) {
      // OPTIMIZED: no shadowBlur, use pre-rendered glow sprites
      for (const p of this.particles) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        const col = rgb(p.color);
        ctx.fillStyle = col;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;

        // Draw glow sprite behind particle (replaces shadowBlur)
        const sprite = getGlowSprite(p.color, p.size);
        const half = sprite.width / 2;
        ctx.globalAlpha = p.opacity * 0.6;
        ctx.drawImage(sprite, -half, -half);
        ctx.globalAlpha = p.opacity;

        switch (this.cfg.type) {
          case 'digits':   this._drawDigit(ctx, p); break;
          case 'stars':    this._drawStar(ctx, p); break;
          case 'flowing':  this._drawDot(ctx, p); break;
          case 'bubbles':  this._drawBubble(ctx, p); break;
          case 'shields':  this._drawShield(ctx, p); break;
          case 'hearts':   this._drawHeart(ctx, p); break;
          case 'questions':this._drawQuestion(ctx, p); break;
          case 'confetti': this._drawConfetti(ctx, p); break;
        }

        ctx.restore();
      }

      // Connections (only for social-proof digits)
      if (this.cfg.connections) this._drawConnections(ctx);
    }

    _drawDigit(ctx, p) {
      ctx.font = `bold ${p.size * 4}px Manrope, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.text || '5+', 0, 0);
    }

    _drawStar(ctx, p) {
      const s = p.size * 1.5;
      const spikes = p.variant < 2 ? 4 : 6;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? s : s * 0.4;
        const a = (Math.PI * i) / spikes - Math.PI / 2;
        if (i === 0) ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
        else ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
    }

    _drawDot(ctx, p) {
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawBubble(ctx, p) {
      const r = p.size * 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    _drawShield(ctx, p) {
      const s = p.size * 2;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s, -s * 0.5, s * 0.8, s * 0.3);
      ctx.quadraticCurveTo(0, s * 1.2, 0, s * 1.2);
      ctx.quadraticCurveTo(0, s * 1.2, -s * 0.8, s * 0.3);
      ctx.quadraticCurveTo(-s, -s * 0.5, 0, -s);
      ctx.closePath();
      ctx.stroke();
    }

    _drawHeart(ctx, p) {
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.6);
      ctx.bezierCurveTo(-s, -s * 0.2, -s * 0.5, -s, 0, -s * 0.4);
      ctx.bezierCurveTo(s * 0.5, -s, s, -s * 0.2, 0, s * 0.6);
      ctx.fill();
    }

    _drawQuestion(ctx, p) {
      ctx.font = `bold ${p.size * 5}px Manrope, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 0);
    }

    _drawConfetti(ctx, p) {
      if (p.variant === 0) {
        ctx.fillRect(-p.size * 1.5, -p.size * 0.5, p.size * 3, p.size);
      } else if (p.variant === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 1.5);
        ctx.lineTo(-p.size, p.size);
        ctx.lineTo(p.size, p.size);
        ctx.closePath();
        ctx.fill();
      }
    }

    _drawConnections(ctx) {
      // OPTIMIZED: squared distance — no Math.sqrt
      const maxSq = 10000; // 100*100
      const ps = this.particles;
      const len = ps.length;
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = rgba(CYAN, 1);

      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const dx = ps[i].x - ps[j].x;
          const dy = ps[i].y - ps[j].y;
          const dSq = dx * dx + dy * dy;
          if (dSq < maxSq) {
            ctx.globalAlpha = (1 - dSq / maxSq) * 0.06;
            ctx.beginPath();
            ctx.moveTo(ps[i].x, ps[i].y);
            ctx.lineTo(ps[j].x, ps[j].y);
            ctx.stroke();
          }
        }
      }
    }
  }


  /* ═══════════════════════════════════════════
     NEON CHARACTER (optimized — minimal shadowBlur)
     ═══════════════════════════════════════════ */

  class NeonCharacter {
    constructor(cfg) {
      this.xFrac = cfg.x;
      this.yFrac = cfg.y;
      this.scale = cfg.scale || 1;
      this.color = cfg.color;
      this.action = cfg.action;
      this.flip = cfg.flip || false;
      this.opacity = cfg.opacity || 0.2;
      this.time = Math.random() * 100;
      this.lasers = [];
    }

    update(dt) {
      this.time += dt;
      for (let i = this.lasers.length - 1; i >= 0; i--) {
        this.lasers[i].x += this.lasers[i].vx * dt * 60;
        this.lasers[i].life -= dt;
        if (this.lasers[i].life <= 0) this.lasers.splice(i, 1);
      }
      if (this.action === 'shoot' && Math.sin(this.time * 3) > 0.98 && this.lasers.length < 3) {
        this.lasers.push({
          x: 0, y: 0, vx: this.flip ? -4 : 4, life: 1.5,
          color: this.color
        });
      }
    }

    draw(ctx, w, h) {
      const px = this.xFrac * w;
      const py = this.yFrac * h;
      const s = this.scale;
      const t = this.time;

      ctx.save();
      ctx.translate(px, py);
      if (this.flip) ctx.scale(-1, 1);
      ctx.scale(s, s);
      ctx.globalAlpha = this.opacity;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = rgb(this.color);
      ctx.fillStyle = rgb(this.color);
      // OPTIMIZED: no shadowBlur for character body — just colored lines

      const pose = this._getPose(t);
      this._drawHead(ctx);
      this._drawBody(ctx, pose);
      this._drawLegs(ctx, pose);
      this._drawArms(ctx, pose);
      this._drawWeapon(ctx, pose);

      ctx.restore();
      this._drawLasers(ctx, px, py, s);
    }

    _drawHead(ctx) {
      ctx.beginPath();
      ctx.arc(0, -55, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, -57);
      ctx.lineTo(10, -57);
      ctx.stroke();
      // Visor — one glow line only
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -55);
      ctx.lineTo(9, -55);
      ctx.stroke();
    }

    _drawBody(ctx, pose) {
      const bob = pose.bodyBob || 0;
      const lean = pose.bodyLean || 0;
      ctx.beginPath();
      ctx.moveTo(0, -47);
      ctx.lineTo(lean * 20, -42 + bob);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-12, -42 + bob);
      ctx.lineTo(12, -42 + bob);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lean * 10, -42 + bob);
      ctx.lineTo(0, -15 + bob);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8, -15 + bob);
      ctx.lineTo(8, -15 + bob);
      ctx.stroke();
    }

    _drawLegs(ctx, pose) {
      const bob = pose.bodyBob || 0;
      const lul = pose.leftUpperLeg || 0;
      const rul = pose.rightUpperLeg || 0;
      const lkneeX = -8 + Math.sin(lul) * 18;
      const lkneeY = -15 + bob + Math.cos(lul) * 18;
      const lfootX = lkneeX + Math.sin(lul + 0.3) * 16;
      const lfootY = lkneeY + Math.cos(lul + 0.3) * 16;
      ctx.beginPath();
      ctx.moveTo(-8, -15 + bob);
      ctx.lineTo(lkneeX, lkneeY);
      ctx.lineTo(lfootX, lfootY);
      ctx.stroke();
      const rkneeX = 8 + Math.sin(rul) * 18;
      const rkneeY = -15 + bob + Math.cos(rul) * 18;
      const rfootX = rkneeX + Math.sin(rul + 0.3) * 16;
      const rfootY = rkneeY + Math.cos(rul + 0.3) * 16;
      ctx.beginPath();
      ctx.moveTo(8, -15 + bob);
      ctx.lineTo(rkneeX, rkneeY);
      ctx.lineTo(rfootX, rfootY);
      ctx.stroke();
    }

    _drawArms(ctx, pose) {
      const bob = pose.bodyBob || 0;
      const lua = pose.leftUpperArm || 0.3;
      const lla = pose.leftLowerArm || 0.5;
      const rua = pose.rightUpperArm || -0.3;
      const rla = pose.rightLowerArm || -0.5;
      const lelbowX = -12 + Math.sin(lua) * 16;
      const lelbowY = -42 + bob + Math.cos(lua) * 16;
      const lhandX = lelbowX + Math.sin(lua + lla) * 14;
      const lhandY = lelbowY + Math.cos(lua + lla) * 14;
      ctx.beginPath();
      ctx.moveTo(-12, -42 + bob);
      ctx.lineTo(lelbowX, lelbowY);
      ctx.lineTo(lhandX, lhandY);
      ctx.stroke();
      const relbowX = 12 + Math.sin(rua) * 16;
      const relbowY = -42 + bob + Math.cos(rua) * 16;
      const rhandX = relbowX + Math.sin(rua + rla) * 14;
      const rhandY = relbowY + Math.cos(rua + rla) * 14;
      ctx.beginPath();
      ctx.moveTo(12, -42 + bob);
      ctx.lineTo(relbowX, relbowY);
      ctx.lineTo(rhandX, rhandY);
      ctx.stroke();
      this._lhand = { x: lhandX, y: lhandY };
      this._rhand = { x: rhandX, y: rhandY };
    }

    _drawWeapon(ctx, pose) {
      if (!pose.weapon || !this._rhand) return;
      const hx = this._rhand.x;
      const hy = this._rhand.y;

      if (pose.weapon === 'saber') {
        const sa = pose.saberAngle || 0;
        const len = 35;
        const tipX = hx + Math.sin(sa - 1) * len;
        const tipY = hy - Math.cos(sa - 1) * len;
        // Hilt
        ctx.lineWidth = 3;
        ctx.strokeStyle = rgba({ r: 180, g: 180, b: 180 }, this.opacity * 3);
        const hiltX = hx + Math.sin(sa - 1) * 6;
        const hiltY = hy - Math.cos(sa - 1) * 6;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hiltX, hiltY);
        ctx.stroke();
        // Blade — glow via thicker semi-transparent line instead of shadowBlur
        ctx.strokeStyle = rgba(this.color, 0.3);
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(hiltX, hiltY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        // Blade core
        ctx.strokeStyle = rgb(this.color);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hiltX, hiltY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        // Bright center
        ctx.strokeStyle = `rgba(255,255,255,${this.opacity * 2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hiltX, hiltY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        // Reset
        ctx.strokeStyle = rgb(this.color);
        ctx.lineWidth = 2;
      }

      if (pose.weapon === 'blaster') {
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + 12, hy);
        ctx.moveTo(hx + 4, hy);
        ctx.lineTo(hx + 4, hy + 5);
        ctx.stroke();
      }

      if (pose.weapon === 'shield') {
        const lhx = this._lhand ? this._lhand.x : -20;
        const lhy = this._lhand ? this._lhand.y : -35;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(lhx + 8, lhy, 18, -Math.PI * 0.6, Math.PI * 0.6);
        ctx.stroke();
        ctx.globalAlpha = this.opacity * 0.3;
        ctx.fillStyle = rgba(this.color, 0.2);
        ctx.fill();
        ctx.globalAlpha = this.opacity;
      }
    }

    _drawLasers(ctx, px, py, s) {
      for (const l of this.lasers) {
        ctx.save();
        ctx.globalAlpha = l.life * 0.6;
        const lx = px + l.x * s;
        const ly = py - 40 * s;
        ctx.strokeStyle = rgb(l.color);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + (this.flip ? -20 : 20), ly);
        ctx.stroke();
        ctx.restore();
      }
    }

    _getPose(t) {
      switch (this.action) {
        case 'saber_swing': return {
          rightUpperArm: -1.2 + Math.sin(t * 2.5) * 0.8,
          rightLowerArm: -0.5 + Math.sin(t * 2.5 + 0.5) * 0.3,
          leftUpperArm: 0.3 + Math.sin(t) * 0.1,
          leftLowerArm: 0.5,
          bodyLean: Math.sin(t * 2.5) * 0.05,
          leftUpperLeg: Math.sin(t * 1.5) * 0.15,
          rightUpperLeg: -Math.sin(t * 1.5) * 0.15,
          weapon: 'saber',
          saberAngle: Math.sin(t * 2.5) * 0.8
        };
        case 'shoot': return {
          rightUpperArm: -0.8 + Math.sin(t * 0.5) * 0.05,
          rightLowerArm: 0,
          leftUpperArm: 0.5,
          leftLowerArm: 0.8,
          bodyLean: -0.03,
          leftUpperLeg: 0.15,
          rightUpperLeg: -0.2,
          weapon: 'blaster'
        };
        case 'block': return {
          rightUpperArm: -1.5 + Math.sin(t) * 0.1,
          rightLowerArm: -0.3,
          leftUpperArm: -1.8 + Math.sin(t + Math.PI) * 0.1,
          leftLowerArm: -0.5,
          bodyLean: 0,
          leftUpperLeg: 0.1,
          rightUpperLeg: -0.1,
          weapon: 'shield'
        };
        case 'dance': return {
          rightUpperArm: -0.5 + Math.sin(t * 3) * 0.8,
          rightLowerArm: Math.sin(t * 3) * 0.5,
          leftUpperArm: -0.5 + Math.sin(t * 3 + Math.PI) * 0.8,
          leftLowerArm: Math.sin(t * 3 + Math.PI) * 0.5,
          bodyLean: Math.sin(t * 3) * 0.08,
          leftUpperLeg: Math.sin(t * 6) * 0.2,
          rightUpperLeg: Math.sin(t * 6 + Math.PI) * 0.2,
          bodyBob: Math.sin(t * 6) * 3,
          weapon: null
        };
        case 'think': return {
          rightUpperArm: -1.0 + Math.sin(t * 0.5) * 0.03,
          rightLowerArm: -1.5,
          leftUpperArm: 0.3,
          leftLowerArm: 0.6,
          bodyLean: 0.02,
          leftUpperLeg: 0.05,
          rightUpperLeg: -0.05,
          weapon: null
        };
        case 'celebrate': return {
          rightUpperArm: -2.5 + Math.sin(t * 4) * 0.3,
          rightLowerArm: 0 + Math.sin(t * 4) * 0.15,
          leftUpperArm: -2.5 + Math.sin(t * 4 + 1) * 0.3,
          leftLowerArm: 0 + Math.sin(t * 4 + 1) * 0.15,
          bodyLean: Math.sin(t * 2) * 0.05,
          leftUpperLeg: Math.sin(t * 4) * 0.15,
          rightUpperLeg: Math.sin(t * 4 + Math.PI) * 0.15,
          bodyBob: Math.abs(Math.sin(t * 4)) * 5,
          weapon: null
        };
        case 'walk': return {
          rightUpperArm: 0.3 + Math.sin(t * 3) * 0.4,
          rightLowerArm: 0.3,
          leftUpperArm: 0.3 - Math.sin(t * 3) * 0.4,
          leftLowerArm: 0.3,
          bodyLean: 0.02,
          leftUpperLeg: Math.sin(t * 3) * 0.4,
          rightUpperLeg: -Math.sin(t * 3) * 0.4,
          weapon: null
        };
        case 'dodge': return {
          rightUpperArm: 0.8 + Math.sin(t * 2) * 0.3,
          rightLowerArm: 0.3,
          leftUpperArm: -0.5 + Math.sin(t * 2) * 0.5,
          leftLowerArm: 0.2,
          bodyLean: Math.sin(t * 2) * 0.15,
          leftUpperLeg: Math.sin(t * 2) * 0.3,
          rightUpperLeg: -Math.sin(t * 2) * 0.3,
          bodyBob: Math.abs(Math.sin(t * 2)) * 4,
          weapon: null
        };
        default: return {
          rightUpperArm: 0.3, rightLowerArm: 0.3,
          leftUpperArm: 0.3, leftLowerArm: 0.3,
          leftUpperLeg: 0, rightUpperLeg: 0,
          weapon: null
        };
      }
    }
  }


  /* ═══════════════════════════════════════════
     SECTION CANVAS — one per section
     ═══════════════════════════════════════════ */

  class SectionCanvas {
    constructor(section, config) {
      this.section = section;
      this.config = config;
      this.isVisible = false;
      this.lastTime = 0;

      this.canvas = document.createElement('canvas');
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.style.cssText =
        'position:absolute;inset:0;z-index:0;pointer-events:none;width:100%;height:100%;';
      section.insertBefore(this.canvas, section.firstChild);

      const container = section.querySelector('.container');
      if (container) { container.style.position = 'relative'; container.style.zIndex = '1'; }

      this.ctx = this.canvas.getContext('2d');
      this.resize();

      this.particles = new ThemedParticles(config.particles, this.w, this.h);
      this.characters = (config.characters || []).map(c => new NeonCharacter(c));
    }

    resize() {
      // OPTIMIZED: cap DPR at 1.5 (saves ~55% pixels vs DPR 2)
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = this.section.getBoundingClientRect();
      this.w = rect.width;
      this.h = rect.height;
      this.canvas.width = this.w * dpr;
      this.canvas.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.particles) this.particles.resize(this.w, this.h);
    }

    update(time) {
      const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.1) : 0.016;
      this.lastTime = time;
      this.particles.update();
      for (const ch of this.characters) ch.update(dt);
    }

    draw() {
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.particles.draw(this.ctx);
      for (const ch of this.characters) ch.draw(this.ctx, this.w, this.h);
    }
  }


  /* ═══════════════════════════════════════════
     SECTION EFFECTS — singleton manager (30fps capped)
     ═══════════════════════════════════════════ */

  class SectionEffects {
    constructor() {
      this.canvases = [];
      this.rafId = null;
      this.lastFrameTime = 0;
      this._init();
    }

    _init() {
      for (const [sectionId, config] of Object.entries(CONFIGS)) {
        const el = document.getElementById(sectionId);
        if (!el) continue;
        this.canvases.push(new SectionCanvas(el, config));
      }

      this._observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            const sc = this.canvases.find(c => c.section === entry.target);
            if (sc) sc.isVisible = entry.isIntersecting;
          }
          const anyVisible = this.canvases.some(c => c.isVisible);
          if (anyVisible && !this.rafId) this._animate(performance.now());
          if (!anyVisible && this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
          }
        },
        { threshold: 0 }
      );

      for (const sc of this.canvases) {
        this._observer.observe(sc.section);
      }

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          for (const sc of this.canvases) sc.resize();
        }, 250);
      }, { passive: true });
    }

    _animate(time) {
      this.rafId = requestAnimationFrame(t => this._animate(t));

      // OPTIMIZED: 30fps frame limiter
      const elapsed = time - this.lastFrameTime;
      if (elapsed < FRAME_INTERVAL) return;
      this.lastFrameTime = time - (elapsed % FRAME_INTERVAL);

      for (const sc of this.canvases) {
        if (sc.isVisible) {
          sc.update(time);
          sc.draw();
        }
      }
    }
  }

  // ─── Initialize ───
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.sectionEffects = new SectionEffects();
    }, 500);
  });

})();
