// Vehicle class definitions and properties
export const VEHICLES = {
    RAZORBACK: {
        id: 'razorback',
        name: 'Razorback',
        type: 'Muscle Car',
        stats: {
            maxSpeed: 180 / 3.6, // Convert km/h to m/s
            health: 80,
            maxHealth: 80,
            acceleration: 0.000015,
            deceleration: 0.0000075,
            turnSpeed: 2.2,
            grip: 0.85
        },
        weapon: {
            type: 'DualCannons',
            damage: 20,
            count: 2,
            cooldown: 2000, // milliseconds
            range: 50,
            spread: 0.05
        },
        ability: {
            type: 'NitroBoost',
            effect: {
                speedMultiplier: 1.5,
                duration: 3000,
                cooldown: 15000
            }
        },
        model: {
            scale: 1.0,
            color: 0xff3300
        }
    },
    
    IRONCLAD: {
        id: 'ironclad',
        name: 'Ironclad',
        type: 'Armored Truck',
        stats: {
            maxSpeed: 120 / 3.6,
            health: 150,
            maxHealth: 150,
            acceleration: 0.000010,
            deceleration: 0.0000065,
            turnSpeed: 1.5,
            grip: 0.75
        },
        weapon: {
            type: 'HeavyMortar',
            damage: 50,
            splashRadius: 5,
            cooldown: 5000,
            range: 40,
            spread: 0.1
        },
        ability: {
            type: 'Shield',
            effect: {
                damageReduction: 0.75,
                duration: 5000,
                cooldown: 20000
            }
        },
        model: {
            scale: 1.2,
            color: 0x666666
        }
    },
    
    SCORPION: {
        id: 'scorpion',
        name: 'Scorpion',
        type: 'Sports Bike',
        stats: {
            maxSpeed: 220 / 3.6,
            health: 50,
            maxHealth: 50,
            acceleration: 0.000020,
            deceleration: 0.0000085,
            turnSpeed: 2.8,
            grip: 0.9
        },
        weapon: {
            type: 'RocketLauncher',
            damage: 30,
            cooldown: 3000,
            range: 60,
            spread: 0.03
        },
        ability: {
            type: 'Wheelie',
            effect: {
                jumpHeight: 2,
                duration: 1000,
                cooldown: 10000
            }
        },
        model: {
            scale: 0.8,
            color: 0x00ff00
        }
    },
    
    JUNKYARD_KING: {
        id: 'junkyard_king',
        name: 'Junkyard King',
        type: 'Modified Van',
        stats: {
            maxSpeed: 140 / 3.6,
            health: 100,
            maxHealth: 100,
            acceleration: 0.000012,
            deceleration: 0.0000070,
            turnSpeed: 1.8,
            grip: 0.8
        },
        weapon: {
            type: 'Flamethrower',
            damage: 10, // per second
            cooldown: 4000,
            range: 15,
            spread: 0.15
        },
        ability: {
            type: 'OilSlick',
            effect: {
                slowFactor: 0.5,
                duration: 5000,
                cooldown: 18000
            }
        },
        model: {
            scale: 1.1,
            color: 0x8B4513
        }
    }
};

// Power-up definitions
export const POWERUPS = {
    HEALTH: {
        type: 'health',
        color: 0x00ff00,
        effect: {
            health: 25
        },
        spawnChance: 0.5
    },
    SPEED: {
        type: 'speed',
        color: 0x0000ff,
        effect: {
            speedBoost: 0.3,
            duration: 10000
        },
        spawnChance: 0.3
    },
    WEAPON: {
        type: 'weapon',
        color: 0xff0000,
        effect: {
            cooldownReduction: 0.5,
            duration: 15000
        },
        spawnChance: 0.2
    },
    SHIELD: {
        type: 'shield',
        color: 0x800080,
        effect: {
            damageReduction: 0.5,
            duration: 8000
        },
        spawnChance: 0.15
    },
    TRAP: {
        type: 'trap',
        color: 0xffa500,
        effect: {
            damage: 20,
            duration: 20000
        },
        spawnChance: 0.1
    }
};

// Resupply station definitions
export const RESUPPLY = {
    STANDARD: {
        type: 'standard',
        effect: {
            ammoRefill: 1.0
        },
        cooldown: 30000,
        locationType: 'gas_station'
    },
    WEAPON: {
        type: 'weapon',
        effect: {
            damageBoost: 0.2,
            shots: 3
        },
        cooldown: 30000,
        locationType: 'hardware_store'
    }
}; 