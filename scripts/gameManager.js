var GameManager = pc.createScript('gameManager');

// Game mode attributes
GameManager.attributes.add('gameMode', {
    type: 'string',
    default: 'deathmatch',
    title: 'Game Mode',
    description: 'The current game mode',
    enum: [
        { 'deathmatch': 'Deathmatch' },
        { 'bomb': 'Bomb Plant' }
    ]
});

GameManager.attributes.add('roundTime', {
    type: 'number',
    default: 300,
    title: 'Round Time (seconds)'
});

GameManager.attributes.add('scoreLimit', {
    type: 'number',
    default: 50,
    title: 'Score Limit'
});

GameManager.attributes.add('respawnTime', {
    type: 'number',
    default: 5,
    title: 'Respawn Time (seconds)'
});

// Initialize the game manager
GameManager.prototype.initialize = function() {
    // Initialize game state
    this.currentRound = 1;
    this.roundTimeLeft = this.roundTime;
    this.isRoundActive = false;
    this.scores = {
        team1: 0,
        team2: 0
    };
    
    // Initialize players
    this.players = [];
    this.team1Spawns = [];
    this.team2Spawns = [];
    
    // Find spawn points
    this.findSpawnPoints();
    
    // Start first round
    this.startRound();
};

// Find spawn points
GameManager.prototype.findSpawnPoints = function() {
    var spawns = this.app.root.findByTag('spawn');
    for (var i = 0; i < spawns.length; i++) {
        var spawn = spawns[i];
        if (spawn.team === 1) {
            this.team1Spawns.push(spawn);
        } else if (spawn.team === 2) {
            this.team2Spawns.push(spawn);
        }
    }
};

// Start round
GameManager.prototype.startRound = function() {
    this.isRoundActive = true;
    this.roundTimeLeft = this.roundTime;
    
    // Reset players
    this.resetPlayers();
    
    // Start round timer
    this.startRoundTimer();
    
    // Trigger round start event
    this.app.fire('game:roundStart', this.currentRound);
};

// End round
GameManager.prototype.endRound = function(winningTeam) {
    this.isRoundActive = false;
    
    // Update scores
    if (winningTeam === 1) {
        this.scores.team1++;
    } else if (winningTeam === 2) {
        this.scores.team2++;
    }
    
    // Check for game end
    if (this.scores.team1 >= this.scoreLimit || this.scores.team2 >= this.scoreLimit) {
        this.endGame(winningTeam);
    } else {
        // Start next round after delay
        setTimeout(function() {
            this.currentRound++;
            this.startRound();
        }.bind(this), 5000);
    }
    
    // Trigger round end event
    this.app.fire('game:roundEnd', winningTeam);
};

// End game
GameManager.prototype.endGame = function(winningTeam) {
    // Trigger game end event
    this.app.fire('game:end', winningTeam);
    
    // Show game over screen
    this.showGameOverScreen(winningTeam);
};

// Start round timer
GameManager.prototype.startRoundTimer = function() {
    this.roundTimer = setInterval(function() {
        this.roundTimeLeft--;
        
        // Update UI
        this.updateRoundTimer();
        
        // Check for round end
        if (this.roundTimeLeft <= 0) {
            this.endRound(0); // 0 = draw
        }
    }.bind(this), 1000);
};

// Reset players
GameManager.prototype.resetPlayers = function() {
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        
        // Reset health
        var health = player.script.health;
        if (health) {
            health.reset();
        }
        
        // Reset position
        this.respawnPlayer(player);
    }
};

// Respawn player
GameManager.prototype.respawnPlayer = function(player) {
    var spawns = player.team === 1 ? this.team1Spawns : this.team2Spawns;
    if (spawns.length > 0) {
        var spawn = spawns[Math.floor(Math.random() * spawns.length)];
        player.setPosition(spawn.getPosition());
        player.setRotation(spawn.getRotation());
    }
};

// Update round timer
GameManager.prototype.updateRoundTimer = function() {
    var minutes = Math.floor(this.roundTimeLeft / 60);
    var seconds = this.roundTimeLeft % 60;
    var timeString = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    
    // Update UI
    this.app.fire('ui:updateTimer', timeString);
};

// Show game over screen
GameManager.prototype.showGameOverScreen = function(winningTeam) {
    var message = winningTeam === 1 ? 'Team 1 Wins!' : 'Team 2 Wins!';
    
    // Create game over screen
    var screen = document.createElement('div');
    screen.style.position = 'absolute';
    screen.style.top = '50%';
    screen.style.left = '50%';
    screen.style.transform = 'translate(-50%, -50%)';
    screen.style.color = 'white';
    screen.style.fontFamily = 'Arial, sans-serif';
    screen.style.fontSize = '48px';
    screen.style.textAlign = 'center';
    screen.innerHTML = message + '<br><br>Press R to restart';
    document.body.appendChild(screen);
    
    // Listen for restart
    this.app.keyboard.on('keydown', function(event) {
        if (event.key === pc.KEY_R) {
            this.restartGame();
            document.body.removeChild(screen);
        }
    }, this);
};

// Restart game
GameManager.prototype.restartGame = function() {
    // Reset scores
    this.scores.team1 = 0;
    this.scores.team2 = 0;
    
    // Reset round
    this.currentRound = 1;
    
    // Start new game
    this.startRound();
}; 