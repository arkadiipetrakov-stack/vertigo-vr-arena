class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null };
    this.animationId = null;
    this.isVisible = true;

    // Responsive particle count
    this.particleCount = window.innerWidth < 768 ? 25 : 55;

    // Colors
    this.colors = [
      { r: 0, g: 240, b: 255 },   // cyan
      { r: 139, g: 92, b: 246 },   // violet
      { r: 244, g: 114, b: 182 }   // pink
    ];

    // Mouse repulsion radius
    this.mouseRadius = 150;

    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.setupEventListeners();
    this.animate();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(dpr, dpr);
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
    // Mouse move tracking
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

    // Touch support
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

    // Resize handler (debounced)
    this._resizeTimeout = null;
    this._onResize = () => {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => {
        this.resize();
        this.particleCount = window.innerWidth < 768 ? 25 : 55;
        this.createParticles();
      }, 200);
    };

    window.addEventListener('resize', this._onResize, { passive: true });

    // Visibility observer - pause when canvas not in viewport
    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          this.isVisible = entry.isIntersecting;
          if (this.isVisible && !this.animationId) {
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
    ctx.save();

    // Soft glow effect
    ctx.shadowBlur = p.size * 4;
    ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity * 0.6})`;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity})`;
    ctx.fill();

    ctx.restore();
  }

  drawTriangle(p) {
    const ctx = this.ctx;
    const size = p.size * 2.5;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.866, size * 0.5);
    ctx.lineTo(size * 0.866, size * 0.5);
    ctx.closePath();

    ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity})`;
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

    // Glow effect for hexagons
    ctx.shadowBlur = size * 2;
    ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity * 0.4})`;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  drawParticle(p) {
    switch (p.shape) {
      case 'circle':
        this.drawCircle(p);
        break;
      case 'triangle':
        this.drawTriangle(p);
        break;
      case 'hexagon':
        this.drawHexagon(p);
        break;
    }
  }

  updateParticle(p) {
    // Apply mouse repulsion
    if (this.mouse.x !== null && this.mouse.y !== null) {
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.mouseRadius && dist > 0) {
        const force = (this.mouseRadius - dist) / this.mouseRadius;
        const angle = Math.atan2(dy, dx);
        p.x += Math.cos(angle) * force * 1.5;
        p.y += Math.sin(angle) * force * 1.5;
      }
    }

    // Apply velocity
    p.x += p.speedX;
    p.y += p.speedY;

    // Rotate non-circle shapes
    if (p.shape !== 'circle') {
      p.rotation += p.rotationSpeed;
    }

    // Wrap around: particles leaving top reappear at bottom
    if (p.y < -p.size * 3) {
      p.y = this.height + p.size * 3;
      p.x = Math.random() * this.width;
    }

    // Wrap horizontal edges
    if (p.x < -p.size * 3) {
      p.x = this.width + p.size * 3;
    } else if (p.x > this.width + p.size * 3) {
      p.x = -p.size * 3;
    }

    // Wrap bottom edge (if particle somehow goes below)
    if (p.y > this.height + p.size * 3) {
      p.y = -p.size * 3;
    }
  }

  animate() {
    if (!this.isVisible) {
      this.animationId = null;
      return;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      this.updateParticle(this.particles[i]);
      this.drawParticle(this.particles[i]);
    }

    // Draw faint connections between nearby particles
    this.drawConnections();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  drawConnections() {
    const maxDist = 120;
    const ctx = this.ctx;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.08;
          ctx.beginPath();
          ctx.moveTo(this.particles[i].x, this.particles[i].y);
          ctx.lineTo(this.particles[j].x, this.particles[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
          ctx.lineWidth = 0.5;
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

    if (this._observer) {
      this._observer.disconnect();
    }

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
