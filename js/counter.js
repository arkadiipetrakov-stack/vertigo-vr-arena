document.addEventListener('DOMContentLoaded', () => {
  const counters = document.querySelectorAll('[data-target]');

  if (!counters.length) return;

  const animateCounter = (element) => {
    const target = parseFloat(element.dataset.target);
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';
    const duration = parseInt(element.dataset.duration, 10) || 2000;
    const startTime = performance.now();
    const isFloat = element.dataset.target.includes('.');

    // Easing function: ease-out quart for a satisfying deceleration
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = easedProgress * target;

      if (isFloat) {
        element.textContent = prefix + currentValue.toFixed(1) + suffix;
      } else {
        element.textContent = prefix + Math.floor(currentValue).toLocaleString('ru-RU') + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Ensure final value is exact
        if (isFloat) {
          element.textContent = prefix + target.toFixed(1) + suffix;
        } else {
          element.textContent = prefix + target.toLocaleString('ru-RU') + suffix;
        }
      }
    };

    requestAnimationFrame(update);
  };

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach(counter => {
      const target = parseFloat(counter.dataset.target);
      const suffix = counter.dataset.suffix || '';
      const prefix = counter.dataset.prefix || '';
      const isFloat = counter.dataset.target.includes('.');

      if (isFloat) {
        counter.textContent = prefix + target.toFixed(1) + suffix;
      } else {
        counter.textContent = prefix + target.toLocaleString('ru-RU') + suffix;
      }
    });
    return;
  }

  // Use IntersectionObserver to trigger animation when visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.5,
    rootMargin: '0px 0px -10% 0px'
  });

  counters.forEach(counter => observer.observe(counter));
});
