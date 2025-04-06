var InputManager = pc.createScript('inputManager');

// Input attributes
InputManager.attributes.add('mouseSensitivity', {
    type: 'number',
    default: 0.1,
    title: 'Mouse Sensitivity'
});

InputManager.attributes.add('invertY', {
    type: 'boolean',
    default: false,
    title: 'Invert Y Axis'
});

// Initialize the input manager
InputManager.prototype.initialize = function() {
    // Initialize input state
    this.keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        crouch: false,
        sprint: false,
        reload: false,
        drop: false,
        weapon1: false,
        weapon2: false,
        weapon3: false
    };
    
    this.mouse = {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        left: false,
        right: false
    };
    
    // Add input handlers
    this.addKeyboardHandlers();
    this.addMouseHandlers();
    
    // Request pointer lock
    this.app.mouse.enablePointerLock();
};

// Add keyboard handlers
InputManager.prototype.addKeyboardHandlers = function() {
    // Key down
    this.app.keyboard.on('keydown', function(event) {
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
            case pc.KEY_CTRL:
                this.keys.crouch = true;
                break;
            case pc.KEY_SHIFT:
                this.keys.sprint = true;
                break;
            case pc.KEY_R:
                this.keys.reload = true;
                break;
            case pc.KEY_G:
                this.keys.drop = true;
                break;
            case pc.KEY_1:
                this.keys.weapon1 = true;
                break;
            case pc.KEY_2:
                this.keys.weapon2 = true;
                break;
            case pc.KEY_3:
                this.keys.weapon3 = true;
                break;
            case pc.KEY_ESCAPE:
                this.app.mouse.disablePointerLock();
                break;
        }
    }, this);
    
    // Key up
    this.app.keyboard.on('keyup', function(event) {
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
            case pc.KEY_CTRL:
                this.keys.crouch = false;
                break;
            case pc.KEY_SHIFT:
                this.keys.sprint = false;
                break;
            case pc.KEY_R:
                this.keys.reload = false;
                break;
            case pc.KEY_G:
                this.keys.drop = false;
                break;
            case pc.KEY_1:
                this.keys.weapon1 = false;
                break;
            case pc.KEY_2:
                this.keys.weapon2 = false;
                break;
            case pc.KEY_3:
                this.keys.weapon3 = false;
                break;
        }
    }, this);
};

// Add mouse handlers
InputManager.prototype.addMouseHandlers = function() {
    // Mouse move
    this.app.mouse.on('mousemove', function(event) {
        if (this.app.mouse.isPointerLocked()) {
            this.mouse.dx = event.dx;
            this.mouse.dy = event.dy;
            
            // Apply sensitivity and invert if needed
            this.mouse.dx *= this.mouseSensitivity;
            this.mouse.dy *= this.mouseSensitivity;
            if (this.invertY) {
                this.mouse.dy *= -1;
            }
        }
    }, this);
    
    // Mouse down
    this.app.mouse.on('mousedown', function(event) {
        if (this.app.mouse.isPointerLocked()) {
            switch(event.button) {
                case pc.MOUSEBUTTON_LEFT:
                    this.mouse.left = true;
                    break;
                case pc.MOUSEBUTTON_RIGHT:
                    this.mouse.right = true;
                    break;
            }
        }
    }, this);
    
    // Mouse up
    this.app.mouse.on('mouseup', function(event) {
        if (this.app.mouse.isPointerLocked()) {
            switch(event.button) {
                case pc.MOUSEBUTTON_LEFT:
                    this.mouse.left = false;
                    break;
                case pc.MOUSEBUTTON_RIGHT:
                    this.mouse.right = false;
                    break;
            }
        }
    }, this);
};

// Get movement vector
InputManager.prototype.getMovementVector = function() {
    var move = new pc.Vec3();
    
    if (this.keys.forward) {
        move.z -= 1;
    }
    if (this.keys.backward) {
        move.z += 1;
    }
    if (this.keys.left) {
        move.x -= 1;
    }
    if (this.keys.right) {
        move.x += 1;
    }
    
    if (move.length() > 0) {
        move.normalize();
    }
    
    return move;
};

// Get look rotation
InputManager.prototype.getLookRotation = function() {
    return {
        x: this.mouse.dx,
        y: this.mouse.dy
    };
};

// Reset mouse delta
InputManager.prototype.resetMouseDelta = function() {
    this.mouse.dx = 0;
    this.mouse.dy = 0;
};

// Is jumping
InputManager.prototype.isJumping = function() {
    return this.keys.jump;
};

// Is crouching
InputManager.prototype.isCrouching = function() {
    return this.keys.crouch;
};

// Is sprinting
InputManager.prototype.isSprinting = function() {
    return this.keys.sprint;
};

// Is reloading
InputManager.prototype.isReloading = function() {
    return this.keys.reload;
};

// Is dropping weapon
InputManager.prototype.isDroppingWeapon = function() {
    return this.keys.drop;
};

// Is firing
InputManager.prototype.isFiring = function() {
    return this.mouse.left;
};

// Is aiming
InputManager.prototype.isAiming = function() {
    return this.mouse.right;
};

// Get weapon switch
InputManager.prototype.getWeaponSwitch = function() {
    if (this.keys.weapon1) {
        return 1;
    }
    if (this.keys.weapon2) {
        return 2;
    }
    if (this.keys.weapon3) {
        return 3;
    }
    return 0;
}; 