// ============================================================
// ANIMATIONS  —  confetti, balloon pop, letter reveals
// ============================================================

window.Animations = (() => {
    // ── Canvas setup ──────────────────────────────────────────
    let canvas, ctx;
    let particles = [];
    let raf       = null;
    let running   = false;

    const PALETTE = [
        "#ffd700","#d4af37","#ff6b35","#e63946",
        "#ff9f1c","#c8b8ff","#80ffdb","#ffffff"
    ];

    function initCanvas() {
        canvas = document.getElementById("confetti-canvas");
        if (!canvas) return false;
        ctx = canvas.getContext("2d");
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return true;
    }

    function resizeCanvas() {
        if (!canvas) return;
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // ── Confetti ──────────────────────────────────────────────
    function launchConfetti(durationMs = 4000) {
        if (!canvas && !initCanvas()) return;

        const count = window.innerWidth < 480 ? 90 : 160;

        for (let i = 0; i < count; i++) {
            particles.push({
                x:      Math.random() * canvas.width,
                y:      -(Math.random() * canvas.height * 0.3),
                vx:     (Math.random() - 0.5) * 4,
                vy:     Math.random() * 3 + 1.5,
                color:  PALETTE[Math.floor(Math.random() * PALETTE.length)],
                w:      Math.random() * 10 + 4,
                h:      Math.random() * 6  + 3,
                rot:    Math.random() * 360,
                spin:   (Math.random() - 0.5) * 8,
                gravity:0.06
            });
        }

        if (!running) {
            running = true;
            tick();
        }

        setTimeout(() => fadeOutConfetti(), durationMs);
    }

    function tick() {
        if (!running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles = particles.filter(p => p.y < canvas.height + 20);

        for (const p of particles) {
            p.x   += p.vx;
            p.y   += p.vy;
            p.vy  += p.gravity;
            p.rot += p.spin;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.globalAlpha = p.alpha ?? 1;
            ctx.fillStyle   = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }

        raf = requestAnimationFrame(tick);
    }

    function fadeOutConfetti() {
        const fade = setInterval(() => {
            particles.forEach(p => { p.alpha = (p.alpha ?? 1) - 0.02; });
            particles = particles.filter(p => (p.alpha ?? 1) > 0);
            if (particles.length === 0) {
                running = false;
                cancelAnimationFrame(raf);
                clearInterval(fade);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }, 30);
    }

    function stopConfetti() {
        running  = false;
        particles = [];
        cancelAnimationFrame(raf);
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // ── Balloon pop sequence ──────────────────────────────────
    // Returns a Promise that resolves after the pop animation.
    function balloonPop(balloonEl) {
        return new Promise(resolve => {
            if (!balloonEl) { resolve(); return; }

            // Grow briefly, then shrink away
            balloonEl.style.transition = "transform 0.15s ease, opacity 0.3s ease";
            balloonEl.style.transform  = "scale(1.4)";

            setTimeout(() => {
                balloonEl.style.transform  = "scale(0)";
                balloonEl.style.opacity    = "0";

                // White flash overlay
                const flash    = document.createElement("div");
                flash.className = "pop-flash";
                document.body.appendChild(flash);
                setTimeout(() => flash.remove(), 600);

                setTimeout(resolve, 350);
            }, 150);
        });
    }

    // ── Progress-bar letter reveal ────────────────────────────
    // revealedCount: how many letters have been revealed (0-4)
    function updateProgressLetters(revealedCount) {
        const letters = ["A", "N", "S", "H"];

        // Handle multiple .progress-bar instances on the page
        document.querySelectorAll(".progress-bar").forEach(bar => {
            const cells = bar.querySelectorAll(".progress-letter");
            cells.forEach((cell, i) => {
                const span = cell.querySelector(".letter-char");
                if (i < revealedCount) {
                    if (span) span.textContent = letters[i];
                    if (!cell.classList.contains("revealed")) {
                        cell.classList.add("revealed");
                    }
                } else {
                    if (span) span.textContent = "?";
                    cell.classList.remove("revealed");
                }
            });
        });
    }

    // ── Cinematic text step helper ────────────────────────────
    // Fades a container out, replaces innerHTML, fades back in.
    function cinematicStep(container, html, fadeDuration = 400) {
        return new Promise(resolve => {
            container.style.transition = `opacity ${fadeDuration}ms ease`;
            container.style.opacity    = "0";
            setTimeout(() => {
                container.innerHTML        = html;
                container.style.opacity    = "1";
                setTimeout(resolve, fadeDuration);
            }, fadeDuration);
        });
    }

    // ── Spotlight pulse on an element ────────────────────────
    function spotlight(el) {
        if (!el) return;
        el.classList.add("spotlight-pulse");
        setTimeout(() => el.classList.remove("spotlight-pulse"), 1200);
    }

    return {
        initCanvas,
        launchConfetti,
        stopConfetti,
        balloonPop,
        updateProgressLetters,
        cinematicStep,
        spotlight
    };
})();
