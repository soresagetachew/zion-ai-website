// CallWave Interactive Enhancements

document.addEventListener('DOMContentLoaded', () => {
  // 1. FAQ Accordion Toggle
  const faqButtons = document.querySelectorAll('button[name="Question toggle"]');
  faqButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const faqItem = btn.closest('.framer-DRsa4');
      if (!faqItem) return;

      const isOpen = faqItem.getAttribute('data-framer-name') === 'Open' ||
                     faqItem.classList.contains('framer-v-1h8tquy');

      const answerReveal = faqItem.querySelector('.framer-1bbqin6');
      const icon = btn.querySelector('.framer-1p3t3qu svg');
      const iconWrapper = btn.querySelector('.framer-1p3t3qu');

      if (isOpen) {
        // Close
        faqItem.setAttribute('data-framer-name', 'Closed');
        faqItem.classList.remove('framer-v-1h8tquy');
        faqItem.classList.add('framer-v-qsubnl');
        btn.classList.remove('framer-v-m6bjih');
        btn.classList.add('framer-v-1k0dwp4');
        if (answerReveal) {
          answerReveal.style.opacity = '0';
          answerReveal.style.maxHeight = '0px';
          answerReveal.style.overflow = 'hidden';
          answerReveal.style.transition = 'opacity 200ms ease, max-height 250ms ease';
        }
        if (icon) icon.style.transform = 'none';
        if (iconWrapper) {
          iconWrapper.style.backgroundColor = 'transparent';
          iconWrapper.style.borderColor = 'var(--token-392be854-8b5f-489e-a96f-51d2c06d3419)';
        }
      } else {
        // Open
        faqItem.setAttribute('data-framer-name', 'Open');
        faqItem.classList.remove('framer-v-qsubnl');
        faqItem.classList.add('framer-v-1h8tquy');
        btn.classList.remove('framer-v-1k0dwp4');
        btn.classList.add('framer-v-m6bjih');
        if (answerReveal) {
          answerReveal.style.opacity = '1';
          answerReveal.style.maxHeight = '500px';
          answerReveal.style.overflow = 'visible';
          answerReveal.style.transition = 'opacity 250ms ease, max-height 250ms ease';
        }
        if (icon) icon.style.transform = 'rotate(45deg)';
        if (iconWrapper) {
          iconWrapper.style.backgroundColor = 'var(--token-6a25bc45-8d21-44fd-8a7e-1187e217fe83)';
          iconWrapper.style.borderColor = 'var(--token-6a25bc45-8d21-44fd-8a7e-1187e217fe83)';
        }
      }
    });
  });

  // 2. Call Players Simulation
  let currentlyPlaying = null;

  const playSvg = `<svg width="23.52" height="23.52" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" fill="currentColor"></path></svg>`;
  const pauseSvg = `<svg width="23.52" height="23.52" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"></rect><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"></rect></svg>`;

  const players = document.querySelectorAll('.framer-1ifyrsq-container, .framer-1sa6knb-container');

  players.forEach((player) => {
    const playBtn = player.querySelector('button[title="Play call"], button[aria-label="Play call"]');
    if (!playBtn) return;

    const slider = player.querySelector('[role="slider"]');
    const totalDuration = slider ? parseFloat(slider.getAttribute('aria-valuemax') || '30') : 30;
    let currentTime = 0;
    let isPlaying = false;
    let timerId = null;
    let playbackSpeed = 1.0;

    // Time label & progress bar
    const timeLabels = Array.from(player.querySelectorAll('span')).filter(s => s.textContent.includes('/'));
    const timeLabel = timeLabels[0];
    const progressBar = player.querySelector('div[aria-hidden="true"] > div');
    const speedBtn = player.querySelector('button[aria-label^="Playback speed"]');

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    function updateUI() {
      if (timeLabel) {
        timeLabel.textContent = `${formatTime(currentTime)} / ${formatTime(totalDuration)}`;
      }
      const pct = (currentTime / totalDuration) * 100;
      if (progressBar) {
        progressBar.style.width = `${pct}%`;
      }
      if (slider) {
        slider.setAttribute('aria-valuenow', Math.floor(currentTime).toString());
        slider.setAttribute('aria-valuetext', `${formatTime(currentTime)} of ${formatTime(totalDuration)}`);
      }
    }

    function stop() {
      isPlaying = false;
      clearInterval(timerId);
      timerId = null;
      playBtn.innerHTML = playSvg;
      playBtn.setAttribute('aria-label', 'Play call');
      playBtn.setAttribute('title', 'Play call');
      if (currentlyPlaying === stop) currentlyPlaying = null;
    }

    function start() {
      if (currentlyPlaying && currentlyPlaying !== stop) {
        currentlyPlaying();
      }
      currentlyPlaying = stop;
      isPlaying = true;
      playBtn.innerHTML = pauseSvg;
      playBtn.setAttribute('aria-label', 'Pause call');
      playBtn.setAttribute('title', 'Pause call');

      const intervalMs = 100;
      timerId = setInterval(() => {
        currentTime += (intervalMs / 1000) * playbackSpeed;
        if (currentTime >= totalDuration) {
          currentTime = 0;
          updateUI();
          stop();
        } else {
          updateUI();
        }
      }, intervalMs);
    }

    playBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isPlaying) {
        stop();
      } else {
        start();
      }
    });

    // Slider scrubbing
    if (slider) {
      slider.addEventListener('click', (e) => {
        const rect = slider.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
        currentTime = ratio * totalDuration;
        updateUI();
      });
    }

    // Speed toggle
    if (speedBtn) {
      speedBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (playbackSpeed === 1.0) playbackSpeed = 1.5;
        else if (playbackSpeed === 1.5) playbackSpeed = 2.0;
        else playbackSpeed = 1.0;

        speedBtn.textContent = `${playbackSpeed}×`;
        speedBtn.setAttribute('aria-label', `Playback speed ${playbackSpeed}×`);
      });
    }
  });

  // 3. Brand Logo Ticker continuous animation
  const tickerContainer = document.querySelector('.framer-t0kthc');
  if (tickerContainer) {
    const tickerUl = tickerContainer.querySelector('ul');
    if (tickerUl) {
      // Clone children for seamless looping
      const clone = tickerUl.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      tickerContainer.style.overflow = 'hidden';
      tickerContainer.style.display = 'flex';
      tickerContainer.style.width = '100%';

      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.width = 'fit-content';
      wrapper.style.animation = 'tickerAnim 28s linear infinite';
      wrapper.style.willChange = 'transform';

      tickerUl.parentNode.insertBefore(wrapper, tickerUl);
      wrapper.appendChild(tickerUl);
      wrapper.appendChild(clone);

      const style = document.createElement('style');
      style.textContent = `
        @keyframes tickerAnim {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .framer-t0kthc:hover div {
          animation-play-state: paused !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 4. Smooth Anchor Scrolling for nav links
  document.querySelectorAll('a[href^="#"], a[href="/#"], a[href="/book-a-demo"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '/book-a-demo' || href === '#book-a-demo') {
        e.preventDefault();
        const contactSection = document.querySelector('section[data-framer-name="Closing invitation"]') ||
                               document.querySelector('section[data-framer-name="FAQ"]');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (href && href.startsWith('#') && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // 5. Sticky header enhancement
  const navbar = document.querySelector('.framer-1tcgtph-container');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.style.boxShadow = '0 10px 30px -10px rgba(0, 0, 0, 0.05)';
        navbar.style.transition = 'box-shadow 200ms ease';
      } else {
        navbar.style.boxShadow = 'none';
      }
    });
  }
});
