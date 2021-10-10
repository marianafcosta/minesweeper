// let uncoveredCells;
// let hasLost;

export const gameStatus = {
    WON: "won",
    LOST: "lost",
    ONGOING: "ongoing",
};

function isCellValid(row, col, game) {
    return row < game.gridSize && col < game.gridSize && row >= 0 && col >= 0;
}

function init(gridSize, numBombs) {
    const game = {
        grid: [],
        gridSize,
        numBombs,
        status: gameStatus.ONGOING,
        uncoveredCells: 0,
    };

    // TODO: Instead of looping through the array again to add the bombs, create an array (n = numBombs) of random grid positions and if the current [i,j] matches, add bomb
    for (let i = 0; i < gridSize; i++) {
        game.grid.push([]);
        for (let j = 0; j < gridSize; j++) {
            game.grid[i].push({ status: "u", contains: " " });
        }
    }

    for (let i = 0; i < numBombs; i++) {
        game.grid[Math.floor(Math.random() * gridSize)][
            Math.floor(Math.random() * gridSize)
        ].contains = "b";
    }

    return game;
}

function checkBombsAround(row, col, game) {
    let rowInc, colInc;
    let bombCount = 0;
    if (game.grid[row][col].contains.match(/b/)) {
        return "b";
    }
    for (rowInc = -1; rowInc < 2; rowInc++) {
        for (colInc = -1; colInc < 2; colInc++) {
            if (isCellValid(row + rowInc, col + colInc, game)) {
                if (game.grid[row + rowInc][col + colInc].contains.match("b")) {
                    bombCount++;
                }
            }
        }
    }
    return `${bombCount <= 0 ? " " : bombCount}`;
}

function uncoverCell(row, col, game) {
    if (
        !isCellValid(row, col, game) ||
        game.grid[row][col].status.match(/\s|[0-9]|b/)
    ) {
        return;
    }
    game.uncoveredCells++;
    game.grid[row][col].status = checkBombsAround(row, col, game);

    if (game.grid[row][col].status.match(/[0-9]/)) {
        return;
    } else if (game.grid[row][col].status.match("b")) {
        game.status = gameStatus.LOST;
        return;
    }

    uncoverCell(row - 1, col, game);
    uncoverCell(row + 1, col, game);
    uncoverCell(row, col - 1, game);
    uncoverCell(row, col + 1, game);
}

function updateGameStatus(game) {
    if (game.uncoveredCells === game.gridSize * game.gridSize - game.numBombs) {
        game.status = gameStatus.WON;
    }
}

export { init, uncoverCell, updateGameStatus };
