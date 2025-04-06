import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import { monitor } from "@colyseus/monitor";
import cors from "cors";
import { GameRoom } from "./rooms/GameRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

// Create Colyseus server
const gameServer = new Server({
  server: createServer(app),
});

// Register room handlers
gameServer.define("game_room", GameRoom);

// Register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());

// Start the server
gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`); 