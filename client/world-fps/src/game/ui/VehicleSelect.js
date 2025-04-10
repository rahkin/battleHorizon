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
                padding: 1rem;
                box-sizing: border-box;
            }

            h1 {
                margin: 0 0 1rem 0;
                color: white;
                text-align: center;
                font-size: 1.8rem;
                text-transform: uppercase;
                letter-spacing: 2px;
            }

            .vehicle-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(220px, 380px));
                gap: 2rem 3rem;
                width: 100%;
                max-width: 850px;
                margin: 0 auto 1rem auto;
            }

            .vehicle-card {
                background: rgba(40, 40, 40, 0.95);
                border: 1px solid rgba(76, 175, 80, 0.2);
                border-radius: 6px;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.6rem;
                transition: all 0.3s ease;
                height: 100%;
                min-height: 260px;
                cursor: pointer;
            }

            .card-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 0.6rem;
            }

            .vehicle-card.selected {
                border: 2px solid #4CAF50;
                background: rgba(76, 175, 80, 0.1);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
            }

            .vehicle-card:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
            }

            h2 {
                margin: 0;
                color: #4CAF50;
                font-size: 1.2rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .vehicle-type {
                color: #888;
                font-style: italic;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: -0.4rem;
            }

            .vehicle-description {
                color: #ccc;
                font-size: 0.8rem;
                line-height: 1.3;
                margin: 0.2rem 0;
                flex: 1;
                max-height: 2.6em;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }

            .vehicle-stats {
                background: rgba(0, 0, 0, 0.3);
                padding: 0.8rem;
                border-radius: 4px;
                display: flex;
                flex-direction: column;
                gap: 0.6rem;
                margin-top: auto;
            }

            .stat {
                display: grid;
                grid-template-columns: 50px 1fr 40px;
                align-items: center;
                gap: 0.6rem;
            }

            .stat span {
                color: #aaa;
                font-size: 0.8rem;
            }

            .stat-value {
                color: #4CAF50 !important;
                text-align: right;
                font-weight: bold;
                font-size: 0.8rem;
            }

            .stat-bar {
                height: 4px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
                overflow: hidden;
            }

            .stat-fill {
                height: 100%;
                background: #4CAF50;
                border-radius: 2px;
                transition: width 0.3s ease;
            }

            .weapon-stat {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 0.6rem;
                margin-top: 0.2rem;
            }

            .weapon-stat span {
                color: #aaa;
                font-size: 0.8rem;
            }

            .weapon-info {
                color: #ff9800;
                font-weight: bold;
                font-size: 0.85rem;
            }

            .select-btn {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 0.6rem;
                border-radius: 3px;
                cursor: pointer;
                font-size: 0.85rem;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
                transition: all 0.2s;
                width: 100%;
                margin-top: 0.4rem;
            }

            .select-btn:hover {
                background: #45a049;
            }

            .select-btn.selected {
                background: #388E3C;
                box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
            }

            .start-button-container {
                width: 100%;
                max-width: 850px;
                display: flex;
                justify-content: center;
                margin: 1rem 0;
            }

            .start-game-btn {
                background: #2196F3;
                color: white;
                border: none;
                padding: 0.8rem 2.5rem;
                border-radius: 3px;
                cursor: pointer;
                font-size: 1rem;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 2px;
                transition: all 0.3s ease;
            }

            .start-game-btn:disabled {
                background: #666;
                cursor: not-allowed;
                opacity: 0.7;
                transform: none;
                box-shadow: none;
            }

            .start-game-btn:not(:disabled) {
                animation: pulse 2s infinite;
            }

            .start-game-btn:not(:disabled):hover {
                background: #1976D2;
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
                animation: none;
            }

            @keyframes pulse {
                0% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4);
                }
                70% {
                    transform: scale(1.02);
                    box-shadow: 0 0 0 10px rgba(33, 150, 243, 0);
                }
                100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
                }
            }

            @media (max-width: 768px) {
                .vehicle-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                
                .vehicle-card {
                    min-height: 240px;
                }
                
                h1 {
                    font-size: 1.5rem;
                }
            }
        `;
        document.head.appendChild(this.styleElement);
    }
} 