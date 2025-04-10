import { VEHICLES } from '../vehicles/vehicles.js';

export class VehicleSelect {
    constructor(onVehicleSelect) {
        this.onVehicleSelect = onVehicleSelect;
        this.selectedVehicle = null;
        this.styleElement = null;
        
        // Hide game container initially
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
        
        this.createUI();
    }

    createUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'vehicle-select';
        this.container.className = 'vehicle-select';
        document.body.appendChild(this.container);

        // Create title
        const title = document.createElement('h1');
        title.textContent = 'SELECT YOUR VEHICLE';
        this.container.appendChild(title);

        // Create vehicle grid
        const grid = document.createElement('div');
        grid.className = 'vehicle-grid';
        this.container.appendChild(grid);

        // Create vehicle cards in specific order
        const orderedVehicles = ['RAZORBACK', 'IRONCLAD', 'SCORPION', 'JUNKYARD_KING'];
        orderedVehicles.forEach(id => {
            const vehicle = VEHICLES[id];
            if (vehicle) {
                const card = this.createVehicleCard(id, vehicle);
                grid.appendChild(card);
            }
        });

        // Create start game button container for centering
        const startButtonContainer = document.createElement('div');
        startButtonContainer.className = 'start-button-container';
        
        // Create start game button
        this.startButton = document.createElement('button');
        this.startButton.className = 'start-game-btn';
        this.startButton.textContent = 'START GAME';
        this.startButton.disabled = true;
        this.startButton.addEventListener('click', () => {
            if (this.selectedVehicle) {
                this.startGame();
            }
        });
        
        startButtonContainer.appendChild(this.startButton);
        this.container.appendChild(startButtonContainer);

