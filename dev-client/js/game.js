// Game state
let client = null;
let room = null;
let playerId = null;
let isGameStarted = false;

// Player models for multiplayer
const playerModels = new Map();

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controls
let controls = null;
const moveSpeed = 0.2;
const jumpForce = 0.5;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;
let isCrouching = false;

// Player state
const playerState = {
    health: 100,
    ammo: 30,
    score: 0,
    isDead: false
};

// DOM elements
const menuElement = document.getElementById('menu');
const hudElement = document.getElementById('hud');
const crosshairElement = document.getElementById('crosshair');
const healthElement = document.getElementById('health');
const ammoElement = document.getElementById('ammo');
const scoreElement = document.getElementById('score');
const connectButton = document.getElementById('connect');
const startButton = document.getElementById('start');

// Initialize scene
function initScene() {
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add some obstacles
    const obstacleGeometry = new THREE.BoxGeometry(2, 2, 2);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    
    for (let i = 0; i < 10; i++) {
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        obstacle.position.set(
            Math.random() * 80 - 40,
            1,
            Math.random() * 80 - 40
        );
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        scene.add(obstacle);
    }

    // Set up camera
    camera.position.set(0, 2, 5);
}

// Initialize controls
function initControls() {
    controls = new THREE.PointerLockControls(camera, document.body);
    
    // Mouse movement
    controls.addEventListener('lock', () => {
        menuElement.style.display = 'none';
        hudElement.style.display = 'block';
        crosshairElement.style.display = 'block';
    });

    controls.addEventListener('unlock', () => {
        menuElement.style.display = 'block';
        hudElement.style.display = 'none';
        crosshairElement.style.display = 'none';
    });

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'KeyW':
                moveForward = true;
                break;
            case 'KeyS':
                moveBackward = true;
                break;
            case 'KeyA':
                moveLeft = true;
                break;
            case 'KeyD':
                moveRight = true;
                break;
            case 'Space':
                if (canJump) {
                    velocity.y += jumpForce;
                    canJump = false;
                }
                break;
            case 'ControlLeft':
                isCrouching = true;
                camera.position.y = 1;
                break;
        }
    });

    document.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyW':
                moveForward = false;
                break;
            case 'KeyS':
                moveBackward = false;
                break;
            case 'KeyA':
                moveLeft = false;
                break;
            case 'KeyD':
                moveRight = false;
                break;
            case 'ControlLeft':
                isCrouching = false;
                camera.position.y = 2;
                break;
        }
    });

    // Mouse click for shooting
    document.addEventListener('click', () => {
        if (controls.isLocked && !playerState.isDead) {
            shoot();
        }
    });
}

// Update player movement
function updateMovement() {
    if (controls.isLocked) {
        // Get movement direction
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        // Apply movement speed
        if (moveForward || moveBackward) {
            velocity.z -= direction.z * moveSpeed;
        }
        if (moveLeft || moveRight) {
            velocity.x -= direction.x * moveSpeed;
        }

        // Apply gravity
        velocity.y -= 0.05;

        // Update position
        controls.moveRight(-velocity.x);
        controls.moveForward(-velocity.z);
        camera.position.y += velocity.y;

        // Ground collision
        if (camera.position.y < (isCrouching ? 1 : 2)) {
            velocity.y = 0;
            camera.position.y = isCrouching ? 1 : 2;
            canJump = true;
        }

        // Apply friction
        velocity.x *= 0.9;
        velocity.z *= 0.9;

        // Send position update to server
        if (room) {
            room.send('playerMove', {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z,
                rotationX: camera.rotation.x,
                rotationY: camera.rotation.y,
                rotationZ: camera.rotation.z
            });
        }
    }
}

