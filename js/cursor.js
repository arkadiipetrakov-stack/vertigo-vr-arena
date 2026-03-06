/* ============================================
   VERTIGO VR Arena — Custom Cursor Effect
   Ring + Dot + Background Glow + Particle Trail
   ============================================ */

class CursorEffect {
  constructor() {
    // Bail on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
    // Bail on reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Real mouse position
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    // Lerped positions
    this.cursor = { x: this.mouse.x, y: this.mouse.y };
    this.glow = { x: this.mouse.x, y: this.mouse.y };

    // State
    this.isHovering = false;
    this.particles = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 40; // ms between particle spawns
    this.maxParticles = 30;

    // Brand colors
    this.colors = ['#00f0ff', '#8b5cf6', '#f472b6'];

    this.createElements();
    this.setupListeners();
    this.animate();
  }

  createElements() {
    // Hide default cursor
    document.body.classList.add('cursor-active');

    // Outer ring
    this.ring = document.createElement('div');
    this.ring.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 30px; height: 30px;
      border: 2px solid rgba(0, 240, 255, 0.6);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transition: width 0.25s ease, height 0.25s ease,
                  border-color 0.25s ease, background 0.25s ease;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.3),
                  inset 0 0 10px rgba(0, 240, 255, 0.1);
      mix-blend-mode: screen;
      will-change: left, top;
    `;
    document.body.appendChild(this.ring);

    // Inner dot
    this.dot = document.createElement('div');
    this.dot.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 4px; height: 4px;
      background: #00f0ff;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 6px rgba(0, 240, 255, 0.8);
      will-change: left, top;
    `;
    document.body.appendChild(this.dot);

    // Background glow spot
    this.glowEl = document.createElement('div');
    this.glowEl.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
      transform: translate(-50%, -50%);
      will-change: left, top;
    `;
    document.body.appendChild(this.glowEl);

    // Particle container
    this.particleContainer = document.createElement('div');
    this.particleContainer.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 9998;
      overflow: hidden;
    `;
    document.body.appendChild(this.particleContainer);
  }

  setupListeners() {
    // Track mouse
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    }, { passive: true });

    // Hover detection for interactive elements
    const hoverTargets = 'a, button, [role="button"], input, select, textarea, .btn, .tariff-card, .review-card, .faq__question';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) {
        this.isHovering = true;
        this.ring.style.width = '50px';
        this.ring.style.height = '50px';
        this.ring.style.borderColor = 'rgba(0, 240, 255, 0.9)';
        this.ring.style.background = 'rgba(0, 240, 255, 0.05)';
      }
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) {
        this.isHovering = false;
        this.ring.style.width = '30px';
        this.ring.style.height = '30px';
        this.ring.style.borderColor = 'rgba(0, 240, 255, 0.6)';
        this.ring.style.background = 'transparent';
      }
    }, { passive: true });

    // Hide when mouse leaves window
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
  }

  spawnParticle() {
    const now = performance.now();
    if (now - this.lastSpawnTime < this.spawnInterval) return;
    if (this.particles.length >= this.maxParticles) return;
    this.lastSpawnTime = now;

    const size = 2 + Math.random() * 2;
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];

    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed;
      width: ${size}px; height: ${size}px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      left: ${this.mouse.x}px;
      top: ${this.mouse.y}px;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 ${size * 2}px ${color};
      opacity: 1;
    `;

    this.particleContainer.appendChild(el);

    this.particles.push({
      el,
      x: this.mouse.x,
      y: this.mouse.y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      startTime: now,
      lifetime: 500 + Math.random() * 500
    });
  }

  updateParticles() {
    const now = performance.now();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const progress = (now - p.startTime) / p.lifetime;

      if (progress >= 1) {
        p.el.remove();
        this.particles.splice(i, 1);
        continue;
      }

      // Physics: velocity + slight gravity
      p.vy += 0.03;
      p.x += p.vx;
      p.y += p.vy;

      p.el.style.left = p.x + 'px';
      p.el.style.top = p.y + 'px';
      p.el.style.opacity = 1 - progress;
    }
  }

  lerp(current, target, factor) {
    return current + (target - current) * factor;
  }

  animate() {
    // Lerp cursor ring (slight lag)
    this.cursor.x = this.lerp(this.cursor.x, this.mouse.x, 0.15);
    this.cursor.y = this.lerp(this.cursor.y, this.mouse.y, 0.15);

    // Lerp glow (heavy lag)
    this.glow.x = this.lerp(this.glow.x, this.mouse.x, 0.05);
    this.glow.y = this.lerp(this.glow.y, this.mouse.y, 0.05);

    // Update positions
    this.ring.style.left = this.cursor.x + 'px';
    this.ring.style.top = this.cursor.y + 'px';

    this.dot.style.left = this.mouse.x + 'px';
    this.dot.style.top = this.mouse.y + 'px';

    this.glowEl.style.left = this.glow.x + 'px';
    this.glowEl.style.top = this.glow.y + 'px';

    // Particles
    this.spawnParticle();
    this.updateParticles();

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new CursorEffect();
});
