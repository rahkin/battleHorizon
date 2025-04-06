// Initialize Mapbox with your access token
mapboxgl.accessToken = 'pk.eyJ1IjoicmFoa2luIiwiYSI6ImNtOTVxYXV2MzFkZDIyanBzZ2d1amc4N24ifQ.BQTvS3wC8JnfsHGYLo0_tw';

class WorldFPS {
    constructor() {
        this.initializeState();
        this.loadModels();
        this.initializeMap();
        this.initializeThreeJS();
        this.setupEventListeners();
        this.startGameLoop();
    }

    initializeState() {
        this.playerState = {
            position: [121.0509, 14.5508, 0], // BGC Manila coordinates
            rotation: 0,
            speed: 0,
            maxSpeed: 0.0002,
            acceleration: 0.000001,
            deceleration: 0.0000005,
            turnSpeed: 2,
            health: 100,
            ammo: 30,
            maxAmmo: 30,
            reserveAmmo: 90,
            weaponCooldown: 0,
            weaponCooldownTime: 500 // milliseconds
        };

        this.gameState = {
            players: new Map(),
            projectiles: [],
            lastUpdate: Date.now()
        };

        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shoot: false,
            boost: false
        };
    }

    async loadModels() {
        this.models = {};
        
        try {
            // Create car model
            const carGeometry = new THREE.Group();
            
            // Car body
            const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 4);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.6,
                metalness: 0.8
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.castShadow = true;
            body.receiveShadow = true;
            
            // Car cabin
            const cabinGeometry = new THREE.BoxGeometry(1.5, 0.6, 2);
            const cabinMaterial = new THREE.MeshStandardMaterial({
                color: 0x666666,
                roughness: 0.2,
                metalness: 0.9
            });
            const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
            cabin.position.y = 0.55;
            cabin.position.z = -0.5;
            cabin.castShadow = true;
            
            // Weapon mount
            const mountGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8);
            const mountMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                roughness: 0.5,
                metalness: 0.8
            });
            const mount = new THREE.Mesh(mountGeometry, mountMaterial);
            mount.position.y = 0.7;
            mount.position.z = 0.5;
            
            // Weapon barrel
            const barrelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
            const barrel = new THREE.Mesh(barrelGeometry, mountMaterial);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.y = 0.7;
            barrel.position.z = 1.2;
            
            // Wheels
            const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
            const wheelMaterial = new THREE.MeshStandardMaterial({
                color: 0x222222,
                roughness: 0.8,
                metalness: 0.5
            });
            
            const wheels = [];
            const wheelPositions = [
                [-1.1, -0.2, -1.5],
                [1.1, -0.2, -1.5],
                [-1.1, -0.2, 1.5],
                [1.1, -0.2, 1.5]
            ];
            
            wheelPositions.forEach(pos => {
                const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel.position.set(...pos);
                wheel.rotation.z = Math.PI / 2;
                wheel.castShadow = true;
                wheels.push(wheel);
            });
            
            // Add all parts to the car
            carGeometry.add(body);
            carGeometry.add(cabin);
            carGeometry.add(mount);
            carGeometry.add(barrel);
            wheels.forEach(wheel => carGeometry.add(wheel));
            
            this.models.car = carGeometry;

            // Create projectile model
            const projectileGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const projectileMaterial = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5,
                roughness: 0.3,
                metalness: 0.7
            });
            this.models.projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

            // Create detailed tree model
            const treeGeometry = new THREE.Group();
            
            // Tree trunk with bark texture
            const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513,
                roughness: 0.9,
                metalness: 0.1,
                bumpScale: 0.02
            });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            
            // Tree foliage with multiple layers
            const createFoliageLayer = (y, scale) => {
                const foliageGeometry = new THREE.SphereGeometry(1.5 * scale, 8, 8);
                const foliageMaterial = new THREE.MeshStandardMaterial({
                    color: 0x2D5A27,
                    roughness: 0.8,
                    metalness: 0.1
                });
                const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
                foliage.position.y = y;
                foliage.scale.y = 0.7;
                foliage.castShadow = true;
                return foliage;
            };
            
            treeGeometry.add(trunk);
            treeGeometry.add(createFoliageLayer(2.5, 1.0));
            treeGeometry.add(createFoliageLayer(3.0, 0.8));
            treeGeometry.add(createFoliageLayer(3.5, 0.6));
            
            this.models.tree = treeGeometry;

            // Create grass patches
            const grassGeometry = new THREE.Group();
            const createGrassBlade = (x, z) => {
                const blade = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.1, 0.5),
                    new THREE.MeshStandardMaterial({
                        color: 0x90CF7D,
                        side: THREE.DoubleSide,
                        alphaTest: 0.5
                    })
                );
                blade.position.set(x, 0.25, z);
                blade.rotation.y = Math.random() * Math.PI;
                blade.rotation.x = Math.random() * 0.2;
                return blade;
            };

            for (let i = 0; i < 50; i++) {
                const x = (Math.random() - 0.5) * 2;
                const z = (Math.random() - 0.5) * 2;
                grassGeometry.add(createGrassBlade(x, z));
            }
            
            this.models.grass = grassGeometry;

            // Create bench model
            const benchGeometry = new THREE.Group();
            
            // Bench seat
            const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.6);
            const benchMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513,
                roughness: 0.8,
                metalness: 0.2
            });
            const seat = new THREE.Mesh(seatGeometry, benchMaterial);
            seat.castShadow = true;
            seat.receiveShadow = true;
            
            // Bench legs
            const legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.6);
            const leg1 = new THREE.Mesh(legGeometry, benchMaterial);
            const leg2 = new THREE.Mesh(legGeometry, benchMaterial);
            leg1.position.set(-0.8, -0.25, 0);
            leg2.position.set(0.8, -0.25, 0);
            leg1.castShadow = true;
            leg2.castShadow = true;
            
            benchGeometry.add(seat);
            benchGeometry.add(leg1);
            benchGeometry.add(leg2);
            this.models.bench = benchGeometry;

        } catch (error) {
            console.error('Error creating models:', error);
        }
    }

    initializeMap() {
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [121.0509, 14.5508],
            zoom: 20.5,
            pitch: 80,
            bearing: 0,
            antialias: true,
            interactive: false,
            maxPitch: 85
        });

        this.map.on('style.load', () => {
            // Remove any existing building layers
            if (this.map.getLayer('3d-buildings-windows')) this.map.removeLayer('3d-buildings-windows');
            if (this.map.getLayer('3d-buildings-base')) this.map.removeLayer('3d-buildings-base');
            if (this.map.getLayer('3d-buildings')) this.map.removeLayer('3d-buildings');

            // Add clean buildings with street style
            this.map.addLayer({
                'id': '3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 15,
                'paint': {
                    'fill-extrusion-color': '#D3D3D3',  // Light gray for buildings
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 1,
                    'fill-extrusion-vertical-gradient': true,
                    'fill-extrusion-ambient-occlusion-intensity': 0.3,
                    'fill-extrusion-ambient-occlusion-radius': 3
                }
            });

            // Add custom 3D objects
            this.add3DObjects();

            // Adjust lighting for clear visibility
            this.map.setLight({
                anchor: 'viewport',
                color: '#ffffff',
                intensity: 0.85,  // Increased for better visibility without fog
                position: [1.5, 90, 80]
            });

            // Add sky layer with high visibility
            this.map.addLayer({
                'id': 'sky',
                'type': 'sky',
                'paint': {
                    'sky-type': 'atmosphere',
                    'sky-atmosphere-sun': [0, 90],
                    'sky-atmosphere-sun-intensity': 5,
                    'sky-opacity': 0.5  // Reduced opacity for clearer view
                }
            });
        });
    }

    add3DObjects() {
        // Get vegetation and landuse data from Mapbox
        const features = this.map.querySourceFeatures('composite', {
            sourceLayer: ['landuse', 'vegetation']
        });

        // Add trees and grass in appropriate areas
        features.forEach((feature, index) => {
            if (feature.properties.class === 'park' || 
                feature.properties.class === 'grass' || 
                feature.properties.class === 'garden') {
                
                // Add trees with varied sizes and rotations
                if (this.models.tree && index % 3 === 0) {
                    const tree = this.models.tree.clone();
                    const scale = 0.4 + Math.random() * 0.2; // Random size variation
                    const randomOffset = {
                        x: (Math.random() - 0.5) * 0.0002,
                        y: (Math.random() - 0.5) * 0.0002
                    };
                    tree.position.set(
                        feature.geometry.coordinates[0] + randomOffset.x,
                        feature.geometry.coordinates[1] + randomOffset.y,
                        0
                    );
                    tree.scale.set(scale, scale, scale);
                    tree.rotation.y = Math.random() * Math.PI * 2; // Random rotation
                    this.scene.add(tree);
                }

                // Add grass patches with varied density
                if (this.models.grass && index % 2 === 0) {
                    const grassPatch = this.models.grass.clone();
                    const randomOffset = {
                        x: (Math.random() - 0.5) * 0.0002,
                        y: (Math.random() - 0.5) * 0.0002
                    };
                    grassPatch.position.set(
                        feature.geometry.coordinates[0] + randomOffset.x,
                        feature.geometry.coordinates[1] + randomOffset.y,
                        0
                    );
                    grassPatch.scale.set(0.3, 0.3, 0.3);
                    grassPatch.rotation.y = Math.random() * Math.PI * 2;
                    this.scene.add(grassPatch);
                }

                // Add benches in parks
                if (this.models.bench && index % 10 === 0) {
                    const bench = this.models.bench.clone();
                    const randomOffset = {
                        x: (Math.random() - 0.5) * 0.0002,
                        y: (Math.random() - 0.5) * 0.0002
                    };
                    bench.position.set(
                        feature.geometry.coordinates[0] + randomOffset.x,
                        feature.geometry.coordinates[1] + randomOffset.y,
                        0
                    );
                    bench.scale.set(0.3, 0.3, 0.3);
                    bench.rotation.y = Math.random() * Math.PI * 2;
                    this.scene.add(bench);
                }
            }
        });

        // Add street lights along roads
        const roadFeatures = this.map.querySourceFeatures('composite', {
            sourceLayer: 'road'
        });

        roadFeatures.forEach((feature, index) => {
            if (index % 15 === 0) { // Space out the street lights
                const streetLight = new THREE.Group();
                
                // Light pole
                const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
                const poleMaterial = new THREE.MeshStandardMaterial({
                    color: 0x404040,
                    roughness: 0.7,
                    metalness: 0.5
                });
                const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                pole.castShadow = true;
                
                // Light fixture
                const fixtureGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
                const fixtureMaterial = new THREE.MeshStandardMaterial({
                    color: 0x404040,
                    roughness: 0.7,
                    metalness: 0.5
                });
                const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
                fixture.position.y = 1.5;
                
                // Light source
                const light = new THREE.PointLight(0xffffcc, 0.5, 10);
                light.position.y = 1.5;
                
                streetLight.add(pole);
                streetLight.add(fixture);
                streetLight.add(light);
                
                // Position along the road
                streetLight.position.set(
                    feature.geometry.coordinates[0],
                    feature.geometry.coordinates[1],
                    0
                );
                streetLight.scale.set(0.5, 0.5, 0.5);
                
                this.scene.add(streetLight);
            }
        });
    }

    initializeThreeJS() {
        this.scene = new THREE.Scene();
        
        // Clean, neutral lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 2, 1);
        directionalLight.castShadow = true;
        
        // Improve shadow quality
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.bias = -0.001;
        
        this.scene.add(directionalLight);

        // Add subtle hemisphere light for ambient occlusion effect
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        // Third-person camera settings
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        this.camera.position.set(0, 1.7, 2);
        this.camera.lookAt(0, 1.7, 0);
        
        // Initialize renderer with improved settings
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            alpha: true,
            antialias: true,
            logarithmicDepthBuffer: true
        });
        
        // Enable high-quality shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Add player model
        this.addPlayerModel();

        // Handle window resizing
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(width, height);
        });
    }

    addPlayerModel() {
        // Add car model as player
        this.playerModel = this.models.car.clone();
        this.playerModel.scale.set(0.5, 0.5, 0.5);
        this.scene.add(this.playerModel);
    }

    setupEventListeners() {
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body) {
                this.playerState.rotation += e.movementX * 0.1;
            }
        });

        document.addEventListener('click', () => {
            if (document.pointerLockElement !== document.body) {
                document.body.requestPointerLock();
            } else {
                this.shoot();
            }
        });

        document.addEventListener('keydown', (e) => this.updateControls(e.code, true));
        document.addEventListener('keyup', (e) => this.updateControls(e.code, false));

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    updateControls(code, pressed) {
        switch(code) {
            case 'KeyW': this.controls.forward = pressed; break;
            case 'KeyS': this.controls.backward = pressed; break;
            case 'KeyA': this.controls.left = pressed; break;
            case 'KeyD': this.controls.right = pressed; break;
            case 'ShiftLeft': this.controls.boost = pressed; break;
            case 'Space': this.controls.shoot = pressed; break;
        }
    }

    shoot() {
        const now = Date.now();
        if (this.playerState.ammo > 0 && now > this.playerState.weaponCooldown) {
            this.playerState.ammo--;
            this.playerState.weaponCooldown = now + this.playerState.weaponCooldownTime;
            
            // Create projectile
            const projectile = this.models.projectile.clone();
            const angle = this.playerState.rotation * Math.PI / 180;
            
            // Position projectile at car's weapon barrel
            projectile.position.set(
                this.playerModel.position.x + Math.sin(angle) * 2,
                this.playerModel.position.y + 0.7,
                this.playerModel.position.z + Math.cos(angle) * 2
            );
            
            // Add velocity and lifetime to projectile
            projectile.userData.velocity = {
                x: Math.sin(angle) * 0.5,
                z: Math.cos(angle) * 0.5
            };
            projectile.userData.lifetime = now + 2000; // 2 seconds
            
            this.gameState.projectiles.push(projectile);
            this.scene.add(projectile);
            
            // Update UI
            document.getElementById('ammo').textContent = 
                `${this.playerState.ammo}/${this.playerState.reserveAmmo}`;
        }
    }

    updatePlayerPosition() {
        // Update speed based on controls
        if (this.controls.forward) {
            this.playerState.speed = Math.min(
                this.playerState.speed + this.playerState.acceleration * (this.controls.boost ? 2 : 1),
                this.playerState.maxSpeed * (this.controls.boost ? 1.5 : 1)
            );
        } else if (this.controls.backward) {
            this.playerState.speed = Math.max(
                this.playerState.speed - this.playerState.acceleration,
                -this.playerState.maxSpeed * 0.5
            );
        } else {
            // Apply deceleration
            if (Math.abs(this.playerState.speed) < this.playerState.deceleration) {
                this.playerState.speed = 0;
            } else {
                this.playerState.speed -= Math.sign(this.playerState.speed) * this.playerState.deceleration;
            }
        }

        // Update rotation
        if (this.controls.left) {
            this.playerState.rotation += this.playerState.turnSpeed * (Math.abs(this.playerState.speed) / this.playerState.maxSpeed);
        }
        if (this.controls.right) {
            this.playerState.rotation -= this.playerState.turnSpeed * (Math.abs(this.playerState.speed) / this.playerState.maxSpeed);
        }

        // Update position based on speed and rotation
        const angle = this.playerState.rotation * Math.PI / 180;
        this.playerState.position[0] += Math.sin(angle) * this.playerState.speed;
        this.playerState.position[1] += Math.cos(angle) * this.playerState.speed;

        // Update car model position and rotation
        if (this.playerModel) {
            this.playerModel.position.x = 0;
            this.playerModel.position.z = 0;
            this.playerModel.rotation.y = angle;
            
            // Add vehicle tilt based on turning
            const tiltAmount = 0.1;
            if (this.controls.left && this.playerState.speed !== 0) {
                this.playerModel.rotation.z = -tiltAmount; // Inverted tilt for correct lean
            } else if (this.controls.right && this.playerState.speed !== 0) {
                this.playerModel.rotation.z = tiltAmount; // Inverted tilt for correct lean
            } else {
                this.playerModel.rotation.z = 0;
            }

            // Update wheel rotations
            this.playerModel.children.forEach(child => {
                if (child.geometry instanceof THREE.CylinderGeometry && 
                    child.geometry.parameters.radiusTop === 0.4) { // Check if it's a wheel
                    
                    // Reset wheel rotation
                    child.rotation.z = Math.PI / 2;
                    
                    // Add steering rotation
                    if (this.controls.left && this.playerState.speed !== 0) {
                        // Front wheels only (first two wheels)
                        if (child.position.z < 0) {
                            child.rotation.y = -0.3; // Turn wheels left
                        }
                    } else if (this.controls.right && this.playerState.speed !== 0) {
                        // Front wheels only
                        if (child.position.z < 0) {
                            child.rotation.y = 0.3; // Turn wheels right
                        }
                    } else {
                        child.rotation.y = 0; // Wheels straight
                    }
                    
                    // Add rolling animation based on speed
                    child.rotation.x += this.playerState.speed * 100;
                }
            });
        }
    }

    updateProjectiles() {
        const now = Date.now();
        
        // Update projectile positions and remove expired ones
        this.gameState.projectiles = this.gameState.projectiles.filter(projectile => {
            if (now > projectile.userData.lifetime) {
                this.scene.remove(projectile);
                return false;
            }
            
            projectile.position.x += projectile.userData.velocity.x;
            projectile.position.z += projectile.userData.velocity.z;
            
            return true;
        });
    }

    updateCamera() {
        // Calculate camera position based on car position and rotation
        const distance = 8;  // Reduced distance for closer view
        const height = 3;    // Lower height for more street-level view
        const angle = this.playerState.rotation * Math.PI / 180;
        
        const cameraX = this.playerModel.position.x - Math.sin(angle) * distance;
        const cameraY = height;
        const cameraZ = this.playerModel.position.z - Math.cos(angle) * distance;
        
        this.camera.position.set(cameraX, cameraY, cameraZ);
        this.camera.lookAt(
            this.playerModel.position.x,
            this.playerModel.position.y + 0.5, // Look slightly above the car
            this.playerModel.position.z
        );
    }

    startGameLoop() {
        const gameLoop = () => {
            requestAnimationFrame(gameLoop);
            
            // Update game state
            this.updatePlayerPosition();
            this.updateProjectiles();
            
            // Update map and camera
            this.map.setCenter(this.playerState.position);
            this.map.setBearing(this.playerState.rotation);
            this.map.setPitch(80); // Higher pitch to see more horizon
            
            // Update camera
            this.updateCamera();

            // Render scene
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }

            // Update UI
            document.getElementById('health').textContent = `HP: ${this.playerState.health}`;
            document.getElementById('ammo').textContent = 
                `${this.playerState.ammo}/${this.playerState.reserveAmmo}`;
            
            // Update location display
            this.updateLocationDisplay();
        };

        gameLoop();
    }

    async updateLocationDisplay() {
        if (Date.now() - (this._lastLocationUpdate || 0) > 1000) {
            try {
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${this.playerState.position[0]},${this.playerState.position[1]}.json?access_token=${mapboxgl.accessToken}`
                );
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                    document.getElementById('location').textContent = data.features[0].place_name;
                }
                this._lastLocationUpdate = Date.now();
            } catch (error) {
                console.error('Error updating location:', error);
            }
        }
    }
}

window.onload = () => {
    const game = new WorldFPS();
};
