// Import Three.js and specific components
import * as THREE from 'three';
import { BoxGeometry, MeshStandardMaterial, Mesh, Group, Vector3, Quaternion, Euler } from 'three';

// Initialize Mapbox with your access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoicmFoa2luIiwiYSI6ImNtOTVxYXV2MzFkZDIyanBzZ2d1amc4N24ifQ.BQTvS3wC8JnfsHGYLo0_tw';
mapboxgl.accessToken = MAPBOX_TOKEN;

// Import vehicle data and selection UI
import { VEHICLES } from '../vehicles/vehicles.js';
import { VehicleSelect } from '../ui/VehicleSelect.js';

import { CannonPhysics } from './CannonPhysics.js';

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
        
        // Initialize physics
        this.physics = new CannonPhysics();
        
        // Add debug key listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p') {
                this.physics.toggleDebug(this.gameState.scene);
            }
        });
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
            currentSpeed: 0,
            currentTurnAngle: 0,
            currentTilt: 0,
            debug: true
        };

        // Initialize controls
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shoot: false,
            boost: false,
            drift: false
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
            
            // Set up event listeners for controls
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
        model.scale.set(0.25, 0.25, 0.25); // Scale down to 1/4 size
        
        // Set initial rotation - only around Y axis
        model.rotation.set(0, 0, 0);
        
        // Initialize orientation vectors if they don't exist
        if (!model.userData) {
            model.userData = {};
        }
        
        // Ensure orientation vectors are properly initialized
        model.userData.forward = new THREE.Vector3(0, 0, 1);
        model.userData.right = new THREE.Vector3(1, 0, 0);
        model.userData.up = new THREE.Vector3(0, 1, 0);
        
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
        // Basic fallback model with scaled dimensions
        const model = new THREE.Group();
        
        // Main body (scaled down by 2x)
        const bodyGeometry = new THREE.BoxGeometry(0.75, 0.25, 1.5);
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
        
        // Sleek, aggressive body (scaled down by 2x)
        const bodyGeometry = new THREE.BoxGeometry(3, 0.75, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d572c, // Military green
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5; // Scaled down position
        
        // Aerodynamic cabin - moved forward (scaled down by 2x)
        const cabinGeometry = new THREE.BoxGeometry(2.5, 1, 3);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = 1.375; // Scaled down position
        cabin.position.z = 0.5; // Scaled down position

        // Create wheel groups for steering
        const frontLeftWheelGroup = new THREE.Group();
        const frontRightWheelGroup = new THREE.Group();
        
        // Position the wheel groups relative to body (scaled down by 2x)
        frontLeftWheelGroup.position.set(1.75, 0.5, 1.5);
        frontRightWheelGroup.position.set(-1.75, 0.5, 1.5);
        
        model.add(frontLeftWheelGroup);
        model.add(frontRightWheelGroup);
        
        // Add wheels (scaled down by 2x)
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
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

        // Back wheels - directly attached to body (scaled down by 2x)
        const backLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backLeftWheel.rotation.z = Math.PI / 2;
        backLeftWheel.position.set(1.75, 0.5, -2.75);
        
        const backRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backRightWheel.rotation.z = Math.PI / 2;
        backRightWheel.position.set(-1.75, 0.5, -2.75);
        
        // Long front-mounted cannons (scaled down by 2x)
        const cannonGeometry = new THREE.CylinderGeometry(0.075, 0.075, 2); // Reduced length from 4 to 2
        const cannonMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 1.0,
            roughness: 0.1
        });
        
        // Left cannon (scaled down position)
        const cannon1 = new THREE.Mesh(cannonGeometry, cannonMaterial);
        cannon1.position.set(0.75, 1.1, 2.5); // Scaled down from (1.5, 2.2, 5)
        cannon1.rotation.x = Math.PI / 2;
        
        // Right cannon (scaled down position)
        const cannon2 = new THREE.Mesh(cannonGeometry, cannonMaterial);
        cannon2.position.set(-0.75, 1.1, 2.5); // Scaled down from (-1.5, 2.2, 5)
        cannon2.rotation.x = Math.PI / 2;
        
        // Add direction indicator (small arrow - scaled down by 2x)
        const directionArrow = new THREE.Mesh(
            new THREE.ConeGeometry(0.15, 0.5, 8), // Scaled down from (0.3, 1, 8)
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        directionArrow.rotation.x = -Math.PI / 2;
        directionArrow.position.set(0, 1.75, 2); // Scaled down from (0, 3.5, 4)
        
        model.add(body);
        model.add(cabin);
        model.add(cannon1);
        model.add(cannon2);
        model.add(backLeftWheel);
        model.add(backRightWheel);
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
        
        // Heavy armored body - scaled down by half
        const bodyGeometry = new THREE.BoxGeometry(4, 1.5, 7);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            metalness: 0.6,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        
        // Reinforced cabin - scaled down by half
        const cabinGeometry = new THREE.BoxGeometry(3, 1.25, 3);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.6
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = 1.625;
        cabin.position.z = -1;

        // Create wheel groups for steering
        const frontLeftWheelGroup = new THREE.Group();
        const frontRightWheelGroup = new THREE.Group();
        const backLeftWheelGroup = new THREE.Group();
        const backRightWheelGroup = new THREE.Group();
        
        // Position the wheel groups - front wheels at the front, back wheels at the back
        frontLeftWheelGroup.position.set(2.25, 0.75, 2.5);
        frontRightWheelGroup.position.set(-2.25, 0.75, 2.5);
        backLeftWheelGroup.position.set(2.25, 0.75, -2.5);
        backRightWheelGroup.position.set(-2.25, 0.75, -2.5);
        
        model.add(frontLeftWheelGroup);
        model.add(frontRightWheelGroup);
        model.add(backLeftWheelGroup);
        model.add(backRightWheelGroup);
        
        // Add wheels - scaled down by half
        const wheelGeometry = new THREE.CylinderGeometry(0.75, 0.75, 0.6, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.5,
            roughness: 0.7
        });

        // Create wheels with proper orientation
        const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontLeftWheel.rotation.z = Math.PI / 2;
        frontLeftWheelGroup.add(frontLeftWheel);
        
        const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontRightWheel.rotation.z = Math.PI / 2;
        frontRightWheelGroup.add(frontRightWheel);

        const backLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backLeftWheel.rotation.z = Math.PI / 2;
        backLeftWheelGroup.add(backLeftWheel);
        
        const backRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backRightWheel.rotation.z = Math.PI / 2;
        backRightWheelGroup.add(backRightWheel);
        
        // Heavy mortar - scaled down by half
        const mortarBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.75, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        mortarBase.position.set(0, 2.25, 1);
        
        const mortarBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.5, 2),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        mortarBarrel.position.set(0, 2.75, 1);
        mortarBarrel.rotation.x = -Math.PI / 4;
        
        // Add direction indicator - scaled down by half
        const directionArrow = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.6, 8),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        directionArrow.rotation.x = -Math.PI / 2;
        directionArrow.position.set(0, 2.25, 3);
        
        model.add(body);
        model.add(cabin);
        model.add(mortarBase);
        model.add(mortarBarrel);
        model.add(directionArrow);
        
        // Store references and orientation data
        model.userData = {
            wheels: {
                frontLeft: frontLeftWheel,
                frontRight: frontRightWheel,
                backLeft: backLeftWheel,
                backRight: backRightWheel
            },
            wheelGroups: {
                frontLeft: frontLeftWheelGroup,
                frontRight: frontRightWheelGroup,
                backLeft: backLeftWheelGroup,
                backRight: backRightWheelGroup
            },
            cannons: [mortarBarrel],
            directionArrow: directionArrow,
            forward: new THREE.Vector3(0, 0, 1),
            right: new THREE.Vector3(1, 0, 0),
            up: new THREE.Vector3(0, 1, 0)
        };
        
        return model;
    }

    createScorpionModel() {
        const model = new THREE.Group();
        
        // Main bike body - more streamlined
        const bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x800080,
            metalness: 0.9,
            roughness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.0;
        
        // Front fairing - more aerodynamic
        const fairingGeometry = new THREE.ConeGeometry(0.8, 2.5, 4);
        const fairingMaterial = new THREE.MeshStandardMaterial({
            color: 0x800080,
            metalness: 0.9,
            roughness: 0.1
        });
        const fairing = new THREE.Mesh(fairingGeometry, fairingMaterial);
        fairing.rotation.x = -Math.PI / 2;
        fairing.position.set(0, 1.2, -2.8);

        // Fuel tank - more pronounced
        const tankGeometry = new THREE.CylinderGeometry(0.4, 0.6, 1.2, 8);
        const tankMaterial = new THREE.MeshStandardMaterial({
            color: 0x800080,
            metalness: 0.9,
            roughness: 0.1
        });
        const tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.rotation.x = Math.PI / 2;
        tank.position.set(0, 1.4, -0.5);

        // Seat - more comfortable looking
        const seatGeometry = new THREE.BoxGeometry(0.8, 0.2, 1.2);
        const seatMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.3,
            roughness: 0.8
        });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 1.2, 0.8);

        // Create wheel groups for steering
        const frontWheelGroup = new THREE.Group();
        const backWheelGroup = new THREE.Group();
        
        // Position the wheel groups relative to body
        frontWheelGroup.position.set(0, 1.0, -2.5);
        backWheelGroup.position.set(0, 1.0, 2.0);
        
        model.add(frontWheelGroup);
        model.add(backWheelGroup);
        
        // Add wheels - larger and more motorcycle-like
        const wheelGeometry = new THREE.CylinderGeometry(1.0, 1.0, 0.4, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.5,
            roughness: 0.7
        });

        // Front wheel - added to its group
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.rotation.z = Math.PI / 2;
        frontWheelGroup.add(frontWheel);
        
        // Back wheel - added to its group
        const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backWheel.rotation.z = Math.PI / 2;
        backWheelGroup.add(backWheel);
        
        // Rocket launcher - more integrated into the bike
        const launcherBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.6, 1.5),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        launcherBase.position.set(0, 1.8, 0);
        
        const launcherBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.3, 2.5),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        launcherBarrel.position.set(0, 2.0, 0);
        launcherBarrel.rotation.x = Math.PI / 2;
        
        // Add direction indicator (small arrow)
        const directionArrow = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.8, 8),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        directionArrow.rotation.x = -Math.PI / 2;
        directionArrow.position.set(0, 2.0, 2.5);
        
        model.add(body);
        model.add(fairing);
        model.add(tank);
        model.add(seat);
        model.add(launcherBase);
        model.add(launcherBarrel);
        model.add(directionArrow);
        
        // Store references and orientation data
        model.userData = {
            frontWheels: {
                left: frontWheelGroup,
                right: frontWheelGroup // Same group for both sides on a bike
            },
            cannons: [launcherBarrel],
            directionArrow: directionArrow,
            forward: new THREE.Vector3(0, 0, 1),
            right: new THREE.Vector3(1, 0, 0),
            up: new THREE.Vector3(0, 1, 0)
        };
        
        return model;
    }

    createJunkyardKingModel() {
        const model = new THREE.Group();
        
        // Rusty van body - halved dimensions
        const bodyGeometry = new THREE.BoxGeometry(3.5, 2, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513,
            metalness: 0.3,
            roughness: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        
        // Reinforced cabin - halved dimensions
        const cabinGeometry = new THREE.BoxGeometry(3, 1.5, 2.5);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            metalness: 0.4,
            roughness: 0.8
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = 2.25;
        cabin.position.z = -1;

        // Create wheel groups for steering
        const frontLeftWheelGroup = new THREE.Group();
        const frontRightWheelGroup = new THREE.Group();
        const backLeftWheelGroup = new THREE.Group();
        const backRightWheelGroup = new THREE.Group();
        
        // Position the wheel groups relative to body
        frontLeftWheelGroup.position.set(1.75, 0.75, 2.5);
        frontRightWheelGroup.position.set(-1.75, 0.75, 2.5);
        backLeftWheelGroup.position.set(1.75, 0.75, -2.5);
        backRightWheelGroup.position.set(-1.75, 0.75, -2.5);
        
        model.add(frontLeftWheelGroup);
        model.add(frontRightWheelGroup);
        model.add(backLeftWheelGroup);
        model.add(backRightWheelGroup);
        
        // Add wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.75, 0.75, 0.5, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.5,
            roughness: 0.7
        });

        // Add wheels to their groups
        const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontLeftWheel.rotation.z = Math.PI / 2;
        frontLeftWheelGroup.add(frontLeftWheel);
        
        const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontRightWheel.rotation.z = Math.PI / 2;
        frontRightWheelGroup.add(frontRightWheel);

        const backLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backLeftWheel.rotation.z = Math.PI / 2;
        backLeftWheelGroup.add(backLeftWheel);
        
        const backRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backRightWheel.rotation.z = Math.PI / 2;
        backRightWheelGroup.add(backRightWheel);
        
        // Flamethrower system - mounted at the front
        // Main tank (mounted on top)
        const tankGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2.0);
        const tankMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.3
        });
        const tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.rotation.z = Math.PI / 2;
        tank.position.set(0, 2.5, 0); // Centered on top of the van

        // Large front-mounted nozzle (primary)
        const largeNozzleGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2);
        const largeNozzle = new THREE.Mesh(largeNozzleGeometry, tankMaterial);
        largeNozzle.rotation.x = Math.PI / 2;
        largeNozzle.position.set(0, 1.8, 3.2); // Centered at front, slightly higher

        // Small secondary nozzle
        const smallNozzleGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.8);
        const smallNozzle = new THREE.Mesh(smallNozzleGeometry, tankMaterial);
        smallNozzle.rotation.x = Math.PI / 2;
        smallNozzle.position.set(1.0, 1.5, 3.0); // Offset to the right side

        // Connecting pipes
        const pipeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.0);
        const pipe1 = new THREE.Mesh(pipeGeometry, tankMaterial);
        pipe1.position.set(0, 2.2, 1.5);
        pipe1.rotation.x = Math.PI / 4;

        const pipe2 = new THREE.Mesh(pipeGeometry, tankMaterial);
        pipe2.position.set(1.0, 2.0, 1.5);
        pipe2.rotation.x = Math.PI / 4;
        
        // Add direction indicator
        const directionArrow = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.6, 8),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        directionArrow.rotation.x = -Math.PI / 2;
        directionArrow.position.set(0, 2.75, 3);
        
        // Add all components to the model
        model.add(body);
        model.add(cabin);
        model.add(tank);
        model.add(largeNozzle);
        model.add(smallNozzle);
        model.add(pipe1);
        model.add(pipe2);
        model.add(directionArrow);
        
        // Store references and orientation data
        model.userData = {
            frontWheels: {
                left: frontLeftWheelGroup,
                right: frontRightWheelGroup
            },
            wheels: {
                frontLeft: frontLeftWheel,
                frontRight: frontRightWheel,
                backLeft: backLeftWheel,
                backRight: backRightWheel
            },
            wheelGroups: {
                frontLeft: frontLeftWheelGroup,
                frontRight: frontRightWheelGroup,
                backLeft: backLeftWheelGroup,
                backRight: backRightWheelGroup
            },
            cannons: [largeNozzle, smallNozzle], // Both nozzles as flame emission points
            directionArrow: directionArrow,
            forward: new THREE.Vector3(0, 0, 1),
            right: new THREE.Vector3(1, 0, 0),
            up: new THREE.Vector3(0, 1, 0)
        };
        
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
        const cooldown = this.gameState.selectedVehicle.cooldown || 100;

        if (this.lastShotTime && now - this.lastShotTime < cooldown) {
            this.log.debug('Shot cooldown in effect');
            return;
        }
        this.lastShotTime = now;

        // Get cannon references and vehicle orientation
        const model = this.gameState.vehicleModel;
        const cannons = model.userData.cannons || [];
        const forwardVector = new THREE.Vector3(0, 0, 1);
        forwardVector.applyQuaternion(model.quaternion);

        // Special handling for Junkyard King's flamethrower
        if (this.gameState.selectedVehicle.type === 'Modified Van') {
            cannons.forEach(cannon => {
                // Get cannon's world position and orientation
                const cannonWorldPos = new THREE.Vector3();
                const cannonWorldQuat = new THREE.Quaternion();
                cannon.getWorldPosition(cannonWorldPos);
                cannon.getWorldQuaternion(cannonWorldQuat);

                // Create flame group
                const flameGroup = new THREE.Group();
                
                // Create multiple flame segments with increasing size
                const numSegments = 20;
                const baseLength = 192.0;
                const segmentLength = baseLength / numSegments;
                
                for (let i = 0; i < numSegments; i++) {
                    const distanceFactor = i / numSegments;
                    const flameRadius = 2.0 + (distanceFactor * 8.0);
                    const flameLength = segmentLength * (1 + distanceFactor);
                    
                    const flamesPerSegment = 3;
                    for (let j = 0; j < flamesPerSegment; j++) {
                        const flameGeometry = new THREE.ConeGeometry(flameRadius, flameLength, 12);
                        const flameMaterial = new THREE.MeshBasicMaterial({
                            color: i < numSegments/3 ? 0xff1100 : (i < numSegments*2/3 ? 0xff4400 : 0xff6600),
                            transparent: true,
                            opacity: 0.9 - (distanceFactor * 0.5)
                        });
                        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
                        
                        // Position within segment
                        const angle = (j / flamesPerSegment) * Math.PI * 2;
                        const spreadRadius = flameRadius * 0.5;
                        flame.position.x = Math.cos(angle) * spreadRadius * distanceFactor;
                        flame.position.y = Math.sin(angle) * spreadRadius * distanceFactor;
                        flame.position.z = i * segmentLength;
                        
                        // Align flame with cannon direction
                        flame.rotation.x = Math.PI / 2;
                        flameGroup.add(flame);
                    }

                    // Add point lights for dramatic effect
                    if (i % 4 === 0) {
                        const flameLight = new THREE.PointLight(0xff2200, 20 - (distanceFactor * 12), 40);
                        flameLight.position.set(0, 0, i * segmentLength);
                        flameGroup.add(flameLight);
                    }
                }

                // Position and orient the flame group at the cannon
                flameGroup.position.copy(cannonWorldPos);
                flameGroup.quaternion.copy(cannonWorldQuat);
                
                // Add to scene
                this.gameState.scene.add(flameGroup);

                // Set up flame properties with correct velocity direction
                const flameVelocity = new THREE.Vector3(0, 0, 1);
                flameVelocity.applyQuaternion(cannonWorldQuat);
                flameVelocity.multiplyScalar(480.0);

                flameGroup.userData = {
                    velocity: {
                        x: flameVelocity.x,
                        y: 0,
                        z: flameVelocity.z
                    },
                    lifetime: now + 1500,
                    spawnTime: now,
                    type: 'flame'
                };

                if (!this.gameState.projectiles) {
                    this.gameState.projectiles = [];
                }
                
                this.gameState.projectiles.push(flameGroup);

                // Create enhanced muzzle flash effect
                this.createFlameEffect(cannonWorldPos);
            });
        } else {
            // Regular projectile handling for other vehicles
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
    }

    createFlameEffect(position) {
        // Create larger flash for flamethrower
        const flashGeometry = new THREE.SphereGeometry(2.0, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xff2200,
            transparent: true,
            opacity: 0.9
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.gameState.scene.add(flash);

        // Create intense point light
        const light = new THREE.PointLight(0xff2200, 10, 15);
        light.position.copy(position);
        this.gameState.scene.add(light);

        // Animate flash with slower fade
        let opacity = 0.9;
        const fadeOut = setInterval(() => {
            opacity -= 0.05;
            flashMaterial.opacity = opacity;
            light.intensity = 10 * (opacity / 0.9);
            if (opacity <= 0) {
                clearInterval(fadeOut);
                this.gameState.scene.remove(flash);
                this.gameState.scene.remove(light);
            }
        }, 50);
    }

    updateProjectiles() {
        if (!this.gameState.projectiles) return;

        const now = Date.now();
        const deltaTime = Math.min((now - this.gameState.lastUpdate) / 1000, 0.1);
        this.gameState.lastUpdate = now;

        this.gameState.projectiles = this.gameState.projectiles.filter(projectile => {
            if (!projectile || now > projectile.userData.lifetime) {
                if (projectile) {
                    this.gameState.scene.remove(projectile);
                }
                return false;
            }

            if (projectile.userData.type === 'flame') {
                // Update flame effects
                const timeAlive = (now - projectile.userData.spawnTime) / 1000;
                
                // Update position with faster movement
                projectile.position.x += projectile.userData.velocity.x * deltaTime;
                projectile.position.z += projectile.userData.velocity.z * deltaTime;
                
                // Add slight upward drift to flames
                projectile.position.y += 2.0 * deltaTime;
                
                // Scale flames dynamically
                const scaleFactor = 1.0 + (timeAlive * 0.8);
                projectile.scale.set(scaleFactor, scaleFactor, 1.0 + (timeAlive * 0.2));
                
                // Fade out flames over time with longer persistence
                projectile.traverse(child => {
                    if (child.material && child.material.opacity) {
                        child.material.opacity = Math.max(0, 0.9 - (timeAlive * 0.6));
                    }
                    if (child.type === 'PointLight') {
                        child.intensity = Math.max(0, 15 * (1 - timeAlive * 0.7));
                        child.distance = 20 + (timeAlive * 10);
                    }
                });

                return true;
            } else {
                // Regular projectile update logic
                projectile.userData.lastPosition = projectile.position.clone();

                const timeAlive = (now - projectile.userData.spawnTime) / 1000;

                projectile.position.x += projectile.userData.velocity.x * deltaTime;
                projectile.position.z += projectile.userData.velocity.z * deltaTime;

                if (timeAlive < 0.5) {
                    projectile.position.y += projectile.userData.velocity.y * deltaTime;
                } else if (timeAlive < 2.0) {
                    projectile.position.y += (projectile.userData.velocity.y * 0.1) * deltaTime;
                } else {
                    projectile.userData.velocity.y += this.gameState.gravity * 0.5 * deltaTime;
                    projectile.position.y += projectile.userData.velocity.y * deltaTime;
                }

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

                if (projectile.position.y <= 5.0) {
                    this.gameState.scene.remove(projectile);
                    return false;
                }

                return true;
            }
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

        // Get current state
        const model = this.gameState.vehicleModel;
        const deltaTime = Math.min((Date.now() - this.gameState.lastUpdate) / 1000, 0.1);
        
        // Initialize position if not exists
        if (!this.gameState.worldPosition) {
            this.gameState.worldPosition = {
                x: 0,
                z: 0
            };
        }

        // Get vehicle characteristics
        const vehicleType = this.gameState.selectedVehicle.type;
        const characteristics = {
            maxSpeed: this.gameState.selectedVehicle.maxSpeed,
            acceleration: this.gameState.selectedVehicle.acceleration,
            deceleration: this.gameState.selectedVehicle.deceleration,
            turnSpeed: this.gameState.selectedVehicle.turnSpeed * 0.02,
            boostMultiplier: vehicleType === 'Muscle Car' ? 2.0 : 1.75,
            boostAccelerationMultiplier: vehicleType === 'Muscle Car' ? 1.75 : 1.5,
            reverseSpeedMultiplier: 0.6
        };

        // Apply boost modifiers
        const currentMaxSpeed = this.controls.boost ? 
            characteristics.maxSpeed * characteristics.boostMultiplier : 
            characteristics.maxSpeed;
        
        const currentAcceleration = this.controls.boost ? 
            characteristics.acceleration * characteristics.boostAccelerationMultiplier : 
            characteristics.acceleration;

        // Update speed based on input
        if (this.controls.forward) {
            this.gameState.currentSpeed = Math.min(
                (this.gameState.currentSpeed || 0) + currentAcceleration,
                currentMaxSpeed
            );
        } else if (this.controls.backward) {
            this.gameState.currentSpeed = Math.max(
                (this.gameState.currentSpeed || 0) - currentAcceleration,
                -currentMaxSpeed * characteristics.reverseSpeedMultiplier
            );
        } else {
            // Apply deceleration when no input
            if (Math.abs(this.gameState.currentSpeed) < characteristics.deceleration) {
                this.gameState.currentSpeed = 0;
            } else if (this.gameState.currentSpeed > 0) {
                this.gameState.currentSpeed -= characteristics.deceleration;
            } else if (this.gameState.currentSpeed < 0) {
                this.gameState.currentSpeed += characteristics.deceleration;
            }
        }

        // Update rotation based on input
        if (Math.abs(this.gameState.currentSpeed) > 0.01) {
            const speedFactor = Math.abs(this.gameState.currentSpeed) / characteristics.maxSpeed;
            const currentTurnSpeed = this.controls.boost ? 
                characteristics.turnSpeed * 0.7 : 
                characteristics.turnSpeed;

            // Invert turning when going backwards
            const turnDirection = this.gameState.currentSpeed >= 0 ? 1 : -1;

        if (this.controls.left) {
                model.rotation.y += currentTurnSpeed * turnDirection;
                if (model.userData.wheelGroups) {
                    const steeringAngle = Math.PI / 6;
                    model.userData.wheelGroups.frontLeft.rotation.y = steeringAngle;
                    model.userData.wheelGroups.frontRight.rotation.y = steeringAngle;
                }
            } else if (this.controls.right) {
                model.rotation.y -= currentTurnSpeed * turnDirection;
                if (model.userData.wheelGroups) {
                    const steeringAngle = -Math.PI / 6;
                    model.userData.wheelGroups.frontLeft.rotation.y = steeringAngle;
                    model.userData.wheelGroups.frontRight.rotation.y = steeringAngle;
                }
            } else {
                // Reset wheel rotation
                if (model.userData.wheelGroups) {
                    model.userData.wheelGroups.frontLeft.rotation.y = 0;
                    model.userData.wheelGroups.frontRight.rotation.y = 0;
                }
            }
        }

        // Calculate movement vector based on vehicle's forward direction
        if (this.gameState.currentSpeed !== 0) {
            // Use model's rotation to determine forward direction
            const moveX = -Math.sin(model.rotation.y) * this.gameState.currentSpeed;
            const moveZ = -Math.cos(model.rotation.y) * this.gameState.currentSpeed;

            // Update world position
            this.gameState.worldPosition.x += moveX;
            this.gameState.worldPosition.z += moveZ;

            // Update model position
            model.position.set(
                this.gameState.worldPosition.x,
                model.position.y, // Maintain current height
                this.gameState.worldPosition.z
            );

            // Rotate wheels
            if (model.userData.wheels) {
                const wheelRotation = 3 * this.gameState.currentSpeed;
                Object.values(model.userData.wheels).forEach((wheel, index) => {
                    // Alternate rotation direction for left/right wheels
                    wheel.rotation.x += wheelRotation * (index % 2 === 0 ? 1 : -1);
                });
            }

            // Update map position
            if (this.gameState.map) {
                const startLng = 121.0509;
                const startLat = 14.5508;
                const scale = 0.000015;
                
                const newLng = startLng + this.gameState.worldPosition.x * scale;
                const newLat = startLat - this.gameState.worldPosition.z * scale;
                
                this.gameState.map.setCenter([newLng, newLat]);
                this.gameState.map.setBearing(-(model.rotation.y * 180 / Math.PI));
            }
        }

        // Update last update time
        this.gameState.lastUpdate = Date.now();

        // Debug logging
        if (this.gameState.debug) {
            console.log('Vehicle Movement:', {
                vehicleType: vehicleType,
                speed: this.gameState.currentSpeed,
                maxSpeed: currentMaxSpeed,
                boost: this.controls.boost,
                turnRate: characteristics.turnSpeed,
                position: {
                    x: model.position.x,
                    y: model.position.y,
                    z: model.position.z
                },
                rotation: {
                    y: model.rotation.y
                }
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
            driftFactor: 0.85,        // How much grip is lost during drift
            driftRecovery: 0.02,      // How quickly grip recovers after drift
            lateralFriction: 1.0,     // Current grip level (modified during drift)
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
                    driftFactor: 0.7,        // Better drift control
                    driftRecovery: 0.015,    // Slower grip recovery for longer drifts
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
        const gameCanvas = document.getElementById('game-canvas');
        gameCanvas.willReadFrequently = true;
        
        this.gameState.renderer = new THREE.WebGLRenderer({
            canvas: gameCanvas,
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
            'Space': 'drift'
        };

        // Keyboard down handler
        document.addEventListener('keydown', (e) => {
            const control = keyMap[e.code];
            if (control && this.controls) {
                e.preventDefault();
                this.controls[control] = true;
                console.log('Key pressed:', e.code, 'Control:', control, 'Controls state:', this.controls);
            }
        });

        // Keyboard up handler
        document.addEventListener('keyup', (e) => {
            const control = keyMap[e.code];
            if (control && this.controls) {
                e.preventDefault();
                this.controls[control] = false;
                console.log('Key released:', e.code, 'Control:', control, 'Controls state:', this.controls);
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

            // Update physics before rendering
            this.physics.update(deltaTime);
            this.physics.updateDebug();
            
            // Continue with regular rendering
            this.gameState.renderer.render(this.gameState.scene, this.gameState.camera);
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

    updateVehiclePhysics(delta) {
        // ... existing code ...
        if (this.currentVehicle.type === 'Modified Van') {
            // Heavy van physics
            const maxTiltAngle = 15 * (Math.PI / 180); // 15 degrees max tilt
            const tiltSpeed = 1.5; // Slower tilt for heavy vehicle
            
            // Calculate tilt based on turn angle and speed
            const targetTilt = -this.currentTurnAngle * (this.currentSpeed / this.currentVehicle.maxSpeed);
            const tiltAngle = Math.max(-maxTiltAngle, Math.min(maxTiltAngle, targetTilt));
            
            // Apply tilt smoothly
            this.vehicleModel.rotation.z = THREE.MathUtils.lerp(
                this.vehicleModel.rotation.z,
                tiltAngle,
                tiltSpeed * delta
            );
            
            // Reduced turning at higher speeds
            if (Math.abs(this.currentSpeed) > this.currentVehicle.maxSpeed * 0.5) {
                this.currentTurnAngle *= 0.8; // 20% reduced turning at high speed
            }
            
            // Gradual steering response
            if (this.controls.left || this.controls.right) {
                this.currentTurnAngle *= 0.9; // 10% reduced steering response
            }
        }
        // ... existing code ...
    }

    createVehicle(vehicleData, position) {
        // Create visual model
        const model = this.createVehicleModel(vehicleData);
        
        // Create physics body using the new method
        const physicsBody = this.physics.createVehicleBody(vehicleData, position);
        
        // Add model to scene
        this.gameState.scene.add(model);
        
        // Store vehicle data
        const vehicle = {
            model,
            physicsBody,
            data: vehicleData,
            position,
            rotation: new THREE.Euler(),
            lastUpdate: Date.now()
        };
        
        // Add to game state
        this.gameState.vehicles = this.gameState.vehicles || [];
        this.gameState.vehicles.push(vehicle);
        
        return vehicle;
    }
}

window.onload = () => {
    window.game = new WorldFPS();
};

