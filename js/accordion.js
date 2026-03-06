document.addEventListener('DOMContentLoaded', () => {
  const faqItems = document.querySelectorAll('.faq__item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq__question');
    const answer = item.querySelector('.faq__answer');

    if (!question || !answer) return;

    // Ensure initial state - closed items have maxHeight 0
    if (!item.classList.contains('faq__item--open')) {
      answer.style.maxHeight = '0';
      answer.style.overflow = 'hidden';
      answer.style.transition = 'max-height 0.35s ease';
    } else {
      // If an item starts open, set its maxHeight
      answer.style.overflow = 'hidden';
      answer.style.transition = 'max-height 0.35s ease';
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }

    question.addEventListener('click', (e) => {
      // Prevent native <details> toggle - we handle it manually
      if (item.tagName === 'DETAILS') {
        e.preventDefault();
      }
      const isOpen = item.classList.contains('faq__item--open') || item.open;

      // Close all other items (accordion behavior)
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('faq__item--open')) {
          otherItem.classList.remove('faq__item--open');
          if (otherItem.tagName === 'DETAILS') otherItem.open = false;
          const otherAnswer = otherItem.querySelector('.faq__answer');
          if (otherAnswer) {
            otherAnswer.style.maxHeight = '0';
          }

          // Update aria-expanded on the other question
          const otherQuestion = otherItem.querySelector('.faq__question');
          if (otherQuestion) {
            otherQuestion.setAttribute('aria-expanded', 'false');
          }
        }
      });

      // Toggle current item
      if (isOpen) {
        item.classList.remove('faq__item--open');
        if (item.tagName === 'DETAILS') item.open = false;
        answer.style.maxHeight = '0';
        question.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('faq__item--open');
        if (item.tagName === 'DETAILS') item.open = true;
        answer.style.maxHeight = answer.scrollHeight + 'px';
        question.setAttribute('aria-expanded', 'true');
      }
    });

    // Keyboard accessibility
    question.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
      }
    });

    // Ensure the question is focusable
    if (!question.hasAttribute('tabindex')) {
      question.setAttribute('tabindex', '0');
    }

    // Set role and aria attributes for accessibility
    if (!question.hasAttribute('role')) {
      question.setAttribute('role', 'button');
    }
    const isCurrentlyOpen = item.classList.contains('faq__item--open');
    question.setAttribute('aria-expanded', isCurrentlyOpen ? 'true' : 'false');
  });

  // Handle dynamic content changes that may alter scrollHeight
  // Recalculate maxHeight for open items on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      faqItems.forEach(item => {
        if (item.classList.contains('faq__item--open')) {
          const answer = item.querySelector('.faq__answer');
          if (answer) {
            answer.style.maxHeight = answer.scrollHeight + 'px';
          }
        }
      });
    }, 150);
  }, { passive: true });
});
