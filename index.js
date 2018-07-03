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

  step(action) {
    if (!(action >= 0 && action <= 3)) {
      return {nextObservation: this.game, reward: 0, done: this.gameEnd};
    }

    switch (action) {
      case 0:
        this.game = this.transposeGame(this.game);
        break;
      case 1:
        this.game = this.transposeGame(this.game);
        this.game = this.reverseGameRows(this.game);
        break;
      case 2:
        break;
      case 3:
        this.game = this.reverseGameRows(this.game);
        break;
      default:
        break;
    }

    let moveResult = this.moveLeft();

    switch (action) {
      case 0:
        this.game = this.transposeGame(this.game);
        break;
      case 1:
        this.game = this.reverseGameRows(this.game);
        this.game = this.transposeGame(this.game);
        break;
      case 2:
        break;
      case 3:
        this.game = this.reverseGameRows(this.game);
        break;
      default:
        break;
    }

    if (!moveResult.moved) {
      return {nextObservation: this.game, reward: 0, done: this.gameEnd, moved: false};
    }

    this.score += moveResult.reward;

    if (this.checkGameWin()) {
      this.gameWin = true;
      this.gameEnd = true;
    } else {
      this.insertRandomCell();

      if (this.checkGameEnd()) {
        this.gameEnd = true;
      }
    }

    return {nextObservation: this.game, reward: moveResult.reward, done: this.gameEnd, moved: true};
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

    return this.game;
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

class ReplayMemory {
  constructor(n) {
    this.d = [];
    this.n = n;
    this.next_idx = 0;
  }

  add(state, action, reward, nextState, done) {
    let data = [state, action, reward, nextState, (done) ? 1 : 0];
    if (this.d.length < this.n) {
      this.d.push(data);
    } else {
      this.d[this.next_idx] = data;
    }
    this.next_idx = (this.next_idx + 1) % this.n;
  }

  sample(batchSize) {
    let batch = {stateBatch: [], actionBatch: [], rewardBatch: [], nextStateBatch: [], doneBatch: []};
    for (let i = 0; i < batchSize; i++) {
      let data = this.d[Math.floor(Math.random() * this.d.length)];
      batch.stateBatch.push(data[0]);
      batch.actionBatch.push(data[1]);
      batch.rewardBatch.push(data[2]);
      batch.nextStateBatch.push(data[3]);
      batch.doneBatch.push(data[4]);
    }
    batch.stateBatch = tf.tensor2d(batch.stateBatch);
    batch.actionBatch = tf.tensor1d(batch.actionBatch, 'int32');
    batch.rewardBatch = tf.tensor1d(batch.rewardBatch);
    batch.nextStateBatch = tf.tensor2d(batch.nextStateBatch);
    batch.doneBatch = tf.tensor1d(batch.doneBatch, 'float32');
    return batch;
  }
}

class DeepQAgent {
  constructor(game) {
    this.game = game;

    this.HIDDEN_UNITS = [64];
    this.LEARNING_RATE = 0.001;
    this.REPLAY_MEMORY_SIZE = 50000;
    this.T = 100000;
    this.INITIAL_EXPLORATION = 1;
    this.FINAL_EXPLORATION = 0.02;
    this.FINAL_EXPLORATION_FRAME = 10000;
    this.MINIBATCH_SIZE = 32;
    this.DISCOUNT_FACTOR = 0.99;
    this.UPDATE_TARGET_NETWORK_FREQUENCY = 500;

    this.layerWeights = {q: [], targetQ: []};
    let lastLayerUnits = 9;
    for (let i = 0; i < this.HIDDEN_UNITS.length; i++) {
      this.layerWeights.q.push(tf.variable(tf.randomNormal([lastLayerUnits, this.HIDDEN_UNITS[i]])));
      this.layerWeights.q.push(tf.variable(tf.scalar(0)));
      this.layerWeights.targetQ.push(tf.variable(tf.randomNormal([lastLayerUnits, this.HIDDEN_UNITS[i]])));
      this.layerWeights.targetQ.push(tf.variable(tf.scalar(0)));
      lastLayerUnits = this.HIDDEN_UNITS[i];
    }
    this.layerWeights.q.push(tf.variable(tf.randomNormal([lastLayerUnits, 4])));
    this.layerWeights.q.push(tf.variable(tf.scalar(0)));
    this.layerWeights.targetQ.push(tf.variable(tf.randomNormal([lastLayerUnits, 4])));
    this.layerWeights.targetQ.push(tf.variable(tf.scalar(0)));

    this.optimizer = tf.train.adam(this.LEARNING_RATE);

    this.replayMemory = new ReplayMemory(this.REPLAY_MEMORY_SIZE);
  }

  model(state, network) {
    let y = state;
    for (let i = 0; i < this.HIDDEN_UNITS.length + 1; i++) {
      y = y.dot(this.layerWeights[network][i * 2]).add(this.layerWeights[network][i * 2 + 1]);
    }
    return {q: y, qArgmax: y.argMax(1), qMax: y.max(1)};
  }

  getExploration(t) {
    if (t < this.FINAL_EXPLORATION_FRAME) {
      return this.INITIAL_EXPLORATION + (this.FINAL_EXPLORATION - this.INITIAL_EXPLORATION) / this.FINAL_EXPLORATION_FRAME * t
    } else {
      return this.FINAL_EXPLORATION;
    }
  }

  updateTargetQ() {
    for (let i = 0; i < this.HIDDEN_UNITS.length + 1; i++) {
      this.layerWeights.targetQ[i * 2].assign(this.layerWeights.q[i * 2]);
      this.layerWeights.targetQ[i * 2 + 1].assign(this.layerWeights.q[i * 2 + 1]);
    }
  }

  flattenObservation(observation) {
    let flatten = [];
    for (let i = 0; i < observation.length; i++) {
      for (let j = 0; j < observation[i].length; j++) {
        flatten.push(observation[i][j]);
      }
    }
    return flatten;
  }

  train() {
    let observation = this.game.reset();
    observation = this.flattenObservation(observation);
    let state = tf.tensor2d([observation]);

    this.updateTargetQ();

    for (let t = 0; t < this.T; t++) {
      let action;
      if (Math.random() < this.getExploration(t)) {
        action = Math.floor(Math.random() * 4);
      } else {
        let {q, qArgmax} = this.model(state, 'q');
        action = qArgmax.dataSync()[0];
      }

      let {nextObservation, reward, done} = this.game.step(action);
      nextObservation = this.flattenObservation(nextObservation);

      this.replayMemory.add(observation, action, reward, nextObservation, done);

      if (!done) {
        observation = nextObservation;
      } else {
        observation = this.game.reset();
        observation = this.flattenObservation(observation);
      }
      state = tf.tensor2d([observation]);

      let {stateBatch, actionBatch, rewardBatch, nextStateBatch, doneBatch} = this.replayMemory.sample(this.MINIBATCH_SIZE);

      this.optimizer.minimize(() => {
        let {q} = this.model(stateBatch, 'q');

        let {q: qNextState, qMax: qNextStateMax} = this.model(nextStateBatch, 'targetQ');

        let qSelectedAction = q.mul(tf.cast(tf.oneHot(actionBatch, 4), 'float32')).sum(1);

        let qTarget = rewardBatch.add(tf.scalar(1.0).sub(doneBatch).mul(tf.scalar(this.DISCOUNT_FACTOR)).mul(qNextStateMax));

        return qTarget.sub(qSelectedAction).square().mean();
      }, false, this.layerWeights.q);

      if ((t + 1) % this.UPDATE_TARGET_NETWORK_FREQUENCY === 0) {
        this.updateTargetQ();
      }
    }
  }

  play() {
    let observation = this.game.reset();
    observation = this.flattenObservation(observation);
    let state = tf.tensor2d([observation]);

    this.game.render();

    while (!this.game.gameEnd) {
      let {q, qArgmax} = this.model(state, 'q');
      let action = qArgmax.dataSync()[0];

      let {nextObservation, moved} = this.game.step(action);

      if (!moved) {
        break;
      }

      this.game.render();

      observation = this.flattenObservation(nextObservation);
      state = tf.tensor2d([observation]);
    }
  }
}

$(function() {
  let game = new Game($('#game')[0]);
  game.render();

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
    game.render();
  });

  let agent = new DeepQAgent(game);
  $('#train-btn').click(() => {
    agent.train();
  });
  $('#play-btn').click(() => {
    agent.play();
  });
});
