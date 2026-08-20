// ============================================================
// AUDIO MANAGER
// Handles all background music / sound effects.
// Gracefully silences itself when audio files are missing.
// ============================================================

window.AudioManager = (() => {
    let current = null;
    let enabled  = true;

    // Update filenames below to match what you have in assets/audio/
    const TRACKS = {
        1: "assets/audio/action-replayy.mp3",
        2: "assets/audio/nayak.mp3",
        3: "assets/audio/singham.mp3",
        4: "assets/audio/heyy-babby.mp3"   // rename to heyy-babyy.mp3 if preferred
    };

    function play(riddleNum) {
        if (!enabled) return;
        stop();

        const src = TRACKS[riddleNum];
        if (!src) return;

        const audio    = new Audio(src);
        audio.volume   = 0.55;
        audio.loop     = true;

        audio.addEventListener("error", () => {
            // File missing — show non-blocking notice once per riddle
            showAudioNotice(riddleNum);
        });

        audio.play().catch(() => {
            // Autoplay policy blocked; user gesture required — ignore silently
        });

        current = audio;
    }

    function stop() {
        if (current) {
            current.pause();
            current.currentTime = 0;
            current = null;
        }
    }

    function setEnabled(flag) {
        enabled = flag;
        if (!flag) stop();
    }

    function isPlaying() {
        return current !== null && !current.paused;
    }

    function showAudioNotice(riddleNum) {
        // Soft, one-line toast — does not break the game
        if (window.App && typeof App.toast === "function") {
            App.toast(`🎵 Audio file ${riddleNum} not found — add MP3s to assets/audio/`, "", 4000);
        }
    }

    return { play, stop, setEnabled, isPlaying };
})();
