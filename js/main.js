// Main initialization file
document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile menu toggle
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.nav__mobile');
  const body = document.body;

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('nav__hamburger--open');
      mobileMenu.classList.toggle('nav__mobile--open');
      body.classList.toggle('no-scroll');
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('nav__hamburger--open');
        mobileMenu.classList.remove('nav__mobile--open');
        body.classList.remove('no-scroll');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (
        mobileMenu.classList.contains('nav__mobile--open') &&
        !mobileMenu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        hamburger.classList.remove('nav__hamburger--open');
        mobileMenu.classList.remove('nav__mobile--open');
        body.classList.remove('no-scroll');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('nav__mobile--open')) {
        hamburger.classList.remove('nav__hamburger--open');
        mobileMenu.classList.remove('nav__mobile--open');
        body.classList.remove('no-scroll');
      }
    });
  }

  // 2. Navbar scroll effect
  const nav = document.querySelector('.nav');
  if (nav) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 50) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // 3. Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const navHeight = document.querySelector('.nav')?.offsetHeight || 72;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  // 4. Active nav link highlighting on scroll
  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  if (sections.length && navLinks.length) {
    const observerOptions = {
      rootMargin: '-20% 0px -80% 0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle(
              'nav__link--active',
              link.getAttribute('href') === '#' + entry.target.id
            );
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));
  }

  // 5. Current year in footer
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
