// ============================================================
// GAME — Single-player Bollywood word-puzzle
// No Firebase. No login. Just riddles + letter tiles.
// ============================================================

window.Game = (() => {

    // ── Riddle data ───────────────────────────────────────────
    const RIDDLES = [
        {
            letter:   'A',
            words:    ['ACTION', 'REPLAYY'],
            dialogue: 'Awaaz neeche!',
            audio:    'assets/audio/action-replayy.mp3',
            text:
`A son is unhappy with his parents' marriage.

So he does something impossible… ⏰

He travels back in time to change their love story! ❤️😂

🎬 Which movie is this?`
        },
        {
            letter:   'N',
            words:    ['NAYAK'],
            dialogue: 'Ek din ka CM!',
            audio:    'assets/audio/nayak.mp3',
            text:
`One ordinary man. 👨

One crazy challenge…

Run the entire state for just ONE day! 🏛️

🎬 Which movie is this?`
        },
        {
            letter:   'S',
            words:    ['SINGHAM'],
            dialogue: 'Aata maajhi satakli!',
            audio:    'assets/audio/singham.mp3',
            text:
`One honest police officer. 👮‍♂️

One powerful criminal. 😈

When corruption crosses the line…

the lion finally ROARS! 🦁🔥

🎬 Which movie is this?`
        },
        {
            letter:   'H',
            words:    ['HEYY', 'BABYY'],
            dialogue: 'Baby ko sambhalo!',
            audio:    'assets/audio/heyy-babby.mp3',
            text:
`Three bachelors. 👨‍👨‍👦

One tiny baby. 👶

And absolutely ZERO experience with babies! 😂

🎬 Which movie is this?`
        }
    ];

    // ── State ─────────────────────────────────────────────────
    let idx      = 0;
    let placed   = [];
    let pool     = [];
    let uid      = 0;
    let busy     = false;
    let hintTimer    = null;   // setTimeout handle for hint unlock
    let hintInterval = null;   // setInterval handle for countdown display

    // ── Helpers ───────────────────────────────────────────────
    const $  = id => document.getElementById(id);
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const el = $('screen-' + name);
        if (el) el.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Entry ─────────────────────────────────────────────────
    function start() {
        idx  = 0;
        busy = false;
        Animations.updateProgressLetters(0); // reset all boxes to ?
        loadRiddle(0);
        showScreen('game');
    }

    // ── Load a riddle ─────────────────────────────────────────
    function loadRiddle(i) {
        busy = false;
        const r = RIDDLES[i];

        // Reset placed slots
        placed = r.words.flatMap(w => Array(w.length).fill(null));

        // Build tile pool — all answer letters shuffled
        pool = shuffle(r.words.join('').split('')).map(l => ({ letter: l, id: uid++ }));

        // Update header & text
        $('riddle-number').textContent = 'RIDDLE ' + (i + 1) + ' OF 4';
        $('riddle-text').textContent   = r.text;

        // Show puzzle section, hide solved section
        $('puzzle-section').style.display = '';
        $('solved-section').style.display = 'none';

        renderWords();
        renderTiles();
        startHintTimer();
    }

    // ── Hint: unlocks after 60 s ──────────────────────────────
    function startHintTimer() {
        clearTimeout(hintTimer);
        clearInterval(hintInterval);
        AudioManager.stop();

        const btn    = $('hint-btn');
        const cdEl   = $('hint-countdown');
        if (btn) btn.disabled = true;

        let secs = 60;
        if (cdEl) cdEl.textContent = '(1:00)';

        hintInterval = setInterval(() => {
            secs--;
            if (cdEl) {
                const m = Math.floor(secs / 60);
                const s = String(secs % 60).padStart(2, '0');
                cdEl.textContent = '(' + m + ':' + s + ')';
            }
            if (secs <= 0) clearInterval(hintInterval);
        }, 1000);

        hintTimer = setTimeout(() => {
            if (btn) btn.disabled = false;
            if (cdEl) cdEl.textContent = '';
        }, 60000);
    }

    function playHint() {
        AudioManager.play(idx + 1);
        const btn = $('hint-btn');
        if (btn) btn.disabled = true; // play once per riddle
    }

    // ── Render ────────────────────────────────────────────────
    function renderWords() {
        const r   = RIDDLES[idx];
        const el  = $('puzzle-words');
        if (!el) return;

        let pos = 0;
        el.innerHTML = r.words.map(word => {
            const boxes = word.split('').map(() => {
                const p      = pos++;
                const letter = placed[p];
                return `<div class="letter-box ${letter ? 'filled' : 'empty'}"
                              data-pos="${p}"
                              onclick="Game.onBox(${p})">${letter || ''}</div>`;
            }).join('');
            return `<div class="word-group">${boxes}</div>`;
        }).join('');
    }

    function renderTiles() {
        const el = $('letter-tiles');
        if (!el) return;
        el.innerHTML = pool.map(t =>
            `<button class="letter-tile" onclick="Game.onTile(${t.id})">${t.letter}</button>`
        ).join('');
    }

    // ── Input handlers ────────────────────────────────────────
    function onTile(tileId) {
        if (busy) return;

        const ti = pool.findIndex(t => t.id === tileId);
        if (ti === -1) return;

        const empty = placed.findIndex(l => l === null);
        if (empty === -1) return;

        placed[empty] = pool[ti].letter;
        pool.splice(ti, 1);

        renderWords();
        renderTiles();

        // Auto-check once all slots filled
        if (placed.every(l => l !== null)) {
            busy = true;
            setTimeout(checkAnswer, 180);
        }
    }

    function onBox(pos) {
        if (busy) return;
        if (placed[pos] === null) return;

        pool.push({ letter: placed[pos], id: uid++ });
        placed[pos] = null;

        renderWords();
        renderTiles();
    }

    function clearAll() {
        if (busy) return;
        placed.forEach((l, i) => {
            if (l !== null) pool.push({ letter: l, id: uid++ });
            placed[i] = null;
        });
        renderWords();
        renderTiles();
    }

    // ── Validation ────────────────────────────────────────────
    function checkAnswer() {
        const r       = RIDDLES[idx];
        const attempt = placed.join('');
        const answer  = r.words.join('');

        if (attempt === answer) {
            onCorrect();
        } else {
            onWrong();
        }
    }

    async function onCorrect() {
        clearTimeout(hintTimer);
        clearInterval(hintInterval);
        AudioManager.stop();

        document.querySelectorAll('.letter-box').forEach(b => b.classList.add('correct'));
        Animations.launchConfetti(3500);

        await sleep(600);

        const r = RIDDLES[idx];
        $('solved-movie').textContent    = r.words.join(' ');
        $('solved-dialogue').textContent = '\u201c' + r.dialogue + '\u201d';

        const nextBtn = $('next-btn');
        if (nextBtn) {
            nextBtn.textContent = idx < 3 ? 'NEXT RIDDLE \u2192' : '\ud83c\udfac REVEAL THE NAME!';
        }

        $('puzzle-section').style.display = 'none';
        $('solved-section').style.display  = '';

        busy = false;
    }

    async function onWrong() {
        // Shake all word groups
        document.querySelectorAll('.word-group').forEach(g => {
            g.classList.add('shake');
            setTimeout(() => g.classList.remove('shake'), 600);
        });
        await sleep(650);
        clearAll();
        busy = false;
    }

    // ── Advance ───────────────────────────────────────────────
    function nextRiddle() {
        idx++;
        if (idx >= RIDDLES.length) {
            runFinalReveal();
        } else {
            loadRiddle(idx);
        }
    }

    // ── Final cinematic ───────────────────────────────────────
    async function runFinalReveal() {
        AudioManager.stop();
        showScreen('final');

        const scene = $('cinematic-scene');
        if (!scene) return;

        const steps = [
            {
                delay: 2800,
                html: `<p class="cinematic-big">\ud83c\udfac</p>
                       <p class="cinematic-big">Picture abhi baaki hai, mere dost!</p>`
            },
            {
                delay: 3200,
                html: `<p class="cinematic-medium">Four films\u2026 Four clues\u2026</p>
                       <p class="cinematic-medium">And one little twist! \ud83c\udf00</p>`
            },
            {
                // Letters fly in one by one — delay covers all 4 animations
                delay: 4200,
                html: `<p class="cinematic-big" style="margin-bottom:24px">Look at the first letter of each movie\u2026</p>
                       <div class="ansh-build-row">
                         <span class="ansh-build-letter" style="animation-delay:.2s">A</span>
                         <span class="ansh-build-letter" style="animation-delay:.9s">N</span>
                         <span class="ansh-build-letter" style="animation-delay:1.6s">S</span>
                         <span class="ansh-build-letter" style="animation-delay:2.3s">H</span>
                       </div>`
            },
            {
                delay: 7000,
                confetti: true,
                html: `
                    <p class="final-name">ANSH</p>
                    <p class="superstar-text">OUR LITTLE SUPERSTAR \ud83d\udc76\ud83c\udffb\u2764\ufe0f</p>
                    <p class="from-parents">Welcome to the world, Ansh!</p>
                    <p class="from-parents from-parents-gold">From Mom &amp; Dad \u2014 Utkarsha &amp; Rakesh</p>
                    <button class="btn btn-secondary"
                            style="max-width:240px;margin-top:28px"
                            onclick="Game.start()">\ud83d\udd04 Play Again</button>`
            }
        ];

        for (const step of steps) {
            await Animations.cinematicStep(scene, step.html, 420);
            if (step.confetti) Animations.launchConfetti(10000);
            await sleep(step.delay);
        }
    }

    // ── Init ─────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        Animations.initCanvas();
    });

    return { start, onTile, onBox, clearAll, nextRiddle, playHint };
})();
