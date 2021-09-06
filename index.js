const chalk = require('chalk');
const readline = require("readline");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

const GRID_SIZE = 16;
const NUM_BOMBS = 32;
let uncoveredCells = 0;

const buildGrid = () => {
	const grid = [];
	for (let i = 0; i < GRID_SIZE; i++) {
		grid.push([]);
		for (let j = 0; j < GRID_SIZE; j++) {
			grid[i].push({ status: 'u', contains: ' ' });
		}
	}
	return grid;
}

const fillGridWBombs = (nbombs, grid) => {
	for (let i = 0; i < nbombs; i++) {
		grid[Math.floor(Math.random() * GRID_SIZE)][Math.floor(Math.random() * GRID_SIZE)].contains = 'b';
	}
}

const printGrid = (grid) => {
	process.stdout.write(chalk.yellow('| |'));
	for (let i = 0; i < GRID_SIZE; i++) {
		process.stdout.write(chalk.yellow(`|${i}|`));
	}

	process.stdout.write('\n');
	for (let i = 0; i < GRID_SIZE; i++) {
		process.stdout.write(chalk.yellow(`|${i}|`));
		for (let j = 0; j < GRID_SIZE; j++) {
			if (grid[i][j].status.match(/b/)) {
				process.stdout.write(`|${chalk.red(grid[i][j].status)}|`);
			} else if (grid[i][j].status.match(/F/)) {
				process.stdout.write(`|${chalk.green(grid[i][j].status)}|`);
			} else {
				process.stdout.write(`|${grid[i][j].status}|`);
			}
		}
		process.stdout.write('\n');
	}
	process.stdout.write('\n');
}

const showBombs = (grid) => {
	for (let i = 0; i < GRID_SIZE; i++) {
		for (let j = 0; j < GRID_SIZE; j++) {
			if (grid[i][j].contains.match(/b/)) {
				grid[i][j].status = 'b';
			}
		}
	}
}
const isCellValid = (row, col) => {
	return row < GRID_SIZE && col < GRID_SIZE && row >= 0 && col >= 0;
}

const checkBombsAround = (row, col, grid) => {
	let rowInc, colInc;
	let bombCount = 0;
	if (grid[row][col].contains.match(/b/)) {
		return 'b'
	}
	for (rowInc = -1; rowInc < 2; rowInc++) {
		for (colInc = -1; colInc < 2; colInc++) {
			if (isCellValid(row + rowInc, col + colInc)) {
				if (grid[row + rowInc][col + colInc].contains.match('b')) {
					bombCount++;
				}
			} else { continue };
		}
	}
	return `${bombCount <= 0 ? ' ' : bombCount}`
}

const hasLost = (row, col, grid) => {
	return grid[row][col].contains.match(/b/);
}

const uncoverCell = (row, col, grid) => {
	if (row >= GRID_SIZE || col >= GRID_SIZE || row < 0 || col < 0 || grid[row][col].status.match(/\s|[0-9]|b/)) {
		return;
	}
	uncoveredCells++;
	grid[row][col].status = checkBombsAround(row, col, grid);
	if (grid[row][col].status.match(/[0-9]/) || grid[row][col].contains.match(/b/)) {
		return;
	}
	uncoverCell(row - 1, col, grid);
	uncoverCell(row + 1, col, grid);
	uncoverCell(row, col - 1, grid);
	uncoverCell(row, col + 1, grid);
}

const addFlag = (row, col, grid) => {
	if (grid[row][col].status.match('u')) {
		grid[row][col].status = 'F';
	}
}

const parseAnswer = (answer, grid) => {
	if (answer.match("exit")) {
		rl.close();
	} else if (answer.match(/^flag/)) {
		let row = Math.floor(parseInt(answer.split(' ')[1]) / 100);
		let col = Math.floor(parseInt(answer.split(' ')[1]) % 100);
		addFlag(row, col, grid);
	} else if (parseInt(answer) !== NaN) {
		let row = Math.floor(parseInt(answer) / 100);
		let col = Math.floor(parseInt(answer) % 100);
		uncoverCell(row, col, grid);
		if (hasLost(row, col, grid)) {
			console.log('Bomb hit!');
			showBombs(grid);
			printGrid(grid);
			rl.close();
		}
		if (uncoveredCells === GRID_SIZE * GRID_SIZE - NUM_BOMBS) {
			console.log("You won!");
			console.log(`Time elapsed: ${(process.hrtime.bigint() - start) / 1000000000n}`)
			printGrid(grid);
			rl.close();
		}
	} else {
		console.log("Invalid command");
	}
}

const repl = (grid) => {
	rl.question("Cell to uncover (<row><col>):\n", (answer) => {
		parseAnswer(answer, grid);
		printGrid(grid);
		repl(grid);
	});
}

rl.on("close", () => {
	console.log("Bye!");
	process.exit(0);
});

const grid = buildGrid();
fillGridWBombs(NUM_BOMBS, grid);
let start = process.hrtime.bigint();

repl(grid);
