/* ============================================
   VERTIGO VR Arena — Reviews Carousel
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.reviews__track');
  const prevBtn = document.querySelector('.reviews__arrow--prev');
  const nextBtn = document.querySelector('.reviews__arrow--next');
  const dots = document.querySelectorAll('.reviews__dot');

  if (!track) return;

  const cards = track.querySelectorAll('.review-card');
  if (!cards.length) return;

  const GAP = 24; // matches CSS gap

  // Get width of one card + gap for scrolling step
  const getScrollStep = () => cards[0].offsetWidth + GAP;

  // Find which card is closest to center of the track viewport
  const getActiveIndex = () => {
    const trackRect = track.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;
    let closestIdx = 0;
    let closestDist = Infinity;

    cards.forEach((card, i) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const dist = Math.abs(cardCenter - trackCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });

    return closestIdx;
  };

  // Update active dot
  const updateDots = (activeIdx) => {
    dots.forEach((dot, i) => {
      dot.classList.toggle('reviews__dot--active', i === activeIdx);
    });
  };

  // Track scroll position to update dots (debounced)
  let scrollTimeout;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      updateDots(getActiveIndex());
    }, 100);
  }, { passive: true });

  // Prev button
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    });
  }

  // Next button
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    });
  }

  // Dot click — scroll to center that card
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (!cards[i]) return;
      const trackWidth = track.offsetWidth;
      const cardWidth = cards[i].offsetWidth;
      const scrollTarget = cards[i].offsetLeft - (trackWidth / 2) + (cardWidth / 2);
      track.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    });
  });

  // Initialize
  updateDots(0);
});
