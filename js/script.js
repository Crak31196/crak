/* =====================================================================
   ANSH NAME REVEAL — script.js
   Vanilla JS, zero dependencies. Mobile-first. GitHub Pages ready.
   ===================================================================== */

'use strict';

/* ─────────────────────────────────────────────
   RIDDLE DATA
───────────────────────────────────────────── */
const RIDDLES = [
  {
    index:    0,
    text:     "A son is unhappy with his parents' marriage.\n\nSo he does something impossible… ⏰\n\nHe travels back in time to change their love story! ❤️😂\n\n🎬 Guess the movie!",
    movie:    'ACTION REPLAYY',
    letter:   'A',
    dialogue: '"Awaaz neeche!"',
    audio:    'assets/audio/action-replayy.mp3',
  },
  {
    index:    1,
    text:     "One ordinary man. 👨\n\nOne crazy challenge…\n\nRun the entire state for just ONE day! 🏛️\n\nWhat happens when a common man suddenly gets the power to change everything?\n\n🎬 Guess the movie!",
    movie:    'NAYAK',
    letter:   'N',
    dialogue: '"Ek din ka CM!"',
    audio:    'assets/audio/nayak.mp3',
  },
  {
    index:    2,
    text:     "One honest police officer. 👮‍♂️\n\nOne powerful criminal. 😈\n\nAnd one man who refuses to bow down to anyone.\n\nWhen corruption crosses the line…\n\nthe lion finally roars! 🦁🔥\n\n🎬 Guess the movie!",
    movie:    'SINGHAM',
    letter:   'S',
    dialogue: '"Aata maajhi satakli!"',
    audio:    'assets/audio/singham.mp3',
  },
  {
    index:    3,
    text:     "Three bachelors. 👨‍👨‍👦\n\nOne tiny baby. 👶\n\nAnd absolutely zero experience with babies! 😂\n\nTheir carefree bachelor life suddenly becomes feeding, crying, diapers and sleepless nights!\n\n🎬 Guess the movie!",
    movie:    'HEYY BABYY',
    letter:   'H',
    dialogue: '"Baby ko sambhalo!"',
    audio:    'assets/audio/heyy-babyy.mp3',
  },
];

