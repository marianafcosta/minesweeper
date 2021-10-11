import { cellStatus } from "./logic.js";
import readline from "readline";

const colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    white: "\x1b[0m",
};

export const messageType = {
    ERROR: "red",
    INFO: "white",
};

// NOTE: https://gist.github.com/timneutkens/f2933558b8739bbf09104fb27c5c9664
function clearScreen() {
    const blank = "\n".repeat(process.stdout.rows);
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
}

function printBanner() {
    console.log(`                                                     
      (_)                                                     
____  _ ____  _____  ___ _ _ _ _____ _____ ____  _____  ____ 
|    \| |  _ \| ___ |/___) | | | ___ | ___ |  _ \| ___ |/ ___)
| | | | | | | | ____|___ | | | | ____| ____| |_| | ____| |    
|_|_|_|_|_| |_|_____|___/ \___/|_____)_____)  __/|_____)_|    
                                           |_|                
`);
}

// NOTE: https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
function colorText(text, color) {
    return `${color}${text}\x1b[0m`; // NOTE: '\x1b[0m' resets the terminal color
}

function drawCell(cell, maxCellDigits, showBombs) {
    let displayText;
    if (cell.status === cellStatus.BOMB) {
        displayText = colorText(cell.status, colors.red);
    } else if (cell.status === cellStatus.FLAG) {
        displayText = colorText(cell.status, colors.green);
    } else if (showBombs && cell.bomb) {
        displayText = colorText(cellStatus.BOMB, colors.red);
    } else {
        displayText = cell.status;
    }

    process.stdout.write(`|${displayText}${" ".repeat(maxCellDigits - 1)}|`);
}

function printGrid(game, showBombs) {
    process.stdout.write(
        colorText(`|${" ".repeat(game.maxCellDigits)}|`, colors.yellow)
    );
    for (let i = 0; i < game.gridSize; i++) {
        process.stdout.write(
            colorText(
                `|${i}${" ".repeat(
                    game.maxCellDigits - (Math.floor(i / 10) + 1)
                )}|`,
                colors.yellow
            )
        );
    }

    process.stdout.write("\n");
    for (let i = 0; i < game.gridSize; i++) {
        process.stdout.write(
            colorText(
                `|${i}${" ".repeat(
                    game.maxCellDigits - (Math.floor(i / 10) + 1)
                )}|`,
                colors.yellow
            )
        );
        for (let j = 0; j < game.gridSize; j++) {
            drawCell(game.grid[i][j], game.maxCellDigits, showBombs);
        }
        process.stdout.write("\n");
    }
    process.stdout.write("\n");
}

function printMessage(message, type) {
    console.log(colorText(message, colors[type]));
}

export { printGrid, printMessage, clearScreen, printBanner };
