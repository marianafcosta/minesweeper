const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
}) 

const GRID_SIZE = 8;

let grid = [
    ["u","u","u","u","u","u","u","u"],
    ['u','u','u','u','u','u','u','u'],
    ['u','u','u','u','u','u','u','u'],
    ['u','u','u','u','u','u','u','u'],
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

const repl = () => {
    rl.question("Please insert the ID of the cell you want to uncover:\n", (answer) => {
        if (answer.match("exit")) {
            rl.close();
        } else if (answer.match("print")) {
            printGrid();
        }
        repl();
    });
}

rl.on("close", () => {
    console.log("Bye!");
    process.exit(0);
});

repl();
