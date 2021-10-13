import express from "express";
import http from "http";
import { Server } from "socket.io";
import { resolve } from "path";
import { addFlag, init, uncoverCell } from "./logic.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
    res.sendFile(resolve("index.html"));
});

io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} connected`);

    socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnected`);
    });

    socket.on("init", () => {
        socket.emit("init", init(16, 32));
        console.log(`Initialized game for socket ${socket.id}`);
    });

    socket.on("play", ({ row, col, game }) => {
        uncoverCell(row, col, game, true);
        console.log(`Uncovering cell ${row} ${col} for socket ${socket.id}`);
        socket.emit("play", game);
    });

    socket.on("flag", ({ row, col, game }) => {
        addFlag(row, col, game);
        console.log(
            `Placing a flag in cell ${row} ${col} for socket ${socket.id}`
        );
        console.log(game.grid[0][0]);
        socket.emit("flag", game);
    });
});

server.listen(3000, () => {
    console.log("listening on *:3000");
});
