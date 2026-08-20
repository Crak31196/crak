# 🎬 ANSH — Real-Time Multiplayer Bollywood Name Reveal

A production-ready **real-time multiplayer** Bollywood-themed baby name reveal game.
Guests join from their phones and race to identify Bollywood movies from riddles.
The final reveal spells out **ANSH** — one letter per movie.

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | HTML + CSS + Vanilla JS (no build step) |
| Backend | Firebase Realtime Database |
| Auth | Firebase Anonymous Auth (guests) + Email/Password (admin) |
| Hosting | GitHub Pages or Firebase Hosting |
| Deployment | GitHub Actions (auto-deploy on push to `main`) |

---

## Firebase Setup (Step-by-Step)

### 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name it (e.g., `ansh-reveal`)
4. Disable Google Analytics (optional)
5. Click **Create project**

### 2. Enable Anonymous Authentication

1. Firebase Console → **Authentication** → **Get started**
2. Sign-in method → **Anonymous** → Enable → Save

### 3. Enable Email/Password Authentication (for admin)

1. Firebase Console → **Authentication** → Sign-in method
2. **Email/Password** → Enable → Save
3. Go to **Users** tab → **Add user**
4. Enter admin email + password → **Add user**
5. Copy the **UID** shown — you will need it in step 6
### 4. Create Realtime Database

1. Firebase Console → **Realtime Database** → **Create database**
2. Choose a region (e.g., `us-central1`)
3. Start in **test mode** (we will add proper rules next)
4. Click **Enable**
5. Copy the **Database URL** (e.g., `https://YOUR-PROJECT-default-rtdb.firebaseio.com`)

### 5. Get Firebase Web Config

1. Firebase Console → **Project Settings** (gear icon) → **General**
2. Scroll to **Your apps** → **Add app** → Choose **Web** (</> icon)
3. Register app (nickname: "web")
4. Copy the **firebaseConfig** object shown

### 6. Configure the App

Open `js/firebase.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
    apiKey:            "YOUR_ACTUAL_API_KEY",
    authDomain:        "YOUR_PROJECT.firebaseapp.com",
    databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID"
};
```

### 7. Set Up Admin Access

You need to manually add your admin UID to Firebase:

1. Firebase Console → **Realtime Database** → **Data**
2. Click the **+** button next to the root node
3. Add key: `admins`
4. Add child key: `YOUR_ADMIN_UID_FROM_STEP_3`
5. Value: `true`

The final structure should look like:
```
admins/
  abc123uid: true
```

### 8. Deploy Security Rules

**Option A — Firebase CLI:**
```bash
npm install -g firebase-tools
firebase login
firebase init database   # select your project
firebase deploy --only database
```

**Option B — Firebase Console:**
1. Firebase Console → **Realtime Database** → **Rules**
2. Paste the contents of `database.rules.json`
3. Click **Publish**

### 9. Add Audio Files

Place MP3 files in `assets/audio/`:

| File | Song |
|------|------|
| `action-replayy.mp3` | Action Replayy theme / title track |
| `nayak.mp3` | Nayak theme |
| `singham.mp3` | Singham theme |
| `heyy-babyy.mp3` | Heyy Babyy theme |

> The app works without audio files — it shows a soft notification if a file is missing.

---

## Running Locally

Firebase Auth and Realtime Database require an HTTP server (not `file://`).

```bash
# Python 3 (built-in)
cd /path/to/crak
python3 -m http.server 8080

# Then open:
# http://localhost:8080        ← Guest game
# http://localhost:8080/admin/ ← Host dashboard
```

---

## Testing Multiplayer

1. Start the server: `python3 -m http.server 8080`
2. Open **3+ browser tabs** pointing to `http://localhost:8080`
3. Each tab = one player (Firebase anonymous auth gives each a unique UID)
4. Open a 4th tab at `http://localhost:8080/admin/` and sign in
5. Use the admin panel to start riddles and observe synchronization

---

## GitHub Pages Deployment

