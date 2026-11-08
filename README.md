# Jeopardy! Game

An interactive, browser-based Jeopardy game that pulls real trivia questions from a live API. Players select clues, self-report whether they got the answer right, and track their running score.

**Live demo:** https://jeopardy-game-one.vercel.app

## Features

- **Live trivia data** — 6 random categories fetched from the Rithm Jeopardy API on every game
- **Score tracking** — earn or lose points based on each clue's dollar value
- **Three-step clue flow** — select clue → read question → reveal answer → report result
- **Responsive design** — works on desktop, tablet, and mobile
- **Accessible** — ARIA labels, full keyboard play (Tab to a clue, Enter/Space to select and reveal), focus styles, reduced-motion support, and high-contrast mode

## How to Play

1. Open the [live demo](https://jeopardy-game-one.vercel.app), or open `index.html` locally (no build step needed)
2. Click **Start the Game!** to load 6 random categories
3. Click (or Tab to and press Enter on) any dollar amount to reveal the clue
4. Click the clue area to reveal the answer
5. Click **Got it** or **Missed it** to update your score
6. Complete all clues to see your final score

## Tech Stack

| Concern | Tool |
|---|---|
| DOM / events | jQuery |
| HTTP requests | Axios |
| Random sampling | Lodash `_.sampleSize` |
| Icons | Font Awesome 5 |
| Styles | Vanilla CSS with custom properties |

All dependencies are loaded via CDN — no npm install required.

## Architecture

```
index.html               # markup and CDN scripts
jeopardy.js              # game logic
  ├── CONFIG             # central constants (category count, clue count, API URL)
  ├── GameState          # single source of truth for game data and score
  ├── UIController       # all DOM reads/writes isolated here
  ├── JeopardyAPI        # API calls with error handling
  └── GameController     # orchestrates state + UI
style.css                # variables-driven, mobile-first stylesheet
```

The separation between `GameState`, `UIController`, and `JeopardyAPI` means each class has one responsibility and the game logic never touches the DOM directly.

## Running Locally

```bash
# Clone the repo
git clone https://github.com/zykia-j/Jeopardy-Game.git
cd Jeopardy-Game

# Open in browser (no server needed for basic play)
open index.html

# Or serve with any static server to avoid CORS issues on some browsers
npx serve .
```

## Potential Enhancements

- Persist high scores with `localStorage`
- Add a countdown timer per clue
- Support multiplayer (multiple named players taking turns)
- Allow choosing the number of categories or clue difficulty
