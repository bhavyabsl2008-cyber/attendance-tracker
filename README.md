<div align="center">

# Presynce

**Smart attendance tracking for Chitkara University CSE-1**

[Live App](https://bhavyabsl2008-cyber.github.io/attendance-tracker/) · [GitHub](https://github.com/bhavyabsl2008-cyber/attendance-tracker) · [Report a Bug](https://github.com/bhavyabsl2008-cyber/attendance-tracker/issues)

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-ready-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)
![Built with](https://img.shields.io/badge/built%20with-vanilla%20JS-yellow?style=flat-square)

</div>

---

## What is Presynce?

Chalkpad shows you numbers. Presynce tells you what they mean.

Most students check Chalkpad, see 73%, and guess whether that's safe. Presynce does the math — instantly. It knows your timetable, knows which subjects run on which days, and tells you exactly how many classes you can afford to miss, how many you need to attend to recover, and what happens to your percentage if you take a Directed Leave.

No backend. No login. Runs in your browser. Works offline.

---

## Features

**Timetable-aware DL simulation**
Select your batch (G1–G9) and lab group (A or B). Presynce loads your exact weekly schedule. When you take a Full Day DL, just pick the day — it auto-calculates which subjects were held and credits the right attendance to each one.

**Real-time attendance math**
Every card shows your current percentage, how many classes you can safely skip, how many you need to attend to recover, and a color-coded status (safe / warning / danger / debar).

**Leave simulator**
Three modes — Full Day DL (timetable-aware), Partial DL (only your subject), and ML (Medical Leave, +5 across all subjects). Each shows the exact new percentage before you commit.

**End-semester prediction**
Best-case and worst-case percentages at end of semester, based on remaining classes.

**Quick tap**
One tap to log "Attended" or "Missed" directly from the subject card. No menus.

**Export, import, share**
Export your data as JSON. Import it on another device. Generate a shareable link — all data is encoded in the URL, no server needed.

**PWA — installable**
Add to home screen on Android or iOS. Works offline once cached.

**Dark mode**
Follows system preference. Toggle manually in settings (coming soon).

---

## Screenshots

> *(Add screenshots here after capturing — app on mobile, dark mode, DL simulator, timetable modal)*

---

## Architecture

```
presynce/
├── index.html              — Main app shell
├── landing.html            — Marketing landing page
│
├── css/
│   ├── style.css           — All app styles, CSS variables, dark mode
│   └── timetable.css       — Timetable modal and onboarding styles
│
├── js/
│   ├── storage.js          — localStorage CRUD, export/import, URL sharing
│   ├── calculator.js       — Pure math engine (%, predictions, DL impact)
│   ├── settings.js         — Threshold management (50–95%)
│   ├── charts.js           — Chart.js bar chart with threshold line
│   ├── ui.js               — DOM rendering, cards, modals, toasts
│   ├── app.js              — Orchestrator, event binding, init
│   ├── timetable.js        — Hardcoded G1–G9 timetable data + logic
│   ├── timetable-ui.js     — Setup modal, week view, day editor, DL picker
│   └── darkmode.js         — Theme toggle with localStorage persistence
│
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
│
├── manifest.json           — PWA manifest
└── sw.js                   — Service worker (cache-first, offline support)
```

**Design decisions**

No framework. Vanilla JS is the right call for this scope — zero build step, instant load, easy for two first-year students to read and maintain. localStorage over a backend — export/share compensates for no cross-device sync. The timetable module is pure data — no DOM — so it can be tested or replaced independently.

---

## Tech Stack

| Layer | Tool |
|---|---|
| UI | Vanilla HTML/CSS/JS |
| Charts | Chart.js 4.4.1 |
| Fonts | DM Sans + DM Mono (Google Fonts) |
| Storage | localStorage |
| PWA | Web App Manifest + Service Worker |
| Hosting | GitHub Pages |

---

## How to Run Locally

```bash
git clone https://github.com/bhavyabsl2008-cyber/attendance-tracker.git
cd attendance-tracker

# Option 1: VS Code Live Server (recommended)
# Install "Live Server" extension → right click index.html → Open with Live Server

# Option 2: Python
python -m http.server 5501
# then open http://localhost:5501/index.html
```

No npm install. No build step. Just open and run.

---

## Data Schema

```json
{
  "subjects": [
    {
      "id": "uuid-string",
      "name": "C Programming",
      "delivered": 60,
      "attended": 54
    }
  ],
  "settings": {
    "threshold": 75
  }
}
```

localStorage keys: `chitkara_subjects_v3`, `chitkara_settings_v3`, `att_tracker_timetable_v1`

---

## Roadmap

- [ ] Settings page (dark mode toggle, threshold, reset)
- [ ] Timetable for other years / branches (CSE-2, ECE, etc.)
- [ ] Attendance history log with trend line
- [ ] Substitute day support (holiday swaps)
- [ ] Subject rename from card
- [ ] Notifications: "You have 2 classes today"

---

## Why We Built This

Chalkpad shows numbers. It doesn't tell you whether those numbers are okay.

Every student manually calculates: "I have 32/44. That's 72.7%. I need 75. How many classes do I need to attend?" We built Presynce so that calculation is instant, automatic, and timetable-aware. It's not just an attendance tracker — it's the tool we actually wanted to use ourselves.

Built in April–May 2026 as a first-year CSE project at Chitkara University.

---

## Authors

**Bhavya Bansal** — core architecture, JS logic, timetable module, all features
**Pranavi Salwan** — PWA icons, mobile responsive, dark mode

---

<div align="center">

Made at Chitkara University · CSE-1 · 2026

[Live App →](https://bhavyabsl2008-cyber.github.io/attendance-tracker/) · [GitHub →](https://github.com/bhavyabsl2008-cyber/attendance-tracker)

</div>
