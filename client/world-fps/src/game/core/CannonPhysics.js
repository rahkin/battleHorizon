import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class CannonPhysics {
    constructor() {
        // Initialize physics world
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.81, 0)
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

        // Debug properties
        this.debugMode = false;
        this.debugBodies = [];
    }

    update(deltaTime) {
        // Step the physics world
        this.world.step(1/60, deltaTime, 3);
    }

    // Debug method to visualize physics bodies
    createDebugMesh(body) {
        let mesh;
        
        if (body.shapes[0] instanceof CANNON.Plane) {
            mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(1000, 1000),
                new THREE.MeshBasicMaterial({
                    color: 0xffff00,
                    side: THREE.DoubleSide,
                    wireframe: true
                })
            );
        }
        
        if (mesh) {
            this.debugBodies.push({ body, mesh });
        }
        
        return mesh;
    }

    // Update debug meshes
    updateDebug() {
        if (!this.debugMode) return;
        
        this.debugBodies.forEach(({ body, mesh }) => {
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);
        });
    }

    // Toggle debug visualization
    toggleDebug(scene) {
        this.debugMode = !this.debugMode;
        
        if (this.debugMode) {
            // Create debug meshes for all bodies
            this.world.bodies.forEach(body => {
                const mesh = this.createDebugMesh(body);
                if (mesh) {
                    scene.add(mesh);
                }
            });
        } else {
            // Remove all debug meshes
            this.debugBodies.forEach(({ mesh }) => {
                scene.remove(mesh);
            });
            this.debugBodies = [];
        }
    }
} 