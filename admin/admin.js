// ============================================================
// ADMIN PANEL — Host Dashboard Logic
// Uses Firebase email/password auth.
// The signed-in UID must exist in /admins/{uid} in the database.
// ============================================================

// ── Firebase init — SEPARATE named app so admin auth is isolated ─
// Guest pages sign in anonymously; without isolation that auth-state
// change fires onAuthStateChanged here and signs the admin out.
const _adminApp = (() => {
    try { return firebase.app("admin-panel"); }
    catch(e) { return firebase.initializeApp(firebaseConfig, "admin-panel"); }
})();

const adminDb   = _adminApp.database();
const adminAuth = _adminApp.auth();

// ── State ─────────────────────────────────────────────────────
let adminUid       = null;
let gameStatus     = null;
let dashboardReady = false;   // prevents duplicate listener setup

// ── DOM helpers ───────────────────────────────────────────────
const $  = id => document.getElementById(id);
const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };

function log(msg, type = "") {
    const logEl = $("admin-log");
    if (!logEl) return;
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.prepend(entry);
    // Keep log to 50 lines
    while (logEl.children.length > 50) logEl.removeChild(logEl.lastChild);
}

// ── Auth ──────────────────────────────────────────────────────
async function handleLogin() {
    const email    = $("admin-email").value.trim();
    const password = $("admin-password").value;
    const errEl    = $("login-error");
    const btn      = $("login-btn");

    errEl.textContent = "";

    if (!email || !password) {
        errEl.textContent = "Email and password required.";
        return;
    }

    btn.disabled    = true;
    btn.textContent = "Signing in…";

    try {
        const cred = await adminAuth.signInWithEmailAndPassword(email, password);
        adminUid = cred.user.uid;

        // Verify this UID is in /admins
        const snap = await adminDb.ref(`admins/${adminUid}`).once("value");
        if (!snap.val()) {
            await adminAuth.signOut();
            errEl.textContent = "This account does not have admin access. Add your UID to /admins in Firebase Console.";
            btn.disabled    = false;
            btn.textContent = "Sign In";
            return;
        }

        showDashboard();
    } catch (err) {
        errEl.textContent = err.message || "Login failed.";
        btn.disabled    = false;
        btn.textContent = "Sign In";
    }
}

function handleSignOut() {
    dashboardReady = false;
    adminUid = null;
    adminAuth.signOut().then(() => {
        $("login-panel").style.display = "";
        $("dashboard").style.display   = "none";
        $("admin-password").value      = "";
    });
}

// ── Dashboard init ────────────────────────────────────────────
function showDashboard() {
    $("login-panel").style.display  = "none";
    $("dashboard").style.display    = "";
    set("signed-in-uid", `UID: ${adminUid}`);

    log(`Signed in as ${adminUid}`, "ok");

    listenToStatus();
    listenToPlayers();
}

// ── Listeners ─────────────────────────────────────────────────
function listenToStatus() {
    if (listenToStatus._on) return;
    listenToStatus._on = true;
    adminDb.ref("game/status").on("value", snap => {
        gameStatus = snap.val() || {};
        renderStatus(gameStatus);
    });
}

function listenToPlayers() {
    if (listenToPlayers._on) return;
    listenToPlayers._on = true;
    adminDb.ref("players").on("value", snap => {
        renderPlayers(snap.val() || {});
    });
}

// ── Render status ─────────────────────────────────────────────
function renderStatus(s) {
    const state    = s.state    || "waiting";
    const riddle   = s.currentRiddle || "—";

    set("status-state",   state.toUpperCase());
    set("status-riddle",  riddle);

    // Style badge
    const badge = $("status-badge");
    if (badge) {
        badge.className = `status-badge ${state}`;
        badge.textContent = state.toUpperCase();
    }

    // Load winner for current riddle
    if (s.currentRiddle) {
        adminDb.ref(`winners/riddle${s.currentRiddle}`).once("value").then(snap => {
            const w = snap.val();
            const winnerEl = $("status-winner");
            if (winnerEl) {
                winnerEl.innerHTML = w
                    ? `<div class="winner-display"><span>🏆</span><span class="w-name">${esc(w.name)}</span><span class="w-time">${typeof w.responseTime === "number" ? w.responseTime.toFixed(1)+"s" : ""}</span></div>`
                    : `<span style="color:var(--muted);font-size:.85rem">No winner yet</span>`;
            }
        });
    }

    updateButtonStates(state, riddle);
}

