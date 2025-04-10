# Battle Horizon

A multiplayer vehicle combat game set in a real-world map environment.

## Project Structure

```
battleHorizon/
├── client/
│   └── world-fps/
│       ├── src/
│       │   └── game/
│       │       ├── core/
│       │       │   └── Game.js         # Main game logic
│       │       ├── vehicles/
│       │       │   └── vehicles.js     # Vehicle definitions and stats
│       │       ├── ui/
│       │       │   └── VehicleSelect.js # Vehicle selection screen
│       │       └── utils/
│       │           └── helpers.js      # Utility functions
│       ├── assets/
│       │   ├── models/                 # 3D models
│       │   └── textures/               # Textures and materials
│       ├── styles/
│       │   └── styles.css             # Global styles
│       └── index.html                 # Main entry point
├── server/
│   ├── src/
│   │   ├── rooms/                    # Multiplayer room logic
│   │   └── index.ts                  # Server entry point
│   └── package.json
└── package.json

```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/battleHorizon.git
cd battleHorizon
```

2. Install dependencies for both client and server:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
```

### Running the Game

1. Start the game server (handles multiplayer):
```bash
cd server
npm run dev
```
The server will start on `ws://localhost:2567`

2. In a new terminal, start the client server:
```bash
cd client/world-fps
npx http-server -p 8080
```
The client will be available at `http://localhost:8080`

3. Open your browser and navigate to `http://localhost:8080`

## Gameplay

1. Select your vehicle from four unique options:
   - **Razorback**: Fast muscle car with dual cannons
   - **Ironclad**: Heavy armored truck with mortar
   - **Scorpion**: Agile motorcycle with rocket launcher
   - **Junkyard King**: Modified van with flamethrower

2. Controls:
   - WASD or Arrow Keys: Movement
   - Mouse: Aim
   - Left Click: Shoot
   - Space: Drift (when above 50% max speed)
   - Shift: Boost (when available)

## Development Stack

- Three.js for 3D rendering
- Mapbox for real-world environment
- Colyseus for multiplayer functionality

## Development Phases

### Phase 1: Core Vehicle Mechanics
- [x] Project structure setup
- [x] Vehicle model import (Razorback)
- [x] Basic textures applied
- [x] Movement system (acceleration, turning, suspension)
- [ ] Physics setup (gravity, friction, collisions)
- [ ] Vehicle damage states and explosion
- [x] Weapon system (Dual Cannons, projectile firing)
- [ ] Power-up system (Health, Speed, Overcharge)
- [ ] Resupply system (ammo refill with cooldown)
- [ ] Day/Night system (24-hour cycle, lighting, headlights)
- [ ] Weather system (Clear, Rain, Fog, Storm)

### Phase 2: Map Integration
- [x] Manila rendered with 3D terrain and buildings
- [x] Camera synced to vehicle position
- [x] Teleport system (text input and location jump)
- [ ] Minimap with player, power-ups, resupply points
- [ ] Power-up placement on roads (spatial logic)
- [ ] Resupply point placement via real POIs
- [ ] Lighting sync with local time (Mapbox)
- [ ] Real-world weather visual overlays

### Phase 3: Multiplayer Functionality
- [x] Server setup with real-time sync
- [x] Vehicle movement synchronization
- [x] Weapon fire and health sync
- [ ] Lobby system with disconnect handling
- [ ] Power-up sync (spawn, pickup, effects)
- [ ] Resupply sync (usage and cooldown)
- [ ] Synchronized day/night across all players
- [ ] Synchronized weather and effects

### Phase 4: UI & Polish
- [ ] Minimap enhancements (zoom, drag, markers)
- [x] Teleport UI with autocomplete
- [x] Weapon cooldown bar (color-coded)
- [ ] Power-up popup and timers
- [ ] Resupply ammo bar and proximity alert
- [ ] Day/Night clock, headlight toggle
- [ ] Weather icon and visibility bar
- [ ] Visual effects (explosions, sparks, weather)
- [x] Add vehicles: Ironclad, Scorpion, Junkyard King

### Phase 5: Expansion & Optimization
- [ ] Add new vehicles: Tank, Drone
- [ ] New power-ups: Shield Boost, Trap Drop
- [ ] Expand resupply types and POIs
- [ ] Add Snow and Heatwave weather types
- [ ] Night-only power-ups and seasonal day/night
- [ ] Add cities: New York, London, Sydney
- [ ] Level-of-detail optimization
- [ ] Cap physics/network load, despawn idle pickups
- [ ] Cache map data, reduce weather API calls
- [ ] 8-player stress test with all systems active
- [ ] Final balancing and iteration from playtests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
