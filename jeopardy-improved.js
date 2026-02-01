// Configuration constants
const CONFIG = {
  API_URL: "https://rithm-jeopardy.herokuapp.com/api/",
  NUMBER_OF_CATEGORIES: 6,
  NUMBER_OF_CLUES_PER_CATEGORY: 5,
  MIN_CLUES_PER_CATEGORY: 5,
  CATEGORY_FETCH_COUNT: 100,
};

// Game state management
class GameState {
  constructor() {
    this.categories = [];
    this.activeClue = null;
    this.activeClueMode = 0; // 0: selecting, 1: showing question, 2: showing answer
    this.isPlayButtonClickable = true;
    this.totalCluesRemaining = 0;
  }

  reset() {
    this.categories = [];
    this.activeClue = null;
    this.activeClueMode = 0;
    this.totalCluesRemaining = CONFIG.NUMBER_OF_CATEGORIES * CONFIG.NUMBER_OF_CLUES_PER_CATEGORY;
  }

  removeClue(categoryId, clueId) {
    const category = this.categories.find(c => c.id == categoryId);
    if (!category) return;

    category.clues = category.clues.filter(cl => cl.id != clueId);
    this.totalCluesRemaining--;

    if (category.clues.length === 0) {
      this.categories = this.categories.filter(c => c.id != categoryId);
    }
  }

  isGameOver() {
    return this.categories.length === 0;
  }
}

const gameState = new GameState();

// UI Controller
class UIController {
  static showSpinner() {
    $("#spinner").removeClass("disabled");
  }

  static hideSpinner() {
    $("#spinner").addClass("disabled");
  }

  static updatePlayButton(text, clickable = true) {
    $("#play").text(text);
    gameState.isPlayButtonClickable = clickable;
  }

  static clearActiveClue() {
    $("#active-clue").empty();
  }

  static showActiveClue(content) {
    $("#active-clue").html(content);
  }

  static clearTable() {
    $("#categories").empty();
    $("#clues").empty();
  }

  static showError(message) {
    this.clearActiveClue();
    this.showActiveClue(`<div class="error">${message}</div>`);
    this.updatePlayButton("Try Again");
  }

  static buildCategoryHeaders(categories) {
    const $catRow = $("#categories");
    $catRow.empty();
    
    categories.forEach(category => {
      $catRow.append(`<th>${this.escapeHtml(category.title)}</th>`);
    });
  }

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

    // Attach event listeners
    $(".clue").on("click", handleClickOfClue);
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// API Service
class JeopardyAPI {
  static async getCategoryIds() {
    try {
      const response = await axios.get(
        `${CONFIG.API_URL}categories?count=${CONFIG.CATEGORY_FETCH_COUNT}`
      );
      
      const validCategories = response.data.filter(
        c => c.clues_count >= CONFIG.MIN_CLUES_PER_CATEGORY
      );

      if (validCategories.length < CONFIG.NUMBER_OF_CATEGORIES) {
        throw new Error(`Not enough valid categories found (need ${CONFIG.NUMBER_OF_CATEGORIES})`);
      }

      const selectedCategories = _.sampleSize(validCategories, CONFIG.NUMBER_OF_CATEGORIES);
      return selectedCategories.map(c => c.id);
    } catch (error) {
      console.error('Error fetching category IDs:', error);
      throw new Error('Failed to load categories. Please try again.');
    }
  }

  static async getCategoryData(categoryId) {
    try {
      const response = await axios.get(`${CONFIG.API_URL}category?id=${categoryId}`);
      
      const validClues = response.data.clues
        .filter(c => c.question && c.answer)
        .slice(0, CONFIG.NUMBER_OF_CLUES_PER_CATEGORY);

      if (validClues.length < CONFIG.NUMBER_OF_CLUES_PER_CATEGORY) {
        throw new Error(`Category ${categoryId} does not have enough valid clues`);
      }

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
    } catch (error) {
      console.error(`Error fetching category ${categoryId}:`, error);
      throw error;
    }
  }
}

// Game Controller
class GameController {
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

  static handleClueClick(categoryId, clueId) {
    if (gameState.activeClueMode !== 0) return;

    const category = gameState.categories.find(c => c.id == categoryId);
    const clue = category?.clues.find(cl => cl.id == clueId);

    if (!clue) {
      console.error('Clue not found');
      return;
    }

    gameState.activeClue = clue;
    gameState.activeClueMode = 1;

    // Mark clue as viewed
    $(`[data-category-id="${categoryId}"][data-clue-id="${clueId}"]`).addClass("viewed");
    
    UIController.showActiveClue(UIController.escapeHtml(clue.question));
    gameState.removeClue(categoryId, clueId);
  }

  static handleActiveClueClick() {
    if (gameState.activeClueMode === 1) {
      // Show answer
      gameState.activeClueMode = 2;
      UIController.showActiveClue(UIController.escapeHtml(gameState.activeClue.answer));
      
    } else if (gameState.activeClueMode === 2) {
      // Clear and check if game is over
      gameState.activeClueMode = 0;
      UIController.clearActiveClue();

      if (gameState.isGameOver()) {
        UIController.showActiveClue("🎉 Game Complete! 🎉");
        UIController.updatePlayButton("Start New Game", true);
      }
    }
  }
}

// Event Handlers
function handleClickOfPlay() {
  if (!gameState.isPlayButtonClickable) return;
  GameController.setupGame();
}

function handleClickOfClue(event) {
  const categoryId = $(event.currentTarget).data('category-id');
  const clueId = $(event.currentTarget).data('clue-id');
  GameController.handleClueClick(categoryId, clueId);
}

function handleClickOfActiveClue() {
  GameController.handleActiveClueClick();
}

// Initialize event listeners
$(document).ready(() => {
  $("#play").on("click", handleClickOfPlay);
  $("#active-clue").on("click", handleClickOfActiveClue);
});