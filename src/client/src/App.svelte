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
        BOMB: "BOMB",
        HIDDEN: "HIDDEN",
        EMPTY: "EMPTY",
        FLAG: "FLAG",
    };

    const cellIcons = {
        BOMB: "B",
        HIDDEN: "",
        EMPTY: "",
        FLAG: "F",
    };

    function cellColor(showBombs, cell) {
        if (showBombs && cell.bomb) {
            return "cell-bomb";
        } else {
            switch (cell.status) {
                case cellStatus.BOMB:
                    return "cell-bomb";
                case cellStatus.HIDDEN:
                    return "cell-hidden";
                case cellStatus.FLAG:
                    return "cell-flag";
                case cellStatus.EMPTY:
                    return "cell-empty";
                default:
                    return "";
            }
        }
    }

    function cellContent(showBombs, cell) {
        if (showBombs && cell.bomb) {
            return cellIcons[cellStatus.BOMB];
        } else {
            return cellIcons[cell.status] !== undefined
                ? cellIcons[cell.status]
                : cell.status;
        }
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
    <header><h1>Minesweeper</h1></header>
    <div class="content">
        <div class="login-container">
            <h3>Login to save your scores!</h3>
            <form on:submit|preventDefault={login} id="login">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required />
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required />
                <div class="login-actions">
                    <input type="submit" value="Login" />
                    <input
                        type="button"
                        on:click={logout}
                        id="logout"
                        value="Logout"
                    />
                </div>
            </form>
        </div>
        <div class="game-container">
            <h3 id="status" />
            <form on:submit|preventDefault={play} id="play" class="play">
                <div>
                    <label for="row">Row</label>
                    <input
                        type="number"
                        id="row"
                        name="row"
                        min="0"
                        max="15"
                        required
                    />
                </div>
                <div>
                    <label for="col">Column</label>
                    <input
                        type="number"
                        id="col"
                        name="col"
                        min="0"
                        max="15"
                        required
                    />
                </div>
                <div>
                    <label for="flag">Flag?</label>
                    <input type="checkbox" id="flag" name="flag" />
                </div>
                <input type="submit" value="Play" />
            </form>
            {#if game}
                <div
                    style={`grid-template-columns: repeat(${game.gridSize}, 1fr);`}
                    class="new-grid"
                >
                    {#each game.grid as row}
                        {#each row as cell}
                            <div
                                class={`cell ${cellColor(
                                    game.status !== gameStatus.ONGOING,
                                    cell
                                )}`}
                            >
                                {cellContent(
                                    game.status !== gameStatus.ONGOING,
                                    cell
                                )}
                            </div>
                        {/each}
                    {/each}
                </div>
            {/if}
        </div>
        <div class="setup-container">
            <h3>Setup a new game</h3>
            <form id="init" class="init">
                <label for="grid-size">Grid size</label>
                <input
                    type="number"
                    id="grid-size"
                    name="grid-size"
                    min="1"
                    max="16"
                />
                <label for="num-bombs">Number of bombs</label>
                <input type="number" id="num-bombs" name="num-bombs" min="0" />
            </form>
            <div class="buttons">
                <button on:click={initializeGame} id="send" type="button"
                    >Initalize game</button
                >
            </div>
        </div>
        <div class="highscores-container">
            <h3>High scores</h3>
            <ul id="high-scores" />
        </div>
    </div>
</main>

<style>
    main {
        padding: 1em;
        max-width: 800px;
        margin: auto;
    }

    .content {
        display: grid;
        gap: 16px;
        grid-template-areas:
            "game login"
            "game setup"
            "highscores highscores";
    }

    .content > * {
        background-color: beige;
        padding: 12px;
        border-radius: 8px;
    }

    .login-container {
        grid-area: login;
    }

    .game-container {
        grid-area: game;
    }

    .highscore-container {
        grid-area: highscores;
    }

    .setup-container {
        grid-area: setup;
    }
    .cell {
        aspect-ratio: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid black;
    }
    .cell-hidden {
        background-color: grey;
    }
    .cell-bomb {
        background-color: red;
    }
    .cell-flag {
        background-color: green;
    }
    .cell-empty {
        background-color: white;
    }

    .new-grid {
        display: grid;
        grid-template-columns: repeat(16, 1fr);
        gap: 8px;
        width: 500px;
    }

    #login {
        display: flex;
        flex-direction: column;
    }

    #play {
        display: flex;
        flex-direction: row;
    }

    #play > *:not(:first-child) {
        margin-left: 16px;
    }

    .login-actions {
        margin: auto;
    }
</style>
