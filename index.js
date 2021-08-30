const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
}) 

const GRID_SIZE = 8;

let grid = [
    ['u','u','u','u','u','u','u','u'],
    ['u','u','u','u','u','u','u','u'],
    ['u','u','u','u','u','u','u','u'],
    ['u','u','b','u','u','u','u','u'],
    ['u','u','u','u','u','u','u','u'],
    ['u','u','u','u','u','u','u','u'],
    ['u','u','u','u','u','u','u','u'],
    ['u','u','u','u','u','u','u','u'],
];

const printGrid = () => {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            process.stdout.write(`|${grid[i][j]}|`);
        }
        process.stdout.write('\n');
    }
    process.stdout.write('\n');   
}

const isCellValid = (row, col) => {
    return row < GRID_SIZE && col < GRID_SIZE && row >= 0 && col >= 0;
}

const checkBomb = (row, col) => {
    let rowInc, colInc;
    let bombCount = 0;
    for (rowInc = -1; rowInc < 2; rowInc++) {
        for (colInc = -1; colInc < 2; colInc++) {
            if (isCellValid(row+rowInc, col+colInc)) {
                if (grid[row+rowInc][col+colInc].match('b')) {
                    bombCount++;
                }
            } else { continue };
        }
    }
    return `${bombCount <= 0 ? ' ' : bombCount}`
}

const uncoverCell = (row, col) => {
    if (row >= GRID_SIZE || col >= GRID_SIZE || row < 0 || col < 0 || grid[row][col].match(/\s|[0-9]|b/)) {
        return;
    }
    grid[row][col] = checkBomb(row, col);
    uncoverCell(row-1,col);
    uncoverCell(row+1,col);
    uncoverCell(row,col-1);
    uncoverCell(row,col+1);
}

const parseAnswer = (answer) => {
    if (answer.match("exit")) {
        rl.close();
    } else if (answer.match(/[0-7][0-7]/)) {
        uncoverCell(parseInt(answer[0]), parseInt(answer[1]));
    } else {
        console.log("Invalid command");
    }
}

const repl = () => {
    rl.question("Cell to uncover (<row><col>):\n", (answer) => {
        parseAnswer(answer);
        printGrid();
        repl();
    });
}

rl.on("close", () => {
    console.log("Bye!");
    process.exit(0);
});

repl();
