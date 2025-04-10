// Physics system for Battle Horizon
import * as THREE from 'three';

export class PhysicsSystem {
    constructor() {
        // Physics constants
        this.gravity = -9.81;
        this.groundLevel = 0;
        this.airDensity = 1.225; // kg/m³
        this.groundFriction = 0.7;
        this.airResistance = 0.3;
        
        // Collision constants
        this.collisionElasticity = 0.3;
        this.collisionFriction = 0.5;
        
        // Vehicle physics state
        this.vehicleState = {
            velocity: new THREE.Vector3(),
            acceleration: new THREE.Vector3(),
            angularVelocity: new THREE.Vector3(),
            forces: new THREE.Vector3(),
            torque: new THREE.Vector3(),
            isGrounded: true,
            suspensionForces: [],
            lastUpdateTime: Date.now()
        };

        // Initialize empty vehicle object
        this.vehicle = null;
    }

    initializeVehicle(vehicleType, model) {
        if (!vehicleType || !model) {
            console.error('Vehicle type or model not provided');
            return;
        }

        // Store the model reference
        this.vehicleModel = model;
        
        // Reset vehicle state
        this.vehicleState = {
            position: new THREE.Vector3().copy(model.position),
            rotation: new THREE.Euler().copy(model.rotation),
            velocity: new THREE.Vector3(0, 0, 0),
            angularVelocity: new THREE.Vector3(0, 0, 0),
            acceleration: new THREE.Vector3(0, 0, 0),
            forces: new THREE.Vector3(0, 0, 0),
            torque: new THREE.Vector3(0, 0, 0)
        };

        // Set up vehicle characteristics based on type
        this.vehicleCharacteristics = {
            mass: 1500, // kg
            engineForce: 15000, // N
            brakingForce: 8000, // N
            maxSpeed: 30, // m/s
            turnRate: 2.0, // rad/s
            dragCoefficient: 0.3,
            rollingResistance: 0.015,
            wheelBase: 2.5, // meters
            trackWidth: 1.8, // meters
            groundClearance: 0.2 // meters
        };

        // Initialize suspension
        this.initializeSuspension(vehicleType);
        
        // Initialize wheels
        this.initializeWheels(model);
        
        console.log('Vehicle physics initialized:', {
            type: vehicleType,
            position: this.vehicleState.position,
            characteristics: this.vehicleCharacteristics
        });
    }

    resetVehicleState() {
        this.vehicleState = {
            velocity: new THREE.Vector3(),
            acceleration: new THREE.Vector3(),
            angularVelocity: new THREE.Vector3(),
            forces: new THREE.Vector3(),
            torque: new THREE.Vector3(),
            isGrounded: true,
            suspensionForces: [],
            lastUpdateTime: Date.now()
        };
    }

    getVehicleMass(type) {
        // Mass in kg
        switch(type) {
            case 'RAZORBACK': return 1600;
            case 'IRONCLAD': return 3500;
            case 'SCORPION': return 200;
            case 'JUNKYARD_KING': return 2200;
            default: 
                console.warn('Unknown vehicle type:', type);
                return 1500;
        }
    }

    getVehicleDimensions(model) {
        const bbox = new THREE.Box3().setFromObject(model);
        return {
            width: bbox.max.x - bbox.min.x,
            height: bbox.max.y - bbox.min.y,
            length: bbox.max.z - bbox.min.z
        };
    }

    calculateCenterOfMass(model) {
        // Calculate based on model geometry
        const bbox = new THREE.Box3().setFromObject(model);
        return new THREE.Vector3(
            (bbox.max.x + bbox.min.x) / 2,
            (bbox.max.y + bbox.min.y) / 2,
            (bbox.max.z + bbox.min.z) / 2
        );
    }

    calculateInertia(model) {
        const dims = this.getVehicleDimensions(model);
        const mass = this.vehicle.mass;
        
        // Approximate inertia tensor for a box
        return {
            x: (1/12) * mass * (dims.height * dims.height + dims.length * dims.length),
            y: (1/12) * mass * (dims.width * dims.width + dims.length * dims.length),
            z: (1/12) * mass * (dims.width * dims.width + dims.height * dims.height)
        };
    }

