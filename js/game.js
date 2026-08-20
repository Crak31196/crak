// ============================================================
// GAME ENGINE  —  all Firebase read/write operations,
//                 winner transactions, leaderboard logic.
// No DOM manipulation happens here.
// ============================================================

window.GameEngine = (() => {

    // ── Static riddle data ────────────────────────────────────
    const RIDDLES = {
        1: {
            movie:    "Action Replayy",
            letter:   "A",
            dialogue: "Awaaz neeche!",
            text:
`A son is unhappy with his parents' marriage.

So he does something impossible… ⏰

He travels back in time to change their love story! ❤️😂

🎬 Guess the movie!`
        },
        2: {
            movie:    "Nayak",
            letter:   "N",
            dialogue: "Ek din ka CM!",
            text:
`One ordinary man. 👨

One crazy challenge…

Run the entire state for just ONE day! 🏛️

What happens when a common man suddenly gets the power to change everything?

🎬 Guess the movie!`
        },
        3: {
            movie:    "Singham",
            letter:   "S",
            dialogue: "Aata maajhi satakli!",
            text:
`One honest police officer. 👮‍♂️

One powerful criminal. 😈

And one man who refuses to bow down to anyone.

When corruption crosses the line…

the lion finally roars! 🦁🔥

🎬 Guess the movie!`
        },
        4: {
            movie:    "Heyy Babyy",
            letter:   "H",
            dialogue: "Baby ko sambhalo!",
            text:
`Three bachelors. 👨‍👨‍👦

One tiny baby. 👶

And absolutely zero experience with babies! 😂

Their carefree bachelor life suddenly becomes feeding, crying, diapers and sleepless nights!

🎬 Guess the movie!`
        }
    };

    // ── Register / update player ──────────────────────────────
    async function registerPlayer(uid, name) {
        const ref = db.ref(`players/${uid}`);

        // Preserve original joinedAt on reconnect
        const snap = await ref.once("value");
        const existing = snap.val();

        await ref.update({
            uid,
            name,
            joinedAt:  existing?.joinedAt || SERVER_TIMESTAMP,
            active:    true,
            lastSeen:  SERVER_TIMESTAMP
        });

        // Mark inactive on disconnect
        ref.onDisconnect().update({ active: false, lastSeen: SERVER_TIMESTAMP });
    }

    // ── Record "I KNOW IT!" click (server timestamp) ──────────
    // Returns the stored answer object (with server-assigned clickedAt).
    async function recordClick(riddleNum, uid, playerName) {
        const ref = db.ref(`answers/riddle${riddleNum}/${uid}`);

        // Idempotent — don't overwrite an existing click
        const snap = await ref.once("value");
        if (snap.val()) return snap.val();

        await ref.set({
            uid,
            name:      playerName,
            clickedAt: SERVER_TIMESTAMP,
            confirmed: false,
            riddleNum
        });

        // Read back to get the server-assigned timestamp
        const after = await ref.once("value");
        return after.val();
    }

    // ── Cancel click (user pressed CANCEL in dialog) ──────────
    async function cancelClick(riddleNum, uid) {
        const ref  = db.ref(`answers/riddle${riddleNum}/${uid}`);
        const snap = await ref.once("value");
        const data = snap.val();
        if (data && !data.confirmed) {
            await ref.remove();
        }
    }

    // ── Confirm answer + atomic winner claim ──────────────────
    // Returns { isWinner, winnerData, myResponseTime }
    async function claimWinner(riddleNum, uid, playerName) {
        // Fetch my stored click data
        const mySnap = await db.ref(`answers/riddle${riddleNum}/${uid}`).once("value");
        const myData = mySnap.val();
        if (!myData?.clickedAt) throw new Error("No click timestamp found.");

        // Mark as confirmed
        await db.ref(`answers/riddle${riddleNum}/${uid}`).update({
            confirmed:   true,
            confirmedAt: SERVER_TIMESTAMP
        });

        // Get riddle start time
        const startSnap  = await db.ref(`game/riddleTimestamps/${riddleNum}/startedAt`).once("value");
        const startedAt  = startSnap.val();
        if (!startedAt) throw new Error("Riddle start time not found.");

        const responseTime = (myData.clickedAt - startedAt) / 1000;

        // Atomic winner claim via transaction
        return new Promise((resolve, reject) => {
            db.ref(`winners/riddle${riddleNum}`).transaction(
                current => {
                    if (current === null) {
                        // First to claim — we win!
                        return {
                            uid,
                            name:         playerName,
                            clickedAt:    myData.clickedAt,
                            responseTime,
                            wonAt:        myData.clickedAt
                        };
                    }
                    return; // undefined → abort (someone already won)
                },
                (error, committed, snapshot) => {
                    if (error) { reject(error); return; }
                    resolve({
                        isWinner:       committed,
                        winnerData:     snapshot.val(),
                        myResponseTime: responseTime
                    });
                }
            );
        });
    }

    // ── Pop a riddle balloon ──────────────────────────────────
    async function popBalloon(riddleNum, uid) {
        const winnerSnap = await db.ref(`winners/riddle${riddleNum}`).once("value");
        const winner     = winnerSnap.val();
        if (!winner || winner.uid !== uid) throw new Error("Not authorised to pop this balloon.");

        const ref  = db.ref(`balloons/riddle${riddleNum}`);
        const snap = await ref.once("value");
        if (snap.val()) return; // already popped

        await ref.set({ state: "popped", winnerUid: uid, poppedAt: SERVER_TIMESTAMP });
    }

    // ── Pop the final (champion) balloon ─────────────────────
    async function popFinalBalloon(uid) {
        const snap = await db.ref("finalWinner/uid").once("value");
        if (snap.val() !== uid) throw new Error("Not authorised: not the final champion.");

        const ref  = db.ref("balloons/final");
        const existing = await ref.once("value");
        if (existing.val()) return;

        await ref.set({ state: "popped", winnerUid: uid, poppedAt: SERVER_TIMESTAMP });
    }

    // ── Riddle leaderboard ────────────────────────────────────
    // Returns [{uid, name, responseTime}] sorted by responseTime asc.
    async function getRiddleLeaderboard(riddleNum) {
        const [answersSnap, startSnap] = await Promise.all([
            db.ref(`answers/riddle${riddleNum}`).once("value"),
            db.ref(`game/riddleTimestamps/${riddleNum}/startedAt`).once("value")
        ]);

        const answers   = answersSnap.val() || {};
        const startedAt = startSnap.val();
        if (!startedAt) return [];

        return Object.values(answers)
            .filter(a => a.confirmed && a.clickedAt)
            .map(a => ({
                uid:          a.uid,
                name:         a.name,
                responseTime: (a.clickedAt - startedAt) / 1000
            }))
            .sort((a, b) => a.responseTime - b.responseTime);
    }

    // ── Overall leaderboard (sum of all riddle response times) ─
    // Returns [{uid, name, totalTime, count}] sorted asc.
    async function getOverallLeaderboard() {
        const [allAnswers, allTimestamps] = await Promise.all([
            db.ref("answers").once("value"),
            db.ref("game/riddleTimestamps").once("value")
        ]);

        const answers    = allAnswers.val()    || {};
        const timestamps = allTimestamps.val() || {};
        const totals     = {};

        for (let n = 1; n <= 4; n++) {
            const key       = `riddle${n}`;
            const startedAt = timestamps[n]?.startedAt;
            if (!startedAt) continue;

            const riddleAnswers = answers[key] || {};
            for (const [, a] of Object.entries(riddleAnswers)) {
                if (!a.confirmed || !a.clickedAt) continue;
                const rt = (a.clickedAt - startedAt) / 1000;

                if (!totals[a.uid]) {
                    totals[a.uid] = { uid: a.uid, name: a.name, totalTime: 0, count: 0 };
                }
                totals[a.uid].totalTime += rt;
                totals[a.uid].count     += 1;
            }
        }

        return Object.values(totals).sort((a, b) => a.totalTime - b.totalTime);
    }

    return {
        RIDDLES,
        registerPlayer,
        recordClick,
        cancelClick,
        claimWinner,
        popBalloon,
        popFinalBalloon,
        getRiddleLeaderboard,
        getOverallLeaderboard
    };
})();
