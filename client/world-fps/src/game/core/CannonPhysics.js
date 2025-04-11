import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

export class CannonPhysics {
    constructor() {
        console.log('[DEBUG] Initializing CannonPhysics');
        
        // Initialize physics world
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });

        // Configure world for better performance
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 10;

        // Create ground plane
        const groundBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Plane()
        });
        
        // Rotate ground plane to be flat
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
        console.log('[DEBUG] Ground plane added to physics world');

        // Debug properties
        this.debugMode = false;
        this.debugBodies = [];
        
        // Store building bodies
        this.buildingBodies = new Map();
        
        console.log('[DEBUG] CannonPhysics initialized');
        
        // Add collision event listener
        this.world.addEventListener('beginContact', this.handleCollision.bind(this));

        this.debugger = null;
        this.bodies = new Map();
        this.meshes = new Map();
    }

    // Add a building to the physics world
    addBuilding(mesh, position, dimensions) {
        try {
            // Ensure mesh has updated matrices
            mesh.updateMatrixWorld(true);
            
            // Compute bounding box if not already computed
            if (!mesh.geometry.boundingBox) {
                mesh.geometry.computeBoundingBox();
            }

            // Get world position and bounding box
            const worldPosition = mesh.getWorldPosition(new THREE.Vector3());
            const worldScale = mesh.getWorldScale(new THREE.Vector3());
            const boundingBox = mesh.geometry.boundingBox.clone();
            
            // Log debug info
            console.log('Building Debug Info:', {
                worldPosition,
                worldScale,
                boundingBox,
                originalDimensions: dimensions,
                meshMatrix: mesh.matrix.elements,
                geometryVertices: mesh.geometry.attributes.position.count
            });

            // Check if we have valid bounding data
            if (!boundingBox || boundingBox.min.equals(boundingBox.max)) {
                console.warn('Invalid bounding box, falling back to Trimesh');
                return this.addBuildingTrimesh(mesh);
            }

            // Calculate world-space dimensions
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            size.multiply(worldScale);

            // Create physics body with correct dimensions
            const shape = new CANNON.Box(new CANNON.Vec3(
                Math.abs(size.x) / 2,
                Math.abs(size.y) / 2,
                Math.abs(size.z) / 2
            ));

            const body = new CANNON.Body({
                mass: 0,
                type: CANNON.Body.STATIC,
                shape: shape,
                position: new CANNON.Vec3(
                    worldPosition.x,
                    worldPosition.y + (size.y / 2), // Adjust Y to account for box center
                    worldPosition.z
                )
            });

            // Handle Mapbox Y-up to Z-up conversion
            const rotation = mesh.getWorldQuaternion(new THREE.Quaternion());
            body.quaternion.copy(rotation);

            // Add body to world
            this.world.addBody(body);
            
            // Store references
            this.bodies.set(mesh.uuid, body);
            this.meshes.set(body.id, mesh);

            return body;
        } catch (error) {
            console.error('Error adding building physics:', error);
            return null;
        }
    }

    addBuildingTrimesh(mesh) {
        try {
            // Get vertices from geometry
            const vertices = mesh.geometry.attributes.position.array;
            const indices = [];
            
            // Generate indices for triangles
            for (let i = 0; i < vertices.length / 3; i++) {
                indices.push(i);
            }

            // Create trimesh shape
            const shape = new CANNON.Trimesh(vertices, indices);
            
            // Create body
            const body = new CANNON.Body({
                mass: 0,
                type: CANNON.Body.STATIC,
                shape: shape
            });

            // Set world transform
            const worldPosition = mesh.getWorldPosition(new THREE.Vector3());
            const worldQuaternion = mesh.getWorldQuaternion(new THREE.Quaternion());
            
            body.position.copy(worldPosition);
            body.quaternion.copy(worldQuaternion);

            // Add to world
            this.world.addBody(body);
            
            // Store references
            this.bodies.set(mesh.uuid, body);
            this.meshes.set(body.id, mesh);

            return body;
        } catch (error) {
            console.error('Error adding building trimesh:', error);
            return null;
        }
    }

    // Handle collisions between objects
    handleCollision(event) {
        const bodyA = event.bodyA;
        const bodyB = event.bodyB;
        
        // Check if either body is a building
        const isBuildingCollision = 
            this.buildingBodies.has(bodyA.id) || 
            this.buildingBodies.has(bodyB.id);
            
        if (isBuildingCollision) {
            // Calculate collision force
            const contact = event.contact;
            const impactForce = contact.getImpactVelocityAlongNormal();
            
            // If impact force is significant, trigger effects
            if (Math.abs(impactForce) > 5) {
                // Emit collision event
                window.dispatchEvent(new CustomEvent('buildingCollision', {
                    detail: {
                        force: impactForce,
                        position: contact.bi.position,
                        normal: contact.ni
                    }
                }));
            }
        }
    }

    update(deltaTime) {
        // Step the physics world
        this.world.step(1/60, deltaTime, 3);
        if (this.debugger) {
            this.debugger.update();
        }
    }

    // Debug method to visualize physics bodies
    createDebugMesh(body) {
        console.log('[DEBUG] Creating debug mesh for body:', body.id);
        
        let mesh;
        
        try {
            if (body.shapes[0] instanceof CANNON.Plane) {
                mesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(1000, 1000),
                    new THREE.MeshBasicMaterial({
                        color: 0xffff00,
                        side: THREE.DoubleSide,
                        wireframe: true
                    })
                );
                console.log('[DEBUG] Created plane debug mesh');
            } else if (body.shapes[0] instanceof CANNON.Box) {
                const size = body.shapes[0].halfExtents;
                mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(size.x * 2, size.y * 2, size.z * 2),
                    new THREE.MeshBasicMaterial({
                        color: 0xff0000,
                        wireframe: true
                    })
                );
                console.log('[DEBUG] Created box debug mesh with dimensions:', {
                    width: size.x * 2,
                    height: size.y * 2,
                    depth: size.z * 2
                });
            }
        } catch (error) {
            console.error('[DEBUG] Error creating debug mesh:', error);
        }
        
        return mesh;
    }

    // Update debug meshes
    updateDebug() {
        if (this.debugger) {
            this.debugger.update();
        }
    }

    // Toggle debug visualization
    toggleDebug(scene) {
        console.log('[DEBUG] Toggling debug visualization');
        this.debugMode = !this.debugMode;
        
        if (this.debugMode) {
            console.log('[DEBUG] Debug mode enabled, creating debug meshes');
            // Create debug meshes for all bodies
            this.world.bodies.forEach(body => {
                const mesh = this.createDebugMesh(body);
                if (mesh) {
                    scene.add(mesh);
                    this.debugBodies.push({ body, mesh });
                }
            });
            console.log('[DEBUG] Created debug meshes for', this.debugBodies.length, 'bodies');
        } else {
            console.log('[DEBUG] Debug mode disabled, removing debug meshes');
            // Remove all debug meshes
            this.debugBodies.forEach(({ mesh }) => {
                scene.remove(mesh);
            });
            this.debugBodies = [];
        }

        if (!this.debugger) {
            console.log('Initializing physics debugger');
            this.debugger = new CannonDebugger(scene, this.world, {
                // Customize the debug wireframe appearance
                color: 0xff0000,
                scale: 1,
                onInit: (body, mesh) => {
                    console.log('Debug body created:', {
                        bodyId: body.id,
                        position: body.position,
                        quaternion: body.quaternion,
                        shape: body.shapes[0].type
                    });
                }
            });
        }
        this.debugger.enable();
    }
} 