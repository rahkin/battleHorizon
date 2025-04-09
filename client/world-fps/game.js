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
            worldPosition: { x: 0, z: 0 }, // Add world position tracking
            projectiles: [],
            gravity: -9.8, // Add gravity constant
            lastUpdate: Date.now(),
            debug: true, // Enable debug logging
            currentSpeed: null,
            currentTurnAngle: null,
            currentTilt: null
        };

        // Initialize logging
        this.setupLogging();
        this.showVehicleSelection();
    }

    setupLogging() {
        this.log = {
            debug: (...args) => {
                if (this.gameState.debug) console.log('[DEBUG]', ...args);
            },
            error: (...args) => console.error('[ERROR]', ...args),
            info: (...args) => console.log('[INFO]', ...args),
            warn: (...args) => console.warn('[WARN]', ...args)
        };
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
            targetCameraAngle: 0,
            currentSpeed: null,
            currentTurnAngle: null,
            currentTilt: null
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
        model.position.set(0, 0.1, 0); // Slightly above ground
        model.scale.set(0.5, 0.5, 0.5);
        
        // Set initial rotation - only around Y axis
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
        body.position.y = 1.0; // Raise body to accommodate wheels
        
        // Aerodynamic cabin - moved forward
        const cabinGeometry = new THREE.BoxGeometry(5, 2, 6);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = 2.75;
        cabin.position.z = 1;

        // Create wheel groups for steering
        const frontLeftWheelGroup = new THREE.Group();
        const frontRightWheelGroup = new THREE.Group();
        
        // Position the wheel groups relative to body
        frontLeftWheelGroup.position.set(3.5, 1.0, 3);
        frontRightWheelGroup.position.set(-3.5, 1.0, 3);
        
        model.add(frontLeftWheelGroup);
        model.add(frontRightWheelGroup);
        
        // Add wheels
        const wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.8, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.5,
            roughness: 0.7
        });

        // Front wheels - added to their respective groups
        const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontLeftWheel.rotation.z = Math.PI / 2;
        frontLeftWheelGroup.add(frontLeftWheel);
        
        const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontRightWheel.rotation.z = Math.PI / 2;
        frontRightWheelGroup.add(frontRightWheel);

        // Back wheels - directly attached to body
        const backLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backLeftWheel.rotation.z = Math.PI / 2;
        backLeftWheel.position.set(3.5, 1.0, -5.5);
        
        const backRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backRightWheel.rotation.z = Math.PI / 2;
        backRightWheel.position.set(-3.5, 1.0, -5.5);
        
        // Long front-mounted cannons
        const cannonGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8);
        const cannonMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 1.0,
            roughness: 0.2
        });
        
        // Left cannon
        const cannon1 = new THREE.Mesh(cannonGeometry, cannonMaterial);
        cannon1.position.set(1.5, 2.2, 5);
        cannon1.rotation.x = Math.PI / 2;
        
        // Right cannon
        const cannon2 = new THREE.Mesh(cannonGeometry, cannonMaterial);
        cannon2.position.set(-1.5, 2.2, 5);
        cannon2.rotation.x = Math.PI / 2;
        
        model.add(body);
        model.add(cabin);
        model.add(cannon1);
        model.add(cannon2);
        model.add(backLeftWheel);
        model.add(backRightWheel);
        
        // Add direction indicator (small arrow)
        const directionArrow = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 1, 8),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        directionArrow.rotation.x = -Math.PI / 2;
        directionArrow.position.set(0, 3.5, 4);
        model.add(directionArrow);
        
        // Store references and orientation data
        model.userData = {
            frontWheels: {
                left: frontLeftWheelGroup,
                right: frontRightWheelGroup
            },
            cannons: [cannon1, cannon2],
            directionArrow: directionArrow,
            forward: new THREE.Vector3(0, 0, 1),
            right: new THREE.Vector3(1, 0, 0),
            up: new THREE.Vector3(0, 1, 0)
        };
        
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
                    zoom: 20,
                    pitch: 80, // Set high pitch for driver's perspective
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
        if (!this.gameState.vehicleModel) {
            this.log.error('Cannot shoot: No vehicle model');
            return;
        }

        const now = Date.now();
        const cooldown = 100;

        if (this.lastShotTime && now - this.lastShotTime < cooldown) {
            this.log.debug('Shot cooldown in effect');
            return;
        }
        this.lastShotTime = now;

        // Get cannon references and vehicle orientation
        const model = this.gameState.vehicleModel;
        const cannons = model.userData.cannons || [];
        const forwardVector = model.userData.forward;
        
        cannons.forEach((cannon, index) => {
            // Get cannon's world position
            const cannonWorldPos = new THREE.Vector3();
            cannon.getWorldPosition(cannonWorldPos);

            const projectile = new THREE.Group();
            
            // Create projectile sphere
            const projectileSphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 16, 16),
                new THREE.MeshStandardMaterial({
                    color: 0xff0000,
                    emissive: 0xff0000,
                    emissiveIntensity: 2.0
                })
            );
            projectile.add(projectileSphere);

            // Add trail
            const trailGeometry = new THREE.CylinderGeometry(0.2, 0.1, 2, 8);
            const trailMaterial = new THREE.MeshBasicMaterial({
                color: 0xff7700,
                transparent: true,
                opacity: 0.7
            });
            const trail = new THREE.Mesh(trailGeometry, trailMaterial);
            trail.rotation.x = Math.PI / 2;
            trail.position.z = -1;
            projectile.add(trail);

            // Set projectile position to cannon's world position
            projectile.position.copy(cannonWorldPos);
            
            // Use forward vector for projectile direction
            const projectileSpeed = 200.0;
            const initialUpwardVelocity = 5.0;
            
            projectile.userData = {
                velocity: {
                    x: forwardVector.x * projectileSpeed,
                    y: initialUpwardVelocity,
                    z: forwardVector.z * projectileSpeed
                },
                lifetime: now + 3000,
                spawnTime: now,
                lastPosition: projectile.position.clone()
            };

            if (!this.gameState.projectiles) {
                this.gameState.projectiles = [];
            }

            this.gameState.projectiles.push(projectile);
            this.gameState.scene.add(projectile);

            // Create muzzle flash at cannon position
            this.createMuzzleFlash(cannonWorldPos);
        });
    }

    createMuzzleFlash(position) {
        // Create flash geometry
        const flashGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.gameState.scene.add(flash);

        // Create point light
        const light = new THREE.PointLight(0xff7700, 10, 5);
        light.position.copy(position);
        this.gameState.scene.add(light);

        // Animate flash
        let opacity = 0.8;
        const fadeOut = setInterval(() => {
            opacity -= 0.2;
            flashMaterial.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(fadeOut);
                this.gameState.scene.remove(flash);
                this.gameState.scene.remove(light);
            }
        }, 20);
    }

    updateProjectiles() {
        if (!this.gameState.projectiles) return;

        const now = Date.now();
        const deltaTime = Math.min((now - this.gameState.lastUpdate) / 1000, 0.1);
        this.gameState.lastUpdate = now;

        this.gameState.projectiles = this.gameState.projectiles.filter(projectile => {
            if (!projectile || now > projectile.userData.lifetime) {
                if (projectile) {
                    // Simply remove the projectile without explosion
                    this.gameState.scene.remove(projectile);
                }
                return false;
            }

            // Store last position for trail
            projectile.userData.lastPosition = projectile.position.clone();

            const timeAlive = (now - projectile.userData.spawnTime) / 1000;

            // Update position with larger scale
            projectile.position.x += projectile.userData.velocity.x * deltaTime;
            projectile.position.z += projectile.userData.velocity.z * deltaTime;

            // Update vertical movement with higher arc
            if (timeAlive < 0.5) {
                // Initial ascent phase - strong upward movement
                projectile.position.y += projectile.userData.velocity.y * deltaTime;
            } else if (timeAlive < 2.0) {
                // Extended peak phase - maintain height
                projectile.position.y += (projectile.userData.velocity.y * 0.1) * deltaTime;
            } else {
                // Descent phase - gradual fall
                projectile.userData.velocity.y += this.gameState.gravity * 0.5 * deltaTime;
                projectile.position.y += projectile.userData.velocity.y * deltaTime;
            }

            // Update trail with smoother orientation
            const trail = projectile.children[1];
            if (trail) {
                const direction = new THREE.Vector3().subVectors(
                    projectile.position,
                    projectile.userData.lastPosition
                ).normalize();
                trail.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 0, 1),
                    direction
                );
            }

            // Ground collision - just remove the projectile without explosion
            if (projectile.position.y <= 5.0) {
                this.gameState.scene.remove(projectile);
                return false;
            }

            return true;
        });
    }

    createExplosion(position) {
        // Create larger explosion effect
        const explosionGeometry = new THREE.SphereGeometry(8, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 1
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        explosion.position.y = Math.max(position.y, 5.0);

        this.gameState.scene.add(explosion);

        // Add stronger light flash
        const light = new THREE.PointLight(0xff7700, 15, 30);
        light.position.copy(position);
        this.gameState.scene.add(light);

        // Animate explosion
        const startTime = Date.now();
        const duration = 800;
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const scale = 1 + progress * 6; // Larger expansion
                explosion.scale.set(scale, scale, scale);
                explosion.material.opacity = 1 - progress;
                light.intensity = 15 * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                this.gameState.scene.remove(explosion);
                this.gameState.scene.remove(light);
            }
        };

        animate();
    }

    updateCamera() {
        if (!this.gameState.camera || !this.gameState.vehicleModel) return;

        const vehiclePos = this.gameState.vehicleModel.position;
        const vehicleRotation = this.gameState.vehicleModel.rotation.y;

        // Camera settings
        const cameraHeight = 3;
        const cameraDistance = 10; // Reduced from 12
        const lookAheadDistance = 15; // Reduced from 50

        // Calculate camera position behind vehicle
        const cameraX = vehiclePos.x - Math.sin(vehicleRotation) * cameraDistance;
        const cameraY = vehiclePos.y + cameraHeight;
        const cameraZ = vehiclePos.z - Math.cos(vehicleRotation) * cameraDistance;

        // Smoothly interpolate camera position
        this.gameState.camera.position.lerp(new THREE.Vector3(cameraX, cameraY, cameraZ), 0.1);

        // Look ahead of vehicle
        const lookAtX = vehiclePos.x + Math.sin(vehicleRotation) * lookAheadDistance;
        const lookAtY = vehiclePos.y + 1;
        const lookAtZ = vehiclePos.z + Math.cos(vehicleRotation) * lookAheadDistance;

        // Update camera target
        this.gameState.camera.lookAt(lookAtX, lookAtY, lookAtZ);

        // Set camera FOV and near/far planes
        this.gameState.camera.fov = 75;
        this.gameState.camera.near = 0.1;
        this.gameState.camera.far = 1000;
        this.gameState.camera.updateProjectionMatrix();

        this.log.debug('Camera Update:', {
            position: this.gameState.camera.position,
            lookAt: { x: lookAtX, y: lookAtY, z: lookAtZ },
            vehiclePos: vehiclePos
        });
    }

    updatePlayerPosition() {
        if (!this.gameState.vehicleModel || !this.controls) return;

        const vehicleRotation = this.gameState.vehicleModel.rotation.y;
        const vehicle = this.gameState.selectedVehicle;
        
        // Get vehicle-specific characteristics
        const characteristics = this.getVehicleCharacteristics(vehicle);
        
        // Initialize movement variables
        let moveX = 0;
        let moveZ = 0;
        let currentSpeed = this.gameState.currentSpeed || 0;
        let currentTurnRate = 0;
        
        // Update vehicle orientation vectors
        const model = this.gameState.vehicleModel;
        model.userData.forward.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicleRotation);
        model.userData.right.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicleRotation);
        
        // Apply acceleration/deceleration
        if (this.controls.forward) {
            currentSpeed = Math.min(
                currentSpeed + (characteristics.acceleration * characteristics.forwardBias),
                this.controls.boost ? characteristics.maxSpeed * 1.5 : characteristics.maxSpeed
            );
        } else if (this.controls.backward) {
            currentSpeed = Math.max(
                currentSpeed - (characteristics.acceleration * characteristics.reverseBias),
                -characteristics.maxSpeed * characteristics.reverseSpeedMultiplier
            );
        } else {
            currentSpeed *= (1 - characteristics.rollingResistance);
        }

        // Apply natural deceleration
        if (Math.abs(currentSpeed) > 0.01) {
            const decelRate = currentSpeed > 0 ? characteristics.deceleration : characteristics.deceleration * 0.5;
            currentSpeed *= (1 - decelRate);
        } else {
            currentSpeed = 0;
        }

        // Calculate turn rate and wheel steering
        if (Math.abs(currentSpeed) > 0.1) {
            const speedFactor = Math.abs(currentSpeed) / characteristics.maxSpeed;
            const turnMultiplier = currentSpeed > 0 ? 1 : -1;
            
            // Calculate steering angle - reduced for more realistic turning
            let steeringAngle = 0;
            if (this.controls.left) {
                currentTurnRate = characteristics.turnSpeed * 
                    turnMultiplier * 
                    characteristics.turnSpeedCurve(speedFactor);
                steeringAngle = Math.PI / 6; // 30 degrees - more realistic
            } else if (this.controls.right) {
                currentTurnRate = -characteristics.turnSpeed * 
                    turnMultiplier * 
                    characteristics.turnSpeedCurve(speedFactor);
                steeringAngle = -Math.PI / 6; // -30 degrees - more realistic
            }

            // Apply steering to front wheels with smooth interpolation
            if (this.gameState.vehicleModel.userData.frontWheels) {
                const leftWheel = this.gameState.vehicleModel.userData.frontWheels.left;
                const rightWheel = this.gameState.vehicleModel.userData.frontWheels.right;
                
                if (leftWheel && rightWheel) {
                    // Get current rotation
                    const currentLeftRotation = leftWheel.rotation.y || 0;
                    const currentRightRotation = rightWheel.rotation.y || 0;
                    
                    // Smoothly interpolate to target angle
                    const interpolationFactor = 0.15; // Adjust for smoother or faster turning
                    
                    leftWheel.rotation.y = currentLeftRotation + 
                        (steeringAngle - currentLeftRotation) * interpolationFactor;
                    rightWheel.rotation.y = currentRightRotation + 
                        (steeringAngle - currentRightRotation) * interpolationFactor;
                }
            }
        } else {
            // Return wheels to neutral position when not moving
            if (this.gameState.vehicleModel.userData.frontWheels) {
                const leftWheel = this.gameState.vehicleModel.userData.frontWheels.left;
                const rightWheel = this.gameState.vehicleModel.userData.frontWheels.right;
                
                if (leftWheel && rightWheel) {
                    // Smoothly return to center
                    const returnFactor = 0.1;
                    leftWheel.rotation.y *= (1 - returnFactor);
                    rightWheel.rotation.y *= (1 - returnFactor);
                }
            }
        }

        // Apply turn rate with smoothing
        this.gameState.currentTurnAngle = (this.gameState.currentTurnAngle || 0) * 0.8 + currentTurnRate * 0.2;
        this.gameState.vehicleModel.rotation.y += this.gameState.currentTurnAngle;

        // Calculate movement vector
        moveX = -Math.sin(vehicleRotation) * currentSpeed;
        moveZ = -Math.cos(vehicleRotation) * currentSpeed;

        // Apply suspension and tilt effects
        if (Math.abs(currentSpeed) > 0.1) {
            const tiltAmount = (currentTurnRate * characteristics.bodyRoll) * (currentSpeed / characteristics.maxSpeed);
            const targetTilt = new THREE.Vector3(
                characteristics.suspensionTravel * (currentSpeed / characteristics.maxSpeed) * 0.1,
                0,
                tiltAmount
            );
            
            // Smooth tilt transition
            if (!this.gameState.currentTilt) {
                this.gameState.currentTilt = new THREE.Vector3();
            }
            
            this.gameState.currentTilt.lerp(targetTilt, characteristics.suspensionStiffness);
            
            // Apply tilt to vehicle model
            this.gameState.vehicleModel.rotation.x = this.gameState.currentTilt.x;
            this.gameState.vehicleModel.rotation.z = this.gameState.currentTilt.z;
        } else {
            // Return to neutral position when stationary
            if (this.gameState.currentTilt) {
                this.gameState.currentTilt.lerp(new THREE.Vector3(0, 0, 0), characteristics.suspensionStiffness);
                this.gameState.vehicleModel.rotation.x = this.gameState.currentTilt.x;
                this.gameState.vehicleModel.rotation.z = this.gameState.currentTilt.z;
            }
        }

        // Update position
        if (moveX !== 0 || moveZ !== 0) {
            this.gameState.worldPosition.x += moveX;
            this.gameState.worldPosition.z += moveZ;

            this.gameState.vehicleModel.position.x = this.gameState.worldPosition.x;
            this.gameState.vehicleModel.position.y = 0.1; // Base height
            this.gameState.vehicleModel.position.z = this.gameState.worldPosition.z;

            // Update map position
            if (this.gameState.map) {
                const startLng = 121.0509;
                const startLat = 14.5508;
                const scale = 0.000015;
                
                const newLng = startLng + this.gameState.worldPosition.x * scale;
                const newLat = startLat - this.gameState.worldPosition.z * scale;
                this.gameState.map.setCenter([newLng, newLat]);
                this.gameState.map.setBearing(-(vehicleRotation * 180 / Math.PI));
            }
        }

        // Store current speed for next frame
        this.gameState.currentSpeed = currentSpeed;

        // Debug logging
        if (this.gameState.debug) {
            this.log.debug('Vehicle Movement:', {
                speed: currentSpeed,
                turnRate: currentTurnRate,
                position: this.gameState.vehicleModel.position,
                rotation: this.gameState.vehicleModel.rotation
            });
        }
    }

    getVehicleCharacteristics(vehicle) {
        // Base characteristics that all vehicles share
        const baseCharacteristics = {
            maxSpeed: 0.5,
            acceleration: 0.015,
            deceleration: 0.02,
            turnSpeed: 0.03,
            suspensionTravel: 0.1,
            suspensionStiffness: 0.1,
            bodyRoll: 0.15,
            rollingResistance: 0.01,
            forwardBias: 1.0,
            reverseBias: 0.7,
            reverseSpeedMultiplier: 0.6,
            turnSpeedCurve: (speedFactor) => {
                // Default turn speed curve - reduces turn rate at high speeds
                return 0.5 + (1 - speedFactor) * 0.5;
            }
        };

        // Vehicle-specific characteristic adjustments
        switch (vehicle.id) {
            case 'RAZORBACK':
                return {
                    ...baseCharacteristics,
                    maxSpeed: 0.8,
                    acceleration: 0.02,
                    deceleration: 0.015,
                    turnSpeed: 0.04,
                    bodyRoll: 0.2,
                    suspensionStiffness: 0.15,
                    turnSpeedCurve: (speedFactor) => {
                        // Razorback maintains better turning at high speeds
                        return 0.7 + (1 - speedFactor) * 0.3;
                    }
                };

            case 'IRONCLAD':
                return {
                    ...baseCharacteristics,
                    maxSpeed: 0.4,
                    acceleration: 0.01,
                    deceleration: 0.008,
                    turnSpeed: 0.02,
                    bodyRoll: 0.1,
                    suspensionStiffness: 0.2,
                    rollingResistance: 0.02,
                    turnSpeedCurve: (speedFactor) => {
                        // Ironclad has consistent but slow turning
                        return 0.8;
                    }
                };

            case 'SCORPION':
                return {
                    ...baseCharacteristics,
                    maxSpeed: 1.0,
                    acceleration: 0.025,
                    deceleration: 0.02,
                    turnSpeed: 0.05,
                    bodyRoll: 0.25,
                    suspensionStiffness: 0.08,
                    turnSpeedCurve: (speedFactor) => {
                        // Scorpion has aggressive turning at low speeds
                        return 1.0 - (speedFactor * 0.6);
                    }
                };

            case 'JUNKYARD_KING':
                return {
                    ...baseCharacteristics,
                    maxSpeed: 0.6,
                    acceleration: 0.012,
                    deceleration: 0.015,
                    turnSpeed: 0.025,
                    bodyRoll: 0.18,
                    suspensionStiffness: 0.12,
                    turnSpeedCurve: (speedFactor) => {
                        // Junkyard King has balanced turning
                        return 0.6 + (1 - speedFactor) * 0.4;
                    }
                };

            default:
                return baseCharacteristics;
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
            70, // FOV for driver's perspective
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Position camera initially
        this.gameState.camera.position.set(0, 3, 12);
        this.gameState.camera.lookAt(0, 1, 50);
        
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
            'ShiftLeft': 'boost'
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
            if (e.button === 0) { // Left click
                e.preventDefault();
                console.log('Mouse click detected - attempting to shoot');
                this.shoot();
            }
        });

        // Prevent context menu on right click
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
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
            
            // Update player position and rotation
            this.updatePlayerPosition();
            
            // Update projectiles and explosions
            this.updateProjectiles();
            
            // Update camera
            this.updateCamera();
            
            // Ensure vehicle is visible
            this.gameState.vehicleModel.visible = true;

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
