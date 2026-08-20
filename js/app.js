// ============================================================
// APP CONTROLLER  —  UI state machine, event handlers,
//                    Firebase listeners, screen rendering.
// Depends on: firebase.js, game.js, audio.js, animations.js
// ============================================================

window.App = (() => {

    // ── App state ─────────────────────────────────────────────
    let uid          = null;
    let playerName   = null;
    let gameState    = null;      // last known Firebase game/status
    let riddleNum    = null;      // active riddle index
    let locked       = false;     // "I KNOW IT!" already clicked this riddle
    let pendingClick = false;     // click recorded, awaiting confirm
    let currentScreen = null;

    // Firebase listener handles — kept so we can detach them
    let gameStatusOff   = null;
    let playersOff      = null;
    let balloonOff      = null;   // riddle balloon listener
    let finalBalloonOff = null;

    // ── Helpers ───────────────────────────────────────────────
    const $ = id => document.getElementById(id);
    const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    const sleep   = ms => new Promise(r => setTimeout(r, ms));

    function escHtml(str) {
        return String(str ?? "")
            .replace(/&/g,"&amp;").replace(/</g,"&lt;")
            .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }

    // ── Toast ─────────────────────────────────────────────────
    function toast(msg, type = "", duration = 3000) {
        const container = $("toast-container");
        if (!container) return;
        const el = document.createElement("div");
        el.className = `toast ${type}`;
        el.textContent = msg;
        container.appendChild(el);
        setTimeout(() => {
            el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            el.style.opacity    = "0";
            el.style.transform  = "translateY(-8px)";
            setTimeout(() => el.remove(), 320);
        }, duration);
    }

    // ── Screen switcher ───────────────────────────────────────
    function showScreen(name) {
        if (currentScreen === name) return;
        currentScreen = name;
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
        const el = $(`screen-${name}`);
        if (el) el.classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function hideLoading() {
        const el = $("loading-overlay");
        if (el) { el.style.opacity = "0"; setTimeout(() => { el.style.display = "none"; }, 500); }
    }

    // ── Initialise ────────────────────────────────────────────
    async function init() {
        Animations.initCanvas();

        // Enter key on name input
        const input = $("player-name-input");
        if (input) {
            input.addEventListener("keydown", e => { if (e.key === "Enter") handleJoin(); });

            // Pre-fill saved name
            const saved = localStorage.getItem("bnr_player_name");
            if (saved) input.value = saved;
        }

        auth.onAuthStateChanged(async user => {
            if (!user) {
                hideLoading();
                showScreen("join");
                return;
            }

            uid = user.uid;

            // Check if this user already joined
            const snap   = await db.ref(`players/${uid}`).once("value");
            const player = snap.val();

            if (player?.name) {
                playerName = player.name;
                await _postJoin();
            } else {
                hideLoading();
                showScreen("join");
            }
        });

        // Kick off anonymous auth
        try {
            if (!auth.currentUser) await auth.signInAnonymously();
        } catch (e) {
            hideLoading();
            showScreen("join");
        }
    }

    // ── Join flow ─────────────────────────────────────────────
    async function handleJoin() {
        const input  = $("player-name-input");
        const errEl  = $("name-error");
        const btn    = $("join-btn");
        const raw    = input.value.trim();

        errEl.classList.remove("visible");

        if (!raw) {
            errEl.textContent = "Please enter your name.";
            errEl.classList.add("visible");
            input.focus();
            return;
        }
        if (raw.length > 20) {
            errEl.textContent = "Name must be 20 characters or less.";
            errEl.classList.add("visible");
            return;
        }

        btn.disabled    = true;
        btn.textContent = "Joining…";

        try {
            if (!auth.currentUser) await auth.signInAnonymously();
            uid        = auth.currentUser.uid;
            playerName = raw;

            localStorage.setItem("bnr_player_name", raw);

            await GameEngine.registerPlayer(uid, raw);
            _startHeartbeat();
            await _postJoin();
        } catch (err) {
            console.error(err);
            btn.disabled    = false;
            btn.textContent = "JOIN THE GAME 🎬";
            toast("Could not connect. Please try again.", "error");
        }
    }

    async function _postJoin() {
        // Set up disconnect handling (re-register in case of refresh)
        db.ref(`players/${uid}`).onDisconnect().update({ active: false, lastSeen: SERVER_TIMESTAMP });
        _startHeartbeat();
        hideLoading();
        _listenToGameStatus();
        _listenToPlayers();
    }

    function _startHeartbeat() {
        setInterval(() => {
            if (uid) db.ref(`players/${uid}`).update({ lastSeen: SERVER_TIMESTAMP, active: true }).catch(() => {});
        }, 25000);
    }

    // ── Firebase: players list ────────────────────────────────
    function _listenToPlayers() {
        if (playersOff) { db.ref("players").off("value", playersOff); }
        playersOff = db.ref("players").on("value", snap => {
            _renderPlayers(snap.val() || {});
        });
    }

    function _renderPlayers(players) {
        const list     = $("players-list");
        const countEl  = $("player-count");
        if (!list) return;

        const sorted = Object.values(players)
            .filter(p => p.name)
            .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

        if (countEl) countEl.textContent = sorted.length;

        list.innerHTML = sorted.map(p => `
            <li class="player-item ${p.uid === uid ? "me" : ""}">
                <div class="player-avatar">👤</div>
                <span class="player-name">${escHtml(p.name)}</span>
                ${p.uid === uid ? '<span class="player-badge">You</span>' : ""}
            </li>
        `).join("");
    }

    // ── Firebase: game status ─────────────────────────────────
    function _listenToGameStatus() {
        if (gameStatusOff) db.ref("game/status").off("value", gameStatusOff);

        gameStatusOff = db.ref("game/status").on("value", async snap => {
            const status = snap.val();
            if (!status) {
                showScreen("lobby");
                setText("lobby-player-name", playerName);
                return;
            }
            await _handleStatusChange(status);
        });
    }

    async function _handleStatusChange(status) {
        const prevState    = gameState?.state;
        const prevRiddle   = gameState?.currentRiddle;
        gameState          = status;
        const state        = status.state;
        const newRiddleNum = status.currentRiddle;

        switch (state) {
            case "waiting":
                setText("lobby-player-name", playerName);
                showScreen("lobby");
                AudioManager.stop();
                break;

            case "playing":
                if (newRiddleNum !== riddleNum || prevState !== "playing") {
                    // New riddle started
                    riddleNum    = newRiddleNum;
                    locked       = false;
                    pendingClick = false;
                    _detachBalloonListener();

                    // Check if I already answered
                    const [mySnap, winnerSnap, balloonSnap] = await Promise.all([
                        db.ref(`answers/riddle${riddleNum}/${uid}`).once("value"),
                        db.ref(`winners/riddle${riddleNum}`).once("value"),
                        db.ref(`balloons/riddle${riddleNum}`).once("value")
                    ]);

                    const myAnswer = mySnap.val();
                    const winner   = winnerSnap.val();
                    const balloon  = balloonSnap.val();

                    if (balloon?.state === "popped") {
                        _showRevealScreen(riddleNum);
                    } else if (winner) {
                        locked = true;
                        _showBalloonPhase(riddleNum, winner);
                        _listenBalloon(riddleNum);
                    } else if (myAnswer?.confirmed) {
                        locked = true;
                        showScreen("answered");
                        setText("answered-message", "🎬 Waiting for a winner…");
                        _listenForWinner(riddleNum);
                    } else {
                        _showRiddleScreen(riddleNum);
                        AudioManager.play(riddleNum);
                    }
                }
                break;

            case "results":
                riddleNum = newRiddleNum;
                await _showResultsScreen(riddleNum);
                AudioManager.stop();
                break;

            case "final":
                AudioManager.stop();
                _detachBalloonListener();
                await _runFinalCinematic();
                break;

            case "ended":
                AudioManager.stop();
                showScreen("ended");
                break;
        }
    }

    // ── Riddle screen ─────────────────────────────────────────
    function _showRiddleScreen(n) {
        const riddle = GameEngine.RIDDLES[n];
        if (!riddle) return;

        setText("riddle-counter",     `RIDDLE ${n} OF 4`);
        setText("riddle-player-name", playerName);
        setText("riddle-text",        riddle.text);

        const btn = $("know-it-btn");
        if (btn) { btn.disabled = false; btn.textContent = "🎬 I KNOW IT!"; }

        const diag = $("riddle-dialogue");
        if (diag) diag.classList.remove("visible");

        Animations.updateProgressLetters(n - 1);
        showScreen("riddle");
    }

    // ── "I KNOW IT!" ──────────────────────────────────────────
    async function handleIKnowIt() {
        if (locked || !uid || !playerName) return;
        locked = true;

        const btn = $("know-it-btn");
        if (btn) btn.disabled = true;

        try {
            await GameEngine.recordClick(riddleNum, uid, playerName);
            pendingClick = true;
            _showConfirmDialog();
        } catch (err) {
            console.error(err);
            locked = false;
            if (btn) btn.disabled = false;
            toast("Connection error — please try again.", "error");
        }
    }

    function _showConfirmDialog() {
        const ov = $("confirmation-overlay");
        if (ov) ov.classList.add("active");
    }

    function _hideConfirmDialog() {
        const ov = $("confirmation-overlay");
        if (ov) ov.classList.remove("active");
    }

    async function handleConfirmYes() {
        _hideConfirmDialog();
        showScreen("answered");
        setText("answered-message", "🎬 Locking your answer…");

        try {
            const result = await GameEngine.claimWinner(riddleNum, uid, playerName);

            if (result.isWinner) {
                _showBalloonWinnerScreen(result.winnerData, result.myResponseTime);
            } else {
                _showBalloonWaitingScreen(result.winnerData, result.myResponseTime);
                _listenBalloon(riddleNum);
            }
        } catch (err) {
            console.error(err);
            toast("Error submitting answer.", "error");
            _listenForWinner(riddleNum);
        }
    }

    async function handleConfirmCancel() {
        _hideConfirmDialog();
        pendingClick = false;
        locked       = false;

        try {
            await GameEngine.cancelClick(riddleNum, uid);
        } catch (_) {}

        const btn = $("know-it-btn");
        if (btn) btn.disabled = false;
    }

    // ── Winner/balloon logic ──────────────────────────────────
    function _listenForWinner(n) {
        db.ref(`winners/riddle${n}`).on("value", snap => {
            const w = snap.val();
            if (!w) return;
            db.ref(`winners/riddle${n}`).off("value");

            if (w.uid === uid) {
                _showBalloonWinnerScreen(w, w.responseTime);
            } else {
                _showBalloonWaitingScreen(w, null);
                _listenBalloon(n);
            }
        });
    }

    function _showBalloonPhase(n, winner) {
        if (winner.uid === uid) {
            _showBalloonWinnerScreen(winner, winner.responseTime);
        } else {
            _showBalloonWaitingScreen(winner, null);
        }
    }

    function _showBalloonWinnerScreen(winner, responseTime) {
        setText("winner-name-display", winner.name || playerName);
        const t = typeof responseTime === "number" ? responseTime.toFixed(1) : "—";
        setText("winner-time-display", `Your time: ${t} seconds`);

        const riddle = GameEngine.RIDDLES[riddleNum];
        if (riddle) setText("winner-dialogue", `"${riddle.dialogue}"`);

        showScreen("balloon-winner");
    }

    function _showBalloonWaitingScreen(winner, myTime) {
        setText("waiting-winner-name", winner.name);
        const wt = typeof winner.responseTime === "number" ? winner.responseTime.toFixed(1) : "—";
        setText("waiting-winner-time", `${wt} seconds`);

        const myTimeEl = $("waiting-my-time");
        if (myTimeEl && myTime !== null && myTime !== undefined) {
            myTimeEl.textContent = `Your time: ${myTime.toFixed(1)} seconds`;
            myTimeEl.style.display = "block";
        }

        showScreen("balloon-waiting");
    }

    function _listenBalloon(n) {
        _detachBalloonListener();
        balloonOff = db.ref(`balloons/riddle${n}`).on("value", async snap => {
            const data = snap.val();
            if (data?.state === "popped") {
                _detachBalloonListener();
                await _doBalloonPopAnimation(n);
            }
        });
    }

    function _detachBalloonListener() {
        if (balloonOff) {
            db.ref(`balloons/riddle${riddleNum}`).off("value", balloonOff);
            balloonOff = null;
        }
    }

    async function handlePopBalloon() {
        const btn = $("pop-balloon-btn");
        if (btn) btn.disabled = true;
        try {
            await GameEngine.popBalloon(riddleNum, uid);
            // Firebase listener takes over from here
        } catch (err) {
            console.error(err);
            toast("Error — please try again.", "error");
            if (btn) btn.disabled = false;
        }
    }

    async function _doBalloonPopAnimation(n) {
        showScreen("balloon-popping");

        const balloonEl  = $("popping-balloon-emoji");
        const countdownEl = $("countdown-display");

        for (let i = 3; i >= 1; i--) {
            if (countdownEl) countdownEl.textContent = i;
            await sleep(800);
        }

        if (countdownEl) countdownEl.textContent = "💥";
        await Animations.balloonPop(balloonEl);
        Animations.launchConfetti(5000);
        await sleep(600);

        _showRevealScreen(n);
    }

    function _showRevealScreen(n) {
        const riddle = GameEngine.RIDDLES[n];
        if (!riddle) return;

        setText("reveal-movie-title", riddle.movie.toUpperCase());
        setText("reveal-letter-big",  riddle.letter);
        setText("reveal-dialogue",    `"${riddle.dialogue}"`);

        Animations.updateProgressLetters(n);
        showScreen("reveal");
    }

    // ── Results screen ────────────────────────────────────────
    async function _showResultsScreen(n) {
        const riddle = GameEngine.RIDDLES[n];
        if (!riddle) return;

        setText("results-riddle-title", `RIDDLE ${n} RESULTS`);
        setText("results-movie",        riddle.movie.toUpperCase());

        try {
            const lb = await GameEngine.getRiddleLeaderboard(n);
            _renderLeaderboard("results-list", lb);
        } catch (e) { console.error(e); }

        Animations.updateProgressLetters(n);
        showScreen("results");
    }

    function _renderLeaderboard(listId, entries) {
        const list = $(listId);
        if (!list) return;

        const medals = ["🥇", "🥈", "🥉"];
        const rankClass = ["first", "second", "third"];
        const rankColor = ["gold", "silver", "bronze"];

        if (!entries.length) {
            list.innerHTML = `<li class="text-center text-muted" style="padding:20px">No responses yet</li>`;
            return;
        }

        list.innerHTML = entries.map((e, i) => `
            <li class="leaderboard-item ${rankClass[i] || ""}">
                <span class="rank-number ${rankColor[i] || ""}">${medals[i] || `#${i+1}`}</span>
                <span class="leaderboard-name ${e.uid === uid ? "me" : ""}">${escHtml(e.name)}</span>
                <span class="leaderboard-time">${typeof e.responseTime === "number" ? e.responseTime.toFixed(1) : "—"}s</span>
            </li>
        `).join("");
    }

    // ── Final cinematic sequence ──────────────────────────────
    async function _runFinalCinematic() {
        showScreen("final");

        const scene = $("cinematic-scene");
        if (!scene) return;

        // Fetch data
        let leaderboard = [];
        try { leaderboard = await GameEngine.getOverallLeaderboard(); } catch (_) {}

        const finalWinner = leaderboard[0];

        // Store finalWinner in Firebase (transaction — first client sets it)
        if (finalWinner) {
            db.ref("finalWinner").transaction(cur => {
                if (cur === null) {
                    return { uid: finalWinner.uid, name: finalWinner.name, totalTime: finalWinner.totalTime, setAt: SERVER_TIMESTAMP };
                }
                return; // already set
            }).catch(() => {});
        }

        // Cinematic steps
        const steps = [
            { delay: 2800, html: `<p class="cinematic-big">🎬</p><p class="cinematic-big">Picture abhi baaki hai, mere dost!</p>` },
            { delay: 3200, html: `<p class="cinematic-medium">Four films…</p><p class="cinematic-medium">Four clues…</p><p class="cinematic-medium">And one little twist! 🌀</p>` },
            { delay: 3500, html: `<p class="cinematic-medium">Don't look at the heroes.</p><p class="cinematic-medium">Don't look at the dialogues.</p><p class="cinematic-medium">Don't look at the stories.</p>` },
            { delay: 2500, html: `<p class="cinematic-big">Look at the FILM NAMES. 👀</p>` },
            {
                delay: 4500,
                html: `
                    <div class="movie-clue-row"><span class="movie-clue-name">ACTION REPLAYY</span><span class="movie-clue-arrow">→</span><span class="movie-clue-letter">A</span></div>
                    <div class="movie-clue-row" style="animation-delay:0.3s"><span class="movie-clue-name">NAYAK</span><span class="movie-clue-arrow">→</span><span class="movie-clue-letter">N</span></div>
                    <div class="movie-clue-row" style="animation-delay:0.6s"><span class="movie-clue-name">SINGHAM</span><span class="movie-clue-arrow">→</span><span class="movie-clue-letter">S</span></div>
                    <div class="movie-clue-row" style="animation-delay:0.9s"><span class="movie-clue-name">HEYY BABYY</span><span class="movie-clue-arrow">→</span><span class="movie-clue-letter">H</span></div>`
            },
            {
                delay: 3500,
                html: `
                    <div class="letter-combiner">
                        <span class="combine-letter">A</span>
                        <span class="combine-plus">+</span>
                        <span class="combine-letter">N</span>
                        <span class="combine-plus">+</span>
                        <span class="combine-letter">S</span>
                        <span class="combine-plus">+</span>
                        <span class="combine-letter">H</span>
                    </div>`
            },
            {
                delay: 6000,
                confetti: true,
                html: `
                    <p class="final-name">ANSH</p>
                    <p class="superstar-text">OUR LITTLE SUPERSTAR 👶🏻❤️</p>
                    <p class="from-parents">Welcome to the world, Ansh!</p>
                    <p class="from-parents from-parents-gold">From Mom &amp; Dad — Utkarsha &amp; Rakesh</p>`
            }
        ];

        for (const step of steps) {
            await Animations.cinematicStep(scene, step.html, 400);
            if (step.confetti) Animations.launchConfetti(8000);
            await sleep(step.delay);
        }

        // Overall leaderboard + final balloon
        const isFinalWinner = finalWinner && finalWinner.uid === uid;

        const medals     = ["🥇","🥈","🥉"];
        const rankClass  = ["first","second","third"];
        const rankColor  = ["gold","silver","bronze"];

        const leaderboardHtml = leaderboard.length ? `
            <p class="section-title" style="margin:20px 0 12px">🏆 OVERALL CHAMPIONS</p>
            <ul class="leaderboard-list" style="max-width:480px;margin:0 auto">
                ${leaderboard.map((e,i) => `
                    <li class="leaderboard-item ${rankClass[i]||""}">
                        <span class="rank-number ${rankColor[i]||""}">${medals[i]||"#"+(i+1)}</span>
                        <span class="leaderboard-name ${e.uid===uid?"me":""}">${escHtml(e.name)}</span>
                        <span class="leaderboard-time">${e.totalTime.toFixed(1)}s</span>
                    </li>`).join("")}
            </ul>` : "";

        const balloonHtml = isFinalWinner ? `
            <p class="cinematic-medium" style="color:var(--gold);margin-top:24px">YOU ARE THE CHAMPION! 🎉</p>
            <div class="balloon-container" style="margin:16px auto">
                <div class="balloon-emoji" id="final-balloon-emoji">🎈</div>
                <div class="balloon-string"></div>
            </div>
            <button class="btn btn-primary btn-huge" id="pop-final-btn" onclick="window.App.handlePopFinalBalloon()">
                🎈 POP THE FINAL BALLOON!
            </button>` : `
            <p class="cinematic-medium text-muted" style="margin-top:24px">
                <span class="pulse-dot"></span>
                ${escHtml(finalWinner?.name || "The champion")} is about to reveal the final surprise…
            </p>`;

        await Animations.cinematicStep(scene, `
            <p class="cinematic-big" style="margin-bottom:8px">🏆 OVERALL LEADERBOARD</p>
            ${leaderboardHtml}
            <div class="divider" style="margin:20px auto"></div>
            ${balloonHtml}
        `, 400);

        _listenFinalBalloon();
    }

    async function handlePopFinalBalloon() {
        const btn = $("pop-final-btn");
        if (btn) btn.disabled = true;
        try {
            await GameEngine.popFinalBalloon(uid);
        } catch (err) {
            console.error(err);
            toast("Error — please try again.", "error");
            if (btn) btn.disabled = false;
        }
    }

    function _listenFinalBalloon() {
        if (finalBalloonOff) db.ref("balloons/final").off("value", finalBalloonOff);
        finalBalloonOff = db.ref("balloons/final").on("value", async snap => {
            if (snap.val()?.state === "popped") {
                db.ref("balloons/final").off("value", finalBalloonOff);
                finalBalloonOff = null;
                await _doFinalReveal();
            }
        });
    }

    async function _doFinalReveal() {
        const scene = $("cinematic-scene");
        if (!scene) return;

        const flash = document.createElement("div");
        flash.className = "pop-flash";
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 700);

        Animations.launchConfetti(10000);
        await sleep(700);

        await Animations.cinematicStep(scene, `
            <p class="final-name">ANSH</p>
            <p class="superstar-text">OUR LITTLE SUPERSTAR 👶🏻❤️</p>
            <p class="from-parents">Welcome to the world, Ansh!</p>
            <p class="from-parents from-parents-gold">From Mom &amp; Dad — Utkarsha &amp; Rakesh</p>
            <div class="divider" style="margin:28px auto"></div>
            <button class="btn btn-secondary" style="max-width:280px;margin-top:8px" onclick="window.App.handleReplay()">
                🔄 Watch Again
            </button>
        `, 400);
    }

    // ── Replay (client-side reset) ────────────────────────────
    function handleReplay() {
        locked       = false;
        pendingClick = false;
        riddleNum    = null;

        // Re-trigger game state handling
        if (gameState) {
            _handleStatusChange(gameState).catch(console.error);
        } else {
            setText("lobby-player-name", playerName);
            showScreen("lobby");
        }
    }

    // ── Public API ────────────────────────────────────────────
    return {
        init,
        toast,
        handleJoin,
        handleIKnowIt,
        handleConfirmYes,
        handleConfirmCancel,
        handlePopBalloon,
        handlePopFinalBalloon,
        handleReplay
    };
})();

document.addEventListener("DOMContentLoaded", () => window.App.init());