### One-time setup

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Initial game setup"
   git push -u origin main
   ```

2. GitHub → your repo → **Settings** → **Pages**
3. Source: **GitHub Actions**

### Auto-deploy

Every push to `main` triggers `.github/workflows/deploy.yml` which deploys automatically.

Your live URL will be:
```
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/
```

Share this URL with guests via WhatsApp!

---

## How the Game Works

### Guest Flow

1. Guest opens the URL on their phone
2. Enters their name → joins the lobby
3. Waits until host starts game
4. For each riddle: reads the clue, taps **"I KNOW IT!"**, confirms
5. First to confirm wins the riddle → gets to pop the balloon
6. After all 4 riddles: watches the final cinematic ANSH reveal

### Host / Admin Flow

1. Open `/admin/` → sign in with Firebase email/password
2. **Start Game** → sets game to waiting state
3. **Riddle 1 — A** → starts first riddle (server timestamp recorded)
4. Wait for a winner to pop the balloon
5. **Show Results** → displays riddle leaderboard
6. **Riddle 2 — N** → repeat for riddles 2, 3, 4
7. **Final Reveal!** → triggers cinematic ANSH sequence
8. Overall winner pops the final golden balloon

---

## Winner & Timing Logic

| Concept | Implementation |
|---------|---------------|
| Click timestamp | Firebase `ServerValue.TIMESTAMP` — NOT `Date.now()` |
| Riddle start time | Set by admin via `ServerValue.TIMESTAMP` |
| Response time | `(clickedAt − riddleStartedAt) / 1000` seconds |
| Winner selection | Firebase atomic transaction on `winners/riddle{N}` |
| Race condition safety | Transaction aborts if winner already exists |
| Balloon pop auth | DB rule: `winners/riddle{N}/uid === auth.uid` |
| Final champion | Client-calculated (sum of response times), set via transaction |

---

## Firebase Database Structure

```
game/
  status/
    currentRiddle: 1
    state: "waiting" | "playing" | "results" | "final" | "ended"
    startedAt: timestamp
  riddleTimestamps/
    1/  startedAt: timestamp
    2/  startedAt: timestamp
    3/  startedAt: timestamp
    4/  startedAt: timestamp

players/
  {uid}/
    name: "Rahul"
    uid: "abc..."
    joinedAt: timestamp
    active: true
    lastSeen: timestamp

answers/
  riddle1/
    {uid}/
      uid, name, clickedAt, confirmed, confirmedAt

winners/
  riddle1/
    uid, name, clickedAt, responseTime, wonAt

balloons/
  riddle1/
    state: "popped", winnerUid, poppedAt
  final/
    state: "popped", winnerUid, poppedAt

finalWinner/
  uid, name, totalTime, setAt

admins/
  {adminUid}: true
```

---

## Resetting the Game

**Reset current riddle only:**  
Admin panel → **Reset Riddle** (clears answers, winner, balloon for current riddle)

**Full reset:**  
Admin panel → **Reset All** (clears all game data, all answers, all winners)

---

## Security Notes

- Firebase client config (API keys) are **not secrets** — they identify your project, not authenticate you
- Security is enforced by **Firebase Security Rules** (`database.rules.json`)
- Admin access is controlled by the `/admins` node in the database
- Players cannot modify each other's data or overwrite the winner
- Response times are computed from server-authoritative timestamps

---

## Folder Structure

```
/
├── index.html              ← Guest game
├── database.rules.json     ← Firebase security rules
├── firebase.json           ← Firebase hosting config
├── .gitignore
│
├── css/
│   └── style.css
│
├── js/
│   ├── firebase.js         ← Config (edit this!)
│   ├── audio.js
│   ├── animations.js
│   ├── game.js             ← Firebase game logic
│   └── app.js              ← UI controller
│
├── admin/
│   ├── index.html          ← Host dashboard
│   ├── admin.css
│   └── admin.js
│
├── assets/
│   ├── audio/              ← Add .mp3 files here
│   └── images/
│
└── .github/
    └── workflows/
        └── deploy.yml      ← Auto GitHub Pages deploy
```
