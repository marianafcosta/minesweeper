import express from "express";
import session from "express-session";
import http from "http";
import { Server } from "socket.io";
import { MongoClient } from "mongodb";

import {
    addFlag,
    gameStatus,
    init,
    uncoverCell,
    updateGameStatus,
} from "./logic.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5000" } });

const wrap = (middleware) => (socket, next) =>
    middleware(socket.request, {}, next);

io.use(
    wrap(
        session({
            secret: "minesweeper",
            name: "minesweeper",
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 10, // NOTE: 1 day
                httpOnly: true,
                sameSite: "lax", // NOTE: CSRF
                secure: false, // NOTE: Cookie only works in HTTPS if set to true (i.e. in production)
            },
            saveUninitialized: false,
            resave: false,
        })
    )
);

const url = "mongodb://localhost:27017";
const dbName = "minesweeper";
const mongoClient = new MongoClient(url);

async function connectDb() {
    await mongoClient.connect();
    return mongoClient.db(dbName);
}

const db = await connectDb();

async function updateHighScore(username, score) {
    db.collection("players").updateOne(
        { username },
        { $max: { highScore: score } }
    );
}

async function fetchHighScores() {
    return db
        .collection("players")
        .find()
        .project({ password: 0, _id: 0 })
        .sort({ "highScore.score": 1, "highScore.timestamp": -1 })
        .limit(10)
        .toArray();
}

app.post("/login", (req, res) => {});

io.on("connection", (socket) => {
    const session = socket.request.session;
    console.log(`Socket ${socket.id} connected`);

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
                    await updateHighScore("test2", {
                        score: game.score,
                        timestamp: Date.now(),
                    });
                }

                let highScores = await fetchHighScores();
                console.log(highScores);

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

server.listen(3000, () => {
    console.log("listening on *:3000");
});
