# Presynce — Smart Attendance Tracking for Chitkara CSE-1

Know your attendance in real time. Presynce calculates your exact attendance impact before you decide to miss a class.

**[→ Open Presynce](https://bhavyabsl2008-cyber.github.io/attendance-tracker/)**  
**[→ Read about Presynce](https://bhavyabsl2008-cyber.github.io/attendance-tracker/landing.html)**

-----

## What is Presynce?

Every CSE-1 student manually calculates: “I have 32/44. That’s 72.7%. I need 75%. How many classes do I need to attend?”

Presynce answers that question instantly. It’s a timetable-aware attendance tracker that:

- Shows your current %, how many classes you can safely skip, and how many you need to attend to recover
- Auto-calculates Full Day DL impact based on your batch (G1–G9) and group (A/B)
- Runs 100% offline — no account, no server, no login
- Works as a PWA — install on Android or iOS home screen
- Uses the actual Chitkara attendance formula, not guesses

-----

## Features

### 📅 Timetable-aware DL calculation

Select your batch and group. Pick a day for Full Day DL, and Presynce auto-calculates which subjects were held and credits the right attendance to each.

### 📊 Real-time calculations

Every subject card shows:

- Current attendance %
- How many classes you can safely miss
- How many you need to attend to hit your threshold
- Best-case and worst-case predictions for end of semester
- Exact impact per skip/attend (dynamically calculated)

### 🎭 Three leave simulators

- **Full Day DL** — timetable-aware, affects multiple subjects
- **Partial DL** — single subject only
- **Medical Leave (ML)** — +5 to all subjects

See exact new percentages before committing.

### ⚡ Quick tap

One-tap “Attended” or “Missed” logging directly from the card. Designed for mobile speed.

### 📱 Progressive Web App (PWA)

- Add to home screen on Android or iOS
- Works fully offline once cached
- No app store. No account. No backend.

-----

## How the Math Works

Chitkara uses a **percentage-based formula**, not linear:

```
Attendance % = (Attended / Delivered) × 100
```

### Example

Current: 75/80 = **93.75%**

Skip 1 class:

- Attended stays 75 (you didn’t attend)
- Delivered becomes 81 (class was held)
- New %: 75/81 = **92.59%** (−1.16%)

Attend 1 class:

- Attended becomes 76
- Delivered becomes 81
- New %: 76/81 = **93.83%** (+0.08%)

**Key insight**: Impact scales with total classes held. At 50 classes, skipping costs ~2%. At 100 classes, ~1%. Attending gains less than skipping costs because the denominator increases in both cases.

-----

## Status Thresholds

|Attendance|Status        |What it means                                |
|----------|--------------|---------------------------------------------|
|90%+      |Very Safe     |You can skip confidently                     |
|80–89%    |Comfortable   |Some cushion, be careful                     |
|75–79%    |Risk Zone     |Any skip costs ~2%, must attend strategically|
|<75%      |Detention Risk|At risk of being debarred from exams         |

-----

## Tech Stack

- **Vanilla JavaScript** — no frameworks, no build step
- **HTML5 + CSS3** — responsive, mobile-first
- **Chart.js 4.4** — attendance visualization
- **Service Worker + Web App Manifest** — PWA support
- **localStorage** — client-side persistence
- **GitHub Pages** — free hosting
- **System fonts** — fast, clean typography

-----

## Architecture

```
js/
├── storage.js        // localStorage CRUD, import/export JSON, URL sharing
├── calculator.js     // Pure math engine (percentage, status, predictions)
├── settings.js       // Threshold management (50–95%, default 75%)
├── timetable.js      // G1–G9 hardcoded timetable data
├── timetable-ui.js   // Timetable modal UI, day editor, DL picker
├── charts.js         // Chart.js bar chart with threshold line
├── ui.js             // All DOM rendering (cards, simulators, toasts)
├── app.js            // Main orchestrator, event binding
├── darkmode.js       // Dark mode toggle, system preference detection
└── sw.js             // Service worker for offline support

css/
├── style.css         // Main app styles
└── timetable.css     // Timetable modal styles

index.html           // Main app
landing.html         // Marketing/info page
manifest.json        // PWA metadata
```

-----

## Data Schema

All data is stored in `localStorage` under these keys:

```json
{
  "chitkara_subjects_v3": [
    { "id": "uuid-string", "name": "C Programming", "delivered": 60, "attended": 54 }
  ],
  "chitkara_settings_v3": { "threshold": 75 },
  "att_tracker_timetable_v1": { "batch": "G6", "group": "A", "customOverrides": {} }
}
```

No server. No account. Just JSON in the browser.

-----

## How to Run Locally

1. Clone the repo:
   
   ```bash
   git clone https://github.com/bhavyabsl2008-cyber/attendance-tracker.git
   cd attendance-tracker
   ```
1. Open in a local server (required for Service Worker):
   
   ```bash
   python -m http.server 5000
   # or
   npx http-server
   ```
1. Visit `http://localhost:5000`

-----

## Features Roadmap

- [ ] Settings page (threshold, reset data, dark mode toggle)
- [ ] Attendance history/trend line
- [ ] Support for other batches/branches
- [ ] Push notifications for critical thresholds
- [ ] Live timetable fetch from JSON URL
- [ ] Substitute day support
- [ ] Export to CSV
- [ ] Dark mode improvements

-----

## Why We Built This

Chalkpad shows numbers. It doesn’t tell you what they mean.

Every student manually calculates: “I have 32/44. That’s 72.7%. I need 75%. How many classes do I need to attend?”

We built Presynce so that calculation is instant, automatic, and **timetable-aware**. It’s not just an attendance tracker — it’s the tool we actually wanted to use ourselves.

-----

## Known Issues

- `manifest.json` may return 404 on some browsers (doesn’t affect functionality)
- Timetable data is hardcoded for G1–G9; custom batches not yet supported
- Subject name matching between timetable codes and user entries is manual

-----

## Contributing

Found a bug? Want to improve something? [Open an issue](https://github.com/bhavyabsl2008-cyber/attendance-tracker/issues) or submit a pull request.

-----

## Authors

Built in April–May 2026 as a first-year CSE project at Chitkara University.

- **Bhavya Bansal** — Lead dev, calculator logic, timetable integration
- **Pranavi Salwan** — Co-dev, UI refinement, leave simulator

-----

## License

MIT License — use freely, modify, distribute.

-----

## Support

- **Report a bug**: [GitHub Issues](https://github.com/bhavyabsl2008-cyber/attendance-tracker/issues)
- **Questions**: Open an issue with the `question` label
- **Feedback**: We’d love to hear what you think!

-----

**Presynce v1.0** · Chitkara University · CSE-1 · Jan–Jun 2026