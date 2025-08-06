const BOARD_SIZE = 30;
const POWER_UP_TILES = [3, 11, 23];
const DUEL_TILES = [6, 16, 26];
const FINAL_TILE = 29;

let questionsData = [];
let boardTiles = [];
let currentPlayer = 0;

const players = [
  { id: 1, position: 0, lives: 3, points: 0, finalReached: false, element: null },
  { id: 2, position: 0, lives: 3, points: 0, finalReached: false, element: null }
];

document.addEventListener('DOMContentLoaded', () => {
  loadQuestions().then(() => {
    generateBoard();
    renderStatus();
  });
  document.getElementById('roll-btn').addEventListener('click', rollDice);
  document.getElementById('rematch-btn').addEventListener('click', startRematch);
  document.getElementById('newgame-btn').addEventListener('click', startNewGame);
});

function loadQuestions() {
  return fetch('questions.json').then(res => res.json()).then(data => {
    questionsData = data;
  });
}

function generateBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  boardTiles = [];
  const questionPositions = [];

  for (let i = 0; i < BOARD_SIZE; i++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.textContent = i + 1;
    tile.dataset.index = i;
    if (POWER_UP_TILES.includes(i)) {
      tile.classList.add('powerup');
    } else if (DUEL_TILES.includes(i)) {
      tile.classList.add('duel');
    } else if (i === FINAL_TILE) {
      tile.classList.add('final');
    } else {
      questionPositions.push(i);
    }
    board.appendChild(tile);
    boardTiles.push(tile);
  }

  const themes = ['domain_range', 'types_functions', 'inequalities', 'limits', 'lateral_limits', 'trig_limits'];
  const shuffled = questionPositions.sort(() => Math.random() - 0.5);
  themes.forEach(theme => {
    for (let i = 0; i < 4; i++) {
      const idx = shuffled.pop();
      boardTiles[idx].classList.add(`theme-${theme}`);
      boardTiles[idx].dataset.theme = theme;
    }
  });

  players.forEach(p => {
    p.position = 0;
    p.lives = 3;
    p.points = 0;
    p.finalReached = false;
    const token = document.createElement('div');
    token.className = `player player${p.id}`;
    boardTiles[0].appendChild(token);
    p.element = token;
  });
}
function rollDice() {
  const btn = document.getElementById('roll-btn');
  btn.disabled = true;
  const roll = Math.floor(Math.random() * 6) + 1;
  document.getElementById('dice-result').textContent = `Rolled ${roll}`;
  movePlayer(roll);
}

function movePlayer(steps) {
  const player = players[currentPlayer];
  const target = Math.min(player.position + steps, FINAL_TILE);

  const step = () => {
    if (player.position < target) {
      boardTiles[player.position].removeChild(player.element);
      player.position++;
      boardTiles[player.position].appendChild(player.element);
      setTimeout(step, 300);
    } else {
      handleTile(player);
    }
  };
  step();
}

function handleTile(player) {
  const idx = player.position;
  if (idx === FINAL_TILE) {
    if (!player.finalReached) {
      player.finalReached = true;
      player.points += 10;
    }
    renderStatus();
    if (players.every(p => p.position === FINAL_TILE || p.lives <= 0)) {
      showGameOver();
    } else {
      endTurn();
    }
  } else if (POWER_UP_TILES.includes(idx)) {
    showPowerUpModal(player);
  } else if (DUEL_TILES.includes(idx)) {
    handleDuelTile(player);
  } else {
    const theme = boardTiles[idx].dataset.theme;
    showQuestionModal(player, theme);
  }
}

function showPowerUpModal(player) {
  const modal = document.getElementById('powerup-modal');
  modal.classList.remove('hidden');
  modal.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      const choice = btn.dataset.power;
      if (choice === 'life' && player.lives < 3) player.lives++;
      if (choice === 'points') player.points += 3;
      if (choice === 'advance') {
        modal.classList.add('hidden');
        renderStatus();
        movePlayer(2);
        return;
      }
      modal.classList.add('hidden');
      renderStatus();
      endTurn();
    };
  });
}

