export const gameStatus = {
    WON: "won",
    LOST: "lost",
    ONGOING: "ongoing",
};

// TODO: It can also contain a number encoding the number of nearby bombs
export const cellStatus = {
    BOMB: "B",
    HIDDEN: ".",
    EMPTY: " ",
    FLAG: "F",
};

function isCellValid(row, col, game) {
    return row < game.gridSize && col < game.gridSize && row >= 0 && col >= 0;
}

// TODO: Score isn't the best name, because the lower the time spent, the better
function init(gridSize, numBombs) {
    const game = {
        grid: [],
        gridSize,
        numBombs,
        maxCellDigits: Math.floor(gridSize / 10) + 1,
        status: gameStatus.ONGOING,
        startTime: Number(process.hrtime.bigint()), // NOTE: JSON.stringify() doesn't know how to handle BigInt's
        score: 0,
        uncoveredCells: 0,
    };

    // TODO: Instead of looping through the array again to add the bombs, create an array (n = numBombs) of random grid positions and if the current [i,j] matches, add bomb
    for (let i = 0; i < gridSize; i++) {
        game.grid.push([]);
        for (let j = 0; j < gridSize; j++) {
            game.grid[i].push({ status: cellStatus.HIDDEN, bomb: false });
        }
    }

    for (let i = 0; i < numBombs; i++) {
        game.grid[Math.floor(Math.random() * gridSize)][
            Math.floor(Math.random() * gridSize)
        ].bomb = true;
    }

    return game;
}

function addFlag(row, col, game) {
    if (game.grid[row][col].status === cellStatus.HIDDEN) {
        game.grid[row][col].status = cellStatus.FLAG;
    } else if (game.grid[row][col].status === cellStatus.FLAG) {
        game.grid[row][col].status = cellStatus.HIDDEN;
    }
}

function checkBombsAround(row, col, game) {
    let rowInc, colInc;
    let bombCount = 0;
    if (game.grid[row][col].bomb) {
        game.grid[row][col].status = cellStatus.BOMB;
        return;
    }
    for (rowInc = -1; rowInc < 2; rowInc++) {
        for (colInc = -1; colInc < 2; colInc++) {
            if (isCellValid(row + rowInc, col + colInc, game)) {
                if (game.grid[row + rowInc][col + colInc].bomb) {
                    bombCount++;
                }
            }
        }
    }

    game.grid[row][col].status =
        bombCount <= 0 ? cellStatus.EMPTY : `${bombCount}`;
}

function uncoverCell(row, col, game, firstCall) {
    if (game.status !== gameStatus.ONGOING) {
        return;
    }

    if (
        !isCellValid(row, col, game) ||
        game.grid[row][col].status === cellStatus.EMPTY ||
        game.grid[row][col].status === cellStatus.BOMB ||
        (game.grid[row][col].status === cellStatus.FLAG && !firstCall) ||
        !isNaN(game.grid[row][col].status)
    ) {
        return;
    }

    game.uncoveredCells++;
    checkBombsAround(row, col, game);

    if (
        !isNaN(game.grid[row][col].status) &&
        game.grid[row][col].status !== cellStatus.EMPTY
    ) {
        return;
    } else if (game.grid[row][col].status === cellStatus.BOMB) {
        game.status = gameStatus.LOST;
        game.score =
            (Number(process.hrtime.bigint()) - game.startTime) / 1000000000;
        return;
    }

    uncoverCell(row - 1, col, game, false);
    uncoverCell(row + 1, col, game, false);
    uncoverCell(row, col - 1, game, false);
    uncoverCell(row, col + 1, game, false);
}

function updateGameStatus(game) {
    if (
        game.uncoveredCells === game.gridSize * game.gridSize - game.numBombs &&
        game.status === gameStatus.ONGOING // NOTE: We have to check this because if a bomb was found, the lost game status that was already set would overwritten
    ) {
        game.status = gameStatus.WON;
        game.score =
            (Number(process.hrtime.bigint()) - game.startTime) / 1000000000;
    }
}

export { init, uncoverCell, updateGameStatus, addFlag };
