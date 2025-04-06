var PlayerController = pc.createScript('playerController');

// Player movement attributes
PlayerController.attributes.add('moveSpeed', {
    type: 'number',
    default: 5,
    title: 'Movement Speed'
});

PlayerController.attributes.add('jumpForce', {
    type: 'number',
    default: 5,
    title: 'Jump Force'
});

PlayerController.attributes.add('mouseSensitivity', {
    type: 'number',
    default: 0.1,
    title: 'Mouse Sensitivity'
});

PlayerController.attributes.add('cameraEntity', {
    type: 'entity',
    title: 'Camera Entity'
});

// Initialize the player controller
PlayerController.prototype.initialize = function() {
    // Get the camera entity
    this.camera = this.cameraEntity;
    
    // Initialize movement vectors
    this.moveForward = new pc.Vec3();
    this.moveRight = new pc.Vec3();
    this.moveUp = new pc.Vec3();
    
    // Initialize rotation vectors
    this.eulers = new pc.Vec3();
    
    // Get the rigidbody component
    this.rigidbody = this.entity.rigidbody;
    
    // Initialize input state
    this.keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false
    };
    
    // Add input handlers
    this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
    
    // Add keyboard handlers
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.keyboard.on(pc.EVENT_KEYUP, this.onKeyUp, this);
    
    // Request pointer lock
    this.app.mouse.enablePointerLock();
};

// Handle mouse movement for camera rotation
PlayerController.prototype.onMouseMove = function(event) {
    if (this.app.mouse.isPointerLocked()) {
        this.eulers.x -= event.dy * this.mouseSensitivity;
        this.eulers.y -= event.dx * this.mouseSensitivity;
        
        // Clamp vertical rotation
        this.eulers.x = pc.math.clamp(this.eulers.x, -90, 90);
    }
};

// Handle mouse click for shooting
PlayerController.prototype.onMouseDown = function(event) {
    if (event.button === pc.MOUSEBUTTON_LEFT) {
        // TODO: Implement shooting
    }
};

// Handle keyboard input
PlayerController.prototype.onKeyDown = function(event) {
    switch(event.key) {
        case pc.KEY_W:
            this.keys.forward = true;
            break;
        case pc.KEY_S:
            this.keys.backward = true;
            break;
        case pc.KEY_A:
            this.keys.left = true;
            break;
        case pc.KEY_D:
            this.keys.right = true;
            break;
        case pc.KEY_SPACE:
            this.keys.jump = true;
            break;
    }
};

PlayerController.prototype.onKeyUp = function(event) {
    switch(event.key) {
        case pc.KEY_W:
            this.keys.forward = false;
            break;
        case pc.KEY_S:
            this.keys.backward = false;
            break;
        case pc.KEY_A:
            this.keys.left = false;
            break;
        case pc.KEY_D:
            this.keys.right = false;
            break;
        case pc.KEY_SPACE:
            this.keys.jump = false;
            break;
    }
};

// Update player movement and camera rotation
PlayerController.prototype.update = function(dt) {
    // Update camera rotation
    this.camera.setLocalEulerAngles(this.eulers.x, this.eulers.y, 0);
    
    // Calculate movement vectors
    var forward = this.camera.forward;
    var right = this.camera.right;
    
    // Reset movement vector
    var move = new pc.Vec3();
    
    // Calculate movement based on input
    if (this.keys.forward) {
        move.add(forward);
    }
    if (this.keys.backward) {
        move.sub(forward);
    }
    if (this.keys.left) {
        move.sub(right);
    }
    if (this.keys.right) {
        move.add(right);
    }
    
    // Normalize and scale movement
    if (move.length() > 0) {
        move.normalize().scale(this.moveSpeed);
    }
    
    // Apply movement to rigidbody
    if (this.rigidbody) {
        this.rigidbody.linearVelocity = move;
        
        // Handle jumping
        if (this.keys.jump && this.isGrounded()) {
            this.rigidbody.linearVelocity.y = this.jumpForce;
        }
    }
};

// Check if player is grounded
PlayerController.prototype.isGrounded = function() {
    // TODO: Implement proper ground check using raycast
    return true;
}; 