# Jeopardy! Game

An interactive, browser-based Jeopardy game that pulls real trivia questions from a live API. Players select clues, self-report whether they got the answer right, and track their running score.

## Features

- **Live trivia data** — 6 random categories fetched from the Rithm Jeopardy API on every game
- **Score tracking** — earn or lose points based on each clue's dollar value
- **Three-step clue flow** — select clue → read question → reveal answer → report result
- **Responsive design** — works on desktop, tablet, and mobile
- **Accessible** — ARIA labels, keyboard navigation, focus styles, reduced-motion support, and high-contrast mode

## How to Play

1. Open `jeopardy-improved.html` in a browser (no build step needed)
2. Click **Start the Game!** to load 6 random categories
3. Click any dollar amount on the board to reveal the clue
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
jeopardy-improved.html   # markup and CDN scripts
jeopardy-improved.js     # game logic
  ├── CONFIG             # central constants (category count, clue count, API URL)
  ├── GameState          # single source of truth for game data and score
  ├── UIController       # all DOM reads/writes isolated here
  ├── JeopardyAPI        # API calls with error handling
  └── GameController     # orchestrates state + UI
style-improved.css       # variables-driven, mobile-first stylesheet
```

The separation between `GameState`, `UIController`, and `JeopardyAPI` means each class has one responsibility and the game logic never touches the DOM directly.

## Running Locally

```bash
# Clone the repo
git clone <repo-url>
cd Jeopardy-Game

# Open in browser (no server needed for basic play)
open jeopardy-improved.html

# Or serve with any static server to avoid CORS issues on some browsers
npx serve .
```

## Potential Enhancements

- Persist high scores with `localStorage`
- Add a countdown timer per clue
- Support multiplayer (multiple named players taking turns)
- Allow choosing the number of categories or clue difficulty
- Add keyboard shortcuts for faster play
