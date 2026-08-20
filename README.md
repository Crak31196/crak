# 🎬 ANSH — Bollywood Baby Name Reveal

A premium, fully static Bollywood-themed baby name reveal website.
Guests solve four Bollywood movie riddles whose first letters spell **ANSH**.

**Live demo:** `https://<USERNAME>.github.io/<REPOSITORY-NAME>/`

---

## 🎭 How It Works

| Film # | Movie | First Letter |
|--------|-------|-------------|
| 1 | Action Replayy | **A** |
| 2 | Nayak | **N** |
| 3 | Singham | **S** |
| 4 | Heyy Babyy | **H** |

Together: **A + N + S + H = ANSH** 🎉

---

## 📁 Project Structure

```
/
├── index.html                  ← Single-page app entry point
├── css/
│   └── style.css               ← All styles (premium Bollywood theme)
├── js/
│   └── script.js               ← All interactivity (vanilla JS)
├── assets/
│   ├── audio/
│   │   ├── action-replayy.mp3  ← Drop your MP3 files here
│   │   ├── nayak.mp3
│   │   ├── singham.mp3
│   │   └── heyy-babyy.mp3
│   └── images/
│       └── og-preview.png      ← Optional Open Graph preview image
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub Actions auto-deploy
├── .gitignore
└── README.md
```

---

## 🎵 Adding Audio Files

The website gracefully handles missing MP3 files (shows "Audio coming soon").

To enable audio playback, copy your MP3 files into `assets/audio/`:

```
assets/audio/action-replayy.mp3
assets/audio/nayak.mp3
assets/audio/singham.mp3
assets/audio/heyy-babyy.mp3
```

> ⚠️ Do **not** commit copyrighted movie audio to a public repository.
> Keep audio files local or use a private repository.

---

## 💻 Running Locally

Because the site uses `fetch`-compatible relative paths, open it via an
HTTP server rather than directly from the file system.

**Option A — Python (built in on macOS/Linux):**

```bash
cd /path/to/crak
python3 -m http.server 8080
```

Then open: `http://localhost:8080`

**Option B — Node.js `serve`:**

```bash
npx serve .
```

**Option C — VS Code Live Server extension:**
Right-click `index.html` → "Open with Live Server"

---

## 🚀 Deploying to GitHub Pages

### Step 1 — Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it (e.g. `ansh-name-reveal`)
3. Set it to **Public** (required for free GitHub Pages)
4. Do **not** initialise with README (you already have one)
5. Click **Create repository**

### Step 2 — Push your code

Run these commands in the project folder:

```bash
git init
git add .
git commit -m "Create ANSH name reveal website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values.

### Step 3 — Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **GitHub Actions**
4. Save

The workflow in `.github/workflows/deploy.yml` will trigger automatically
on every push to `main` and deploy the site.

### Step 4 — Get your shareable URL

After the first deployment completes (usually ~60 seconds), your site
will be live at:

```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

Share this link on WhatsApp with your guests! 🎉

---

## 🔁 Pushing Updates

After adding audio files or making any changes:

```bash
git add .
git commit -m "Add audio files"
git push
```

GitHub Actions will automatically redeploy within ~60 seconds.

---

## ✨ Features

- 📱 **Mobile-first** — designed for phones shared via WhatsApp
- 🎬 **4 Bollywood riddles** with progressive letter reveals
- 🔊 **Custom audio player** — graceful fallback if MP3 missing
- ✨ **Cinematic animations** — particles, spotlight, confetti
- ♿ **Accessible** — semantic HTML, ARIA labels, keyboard nav
- 🎞️ **Respects prefers-reduced-motion**
- 🚀 **Zero dependencies** — pure HTML, CSS, vanilla JS
- 🌐 **Works on GitHub Pages** — all relative paths, no build step

---

## 🛠️ Customisation

All riddle data, dialogue, and the baby's name are defined at the top
of `js/script.js` in the `RIDDLES` array. The climax beats are in
`CLIMAX_BEATS`. Both are easy to edit.

Parent names ("Utkarsha & Rakesh") appear in `index.html`.
