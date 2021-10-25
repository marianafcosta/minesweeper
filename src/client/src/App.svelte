<script>
    import { io } from "socket.io-client";

    let socket;
    let game;

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
                display += drawCell(
                    game.grid[i][j],
                    game.maxCellDigits,
                    showBombs
                );
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
            // socket.emit("disconnect");
            socket.disconnect();
        });
    }

    function initializeGame() {
        console.log("Request game initialization");
        const gridSize = parseInt(
            document.getElementById("grid-size").value,
            10
        );
        const numBombs = parseInt(
            document.getElementById("num-bombs").value,
            10
        );
        socket = io("ws://localhost:3000", { withCredentials: true });
        initSocket();
        socket.emit("init", {
            gridSize: gridSize || 16,
            numBombs: numBombs || 32,
        });
    }

    function play() {
        if (game.status === gameStatus.ONGOING) {
            console.log("Playing");
            const row = parseInt(document.getElementById("row").value, 10);
            const col = parseInt(document.getElementById("col").value, 10);
            const flag = document.getElementById("flag").checked;
            socket.emit(flag ? "flag" : "play", { row, col, game });
        }
    }

    async function login() {
        await fetch("http://localhost:3000/login", {
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
    }

    async function logout() {
        await fetch("http://localhost:3000/logout", {
            method: "POST",
            mode: "cors", // no-cors, *cors, same-origin
            credentials: "include", // include, *same-origin, omit
        });
    }
</script>

<main>
    <h1>Minesweeper</h1>
    <form on:submit|preventDefault={login} id="login">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required />
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required />
        <input type="submit" value="Login" />
    </form>
    <button on:click={logout} id="logout">Logout</button>
    <ul id="high-scores" />
    <p id="status" />
    <div class="buttons">
        <button on:click={initializeGame} id="send" type="button"
            >Initalize game</button
        >
    </div>
    <form id="init" class="init">
        <label for="grid-size">Grid size</label>
        <input type="number" id="grid-size" name="grid-size" min="1" max="16" />
        <label for="num-bombs">Number of bombs</label>
        <input type="number" id="num-bombs" name="num-bombs" min="0" />
    </form>
    <form on:submit|preventDefault={play} id="play" class="play">
        <label for="row">Row</label>
        <input type="number" id="row" name="row" min="0" max="15" required />
        <label for="col">Column</label>
        <input type="number" id="col" name="col" min="0" max="15" required />
        <label for="flag">Flag?</label>
        <input type="checkbox" id="flag" name="flag" />
        <input type="submit" value="Play" />
    </form>
    <pre><code id="grid"></code></pre>
</main>

<style>
</style>
