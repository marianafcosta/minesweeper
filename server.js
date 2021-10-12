import express from "express";
import http from "http";
import { Server } from "socket.io";
import { resolve } from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
    res.sendFile(resolve("index.html"));
});

io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("disconnect", () => {
        console.log("a user disconnected");
    });

    socket.on("play", (game) => {
        console.log("received game state", game);
    });
});

server.listen(3000, () => {
    console.log("listening on *:3000");
});
