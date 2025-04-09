// Initialize Mapbox with your access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoicmFoa2luIiwiYSI6ImNtOTVxYXV2MzFkZDIyanBzZ2d1amc4N24ifQ.BQTvS3wC8JnfsHGYLo0_tw';
mapboxgl.accessToken = MAPBOX_TOKEN;

import { VEHICLES } from './vehicles.js';
import { VehicleSelect } from './vehicleSelect.js';

export class WorldFPS {
    constructor() {
        this.mapboxToken = MAPBOX_TOKEN;
        this.selectedVehicle = null;
        this.gameState = {
            player: null,
            map: null,
            camera: null,
            scene: null,
            renderer: null,
            controls: null,
            isInitialized: false,
            cameraAngle: 0, // Track camera rotation around vehicle
            targetCameraAngle: 0, // Smooth camera rotation
            lastUpdate: null,
            worldPosition: { x: 0, z: 0 } // Add world position tracking
        };

        // Show vehicle selection first
        this.showVehicleSelection();
    }

    showVehicleSelection() {
        const vehicleSelect = new VehicleSelect(
            (selectedVehicle) => {
                if (!selectedVehicle) {
                    console.error('No vehicle selected');
                    return;
                }
                console.log('Selected vehicle:', selectedVehicle);
                
                // Store selected vehicle in game state
                this.gameState.selectedVehicle = selectedVehicle;
                
                // Hide vehicle selection and show game
                document.getElementById('vehicle-select').style.display = 'none';
                document.getElementById('game-container').style.display = 'block';
                
                // Initialize game with selected vehicle
                this.initializeGame(selectedVehicle);
            }
        );
    }

    async initializeGame(selectedVehicle) {
        if (!selectedVehicle) {
            console.error('Cannot initialize game without selected vehicle');
            return;
        }

        console.log('Initializing game with vehicle:', selectedVehicle);

        // Initialize base game state
        this.gameState = {
            selectedVehicle: selectedVehicle,
            players: new Map(),
            projectiles: [],
            lastUpdate: Date.now(),
            map: null,
            scene: null,
            camera: null,
            renderer: null,
            vehicleModel: null,
            worldPosition: { x: 0, z: 0 },
            cameraAngle: 0,
            targetCameraAngle: 0
        };

        try {
            // Initialize core systems in order
            this.initializeThreeJS();
            await this.initializeMap();
            
            // Create and add vehicle model
            const vehicleModel = await this.createVehicleModel(selectedVehicle);
            if (vehicleModel) {
                // Store reference to vehicle model
                this.gameState.vehicleModel = vehicleModel;
                
                // Add to scene
                this.gameState.scene.add(vehicleModel);
                
                // Set initial camera position relative to vehicle
                const cameraHeight = 20;
                const cameraDistance = 40;
                this.gameState.camera.position.set(0, cameraHeight, cameraDistance);
                this.gameState.camera.lookAt(vehicleModel.position);
                
                console.log('Vehicle model added to scene:', vehicleModel);
            }

            // Initialize HUD
            this.initializeHUD();
            
            // Set up event listeners
            this.setupEventListeners();

            // Start game loop
            this.startGameLoop();

            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Error during game initialization:', error);
        }
    }

    async createVehicleModel(vehicle) {
        console.log('Creating vehicle model for:', vehicle.name);
        
        // Create model based on vehicle type
        let model;
        switch (vehicle.id) {
            case 'RAZORBACK':
                model = this.createRazorbackModel();
                break;
            case 'IRONCLAD':
                model = this.createIroncladModel();
                break;
            case 'SCORPION':
                model = this.createScorpionModel();
                break;
            case 'JUNKYARD_KING':
                model = this.createJunkyardKingModel();
                break;
            default:
                console.error('Unknown vehicle type:', vehicle.id);
                model = this.createBasicModel();
        }

        // Set initial position and scale
        model.position.set(0, 0, 0);
        model.scale.set(0.25, 0.25, 0.25);
        
        // Set initial rotation to face forward
        model.rotation.set(0, 0, 0);
        
        // Enable shadows for all meshes in the model
        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        return model;
    }

    createBasicModel() {
        // Basic fallback model
        const model = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(1.5, 0.5, 3);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: 0.6,
            roughness: 0.4
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        
        model.add(body);
        return model;
    }

