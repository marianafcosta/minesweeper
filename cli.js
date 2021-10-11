import { cellStatus } from "./logic.js";
import { GRID_SIZE, MAX_DIGITS } from "./index.js";

const colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
};

const colorText = (text, color) => {
    return `${color}${text}\x1b[0m`; // NOTE: '\x1b[0m' resets the terminal color
};

const drawCell = (cell, showBombs) => {
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

    process.stdout.write(`|${displayText}${" ".repeat(MAX_DIGITS - 1)}|`);
};

function printGrid(grid, showBombs) {
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
            drawCell(grid[i][j], showBombs);
        }
        process.stdout.write("\n");
    }
    process.stdout.write("\n");
}

export { printGrid };
