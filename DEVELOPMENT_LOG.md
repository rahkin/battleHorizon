# Battle Horizon Development Log

## Project Overview
Battle Horizon is a multiplayer vehicle combat game that combines 3D vehicle warfare with real-world map integration using Mapbox.

## Core Features Implemented

### Vehicle System
- Implemented vehicle selection system with 4 unique vehicles:
  - **Razorback**: Fast muscle car with dual cannons
  - **Ironclad**: Heavy armored truck with mortar
  - **Scorpion**: Agile bike with rocket launcher
  - **Junkyard King**: Modified van with flamethrower
- Each vehicle has unique:
  - Stats (health, speed, armor)
  - Weapon systems
  - 3D models and visual characteristics
  - Damage states (pristine, scratched, wrecked, critical)

### Map and World
- Integrated Mapbox for real-world terrain
- Implemented 3D terrain with reduced exaggeration (0.3)
- Added enhanced building layer with custom styling
- Initial spawn location set to Manila, Philippines
- Added location search and teleport functionality

### Vehicle Controls
- WASD/Arrow keys movement system
- Mouse-based camera control
- Shift key for speed boost
- Space bar for weapon systems
- Implemented smooth vehicle turning
- Fixed movement directions and camera following

### UI/HUD System
- Vehicle selection screen with detailed stats
- In-game HUD showing:
  - Health status
  - Damage state
  - Location information
  - Dynamic damage indicator bar
- Loading screen for transitions

### Technical Implementations
- Three.js integration for 3D rendering
- Custom vehicle models with proper scaling
- Shadow and lighting systems
- Collision detection groundwork
- Map synchronization with vehicle movement
- Camera system with smooth following and rotation

## Recent Changes

### Vehicle Model System
- Created unique 3D models for each vehicle type
- Implemented proper scaling (0.25 uniform scale)
- Added vehicle-specific details:
  - Razorback: Sleek design with visible weapon systems
  - Ironclad: Heavy armor plating and mortar turret
  - Scorpion: Aerodynamic bike with mounted launcher
  - Junkyard King: Rustic design with random attachments

### Control Improvements
- Fixed inverted controls
- Adjusted movement speed and turning radius
- Implemented proper ground alignment
- Enhanced camera following behavior

### Visual Improvements
- Adjusted vehicle scales for better visibility
- Enhanced material properties for each vehicle
- Improved shadow casting and receiving
- Better terrain integration

### Vehicle Movement and Model Improvements (2024-03-XX)

#### Changes Made
1. **Ironclad Model Scaling**
   - Reduced overall model size by 50% for better proportions
   - Adjusted all component dimensions while maintaining ratios
   - Repositioned elements to match new scale

2. **Wheel System Overhaul**
   - Fixed wheel positions (front wheels at front, back wheels at back)
   - Implemented realistic wheel rotation during movement
   - Added steering animation for front wheels
   - Created separate wheel groups for independent control
   - Added proper wheel rotation directions (counter-rotating pairs)

3. **Speed Boost Functionality**
   - Implemented boost mechanic using Shift key
   - Added 75% speed increase during boost
   - Increased acceleration by 50% while boosting
   - Reduced turn speed by 30% during boost for better control
   - Added boost state to debug logging

4. **Movement System Improvements**
   - Enhanced vehicle physics calculations
   - Added proper deceleration when no input
   - Improved turning response
   - Fixed position and rotation tracking
   - Enhanced debug logging with detailed movement data

#### Technical Details
- Boost characteristics:
  ```javascript
  boostMultiplier: 1.75        // Speed multiplier when boosting
  boostAccelerationMultiplier: 1.5  // Acceleration multiplier when boosting
  ```
- Vehicle base characteristics:
  ```javascript
  maxSpeed: 0.4
  acceleration: 0.01
  deceleration: 0.008
  turnSpeed: 0.02
  ```
- Wheel rotation speed is proportional to vehicle speed
- Front wheels turn up to 30 degrees (π/6 radians) during steering

#### Next Steps
- Fine-tune boost mechanics based on gameplay testing
- Add visual effects for boost activation
- Consider adding boost cooldown or energy system
- Implement vehicle-specific boost characteristics

## Planned Features
- Multiplayer integration using Colyseus
- Weapon system implementation
- Vehicle damage visualization
- Enhanced particle effects
- Sound system
- Game modes and objectives

## Technical Notes
- Server running on port 2567 (Colyseus)
- Client running on port 8080
- Using Three.js for 3D rendering
- Mapbox integration for world map
- ES6 modules for code organization

## Setup Instructions
1. Clone repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start server:
   ```bash
   cd server && npx ts-node src/index.ts
   ```
4. Start client:
   ```bash
   cd client/world-fps && http-server
   ```
5. Access game at `http://localhost:8080`

## Known Issues
- Need to optimize terrain rendering
- Vehicle physics needs refinement
- Multiplayer synchronization pending
- Weapon systems not fully implemented

## Next Steps
1. Complete weapon system implementation
2. Add multiplayer functionality
3. Implement damage system
4. Add sound effects
5. Enhance particle effects
6. Add game modes 