    createRazorbackModel() {
        const model = new THREE.Group();
        
        // Sleek, aggressive body
        const bodyGeometry = new THREE.BoxGeometry(6, 1.5, 12);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d572c, // Military green
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Aerodynamic cabin
        const cabinGeometry = new THREE.BoxGeometry(5, 2, 6);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = 1.75;
        cabin.position.z = -1;
        
        // Dual cannons
        const cannonGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3);
        const cannonMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1
        });
        
        const cannon1 = new THREE.Mesh(cannonGeometry, cannonMaterial);
        cannon1.position.set(1, 1, 5);
        cannon1.rotation.x = Math.PI / 2;
        
        const cannon2 = new THREE.Mesh(cannonGeometry, cannonMaterial);
        cannon2.position.set(-1, 1, 5);
        cannon2.rotation.x = Math.PI / 2;
        
        model.add(body);
        model.add(cabin);
        model.add(cannon1);
        model.add(cannon2);
        
        return model;
    }

    createIroncladModel() {
        const model = new THREE.Group();
        
        // Heavy armored body
        const bodyGeometry = new THREE.BoxGeometry(8, 3, 14);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            metalness: 0.6,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Reinforced cabin
        const cabinGeometry = new THREE.BoxGeometry(6, 2.5, 6);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.6
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = 2.75;
        cabin.position.z = -2;
        
        // Heavy mortar
        const mortarBase = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 2, 2),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        mortarBase.position.set(0, 3.5, 2);
        
        const mortarBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 1, 4),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        mortarBarrel.position.set(0, 4.5, 2);
        mortarBarrel.rotation.x = -Math.PI / 4;
        
        model.add(body);
        model.add(cabin);
        model.add(mortarBase);
        model.add(mortarBarrel);
        
        return model;
    }

    createScorpionModel() {
        const model = new THREE.Group();
        
        // Sleek bike body
        const bodyGeometry = new THREE.BoxGeometry(3, 1, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x800080, // Purple
            metalness: 0.9,
            roughness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Front fairing
        const fairingGeometry = new THREE.ConeGeometry(1.5, 3, 4);
        const fairingMaterial = new THREE.MeshStandardMaterial({
            color: 0x800080,
            metalness: 0.9,
            roughness: 0.1
        });
        const fairing = new THREE.Mesh(fairingGeometry, fairingMaterial);
        fairing.rotation.x = -Math.PI / 2;
        fairing.position.set(0, 1, -3);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.5,
            roughness: 0.7
        });
        
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.rotation.z = Math.PI / 2;
        frontWheel.position.set(0, 0, -3);
        
        const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backWheel.rotation.z = Math.PI / 2;
        backWheel.position.set(0, 0, 3);
        
        model.add(body);
        model.add(fairing);
        model.add(frontWheel);
        model.add(backWheel);
        
        return model;
    }

    createJunkyardKingModel() {
        const model = new THREE.Group();
        
        // Rusty van body
        const bodyGeometry = new THREE.BoxGeometry(7, 4, 12);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Rusty brown
            metalness: 0.3,
            roughness: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Add random dents and attachments
        for (let i = 0; i < 5; i++) {
            const junkGeometry = new THREE.BoxGeometry(
                Math.random() * 2 + 1,
                Math.random() * 2 + 1,
                Math.random() * 2 + 1
            );
            const junkMaterial = new THREE.MeshStandardMaterial({
                color: 0x666666,
                metalness: 0.3,
                roughness: 0.9
            });
            const junk = new THREE.Mesh(junkGeometry, junkMaterial);
            junk.position.set(
                (Math.random() - 0.5) * 4,
                2 + Math.random() * 2,
                (Math.random() - 0.5) * 8
            );
            junk.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            model.add(junk);
        }
        
        // Flamethrower
        const tankGeometry = new THREE.CylinderGeometry(1, 1, 3);
        const tankMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.3
        });
        const tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.rotation.z = Math.PI / 2;
        tank.position.set(3, 2, 2);
        
        const nozzleGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2);
        const nozzle = new THREE.Mesh(nozzleGeometry, tankMaterial);
        nozzle.position.set(3, 2, 4);
        nozzle.rotation.x = Math.PI / 2;
        
        model.add(body);
        model.add(tank);
        model.add(nozzle);
        
        return model;
    }

    async initializeMap() {
        return new Promise((resolve, reject) => {
            try {
                // Set initial position (Manila, Philippines)
                const initialPosition = [121.0509, 14.5508];
                
                this.gameState.map = new mapboxgl.Map({
                    container: 'map',
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: initialPosition,
                    zoom: 18.5,
                    pitch: 60,
                    bearing: 0,
                    antialias: true,
                    renderWorldCopies: false
                });

                // Disable map rotation to prevent confusion
                this.gameState.map.dragRotate.disable();
                this.gameState.map.touchZoomRotate.disableRotation();

                this.gameState.map.on('load', () => {
                    console.log('Map loaded successfully');
                    
                    try {
                        // Add 3D terrain with reduced exaggeration
                        this.gameState.map.addSource('mapbox-dem', {
                            'type': 'raster-dem',
                            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                            'tileSize': 512,
                            'maxzoom': 14
                        });
                        
                        // Reduce terrain exaggeration to 0.3 for flatter terrain
                        this.gameState.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 0.3 });
                        
                        // Enhanced building layer with better colors
                        this.gameState.map.addLayer({
                            'id': '3d-buildings',
                            'source': 'composite',
                            'source-layer': 'building',
                            'filter': ['==', 'extrude', 'true'],
                            'type': 'fill-extrusion',
                            'minzoom': 15,
                            'paint': {
                                'fill-extrusion-color': '#ecf0f1',
                                'fill-extrusion-height': ['get', 'height'],
                                'fill-extrusion-base': ['get', 'min_height'],
                                'fill-extrusion-opacity': 0.95
                            }
                        });

                        resolve();
                    } catch (layerError) {
                        console.error('Error adding map layers:', layerError);
                        resolve();
                    }
                });
            } catch (error) {
                console.error('Map initialization error:', error);
                reject(new Error('Failed to initialize map: ' + error.message));
            }
        });
    }

    initializeState() {
        // Initialize game state with player object
        this.gameState = {
            players: new Map(),
            projectiles: [],
            lastUpdate: Date.now(),
            map: null,
            scene: null,
            camera: null,
            renderer: null,
            player: {
                health: this.gameState.selectedVehicle.health,
                maxHealth: this.gameState.selectedVehicle.health,
                speed: 0,
                position: [121.0509, 14.5508], // Manila coordinates
                rotation: 0,
                damageState: 'pristine',
                weapon: {
                    type: this.gameState.selectedVehicle.weaponType,
                    damage: this.gameState.selectedVehicle.damage,
                    cooldown: this.gameState.selectedVehicle.cooldown,
                    lastFired: 0
                }
            }
        };

        // Initialize controls
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shoot: false,
            boost: false
        };
    }

    initializeHUD() {
        const hud = document.getElementById('hud');
        if (!hud || !this.gameState.player) return;

        // Make HUD visible
        hud.style.display = 'block';

        // Update health display
        const healthDisplay = document.getElementById('health');
        if (healthDisplay) {
            healthDisplay.textContent = `HP: ${this.gameState.player.health}/${this.gameState.player.maxHealth}`;
        }

        // Update damage state
        const damageStateDisplay = document.getElementById('damage-state');
        if (damageStateDisplay) {
            damageStateDisplay.textContent = `State: ${this.gameState.player.damageState}`;
        }

        // Update damage bar
        const damageBar = document.querySelector('.damage-bar');
        if (damageBar) {
            const healthPercentage = (this.gameState.player.health / this.gameState.player.maxHealth) * 100;
            damageBar.style.width = `${healthPercentage}%`;
            
            // Set color based on health percentage
            if (healthPercentage > 75) {
                damageBar.style.backgroundColor = '#2ecc71'; // Green
            } else if (healthPercentage > 50) {
                damageBar.style.backgroundColor = '#f1c40f'; // Yellow
            } else if (healthPercentage > 25) {
                damageBar.style.backgroundColor = '#e67e22'; // Orange
            } else {
                damageBar.style.backgroundColor = '#e74c3c'; // Red
            }
        }

        // Update location
        const locationDisplay = document.getElementById('location');
        if (locationDisplay) {
            locationDisplay.textContent = 'Location: Manila, Philippines';
        }
    }

    async loadModels() {
        this.models = {};
        
        try {
            // Create different vehicle models
            this.models.vehicles = {
                RAZORBACK: this.createRazorbackModel(),
                IRONCLAD: this.createIroncladModel(),
                SCORPION: this.createScorpionModel(),
                JUNKYARD_KING: this.createJunkyardKingModel()
            };

            // Create projectile models for each weapon type
            this.models.projectiles = {
                'Dual Cannons': this.createCannonProjectile(),
                'Heavy Mortar': this.createMortarProjectile(),
                'Rocket Launcher': this.createRocketProjectile(),
                'Flamethrower': this.createFlameProjectile()
            };
        } catch (error) {
            console.error('Error creating models:', error);
        }
    }

    createCannonProjectile() {
        return new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            })
        );
    }

    createMortarProjectile() {
        return new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshStandardMaterial({
                color: 0x333333,
                emissive: 0xff4400,
                emissiveIntensity: 0.3
            })
        );
    }

    createRocketProjectile() {
        const rocket = new THREE.Group();
        
        // Rocket body
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        
        // Rocket tip
        const tip = new THREE.Mesh(
            new THREE.ConeGeometry(0.02, 0.04),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        tip.position.y = 0.07;
        
        // Rocket fins
        const finGeometry = new THREE.BoxGeometry(0.02, 0.04, 0.01);
        const finMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        
        const fin1 = new THREE.Mesh(finGeometry, finMaterial);
        fin1.position.set(0.02, -0.04, 0);
        const fin2 = new THREE.Mesh(finGeometry, finMaterial);
        fin2.position.set(-0.02, -0.04, 0);
        
        rocket.add(body);
        rocket.add(tip);
        rocket.add(fin1);
        rocket.add(fin2);
        
        return rocket;
    }

    createFlameProjectile() {
        const flame = new THREE.Mesh(
            new THREE.ConeGeometry(0.05, 0.2),
            new THREE.MeshStandardMaterial({
                color: 0xff4400,
                emissive: 0xff4400,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.7
            })
        );
        flame.rotation.x = Math.PI / 2;
        return flame;
    }

    addPlayerModel() {
        try {
            console.log('Adding player model...');
            
            // Get the selected vehicle's model
            const vehicleId = this.selectedVehicle.id;
            console.log('Selected vehicle ID:', vehicleId);
            
            const vehicleModel = this.models.vehicles[vehicleId];
            console.log('Vehicle model:', vehicleModel);
            
            if (!vehicleModel) {
                throw new Error(`No model found for vehicle: ${vehicleId}`);
            }

            // Remove any existing model
            if (this.gameState.player.model) {
                this.gameState.scene.remove(this.gameState.player.model);
            }

            // Scale and position the model
            vehicleModel.scale.set(1, 1, 1); // Reset scale
            vehicleModel.position.set(0, 0, 0);
            vehicleModel.rotation.y = Math.PI;
            
            // Add the model to the scene
            this.gameState.scene.add(vehicleModel);
            
            // Store reference to player model
            this.gameState.player.model = vehicleModel;
            
            // Ensure model casts and receives shadows
            vehicleModel.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    if (child.material) {
                        child.material.userData.originalColor = child.material.color.getHex();
                        child.material.userData.originalRoughness = child.material.roughness;
                        child.material.needsUpdate = true;
                    }
                }
            });

            console.log('Player model added successfully:', {
                position: vehicleModel.position,
                rotation: vehicleModel.rotation,
                scale: vehicleModel.scale
            });
        } catch (error) {
            console.error('Error adding player model:', error);
        }
    }

    updatePlayerModel() {
        if (!this.gameState.player.model) return;

        // Get current position
        const [lng, lat] = this.gameState.player.position;
        const position = this.gameState.map.project([lng, lat]);

        // Update model position
        this.gameState.player.model.position.set(
            position.x,
            0,
            position.y
        );

        // Update model rotation
        this.gameState.player.model.rotation.y = this.gameState.player.rotation;
    }

    updateDamageState() {
        const health = this.gameState.player.health;
        const states = this.selectedVehicle.damageStates;
        
        let newState = 'critical';
        if (health >= states.pristine.min) {
            newState = 'pristine';
        } else if (health >= states.scratched.min) {
            newState = 'scratched';
        } else if (health >= states.wrecked.min) {
            newState = 'wrecked';
        }
        
        if (newState !== this.gameState.player.damageState) {
            this.gameState.player.damageState = newState;
            // Update UI to show damage state
            const healthElement = document.getElementById('health');
            if (healthElement) {
                healthElement.textContent = `Health: ${health} (${newState.toUpperCase()})`;
                healthElement.className = `health-${newState}`;
            }
        }
    }

    shoot() {
        const now = Date.now();
        const weapon = this.gameState.player.weapon;
        
        if (now > weapon.lastFired + weapon.cooldown) {
            weapon.lastFired = now;
            
            // Create projectile based on weapon type
            const projectile = this.models.projectiles[weapon.type].clone();
            const angle = this.gameState.player.rotation * Math.PI / 180;
            
            // Position projectile at vehicle's weapon position (varies by vehicle)
            const weaponOffset = {
                'Dual Cannons': { y: 0.15, z: 0.35 },
                'Heavy Mortar': { y: 0.4, z: 0.3 },
                'Rocket Launcher': { y: 0.12, z: 0.3 },
                'Flamethrower': { y: 0.2, z: 0.5 }
            }[weapon.type];
            
            projectile.position.set(
                this.gameState.player.model.position.x + Math.sin(angle) * weaponOffset.z,
                this.gameState.player.model.position.y + weaponOffset.y,
                this.gameState.player.model.position.z + Math.cos(angle) * weaponOffset.z
            );
            
            // Add velocity and lifetime to projectile
            projectile.userData.velocity = {
                x: Math.sin(angle) * weapon.projectileSpeed,
                z: Math.cos(angle) * weapon.projectileSpeed
            };
            projectile.userData.lifetime = now + 2000; // 2 seconds
            projectile.userData.damage = weapon.damage;
            projectile.userData.range = weapon.range;
            
            this.gameState.projectiles.push(projectile);
            this.gameState.scene.add(projectile);
        }
    }

    updateCamera() {
        if (!this.gameState.camera || !this.gameState.vehicleModel) return;

        // Get vehicle's current position and rotation
        const vehiclePos = this.gameState.vehicleModel.position;
        const vehicleRotation = this.gameState.vehicleModel.rotation.y;

        // Fixed camera settings
        const cameraHeight = 6;
        const cameraDistance = 15;

        // Calculate camera position behind the vehicle
        const cameraX = vehiclePos.x - Math.sin(vehicleRotation) * cameraDistance;
        const cameraY = vehiclePos.y + cameraHeight;
        const cameraZ = vehiclePos.z - Math.cos(vehicleRotation) * cameraDistance;

        // Set camera position directly to avoid scaling effects
        this.gameState.camera.position.set(cameraX, cameraY, cameraZ);

        // Look at vehicle position
        this.gameState.camera.lookAt(
            vehiclePos.x,
            vehiclePos.y + 1,
            vehiclePos.z
        );
    }

    updatePlayerPosition() {
        if (!this.gameState.vehicleModel || !this.controls) return;

        // Get vehicle's current rotation
        const vehicleRotation = this.gameState.vehicleModel.rotation.y;
        
        // Calculate movement direction based on input
        let moveX = 0;
        let moveZ = 0;
        const baseSpeed = 0.8;
        const speed = this.controls.boost ? baseSpeed * 2.0 : baseSpeed;
        const turnSpeed = 0.02;
        
        // Only handle turning if the vehicle is moving
        if (this.controls.forward || this.controls.backward) {
            // Handle turning - update rotation first
            if (this.controls.left) {
                this.gameState.vehicleModel.rotation.y += turnSpeed;
            }
            if (this.controls.right) {
                this.gameState.vehicleModel.rotation.y -= turnSpeed;
            }

            // Calculate forward/backward movement based on current rotation
            if (this.controls.forward) {
                moveX = -Math.sin(vehicleRotation) * speed;
                moveZ = -Math.cos(vehicleRotation) * speed;
            }
            if (this.controls.backward) {
                moveX = Math.sin(vehicleRotation) * (speed * 0.5);
                moveZ = Math.cos(vehicleRotation) * (speed * 0.5);
            }

            // Apply movement if moving
            if (moveX !== 0 || moveZ !== 0) {
                // Update world position
                this.gameState.worldPosition.x += moveX;
                this.gameState.worldPosition.z += moveZ;

                // Update vehicle model position
                this.gameState.vehicleModel.position.x = this.gameState.worldPosition.x;
                this.gameState.vehicleModel.position.y = 0;
                this.gameState.vehicleModel.position.z = this.gameState.worldPosition.z;

                // Update map position
                if (this.gameState.map) {
                    const startLng = 121.0509;
                    const startLat = 14.5508;
                    const scale = 0.00001;
                    
                    const newLng = startLng + this.gameState.worldPosition.x * scale;
                    const newLat = startLat - this.gameState.worldPosition.z * scale;
                    this.gameState.map.setCenter([newLng, newLat]);
                }
            }
        }

        // Always update map bearing to match vehicle rotation
        if (this.gameState.map) {
            this.gameState.map.setBearing(-(vehicleRotation * 180 / Math.PI));
        }
    }

    updateVehicleAppearance() {
        // Update vehicle appearance based on damage state
        const state = this.gameState.player.damageState;
        
        this.gameState.player.model.traverse(child => {
            if (child instanceof THREE.Mesh) {
                const material = child.material;
                
                switch (state) {
                    case 'pristine':
                        material.roughness = material.userData.originalRoughness || material.roughness;
                        material.color.set(material.userData.originalColor || material.color.getHex());
                        break;
                    case 'scratched':
                        material.roughness = Math.min(material.roughness + 0.2, 1);
                        material.color.multiplyScalar(0.9);
                        break;
                    case 'wrecked':
                        material.roughness = Math.min(material.roughness + 0.4, 1);
                        material.color.multiplyScalar(0.7);
                        break;
                    case 'critical':
                        material.roughness = 1;
                        material.color.multiplyScalar(0.5);
                        break;
                }
            }
        });
    }

    add3DObjects() {
        console.log('Adding 3D objects...');
        
        // Get vegetation and landuse data
        const features = this.gameState.map.queryRenderedFeatures({
            layers: ['vegetation']
        });

        console.log(`Found ${features.length} vegetation features`);

        // We'll keep this method empty for now since we're removing vegetation
        // This will be used later for adding other 3D objects if needed
    }

    initializeThreeJS() {
        // Create scene with transparent background
        this.gameState.scene = new THREE.Scene();
        
        // Create camera with adjusted FOV and position
        this.gameState.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Create renderer with proper settings
        this.gameState.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true,
            alpha: true
        });
        
        // Configure renderer
        this.gameState.renderer.setSize(window.innerWidth, window.innerHeight);
        this.gameState.renderer.setClearColor(0x000000, 0);
        this.gameState.renderer.shadowMap.enabled = true;
        this.gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.gameState.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.gameState.scene.add(directionalLight);
        
        // Make canvas interactive and above map
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.style.pointerEvents = 'auto';
            canvas.style.zIndex = '3';
        }

        // Disable map interaction
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.style.pointerEvents = 'none';
        }

        // Initialize controls
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shoot: false,
            boost: false
        };

        // Handle window resize
        window.addEventListener('resize', () => {
            this.gameState.camera.aspect = window.innerWidth / window.innerHeight;
            this.gameState.camera.updateProjectionMatrix();
            this.gameState.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupEventListeners() {
        // Keyboard controls with both WASD and arrow keys
        const keyMap = {
            'KeyW': 'forward',
            'KeyS': 'backward',
            'KeyA': 'left',
            'KeyD': 'right',
            'ArrowUp': 'forward',
            'ArrowDown': 'backward',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'ShiftLeft': 'boost',
            'Space': 'shoot'
        };

        // Keyboard down handler
        document.addEventListener('keydown', (e) => {
            const control = keyMap[e.code];
            if (control && this.controls) {
                e.preventDefault();
                this.controls[control] = true;
            }
        });

        // Keyboard up handler
        document.addEventListener('keyup', (e) => {
            const control = keyMap[e.code];
            if (control && this.controls) {
                e.preventDefault();
                this.controls[control] = false;
            }
        });

        // Mouse click handler for shooting
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click only
                e.preventDefault();
                this.controls.shoot = true;
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // Left click only
                e.preventDefault();
                this.controls.shoot = false;
            }
        });
    }

    updateProjectiles() {
        const now = Date.now();
        
        // Update projectile positions and remove expired ones
        this.gameState.projectiles = this.gameState.projectiles.filter(projectile => {
            if (now > projectile.userData.lifetime) {
                this.gameState.scene.remove(projectile);
                return false;
            }
            
            projectile.position.x += projectile.userData.velocity.x;
            projectile.position.z += projectile.userData.velocity.z;
            
            return true;
        });
    }

    initializeSearch() {
        const searchInput = document.getElementById('location-search');
        const searchResults = document.getElementById('search-results');
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value;

            if (query.length < 3) {
                searchResults.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(
                        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&types=place`
                    );
                    const data = await response.json();

                    searchResults.innerHTML = '';
                    searchResults.style.display = 'block';

                    data.features.forEach(place => {
                        const div = document.createElement('div');
                        div.className = 'search-result';
                        div.textContent = place.place_name;
                        div.addEventListener('click', () => {
                            this.teleportToLocation(place.center[0], place.center[1], place.place_name);
                            searchResults.style.display = 'none';
                            searchInput.value = '';
                        });
                        searchResults.appendChild(div);
                    });
                } catch (error) {
                    console.error('Error searching for location:', error);
                }
            }, 500);
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchResults.contains(e.target) && e.target !== searchInput) {
                searchResults.style.display = 'none';
            }
        });
    }

    teleportToLocation(longitude, latitude, placeName) {
        // Update player position
        this.gameState.player.position = [longitude, latitude, 0];
        
        // Update map
        this.gameState.map.flyTo({
            center: [longitude, latitude],
            zoom: 20.5,
            duration: 2000
        });

        // Update location display with animation
        const locationElement = document.getElementById('location');
        locationElement.style.opacity = '0';
        setTimeout(() => {
            locationElement.textContent = `Location: ${placeName}`;
            locationElement.style.opacity = '1';
        }, 200);
    }

    startGameLoop() {
        console.log('Starting game loop');
        
        const animate = () => {
            requestAnimationFrame(animate);
            
            if (!this.gameState.vehicleModel || !this.gameState.camera) {
                console.log('Missing required game state components');
                return;
            }

            // Update game state
            const now = Date.now();
            const deltaTime = (now - (this.gameState.lastUpdate || now)) / 1000;
            this.gameState.lastUpdate = now;

            // Debug log input states
            if (this.controls) {
                console.log('Controls state:', {
                    forward: this.controls.forward,
                    backward: this.controls.backward,
                    left: this.controls.left,
                    right: this.controls.right,
                    boost: this.controls.boost
                });
            }
            
            // Update player position and rotation
            this.updatePlayerPosition();
            
            // Update camera
            this.updateCamera();
            
            // Ensure vehicle is visible
            this.gameState.vehicleModel.visible = true;

            // Debug logging
            console.log('Vehicle position:', this.gameState.vehicleModel.position);
            console.log('Camera position:', this.gameState.camera.position);
            console.log('Vehicle rotation:', this.gameState.vehicleModel.rotation.y);

            // Render scene
            if (this.gameState.renderer && this.gameState.scene && this.gameState.camera) {
                this.gameState.renderer.render(this.gameState.scene, this.gameState.camera);
            }
        };
        
        animate();
    }

    updateUI() {
        // Update health display
        const healthElement = document.getElementById('health');
        if (healthElement) {
            healthElement.textContent = `HP: ${this.gameState.player.health}`;
        }

        // Update ammo display
        const ammoElement = document.getElementById('ammo');
        if (ammoElement) {
            ammoElement.textContent = `${this.gameState.player.ammo}/${this.gameState.player.reserveAmmo}`;
        }

        // Update damage state
        const damageStateElement = document.getElementById('damage-state');
        if (damageStateElement) {
            damageStateElement.textContent = `State: ${this.getDamageState()}`;
        }
    }

    getDamageState() {
        const health = this.gameState.player.health;
        const states = this.selectedVehicle.damageStates;
        
        if (health >= states.pristine.min) return 'Pristine';
        if (health >= states.scratched.min) return 'Scratched';
        if (health >= states.wrecked.min) return 'Wrecked';
        return 'Critical';
    }

    initializeScene() {
        // Create scene
        this.gameState.scene = new THREE.Scene();
        
        // Create camera
        this.gameState.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near plane
            1000 // Far plane
        );
        
        // Set initial camera position
        this.gameState.camera.position.set(0, 5, 10);
        this.gameState.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.gameState.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.gameState.renderer.setSize(window.innerWidth, window.innerHeight);
        this.gameState.renderer.shadowMap.enabled = true;
        
        // Add renderer to DOM
        const container = document.getElementById('game-container');
        if (container) {
            container.appendChild(this.gameState.renderer.domElement);
        }
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.gameState.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        this.gameState.scene.add(directionalLight);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.gameState.camera.aspect = window.innerWidth / window.innerHeight;
            this.gameState.camera.updateProjectionMatrix();
            this.gameState.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Add ground plane
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.gameState.scene.add(ground);
    }
}

window.onload = () => {
    window.game = new WorldFPS();
};
