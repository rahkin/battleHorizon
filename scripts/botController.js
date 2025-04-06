var BotController = pc.createScript('botController');

// Bot attributes
BotController.attributes.add('moveSpeed', {
    type: 'number',
    default: 3,
    title: 'Movement Speed'
});

BotController.attributes.add('detectionRange', {
    type: 'number',
    default: 20,
    title: 'Detection Range'
});

BotController.attributes.add('attackRange', {
    type: 'number',
    default: 15,
    title: 'Attack Range'
});

BotController.attributes.add('accuracy', {
    type: 'number',
    default: 0.7,
    title: 'Accuracy (0-1)'
});

// Initialize the bot controller
BotController.prototype.initialize = function() {
    // Initialize bot state
    this.state = 'patrol';
    this.target = null;
    this.waypoints = [];
    this.currentWaypoint = 0;
    this.lastShotTime = 0;
    
    // Get components
    this.rigidbody = this.entity.rigidbody;
    this.weapon = this.entity.script.weapon;
    
    // Find waypoints
    this.findWaypoints();
    
    // Start patrolling
    this.startPatrol();
};

// Find waypoints
BotController.prototype.findWaypoints = function() {
    var waypoints = this.app.root.findByTag('waypoint');
    for (var i = 0; i < waypoints.length; i++) {
        this.waypoints.push(waypoints[i].getPosition());
    }
};

// Start patrolling
BotController.prototype.startPatrol = function() {
    this.state = 'patrol';
    this.target = null;
    
    if (this.waypoints.length > 0) {
        this.moveToWaypoint();
    }
};

// Move to waypoint
BotController.prototype.moveToWaypoint = function() {
    if (this.waypoints.length === 0) {
        return;
    }
    
    var waypoint = this.waypoints[this.currentWaypoint];
    var direction = waypoint.clone().sub(this.entity.getPosition());
    direction.y = 0;
    
    if (direction.length() < 1) {
        this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
        waypoint = this.waypoints[this.currentWaypoint];
        direction = waypoint.clone().sub(this.entity.getPosition());
        direction.y = 0;
    }
    
    direction.normalize().scale(this.moveSpeed);
    this.rigidbody.linearVelocity = direction;
    
    // Rotate towards waypoint
    var targetRotation = Math.atan2(direction.x, direction.z) * (180 / Math.PI);
    this.entity.setEulerAngles(0, targetRotation, 0);
};

// Update bot behavior
BotController.prototype.update = function(dt) {
    // Find player
    var player = this.app.root.findByName('player');
    if (!player) {
        return;
    }
    
    // Calculate distance to player
    var distance = this.entity.getPosition().distance(player.getPosition());
    
    // Update state based on distance
    if (distance <= this.attackRange) {
        this.state = 'attack';
        this.target = player;
    } else if (distance <= this.detectionRange) {
        this.state = 'chase';
        this.target = player;
    } else if (this.state !== 'patrol') {
        this.startPatrol();
    }
    
    // Handle current state
    switch (this.state) {
        case 'patrol':
            this.moveToWaypoint();
            break;
            
        case 'chase':
            this.chasePlayer();
            break;
            
        case 'attack':
            this.attackPlayer();
            break;
    }
};

// Chase player
BotController.prototype.chasePlayer = function() {
    if (!this.target) {
        return;
    }
    
    var direction = this.target.getPosition().clone().sub(this.entity.getPosition());
    direction.y = 0;
    
    if (direction.length() > 0) {
        direction.normalize().scale(this.moveSpeed);
        this.rigidbody.linearVelocity = direction;
        
        // Rotate towards player
        var targetRotation = Math.atan2(direction.x, direction.z) * (180 / Math.PI);
        this.entity.setEulerAngles(0, targetRotation, 0);
    }
};

// Attack player
BotController.prototype.attackPlayer = function() {
    if (!this.target || !this.weapon) {
        return;
    }
    
    // Stop moving
    this.rigidbody.linearVelocity = pc.Vec3.ZERO;
    
    // Look at player
    var direction = this.target.getPosition().clone().sub(this.entity.getPosition());
    var targetRotation = Math.atan2(direction.x, direction.z) * (180 / Math.PI);
    this.entity.setEulerAngles(0, targetRotation, 0);
    
    // Shoot at player
    var currentTime = Date.now();
    if (currentTime - this.lastShotTime > 1000) {
        // Add some randomness to aim
        var spread = (1 - this.accuracy) * 10;
        var randomAngle = (Math.random() - 0.5) * spread;
        this.entity.rotate(0, randomAngle, 0);
        
        this.weapon.fire();
        this.lastShotTime = currentTime;
    }
}; 