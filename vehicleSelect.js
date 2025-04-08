import { VEHICLES } from './vehicles.js';

export class VehicleSelect {
    constructor(onVehicleSelect) {
        this.onVehicleSelect = onVehicleSelect;
        this.createUI();
    }

    createUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'vehicle-select';
        document.body.appendChild(this.container);

        // Create title
        const title = document.createElement('h1');
        title.textContent = 'Select Your Vehicle';
        this.container.appendChild(title);

        // Create vehicle grid
        const grid = document.createElement('div');
        grid.className = 'vehicle-grid';
        this.container.appendChild(grid);

        // Create vehicle cards
        Object.values(VEHICLES).forEach(vehicle => {
            const card = this.createVehicleCard(vehicle);
            grid.appendChild(card);
        });

        // Add styles
        this.addStyles();
    }

    createVehicleCard(vehicle) {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.innerHTML = `
            <h2>${vehicle.name}</h2>
            <div class="vehicle-type">${vehicle.type}</div>
            <div class="vehicle-preview" style="background-color: #${vehicle.model.color.toString(16)}"></div>
            <div class="vehicle-stats">
                <div class="stat">
                    <span>Speed:</span>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width: ${(vehicle.stats.maxSpeed * 3.6) / 2.2}%"></div>
                    </div>
                </div>
                <div class="stat">
                    <span>Health:</span>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width: ${(vehicle.stats.health / 1.5)}%"></div>
                    </div>
                </div>
                <div class="stat">
                    <span>Handling:</span>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width: ${vehicle.stats.grip * 100}%"></div>
                    </div>
                </div>
            </div>
            <div class="vehicle-weapons">
                <h3>Weapon: ${vehicle.weapon.type}</h3>
                <p>Damage: ${vehicle.weapon.damage}${vehicle.weapon.count ? ' x' + vehicle.weapon.count : ''}</p>
                <p>Cooldown: ${vehicle.weapon.cooldown / 1000}s</p>
            </div>
            <div class="vehicle-ability">
                <h3>Special Ability: ${vehicle.ability.type}</h3>
                <p>${this.getAbilityDescription(vehicle.ability)}</p>
            </div>
            <button class="select-btn">Select ${vehicle.name}</button>
        `;

        card.querySelector('.select-btn').addEventListener('click', () => {
            this.onVehicleSelect(vehicle);
            this.container.remove();
        });

        return card;
    }

    getAbilityDescription(ability) {
        switch (ability.type) {
            case 'NitroBoost':
                return `${ability.effect.speedMultiplier * 100 - 100}% speed boost for ${ability.effect.duration / 1000}s`;
            case 'Shield':
                return `${ability.effect.damageReduction * 100}% damage reduction for ${ability.effect.duration / 1000}s`;
            case 'Wheelie':
                return `${ability.effect.jumpHeight}m jump for ${ability.effect.duration / 1000}s`;
            case 'OilSlick':
                return `${ability.effect.slowFactor * 100}% slow for ${ability.effect.duration / 1000}s`;
            default:
                return '';
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .vehicle-select {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 2rem;
                color: white;
                z-index: 1000;
            }

            .vehicle-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                max-width: 1400px;
                width: 100%;
                margin-top: 2rem;
            }

            .vehicle-card {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 1.5rem;
                display: flex;
                flex-direction: column;
                gap: 1rem;
                transition: transform 0.2s;
            }

            .vehicle-card:hover {
                transform: scale(1.02);
            }

            .vehicle-preview {
                height: 150px;
                border-radius: 5px;
                margin: 1rem 0;
            }

            .vehicle-type {
                color: #888;
                font-style: italic;
            }

            .stat {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin: 0.5rem 0;
            }

            .stat-bar {
                flex-grow: 1;
                height: 10px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
                overflow: hidden;
            }

            .stat-fill {
                height: 100%;
                background: #4CAF50;
                border-radius: 5px;
            }

            .select-btn {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 1rem;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1.1rem;
                margin-top: auto;
                transition: background 0.2s;
            }

            .select-btn:hover {
                background: #45a049;
            }

            h2 {
                margin: 0;
                color: #4CAF50;
            }

            h3 {
                margin: 0.5rem 0;
                color: #4CAF50;
            }

            p {
                margin: 0.25rem 0;
                color: #ccc;
            }
        `;
        document.head.appendChild(style);
    }
} 