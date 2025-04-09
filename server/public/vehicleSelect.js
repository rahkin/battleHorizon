import { VEHICLES } from './vehicles.js';

export class VehicleSelect {
    constructor(onVehicleSelect) {
        this.onVehicleSelect = onVehicleSelect;
        this.selectedVehicle = null;
        this.createVehicleSelectUI();
    }

    createVehicleSelectUI() {
        const container = document.createElement('div');
        container.id = 'vehicle-select';
        
        const title = document.createElement('h2');
        title.textContent = 'Select Your Vehicle';
        title.style.textAlign = 'center';
        title.style.color = '#fff';
        title.style.marginBottom = '2rem';
        
        const grid = document.createElement('div');
        grid.className = 'vehicle-grid';
        
        // Create vehicle cards
        Object.entries(VEHICLES).forEach(([id, vehicle]) => {
            const card = this.createVehicleCard(id, vehicle);
            grid.appendChild(card);
        });
        
        const startButton = document.createElement('button');
        startButton.id = 'start-game';
        startButton.textContent = 'Start Game';
        startButton.disabled = true;
        startButton.addEventListener('click', () => {
            if (this.selectedVehicle) {
                container.remove();
                this.onVehicleSelect(this.selectedVehicle);
            }
        });
        
        container.appendChild(title);
        container.appendChild(grid);
        container.appendChild(startButton);
        document.body.appendChild(container);
    }

    createVehicleCard(id, vehicle) {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        
        const header = document.createElement('div');
        header.className = 'vehicle-header';
        
        const name = document.createElement('h3');
        name.textContent = vehicle.name;
        
        const type = document.createElement('span');
        type.className = 'vehicle-type';
        type.textContent = vehicle.type;
        
        header.appendChild(name);
        header.appendChild(type);
        
        const description = document.createElement('p');
        description.className = 'vehicle-description';
        description.textContent = vehicle.description;
        
        const stats = document.createElement('div');
        stats.className = 'vehicle-stats';
        
        // Add vehicle stats
        const statItems = [
            { label: 'Health', value: vehicle.health },
            { label: 'Speed', value: vehicle.maxSpeed },
            { label: 'Weapon', value: vehicle.weaponType },
            { label: 'Damage', value: vehicle.damage }
        ];
        
        statItems.forEach(item => {
            const stat = document.createElement('div');
            stat.className = 'stat';
            
            const label = document.createElement('span');
            label.className = 'stat-label';
            label.textContent = item.label;
            
            const value = document.createElement('span');
            value.className = 'stat-value';
            value.textContent = item.value;
            
            stat.appendChild(label);
            stat.appendChild(value);
            stats.appendChild(stat);
        });
        
        card.appendChild(header);
        card.appendChild(description);
        card.appendChild(stats);
        
        // Add click handler
        card.addEventListener('click', () => {
            // Remove selection from other cards
            document.querySelectorAll('.vehicle-card').forEach(c => {
                c.classList.remove('selected');
            });
            
            // Select this card
            card.classList.add('selected');
            this.selectedVehicle = id;
            
            // Enable start button
            document.getElementById('start-game').disabled = false;
        });
        
        return card;
    }
} 