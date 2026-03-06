document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // Reduced motion: show everything instantly, no animations
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-animate]').forEach(el => {
      el.style.opacity = '1';
      el.style.visibility = 'visible';
    });
    document.querySelectorAll('[data-animate-group]').forEach(group => {
      Array.from(group.children).forEach(child => {
        child.style.opacity = '1';
        child.style.visibility = 'visible';
      });
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ------------------------------------------------
  // 1. Hero headline - split text animation
  // ------------------------------------------------
  const heroTitle = document.querySelector('.hero__title');
  if (heroTitle) {
    // Find accent word before splitting
    const accentEl = heroTitle.querySelector('.hero__title-accent');
    const accentWord = accentEl ? accentEl.textContent.trim() : '';

    const text = heroTitle.textContent;
    heroTitle.innerHTML = '';
    // Split on any whitespace (including nbsp)
    const words = text.split(/\s+/).filter(Boolean);

    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap';

      word.split('').forEach(char => {
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        charSpan.style.display = 'inline-block';
        wordSpan.appendChild(charSpan);
      });

      heroTitle.appendChild(wordSpan);
      if (wordIndex < words.length - 1) {
        heroTitle.appendChild(document.createTextNode(' '));
      }
    });

    const chars = heroTitle.querySelectorAll('span > span');
    gsap.fromTo(chars,
      { opacity: 0, y: 80 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.03,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.3
      }
    );
  }

  // ------------------------------------------------
  // 2. Hero subtitle, CTAs, trust bar
  // ------------------------------------------------
  const heroSubtitle = document.querySelector('.hero__subtitle');
  if (heroSubtitle) {
    gsap.fromTo(heroSubtitle,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, delay: 1.2 }
    );
  }

  const heroCTAs = document.querySelectorAll('.hero__ctas .btn');
  if (heroCTAs.length) {
    gsap.fromTo(heroCTAs,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.15, duration: 0.5, delay: 1.5 }
    );
  }

  const heroTrust = document.querySelector('.hero__trust');
  if (heroTrust) {
    gsap.fromTo(heroTrust,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, delay: 2 }
    );
  }

  // ------------------------------------------------
  // 3. Generic data-animate elements
  // ------------------------------------------------
  document.querySelectorAll('[data-animate]').forEach(el => {
    const direction = el.dataset.animate;
    const delayAttr = parseFloat(el.dataset.animateDelay) || 0;

    const fromProps = { opacity: 0 };
    const toProps = {
      opacity: 1,
      duration: 0.7,
      delay: delayAttr,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    };

    if (direction === 'up') { fromProps.y = 50; toProps.y = 0; }
    if (direction === 'down') { fromProps.y = -50; toProps.y = 0; }
    if (direction === 'left') { fromProps.x = -50; toProps.x = 0; }
    if (direction === 'right') { fromProps.x = 50; toProps.x = 0; }
    if (direction === 'scale') {
      fromProps.scale = 0.85;
      fromProps.y = 30;
      toProps.scale = 1;
      toProps.y = 0;
    }

    gsap.fromTo(el, fromProps, toProps);
  });

  // ------------------------------------------------
  // 4. Staggered group animations
  // ------------------------------------------------
  document.querySelectorAll('[data-animate-group]').forEach(group => {
    const children = group.children;
    if (!children.length) return;

    gsap.fromTo(children,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: group,
          start: 'top 80%'
        }
      }
    );
  });

  // ------------------------------------------------
  // 5. Timeline section - SVG line drawing on scroll
  // ------------------------------------------------
  const timelineSvgLine = document.querySelector('.timeline__line-svg path, .timeline__line-path');
  if (timelineSvgLine) {
    const lineLength = timelineSvgLine.getTotalLength();
    gsap.set(timelineSvgLine, {
      strokeDasharray: lineLength,
      strokeDashoffset: lineLength
    });

    gsap.to(timelineSvgLine, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '.timeline',
        start: 'top 70%',
        end: 'bottom 30%',
        scrub: 1
      }
    });
  }

  // Timeline nodes - activate as user scrolls past them
  const timelineNodes = document.querySelectorAll('.timeline__node');
  if (timelineNodes.length) {
    timelineNodes.forEach((node, i) => {
      const nodeContent = node.querySelector('.timeline__content') || node;

      gsap.fromTo(nodeContent,
        { opacity: 0, x: i % 2 === 0 ? -40 : 40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: node,
            start: 'top 75%',
            toggleActions: 'play none none none',
            onEnter: () => {
              node.classList.add('timeline__node--active');
            }
          }
        }
      );
    });
  }

  // ------------------------------------------------
  // 6. Tariff cards entrance - MAX first, then OPTIMAL, then MIN
  // ------------------------------------------------
  const tariffSection = document.querySelector('.tariffs');
  const tariffCards = document.querySelectorAll('.tariff-card');

  if (tariffSection && tariffCards.length) {
    const sortedCards = Array.from(tariffCards);
    const featuredIndex = sortedCards.findIndex(
      card => card.classList.contains('tariff-card--featured') ||
              card.classList.contains('tariff-card--max')
    );

    const tariffTl = gsap.timeline({
      scrollTrigger: {
        trigger: tariffSection,
        start: 'top 70%',
        toggleActions: 'play none none none'
      },
      onComplete() {
        sortedCards.forEach(c => gsap.set(c, { clearProps: 'transform' }));
      }
    });

    if (featuredIndex !== -1) {
      tariffTl.fromTo(sortedCards[featuredIndex],
        { opacity: 0, y: 60, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.4)' }
      );

      const otherCards = sortedCards.filter((_, idx) => idx !== featuredIndex);
      tariffTl.fromTo(otherCards,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: 'power2.out' },
        '-=0.3'
      );
    } else {
      tariffTl.fromTo(sortedCards,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, stagger: 0.2, duration: 0.6, ease: 'power2.out' }
      );
    }
  }

  // ------------------------------------------------
  // 7. Safety cards - scan line reveal effect
  // ------------------------------------------------
  const safetyCards = document.querySelectorAll('.safety-card');
  if (safetyCards.length) {
    safetyCards.forEach((card, i) => {
      let scanLine = card.querySelector('.safety__scan-line');
      if (!scanLine) {
        scanLine = document.createElement('div');
        scanLine.classList.add('safety__scan-line');
        scanLine.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #00f0ff, transparent);
          opacity: 0;
          pointer-events: none;
          z-index: 2;
        `;
        card.style.position = card.style.position || 'relative';
        card.style.overflow = 'hidden';
        card.appendChild(scanLine);
      }

      const cardTl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });

      cardTl.fromTo(card,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, delay: i * 0.1 }
      );

      cardTl.fromTo(scanLine,
        { opacity: 1, top: '0%' },
        {
          top: '100%',
          duration: 0.6,
          ease: 'power1.inOut',
          onComplete: () => {
            gsap.to(scanLine, { opacity: 0, duration: 0.3 });
          }
        },
        '-=0.2'
      );
    });
  }

  // ------------------------------------------------
  // 8. Section heading animations
  // ------------------------------------------------
  document.querySelectorAll('.section__title').forEach(title => {
    gsap.fromTo(title,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: title,
          start: 'top 85%'
        }
      }
    );
  });

  document.querySelectorAll('.section__subtitle').forEach(subtitle => {
    gsap.fromTo(subtitle,
      { opacity: 0, y: 25 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: subtitle,
          start: 'top 85%'
        }
      }
    );
  });

  // ------------------------------------------------
  // 9. Gallery images
  // ------------------------------------------------
  const galleryItems = document.querySelectorAll('.gallery__item');
  if (galleryItems.length) {
    gsap.fromTo(galleryItems,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: galleryItems[0].parentElement,
          start: 'top 75%'
        }
      }
    );
  }

  // ------------------------------------------------
  // 10. Booking form section
  // ------------------------------------------------
  const bookingSection = document.querySelector('.booking');
  if (bookingSection) {
    gsap.fromTo('.booking__info',
      { opacity: 0, x: -40 },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        scrollTrigger: {
          trigger: bookingSection,
          start: 'top 70%'
        }
      }
    );

    gsap.fromTo('.booking__form-wrapper',
      { opacity: 0, x: 40 },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        delay: 0.2,
        scrollTrigger: {
          trigger: bookingSection,
          start: 'top 70%'
        }
      }
    );
  }

  // ------------------------------------------------
  // 11. Stats / counters section
  // ------------------------------------------------
  const statsItems = document.querySelectorAll('.stats__item, .trust__stat, .stat-card');
  if (statsItems.length) {
    gsap.fromTo(statsItems,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.12,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: statsItems[0].parentElement,
          start: 'top 80%'
        }
      }
    );
  }

  // ------------------------------------------------
  // 12. Footer entrance
  // ------------------------------------------------
  const footer = document.querySelector('.footer');
  if (footer) {
    const footerItems = footer.querySelectorAll('.footer__brand, .footer__nav, .footer__social');
    if (footerItems.length) {
      gsap.fromTo(footerItems,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.6,
          scrollTrigger: {
            trigger: footer,
            start: 'top 90%'
          }
        }
      );
    }
  }

  // ------------------------------------------------
  // 13. Responsive - matchMedia
  // ------------------------------------------------
  ScrollTrigger.matchMedia({
    '(min-width: 1024px)': function () {
      const heroBg = document.querySelector('.hero__bg, .hero__image');
      if (heroBg) {
        gsap.to(heroBg, {
          y: 100,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          }
        });
      }

      document.querySelectorAll('.section__decor').forEach(decor => {
        gsap.to(decor, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: decor.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
          }
        });
      });

      document.querySelectorAll('.section__badge').forEach(badge => {
        gsap.fromTo(badge,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            scrollTrigger: {
              trigger: badge,
              start: 'top 85%'
            }
          }
        );
      });
    },

    '(max-width: 1023px)': function () {
      document.querySelectorAll('.timeline__node').forEach(node => {
        const nodeContent = node.querySelector('.timeline__content') || node;
        gsap.fromTo(nodeContent,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            scrollTrigger: {
              trigger: node,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
    }
  });

  // ------------------------------------------------
  // 14. Refresh ScrollTrigger on fonts/images loaded
  // ------------------------------------------------
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });

});