// Handle shooting
function shoot() {
    if (playerState.ammo > 0 && !playerState.isDead) {
        playerState.ammo--;
        updateHUD();

        if (room) {
            room.send('playerShoot');
        }

        // Create bullet effect
        const geometry = new THREE.SphereGeometry(0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const bullet = new THREE.Mesh(geometry, material);
        
        bullet.position.copy(camera.position);
        scene.add(bullet);

        // Shoot ray for hit detection
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
            const hitPoint = intersects[0].point;
            const hitObject = intersects[0].object;

            // Create hit effect
            const hitGeometry = new THREE.SphereGeometry(0.2);
            const hitMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const hitEffect = new THREE.Mesh(hitGeometry, hitMaterial);
            hitEffect.position.copy(hitPoint);
            scene.add(hitEffect);

            // Remove hit effect after delay
            setTimeout(() => {
                scene.remove(hitEffect);
            }, 200);
        }

        // Animate bullet
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const speed = 0.5;
        
        const animate = () => {
            bullet.position.add(direction.clone().multiplyScalar(speed));
            
            if (bullet.position.distanceTo(camera.position) > 50) {
                scene.remove(bullet);
                return;
            }
            
            requestAnimationFrame(animate);
        };
        animate();
    }
}

// Update HUD
function updateHUD() {
    healthElement.textContent = `Health: ${playerState.health}`;
    ammoElement.textContent = `Ammo: ${playerState.ammo}`;
    scoreElement.textContent = `Score: ${playerState.score}`;
}

// Connect to server
connectButton.addEventListener('click', async () => {
    try {
        client = new Colyseus.Client('ws://localhost:2567');
        room = await client.joinOrCreate('game_room');
        
        playerId = room.sessionId;
        connectButton.textContent = 'Connected';
        connectButton.disabled = true;
        
        // Set up room state change handler
        room.state.players.onAdd = (player, key) => {
            console.log("Player added:", key);
            if (key !== playerId) {
                // Create player model for other players
                const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
                const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                const playerModel = new THREE.Mesh(geometry, material);
                playerModel.position.set(player.x, player.y, player.z);
                scene.add(playerModel);
                
                // Store player model reference
                playerModels.set(key, playerModel);
            }
        };

        room.state.players.onRemove = (player, key) => {
            console.log("Player removed:", key);
            const playerModel = playerModels.get(key);
            if (playerModel) {
                scene.remove(playerModel);
                playerModels.delete(key);
            }
        };

        // Listen for state changes
        room.state.players.onChange = (player, key) => {
            if (key !== playerId) {
                const playerModel = playerModels.get(key);
                if (playerModel) {
                    playerModel.position.set(player.x, player.y, player.z);
                    playerModel.rotation.set(player.rotationX, player.rotationY, player.rotationZ);
                }
            }
        };
        
        // Listen for messages
        room.onMessage("playerShoot", (message) => {
            if (message.playerId !== playerId) {
                // Create bullet effect for other players
                const geometry = new THREE.SphereGeometry(0.1);
                const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                const bullet = new THREE.Mesh(geometry, material);
                
                bullet.position.set(
                    message.position.x,
                    message.position.y,
                    message.position.z
                );
                scene.add(bullet);

                // Animate bullet
                const direction = new THREE.Vector3(
                    Math.sin(message.rotation.y),
                    0,
                    -Math.cos(message.rotation.y)
                );
                const speed = 0.5;
                
                const animate = () => {
                    bullet.position.add(direction.multiplyScalar(speed));
                    
                    if (bullet.position.distanceTo(new THREE.Vector3(message.position.x, message.position.y, message.position.z)) > 50) {
                        scene.remove(bullet);
                        return;
                    }
                    
                    requestAnimationFrame(animate);
                };
                animate();
            }
        });

        room.onMessage("playerHit", (message) => {
            if (message.playerId === playerId) {
                playerState.health -= message.damage;
                if (playerState.health <= 0) {
                    playerState.isDead = true;
                    playerState.health = 0;
                }
                updateHUD();
            }
        });

        room.onMessage("playerDeath", (message) => {
            if (message.playerId === playerId) {
                playerState.isDead = true;
                playerState.health = 0;
                updateHUD();
            }
        });

        room.onMessage("weaponReload", (message) => {
            if (message.playerId === playerId) {
                playerState.ammo = 30;
                updateHUD();
            }
        });
        
    } catch (error) {
        console.error('Connection error:', error);
        connectButton.textContent = 'Connection Failed';
    }
});

// Start game
startButton.addEventListener('click', () => {
    if (room) {
        controls.lock();
        isGameStarted = true;
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize game
initScene();
initControls();
updateHUD();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (isGameStarted) {
        updateMovement();
    }
    
    renderer.render(scene, camera);
}
animate(); 