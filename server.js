import express from "express";
import http from "http";
import { Server } from "socket.io";
import { resolve } from "path";
import { init } from "./logic.js";

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
});

server.listen(3000, () => {
    console.log("listening on *:3000");
});
