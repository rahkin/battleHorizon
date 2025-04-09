import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import { createServer } from "http";
import express from "express";
import path from "path";
import { GameRoom } from "./rooms/GameRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

// Configure proper MIME types for JavaScript modules
app.use((_, res, next) => {
    res.type('application/javascript; charset=utf-8');
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    next();
});

// Enable CORS for development
app.use((_, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "../public")));

// Serve client files with proper MIME types
app.use(express.static(path.join(__dirname, "../../client/world-fps"), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
    }
}));

// Create HTTP & WebSocket servers
const server = createServer(app);
const gameServer = new Server({
    transport: new WebSocketTransport({
        server,
        pingInterval: 5000,
        pingMaxRetries: 3
    })
});

// Register room handlers
gameServer.define("game", GameRoom);

// Register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());

// Start the server
gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`); 