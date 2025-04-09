export const VEHICLES = {
    RAZORBACK: {
        name: 'Razorback',
        type: 'Muscle Car',
        description: 'A sleek, aggressive car built for speed and precision strikes.',
        health: 80,
        maxSpeed: 0.5, // 180 km/h normalized
        acceleration: 0.015,
        deceleration: 0.008,
        turnSpeed: 3,
        weaponType: 'Dual Cannons',
        damage: 20,
        projectileSpeed: 0.5,
        range: 50,
        cooldown: 5000, // 5 seconds in milliseconds
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
        maxSpeed: 0.33, // 120 km/h normalized
        acceleration: 0.008,
        deceleration: 0.004,
        turnSpeed: 1.5,
        weaponType: 'Heavy Mortar',
        damage: 40,
        projectileSpeed: 0.4,
        range: 80,
        cooldown: 8000, // 8 seconds for slow firing rate
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
        description: 'A nimble, high-risk/high-reward bike for daring players.',
        health: 50,
        maxSpeed: 0.61, // 220 km/h normalized
        acceleration: 0.02,
        deceleration: 0.01,
        turnSpeed: 4,
        weaponType: 'Rocket Launcher',
        damage: 30,
        projectileSpeed: 0.6,
        range: 60,
        cooldown: 3000, // 3 seconds between rockets
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
        maxSpeed: 0.39, // 140 km/h normalized
        acceleration: 0.01,
        deceleration: 0.006,
        turnSpeed: 2,
        weaponType: 'Flamethrower',
        damage: 10, // damage per second
        projectileSpeed: 0.3,
        range: 15,
        cooldown: 1000, // 1-second burst
        rechargeCooldown: 4000, // 4-second recharge
        damageStates: {
            pristine: { min: 76, max: 100 },
            scratched: { min: 51, max: 75 },
            wrecked: { min: 26, max: 50 },
            critical: { min: 0, max: 25 }
        }
    }
}; 