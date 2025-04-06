var NetworkManager = pc.createScript('networkManager');

// Network attributes
NetworkManager.attributes.add('serverUrl', {
    type: 'string',
    default: 'ws://localhost:2567',
    title: 'Server URL'
});

NetworkManager.attributes.add('roomName', {
    type: 'string',
    default: 'game_room',
    title: 'Room Name'
});

NetworkManager.attributes.add('maxPlayers', {
    type: 'number',
    default: 10,
    title: 'Max Players'
});

// Initialize the network manager
NetworkManager.prototype.initialize = function() {
    // Initialize network state
    this.client = null;
    this.room = null;
    this.isConnected = false;
    this.playerId = null;
    this.players = {};
    
    // Initialize Colyseus client
    this.initializeClient();
    
    // Listen for events
    this.app.on('network:connect', this.connect, this);
    this.app.on('network:disconnect', this.disconnect, this);
    this.app.on('network:send', this.send, this);
};

// Initialize Colyseus client
NetworkManager.prototype.initializeClient = function() {
    // Create Colyseus client
    this.client = new Colyseus.Client(this.serverUrl);
    
    // Set up client events
    this.client.onOpen.add(this.onClientOpen.bind(this));
    this.client.onClose.add(this.onClientClose.bind(this));
    this.client.onError.add(this.onClientError.bind(this));
};

// Connect to server
NetworkManager.prototype.connect = function() {
    if (this.isConnected) {
        return;
    }
    
    // Join or create room
    this.client.joinOrCreate(this.roomName, {
        maxClients: this.maxPlayers
    }).then(room => {
        this.room = room;
        this.isConnected = true;
        this.playerId = room.sessionId;
        
        // Set up room events
        this.setupRoomEvents();
        
        // Trigger connected event
        this.app.fire('network:connected');
    }).catch(error => {
        console.error('Failed to join room:', error);
        this.app.fire('network:error', error);
    });
};

// Disconnect from server
NetworkManager.prototype.disconnect = function() {
    if (!this.isConnected) {
        return;
    }
    
    // Leave room
    if (this.room) {
        this.room.leave();
        this.room = null;
    }
    
    // Close client
    if (this.client) {
        this.client.close();
    }
    
    this.isConnected = false;
    this.playerId = null;
    this.players = {};
    
    // Trigger disconnected event
    this.app.fire('network:disconnected');
};

// Send message to server
NetworkManager.prototype.send = function(type, data) {
    if (!this.isConnected || !this.room) {
        return;
    }
    
    this.room.send(type, data);
};

// Set up room events
NetworkManager.prototype.setupRoomEvents = function() {
    // On state change
    this.room.onStateChange.add(this.onStateChange.bind(this));
    
    // On message
    this.room.onMessage.add(this.onMessage.bind(this));
    
    // On player join
    this.room.onJoin.add(this.onPlayerJoin.bind(this));
    
    // On player leave
    this.room.onLeave.add(this.onPlayerLeave.bind(this));
};

// On client open
NetworkManager.prototype.onClientOpen = function() {
    console.log('Connected to server');
};

// On client close
NetworkManager.prototype.onClientClose = function() {
    console.log('Disconnected from server');
    this.disconnect();
};

// On client error
NetworkManager.prototype.onClientError = function(error) {
    console.error('Network error:', error);
    this.app.fire('network:error', error);
};

// On state change
NetworkManager.prototype.onStateChange = function(state) {
    // Update game state
    this.updateGameState(state);
};

// On message
NetworkManager.prototype.onMessage = function(message) {
    // Handle message
    this.handleMessage(message);
};

// On player join
NetworkManager.prototype.onPlayerJoin = function(player) {
    // Create player entity
    this.createPlayerEntity(player);
    
    // Trigger player joined event
    this.app.fire('network:playerJoined', player);
};

// On player leave
NetworkManager.prototype.onPlayerLeave = function(player) {
    // Remove player entity
    this.removePlayerEntity(player);
    
    // Trigger player left event
    this.app.fire('network:playerLeft', player);
};

// Update game state
NetworkManager.prototype.updateGameState = function(state) {
    // Update players
    if (state.players) {
        for (var id in state.players) {
            var playerData = state.players[id];
            var player = this.players[id];
            
            if (player) {
                // Update player position
                player.setPosition(
                    playerData.position.x,
                    playerData.position.y,
                    playerData.position.z
                );
                
                // Update player rotation
                player.setEulerAngles(
                    playerData.rotation.x,
                    playerData.rotation.y,
                    playerData.rotation.z
                );
                
                // Update player state
                if (playerData.health) {
                    var health = player.script.health;
                    if (health) {
                        health.currentHealth = playerData.health;
                    }
                }
            }
        }
    }
};

// Handle message
NetworkManager.prototype.handleMessage = function(message) {
    switch (message.type) {
        case 'playerHit':
            this.handlePlayerHit(message);
            break;
            
        case 'playerDeath':
            this.handlePlayerDeath(message);
            break;
            
        case 'weaponFire':
            this.handleWeaponFire(message);
            break;
            
        case 'weaponReload':
            this.handleWeaponReload(message);
            break;
    }
};

// Create player entity
NetworkManager.prototype.createPlayerEntity = function(playerData) {
    var player = new pc.Entity('player_' + playerData.id);
    
    // Add components
    player.addComponent('model', {
        type: 'capsule'
    });
    
    player.addComponent('rigidbody', {
        type: 'dynamic',
        mass: 1,
        friction: 0.5,
        restitution: 0.2
    });
    
    player.addComponent('collision', {
        type: 'capsule',
        height: 2,
        radius: 0.5
    });
    
    // Add scripts
    player.addComponent('script');
    player.script.create('health', {
        attributes: {
            maxHealth: 100
        }
    });
    
    // Set position and rotation
    player.setPosition(
        playerData.position.x,
        playerData.position.y,
        playerData.position.z
    );
    
    player.setEulerAngles(
        playerData.rotation.x,
        playerData.rotation.y,
        playerData.rotation.z
    );
    
    // Add to scene
    this.app.root.addChild(player);
    
    // Store player
    this.players[playerData.id] = player;
};

// Remove player entity
NetworkManager.prototype.removePlayerEntity = function(playerData) {
    var player = this.players[playerData.id];
    if (player) {
        player.destroy();
        delete this.players[playerData.id];
    }
};

// Handle player hit
NetworkManager.prototype.handlePlayerHit = function(message) {
    var player = this.players[message.playerId];
    if (player) {
        var health = player.script.health;
        if (health) {
            health.takeDamage(message.damage);
        }
    }
};

// Handle player death
NetworkManager.prototype.handlePlayerDeath = function(message) {
    var player = this.players[message.playerId];
    if (player) {
        var health = player.script.health;
        if (health) {
            health.die();
        }
    }
};

// Handle weapon fire
NetworkManager.prototype.handleWeaponFire = function(message) {
    var player = this.players[message.playerId];
    if (player) {
        var weapon = player.script.weapon;
        if (weapon) {
            weapon.fire();
        }
    }
};

// Handle weapon reload
NetworkManager.prototype.handleWeaponReload = function(message) {
    var player = this.players[message.playerId];
    if (player) {
        var weapon = player.script.weapon;
        if (weapon) {
            weapon.reload();
        }
    }
}; 