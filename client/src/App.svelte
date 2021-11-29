<script>
    import { io } from "socket.io-client";
    import { onMount } from "svelte";

    let socket;
    let game;
    let currentUser;

    const validGridSizes = [8, 16];
    let selectedGridSize = 8;
    let maxGridSize = selectedGridSize;
    let selectedNumBombs;
    let highScores = [];
    let username;
    let password;

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

    function updateGame(_game) {
        console.log("Received initialized game");
        game = _game;
    }

    function initSocket() {
        socket.on("init", (_game) => {
            updateGame(_game);
            maxGridSize = game.gridSize - 1;
        });

        socket.on("play", (_game) => {
            updateGame(_game);
        });

        socket.on("flag", (_game) => {
            updateGame(_game);
        });

        socket.on("end", ({ game, highScores: _highScores }) => {
            updateGame(game);
            highScores = _highScores;
            socket.disconnect();
        });
    }

    function initializeGame() {
        console.log("Request game initialization");
        const gridSize = parseInt(selectedGridSize);
        const numBombs = parseInt(selectedNumBombs);
        socket = io(location.origin.replace(/^http/, "ws"), {
            withCredentials: true,
        });
        initSocket();
        socket.emit("init", {
            gridSize: gridSize || 16,
            numBombs: numBombs || 32,
        });
    }

    function play(row, col, flag) {
        if (game.status === gameStatus.ONGOING) {
            console.log("Playing");
            socket.emit(flag ? "flag" : "play", { row, col, game });
        }
    }

    async function login() {
        const response = await fetch("/api/login", {
            method: "POST", // *GET, POST, PUT, DELETE, etc.
            mode: "same-origin", // no-cors, *cors, same-origin
            credentials: "include", // include, *same-origin, omit
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
            }),
        });
        if (response.status === 200) {
            currentUser = username;
        }
    }

    async function logout() {
        await fetch("/api/logout", {
            method: "POST",
            mode: "same-origin", // no-cors, *cors, same-origin
            credentials: "include", // include, *same-origin, omit
        });
    }

    async function fetchCurrentUser() {
        const response = await fetch("/api/me", {
            credentials: "include",
        });

        if (response.status === 200) {
            currentUser = (await response.json()).username;
        }
    }

    onMount(async () => {
        fetchCurrentUser();
    });
</script>

<main>
    <header><h1>Minesweeper</h1></header>
    <div class="content">
        <div class="login-container">
            <h3>
                {currentUser
                    ? `Hello, ${currentUser}`
                    : "Login to save your scores!"}
            </h3>
            <form on:submit|preventDefault={login} id="login">
                <label for="username">Username</label>
                <input
                    bind:value={username}
                    type="text"
                    id="username"
                    name="username"
                    required
                />
                <label for="password">Password</label>
                <input
                    bind:value={password}
                    type="password"
                    id="password"
                    name="password"
                    required
                />
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
            {#if game}
                <div>
                    {#if game.status !== gameStatus.ONGOING}
                        <h3 id="status">{`You ${game.status}!`}</h3>
                        <h4 id="score">{`Score: ${game.score}`}</h4>
                    {/if}
                    <!-- NOTE: +1 for the row number indicator -->
                    <div
                        style={`grid-template-columns: repeat(${
                            game.gridSize + 1
                        }, 1fr);`}
                        class="new-grid"
                    >
                        {#each Array(game.gridSize + 1) as _, colIndex}
                            {#if colIndex === 0}
                                <div />
                            {:else}
                                <div>{colIndex - 1}</div>
                            {/if}
                        {/each}
                        {#each game.grid as row, rowIndex}
                            <div>{rowIndex}</div>
                            {#each row as cell, colIndex}
                                <div
                                    on:click|preventDefault={(event) => {
                                        console.log(event);
                                        play(rowIndex, colIndex);
                                    }}
                                    on:contextmenu|preventDefault={() =>
                                        play(rowIndex, colIndex, true)}
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
                </div>
            {:else}
                <h3>No game started</h3>
            {/if}
        </div>
        <div class="setup-container">
            <h3>Setup a new game</h3>
            <form
                id="init"
                class="init"
                on:submit|preventDefault={initializeGame}
            >
                <label for="grid-size">Grid size</label>
                <select bind:value={selectedGridSize}>
                    {#each validGridSizes as size}
                        <option value={size}>
                            {size}
                        </option>
                    {/each}
                </select>
                <label for="num-bombs">Number of bombs</label>
                <input
                    type="number"
                    bind:value={selectedNumBombs}
                    id="num-bombs"
                    name="num-bombs"
                    min="0"
                />
                <button type="submit"> Initialize Game </button>
            </form>
        </div>
        <div class="highscores-container">
            <div>
                <h3>High scores - 8x8</h3>
                <ul id="high-scores-8">
                    {#each highScores as value}
                        {#if value.gameMode === 8}
                            <li>{`${value.username}: ${value.score}`}</li>
                        {/if}
                    {/each}
                </ul>
            </div>
            <div>
                <h3>High scores - 16x16</h3>
                <ul id="high-scores-16">
                    {#each highScores as value}
                        {#if value.gameMode === 16}
                            <li>{`${value.username}: ${value.score}`}</li>
                        {/if}
                    {/each}
                </ul>
            </div>
        </div>
    </div>
</main>

<style>
    main {
        padding: 1em;
        max-width: 1200px;
        margin: auto;
    }

    .content {
        display: grid;
        gap: 16px;
        grid-template-columns: 1fr auto;
        grid-template-areas:
            "game login"
            "game setup"
            "highscores highscores";
    }

    .content > * {
        padding: 12px;
        border-radius: 8px;
    }

    .content > *:not(.game-container) {
        background-color: rgb(240, 240, 240);
    }

    .login-container {
        grid-area: login;
        width: 300px;
    }

    .game-container {
        grid-area: game;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .highscores-container {
        grid-area: highscores;
        display: flex;
        flex-direction: row;
    }

    .highscores-container > * {
        flex: 1;
    }

    .setup-container {
        grid-area: setup;
        width: 300px;
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

    .login-actions {
        margin: auto;
    }
</style>
