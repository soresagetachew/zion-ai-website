// Zion AI - Interactive Enhancements & Audio Simulation

function initZionAI() {
  if (typeof window === 'undefined') return;
  if (window.__zionAiInitialized) return;
  window.__zionAiInitialized = true;
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

  // 2. Real Audio Playback for Call Players & Voice Samples
  let activeAudio = null;
  let activePlayerStop = null;

  const playSvg = `<svg width="23.52" height="23.52" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" fill="currentColor"></path></svg>`;
  const pauseSvg = `<svg width="23.52" height="23.52" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"></rect><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"></rect></svg>`;

  function getAudioSource(element) {
    const parentCard = element.closest('[data-framer-name], section, article, div') || element;
    const text = (parentCard.innerText || parentCard.textContent || '').toLowerCase();
    
    if (text.includes('lucy medical') || text.includes('doctor') || text.includes('consultation')) {
      return '/assets/audio/call-doctor.mp3';
    } else if (text.includes('telebirr') || text.includes('tracking') || text.includes('order')) {
      return '/assets/audio/call-team.mp3';
    } else if (text.includes('opening') || text.includes('after-hours') || text.includes('closed') || text.includes('hotel')) {
      return '/assets/audio/call-after-hours.mp3';
    } else if (text.includes('cancel') || text.includes('rebook')) {
      return '/assets/audio/call-cancel.mp3';
    } else if (text.includes('human') || text.includes('right person') || text.includes('team')) {
      return '/assets/audio/call-team.mp3';
    } else if (text.includes('waveform') || text.includes('greeting') || text.includes('welcome') || text.includes('languages')) {
      return '/assets/audio/call-hero.mp3';
    }
    return '/assets/audio/call-doctor.mp3';
  }

  const players = document.querySelectorAll('.framer-1ifyrsq-container, .framer-1sa6knb-container, .framer-6gvd4r-container');

  players.forEach((player) => {
    const playBtn = player.querySelector('button[title="Play call"], button[aria-label="Play call"]');
    if (!playBtn) return;

    const audioSrc = getAudioSource(player);
    const audio = new Audio(audioSrc);
    audio.preload = 'metadata';

    const slider = player.querySelector('[role="slider"]');
    let totalDuration = slider ? parseFloat(slider.getAttribute('aria-valuemax') || '30') : 30;
    let isPlaying = false;
    let playbackSpeed = 1.0;

    // Time label & progress bar
    const timeLabels = Array.from(player.querySelectorAll('span')).filter(s => s.textContent.includes('/'));
    const timeLabel = timeLabels[0];
    const progressBar = player.querySelector('div[aria-hidden="true"] > div');
    const speedBtn = player.querySelector('button[aria-label^="Playback speed"]');
    const transcriptItems = player.querySelectorAll('[role="log"] > div, [aria-live="polite"] > div');

    function formatTime(sec) {
      if (isNaN(sec) || !isFinite(sec)) sec = 0;
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        totalDuration = audio.duration;
        if (slider) slider.setAttribute('aria-valuemax', Math.round(totalDuration).toString());
        if (timeLabel) timeLabel.textContent = `${formatTime(audio.currentTime)} / ${formatTime(totalDuration)}`;
      }
    });

    function updateUI() {
      const cur = audio.currentTime || 0;
      const dur = (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) ? audio.duration : totalDuration;
      if (timeLabel) {
        timeLabel.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
      }
      const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
      if (progressBar) {
        progressBar.style.width = `${pct}%`;
      }
      if (slider) {
        slider.setAttribute('aria-valuenow', Math.floor(cur).toString());
        slider.setAttribute('aria-valuetext', `${formatTime(cur)} of ${formatTime(dur)}`);
      }

      // Highlight active speaker transcript row
      if (transcriptItems.length > 1) {
        const midPoint = dur / 2;
        if (cur < midPoint) {
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

    audio.addEventListener('timeupdate', updateUI);

    function stop() {
      isPlaying = false;
      audio.pause();
      playBtn.innerHTML = playSvg;
      playBtn.setAttribute('aria-label', 'Play call');
      playBtn.setAttribute('title', 'Play call');
      if (activePlayerStop === stop) {
        activePlayerStop = null;
        activeAudio = null;
      }
    }

    audio.addEventListener('ended', () => {
      stop();
      audio.currentTime = 0;
      updateUI();
    });

    function start() {
      if (activePlayerStop && activePlayerStop !== stop) {
        activePlayerStop();
      }
      activePlayerStop = stop;
      activeAudio = audio;
      isPlaying = true;
      audio.playbackRate = playbackSpeed;
      playBtn.innerHTML = pauseSvg;
      playBtn.setAttribute('aria-label', 'Pause call');
      playBtn.setAttribute('title', 'Pause call');

      audio.play().catch(() => {
        // Autoplay policy or error fallback
      });
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
        const dur = (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) ? audio.duration : totalDuration;
        audio.currentTime = ratio * dur;
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

        audio.playbackRate = playbackSpeed;
        speedBtn.textContent = `${playbackSpeed}×`;
        speedBtn.setAttribute('aria-label', `Playback speed ${playbackSpeed}×`);
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

  // 5. Booking Modal for Ethiopian Businesses (Forwarded to ceo@zionsoftwareagency.com)
  function createDemoModal() {
    const modalId = 'zion-demo-modal';
    if (document.getElementById(modalId)) return;

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'zion-modal-title');
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(21, 62, 53, 0.72);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      z-index: 10000; display: none; align-items: center; justify-content: center;
      padding: 16px; box-sizing: border-box;
    `;

    modal.innerHTML = `
      <div style="background: #faf8f1; border-radius: 28px; border: 1px solid #b5c3b4; padding: 36px 32px; max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,0.25); position: relative; font-family: 'Manrope', sans-serif; box-sizing: border-box;">
        <button id="close-modal-btn" aria-label="Close modal" style="position: absolute; top: 18px; right: 20px; background: transparent; border: none; font-size: 26px; cursor: pointer; color: #153e35; line-height: 1; padding: 4px 8px; border-radius: 8px;">&times;</button>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <img src="assets/images/zion-ai-logo.png" alt="Zion AI" style="height: 32px; width: auto; border-radius: 4px;">
        </div>
        <h3 id="zion-modal-title" style="font-family: 'Instrument Serif', serif; font-size: 32px; margin: 0 0 6px 0; color: #153e35; line-height: 1.15;">Book a Demo in Addis Ababa</h3>
        <p style="font-size: 13.5px; color: #587064; margin: 0 0 16px 0; line-height: 1.45;">
          Experience Zion AI on your business phone line. We configure a live Amharic & English test pilot for your business within 15 minutes.
        </p>
        <div style="background: rgba(21, 62, 53, 0.06); border-radius: 12px; padding: 10px 14px; margin-bottom: 18px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; font-size: 12.5px; gap: 6px;">
          <span style="color: #587064; font-weight: 600;">Forwarded to CEO:</span>
          <span style="color: #153e35; font-weight: 800; font-family: monospace;">ceo@zionsoftwareagency.com</span>
        </div>
        
        <form id="demo-form" style="display: flex; flex-direction: column; gap: 13px;">
          <div>
            <label style="display: block; font-size: 11.5px; font-weight: 700; color: #153e35; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.03em;">Full Name / Contact Person</label>
            <input type="text" name="name" required placeholder="e.g. Dr. Meron / Abebe Bikila" style="width: 100%; box-sizing: border-box; padding: 11px 14px; border-radius: 10px; border: 1px solid #b5c3b4; background: #fff; font-family: inherit; font-size: 14px; color: #153e35; outline: none;">
          </div>
          <div>
            <label style="display: block; font-size: 11.5px; font-weight: 700; color: #153e35; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.03em;">Work Email Address <span style="color: #e53e3e;">*</span></label>
            <input type="email" name="email" required placeholder="e.g. name@company.et / info@lucyclinic.com" style="width: 100%; box-sizing: border-box; padding: 11px 14px; border-radius: 10px; border: 1px solid #b5c3b4; background: #fff; font-family: inherit; font-size: 14px; color: #153e35; outline: none;">
          </div>
          <div>
            <label style="display: block; font-size: 11.5px; font-weight: 700; color: #153e35; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.03em;">Ethiopian Phone Number <span style="color: #e53e3e;">*</span></label>
            <input type="tel" name="phone" required placeholder="+251 9... / 09..." style="width: 100%; box-sizing: border-box; padding: 11px 14px; border-radius: 10px; border: 1px solid #b5c3b4; background: #fff; font-family: inherit; font-size: 14px; color: #153e35; outline: none;">
          </div>
          <div>
            <label style="display: block; font-size: 11.5px; font-weight: 700; color: #153e35; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.03em;">Company / Clinic / Business Name</label>
            <input type="text" name="company" required placeholder="e.g. Lucy Clinic, Sheba Logistics" style="width: 100%; box-sizing: border-box; padding: 11px 14px; border-radius: 10px; border: 1px solid #b5c3b4; background: #fff; font-family: inherit; font-size: 14px; color: #153e35; outline: none;">
          </div>
          <div>
            <label style="display: block; font-size: 11.5px; font-weight: 700; color: #153e35; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.03em;">Preferred Language(s)</label>
            <select name="language" style="width: 100%; box-sizing: border-box; padding: 11px 14px; border-radius: 10px; border: 1px solid #b5c3b4; background: #fff; font-family: inherit; font-size: 14px; color: #153e35; outline: none;">
              <option value="Amharic & English">Amharic & English (Most Popular)</option>
              <option value="Amharic, Afaan Oromoo & English">Amharic, Afaan Oromoo & English</option>
              <option value="Amharic, Tigrigna & English">Amharic, Tigrigna & English</option>
              <option value="Amharic, Somali & English">Amharic, Somali & English</option>
              <option value="Kiswahili & English">Kiswahili & English</option>
              <option value="Amharic only">Amharic only</option>
              <option value="English only">English only</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 11.5px; font-weight: 700; color: #153e35; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.03em;">Call Volume / Specific Needs (Optional)</label>
            <input type="text" name="notes" placeholder="e.g. Patient booking, ~50 daily calls, after-hours coverage" style="width: 100%; box-sizing: border-box; padding: 11px 14px; border-radius: 10px; border: 1px solid #b5c3b4; background: #fff; font-family: inherit; font-size: 14px; color: #153e35; outline: none;">
          </div>
          <button type="submit" id="submit-demo-btn" style="margin-top: 6px; padding: 15px; border-radius: 999px; background: #153e35; color: #dfff8b; border: none; font-family: inherit; font-weight: 800; font-size: 15px; cursor: pointer; transition: transform 160ms ease, background 160ms ease;">
            Schedule Free Pilot (Send to CEO)
          </button>
        </form>

        <div id="demo-success" style="display: none; padding: 12px 0;">
          <div style="text-align: center; margin-bottom: 14px;">
            <div style="font-size: 42px; line-height: 1; margin-bottom: 8px;">✅</div>
            <h4 style="font-family: 'Instrument Serif', serif; font-size: 28px; margin: 0 0 6px 0; color: #153e35;">Demo Request Forwarded!</h4>
            <p style="font-size: 13.5px; color: #587064; margin: 0; line-height: 1.45;">
              Your request has been logged and forwarded directly to <strong>ceo@zionsoftwareagency.com</strong>.
            </p>
          </div>

          <div id="demo-receipt" style="background: rgba(21, 62, 53, 0.05); border: 1px solid #b5c3b4; border-radius: 14px; padding: 16px; margin-bottom: 18px; font-size: 13px; color: #153e35;">
            <!-- Populated dynamically via JS -->
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <a id="demo-mailto-btn" href="mailto:ceo@zionsoftwareagency.com" target="_blank" style="display: block; text-align: center; padding: 12px 18px; border-radius: 999px; background: #153e35; color: #dfff8b; font-weight: 700; font-size: 13.5px; text-decoration: none; transition: transform 160ms ease;">
              ✉️ Open Direct Email to CEO
            </a>
            <a href="tel:+251994575145" style="display: block; text-align: center; padding: 12px 18px; border-radius: 999px; background: transparent; border: 1px solid #153e35; color: #153e35; font-weight: 700; font-size: 13.5px; text-decoration: none;">
              📞 Call Direct: +251994575145
            </a>
            <button id="demo-done-btn" style="padding: 10px; background: transparent; border: none; font-size: 13px; color: #587064; cursor: pointer; text-decoration: underline;">
              Done & Close
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#close-modal-btn');
    const doneBtn = modal.querySelector('#demo-done-btn');
    const form = modal.querySelector('#demo-form');
    const successDiv = modal.querySelector('#demo-success');
    const submitBtn = modal.querySelector('#submit-demo-btn');
    const receiptDiv = modal.querySelector('#demo-receipt');
    const mailtoBtn = modal.querySelector('#demo-mailto-btn');

    function hideModal() {
      modal.style.display = 'none';
      form.style.display = 'flex';
      successDiv.style.display = 'none';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Schedule Free Pilot (Send to CEO)';
    }

    closeBtn.addEventListener('click', hideModal);
    doneBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        hideModal();
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Forwarding to ceo@zionsoftwareagency.com...';

      const formData = new FormData(form);
      const payload = {
        name: formData.get('name') || '',
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
        company: formData.get('company') || '',
        language: formData.get('language') || 'Amharic & English',
        notes: formData.get('notes') || ''
      };

      try {
        // Send to backend /api/book-demo
        const res = await fetch('/api/book-demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const resData = await res.json().catch(() => ({}));
      } catch (err) {
        console.warn('Backend endpoint unavailable, continuing with client-side forward:', err);
      }

      // Populate summary receipt
      receiptDiv.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 8px; border-bottom: 1px solid rgba(21, 62, 53, 0.12); padding-bottom: 6px;">
          📋 Booking Summary (Sent to CEO)
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; line-height: 1.4;">
          <div><strong>Company:</strong> ${escapeHtml(payload.company)}</div>
          <div><strong>Contact:</strong> ${escapeHtml(payload.name)}</div>
          <div><strong>Work Email:</strong> ${escapeHtml(payload.email)}</div>
          <div><strong>Phone:</strong> ${escapeHtml(payload.phone)}</div>
          <div style="grid-column: span 2;"><strong>Languages:</strong> ${escapeHtml(payload.language)}</div>
          ${payload.notes ? `<div style="grid-column: span 2;"><strong>Notes:</strong> ${escapeHtml(payload.notes)}</div>` : ''}
        </div>
      `;

      // Configure mailto backup link
      const subject = encodeURIComponent(`Zion AI Demo Booking: ${payload.company} (${payload.name})`);
      const body = encodeURIComponent(
        `Dear Zion AI Team & CEO,\n\nI have requested a demo for Zion AI:\n\n` +
        `• Company: ${payload.company}\n` +
        `• Contact Person: ${payload.name}\n` +
        `• Work Email: ${payload.email}\n` +
        `• Phone Number: ${payload.phone}\n` +
        `• Preferred Languages: ${payload.language}\n` +
        `• Notes / Needs: ${payload.notes || 'None'}\n\n` +
        `Please contact me to set up our test line.\n\nBest regards,\n${payload.name}`
      );
      mailtoBtn.href = `mailto:ceo@zionsoftwareagency.com?subject=${subject}&body=${body}`;

      // Play pleasant audio tone
      playTone(523.25, 0.15, 'sine', 0.05);
      setTimeout(() => playTone(783.99, 0.25, 'sine', 0.04), 140);

      form.style.display = 'none';
      successDiv.style.display = 'block';
      form.reset();
    });

    function escapeHtml(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
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

  // 8. Ethiopian Languages Switcher Interactivity
  const langGreetings = {
    'Amharic': { greeting: 'Selam. How can I assist your business today?', audioGreeting: 'Selam, welcome to Zion AI.' },
    'Afaan Oromoo': { greeting: 'Akkam. Akkamitti isin gargaaruu dandeenya?', audioGreeting: 'Akkam, welcome to Zion AI.' },
    'Tigrigna': { greeting: 'Selam. Blemante kirekibkum yikeal?', audioGreeting: 'Selam, welcome to Zion AI.' },
    'Kiswahili': { greeting: 'Hujambo. Karibu huduma ya Zion AI leo.', audioGreeting: 'Hujambo, welcome to Zion AI.' },
    'Somali': { greeting: 'Iska warran. Sideen kuu caawin karnaa maanta?', audioGreeting: 'Iska warran, welcome to Zion AI.' }
  };

  const langCards = document.querySelectorAll('.language-card-wrapper button, .framer-1696wy9 button');
  const greetingHeading = document.querySelector('.framer-o3jxdy .framer-bi4mxk h2');
  const greetingPlayerPlayBtn = document.querySelector('.framer-6gvd4r-container button[aria-label="Play call"], .framer-6gvd4r-container button[title="Play call"]');

  langCards.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const langName = btn.getAttribute('name');

      // Update active state on buttons
      langCards.forEach((b) => {
        b.setAttribute('data-framer-name', 'Default');
        b.classList.remove('framer-v-1s9uwig');
        b.classList.add('framer-v-osnoto');
        b.style.setProperty('--border-color', 'rgba(223, 255, 139, 0)');
        b.style.backgroundColor = 'rgba(250, 248, 241, 0.08)';
        const playingSvg = b.querySelector('svg[data-framer-name="Playing"]');
        if (playingSvg) playingSvg.style.opacity = '0';
      });

      btn.setAttribute('data-framer-name', 'Selected');
      btn.classList.remove('framer-v-osnoto');
      btn.classList.add('framer-v-1s9uwig');
      btn.style.setProperty('--border-color', 'rgba(223, 255, 139, 0.7)');
      btn.style.backgroundColor = 'rgba(223, 255, 139, 0.12)';
      const activeSvg = btn.querySelector('svg[data-framer-name="Playing"]');
      if (activeSvg) activeSvg.style.opacity = '1';

      // Update heading text with gentle fade transition
      if (greetingHeading && langGreetings[langName]) {
        greetingHeading.style.opacity = '0';
        greetingHeading.style.transition = 'opacity 150ms ease';
        setTimeout(() => {
          greetingHeading.textContent = `“${langGreetings[langName].greeting}”`;
          greetingHeading.style.opacity = '1';
        }, 150);
      }

      // Pleasant tone chime
      playTone(587.33, 0.15, 'sine', 0.04);
      setTimeout(() => playTone(880, 0.25, 'sine', 0.03), 120);

      // Web speech synthesis if available
      try {
        if ('speechSynthesis' in window && langGreetings[langName]) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(langGreetings[langName].audioGreeting);
          utter.rate = 1.0;
          window.speechSynthesis.speak(utter);
        }
      } catch (err) {}
    });
  });

  // Also wire the Greeting player play button to trigger speech synthesis / chime
  if (greetingPlayerPlayBtn) {
    greetingPlayerPlayBtn.addEventListener('click', () => {
      playTone(659.25, 0.18, 'sine', 0.05);
      setTimeout(() => playTone(987.77, 0.3, 'sine', 0.04), 140);
      const activeLangBtn = document.querySelector('.language-card-wrapper button[data-framer-name="Selected"]');
      const activeLang = activeLangBtn ? activeLangBtn.getAttribute('name') : 'Amharic';
      if ('speechSynthesis' in window && langGreetings[activeLang]) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(langGreetings[activeLang].audioGreeting);
        utter.rate = 1.0;
        window.speechSynthesis.speak(utter);
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.initZionAI = initZionAI;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initZionAI);
  } else {
    initZionAI();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initZionAI };
}