function showQuestionModal(player, theme) {
  const modal = document.getElementById('question-modal');
  const qEl = document.getElementById('question-text');
  const optionsEl = document.getElementById('options');
  const timerEl = document.getElementById('timer');

  const diff = getDifficulty(player.position);
  let possible = questionsData.filter(q => q.theme === theme && q.difficulty === diff && !q.used);
  if (possible.length === 0) possible = questionsData.filter(q => q.theme === theme && !q.used);
  const question = possible[Math.floor(Math.random() * possible.length)];
  question.used = true;

  qEl.textContent = question.question;
  optionsEl.innerHTML = '';
  question.options.forEach((opt, idx) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(player, question, idx, modal);
    li.appendChild(btn);
    optionsEl.appendChild(li);
  });

  modal.classList.remove('hidden');
  startTimer(timerEl, 30, () => {
    player.lives--;
    player.points = Math.max(0, player.points - 5);
    modal.classList.add('hidden');
    renderStatus();
    endTurn();
  });
}
function checkAnswer(player, question, chosen, modal) {
  stopTimer();
  modal.classList.add('hidden');
  if (chosen === question.answerIndex) {
    if (question.difficulty === 'easy') player.points += 5;
    else if (question.difficulty === 'medium') player.points += 10;
    else player.points += 15;
  } else {
    player.lives--;
    player.points = Math.max(0, player.points - 5);
  }
  renderStatus();
  endTurn();
}

let timerInterval;
function startTimer(el, seconds, onTimeout) {
  el.textContent = seconds;
  timerInterval = setInterval(() => {
    seconds--;
    el.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timerInterval);
      onTimeout();
    }
  }, 1000);
}
function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function getDifficulty(pos) {
  if (pos < 10) return 'easy';
  if (pos < 20) return 'medium';
  return 'hard';
}

function handleDuelTile(player) {
  const modal = document.getElementById('duel-modal');
  const qEl = document.getElementById('duel-question');
  const optionsEl = document.getElementById('duel-options');
  const timerEl = document.getElementById('duel-timer');

  const theme = 'limits';
  const question = questionsData.find(q => q.theme === theme && !q.used) || questionsData[0];
  question.used = true;
  qEl.textContent = question.question;
  optionsEl.innerHTML = '';
  question.options.forEach((opt, idx) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.onclick = () => resolveDuel(idx === question.answerIndex);
    li.appendChild(btn);
    optionsEl.appendChild(li);
  });

  let duelPlayerIndex = currentPlayer;
  modal.classList.remove('hidden');
  startTimer(timerEl, 30, () => resolveDuel(false));

  function resolveDuel(correct) {
    stopTimer();
    modal.classList.add('hidden');
    if (correct) {
      players[duelPlayerIndex].points += 5;
    } else {
      players[duelPlayerIndex].lives--;
      players[duelPlayerIndex].points = Math.max(0, players[duelPlayerIndex].points - 5);
      duelPlayerIndex = 1 - duelPlayerIndex;
      if (players[duelPlayerIndex].lives > 0) {
        modal.classList.remove('hidden');
        startTimer(timerEl, 30, () => resolveDuel(false));
        return;
      }
    }
    renderStatus();
    endTurn();
  }
}

function endTurn() {
  if (checkGameEnd()) {
    showGameOver();
    return;
  }
  currentPlayer = 1 - currentPlayer;
  document.getElementById('roll-btn').disabled = false;
}

function renderStatus() {
  players.forEach(p => {
    const status = document.getElementById(`player${p.id}-status`);
    status.querySelector('.lives').textContent = p.lives;
    status.querySelector('.points').textContent = p.points;
  });
}

function checkGameEnd() {
  if (players.some(p => p.lives <= 0)) return true;
  if (players.every(p => p.position === FINAL_TILE)) return true;
  return false;
}

function showGameOver() {
  const modal = document.getElementById('gameover-modal');
  document.getElementById('gameover-text').textContent = getWinner();
  modal.classList.remove('hidden');
}

function getWinner() {
  if (players[0].lives <= 0 && players[1].lives <= 0) return 'Both players lost!';
  if (players[0].lives <= 0) return 'Player 2 wins!';
  if (players[1].lives <= 0) return 'Player 1 wins!';
  if (players[0].points > players[1].points) return 'Player 1 wins!';
  if (players[1].points > players[0].points) return 'Player 2 wins!';
  return 'Draw!';
}

function startRematch() {
  document.getElementById('gameover-modal').classList.add('hidden');
  players.forEach(p => {
    p.position = 0;
    p.lives = 3;
    p.finalReached = false;
    boardTiles.forEach(tile => {
      if (tile.contains(p.element)) tile.removeChild(p.element);
    });
    const token = document.createElement('div');
    token.className = `player player${p.id}`;
    boardTiles[0].appendChild(token);
    p.element = token;
  });
  renderStatus();
  currentPlayer = 0;
  document.getElementById('roll-btn').disabled = false;
}

function startNewGame() {
  location.reload();
}