    initializeSuspension(vehicle) {
        if (!vehicle || !vehicle.id) {
            console.warn('Invalid vehicle data for suspension initialization');
            return this.getDefaultSuspension();
        }

        switch (vehicle.id) {
            case 'RAZORBACK':
                return {
                    stiffness: 80000,
                    damping: 4500,
                    maxTravel: 0.15,
                    restHeight: 0.5
                };
            case 'IRONCLAD':
                return {
                    stiffness: 100000,
                    damping: 6000,
                    maxTravel: 0.12,
                    restHeight: 0.6
                };
            case 'SCORPION':
                return {
                    stiffness: 70000,
                    damping: 4000,
                    maxTravel: 0.18,
                    restHeight: 0.45
                };
            case 'JUNKYARD_KING':
                return {
                    stiffness: 90000,
                    damping: 5000,
                    maxTravel: 0.14,
                    restHeight: 0.55
                };
            default:
                console.warn('Unknown vehicle type for suspension:', vehicle);
                return this.getDefaultSuspension();
        }
    }

    getDefaultSuspension() {
        return {
            stiffness: 80000,
            damping: 4500,
            maxTravel: 0.15,
            restHeight: 0.5
        };
    }

    initializeWheels(model) {
        // Get wheel references from model
        const wheels = [];
        
        // First try to get wheels from userData
        if (model.userData && model.userData.wheels) {
            Object.values(model.userData.wheels).forEach(wheel => {
                if (wheel && wheel.geometry) {
                    let radius = 0.5; // default radius
                    if (wheel.geometry instanceof THREE.CylinderGeometry) {
                        radius = wheel.geometry.parameters.radiusTop;
                    }
                    
                    wheels.push({
                        mesh: wheel,
                        radius: radius,
                        width: wheel.geometry.parameters.height || 0.2,
                        isGrounded: true,
                        angularVelocity: 0,
                        suspensionForce: 0
                    });
                }
            });
        }
        
        // If no wheels found in userData, try traversing the model
        if (wheels.length === 0) {
            model.traverse((child) => {
                if (child.name && child.name.includes('wheel')) {
                    let radius = 0.5; // default radius
                    if (child.geometry instanceof THREE.CylinderGeometry) {
                        radius = child.geometry.parameters.radiusTop;
                    }
                    
                    wheels.push({
                        mesh: child,
                        radius: radius,
                        width: child.geometry.parameters.height || 0.2,
                        isGrounded: true,
                        angularVelocity: 0,
                        suspensionForce: 0
                    });
                }
            });
        }
        
        // If still no wheels found, create default wheels
        if (wheels.length === 0) {
            console.warn('No wheels found in model or userData. Using default wheels.');
            // Add four default wheels
            for (let i = 0; i < 4; i++) {
                wheels.push({
                    mesh: null,
                    radius: 0.5,
                    width: 0.2,
                    isGrounded: true,
                    angularVelocity: 0,
                    suspensionForce: 0
                });
            }
        }
        
        console.log('Initialized wheels:', wheels.length, 'wheels found');
        return wheels;
    }

    update(deltaTime, controls) {
        if (!this.vehicleModel) return;

        // Update forces
        this.updateForces(deltaTime, controls);

        // Update velocity
        this.vehicleState.velocity.add(
            this.vehicleState.acceleration.clone().multiplyScalar(deltaTime)
        );

        // Update position
        const deltaPosition = this.vehicleState.velocity.clone().multiplyScalar(deltaTime);
        this.vehicleModel.position.add(deltaPosition);

        // Update rotation
        this.vehicleModel.rotation.y += this.vehicleState.angularVelocity.y * deltaTime;

        // Apply constraints
        this.applyConstraints();
    }

    updateForces(deltaTime, controls) {
        if (!this.vehicleModel) {
            console.warn('No vehicle model available for physics update');
            return;
        }

        // Get the vehicle's current orientation
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.vehicleModel.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.vehicleModel.quaternion);

        // Reset forces
        this.vehicleState.forces.set(0, 0, 0);
        this.vehicleState.torque.set(0, 0, 0);

        // Apply engine forces with increased values
        const engineForce = 50000; // Increased from 15000
        const brakingForce = 25000; // Increased from 8000

        if (controls.forward) {
            const force = forward.clone().multiplyScalar(-engineForce); // Negative for correct direction
            this.vehicleState.forces.add(force);
            console.log('Forward force applied:', force);
        }
        if (controls.backward) {
            const force = forward.clone().multiplyScalar(engineForce * 0.7); // Positive for correct direction
            this.vehicleState.forces.add(force);
            console.log('Backward force applied:', force);
        }