/* ─────────────────────────────────────────────
   CLIMAX BEATS
   Each beat: { html, tapToAdvance, autoMs }
   autoMs: if set, auto-advances after this many ms
───────────────────────────────────────────── */
const CLIMAX_BEATS = [
  /* 0 — dramatic opening line */
  {
    tapToAdvance: true,
    autoMs: null,
    html: () => `
      <div class="beat beat--center">
        <p class="beat-quote">"Picture abhi baaki hai mere dost!"</p>
        <p class="beat-subtext" style="margin-top:1rem">😎🎬</p>
      </div>`,
  },
  /* 1 — four films, four clues */
  {
    tapToAdvance: true,
    autoMs: null,
    html: () => `
      <div class="beat beat--stagger">
        <p class="beat-line" style="--delay:0.0s">Four films…</p>
        <p class="beat-line" style="--delay:0.45s">Four clues…</p>
        <p class="beat-line beat-line--accent" style="--delay:0.9s">And one little twist! 🌀</p>
      </div>`,
  },
  /* 2 — don't look */
  {
    tapToAdvance: true,
    autoMs: null,
    html: () => `
      <div class="beat beat--stagger">
        <p class="beat-line beat-line--small" style="--delay:0.0s">Don't look at the heroes.</p>
        <p class="beat-line beat-line--small" style="--delay:0.45s">Don't look at the dialogues.</p>
        <p class="beat-line beat-line--small" style="--delay:0.9s">Don't look at the stories.</p>
      </div>`,
  },
  /* 3 — look at film names */
  {
    tapToAdvance: true,
    autoMs: null,
    html: () => `
      <div class="beat beat--center">
        <p class="beat-line beat-line--accent" style="--delay:0.0s; font-size:clamp(1.4rem,6vw,2.2rem)">
          Look at the <strong>FILM NAMES.</strong>
        </p>
        <p class="beat-line" style="--delay:0.7s; margin-top:0.5rem">
          Take the <strong>FIRST LETTER</strong> of each movie.
        </p>
      </div>`,
  },
  /* 4 — letter-by-letter reveal (automatic) */
  {
    tapToAdvance: false,
    autoMs: 4400,
    html: () => `
      <div class="beat beat--letters">
        <div class="letter-reveal-row" style="--delay:0.3s">
          <span class="lr-movie">ACTION REPLAYY</span>
          <span class="lr-arrow">→</span>
          <span class="lr-letter">A</span>
        </div>
        <div class="letter-reveal-row" style="--delay:1.2s">
          <span class="lr-movie">NAYAK</span>
          <span class="lr-arrow">→</span>
          <span class="lr-letter">N</span>
        </div>
        <div class="letter-reveal-row" style="--delay:2.1s">
          <span class="lr-movie">SINGHAM</span>
          <span class="lr-arrow">→</span>
          <span class="lr-letter">S</span>
        </div>
        <div class="letter-reveal-row" style="--delay:3.0s">
          <span class="lr-movie">HEYY BABYY</span>
          <span class="lr-arrow">→</span>
          <span class="lr-letter">H</span>
        </div>
      </div>`,
  },
  /* 5 — A + N + S + H */
  {
    tapToAdvance: false,
    autoMs: 4500,
    html: () => `
      <div class="beat beat--combine">
        <p class="beat-line" style="--delay:0s; font-size:clamp(0.8rem,2.5vw,1rem); letter-spacing:0.25em; color:var(--c-gold-dim)">
          THE FIRST LETTERS SPELL…
        </p>
        <div class="combine-letters" style="margin-top:1rem">
          <span class="combine-letter" style="--delay:0.4s">A</span>
          <span class="combine-plus"   style="--delay:0.8s">+</span>
          <span class="combine-letter" style="--delay:1.2s">N</span>
          <span class="combine-plus"   style="--delay:1.6s">+</span>
          <span class="combine-letter" style="--delay:2.0s">S</span>
          <span class="combine-plus"   style="--delay:2.4s">+</span>
          <span class="combine-letter" style="--delay:2.8s">H</span>
        </div>
      </div>`,
  },
  /* 6 — ANSH big reveal */
  {
    tapToAdvance: false,
    autoMs: 5000,
    html: () => `
      <div class="beat beat--ansh">
        <p class="ansh-sub">And the name is…</p>
        <div class="ansh-reveal" role="img" aria-label="The baby's name: ANSH">
          <span class="ansh-letter" style="--delay:0.5s">A</span>
          <span class="ansh-letter" style="--delay:1.0s">N</span>
          <span class="ansh-letter" style="--delay:1.5s">S</span>
          <span class="ansh-letter" style="--delay:2.0s">H</span>
        </div>
        <p class="ansh-subtitle" style="--delay:3.2s">Our Little Superstar 👶🏻❤️</p>
      </div>`,
  },
];

/* ─────────────────────────────────────────────
   STATE
───────────────────────────────────────────── */
const state = {
  currentRiddle:   0,
  audioAvailable:  [null, null, null, null], // null=unknown, true/false
  audioIsPlaying:  false,
  climaxBeat:      -1,
  climaxAutoTimer: null,
};

/* ─────────────────────────────────────────────
   DOM REFS (resolved once on DOMContentLoaded)
───────────────────────────────────────────── */
let dom = {};

