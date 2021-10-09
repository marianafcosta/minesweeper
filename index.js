import { init } from "./logic.js";
import readline from "readline";

const colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
};

// NOTE: https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
const colorText = (text, color) => {
    return `${color}${text}\x1b[0m`; // NOTE: '\x1b[0m' resets the terminal color
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let GRID_SIZE = 16;
let MAX_DIGITS;
let CELL_WIDTH; // NOTE: We want the numbers to be centered, no matter the digits they have
let NUM_BOMBS;
let uncoveredCells;
let hasLost;
let grid;
let start;

// NOTE: https://gist.github.com/timneutkens/f2933558b8739bbf09104fb27c5c9664
const clearScreen = () => {
    const blank = "\n".repeat(process.stdout.rows);
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
};

const printBanner = () => {
    console.log(`                                                     
      (_)                                                     
____  _ ____  _____  ___ _ _ _ _____ _____ ____  _____  ____ 
|    \| |  _ \| ___ |/___) | | | ___ | ___ |  _ \| ___ |/ ___)
| | | | | | | | ____|___ | | | | ____| ____| |_| | ____| |    
|_|_|_|_|_| |_|_____|___/ \___/|_____)_____)  __/|_____)_|    
                                           |_|                
`);
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
            `|${colorText(content.status, colors.red)}${" ".repeat(
                MAX_DIGITS - 1
            )}|`
        );
    } else if (content.status.match(/F/)) {
        process.stdout.write(
            `|${colorText(content.status, colors.green)}${" ".repeat(
                MAX_DIGITS - 1
            )}|`
        );
    } else {
        process.stdout.write(
            `|${content.status}${" ".repeat(MAX_DIGITS - 1)}|`
        );
    }
};

const printGrid = (grid) => {
    process.stdout.write(
        colorText(`|${" ".repeat(MAX_DIGITS)}|`, colors.yellow)
    );
    for (let i = 0; i < GRID_SIZE; i++) {
        process.stdout.write(
            colorText(
                `|${i}${" ".repeat(MAX_DIGITS - (Math.floor(i / 10) + 1))}|`,
                colors.yellow
            )
        );
    }

    process.stdout.write("\n");
    for (let i = 0; i < GRID_SIZE; i++) {
        process.stdout.write(
            colorText(
                `|${i}${" ".repeat(MAX_DIGITS - (Math.floor(i / 10) + 1))}|`,
                colors.yellow
            )
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
    clearScreen();
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
        // printGrid(grid);
        return true;
    } else if (hasWon()) {
        console.log("You won!");
        console.log(
            `Time elapsed: ${(process.hrtime.bigint() - start) / 1000000000n}`
        );
        // printGrid(grid);
        return true;
    }
};

const parseAnswer = (answer, grid) => {
    const action = validateInput(answer);

    if (action.exit) {
        exitGame();
    } else if (action.err) {
        console.log(colorText(action.err, colors.red));
    } else if (action.flag) {
        addFlag(action.row, action.col, grid);
    } else {
        uncoverCell(action.row, action.col, grid);
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
    const split = input.split(" ");
    const action = {
        row: null,
        col: null,
        flag: false,
        exit: false,
        err: null,
    };

    if (input.match("exit")) {
        action.exit = true;
        return action;
    }

    if (split.length <= 1) {
        action.err = "Not enough arguments";
        return action;
    }

    const parsedNums = validateNums(split[0], split[1]);

    if (!parsedNums) {
        action.err = "Invalid position";
        return action;
    }

    action.row = parsedNums[0];
    action.col = parsedNums[1];

    if (split.length >= 3 && split[2].match("flag")) {
        action.flag = true;
    }

    return action;
};

const changeBoardSize = () => {
    rl.question("Please select a board size (up to 16):\n", (answer) => {
        const parsedInput = parseInt(answer, 10);
        if (parsedInput && parsedInput <= 16 && parsedInput > 0) {
            GRID_SIZE = parsedInput;
        } else {
            console.log(
                colorText("The specified board size is not allowed", colors.red)
            );
        }
        clearScreen();
        printBanner();
        menuRepl();
    });
};

const repl = (grid) => {
    rl.question("Cell to uncover ([row] [col] ['flag'?]):\n", (answer) => {
        clearScreen();
        parseAnswer(answer, grid);
        printGrid(grid);
        if (checkGameStatus(grid)) {
            printBanner();
            menuRepl();
        } else {
            repl(grid);
        }
    });
};

const menuRepl = () => {
    rl.question(
        "Please choose an option ('play' | 'exit' | 'size'):\n",
        (answer) => {
            clearScreen();
            printBanner();
            if (answer.match("play")) {
                clearScreen();
                MAX_DIGITS = Math.floor(GRID_SIZE / 10) + 1;
                CELL_WIDTH = MAX_DIGITS + 2; // NOTE: We want the numbers to be centered, no matter the digits they have
                NUM_BOMBS = 1;
                uncoveredCells = 0;
                hasLost = false;
                grid = init(16);
                fillGridWBombs(NUM_BOMBS, grid);
                start = process.hrtime.bigint();
                repl(grid);
            } else if (answer.match("exit")) {
                exitGame();
            } else if (answer.match("size")) {
                changeBoardSize();
            } else {
                console.log(colorText("Unrecognized option", colors.red));
                menuRepl();
            }
        }
    );
};

rl.on("close", () => {
    process.exit(0);
});

clearScreen();
printBanner();
menuRepl();
