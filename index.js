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
  clearScreen();
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
    console.log("Game lost!");
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

const executeCmd = (action) => {
  if (action.cmd.match("exit")) {
    exitGame();
  } else if (action.cmd.match("flag")) {
    addFlag(action.row, action.col, grid);
  } else {
    return;
  }
};

const parseAnswer = (answer, grid) => {
  const action = validateInput(answer);

  if (action.err) {
    console.log(chalk.red(action.err));
  } else if (action.cmd) {
    executeCmd(action);
  } else {
    uncoverCell(action.row, action.col, grid);
    checkGameStatus(grid);
  }
};

const validateCmd = (cmd) => {
  if (cmd.match("flag")) {
    return "flag";
  } else if (cmd.match("exit")) {
    return "exit";
  } else {
    return;
  }
};

const validateNums = (rowString, colString) => {
  const row = parseInt(rowString, 10);
  const col = parseInt(colString, 10);
  console.log(row, col);
  if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
    return [row, col];
  }

  return;
};

const validateInput = (input) => {
  // TODO
  // input -> "flag 1 10" (<flag> <row> <col>)
  const splitInput = input.split(" ");
  console.log(splitInput);
  const numInputs = splitInput.length;
  const returnObj = {
    cmd: null,
    row: null,
    col: null,
    err: null,
  };
  let move, cmd;

  if (numInputs === 3 || numInputs === 1) {
    cmd = validateCmd(splitInput[0]);
    if (cmd) {
      returnObj.cmd = cmd;
    } else {
      returnObj.err = "Unrecognized command. Expected [<flag>] <row> <col>";
      return returnObj;
    }
    if (numInputs === 3) {
      move = validateNums(splitInput[1], splitInput[2]);
    }
  } else if (numInputs === 2) {
    move = validateNums(splitInput[0], splitInput[1]);
  } else {
    returnObj.err = "Wrong number of arguments. Expected [<flag>] <row> <col>";
    return returnObj;
  }

  if (move) {
    returnObj.row = move[0];
    returnObj.col = move[1];
  } else if (!returnObj.cmd.match("exit")) {
    // NOTE(Mariana): A command doesn't necessarily require a move set (e.g. "exit")
    returnObj.err = "Invalid numeric values. Expected [<flag>] <row> <col>";
    return returnObj;
  }

  return returnObj;
};

const repl = (grid) => {
  rl.question("Cell to uncover (<row><col>):\n", (answer) => {
    parseAnswer(answer, grid);
    printGrid(grid);
    repl(grid);
  });
};

rl.on("close", () => {
  console.log("Bye!");
  process.exit(0);
});

const grid = buildGrid();
fillGridWBombs(NUM_BOMBS, grid);
let start = process.hrtime.bigint();

clearScreen();
repl(grid);
