const initButton = document.getElementById("send");
const playForm = document.getElementById("play");
const login = document.getElementById("login");
const logout = document.getElementById("logout");

let game;
let socket;

const gameStatus = {
    WON: "won",
    LOST: "lost",
    ONGOING: "ongoing",
};

const cellStatus = {
    BOMB: "B",
    HIDDEN: ".",
    EMPTY: " ",
    FLAG: "F",
};

function initSocket() {
    socket.on("init", (_game) => {
        updateGame(_game);
        document.getElementById("row").max = game.gridSize - 1;
        document.getElementById("col").max = game.gridSize - 1;
        updateStatus();
    });

    socket.on("play", (_game) => {
        updateGame(_game);
    });

    socket.on("flag", (_game) => {
        updateGame(_game);
    });

    socket.on("end", ({ game, highScores }) => {
        updateGame(game);
        updateStatus();
        updateHighScores(highScores);
        socket.emit("disconnect");
    });
}

// TODO: Generalize drawing functions in logic
function drawCell(cell, maxCellDigits, showBombs) {
    let displayText;
    if (showBombs && cell.bomb) {
        displayText = cellStatus.BOMB;
    } else {
        displayText = cell.status;
    }

    return `|${displayText}${" ".repeat(maxCellDigits - 1)}|`;
}

function printGrid(showBombs) {
    let display = "";
    display += `|${" ".repeat(game.maxCellDigits)}|`;

    for (let i = 0; i < game.gridSize; i++) {
        display += `|${i}${" ".repeat(
            game.maxCellDigits - (Math.floor(i / 10) + 1)
        )}|`;
    }

    display += "\n";

    for (let i = 0; i < game.gridSize; i++) {
        display += `|${i}${" ".repeat(
            game.maxCellDigits - (Math.floor(i / 10) + 1)
        )}|`;

        for (let j = 0; j < game.gridSize; j++) {
            display += drawCell(game.grid[i][j], game.maxCellDigits, showBombs);
        }
        display += "\n";
    }

    display += "\n";

    return display;
}

function printGame() {
    document.getElementById("grid").textContent = printGrid(
        game.status !== gameStatus.ONGOING
    );
}

function updateStatus() {
    const status = document.getElementById("status");
    if (game.status !== gameStatus.ONGOING) {
        status.innerText = `You ${game.status}!`;
    } else {
        status.innerText = "";
    }
}

function updateGame(_game) {
    console.log("Received initialized game");
    game = _game;
    printGame();
}

function updateHighScores(highScores) {
    const list = document.getElementById("high-scores");
    list.innerHTML = "";

    highScores.forEach((player) => {
        let li = document.createElement("li");
        li.innerText = `${player.username}: ${player.highScore.score}`;
        list.appendChild(li);
    });
}

initButton.addEventListener("click", () => {
    console.log("Request game initialization");
    const gridSize = parseInt(document.getElementById("grid-size").value, 10);
    const numBombs = parseInt(document.getElementById("num-bombs").value, 10);
    socket = io("ws://localhost:3000", { withCredentials: true });
    initSocket();
    socket.emit("init", {
        gridSize: gridSize || 16,
        numBombs: numBombs || 32,
    });
});

playForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (game.status === gameStatus.ONGOING) {
        console.log("Playing");
        const row = parseInt(document.getElementById("row").value, 10);
        const col = parseInt(document.getElementById("col").value, 10);
        const flag = document.getElementById("flag").checked;
        socket.emit(flag ? "flag" : "play", { row, col, game });
    }
});

login.addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3000/login", {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        credentials: "include", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: document.getElementById("username").value,
            password: document.getElementById("password").value,
        }),
    });
});

logout.addEventListener("click", async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3000/logout", {
        method: "POST",
        mode: "cors", // no-cors, *cors, same-origin
        credentials: "include", // include, *same-origin, omit
    });
});