        // Apply turning forces with increased responsiveness
        const turnForce = 3.0; // Increased from 2.0
        if (controls.left) {
            this.vehicleState.angularVelocity.y = turnForce;
            console.log('Left turn applied');
        } else if (controls.right) {
            this.vehicleState.angularVelocity.y = -turnForce;
            console.log('Right turn applied');
        } else {
            // Gradually reduce angular velocity when not turning
            this.vehicleState.angularVelocity.y *= 0.9; // Increased decay from 0.95
        }

        // Apply gravity
        this.vehicleState.forces.y += this.gravity * 1500;

        // Apply drag force with reduced coefficient for better movement
        const velocity = this.vehicleState.velocity;
        const speed = velocity.length();
        if (speed > 0) {
            const dragCoefficient = 0.2; // Reduced from 0.3
            const dragForce = velocity.clone().normalize().multiplyScalar(-dragCoefficient * speed * speed);
            this.vehicleState.forces.add(dragForce);
        }

        // Update acceleration with vehicle mass
        const vehicleMass = 1500;
        this.vehicleState.acceleration.copy(this.vehicleState.forces).divideScalar(vehicleMass);

        // Log vehicle state for debugging
        if (controls.forward || controls.backward || controls.left || controls.right) {
            console.log('Vehicle State:', {
                velocity: this.vehicleState.velocity.toArray(),
                acceleration: this.vehicleState.acceleration.toArray(),
                angularVelocity: this.vehicleState.angularVelocity.toArray()
            });
        }
    }

    updateSuspension() {
        this.vehicle.wheels.forEach(wheel => {
            // Raycast to ground
            const rayStart = wheel.mesh.getWorldPosition(new THREE.Vector3());
            const rayEnd = rayStart.clone().add(new THREE.Vector3(0, -this.vehicle.suspension.maxTravel, 0));
            
            // Calculate suspension force
            const compression = Math.max(0, this.vehicle.suspension.maxTravel - (rayEnd.y - this.groundLevel));
            const springForce = compression * this.vehicle.suspension.stiffness;
            
            // Apply damping
            const relativeVelocity = this.vehicleState.velocity.y;
            const dampingForce = relativeVelocity * this.vehicle.suspension.damping;
            
            wheel.suspensionForce = Math.max(0, springForce + dampingForce);
            this.vehicleState.forces.y += wheel.suspensionForce;
        });
    }

    updateWheels(deltaTime) {
        this.vehicle.wheels.forEach(wheel => {
            // Update wheel rotation based on vehicle velocity
            const forwardSpeed = this.vehicleState.velocity.z;
            wheel.angularVelocity = forwardSpeed / wheel.radius;
            wheel.mesh.rotation.x += wheel.angularVelocity * deltaTime;
        });
    }

    applyConstraints() {
        // Keep vehicle above ground
        if (this.vehicleModel.position.y < 0.5) {
            this.vehicleModel.position.y = 0.5;
            this.vehicleState.velocity.y = Math.max(0, this.vehicleState.velocity.y);
        }

        // Limit maximum speed with increased limit
        const maxSpeed = 50; // Increased from 30
        const currentSpeed = this.vehicleState.velocity.length();
        if (currentSpeed > maxSpeed) {
            this.vehicleState.velocity.multiplyScalar(maxSpeed / currentSpeed);
        }

        // Add ground friction when vehicle is on ground
        if (this.vehicleModel.position.y <= 0.5) {
            const friction = 0.98; // Slight friction for better control
            this.vehicleState.velocity.x *= friction;
            this.vehicleState.velocity.z *= friction;
        }
    }

    // Collision detection and response
    handleCollision(otherObject) {
        // Calculate collision response
        const relativeVelocity = this.vehicleState.velocity.clone()
            .sub(otherObject.velocity || new THREE.Vector3());
        
        const collisionNormal = this.vehicle.centerOfMass.clone()
            .sub(otherObject.position)
            .normalize();
        
        const impulse = relativeVelocity.dot(collisionNormal) * (1 + this.collisionElasticity);
        
        // Apply impulse to both objects
        const totalMass = this.vehicle.mass + (otherObject.mass || Infinity);
        const thisImpulse = impulse * (otherObject.mass || totalMass) / totalMass;
        const otherImpulse = impulse * this.vehicle.mass / totalMass;
        
        this.vehicleState.velocity.sub(collisionNormal.multiplyScalar(thisImpulse));
        if (otherObject.velocity) {
            otherObject.velocity.add(collisionNormal.multiplyScalar(otherImpulse));
        }
    }
} 