function cacheDom() {
  dom = {
    // screens
    screenLanding:     document.getElementById('screen-landing'),
    screenRiddle:      document.getElementById('screen-riddle'),
    screenClimax:      document.getElementById('screen-climax'),
    screenCelebration: document.getElementById('screen-celebration'),

    // landing
    btnStart:          document.getElementById('btn-start'),

    // riddle header
    filmCounter:       document.getElementById('film-counter'),
    filmNum:           document.getElementById('film-num'),
    nameSlots:         [
      document.getElementById('ns-0'),
      document.getElementById('ns-1'),
      document.getElementById('ns-2'),
      document.getElementById('ns-3'),
    ],

    // riddle phases
    phaseQuestion:     document.getElementById('phase-question'),
    phaseAnswer:       document.getElementById('phase-answer'),

    // riddle question
    riddleText:        document.getElementById('riddle-text'),
    btnReveal:         document.getElementById('btn-reveal'),

    // riddle answer
    answerLetter:      document.getElementById('answer-letter'),
    answerTitle:       document.getElementById('answer-title'),
    dialogueQuote:     document.getElementById('dialogue-quote'),
    btnAudio:          document.getElementById('btn-audio'),
    audioIcon:         document.getElementById('audio-icon'),
    audioLbl:          document.getElementById('audio-lbl'),
    audioSoon:         document.getElementById('audio-soon'),
    btnNext:           document.getElementById('btn-next'),
    nextLbl:           document.getElementById('next-lbl'),
    nextIcon:          document.getElementById('next-icon'),

    // climax
    climaxStage:       document.getElementById('climax-stage'),
    tapHint:           document.getElementById('tap-hint'),

    // celebration
    btnReplay:         document.getElementById('btn-replay'),

    // audio element
    audioEl:           document.getElementById('audio-el'),
  };
}

/* ─────────────────────────────────────────────
   SCREEN MANAGER
───────────────────────────────────────────── */
function showScreen(id, callback) {
  const allScreens = document.querySelectorAll('.screen');
  const next = document.getElementById(id);

  // Fade out active screens
  allScreens.forEach(s => {
    if (s.classList.contains('screen--active')) {
      s.classList.remove('screen--active');
      // Mark inactive for accessibility
      s.setAttribute('aria-hidden', 'true');
    }
  });

  // Short delay to allow fade-out to play (visibility transition is 0.7s)
  setTimeout(() => {
    next.removeAttribute('aria-hidden');
    next.classList.add('screen--active');
    if (callback) callback();
  }, 350);
}

/* ─────────────────────────────────────────────
   PARTICLES (floating golden dots)
───────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const TOTAL = 55;
  let particles = [];
  let rafId = null;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function mkParticle(randomY) {
    return {
      x:     Math.random() * canvas.width,
      y:     randomY ? Math.random() * canvas.height : canvas.height + 10,
      r:     Math.random() * 1.8 + 0.4,
      vy:    Math.random() * 0.45 + 0.18,
      vx:    (Math.random() - 0.5) * 0.22,
      alpha: Math.random() * 0.55 + 0.1,
    };
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y -= p.vy;
      p.x += p.vx;

      if (p.y < -8) {
        particles[i] = mkParticle(false);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,76,${p.alpha})`;
      ctx.fill();
    }

    rafId = requestAnimationFrame(animate);
  }

  function init() {
    resize();
    particles = Array.from({ length: TOTAL }, () => mkParticle(true));
    animate();
  }

  window.addEventListener('resize', () => {
    resize();
    particles = particles.map(p => ({
      ...p,
      x: p.x * (canvas.width / (canvas.width || 1)),
    }));
  }, { passive: true });

  // Pause particles when reduced-motion is preferred
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    // Skip animation entirely
    resize();
    return;
  }

  init();
})();

/* ─────────────────────────────────────────────
   CONFETTI
───────────────────────────────────────────── */
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  // Skip if reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const COLORS = [
    '#c9a84c', '#f5d070', '#e8c56a', '#ffcc00',
    '#9b2020', '#c0392b', '#ff6b6b',
    '#ffffff',  '#f0e6d2',
    '#ff9900',
  ];

  const COUNT = 160;
  const pieces = Array.from({ length: COUNT }, () => ({
    x:       Math.random() * canvas.width,
    y:       -Math.random() * canvas.height * 0.5 - 10,
    w:       Math.random() * 11 + 5,
    h:       Math.random() * 5 + 3,
    color:   COLORS[Math.floor(Math.random() * COLORS.length)],
    rot:     Math.random() * Math.PI * 2,
    rotV:    (Math.random() - 0.5) * 0.14,
    vx:      (Math.random() - 0.5) * 3.5,
    vy:      Math.random() * 2.5 + 2,
    g:       0.05,
  }));

  let raf;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    for (const p of pieces) {
      p.x   += p.vx;
      p.y   += p.vy;
      p.vy  += p.g;
      p.rot += p.rotV;

      if (p.y < canvas.height + 20) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }

    if (active) raf = requestAnimationFrame(draw);
  }

  draw();
}

