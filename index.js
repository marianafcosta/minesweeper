import {
    gameStatus,
    init,
    uncoverCell,
    updateGameStatus,
    addFlag,
} from "./logic.js";
import {
    messageType,
    printGrid,
    printMessage,
    clearScreen,
    printBanner,
} from "./cli.js";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

export let GRID_SIZE = 16;
// let CELL_WIDTH; // NOTE: We want the numbers to be centered, no matter the digits they have
let NUM_BOMBS;
let game;

const exitGame = () => {
    clearScreen();
    rl.close();
};

const checkGameStatus = (game) => {
    if (game.status === gameStatus.LOST || game.status === gameStatus.WON) {
        printMessage(`You ${game.status}!`, messageType.INFO);
        printMessage(`Time elapsed: ${game.score}`, messageType.INFO);
        printGrid(game, true);
        return true;
    }
};

const parseAnswer = (answer, game) => {
    const action = validateInput(answer);

    if (action.exit) {
        exitGame();
    } else if (action.err) {
        printMessage(action.err, messageType.ERROR);
    } else if (action.flag) {
        addFlag(action.row, action.col, game);
    } else {
        uncoverCell(action.row, action.col, game, true);
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
            printMessage(
                "The specified board size is not allowed",
                messageType.ERROR
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
        printGrid(game);
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
                // CELL_WIDTH = MAX_DIGITS + 2; // NOTE: We want the numbers to be centered, no matter the digits they have
                NUM_BOMBS = 32;
                game = init(GRID_SIZE, NUM_BOMBS);
                repl(game);
            } else if (answer.match("exit")) {
                exitGame();
            } else if (answer.match("size")) {
                changeBoardSize();
            } else {
                printMessage("Unrecognized option", messageType.ERROR);
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
