var UIManager = pc.createScript('uiManager');

// UI attributes
UIManager.attributes.add('crosshairEntity', {
    type: 'entity',
    title: 'Crosshair Entity'
});

UIManager.attributes.add('healthBarEntity', {
    type: 'entity',
    title: 'Health Bar Entity'
});

UIManager.attributes.add('ammoTextEntity', {
    type: 'entity',
    title: 'Ammo Text Entity'
});

UIManager.attributes.add('weaponIconEntity', {
    type: 'entity',
    title: 'Weapon Icon Entity'
});

UIManager.attributes.add('timerTextEntity', {
    type: 'entity',
    title: 'Timer Text Entity'
});

UIManager.attributes.add('scoreTextEntity', {
    type: 'entity',
    title: 'Score Text Entity'
});

UIManager.attributes.add('killfeedEntity', {
    type: 'entity',
    title: 'Killfeed Entity'
});

// Initialize the UI manager
UIManager.prototype.initialize = function() {
    // Initialize UI state
    this.isMenuOpen = false;
    this.currentMenu = null;
    
    // Initialize killfeed
    this.killfeedMessages = [];
    this.maxKillfeedMessages = 5;
    
    // Listen for events
    this.app.on('health:damage', this.onHealthDamage, this);
    this.app.on('health:death', this.onHealthDeath, this);
    this.app.on('weapon:fire', this.onWeaponFire, this);
    this.app.on('weapon:reload', this.onWeaponReload, this);
    this.app.on('game:roundStart', this.onRoundStart, this);
    this.app.on('game:roundEnd', this.onRoundEnd, this);
    this.app.on('game:end', this.onGameEnd, this);
    this.app.on('ui:updateTimer', this.onUpdateTimer, this);
};

// Show main menu
UIManager.prototype.showMainMenu = function() {
    this.isMenuOpen = true;
    this.currentMenu = 'main';
    
    // Create menu elements
    var menu = document.createElement('div');
    menu.id = 'main-menu';
    menu.style.position = 'absolute';
    menu.style.top = '50%';
    menu.style.left = '50%';
    menu.style.transform = 'translate(-50%, -50%)';
    menu.style.color = 'white';
    menu.style.fontFamily = 'Arial, sans-serif';
    menu.style.textAlign = 'center';
    
    // Add menu items
    menu.innerHTML = `
        <h1 style="font-size: 48px; margin-bottom: 40px;">FPS Game</h1>
        <button style="font-size: 24px; padding: 10px 20px; margin: 10px; cursor: pointer;">Play</button>
        <button style="font-size: 24px; padding: 10px 20px; margin: 10px; cursor: pointer;">Settings</button>
        <button style="font-size: 24px; padding: 10px 20px; margin: 10px; cursor: pointer;">Quit</button>
    `;
    
    document.body.appendChild(menu);
    
    // Add event listeners
    var buttons = menu.getElementsByTagName('button');
    buttons[0].onclick = this.onPlayClick.bind(this);
    buttons[1].onclick = this.onSettingsClick.bind(this);
    buttons[2].onclick = this.onQuitClick.bind(this);
};

// Hide menu
UIManager.prototype.hideMenu = function() {
    this.isMenuOpen = false;
    this.currentMenu = null;
    
    var menu = document.getElementById('main-menu');
    if (menu) {
        document.body.removeChild(menu);
    }
};

// Update health bar
UIManager.prototype.updateHealthBar = function(healthPercent) {
    if (this.healthBarEntity) {
        this.healthBarEntity.element.width = healthPercent + '%';
    }
};

// Update ammo text
UIManager.prototype.updateAmmoText = function(currentAmmo, maxAmmo) {
    if (this.ammoTextEntity) {
        this.ammoTextEntity.element.text = currentAmmo + '/' + maxAmmo;
    }
};

// Update weapon icon
UIManager.prototype.updateWeaponIcon = function(weaponName) {
    if (this.weaponIconEntity) {
        // TODO: Update weapon icon based on weapon name
    }
};

// Update timer text
UIManager.prototype.updateTimerText = function(timeString) {
    if (this.timerTextEntity) {
        this.timerTextEntity.element.text = timeString;
    }
};

// Update score text
UIManager.prototype.updateScoreText = function(team1Score, team2Score) {
    if (this.scoreTextEntity) {
        this.scoreTextEntity.element.text = team1Score + ' - ' + team2Score;
    }
};

// Add killfeed message
UIManager.prototype.addKillfeedMessage = function(killer, victim, weapon) {
    if (this.killfeedEntity) {
        // Create message
        var message = killer + ' killed ' + victim + ' with ' + weapon;
        
        // Add to killfeed
        this.killfeedMessages.unshift(message);
        if (this.killfeedMessages.length > this.maxKillfeedMessages) {
            this.killfeedMessages.pop();
        }
        
        // Update killfeed UI
        this.updateKillfeed();
    }
};

// Update killfeed
UIManager.prototype.updateKillfeed = function() {
    if (this.killfeedEntity) {
        var messages = this.killfeedMessages.join('<br>');
        this.killfeedEntity.element.text = messages;
    }
};

// Event handlers
UIManager.prototype.onHealthDamage = function(entity, amount, source) {
    if (entity === this.app.root.findByName('player')) {
        this.updateHealthBar(entity.script.health.getHealthPercentage());
    }
};

UIManager.prototype.onHealthDeath = function(entity) {
    if (entity === this.app.root.findByName('player')) {
        this.updateHealthBar(0);
    }
};

UIManager.prototype.onWeaponFire = function(entity, weapon) {
    if (entity === this.app.root.findByName('player')) {
        this.updateAmmoText(weapon.currentAmmo, weapon.maxAmmo);
    }
};

UIManager.prototype.onWeaponReload = function(entity, weapon) {
    if (entity === this.app.root.findByName('player')) {
        this.updateAmmoText(weapon.currentAmmo, weapon.maxAmmo);
    }
};

UIManager.prototype.onRoundStart = function(roundNumber) {
    // Update round number in UI
};

UIManager.prototype.onRoundEnd = function(winningTeam) {
    // Show round end message
};

UIManager.prototype.onGameEnd = function(winningTeam) {
    // Show game end message
};

UIManager.prototype.onUpdateTimer = function(timeString) {
    this.updateTimerText(timeString);
};

// Menu button handlers
UIManager.prototype.onPlayClick = function() {
    this.hideMenu();
    this.app.fire('game:start');
};

UIManager.prototype.onSettingsClick = function() {
    // TODO: Show settings menu
};

UIManager.prototype.onQuitClick = function() {
    // TODO: Handle quit
}; 