/* ─────────────────────────────────────────────
   AUDIO MANAGER
───────────────────────────────────────────── */
function stopAudio() {
  const el = dom.audioEl;
  if (!el) return;
  if (!el.paused) {
    el.pause();
    el.currentTime = 0;
  }
  state.audioIsPlaying = false;
  resetAudioButton();
}

function resetAudioButton() {
  if (!dom.btnAudio) return;
  dom.btnAudio.classList.remove('is-playing');
  dom.audioIcon.textContent = '▶';
  dom.audioLbl.textContent  = 'PLAY DIALOGUE';
}

function setupAudioForRiddle(riddleIdx) {
  const riddle  = RIDDLES[riddleIdx];
  const btnAudio = dom.btnAudio;
  const audioSoon = dom.audioSoon;

  resetAudioButton();
  btnAudio.disabled = false;
  btnAudio.hidden   = false;
  audioSoon.hidden  = true;

  // If already checked this session
  if (state.audioAvailable[riddleIdx] === false) {
    btnAudio.hidden  = true;
    audioSoon.hidden = false;
    return;
  }
  if (state.audioAvailable[riddleIdx] === true) {
    return; // keep button visible
  }

  // Unknown — probe the file
  const probeAudio = new Audio();
  probeAudio.preload = 'metadata';

  const markUnavailable = () => {
    state.audioAvailable[riddleIdx] = false;
    if (state.currentRiddle === riddleIdx) {
      btnAudio.hidden  = true;
      audioSoon.hidden = false;
    }
  };

  const markAvailable = () => {
    state.audioAvailable[riddleIdx] = true;
    // Button already shown optimistically
  };

  probeAudio.addEventListener('error',         markUnavailable, { once: true });
  probeAudio.addEventListener('loadedmetadata', markAvailable,   { once: true });

  // Safety: if file is completely absent, error fires within ~2s
  const fallback = setTimeout(() => {
    // If still unknown after 4s, assume unavailable
    if (state.audioAvailable[riddleIdx] === null) markUnavailable();
  }, 4000);

  probeAudio.addEventListener('loadedmetadata', () => clearTimeout(fallback), { once: true });
  probeAudio.addEventListener('error',          () => clearTimeout(fallback), { once: true });

  probeAudio.src = riddle.audio;
}

function toggleAudio(riddleIdx) {
  const riddle = RIDDLES[riddleIdx];
  const el     = dom.audioEl;

  // If unavailable
  if (state.audioAvailable[riddleIdx] === false) return;

  if (state.audioIsPlaying) {
    el.pause();
    state.audioIsPlaying = false;
    dom.audioIcon.textContent = '▶';
    dom.audioLbl.textContent  = 'PLAY DIALOGUE';
    dom.btnAudio.classList.remove('is-playing');
    return;
  }

  // Set source if different
  if (el.src !== new URL(riddle.audio, document.baseURI).href) {
    el.src = riddle.audio;
  }

  el.play().then(() => {
    state.audioIsPlaying = true;
    dom.audioIcon.textContent = '⏸';
    dom.audioLbl.textContent  = 'PAUSE';
    dom.btnAudio.classList.add('is-playing');
  }).catch(() => {
    // Playback blocked or file missing
    state.audioAvailable[riddleIdx] = false;
    dom.btnAudio.hidden  = true;
    dom.audioSoon.hidden = false;
  });

  el.onended = () => {
    state.audioIsPlaying = false;
    dom.audioIcon.textContent = '▶';
    dom.audioLbl.textContent  = 'PLAY AGAIN';
    dom.btnAudio.classList.remove('is-playing');
  };

  el.onerror = () => {
    state.audioAvailable[riddleIdx] = false;
    if (state.currentRiddle === riddleIdx) {
      dom.btnAudio.hidden  = true;
      dom.audioSoon.hidden = false;
    }
    state.audioIsPlaying = false;
  };
}

