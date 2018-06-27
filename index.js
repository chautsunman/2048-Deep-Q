class Game {
  constructor(gameElement) {
    this.game = null;
    this.gameRows = 3;
    this.gameCols = 3;
    this.gameWinValue = 256;
    this.score = 0;
    this.gameWin = false;
    this.gameEnd = false;

    this.gameElement = gameElement;

    this.gameCellElements = [];
    for (let row = 0; row < this.gameRows; row++) {
      let gameRowElements = [];
      for (let col = 0; col < this.gameCols; col++) {
        let cellIdx = row * this.gameCols + col;
        gameRowElements.push($(this.gameElement).find(`#cell${cellIdx}-value`)[0]);
      }
      this.gameCellElements.push(gameRowElements);
    }
    this.scoreElement = $(this.gameElement).find('#score');

    this.reset();
  }

  moveLeft() {
    let reward = 0;
    let moved = false;

    for (let row = 0; row < this.gameRows; row++) {
      let packResult1 = this.packCells(this.game[row]);
      this.game[row] = packResult1.cells;
      let combineResult = this.combineCells(this.game[row]);
      this.game[row] = combineResult.cells;
      let packResult2 = this.packCells(this.game[row]);
      this.game[row] = packResult2.cells;

      reward += combineResult.reward;
      moved = moved || packResult1.packed || combineResult.combined || packResult2.packed;
    }

    return {reward: reward, moved: moved};
  }

  combineCells(cells) {
    let combinedCells = [];
    for (let i = 0; i < cells.length; i++) {
      combinedCells.push(cells[i]);
    }
    let reward = 0;

    let i = 0;
    while (i < combinedCells.length - 1) {
      if (combinedCells[i + 1] === combinedCells[i]) {
        combinedCells[i] *= 2;
        combinedCells[i + 1] = 0;
        reward += combinedCells[i];
        i += 2;
      } else {
        i++;
      }
    }

    return {cells: combinedCells, reward: reward, combined: reward !== 0};
  }

  packCells(cells) {
    let packedCells = [];
    let packed = false;

    for (let i = 0; i < cells.length; i++) {
      if (cells[i] !== 0) {
        packedCells.push(cells[i]);
      }
    }
    while (packedCells.length < cells.length) {
      packedCells.push(0);
    }

    for (let i = 0; i < packedCells.length; i++) {
      if (packedCells[i] !== cells[i]) {
        packed = true;
        break;
      }
    }

    return {cells: packedCells, packed: packed};
  }

  postMove(moveResult) {
    if (!moveResult.moved) {
      return;
    }

    this.score += moveResult.reward;

    if (this.checkGameWin()) {
      this.gameWin = true;
      this.gameEnd = true;
      this.render();
      document.querySelector('.mdl-js-snackbar').MaterialSnackbar.showSnackbar({message: 'You win.'});
      return;
    }

    this.insertRandomCell();

    this.render();

    if (this.checkGameEnd()) {
      this.gameEnd = true;
      document.querySelector('.mdl-js-snackbar').MaterialSnackbar.showSnackbar({message: 'Game ends.'});
    }
  }

  checkGameWin() {
    for (let row = 0; row < this.gameRows; row++) {
      for (let col = 0; col < this.gameCols; col++) {
        if (this.game[row][col] === this.gameWinValue) {
          return true;
        }
      }
    }

    return false;
  }

  checkGameEnd() {
    for (let row = 0; row < this.gameRows; row++) {
      for (let col = 0; col < this.gameCols; col++) {
        if (this.game[row][col] === 0) {
          return false;
        }
      }
    }

    for (let row = 0; row < this.gameRows; row++) {
      if (this.combineCells(this.game[row]).combined) {
        return false;
      }
    }
    let gameTranspose = this.transposeGame(this.game);
    for (let row = 0; row < this.gameCols; row++) {
      if (this.combineCells(gameTranspose[row]).combined) {
        return false;
      }
    }

    return true;
  }

  up() {
    this.game = this.transposeGame(this.game);
    let moveResult = this.moveLeft();
    this.game = this.transposeGame(this.game);

    this.postMove(moveResult);
  }

  down() {
    this.game = this.transposeGame(this.game);
    this.game = this.reverseGameRows(this.game);
    let moveResult = this.moveLeft();
    this.game = this.reverseGameRows(this.game);
    this.game = this.transposeGame(this.game);

    this.postMove(moveResult);
  }

  left() {
    let moveResult = this.moveLeft();

    this.postMove(moveResult);
  }

  right() {
    this.game = this.reverseGameRows(this.game);
    let moveResult = this.moveLeft();
    this.game = this.reverseGameRows(this.game);

    this.postMove(moveResult);
  }

  cloneGame(game) {
    let newGame = [];
    for (let row = 0; row < game.length; row++) {
      let newGameRow = [];
      for (let col = 0; col < game[row].length; col++) {
        newGameRow.push(game[row][col]);
      }
      newGame.push(newGameRow);
    }
    return newGame;
  }

  reverseGameRows(game) {
    let newGame = this.cloneGame(game);
    for (let row = 0; row < game.length; row++) {
      newGame[row] = newGame[row].reverse();
    }
    return newGame;
  }

  transposeGame(game) {
    let newGame = [];
    for (let col = 0; col < game[0].length; col++) {
      let newGameRow = [];
      for (let row = 0; row < game.length; row++) {
        newGameRow.push(game[row][col]);
      }
      newGame.push(newGameRow);
    }
    return newGame;
  }

  insertRandomCell() {
    let emptyCells = [];
    for (let row = 0; row < this.gameRows; row++) {
      for (let col = 0; col < this.gameCols; col++) {
        if (this.game[row][col] === 0) {
          emptyCells.push([row, col]);
        }
      }
    }

    let random = Math.random();
    for (let i = 0; i < emptyCells.length; i++) {
      if (random >= i / emptyCells.length && random < (i + 1) / emptyCells.length) {
        this.game[emptyCells[i][0]][emptyCells[i][1]] = (Math.random() < 0.5) ? 2 : 4;
        break;
      }
    }
  }

  reset() {
    this.game = [];
    for (let row = 0; row < this.gameRows; row++) {
      let gameRow = [];
      for (let col = 0; col < this.gameCols; col++) {
        gameRow.push(0);
      }
      this.game.push(gameRow);
    }
    this.score = 0;
    this.gameWin = false;
    this.gameEnd = false;

    this.insertRandomCell();
    this.insertRandomCell();

    this.render();
  }

  render() {
    for (let row = 0; row < this.gameRows; row++) {
      for (let col = 0; col < this.gameCols; col++) {
        $(this.gameCellElements[row][col]).text((this.game[row][col] !== 0) ? this.game[row][col] : '');
      }
    }

    $(this.scoreElement).text(this.score);
  }
}

$(function() {
  let game = new Game($('#game')[0]);

  $(document).keyup((e) => {
    switch (e.key) {
      case 'ArrowUp':
        game.up();
        break;
      case 'ArrowDown':
        game.down();
        break;
      case 'ArrowLeft':
        game.left();
        break;
      case 'ArrowRight':
        game.right();
        break;
      default:
        break;
    }
  });
  $('#reset-btn').click(() => {
    game.reset();
  });
});
