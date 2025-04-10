import { VEHICLES } from './vehicles.js';

export class VehicleSelect {
    constructor(onVehicleSelect) {
        this.selectedVehicle = null;
        this.onVehicleSelect = onVehicleSelect;
        this.container = document.querySelector('#vehicle-select .vehicle-grid');
        this.startButton = document.getElementById('start-game');
        
        if (!this.container || !this.startButton) {
            console.error('Required DOM elements not found');
            return;
        }
        
        // Initialize UI
        this.initializeUI();
        
        // Add event listener to start button
        this.startButton.addEventListener('click', () => this.handleStartGame());
    }

    initializeUI() {
        if (!this.container) return;
        
        // Clear existing content
        this.container.innerHTML = '';
        
        // Create vehicle cards
        Object.entries(VEHICLES).forEach(([id, vehicle]) => {
            const card = this.createVehicleCard(id, vehicle);
            this.container.appendChild(card);
        });
        
        // Initially disable start button
        if (this.startButton) {
            this.startButton.disabled = true;
        }

        // Show vehicle select screen
        const vehicleSelect = document.getElementById('vehicle-select');
        if (vehicleSelect) {
            vehicleSelect.style.display = 'flex';
        }

        // Hide game container initially
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
    }

    createVehicleCard(id, vehicle) {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.dataset.vehicleId = id;
        
        card.innerHTML = `
            <h3>${vehicle.name}</h3>
            <div class="vehicle-info">
                <p class="vehicle-type">${vehicle.type}</p>
                <p class="vehicle-description">${vehicle.description}</p>
                <div class="vehicle-stats">
                    <div class="stat">Health: ${vehicle.health}</div>
                    <div class="stat">Speed: ${Math.round(vehicle.maxSpeed * 360)} km/h</div>
                    <div class="stat">Weapon: ${vehicle.weaponType}</div>
                </div>
                <div class="damage-states">
                    <h4 class="damage-state-title">Damage States:</h4>
                    <div class="damage-state-item pristine">Pristine (${vehicle.damageStates.pristine.max}-${vehicle.damageStates.pristine.min} HP)</div>
                    <div class="damage-state-item scratched">Scratched (${vehicle.damageStates.scratched.max}-${vehicle.damageStates.scratched.min} HP)</div>
                    <div class="damage-state-item wrecked">Wrecked (${vehicle.damageStates.wrecked.max}-${vehicle.damageStates.wrecked.min} HP)</div>
                    <div class="damage-state-item critical">Critical (${vehicle.damageStates.critical.max}-${vehicle.damageStates.critical.min} HP)</div>
                </div>
            </div>
        `;
        
        // Add click handler
        card.addEventListener('click', () => this.selectVehicle(id));
        
        return card;
    }

    selectVehicle(vehicleId) {
        if (!this.container || !this.startButton) return;
        
        // Remove previous selection
        const previousSelection = this.container.querySelector('.vehicle-card.selected');
        if (previousSelection) {
            previousSelection.classList.remove('selected');
        }
        
        // Add selection to clicked card
        const selectedCard = this.container.querySelector(`[data-vehicle-id="${vehicleId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            this.selectedVehicle = vehicleId;
            this.startButton.disabled = false;
            
            // Log selection for debugging
            console.log('Selected vehicle:', VEHICLES[vehicleId]);
        }
    }

    handleStartGame() {
        if (!this.selectedVehicle) {
            console.error('No vehicle selected');
            return;
        }

        // Hide vehicle selection
        const vehicleSelect = document.getElementById('vehicle-select');
        if (vehicleSelect) {
            vehicleSelect.style.display = 'none';
        }

        // Show game container immediately
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'block';
        }

        // Create a properly initialized vehicle data object
        const vehicleData = VEHICLES[this.selectedVehicle];
        const selectedVehicleData = {
            id: this.selectedVehicle,
            name: vehicleData.name,
            type: vehicleData.type,
            description: vehicleData.description,
            health: vehicleData.health,
            maxSpeed: vehicleData.maxSpeed,
            acceleration: vehicleData.acceleration,
            deceleration: vehicleData.deceleration,
            turnSpeed: vehicleData.turnSpeed,
            weaponType: vehicleData.weaponType,
            damage: vehicleData.damage,
            projectileSpeed: vehicleData.projectileSpeed,
            range: vehicleData.range,
            cooldown: vehicleData.cooldown,
            damageStates: vehicleData.damageStates
        };

        console.log('Starting game with vehicle:', selectedVehicleData);
        this.onVehicleSelect(selectedVehicleData);
    }
} 