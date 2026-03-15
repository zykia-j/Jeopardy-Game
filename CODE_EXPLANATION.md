# Jeopardy Game — Code Explanation

This document walks through every line of all three source files for use as a job-interview reference.

---

## Table of Contents

1. [HTML — `jeopardy-improved.html`](#html)
2. [JavaScript — `jeopardy-improved.js`](#javascript)
3. [CSS — `style-improved.css`](#css)

---

## HTML — `jeopardy-improved.html` <a name="html"></a>

```html
<!doctype html>
```
**Line 1** — Declares the document type as HTML5. The lowercase `doctype` is valid and signals to the browser to use standards mode rendering instead of quirks mode.

```html
<html lang="en">
```
**Line 2** — Opens the root HTML element. The `lang="en"` attribute tells browsers and screen readers the page is in English, which helps with text-to-speech pronunciation and search engine indexing.

```html
<head>
```
**Line 3** — Opens the `<head>` section, which contains metadata the browser needs but does not display directly.

```html
  <meta charset="UTF-8">
```
**Line 4** — Sets the character encoding to UTF-8, ensuring special characters (accented letters, symbols, emoji) render correctly across all platforms.

```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
```
**Line 5** — The viewport meta tag controls how the page scales on mobile devices. `width=device-width` makes the layout match the screen width, and `initial-scale=1.0` prevents the browser from zooming in or out on load.

```html
  <meta name="description" content="Interactive Jeopardy game - test your knowledge across various categories">
```
**Line 6** — Provides a short description of the page used by search engines for their result snippets. This is an SEO and discoverability best practice.

```html
  <title>Jeopardy! Game</title>
```
**Line 7** — Sets the text shown in the browser tab and used as the default bookmark name.

```html
  <link rel="stylesheet" href="style-improved.css">
```
**Line 9** — Links to the local CSS file. Placing stylesheets in `<head>` ensures styles are downloaded before the browser paints the page, preventing a flash of unstyled content (FOUC).

```html
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/css/all.min.css"
    crossorigin="anonymous"
  >
```
**Lines 10–14** — Loads Font Awesome 5 icon library from a CDN. The `crossorigin="anonymous"` attribute enables CORS (Cross-Origin Resource Sharing), required for the browser to validate the resource's integrity without sending user credentials.

```html
<body>
```
**Line 16** — Opens the `<body>`, which contains all visible page content.

```html
  <header>
    <h1>Jeopardy!</h1>
    <div class="header-controls">
```
**Lines 17–19** — Semantic `<header>` element groups the page title and controls. Using `<header>` instead of a generic `<div>` communicates purpose to screen readers and search engines. The `<h1>` is the most important heading on the page.

```html
      <button id="play" type="button" aria-label="Start or restart the game">
        Start the Game!
      </button>
```
**Lines 20–22** — The primary action button. `type="button"` explicitly prevents it from submitting any parent form. `aria-label` provides a descriptive label for screen readers, which is especially helpful when button text alone isn't descriptive enough.

```html
      <div id="score" aria-live="polite" aria-label="Current score">
        Score: $<span id="score-value" class="score-zero">0</span>
      </div>
```
**Lines 23–25** — The score display. `aria-live="polite"` tells screen readers to announce updates to this region when the user is idle — appropriate for non-urgent score changes. The inner `<span>` is targeted by JavaScript to update only the number, keeping the "Score: $" text static.

```html
  <main>
    <section aria-live="polite" aria-atomic="true">
```
**Lines 29–30** — `<main>` marks the primary content area of the page. `aria-live="polite"` on the `<section>` announces updates; `aria-atomic="true"` tells screen readers to read the entire updated region as a unit rather than announcing individual changes.

```html
      <table role="grid" aria-label="Jeopardy game board">
        <thead>
          <tr id="categories" role="row">
            <!-- Category headers will be inserted here dynamically -->
          </tr>
        </thead>
        <tbody>
          <!-- Clue rows will be inserted here dynamically -->
        </tbody>
      </table>
```
**Lines 31–40** — The game board is a `<table>` because data is genuinely tabular: categories are columns, point values are rows. `role="grid"` enhances semantics for interactive grids. The `<thead>` / `<tbody>` split helps browsers optimize rendering. Both sections are empty initially; JavaScript fills them in after data is fetched from the API.

```html
      <div
        id="active-clue"
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        tabindex="0"
        aria-label="Current clue display">
        <!-- Active clue content (question/answer) will appear here -->
      </div>
```
**Lines 42–50** — The clue display panel. `role="status"` combined with `aria-live="assertive"` causes screen readers to interrupt and announce changes immediately — appropriate because a newly revealed clue is time-sensitive information. `tabindex="0"` makes the `<div>` focusable via keyboard so users can interact with it without a mouse.

```html
  <div
    id="spinner"
    class="disabled"
    role="status"
    aria-label="Loading game data"
    aria-live="polite">
    <i class="fa fa-spin fa-spinner" aria-hidden="true"></i>
    <span class="sr-only">Loading...</span>
  </div>
```
**Lines 54–62** — A loading spinner displayed while data is fetched. It starts with `class="disabled"` (which the CSS hides with `display: none`). `aria-hidden="true"` on the icon prevents screen readers from reading a meaningless class name; the `sr-only` span provides the equivalent text. `class="sr-only"` is a common utility class that visually hides text while keeping it accessible.

```html
  <script src="https://unpkg.com/jquery" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/axios/dist/axios.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/lodash" crossorigin="anonymous"></script>
  <script src="jeopardy-improved.js"></script>
```
**Lines 65–68** — Scripts are placed at the bottom of `<body>` so the browser parses and renders all HTML before downloading JavaScript, which speeds up the perceived page load. The order matters: jQuery, Axios, and Lodash are loaded before the game script that depends on them. `crossorigin="anonymous"` serves the same CORS purpose as on the CSS link above.

---

## JavaScript — `jeopardy-improved.js` <a name="javascript"></a>

### Configuration Object (Lines 1–8)

```js
const CONFIG = {
  API_URL: "https://rithm-jeopardy.herokuapp.com/api/",
  NUMBER_OF_CATEGORIES: 6,
  NUMBER_OF_CLUES_PER_CATEGORY: 5,
  MIN_CLUES_PER_CATEGORY: 5,
  CATEGORY_FETCH_COUNT: 100,
};
```
All magic numbers and the API URL are pulled into a single `CONFIG` object at the top of the file. This is the **single source of truth** pattern — to change game rules (e.g., 8 categories instead of 6), you edit one place. Using `const` prevents accidental reassignment of the object reference.

---

### `GameState` Class (Lines 11–53)

```js
class GameState {
  constructor() {
    this.categories = [];
    this.activeClue = null;
    this.activeClueMode = 0;
    this.isPlayButtonClickable = true;
    this.totalCluesRemaining = 0;
    this.score = 0;
  }
```
**Lines 11–19** — `GameState` is a class that centralizes all mutable game data. Grouping state here — rather than scattering variables across functions — makes the data flow easy to reason about and debug.

- `categories`: Array of category objects (each with id, title, and remaining clues).
- `activeClue`: The clue object currently being shown, or `null` when no clue is selected.
- `activeClueMode`: A numeric state machine: `0` = board selection, `1` = question visible, `2` = answer visible.
- `isPlayButtonClickable`: Guards against double-clicks during loading.
- `totalCluesRemaining`: Tracks how many clues are left on the board.
- `score`: The player's current score in dollars.

```js
  reset() {
    this.categories = [];
    this.activeClue = null;
    this.activeClueMode = 0;
    this.totalCluesRemaining = CONFIG.NUMBER_OF_CATEGORIES * CONFIG.NUMBER_OF_CLUES_PER_CATEGORY;
    this.score = 0;
    UIController.updateScoreDisplay(0);
  }
```
**Lines 21–28** — Resets all state to initial values before each new game. Computing `totalCluesRemaining` from `CONFIG` keeps it in sync if those values ever change. Calling `UIController.updateScoreDisplay(0)` here ensures the UI always matches the state object.

```js
  removeClue(categoryId, clueId) {
    const catId = parseInt(categoryId, 10);
    const cId = parseInt(clueId, 10);

    const category = this.categories.find(c => c.id === catId);
    if (!category) return;

    category.clues = category.clues.filter(cl => cl.id !== cId);
    this.totalCluesRemaining--;

    if (category.clues.length === 0) {
      this.categories = this.categories.filter(c => c.id !== catId);
    }
  }
```
**Lines 30–43** — Removes a clue from state once a player has selected it. `parseInt(..., 10)` converts the HTML `data-*` attribute strings (always strings) to integers for reliable comparison. After filtering out the clue, if the category has no clues left it is removed from the array entirely. This keeps the state lean and makes `isGameOver()` accurate.

```js
  updateScore(delta) {
    this.score += delta;
    UIController.updateScoreDisplay(this.score);
  }
```
**Lines 45–48** — Updates the score by a delta (positive for correct, negative for incorrect) and immediately syncs the UI. Keeping UI updates inside state mutations ensures the display is never out of sync.

```js
  isGameOver() {
    return this.categories.length === 0;
  }
```
**Lines 50–52** — The game ends when all category arrays are empty (all clues exhausted). A one-liner that reads clearly.

```js
const gameState = new GameState();
```
**Line 55** — Creates a single shared instance of `GameState`. This is the **singleton pattern** — there is always exactly one game state object that all other classes reference.

---

### `UIController` Class (Lines 58–168)

All methods are `static` because `UIController` has no per-instance data — it is a namespace for UI manipulation functions.

```js
  static showSpinner() {
    $("#spinner").removeClass("disabled");
  }

  static hideSpinner() {
    $("#spinner").addClass("disabled");
  }
```
**Lines 59–65** — Toggle the loading spinner by adding/removing the `disabled` CSS class (which maps to `display: none`). Using a CSS class rather than inline style keeps concerns separated.

```js
  static updatePlayButton(text, clickable = true) {
    $("#play").text(text);
    gameState.isPlayButtonClickable = clickable;
  }
```
**Lines 67–70** — Updates button label and stores whether it can be clicked. `clickable = true` is a default parameter — callers only need to pass `false` when disabling.

```js
  static clearActiveClue() {
    $("#active-clue").empty();
  }

  static showActiveClue(content) {
    $("#active-clue").html(content);
  }
```
**Lines 72–78** — `empty()` removes all child elements from the clue panel. `html()` replaces its inner HTML. Note that `showActiveClue` accepts already-constructed HTML strings; callers are responsible for sanitizing user data before calling it.

```js
  static clearTable() {
    $("#categories").empty();
    $("#clues").empty();
  }
```
**Lines 80–83** — Clears the table header and body rows so a new game can be drawn fresh.

```js
  static showError(message) {
    this.clearActiveClue();
    this.showActiveClue(`<div class="error">${this.escapeHtml(message)}</div>`);
    this.updatePlayButton("Try Again");
  }
```
**Lines 85–89** — Displays an error message to the user. Crucially, `escapeHtml` is called on the message before injecting it into the DOM, preventing XSS if a malicious string somehow made it into the error message.

```js
  static updateScoreDisplay(score) {
    const $value = $("#score-value");
    $value.text(score.toLocaleString());
    $value.removeClass("score-positive score-negative score-zero");
    if (score > 0) $value.addClass("score-positive");
    else if (score < 0) $value.addClass("score-negative");
    else $value.addClass("score-zero");
  }
```
**Lines 91–98** — Updates the score number and applies a color-coded CSS class. `toLocaleString()` formats the number with commas (e.g., `1,000`). All three classes are removed first and the correct one re-applied, avoiding stale class combinations.

```js
  static showAnswerWithScoring(answer, clueValue) {
    const escapedAnswer = this.escapeHtml(answer);
    this.showActiveClue(`
      <div class="answer-display">
        <p class="answer-label">Answer:</p>
        <p class="answer-text">${escapedAnswer}</p>
        <div class="score-buttons">
          <button class="score-btn correct-btn" aria-label="I got it right, add $${clueValue}">
            ✓ Got it (+$${clueValue})
          </button>
          <button class="score-btn incorrect-btn" aria-label="I got it wrong, subtract $${clueValue}">
            ✗ Missed it (−$${clueValue})
          </button>
        </div>
      </div>
    `);

    $(".correct-btn").on("click", (e) => {
      e.stopPropagation();
      handleScoreButton(true);
    });
    $(".incorrect-btn").on("click", (e) => {
      e.stopPropagation();
      handleScoreButton(false);
    });
  }
```
**Lines 100–125** — Renders the answer panel with self-scoring buttons. `e.stopPropagation()` prevents the click from bubbling up to the `#active-clue` click handler (which would advance the mode again). `aria-label` on each button describes the dollar impact for screen reader users.

```js
  static buildCategoryHeaders(categories) {
    const $catRow = $("#categories");
    $catRow.empty();

    categories.forEach(category => {
      $catRow.append(`<th>${this.escapeHtml(category.title)}</th>`);
    });
  }
```
**Lines 127–134** — Dynamically inserts `<th>` elements for each category. Category titles come from an external API and are escaped before insertion to prevent XSS.

```js
  static buildClueRows(categories) {
    const $tbody = $("tbody");
    $tbody.empty();

    for (let i = 0; i < CONFIG.NUMBER_OF_CLUES_PER_CATEGORY; i++) {
      const $row = $("<tr>");

      categories.forEach(cat => {
        const clue = cat.clues[i];
        if (clue) {
          $row.append(
            `<td class="clue" data-category-id="${cat.id}" data-clue-id="${clue.id}">
              $${clue.value}
            </td>`
          );
        } else {
          $row.append("<td class='empty'>—</td>");
        }
      });

      $tbody.append($row);
    }

    $(".clue").on("click", handleClickOfClue);
  }
```
**Lines 136–161** — Builds the grid row by row. The outer loop iterates by row index (point value), the inner `forEach` iterates by column (category). This produces the correct Jeopardy layout. `data-category-id` and `data-clue-id` attributes embed identifiers into the DOM so the click handler can retrieve which clue was clicked without needing a closure. A single delegated event listener is attached after the loop for efficiency.

```js
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
```
**Lines 163–167** — A security utility that prevents XSS. Setting `textContent` on a throwaway `<div>` causes the browser to treat the string as plain text (escaping `<`, `>`, `&`, `"` etc.). Reading back `innerHTML` returns the safely escaped string.

---

### `JeopardyAPI` Class (Lines 171–221)

```js
  static async getCategoryIds() {
    try {
      const response = await axios.get(
        `${CONFIG.API_URL}categories?count=${CONFIG.CATEGORY_FETCH_COUNT}`
      );
```
**Lines 172–176** — `async/await` makes asynchronous API calls read like synchronous code. Fetches 100 categories at once (a large pool) so a random selection can be made from many options.

```js
      const validCategories = response.data.filter(
        c => c.clues_count >= CONFIG.MIN_CLUES_PER_CATEGORY
      );
```
**Lines 178–180** — Filters to categories that have at least 5 clues, ensuring every chosen category can fill a full column on the board.

```js
      if (validCategories.length < CONFIG.NUMBER_OF_CATEGORIES) {
        throw new Error(`Not enough valid categories found (need ${CONFIG.NUMBER_OF_CATEGORIES})`);
      }
```
**Lines 182–184** — Defensive check before calling `_.sampleSize`. Throwing here lets the `catch` block handle user-facing error display.

```js
      const selectedCategories = _.sampleSize(validCategories, CONFIG.NUMBER_OF_CATEGORIES);
      return selectedCategories.map(c => c.id);
```
**Lines 186–187** — Lodash `_.sampleSize` picks 6 random categories from the valid pool without repetition. Only the IDs are returned; full data is fetched in the next step.

```js
  static async getCategoryData(categoryId) {
    try {
      const response = await axios.get(`${CONFIG.API_URL}category?id=${categoryId}`);

      const validClues = response.data.clues
        .filter(c => c.question && c.answer)
        .slice(0, CONFIG.NUMBER_OF_CLUES_PER_CATEGORY);
```
**Lines 194–200** — Fetches one category's data. Clues are filtered to only those with both a question and answer (API data can be incomplete), then sliced to exactly 5.

```js
      return {
        id: response.data.id,
        title: response.data.title,
        clues: validClues.map((clue, idx) => ({
          id: clue.id,
          value: clue.value || (idx + 1) * 100,
          question: clue.question,
          answer: clue.answer,
        }))
      };
```
**Lines 206–215** — Constructs a clean object with only the fields the game needs. `clue.value || (idx + 1) * 100` is a fallback: if the API doesn't provide a point value, generate one based on position (100, 200, 300, 400, 500).

---

### `GameController` Class (Lines 224–286)

```js
  static async setupGame() {
    try {
      UIController.showSpinner();
      UIController.clearActiveClue();
      UIController.clearTable();
      UIController.updatePlayButton("Loading...", false);

      gameState.reset();

      const categoryIds = await JeopardyAPI.getCategoryIds();

      const categoryPromises = categoryIds.map(id => JeopardyAPI.getCategoryData(id));
      gameState.categories = await Promise.all(categoryPromises);
```
**Lines 225–237** — The main game-setup sequence. The UI is updated immediately (spinner shown, button disabled) to give instant feedback. `Promise.all` fires all 6 category fetches in **parallel** rather than sequentially, making setup roughly 6× faster.

```js
      UIController.buildCategoryHeaders(gameState.categories);
      UIController.buildClueRows(gameState.categories);

      UIController.hideSpinner();
      UIController.updatePlayButton("Restart Game", true);

    } catch (error) {
      console.error('Game setup error:', error);
      UIController.hideSpinner();
      UIController.showError(error.message || 'Failed to start game. Please try again.');
    }
  }
```
**Lines 239–249** — After data is ready, the board is rendered and the spinner hidden. Any error at any `await` step falls through to the `catch` block, which shows a user-friendly message and re-enables the button via `showError`.

```js
  static handleClueClick(categoryId, clueId) {
    if (gameState.activeClueMode !== 0) return;
```
**Lines 252–253** — Guard clause: if a clue is already being shown (mode 1 or 2), clicking another clue does nothing.

```js
    const category = gameState.categories.find(c => c.id === catId);
    const clue = category?.clues.find(cl => cl.id === cId);
```
**Lines 258–259** — Uses optional chaining (`?.`) so that if `category` is `undefined`, accessing `.clues` does not throw; it evaluates to `undefined` instead.

```js
    gameState.activeClue = clue;
    gameState.activeClueMode = 1;

    $(`[data-category-id="${categoryId}"][data-clue-id="${clueId}"]`).addClass("viewed");

    UIController.showActiveClue(UIController.escapeHtml(clue.question));
    gameState.removeClue(categoryId, clueId);
  }
```
**Lines 266–273** — Stores the active clue, advances mode to 1 (question visible), marks the table cell as viewed (CSS dims it), shows the question text (escaped), and removes the clue from state so it can't be selected again.

```js
  static handleActiveClueClick() {
    if (gameState.activeClueMode === 1) {
      gameState.activeClueMode = 2;
      UIController.showAnswerWithScoring(
        gameState.activeClue.answer,
        gameState.activeClue.value
      );
    }
  }
```
**Lines 276–285** — Clicking the clue panel while in mode 1 transitions to mode 2 (answer visible). Mode 2 is exited by the score buttons, not by clicking the panel.

---

### Event Handler Functions (Lines 288–322)

```js
function handleClickOfPlay() {
  if (!gameState.isPlayButtonClickable) return;
  GameController.setupGame();
}
```
**Lines 289–292** — Thin wrapper that checks the guard flag before calling `setupGame`. The flag is set to `false` during loading to prevent double-clicks from firing multiple parallel setups.

```js
function handleClickOfClue(event) {
  const categoryId = $(event.currentTarget).data('category-id');
  const clueId = $(event.currentTarget).data('clue-id');
  GameController.handleClueClick(categoryId, clueId);
}
```
**Lines 294–298** — Reads the `data-*` attributes from the clicked cell using jQuery's `.data()` helper and passes them to the controller. Using `event.currentTarget` (the element the listener is attached to) is safer than `event.target` (which could be a child element).

```js
function handleScoreButton(correct) {
  const clueValue = gameState.activeClue.value;
  gameState.updateScore(correct ? clueValue : -clueValue);

  gameState.activeClueMode = 0;
  UIController.clearActiveClue();

  if (gameState.isGameOver()) {
    const finalScore = gameState.score;
    const scoreClass = finalScore >= 0 ? "score-positive" : "score-negative";
    UIController.showActiveClue(`
      <div class="game-complete">
        <p>Game Complete!</p>
        <p>Final Score: <span class="${scoreClass}">$${finalScore.toLocaleString()}</span></p>
      </div>
    `);
    UIController.updatePlayButton("Start New Game", true);
  }
}
```
**Lines 304–322** — Handles the result of a scoring decision. Adds or subtracts the clue value, resets mode to 0, and clears the panel. Then checks if the game is over and shows a final score message with color coding if so.

```js
$(document).ready(() => {
  $("#play").on("click", handleClickOfPlay);
  $("#active-clue").on("click", handleClickOfActiveClue);
  UIController.updateScoreDisplay(0);
});
```
**Lines 325–329** — `$(document).ready()` ensures the DOM is fully parsed before attaching event listeners. Attaching listeners here rather than inline in HTML keeps behavior in JavaScript, following the **separation of concerns** principle.

---

## CSS — `style-improved.css` <a name="css"></a>

### CSS Custom Properties / Design Tokens (Lines 1–46)

```css
:root {
  --color-primary: #060ce9;
  --color-primary-light: #115ff4;
  --color-primary-dark: #001f5c;
  --color-accent: #ffd700;
  ...
}
```
**Lines 2–46** — All colors, spacing values, font sizes, and effect values are defined as CSS custom properties (variables) on `:root`. This is the **design token** pattern. Benefits:
- Change the entire color scheme by editing one block.
- Consistent spacing across components without magic numbers.
- Variables are live-inherited by all descendant elements.

A second `:root` block (lines 38–46) holds score and button colors separately for logical grouping.

---

### Base / Reset Styles (Lines 49–62)

```css
* {
  box-sizing: border-box;
}
```
**Lines 50–52** — Applies `border-box` sizing to every element globally. This means `width` and `height` include padding and border, making layout math much more predictable.

```css
body {
  font-family: var(--font-family-main);
  background: radial-gradient(circle at top, var(--color-primary-dark), var(--color-background-dark));
  color: var(--color-text-light);
  text-align: center;
  padding: var(--spacing-md);
  min-height: 100vh;
  margin: 0;
}
```
**Lines 54–62** — Sets global typography, background, and layout. `radial-gradient` creates the dark blue glow centered at the top. `min-height: 100vh` ensures the background fills the full viewport even on short pages. `margin: 0` removes the browser's default body margin.

---

### Typography (Lines 64–71)

```css
h1 {
  font-size: var(--font-size-xxl);
  letter-spacing: 2px;
  color: var(--color-accent);
  text-shadow: 2px 2px 5px black;
  margin-bottom: var(--spacing-md);
  animation: fadeInDown 0.5s ease-out;
}
```
The gold `h1` animates in from above on page load using the `fadeInDown` keyframe defined later.

---

### Table Layout (Lines 74–161)

```css
table {
  margin: var(--spacing-md) auto;
  border-collapse: collapse;
  background-color: var(--color-primary);
  box-shadow: var(--shadow-large);
  border-radius: var(--border-radius);
  overflow: hidden;
  width: 100%;
  max-width: 1200px;
}
```
**Lines 74–83** — `border-collapse: collapse` removes the default double-border between cells. `overflow: hidden` clips child elements to the rounded corners (necessary because `border-radius` alone doesn't clip children). `max-width: 1200px` prevents the board from becoming unwieldy on large screens.

```css
td {
  width: 150px;
  height: 90px;
  border: 2px solid #000;
  font-size: var(--font-size-xl);
  color: var(--color-accent);
  font-weight: bold;
  text-shadow: 1px 1px 2px black;
  cursor: pointer;
  transition: all var(--transition-speed) ease;
  vertical-align: middle;
  position: relative;
}
```
**Lines 95–107** — Clue cells are fixed-size for a uniform grid. `transition: all` animates changes to any property (color, transform, background) over `0.3s`. `position: relative` establishes a stacking context for the hover `z-index` to work.

```css
td.clue:hover {
  background-color: var(--color-success);
  color: var(--color-text-light);
  transform: scale(1.05);
  z-index: 1;
}
```
**Lines 109–114** — Hover state turns the cell green and scales it up 5%. `z-index: 1` ensures the scaled cell renders above its neighbors.

```css
td.clue:active {
  transform: scale(0.98);
}
```
**Lines 116–118** — Active (pressed) state slightly shrinks the cell to simulate a physical button press.

```css
td.viewed {
  background-color: var(--color-clue-viewed);
  color: var(--color-text-muted);
  text-decoration: line-through;
  cursor: default;
  opacity: 0.6;
}

td.viewed:hover {
  background-color: var(--color-clue-viewed);
  transform: none;
}
```
**Lines 130–141** — Viewed cells are darkened, dimmed, struck through, and their cursor reverts to default. The `:hover` override prevents the green hover animation from re-activating on viewed cells.

---

### Header Layout (Lines 143–157)

```css
header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  justify-content: center;
}
```
Flexbox stacks the title above the controls (`column` direction), then arranges the button and score side by side (`row` direction, the default). `flex-wrap: wrap` lets them stack on narrow screens.

---

### Score Display (Lines 159–174)

```css
#score-value.score-positive { color: var(--color-score-positive); }
#score-value.score-negative { color: var(--color-score-negative); }
#score-value.score-zero     { color: var(--color-score-zero); }
```
**Lines 172–174** — Three single-rule selectors apply green, red, or gold color to the score number based on which class is applied by JavaScript. The high specificity of `#id.class` ensures these override the base `#score-value` color.

---

### Active Clue Display (Lines 176–206)

```css
#active-clue {
  ...
  cursor: pointer;
  transition: all var(--transition-speed) ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
```
Flexbox centers the clue text both vertically and horizontally inside the panel. The panel is clickable (cursor: pointer) to advance from question to answer.

```css
#active-clue:not(:empty):hover {
  background-color: #1a6fff;
  transform: translateY(-2px);
  box-shadow: inset 0 0 15px #000, 0 4px 8px rgba(0, 0, 0, 0.4);
}
```
**Lines 197–201** — `:not(:empty)` is a smart pseudo-class selector that only applies the hover effect when the panel has content. This prevents a hover style from appearing on an empty panel at game start.

---

### Score Buttons (Lines 208–274)

```css
.score-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius);
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease, background-color var(--transition-speed);
  letter-spacing: 0.5px;
}
```
Base button styles shared by both correct and incorrect buttons. `transition` specifies **multiple individual properties** (transform and background-color) rather than `all`, which is more performant since the browser only watches for changes to those specific properties.

```css
.correct-btn { background-color: var(--color-btn-correct); color: var(--color-text-light); }
.incorrect-btn { background-color: var(--color-btn-incorrect); color: var(--color-text-light); }
```
Green for correct, red for incorrect — universally understood color conventions.

---

### Spinner (Lines 292–306)

```css
#spinner {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  color: var(--color-accent);
  z-index: 10;
  animation: pulse 1.5s ease-in-out infinite;
}
```
**Lines 293–302** — `position: fixed` takes the spinner out of normal document flow and positions it relative to the viewport. `top: 50%; left: 50%; transform: translate(-50%, -50%)` is the classic **centered-element trick**: move to 50% of viewport, then shift back by 50% of the element's own dimensions to truly center it. `z-index: 10` keeps it above all other content.

```css
#spinner.disabled {
  display: none;
}
```
**Lines 304–306** — Toggling `display: none` via a class is preferable to inline styles because it can be overridden by other CSS rules and keeps JavaScript free of style values.

---

### Play Button (Lines 311–338)

```css
#play:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```
**Lines 335–338** — If the button were ever given the `disabled` HTML attribute, it would appear dimmed. This pairs with the JavaScript `isPlayButtonClickable` guard, which handles the button's non-clickable state without setting the `disabled` attribute (since `disabled` also prevents focus, which is bad for accessibility).

---

### Animations (Lines 343–361)

```css
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
**Lines 343–352** — Defines the title entrance animation. The element starts invisible and 20px above its final position, then fades and slides down.

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}
```
**Lines 354–361** — The spinner pulses by fading to 50% opacity at the midpoint. Using `0%, 100%` together means the start and end states are identical, creating a seamless infinite loop.

---

### Responsive Design (Lines 366–435)

Three `@media` breakpoints progressively shrink the table for smaller screens:

| Breakpoint | Max Width | Changes |
|---|---|---|
| Tablet | 1200px | Slightly smaller cells and font |
| Mobile | 768px | `h1` shrinks, cells get small |
| Small mobile | 480px | Minimal padding, very compact cells |

The approach is **desktop-first**: base styles target large screens and media queries progressively adjust downward.

---

### Accessibility Styles (Lines 437–464)

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
**Lines 440–446** — Respects the operating system's "reduce motion" accessibility setting (set by users with vestibular disorders or motion sensitivity). Setting durations to near-zero instead of `none` preserves the end state of animations.

```css
button:focus,
td:focus {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}
```
**Lines 449–453** — Visible keyboard focus ring using the gold accent color. Many developers suppress the default `outline` for aesthetic reasons without providing an alternative, which makes keyboard navigation inaccessible. This rule explicitly provides a styled replacement.

```css
@media (prefers-contrast: high) {
  td { border: 3px solid #fff; }
  th { border: 3px solid #fff; }
}
```
**Lines 456–464** — Thicker white borders when the user has requested high-contrast mode, improving legibility for users with low vision.

---

## Architecture Summary

| Concern | Where It Lives |
|---|---|
| Configuration | `CONFIG` object (top of JS) |
| Game data / state | `GameState` class |
| DOM manipulation | `UIController` class |
| API communication | `JeopardyAPI` class |
| Flow control | `GameController` class |
| Event wiring | Standalone handler functions + `$(document).ready` |
| Visual design tokens | CSS `:root` variables |
| Accessibility | `aria-*` attributes (HTML) + focus/motion/contrast media queries (CSS) |

The code follows a clear **separation of concerns**: state, API, UI, and control flow are kept in distinct classes. This makes the code easier to test, debug, and extend.