/* ─────────────────────────────────────────────
   RIDDLE SYSTEM
───────────────────────────────────────────── */
function loadRiddle(idx) {
  const riddle = RIDDLES[idx];
  state.currentRiddle = idx;

  // Update header counter
  dom.filmNum.textContent = idx + 1;

  // Show question phase, hide answer phase
  dom.phaseQuestion.hidden = false;
  dom.phaseAnswer.hidden   = true;

  // Animate card in
  const card = dom.phaseQuestion.querySelector('.riddle-card');
  if (card) {
    card.style.animation = 'none';
    void card.offsetHeight; // force reflow
    card.style.animation = '';
  }

  // Fill riddle text (newlines → rendered as pre-line in CSS)
  dom.riddleText.textContent = riddle.text;
}

function revealAnswer(idx) {
  const riddle = RIDDLES[idx];

  // Populate answer fields
  dom.answerLetter.textContent  = riddle.letter;
  dom.answerTitle.textContent   = riddle.movie;
  dom.dialogueQuote.textContent = riddle.dialogue;

  // Update next-button label
  if (idx === RIDDLES.length - 1) {
    dom.nextLbl.textContent   = 'SEE THE REVEAL';
    dom.nextIcon.textContent  = '🎬';
  } else {
    dom.nextLbl.textContent  = 'NEXT RIDDLE';
    dom.nextIcon.textContent = '→';
  }

  // Show/swap phases (with a small stagger animation)
  dom.phaseQuestion.hidden = true;
  dom.phaseAnswer.hidden   = false;

  // Trigger re-animation for answer elements
  [dom.answerLetter, dom.answerTitle, dom.dialogueQuote].forEach(el => {
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = '';
  });

  // Update the name slot
  revealNameSlot(idx, riddle.letter);

  // Probe and set up audio
  setupAudioForRiddle(idx);
}

function revealNameSlot(idx, letter) {
  const slot = dom.nameSlots[idx];
  if (!slot) return;
  const inner = slot.querySelector('.name-slot__inner');
  inner.textContent = letter;
  slot.classList.add('revealed');
  slot.setAttribute('aria-label', `Letter ${idx + 1}: ${letter}`);
}

function goToNextRiddle() {
  stopAudio();

  if (state.currentRiddle < RIDDLES.length - 1) {
    const next = state.currentRiddle + 1;
    // Fade-swap the riddle screen content
    dom.phaseAnswer.hidden   = true;
    dom.phaseQuestion.hidden = false;
    loadRiddle(next);
    // Scroll back to top of riddle main
    dom.screenRiddle.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Last riddle — go to climax
    startClimax();
  }
}

/* ─────────────────────────────────────────────
   CLIMAX MANAGER
───────────────────────────────────────────── */
function startClimax() {
  state.climaxBeat = -1;
  showScreen('screen-climax', advanceClimaxBeat);
}

function advanceClimaxBeat() {
  // Clear any running auto-advance timer
  if (state.climaxAutoTimer) {
    clearTimeout(state.climaxAutoTimer);
    state.climaxAutoTimer = null;
  }

  state.climaxBeat++;

  if (state.climaxBeat >= CLIMAX_BEATS.length) {
    // All beats done → go to celebration
    startCelebration();
    return;
  }

  const beat     = CLIMAX_BEATS[state.climaxBeat];
  const stage    = dom.climaxStage;
  const tapHint  = dom.tapHint;

  // Quick fade-out of previous beat
  stage.style.opacity = '0';
  stage.style.transform = 'translateY(12px)';
  stage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

  setTimeout(() => {
    // Inject new beat HTML
    stage.innerHTML = beat.html();

    // Fade in
    stage.style.opacity   = '0';
    stage.style.transform = 'translateY(0)';
    void stage.offsetHeight; // force reflow before transition
    stage.style.opacity    = '1';
    stage.style.transform  = 'translateY(0)';

    // Show / hide tap hint
    if (beat.tapToAdvance) {
      tapHint.classList.add('is-visible');
      tapHint.setAttribute('aria-hidden', 'false');
    } else {
      tapHint.classList.remove('is-visible');
      tapHint.setAttribute('aria-hidden', 'true');
    }

    // Auto-advance
    if (beat.autoMs) {
      state.climaxAutoTimer = setTimeout(advanceClimaxBeat, beat.autoMs);
    }
  }, 320);
}

