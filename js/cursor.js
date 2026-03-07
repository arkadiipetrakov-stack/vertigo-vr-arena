/* ============================================
   VERTIGO VR Arena — Custom Cursor Effect
   OPTIMIZED: Canvas-based particle trail (no DOM),
              idle detection, reduced allocations
   ============================================ */

class CursorEffect {
  constructor() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.cursor = { x: this.mouse.x, y: this.mouse.y };
    this.glow = { x: this.mouse.x, y: this.mouse.y };

    this.isHovering = false;
    this.isMoving = false;
    this.lastMoveTime = 0;

    // Canvas-based particles (replaces 30 DOM elements)
    this.particles = [];
    this.maxParticles = 20;
    this.spawnInterval = 50;
    this.lastSpawnTime = 0;

    // Brand colors as RGB arrays for fast access
    this.colorsRGB = [
      [232, 93, 21],
      [107, 92, 231],
      [255, 122, 51]
    ];

    this.createElements();
    this.setupListeners();
    this._rafId = requestAnimationFrame(() => this.animate());
  }

  createElements() {
    document.body.classList.add('cursor-active');

    // Outer ring
    this.ring = document.createElement('div');
    this.ring.style.cssText = `
      position:fixed;top:0;left:0;
      width:30px;height:30px;
      border:2px solid rgba(232,93,21,0.6);
      border-radius:50%;
      pointer-events:none;z-index:9999;
      transition:width 0.25s ease,height 0.25s ease,
                 border-color 0.25s ease,background 0.25s ease;
      transform:translate(-50%,-50%);
      box-shadow:0 0 10px rgba(232,93,21,0.3),inset 0 0 10px rgba(232,93,21,0.1);
      mix-blend-mode:screen;
      will-change:transform;
    `;
    document.body.appendChild(this.ring);

    // Inner dot
    this.dot = document.createElement('div');
    this.dot.style.cssText = `
      position:fixed;top:0;left:0;
      width:4px;height:4px;
      background:#E85D15;
      border-radius:50%;
      pointer-events:none;z-index:9999;
      transform:translate(-50%,-50%);
      box-shadow:0 0 6px rgba(232,93,21,0.8);
      will-change:transform;
    `;
    document.body.appendChild(this.dot);

    // Background glow
    this.glowEl = document.createElement('div');
    this.glowEl.style.cssText = `
      position:fixed;top:0;left:0;
      width:400px;height:400px;
      background:radial-gradient(circle,rgba(232,93,21,0.08) 0%,transparent 70%);
      border-radius:50%;
      pointer-events:none;z-index:0;
      transform:translate(-50%,-50%);
      will-change:transform;
    `;
    document.body.appendChild(this.glowEl);

    // Canvas for particle trail (replaces DOM particle container)
    this.trailCanvas = document.createElement('canvas');
    this.trailCanvas.style.cssText = `
      position:fixed;top:0;left:0;
      width:100%;height:100%;
      pointer-events:none;z-index:9998;
    `;
    document.body.appendChild(this.trailCanvas);
    this.trailCtx = this.trailCanvas.getContext('2d');
    this._resizeTrailCanvas();
  }

  _resizeTrailCanvas() {
    // Use 1x DPR for trail canvas — lightweight decorative effect
    this.trailCanvas.width = window.innerWidth;
    this.trailCanvas.height = window.innerHeight;
  }

  setupListeners() {
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.isMoving = true;
      this.lastMoveTime = performance.now();
    }, { passive: true });

    const hoverTargets = 'a, button, [role="button"], input, select, textarea, .btn, .tariff-card, .review-card, .faq__question';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) {
        this.isHovering = true;
        this.ring.style.width = '50px';
        this.ring.style.height = '50px';
        this.ring.style.borderColor = 'rgba(232,93,21,0.9)';
        this.ring.style.background = 'rgba(232,93,21,0.05)';
      }
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) {
        this.isHovering = false;
        this.ring.style.width = '30px';
        this.ring.style.height = '30px';
        this.ring.style.borderColor = 'rgba(232,93,21,0.6)';
        this.ring.style.background = 'transparent';
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      this.ring.style.opacity = '0';
      this.dot.style.opacity = '0';
      this.glowEl.style.opacity = '0';
    }, { passive: true });

    document.addEventListener('mouseenter', () => {
      this.ring.style.opacity = '1';
      this.dot.style.opacity = '1';
      this.glowEl.style.opacity = '1';
    }, { passive: true });

    window.addEventListener('resize', () => {
      this._resizeTrailCanvas();
    }, { passive: true });
  }

  spawnParticle(now) {
    if (now - this.lastSpawnTime < this.spawnInterval) return;
    if (this.particles.length >= this.maxParticles) return;
    if (!this.isMoving) return;
    this.lastSpawnTime = now;

    const c = this.colorsRGB[Math.floor(Math.random() * this.colorsRGB.length)];
    this.particles.push({
      x: this.mouse.x,
      y: this.mouse.y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: 1.5 + Math.random() * 1.5,
      life: 1.0,
      decay: 0.015 + Math.random() * 0.01,
      cr: c[0], cg: c[1], cb: c[2]
    });
  }

  updateAndDrawParticles() {
    const ctx = this.trailCtx;
    ctx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay;

      if (p.life <= 0) {
        // Fast removal — swap with last element
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }

      p.vy += 0.02;
      p.x += p.vx;
      p.y += p.vy;

      ctx.globalAlpha = p.life;
      ctx.fillStyle = `rgb(${p.cr},${p.cg},${p.cb})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  lerp(current, target, factor) {
    return current + (target - current) * factor;
  }

  animate() {
    this._rafId = requestAnimationFrame(() => this.animate());

    const now = performance.now();

    // Detect idle (no mouse movement for 200ms)
    if (now - this.lastMoveTime > 200) {
      this.isMoving = false;
    }

    // Lerp cursor ring (slight lag)
    this.cursor.x = this.lerp(this.cursor.x, this.mouse.x, 0.15);
    this.cursor.y = this.lerp(this.cursor.y, this.mouse.y, 0.15);

    // Lerp glow (heavy lag)
    this.glow.x = this.lerp(this.glow.x, this.mouse.x, 0.05);
    this.glow.y = this.lerp(this.glow.y, this.mouse.y, 0.05);

    // Use transform instead of left/top (composited, no layout thrash)
    const ringHalf = this.isHovering ? 25 : 15;
    this.ring.style.transform = `translate(${this.cursor.x - ringHalf}px, ${this.cursor.y - ringHalf}px)`;
    this.dot.style.transform = `translate(${this.mouse.x - 2}px, ${this.mouse.y - 2}px)`;
    this.glowEl.style.transform = `translate(${this.glow.x - 200}px, ${this.glow.y - 200}px)`;

    // Particles on canvas
    this.spawnParticle(now);
    this.updateAndDrawParticles();
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new CursorEffect();
});
