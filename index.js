const chalk = require("chalk");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const GRID_SIZE = 16;
const MAX_DIGITS = Math.floor(GRID_SIZE / 10) + 1;
const CELL_WIDTH = MAX_DIGITS + 2; // NOTE: We want the numbers to be centered, no matter the digits they have
const NUM_BOMBS = 32;
let uncoveredCells = 0;
let hasLost = false;

// NOTE: https://gist.github.com/timneutkens/f2933558b8739bbf09104fb27c5c9664
const clearScreen = () => {
  const blank = "\n".repeat(process.stdout.rows);
  console.log(blank);
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
};

const buildGrid = () => {
  const grid = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    grid.push([]);
    for (let j = 0; j < GRID_SIZE; j++) {
      grid[i].push({ status: "u", contains: " " });
    }
  }
  return grid;
};

const fillGridWBombs = (nbombs, grid) => {
  for (let i = 0; i < nbombs; i++) {
    grid[Math.floor(Math.random() * GRID_SIZE)][
      Math.floor(Math.random() * GRID_SIZE)
    ].contains = "b";
  }
};

const drawCell = (content) => {
  if (content.status.match(/b/)) {
    process.stdout.write(
      `|${chalk.red(content.status)}${" ".repeat(MAX_DIGITS - 1)}|`
    );
  } else if (content.status.match(/F/)) {
    process.stdout.write(
      `|${chalk.green(content.status)}${" ".repeat(MAX_DIGITS - 1)}|`
    );
  } else {
    process.stdout.write(`|${content.status}${" ".repeat(MAX_DIGITS - 1)}|`);
  }
};

const printGrid = (grid) => {
  process.stdout.write(chalk.yellow(`|${" ".repeat(MAX_DIGITS)}|`));
  for (let i = 0; i < GRID_SIZE; i++) {
    process.stdout.write(
      chalk.yellow(`|${i}${" ".repeat(MAX_DIGITS - (Math.floor(i / 10) + 1))}|`)
    );
  }

  process.stdout.write("\n");
  for (let i = 0; i < GRID_SIZE; i++) {
    process.stdout.write(
      chalk.yellow(`|${i}${" ".repeat(MAX_DIGITS - (Math.floor(i / 10) + 1))}|`)
    );
    for (let j = 0; j < GRID_SIZE; j++) {
      drawCell(grid[i][j]);
    }
    process.stdout.write("\n");
  }
  process.stdout.write("\n");
};

const showBombs = (grid) => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j].contains.match(/b/)) {
        grid[i][j].status = "b";
      }
    }
  }
};
const isCellValid = (row, col) => {
  return row < GRID_SIZE && col < GRID_SIZE && row >= 0 && col >= 0;
};

const checkBombsAround = (row, col, grid) => {
  let rowInc, colInc;
  let bombCount = 0;
  if (grid[row][col].contains.match(/b/)) {
    return "b";
  }
  for (rowInc = -1; rowInc < 2; rowInc++) {
    for (colInc = -1; colInc < 2; colInc++) {
      if (isCellValid(row + rowInc, col + colInc)) {
        if (grid[row + rowInc][col + colInc].contains.match("b")) {
          bombCount++;
        }
      } else {
        continue;
      }
    }
  }
  return `${bombCount <= 0 ? " " : bombCount}`;
};

const uncoverCell = (row, col, grid) => {
  if (
    row >= GRID_SIZE ||
    col >= GRID_SIZE ||
    row < 0 ||
    col < 0 ||
    grid[row][col].status.match(/\s|[0-9]|b/)
  ) {
    return;
  }
  uncoveredCells++;
  grid[row][col].status = checkBombsAround(row, col, grid);

  if (grid[row][col].status.match(/[0-9]/)) {
    return;
  } else if (grid[row][col].status.match("b")) {
    hasLost = true;
    return;
  }

  uncoverCell(row - 1, col, grid);
  uncoverCell(row + 1, col, grid);
  uncoverCell(row, col - 1, grid);
  uncoverCell(row, col + 1, grid);
};

const addFlag = (row, col, grid) => {
  if (grid[row][col].status.match("u")) {
    grid[row][col].status = "F";
  }
};
const exitGame = () => {
  rl.close();
};

const hasWon = () => {
  return uncoveredCells === GRID_SIZE * GRID_SIZE - NUM_BOMBS;
};

const checkGameStatus = (grid) => {
  if (hasLost) {
    console.log("You lost!");
    console.log(
      `Time elapsed: ${(process.hrtime.bigint() - start) / 1000000000n}`
    );
    showBombs(grid);
    printGrid(grid);
    exitGame();
  } else if (hasWon()) {
    console.log("You won!");
    console.log(
      `Time elapsed: ${(process.hrtime.bigint() - start) / 1000000000n}`
    );
    printGrid(grid);
    exitGame();
  }
};

const parseAnswer = (answer, grid) => {
  const action = validateInput(answer);

  if (action.exit) {
    exitGame()
  } else if (action.err) {
    console.log(chalk.red(action.err));
  } else if (action.flag) {
    addFlag(action.row, action.col, grid);
  } else {
    uncoverCell(action.row, action.col, grid);
    checkGameStatus(grid);
  }
};

const validateNums = (rowString, colString) => {
  const row = parseInt(rowString, 10);
  const col = parseInt(colString, 10);
  if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
    return [row, col];
  }

  return;
};

const validateInput = (input) => {

  const split = input.split(' ');
  const action = {
      row: null,
      col: null,
      flag: false,
      exit: false,
      err: null,
    };

    if (input.match('exit')) {
      action.exit = true;
      return action
    }

  if (split.length <= 1) {
    action.err = 'Not enough arguments'
    return action;
  }

  const parsedNums = validateNums(split[0], split[1]);

  if (!parsedNums) {
    action.err = 'Invalid position'
    return action;
  }

  action.row = parsedNums[0]
  action.col = parsedNums[1]
  
  if (split.length >= 3 && split[2].match('flag')) {
    action.flag = true; 
  }

  return action;
};

const repl = (grid) => {
  rl.question("Cell to uncover ([row] [col] ['flag'?]):\n", (answer) => {
    clearScreen()
    parseAnswer(answer, grid);
    printGrid(grid);
    repl(grid);
  });
};

rl.on("close", () => {
  process.exit(0);
});

const grid = buildGrid();
fillGridWBombs(NUM_BOMBS, grid);
let start = process.hrtime.bigint();

clearScreen();
repl(grid);
