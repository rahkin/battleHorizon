export const VEHICLES = {
    RAZORBACK: {
        name: 'Razorback',
        type: 'Muscle Car',
        description: 'A sleek, aggressive car built for speed and precision strikes.',
        health: 80,
        maxSpeed: 0.25, // Scaled down from 0.5
        acceleration: 0.0075, // Scaled down from 0.015
        deceleration: 0.004, // Scaled down from 0.008
        turnSpeed: 3,
        weaponType: 'Dual Cannons',
        damage: 20,
        projectileSpeed: 0.25, // Scaled down from 0.5
        range: 25, // Scaled down from 50
        cooldown: 5000,
        damageStates: {
            pristine: { min: 61, max: 80 },
            scratched: { min: 41, max: 60 },
            wrecked: { min: 21, max: 40 },
            critical: { min: 0, max: 20 }
        }
    },
    
    IRONCLAD: {
        name: 'Ironclad',
        type: 'Armored Truck',
        description: 'A hulking beast designed to take and dish out heavy punishment.',
        health: 150,
        maxSpeed: 0.165, // Scaled down from 0.33
        acceleration: 0.004, // Scaled down from 0.008
        deceleration: 0.002, // Scaled down from 0.004
        turnSpeed: 1.5,
        weaponType: 'Heavy Mortar',
        damage: 40,
        projectileSpeed: 0.2, // Scaled down from 0.4
        range: 40, // Scaled down from 80
        cooldown: 8000,
        damageStates: {
            pristine: { min: 113, max: 150 },
            scratched: { min: 76, max: 112 },
            wrecked: { min: 38, max: 75 },
            critical: { min: 0, max: 37 }
        }
    },
    
    SCORPION: {
        name: 'Scorpion',
        type: 'Sports Bike',
        description: 'A nimble, high-performance motorcycle built for extreme speed and agility.',
        health: 50,
        maxSpeed: 0.415, // Scaled down from 0.83
        acceleration: 0.015, // Scaled down from 0.03
        deceleration: 0.0075, // Scaled down from 0.015
        turnSpeed: 5,
        weaponType: 'Rocket Launcher',
        damage: 30,
        projectileSpeed: 0.35, // Scaled down from 0.7
        range: 30, // Scaled down from 60
        cooldown: 3000,
        damageStates: {
            pristine: { min: 38, max: 50 },
            scratched: { min: 26, max: 37 },
            wrecked: { min: 13, max: 25 },
            critical: { min: 0, max: 12 }
        }
    },
    
    JUNKYARD_KING: {
        name: 'Junkyard King',
        type: 'Modified Van',
        description: 'A scrappy, unconventional vehicle with trap-based combat.',
        health: 100,
        maxSpeed: 0.175, // Scaled down from 0.35
        acceleration: 0.004, // Scaled down from 0.008
        deceleration: 0.0025, // Scaled down from 0.005
        turnSpeed: 1.8,
        weaponType: 'Flamethrower',
        damage: 10,
        projectileSpeed: 0.15, // Scaled down from 0.3
        range: 7.5, // Scaled down from 15
        cooldown: 1000,
        rechargeCooldown: 4000,
        damageStates: {
            pristine: { min: 76, max: 100 },
            scratched: { min: 51, max: 75 },
            wrecked: { min: 26, max: 50 },
            critical: { min: 0, max: 25 }
        }
    }
}; 