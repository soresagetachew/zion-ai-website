// Zion AI - Interactive Enhancements & Audio Simulation

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

  // 2. Sound generation using Web Audio API for interactive audio playback
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = 'sine', gainVal = 0.04) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // 3. Call Players Simulation
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
    const transcriptItems = player.querySelectorAll('[role="log"] > div, [aria-live="polite"] > div');

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

      // Highlight active speaker transcript row
      if (transcriptItems.length > 1) {
        const midPoint = totalDuration / 2;
        if (currentTime < midPoint) {
          transcriptItems[0].style.opacity = '1';
          transcriptItems[0].style.transform = 'scale(1.01)';
          transcriptItems[0].style.transition = 'all 200ms ease';
          if (transcriptItems[1]) {
            transcriptItems[1].style.opacity = '0.45';
            transcriptItems[1].style.transform = 'none';
          }
        } else {
          transcriptItems[0].style.opacity = '0.45';
          transcriptItems[0].style.transform = 'none';
          if (transcriptItems[1]) {
            transcriptItems[1].style.opacity = '1';
            transcriptItems[1].style.transform = 'scale(1.01)';
            transcriptItems[1].style.transition = 'all 200ms ease';
          }
        }
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
      if (window.speechSynthesis) window.speechSynthesis.cancel();
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

      // Play soft initial telephone chime
      playTone(440, 0.15, 'sine', 0.05);
      setTimeout(() => playTone(880, 0.25, 'sine', 0.04), 160);

      // Attempt speech synthesis for transcript dialogue if available
      try {
        if ('speechSynthesis' in window && transcriptItems.length > 0) {
          window.speechSynthesis.cancel();
          const firstSpeakerText = transcriptItems[0].innerText || transcriptItems[0].textContent;
          if (firstSpeakerText) {
            const utter = new SpeechSynthesisUtterance(firstSpeakerText.replace(/Zion AI|CallWave/gi, 'Zion AI'));
            utter.rate = 0.95 * playbackSpeed;
            window.speechSynthesis.speak(utter);
          }
        }
      } catch (e) {}

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
        playTone(520, 0.08, 'triangle', 0.03);
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
        playTone(660, 0.06, 'sine', 0.03);
      });
    }
  });

  // 4. Brand Logo Ticker continuous animation
  const tickerContainer = document.querySelector('.framer-t0kthc');
  if (tickerContainer) {
    const tickerUl = tickerContainer.querySelector('ul');
    if (tickerUl) {
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
        .framer-pricing-section a:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 5. Booking Modal for Ethiopian Businesses
  function createDemoModal() {
    const modalId = 'zion-demo-modal';
    if (document.getElementById(modalId)) return;

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(21, 62, 53, 0.65);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      z-index: 10000; display: none; align-items: center; justify-content: center;
      padding: 20px; box-sizing: border-box;
    `;

    modal.innerHTML = `
      <div style="background: #faf8f1; border-radius: 28px; border: 1px solid #b5c3b4; padding: 40px; max-width: 520px; width: 100%; box-shadow: 0 24px 64px rgba(0,0,0,0.2); position: relative; font-family: 'Manrope', sans-serif;">
        <button id="close-modal-btn" style="position: absolute; top: 20px; right: 20px; background: transparent; border: none; font-size: 24px; cursor: pointer; color: #153e35; line-height: 1;">&times;</button>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <img src="assets/images/zion-ai-logo.png" alt="Zion AI" style="height: 32px; width: auto; border-radius: 4px;">
        </div>
        <h3 style="font-family: 'Instrument Serif', serif; font-size: 32px; margin: 0 0 8px 0; color: #153e35;">Book a Demo in Addis Ababa</h3>
        <p style="font-size: 14px; color: #587064; margin: 0 0 16px 0; line-height: 1.5;">
          Experience Zion AI on your actual business phone line. We will configure a live Amharic & English test number for your clinic or company in 15 minutes.
        </p>
        <div style="background: rgba(21, 62, 53, 0.06); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
          <span style="color: #587064; font-weight: 600;">Direct Phone Line:</span>
          <a href="tel:+251994575145" style="color: #153e35; font-weight: 800; text-decoration: none; font-size: 15px; letter-spacing: 0.02em;">+251994575145</a>
        </div>
        <form id="demo-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #153e35; margin-bottom: 6px; text-transform: uppercase;">Company / Clinic Name</label>
            <input type="text" required placeholder="e.g. Lucy Clinic, Sheba Logistics" style="width: 100%; box-sizing: border-box; padding: 12px 16px; border-radius: 12px; border: 1px solid #b5c3b4; background: #fff; font-family: inherit; font-size: 14px; color: #153e35;">
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #153e35; margin-bottom: 6px; text-transform: uppercase;">Ethiopian Phone Number</label>
            <input type="tel" required placeholder="+251 9... / 09..." style="width: 100%; box-sizing: border-box; padding: 12px 16px; border-radius: 12px; border: 1px solid #b5c3b4; background: #fff; font-family: inherit; font-size: 14px; color: #153e35;">
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #153e35; margin-bottom: 6px; text-transform: uppercase;">Preferred Language(s)</label>
            <select style="width: 100%; box-sizing: border-box; padding: 12px 16px; border-radius: 12px; border: 1px solid #b5c3b4; background: #fff; font-family: inherit; font-size: 14px; color: #153e35;">
              <option>Amharic & English</option>
              <option>Amharic, Afaan Oromoo & English</option>
              <option>Amharic only</option>
              <option>English only</option>
            </select>
          </div>
          <button type="submit" style="margin-top: 8px; padding: 16px; border-radius: 999px; background: #153e35; color: #dfff8b; border: none; font-family: inherit; font-weight: 800; font-size: 16px; cursor: pointer; transition: transform 160ms ease;">
            Schedule Free Pilot in ETB
          </button>
        </form>
        <div id="demo-success" style="display: none; text-align: center; padding: 24px 0;">
          <div style="font-size: 40px; margin-bottom: 12px;">✅</div>
          <h4 style="font-family: 'Instrument Serif', serif; font-size: 28px; margin: 0 0 8px 0; color: #153e35;">Your Demo Is Booked!</h4>
          <p style="font-size: 14px; color: #587064; margin: 0 0 10px 0;">Our Addis Ababa team will call your number within 2 hours with your custom test line.</p>
          <p style="font-size: 13px; color: #153e35; margin: 0;">Or call us directly anytime: <a href="tel:+251994575145" style="color: #153e35; font-weight: 800; text-decoration: underline;">+251994575145</a></p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#close-modal-btn');
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    const form = modal.querySelector('#demo-form');
    const successDiv = modal.querySelector('#demo-success');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.style.display = 'none';
      successDiv.style.display = 'block';
      playTone(880, 0.3, 'sine', 0.05);
      setTimeout(() => {
        modal.style.display = 'none';
        form.reset();
        form.style.display = 'flex';
        successDiv.style.display = 'none';
      }, 4000);
    });
  }

  createDemoModal();

  // 6. Smooth Anchor Scrolling & Modal Trigger
  document.querySelectorAll('a[href^="#"], a[href="/#"], a[href="/book-a-demo"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '/book-a-demo' || href === '#book-a-demo') {
        e.preventDefault();
        const modal = document.getElementById('zion-demo-modal');
        if (modal) {
          modal.style.display = 'flex';
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

  // 7. Sticky header shadow enhancement
  const navbar = document.querySelector('.framer-1tcgtph-container');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.style.boxShadow = '0 10px 30px -10px rgba(21, 62, 53, 0.08)';
        navbar.style.transition = 'box-shadow 200ms ease';
      } else {
        navbar.style.boxShadow = 'none';
      }
    });
  }
});
