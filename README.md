# Battle Horizon - Development Roadmap

Battle Horizon is a 3rd-person, real-world, online car combat game. This README serves as a development checklist to track completed and pending features. It will later be replaced with a "How to Play" guide upon completion.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/battleHorizon.git
cd battleHorizon
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Running the Game
1. Start the development server:
```bash
# From the root directory
npm start
```

2. In a new terminal, start the client:
```bash
cd client
npm start
```

3. Open your browser and navigate to:
```
http://localhost:8080
```

Note: The game client runs in development mode by default. For production deployment, use `npm run build` to create an optimized build.

---

## ✅ Phase 1: Core Vehicle Mechanics

- [ ] Project structure setup
- [ ] Vehicle model import (Razorback)
- [ ] Basic textures applied
- [ ] Movement system (acceleration, turning, suspension)
- [ ] Physics setup (gravity, friction, collisions)
- [ ] Vehicle damage states and explosion
- [ ] Weapon system (Dual Cannons, projectile firing)
- [ ] Power-up system (Health, Speed, Overcharge)
- [ ] Resupply system (ammo refill with cooldown)
- [ ] Day/Night system (24-hour cycle, lighting, headlights)
- [ ] Weather system (Clear, Rain, Fog, Storm)

---

## 🗺️ Phase 2: Map Integration

- [ ] Manila rendered with 3D terrain and buildings
- [ ] Camera synced to vehicle position
- [ ] Teleport system (text input and location jump)
- [ ] Minimap with player, power-ups, resupply points
- [ ] Power-up placement on roads (spatial logic)
- [ ] Resupply point placement via real POIs
- [ ] Lighting sync with local time (Mapbox)
- [ ] Real-world weather visual overlays

---

## 🌐 Phase 3: Multiplayer Functionality

- [ ] Server setup with real-time sync
- [ ] Vehicle movement synchronization
- [ ] Cannon fire and health sync
- [ ] Lobby system with disconnect handling
- [ ] Power-up sync (spawn, pickup, effects)
- [ ] Resupply sync (usage and cooldown)
- [ ] Synchronized day/night across all players
- [ ] Synchronized weather and effects

---

## 🎨 Phase 4: UI & Polish

- [ ] Minimap enhancements (zoom, drag, markers)
- [ ] Teleport UI with autocomplete
- [ ] Weapon cooldown bar (color-coded)
- [ ] Power-up popup and timers
- [ ] Resupply ammo bar and proximity alert
- [ ] Day/Night clock, headlight toggle
- [ ] Weather icon and visibility bar
- [ ] Visual effects (explosions, sparks, weather)
- [ ] Add vehicles: Ironclad, Scorpion, Junkyard King

---

## 🚀 Phase 5: Expansion & Optimization

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

---

## Project Structure

```
battleHorizon/
├── assets/           # Game assets (models, textures, sounds)
├── client/          # Client-side game code
│   ├── world-fps/   # Main game client
│   ├── client.js    # Client networking code
│   └── index.html   # Client entry point
├── dev-client/      # Development client code
├── server/          # Server-side game logic
│   ├── src/         # Server source code
│   └── tsconfig.json # TypeScript configuration
├── src/             # Core engine code
│   ├── index.html   # Engine entry point
│   └── webpack.config.js # Build configuration
├── scripts/         # Build and deployment scripts
├── index.html       # Main entry point
├── package.json     # Project configuration
└── README.md        # This file
```

Stay tuned. Once development is complete, this README will be updated with a detailed guide on how to play Battle Horizon!
