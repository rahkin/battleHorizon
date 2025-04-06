var Weapon = pc.createScript('weapon');

// Weapon attributes
Weapon.attributes.add('fireRate', {
    type: 'number',
    default: 0.1,
    title: 'Fire Rate (seconds)'
});

Weapon.attributes.add('damage', {
    type: 'number',
    default: 10,
    title: 'Damage per shot'
});

Weapon.attributes.add('maxAmmo', {
    type: 'number',
    default: 30,
    title: 'Maximum Ammo'
});

Weapon.attributes.add('reloadTime', {
    type: 'number',
    default: 2,
    title: 'Reload Time (seconds)'
});

Weapon.attributes.add('spread', {
    type: 'number',
    default: 0.1,
    title: 'Bullet Spread'
});

Weapon.attributes.add('muzzleFlashEntity', {
    type: 'entity',
    title: 'Muzzle Flash Entity'
});

Weapon.attributes.add('bulletTrailEntity', {
    type: 'entity',
    title: 'Bullet Trail Entity'
});

Weapon.attributes.add('shootSound', {
    type: 'asset',
    assetType: 'audio',
    title: 'Shoot Sound'
});

Weapon.attributes.add('reloadSound', {
    type: 'asset',
    assetType: 'audio',
    title: 'Reload Sound'
});

// Initialize the weapon
Weapon.prototype.initialize = function() {
    // Initialize weapon state
    this.currentAmmo = this.maxAmmo;
    this.isReloading = false;
    this.canShoot = true;
    this.lastShotTime = 0;
    
    // Get audio component
    this.audio = this.entity.sound;
    
    // Initialize bullet pool
    this.bulletPool = [];
    this.maxBullets = 20;
    this.initializeBulletPool();
};

// Initialize bullet pool
Weapon.prototype.initializeBulletPool = function() {
    for (var i = 0; i < this.maxBullets; i++) {
        var bullet = this.bulletTrailEntity.clone();
        bullet.enabled = false;
        this.entity.addChild(bullet);
        this.bulletPool.push(bullet);
    }
};

// Get a bullet from the pool
Weapon.prototype.getBulletFromPool = function() {
    for (var i = 0; i < this.bulletPool.length; i++) {
        if (!this.bulletPool[i].enabled) {
            return this.bulletPool[i];
        }
    }
    return null;
};

// Fire the weapon
Weapon.prototype.fire = function() {
    if (!this.canShoot || this.isReloading || this.currentAmmo <= 0) {
        return;
    }
    
    var currentTime = Date.now();
    if (currentTime - this.lastShotTime < this.fireRate * 1000) {
        return;
    }
    
    // Update ammo and timing
    this.currentAmmo--;
    this.lastShotTime = currentTime;
    
    // Play shoot sound
    if (this.shootSound && this.audio) {
        this.audio.play(this.shootSound);
    }
    
    // Show muzzle flash
    if (this.muzzleFlashEntity) {
        this.muzzleFlashEntity.enabled = true;
        this.muzzleFlashEntity.setLocalScale(1, 1, 1);
        this.muzzleFlashEntity.setLocalPosition(0, 0, 0);
    }
    
    // Create bullet trail
    var bullet = this.getBulletFromPool();
    if (bullet) {
        bullet.enabled = true;
        bullet.setLocalPosition(0, 0, 0);
        
        // Calculate spread
        var spread = new pc.Vec3(
            (Math.random() - 0.5) * this.spread,
            (Math.random() - 0.5) * this.spread,
            0
        );
        
        // Raycast for hit detection
        var start = this.entity.getPosition();
        var forward = this.entity.forward;
        var end = new pc.Vec3();
        end.add2(start, forward.scale(100));
        end.add(spread);
        
        var hit = this.app.systems.rigidbody.raycastFirst(start, end);
        if (hit) {
            // Apply damage to hit entity
            var health = hit.entity.script.health;
            if (health) {
                health.takeDamage(this.damage);
            }
            
            // Update bullet trail end position
            bullet.setLocalPosition(hit.point);
        } else {
            // Update bullet trail end position
            bullet.setLocalPosition(end);
        }
    }
    
    // Disable muzzle flash after delay
    if (this.muzzleFlashEntity) {
        setTimeout(function() {
            this.muzzleFlashEntity.enabled = false;
        }.bind(this), 50);
    }
};

// Reload the weapon
Weapon.prototype.reload = function() {
    if (this.isReloading || this.currentAmmo === this.maxAmmo) {
        return;
    }
    
    this.isReloading = true;
    
    // Play reload sound
    if (this.reloadSound && this.audio) {
        this.audio.play(this.reloadSound);
    }
    
    // Reload after delay
    setTimeout(function() {
        this.currentAmmo = this.maxAmmo;
        this.isReloading = false;
    }.bind(this), this.reloadTime * 1000);
};

// Update weapon state
Weapon.prototype.update = function(dt) {
    // Update canShoot based on fire rate
    var currentTime = Date.now();
    this.canShoot = currentTime - this.lastShotTime >= this.fireRate * 1000;
}; 