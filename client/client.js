// Client state
let client = null;
let room = null;
let playerId = null;

// DOM elements
const statusElement = document.getElementById('status');
const connectButton = document.getElementById('connect');
const disconnectButton = document.getElementById('disconnect');
const moveButton = document.getElementById('move');
const shootButton = document.getElementById('shoot');
const reloadButton = document.getElementById('reload');
const playersElement = document.getElementById('players');
const logElement = document.getElementById('log');

// Add log message
function log(message) {
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
}

// Update player list
function updatePlayerList(players) {
    playersElement.innerHTML = '';
    players.forEach((player, id) => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        playerElement.textContent = `Player ${id} - Health: ${player.health} - Ammo: ${player.ammo} ${player.isDead ? '(DEAD)' : ''}`;
        playersElement.appendChild(playerElement);
    });
}

// Connect to server
connectButton.addEventListener('click', async () => {
    try {
        client = new Colyseus.Client('ws://localhost:2567');
        room = await client.joinOrCreate('game_room');
        
        playerId = room.sessionId;
        statusElement.textContent = 'Connected';
        statusElement.className = 'status connected';
        
        log(`Connected to room: ${room.id}`);
        log(`Your player ID: ${playerId}`);
        
        // Set up room event handlers
        room.onStateChange.add((state) => {
            updatePlayerList(state.players);
        });
        
        room.onMessage.add((message) => {
            log(`Received message: ${JSON.stringify(message)}`);
        });
        
        room.onLeave.add(() => {
            log('Disconnected from room');
            statusElement.textContent = 'Disconnected';
            statusElement.className = 'status disconnected';
        });
        
    } catch (error) {
        log(`Connection error: ${error.message}`);
    }
});

// Disconnect from server
disconnectButton.addEventListener('click', () => {
    if (room) {
        room.leave();
        room = null;
        client = null;
        playerId = null;
        statusElement.textContent = 'Disconnected';
        statusElement.className = 'status disconnected';
        log('Disconnected from server');
    }
});

// Move player
moveButton.addEventListener('click', () => {
    if (room) {
        const position = {
            x: Math.random() * 10,
            y: 0,
            z: Math.random() * 10
        };
        const rotation = {
            x: 0,
            y: Math.random() * 360,
            z: 0
        };
        
        room.send('playerMove', { ...position, ...rotation });
        log(`Moving to position: ${JSON.stringify(position)}`);
    }
});

// Shoot
shootButton.addEventListener('click', () => {
    if (room) {
        room.send('playerShoot');
        log('Fired weapon');
    }
});

// Reload
reloadButton.addEventListener('click', () => {
    if (room) {
        room.send('weaponReload');
        log('Reloading weapon');
    }
});

// Simulate player hit
document.addEventListener('keydown', (event) => {
    if (event.key === 'h' && room) {
        // Find another player to hit
        const players = Array.from(room.state.players.entries());
        if (players.length > 1) {
            const otherPlayer = players.find(([id]) => id !== playerId);
            if (otherPlayer) {
                room.send('playerHit', {
                    targetId: otherPlayer[0],
                    damage: 25
                });
                log(`Hit player ${otherPlayer[0]} for 25 damage`);
            }
        }
    }
}); 