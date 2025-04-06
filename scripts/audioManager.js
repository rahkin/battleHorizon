var AudioManager = pc.createScript('audioManager');

// Audio attributes
AudioManager.attributes.add('musicVolume', {
    type: 'number',
    default: 0.5,
    title: 'Music Volume',
    min: 0,
    max: 1
});

AudioManager.attributes.add('sfxVolume', {
    type: 'number',
    default: 0.7,
    title: 'SFX Volume',
    min: 0,
    max: 1
});

AudioManager.attributes.add('ambientVolume', {
    type: 'number',
    default: 0.3,
    title: 'Ambient Volume',
    min: 0,
    max: 1
});

AudioManager.attributes.add('musicAssets', {
    type: 'asset',
    assetType: 'audio',
    array: true,
    title: 'Music Assets'
});

AudioManager.attributes.add('ambientAssets', {
    type: 'asset',
    assetType: 'audio',
    array: true,
    title: 'Ambient Assets'
});

// Initialize the audio manager
AudioManager.prototype.initialize = function() {
    // Initialize audio state
    this.currentMusic = null;
    this.currentAmbient = null;
    this.soundInstances = {};
    
    // Create audio entities
    this.createAudioEntities();
    
    // Start ambient sounds
    this.startAmbientSounds();
    
    // Listen for events
    this.app.on('audio:playSound', this.playSound, this);
    this.app.on('audio:stopSound', this.stopSound, this);
    this.app.on('audio:playMusic', this.playMusic, this);
    this.app.on('audio:stopMusic', this.stopMusic, this);
};

// Create audio entities
AudioManager.prototype.createAudioEntities = function() {
    // Create music entity
    this.musicEntity = new pc.Entity('music');
    this.musicEntity.addComponent('sound');
    this.app.root.addChild(this.musicEntity);
    
    // Create ambient entity
    this.ambientEntity = new pc.Entity('ambient');
    this.ambientEntity.addComponent('sound');
    this.app.root.addChild(this.ambientEntity);
    
    // Create SFX entity
    this.sfxEntity = new pc.Entity('sfx');
    this.sfxEntity.addComponent('sound');
    this.app.root.addChild(this.sfxEntity);
};

// Start ambient sounds
AudioManager.prototype.startAmbientSounds = function() {
    if (this.ambientAssets.length > 0) {
        var randomIndex = Math.floor(Math.random() * this.ambientAssets.length);
        this.playAmbient(this.ambientAssets[randomIndex]);
    }
};

// Play sound
AudioManager.prototype.playSound = function(asset, options) {
    if (!asset) {
        return;
    }
    
    options = options || {};
    
    // Create sound instance
    var instance = this.sfxEntity.sound.play(asset, {
        volume: this.sfxVolume * (options.volume || 1),
        pitch: options.pitch || 1,
        loop: options.loop || false
    });
    
    // Store instance if needed
    if (options.id) {
        this.soundInstances[options.id] = instance;
    }
    
    return instance;
};

// Stop sound
AudioManager.prototype.stopSound = function(id) {
    if (this.soundInstances[id]) {
        this.soundInstances[id].stop();
        delete this.soundInstances[id];
    }
};

// Play music
AudioManager.prototype.playMusic = function(asset) {
    if (!asset) {
        return;
    }
    
    // Stop current music
    this.stopMusic();
    
    // Play new music
    this.currentMusic = this.musicEntity.sound.play(asset, {
        volume: this.musicVolume,
        loop: true
    });
};

// Stop music
AudioManager.prototype.stopMusic = function() {
    if (this.currentMusic) {
        this.currentMusic.stop();
        this.currentMusic = null;
    }
};

// Play ambient
AudioManager.prototype.playAmbient = function(asset) {
    if (!asset) {
        return;
    }
    
    // Stop current ambient
    this.stopAmbient();
    
    // Play new ambient
    this.currentAmbient = this.ambientEntity.sound.play(asset, {
        volume: this.ambientVolume,
        loop: true
    });
};

// Stop ambient
AudioManager.prototype.stopAmbient = function() {
    if (this.currentAmbient) {
        this.currentAmbient.stop();
        this.currentAmbient = null;
    }
};

// Set music volume
AudioManager.prototype.setMusicVolume = function(volume) {
    this.musicVolume = volume;
    if (this.currentMusic) {
        this.currentMusic.volume = volume;
    }
};

// Set SFX volume
AudioManager.prototype.setSfxVolume = function(volume) {
    this.sfxVolume = volume;
};

// Set ambient volume
AudioManager.prototype.setAmbientVolume = function(volume) {
    this.ambientVolume = volume;
    if (this.currentAmbient) {
        this.currentAmbient.volume = volume;
    }
};

// Play random music
AudioManager.prototype.playRandomMusic = function() {
    if (this.musicAssets.length > 0) {
        var randomIndex = Math.floor(Math.random() * this.musicAssets.length);
        this.playMusic(this.musicAssets[randomIndex]);
    }
};

// Play footstep sound
AudioManager.prototype.playFootstep = function(surface) {
    var asset = this.app.assets.find('footstep_' + surface);
    if (asset) {
        this.playSound(asset, {
            volume: 0.3,
            pitch: 0.8 + Math.random() * 0.4
        });
    }
};

// Play weapon sound
AudioManager.prototype.playWeaponSound = function(weapon, type) {
    var asset = this.app.assets.find(weapon + '_' + type);
    if (asset) {
        this.playSound(asset, {
            volume: 0.5,
            pitch: 1
        });
    }
}; 