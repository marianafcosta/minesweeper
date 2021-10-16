import express from "express";
import session from "express-session";
import cors from "cors";
import http from "http";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import { MongoClient } from "mongodb";
import argon2 from "argon2";

import {
    addFlag,
    gameStatus,
    init,
    uncoverCell,
    updateGameStatus,
} from "./logic.js";

const app = express();

app.use(bodyParser.json());
app.use(
    cors({
        origin: "http://localhost:5000",
        credentials: true,
    })
);
app.use(
    session({
        secret: "minesweeper",
        name: "minesweeper",
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 10, // NOTE: 10 days
            // httpOnly: true,
            // sameSite: "lax", // NOTE: CSRF
            // secure: false, // NOTE: Cookie only works in HTTPS if set to true (i.e. in production)
        },
        saveUninitialized: true,
        resave: false,
    })
);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5000", credentials: true },
});

// const wrap = (middleware) => (socket, next) =>
//     middleware(socket.request, {}, next);

// io.use(
//     wrap(
//         session({
//             secret: "minesweeper",
//             name: "minesweeper",
//             cookie: {
//                 maxAge: 1000 * 60 * 60 * 24 * 10, // NOTE: 10 days
//                 // httpOnly: true,
//                 // sameSite: "lax", // NOTE: CSRF
//                 // secure: false, // NOTE: Cookie only works in HTTPS if set to true (i.e. in production)
//             },
//             saveUninitialized: true,
//             resave: false,
//         })
//     )
// );

const url = "mongodb://localhost:27017";
const dbName = "minesweeper";
const mongoClient = new MongoClient(url);

async function connectDb() {
    await mongoClient.connect();
    return mongoClient.db(dbName);
}

const db = await connectDb();

async function insertPlayer(username, password) {
    db.collection("players").insertOne({
        username,
        password: await argon2.hash(password),
    });
}

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

// TODO: Remove this
// insertPlayer("test10", "test10");

io.on("connection", (socket) => {
    const session = socket.request.session;
    console.log(session);
    console.log(`Socket ${socket.id} connected`);

    socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnected`);
    });

    socket.on("init", ({ gridSize, numBombs }) => {
        socket.emit("init", init(gridSize, numBombs));
        console.log(`Initialized game for socket ${socket.id}`);
    });

    socket.on("play", async ({ row, col, game }) => {
        console.log(session);
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

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await db.collection("players").findOne({ username });

    if (!user) {
        res.sendStatus(404);
        return;
    }

    const valid = await argon2.verify(user.password, password);
    if (!valid) {
        res.sendStatus(401);
        return;
    }

    if (req.session.userId) {
        res.sendStatus(304);
    } else {
        req.session.userId = user._id;
        res.sendStatus(200);
    }
});

server.listen(3000, () => {
    console.log("listening on *:3000");
});
