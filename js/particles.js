/* ============================================
   VERTIGO VR — Hero Particle System
   OPTIMIZED: pre-rendered glow sprites, no shadowBlur,
              squared-distance connections, 30fps cap
   ============================================ */

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null };
    this.animationId = null;
    this.isVisible = true;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / 30; // 30fps cap

    // Responsive particle count (reduced)
    this.particleCount = window.innerWidth < 768 ? 18 : 35;

    // Colors
    this.colors = [
      { r: 0, g: 240, b: 255 },   // cyan
      { r: 139, g: 92, b: 246 },   // violet
      { r: 244, g: 114, b: 182 }   // pink
    ];

    // Mouse repulsion radius
    this.mouseRadius = 150;
    this.mouseRadiusSq = 150 * 150;

    // Pre-render glow sprites
    this._glowCache = new Map();

    this.init();
  }

  // Pre-render a radial glow image for a given color
  _getGlow(color, size) {
    const key = `${color.r},${color.g},${color.b},${Math.round(size)}`;
    if (this._glowCache.has(key)) return this._glowCache.get(key);

    const dim = Math.ceil(size * 8);
    const c = document.createElement('canvas');
    c.width = dim; c.height = dim;
    const cx = c.getContext('2d');
    const half = dim / 2;
    const grad = cx.createRadialGradient(half, half, 0, half, half, size * 3);
    grad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},0.4)`);
    grad.addColorStop(0.3, `rgba(${color.r},${color.g},${color.b},0.12)`);
    grad.addColorStop(1, 'transparent');
    cx.fillStyle = grad;
    cx.fillRect(0, 0, dim, dim);

    this._glowCache.set(key, c);
    return c;
  }

  init() {
    this.resize();
    this.createParticles();
    this.setupEventListeners();
    this.animate();
  }

  resize() {
    // Cap DPR at 1.5 for performance
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      const shapeRand = Math.random();
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 4 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -(Math.random() * 0.5 + 0.1),
        opacity: Math.random() * 0.3 + 0.05,
        color: color,
        shape: shapeRand < 0.6 ? 'circle' : shapeRand < 0.8 ? 'triangle' : 'hexagon',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01
      });
    }
  }

  setupEventListeners() {
    this._onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    };

    this._onMouseLeave = () => {
      this.mouse.x = null;
      this.mouse.y = null;
    };

    this.canvas.addEventListener('mousemove', this._onMouseMove, { passive: true });
    this.canvas.addEventListener('mouseleave', this._onMouseLeave, { passive: true });

    this._onTouchMove = (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.touches[0].clientX - rect.left;
        this.mouse.y = e.touches[0].clientY - rect.top;
      }
    };

    this._onTouchEnd = () => {
      this.mouse.x = null;
      this.mouse.y = null;
    };

    this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: true });
    this.canvas.addEventListener('touchend', this._onTouchEnd, { passive: true });

    this._resizeTimeout = null;
    this._onResize = () => {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => {
        this.resize();
        this.particleCount = window.innerWidth < 768 ? 18 : 35;
        this.createParticles();
      }, 250);
    };

    window.addEventListener('resize', this._onResize, { passive: true });

    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          this.isVisible = entry.isIntersecting;
          if (this.isVisible && !this.animationId) {
            this.lastFrameTime = performance.now();
            this.animate();
          }
        });
      },
      { threshold: 0 }
    );

    this._observer.observe(this.canvas);
  }

  drawCircle(p) {
    const ctx = this.ctx;
    // Draw glow sprite (replaces expensive shadowBlur)
    const glow = this._getGlow(p.color, p.size);
    const half = glow.width / 2;
    ctx.globalAlpha = p.opacity * 0.5;
    ctx.drawImage(glow, p.x - half, p.y - half);

    // Draw dot
    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${p.opacity})`;
    ctx.fill();
  }

  drawTriangle(p) {
    const ctx = this.ctx;
    const size = p.size * 2.5;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.866, size * 0.5);
    ctx.lineTo(size * 0.866, size * 0.5);
    ctx.closePath();
    ctx.strokeStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${p.opacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  drawHexagon(p) {
    const ctx = this.ctx;
    const size = p.size * 2;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${p.opacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  drawParticle(p) {
    switch (p.shape) {
      case 'circle':   this.drawCircle(p); break;
      case 'triangle': this.drawTriangle(p); break;
      case 'hexagon':  this.drawHexagon(p); break;
    }
  }

  updateParticle(p) {
    // Mouse repulsion with squared distance (no sqrt)
    if (this.mouse.x !== null && this.mouse.y !== null) {
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < this.mouseRadiusSq && distSq > 0) {
        const dist = Math.sqrt(distSq); // sqrt only when needed
        const force = (this.mouseRadius - dist) / this.mouseRadius;
        const angle = Math.atan2(dy, dx);
        p.x += Math.cos(angle) * force * 1.5;
        p.y += Math.sin(angle) * force * 1.5;
      }
    }

    p.x += p.speedX;
    p.y += p.speedY;

    if (p.shape !== 'circle') {
      p.rotation += p.rotationSpeed;
    }

    if (p.y < -p.size * 3) {
      p.y = this.height + p.size * 3;
      p.x = Math.random() * this.width;
    }
    if (p.x < -p.size * 3) p.x = this.width + p.size * 3;
    else if (p.x > this.width + p.size * 3) p.x = -p.size * 3;
    if (p.y > this.height + p.size * 3) p.y = -p.size * 3;
  }

  animate(now) {
    if (!this.isVisible) {
      this.animationId = null;
      return;
    }

    this.animationId = requestAnimationFrame((t) => this.animate(t));

    // 30fps frame limiter
    if (!now) now = performance.now();
    const elapsed = now - this.lastFrameTime;
    if (elapsed < this.frameInterval) return;
    this.lastFrameTime = now - (elapsed % this.frameInterval);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      this.updateParticle(this.particles[i]);
      this.drawParticle(this.particles[i]);
    }

    this.drawConnections();
  }

  drawConnections() {
    // OPTIMIZED: squared distance comparison (no Math.sqrt)
    const maxDistSq = 14400; // 120 * 120
    const ctx = this.ctx;
    const ps = this.particles;
    const len = ps.length;

    ctx.lineWidth = 0.5;

    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const dx = ps[i].x - ps[j].x;
        // Quick X-axis reject before full calculation
        if (dx > 120 || dx < -120) continue;
        const dy = ps[i].y - ps[j].y;
        if (dy > 120 || dy < -120) continue;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const opacity = (1 - distSq / maxDistSq) * 0.08;
          ctx.beginPath();
          ctx.moveTo(ps[i].x, ps[i].y);
          ctx.lineTo(ps[j].x, ps[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
          ctx.stroke();
        }
      }
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this._observer) this._observer.disconnect();
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
    this.canvas.removeEventListener('touchmove', this._onTouchMove);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
    window.removeEventListener('resize', this._onResize);
    clearTimeout(this._resizeTimeout);
    this.particles = [];
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.particleSystem = new ParticleSystem('particles-canvas');
  }
});