function startCelebration() {
  showScreen('screen-celebration', () => {
    launchConfetti();
    // Re-trigger name animation
    const name = document.querySelector('.cel-name');
    if (name) {
      name.style.animation = 'none';
      void name.offsetHeight;
      name.style.animation = '';
    }
  });
}

/* ─────────────────────────────────────────────
   RESET (replay)
───────────────────────────────────────────── */
function resetEverything() {
  stopAudio();

  if (state.climaxAutoTimer) {
    clearTimeout(state.climaxAutoTimer);
    state.climaxAutoTimer = null;
  }

  state.currentRiddle  = 0;
  state.audioAvailable = [null, null, null, null];
  state.audioIsPlaying = false;
  state.climaxBeat     = -1;

  // Reset name slots
  dom.nameSlots.forEach((slot, i) => {
    slot.classList.remove('revealed');
    slot.setAttribute('aria-label', `Letter ${i + 1}, not yet revealed`);
    const inner = slot.querySelector('.name-slot__inner');
    inner.textContent = '?';
    inner.style.animation = 'none';
  });

  // Reset riddle screen
  loadRiddle(0);

  // Clear climax stage
  dom.climaxStage.innerHTML = '';
  dom.tapHint.classList.remove('is-visible');

  // Go back to landing
  showScreen('screen-landing');
}

/* ─────────────────────────────────────────────
   EVENT LISTENERS
───────────────────────────────────────────── */
function bindEvents() {
  // Start
  dom.btnStart.addEventListener('click', () => {
    loadRiddle(0);
    showScreen('screen-riddle');
  });

  // Reveal movie answer
  dom.btnReveal.addEventListener('click', () => {
    revealAnswer(state.currentRiddle);
    // Scroll answer into view on mobile
    setTimeout(() => {
      dom.phaseAnswer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 200);
  });

  // Next riddle (or show reveal)
  dom.btnNext.addEventListener('click', goToNextRiddle);

  // Audio play/pause
  dom.btnAudio.addEventListener('click', () => toggleAudio(state.currentRiddle));

  // Climax tap-to-advance (both button and full-screen click)
  dom.tapHint.addEventListener('click', () => {
    const beat = CLIMAX_BEATS[state.climaxBeat];
    if (beat && beat.tapToAdvance) advanceClimaxBeat();
  });

  dom.screenClimax.addEventListener('click', (e) => {
    // Only advance if tap-to-advance and user didn't click the hint itself
    const beat = CLIMAX_BEATS[state.climaxBeat];
    if (beat && beat.tapToAdvance && e.target !== dom.tapHint) {
      advanceClimaxBeat();
    }
  });

  // Keyboard: space/enter to advance climax
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const beat = CLIMAX_BEATS[state.climaxBeat];
      if (
        document.getElementById('screen-climax').classList.contains('screen--active') &&
        beat && beat.tapToAdvance
      ) {
        e.preventDefault();
        advanceClimaxBeat();
      }
    }
  });

  // Replay
  dom.btnReplay.addEventListener('click', resetEverything);
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  cacheDom();
  bindEvents();

  // All screens except landing start aria-hidden
  [dom.screenRiddle, dom.screenClimax, dom.screenCelebration].forEach(s => {
    s.setAttribute('aria-hidden', 'true');
  });

  // Landing is already screen--active from HTML
  dom.screenLanding.removeAttribute('aria-hidden');

  // Pre-set film counter
  dom.filmNum.textContent = '1';
});
