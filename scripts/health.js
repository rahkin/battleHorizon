var Health = pc.createScript('health');

// Health attributes
Health.attributes.add('maxHealth', {
    type: 'number',
    default: 100,
    title: 'Maximum Health'
});

Health.attributes.add('invulnerable', {
    type: 'boolean',
    default: false,
    title: 'Invulnerable'
});

Health.attributes.add('deathEffect', {
    type: 'entity',
    title: 'Death Effect Entity'
});

Health.attributes.add('hurtSound', {
    type: 'asset',
    assetType: 'audio',
    title: 'Hurt Sound'
});

Health.attributes.add('deathSound', {
    type: 'asset',
    assetType: 'audio',
    title: 'Death Sound'
});

// Initialize the health system
Health.prototype.initialize = function() {
    // Set initial health
    this.currentHealth = this.maxHealth;
    this.isDead = false;
    
    // Get audio component
    this.audio = this.entity.sound;
    
    // Initialize damage indicators
    this.damageIndicators = [];
    this.maxDamageIndicators = 5;
};

// Take damage
Health.prototype.takeDamage = function(amount, source) {
    if (this.isDead || this.invulnerable) {
        return;
    }
    
    // Apply damage
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    
    // Show damage indicator
    this.showDamageIndicator(amount, source);
    
    // Play hurt sound
    if (this.hurtSound && this.audio) {
        this.audio.play(this.hurtSound);
    }
    
    // Check for death
    if (this.currentHealth <= 0) {
        this.die();
    }
};

// Heal
Health.prototype.heal = function(amount) {
    if (this.isDead) {
        return;
    }
    
    // Apply healing
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
};

// Die
Health.prototype.die = function() {
    if (this.isDead) {
        return;
    }
    
    this.isDead = true;
    
    // Play death sound
    if (this.deathSound && this.audio) {
        this.audio.play(this.deathSound);
    }
    
    // Show death effect
    if (this.deathEffect) {
        var effect = this.deathEffect.clone();
        effect.setPosition(this.entity.getPosition());
        effect.enabled = true;
        this.app.root.addChild(effect);
    }
    
    // Disable entity
    this.entity.enabled = false;
    
    // Trigger death event
    this.app.fire('health:death', this.entity);
};

// Show damage indicator
Health.prototype.showDamageIndicator = function(amount, source) {
    // Create damage indicator
    var indicator = {
        amount: amount,
        position: this.entity.getPosition(),
        source: source,
        time: Date.now()
    };
    
    // Add to indicators array
    this.damageIndicators.push(indicator);
    
    // Remove old indicators
    if (this.damageIndicators.length > this.maxDamageIndicators) {
        this.damageIndicators.shift();
    }
    
    // Trigger damage event
    this.app.fire('health:damage', this.entity, amount, source);
};

// Get health percentage
Health.prototype.getHealthPercentage = function() {
    return (this.currentHealth / this.maxHealth) * 100;
};

// Is alive
Health.prototype.isAlive = function() {
    return !this.isDead;
};

// Reset health
Health.prototype.reset = function() {
    this.currentHealth = this.maxHealth;
    this.isDead = false;
    this.entity.enabled = true;
}; 