function updateButtonStates(state, riddle) {
    const isEnded = state === "ended";
    const isFinal = state === "final";

    // Derive a human-readable label for what "next" will do
    let nextLabel = "▶ START GAME";
    if (state === "playing" || state === "results") {
        if (riddle < 4) {
            nextLabel = `▶ NEXT  (Riddle ${riddle + 1})`;
        } else {
            nextLabel = "🎬 FINAL REVEAL!";
        }
    } else if (isFinal) {
        nextLabel = "⏹ END GAME";
    }

    const nextBtn = $("btn-next");
    if (nextBtn) { nextBtn.textContent = nextLabel; nextBtn.disabled = isEnded; }

    setBtn("btn-end-game",  !!state && !isEnded && !isFinal);
    setBtn("btn-reset-game", true);
}

function setBtn(id, enabled) {
    const el = $(id);
    if (el) el.disabled = !enabled;
}

// ── Render players ────────────────────────────────────────────
function renderPlayers(players) {
    const tbody = $("players-tbody");
    if (!tbody) return;

    const list = Object.values(players)
        .filter(p => p.name)
        .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

    set("player-count-badge", list.length);

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px">No players yet</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(p => `
        <tr>
            <td>${esc(p.name)}</td>
            <td><span class="${p.active ? "badge-active" : "badge-inactive"}">${p.active ? "● Active" : "○ Away"}</span></td>
            <td style="color:var(--muted);font-size:.8rem">${p.uid ? p.uid.substring(0,8)+"…" : "—"}</td>
            <td style="color:var(--muted);font-size:.75rem">${p.lastSeen ? new Date(p.lastSeen).toLocaleTimeString() : "—"}</td>
        </tr>
    `).join("");
}

// ── Admin actions ─────────────────────────────────────────────
async function adminAction(action, extra = {}) {
    try {
        log(`Running: ${action}…`);
        await _doAction(action, extra);
        log(`Done: ${action}`, "ok");
    } catch (err) {
        log(`Error: ${action} — ${err.message}`, "err");
        console.error(err);
    }
}

async function _doAction(action, extra) {
    const statusRef = adminDb.ref("game/status");

    switch (action) {
        case "next": {
            const state  = gameStatus?.state;
            const riddle = gameStatus?.currentRiddle || 0;

            if (!state || state === "waiting" || state === "ended") {
                // Start riddle 1
                await statusRef.update({ state: "playing", currentRiddle: 1 });
                await adminDb.ref("game/riddleTimestamps/1").set({ startedAt: SERVER_TIMESTAMP });
            } else if (state === "playing" || state === "results") {
                if (riddle < 4) {
                    const n = riddle + 1;
                    await statusRef.update({ state: "playing", currentRiddle: n });
                    await adminDb.ref(`game/riddleTimestamps/${n}`).set({ startedAt: SERVER_TIMESTAMP });
                } else {
                    await statusRef.update({ state: "final" });
                }
            } else if (state === "final") {
                await statusRef.update({ state: "ended" });
            }
            break;
        }

        case "endGame":
            await statusRef.update({ state: "ended" });
            break;

        case "resetGame":
            if (!confirm("⚠️ This will wipe ALL data including players. Are you sure?")) return;
            await Promise.all([
                adminDb.ref("game").remove(),
                adminDb.ref("answers").remove(),
                adminDb.ref("winners").remove(),
                adminDb.ref("balloons").remove(),
                adminDb.ref("finalWinner").remove(),
                adminDb.ref("players").remove()
            ]);
            await statusRef.set({ state: "waiting", currentRiddle: 0 });
            break;
    }
}

// ── Helpers ───────────────────────────────────────────────────
function esc(str) {
    return String(str ?? "")
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ── Auth state observer ───────────────────────────────────────
adminAuth.onAuthStateChanged(user => {
    if (user) {
        // Already on dashboard — token refreshed, nothing to do
        if (dashboardReady) return;

        adminUid = user.uid;
        adminDb.ref(`admins/${adminUid}`).once("value")
            .then(snap => {
                if (snap.val()) {
                    dashboardReady = true;
                    showDashboard();
                }
                // Not an admin — just stay on login, don't auto-signout
            })
            .catch(() => { /* permission denied — not an admin, ignore */ });
    } else {
        // Explicit sign-out — reset all flags so listeners restart on next login
        dashboardReady         = false;
        listenToStatus._on     = false;
        listenToPlayers._on    = false;
        $("login-panel").style.display = "";
        $("dashboard").style.display   = "none";
    }
});

// ── Enter key on password field ───────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const pw = $("admin-password");
    if (pw) pw.addEventListener("keydown", e => { if (e.key === "Enter") handleLogin(); });
});
