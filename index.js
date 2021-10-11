import {
    gameStatus,
    cellStatus,
    init,
    uncoverCell,
    updateGameStatus,
    addFlag,
} from "./logic.js";
import { printGrid } from "./cli.js";
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

export let GRID_SIZE = 16;
export let MAX_DIGITS;
let CELL_WIDTH; // NOTE: We want the numbers to be centered, no matter the digits they have
let NUM_BOMBS;
let game;

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

const exitGame = () => {
    clearScreen();
    rl.close();
};

const checkGameStatus = (game) => {
    if (game.status === gameStatus.LOST || game.status === gameStatus.WON) {
        console.log(`You ${game.status}!`);
        console.log(`Time elapsed: ${game.score}`);
        // showBombs(game.grid);
        printGrid(game.grid, true);
        return true;
    }
};

const parseAnswer = (answer, game) => {
    const action = validateInput(answer);

    if (action.exit) {
        exitGame();
    } else if (action.err) {
        console.log(colorText(action.err, colors.red));
    } else if (action.flag) {
        addFlag(action.row, action.col, game);
    } else {
        uncoverCell(action.row, action.col, game);
        updateGameStatus(game);
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

const repl = (game) => {
    rl.question("Cell to uncover ([row] [col] ['flag'?]):\n", (answer) => {
        clearScreen();
        parseAnswer(answer, game);
        printGrid(game.grid);
        if (checkGameStatus(game)) {
            printBanner();
            menuRepl();
        } else {
            repl(game);
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
                NUM_BOMBS = 32;
                game = init(GRID_SIZE, NUM_BOMBS);
                repl(game);
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