        // Add styles
        this.addStyles();
    }

    createVehicleCard(id, vehicle) {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.dataset.vehicleId = id;
        
        // Calculate normalized values for stat bars
        const speedPercentage = Math.round(vehicle.maxSpeed * 100);
        const healthPercentage = Math.round((vehicle.health / 150) * 100); // Normalized to max health (Ironclad's 150)
        
        card.innerHTML = `
            <div class="card-content">
                <h2>${vehicle.name}</h2>
                <div class="vehicle-type">${vehicle.type}</div>
                <div class="vehicle-description">${vehicle.description}</div>
                <div class="vehicle-stats">
                    <div class="stat">
                        <span>Speed:</span>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${speedPercentage}%"></div>
                        </div>
                        <span class="stat-value">${Math.round(speedPercentage)}%</span>
                    </div>
                    <div class="stat">
                        <span>Health:</span>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${healthPercentage}%"></div>
                        </div>
                        <span class="stat-value">${vehicle.health}</span>
                    </div>
                    <div class="weapon-stat">
                        <span>Weapon:</span>
                        <div class="weapon-info">${vehicle.weaponType}</div>
                    </div>
                </div>
            </div>
            <button class="select-btn">SELECT ${vehicle.name}</button>
        `;

        // Add click handler to the entire card
        card.addEventListener('click', () => this.selectVehicle(card, id, vehicle));

        return card;
    }

    selectVehicle(card, id, vehicle) {
        // Remove selection from other cards
        document.querySelectorAll('.vehicle-card').forEach(c => {
            c.classList.remove('selected');
            const btn = c.querySelector('.select-btn');
            if (btn) btn.classList.remove('selected');
        });
        
        // Add selection to this card
        card.classList.add('selected');
        const selectBtn = card.querySelector('.select-btn');
        if (selectBtn) selectBtn.classList.add('selected');
        
        // Update selected vehicle
        this.selectedVehicle = { id, ...vehicle };
        
        // Enable start button
        this.startButton.disabled = false;
        
        // Log selection for debugging
        console.log('Selected vehicle:', this.selectedVehicle);
    }

    cleanup() {
        try {
            // Remove the container
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
            
            // Remove the styles
            if (this.styleElement && this.styleElement.parentNode) {
                this.styleElement.parentNode.removeChild(this.styleElement);
            }

            // Remove any existing vehicle select elements (cleanup legacy elements)
            const existingSelect = document.getElementById('vehicle-select');
            if (existingSelect && existingSelect !== this.container) {
                existingSelect.parentNode.removeChild(existingSelect);
            }

            // Show game container
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.style.display = 'block';
                // Force a reflow to ensure the display change takes effect
                gameContainer.offsetHeight;
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    startGame() {
        if (this.selectedVehicle) {
            // Call onVehicleSelect first
            this.onVehicleSelect(this.selectedVehicle);
            
            // Then clean up the UI
            setTimeout(() => {
                this.cleanup();
            }, 0);
        }
    }

    addStyles() {
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = `
            .vehicle-select {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                flex-direction: column;
                align-items: center;
                color: white;
                z-index: 1000;
                overflow-y: auto;
                padding: 3rem;
                box-sizing: border-box;
            }

            h1 {
                margin: 0 0 3rem 0;
                color: white;
                text-align: center;
                font-size: 2.2rem;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 3px;
            }

            .vehicle-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(320px, 420px));
                gap: 4rem;
                max-width: 950px;
                width: 100%;
                margin: 0 auto;
                padding-bottom: 3rem;
            }

            .vehicle-card {
                background: rgba(30, 30, 30, 0.9);
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 2rem;
                min-height: 300px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }

            .vehicle-card:hover {
                transform: translateY(-5px);
                border-color: rgba(255, 255, 255, 0.3);
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
            }

            .vehicle-card.selected {
                border-color: #4CAF50;
                box-shadow: 0 0 32px rgba(76, 175, 80, 0.3);
            }

            .card-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 1.2rem;
            }

            .vehicle-card h2 {
                margin: 0;
                font-size: 1.8rem;
                color: #4CAF50;
            }

            .vehicle-type {
                font-size: 1rem;
                color: #888;
                margin-bottom: 0.5rem;
            }

            .vehicle-description {
                font-size: 1.1rem;
                line-height: 1.5;
                color: #ccc;
                margin-bottom: 1.5rem;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .vehicle-stats {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-top: 1rem;
            }

            .stat {
                display: grid;
                grid-template-columns: 70px 1fr 50px;
                align-items: center;
                gap: 1rem;
            }

            .stat-bar {
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
            }

            .stat-fill {
                height: 100%;
                background: #4CAF50;
                border-radius: 3px;
                transition: width 0.3s ease;
            }

            .stat-value {
                font-size: 1rem;
                color: #888;
                text-align: right;
            }

            .weapon-stat {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding-top: 1rem;
                margin-top: 0.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .weapon-info {
                font-size: 1.1rem;
                color: #4CAF50;
            }

            .select-btn {
                background: transparent;
                border: 2px solid #4CAF50;
                color: #4CAF50;
                padding: 1.2rem;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1.1rem;
                margin-top: 2rem;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 2px;
                width: 100%;
            }

            .select-btn:hover {
                background: #4CAF50;
                color: white;
            }

            .select-btn.selected {
                background: #4CAF50;
                color: white;
            }

            .start-button-container {
                margin-top: 3rem;
                margin-bottom: 3rem;
                width: 100%;
                max-width: 950px;
                display: flex;
                justify-content: center;
            }

            .start-game-btn {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 1.5rem 4rem;
                border-radius: 12px;
                font-size: 1.4rem;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 3px;
                min-width: 320px;
            }

            .start-game-btn:disabled {
                background: #666;
                cursor: not-allowed;
                opacity: 0.5;
            }

            .start-game-btn:not(:disabled):hover {
                background: #45a049;
                transform: translateY(-3px);
                box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
            }

            @media (max-width: 1024px) {
                .vehicle-grid {
                    grid-template-columns: repeat(2, minmax(280px, 380px));
                    gap: 3rem;
                    padding: 0 1.5rem;
                }

                .vehicle-card {
                    min-height: 280px;
                    padding: 1.5rem;
                }
            }

            @media (max-width: 768px) {
                .vehicle-select {
                    padding: 2rem;
                }

                .vehicle-grid {
                    grid-template-columns: 1fr;
                    gap: 2.5rem;
                    padding: 0 1rem;
                }

                h1 {
                    font-size: 1.8rem;
                    margin-bottom: 2rem;
                }

                .vehicle-card {
                    min-height: 260px;
                    padding: 1.5rem;
                }

                .vehicle-card h2 {
                    font-size: 1.6rem;
                }

                .start-game-btn {
                    padding: 1.2rem 3rem;
                    font-size: 1.2rem;
                    min-width: 280px;
                }
            }
        `;
        document.head.appendChild(this.styleElement);
    }
} 