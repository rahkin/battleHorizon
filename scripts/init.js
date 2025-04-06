// Initialize PlayCanvas scripts
function initScripts() {
    // Register player controller
    var PlayerController = pc.createScript('playerController');
    PlayerController.attributes.add('cameraEntity', { type: 'entity' });
    PlayerController.attributes.add('moveSpeed', { type: 'number', default: 5 });
    PlayerController.attributes.add('jumpForce', { type: 'number', default: 5 });
    PlayerController.attributes.add('mouseSensitivity', { type: 'number', default: 0.1 });

    // Register weapon
    var Weapon = pc.createScript('weapon');
    Weapon.attributes.add('damage', { type: 'number', default: 10 });
    Weapon.attributes.add('fireRate', { type: 'number', default: 0.1 });
    Weapon.attributes.add('ammo', { type: 'number', default: 30 });
    Weapon.attributes.add('maxAmmo', { type: 'number', default: 90 });

    // Register health
    var Health = pc.createScript('health');
    Health.attributes.add('maxHealth', { type: 'number', default: 100 });
    Health.attributes.add('isPlayer', { type: 'boolean', default: false });

    // Register game manager
    var GameManager = pc.createScript('gameManager');
    GameManager.attributes.add('gameMode', { type: 'string', default: 'deathmatch' });
    GameManager.attributes.add('roundTime', { type: 'number', default: 300 });
    GameManager.attributes.add('scoreLimit', { type: 'number', default: 50 });

    // Register bot controller
    var BotController = pc.createScript('botController');
    BotController.attributes.add('moveSpeed', { type: 'number', default: 3 });
    BotController.attributes.add('detectionRange', { type: 'number', default: 20 });
    BotController.attributes.add('attackRange', { type: 'number', default: 15 });
    BotController.attributes.add('patrolPoints', { type: 'entity', array: true });

    return true;
} 