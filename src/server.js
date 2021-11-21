import express from "express";
import session from "express-session";
import cors from "cors";
import http from "http";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import argon2 from "argon2";

import {
    addFlag,
    gameStatus,
    init,
    uncoverCell,
    updateGameStatus,
} from "./logic.js";
import { DB } from "./db.js";

const app = express();

app.use(bodyParser.json());
app.use(
    cors({
        origin: "http://localhost:5000",
        credentials: true,
    })
);

const sessionMiddleware = session({
    secret: "minesweeper",
    name: "minesweeper",
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 10, // NOTE: 10 days
        // httpOnly: true,
        // sameSite: "lax", // NOTE: CSRF
        // secure: false, // NOTE: Cookie only works in HTTPS if set to true (i.e. in production)
    },
    saveUninitialized: false,
    resave: false,
});

app.use(sessionMiddleware);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5000", credentials: true },
});

const wrap = (middleware) => (socket, next) =>
    middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

const db = new DB();
await db.connect();

// db.resetHighScores();

io.on("connection", (socket) => {
    const session = socket.request.session;
    console.log("socket session ", socket.request.session);

    socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnected`);
    });

    socket.on("init", ({ gridSize, numBombs }) => {
        socket.emit("init", init(gridSize, numBombs));
        console.log(`Initialized game for socket ${socket.id}`);
    });

    socket.on("play", async ({ row, col, game }) => {
        if (row !== null && col !== null && game) {
            console.log(
                `Uncovering cell ${row} ${col} for socket ${socket.id}`
            );
            uncoverCell(row, col, game, true);
            updateGameStatus(game);

            if (game.status !== gameStatus.ONGOING) {
                if (game.status === gameStatus.WON) {
                    // TODO: The schema should be specified somewhere
                    await db.updateHighScore(session.username, {
                        score: game.score,
                        timestamp: Date.now(),
                        gameMode: game.gridSize,
                    });
                }

                let highScores = await db.fetchHighScores();

                socket.emit("end", {
                    game,
                    highScores,
                });
            } else {
                socket.emit("play", game);
            }
        }
    });

    socket.on("flag", ({ row, col, game }) => {
        if (row !== null && col !== null && game) {
            addFlag(row, col, game);
            console.log(
                `Placing a flag in cell ${row} ${col} for socket ${socket.id}`
            );
            socket.emit("flag", game);
        }
    });
});

app.get("/me", async (req, res) => {
    const username = req.session.username;
    console.log("username", username);

    if (username) {
        res.status(200);
        res.send(JSON.stringify({ username }));
    } else {
        res.sendStatus(404);
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await db.findPlayer(username);

    if (!user) {
        res.sendStatus(404);
        return;
    }

    const valid = await argon2.verify(user.password, password);
    if (!valid) {
        res.sendStatus(401);
        return;
    }

    req.session.username = user.username;
    res.sendStatus(200);
});

app.post("/logout", async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.clearCookie("minesweeper");
            res.sendStatus(200);
        }
    });
});

server.listen(3000, () => {
    console.log("listening on *:3000");
});
