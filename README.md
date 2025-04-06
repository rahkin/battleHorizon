# FPS Game

A browser-based first-person shooter game built with PlayCanvas.

## Features

- First-person movement and shooting
- AI-controlled bots with patrolling, chasing, and attacking behaviors
- Health system with respawning
- Multiple game modes (Deathmatch, Team Deathmatch, Bomb Plant)
- Weapon system with ammo management
- HUD displaying health, ammo, scores, and game status

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gamedev
```

2. Install dependencies:
```bash
npm install
```

## Running the Game

1. Start the development server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:8080
```

## Controls

- WASD: Move
- Mouse: Look around
- Left Click: Shoot
- Space: Jump
- R: Reload
- R (when dead): Respawn

## Game Modes

### Deathmatch
- Free-for-all combat
- First to reach score limit wins

### Team Deathmatch
- Team-based combat
- Teams compete to reach score limit

### Bomb Plant
- One team plants the bomb
- Other team tries to defuse it
- Round ends when bomb explodes or is defused

## Project Structure

```
gamedev/
├── index.html          # Main HTML file
├── package.json        # Project configuration
├── README.md           # This file
└── scripts/            # Game scripts
    ├── playerController.js  # Player movement and controls
    ├── weapon.js       # Weapon system
    ├── health.js       # Health and damage system
    ├── gameManager.js  # Game state and modes
    └── botController.js # AI bot behavior
```

## Modifying the Game

### Adding New Features

1. Create a new script in the `scripts` directory
2. Add the script to `index.html`
3. Attach the script to relevant entities

### Adjusting Game Parameters

Most game parameters can be adjusted through the script attributes in `index.html`:

- Player speed and sensitivity
- Bot behavior (detection range, attack range, etc.)
- Weapon stats (damage, fire rate, etc.)
- Game mode settings (round time, score limit, etc.)

### Adding New Game Modes

1. Add the new mode to `gameManager.js`
2. Implement the mode-specific logic
3. Update the UI to show mode-specific information

## License

MIT License - feel free to use and modify as you wish.
