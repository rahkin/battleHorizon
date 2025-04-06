var MapLoader = pc.createScript('mapLoader');

// Map attributes
MapLoader.attributes.add('mapAssets', {
    type: 'asset',
    assetType: 'json',
    array: true,
    title: 'Map Assets'
});

MapLoader.attributes.add('defaultMap', {
    type: 'string',
    default: 'map1',
    title: 'Default Map'
});

MapLoader.attributes.add('skyboxAsset', {
    type: 'asset',
    assetType: 'cubemap',
    title: 'Skybox Asset'
});

// Initialize the map loader
MapLoader.prototype.initialize = function() {
    // Initialize map state
    this.currentMap = null;
    this.maps = {};
    
    // Load map assets
    this.loadMapAssets();
    
    // Load default map
    this.loadMap(this.defaultMap);
};

// Load map assets
MapLoader.prototype.loadMapAssets = function() {
    for (var i = 0; i < this.mapAssets.length; i++) {
        var asset = this.mapAssets[i];
        if (asset) {
            this.maps[asset.name] = asset;
        }
    }
};

// Load map
MapLoader.prototype.loadMap = function(mapName) {
    // Unload current map
    this.unloadMap();
    
    // Get map data
    var mapData = this.maps[mapName];
    if (!mapData) {
        console.error('Map not found: ' + mapName);
        return;
    }
    
    // Set current map
    this.currentMap = mapName;
    
    // Create map container
    var mapContainer = new pc.Entity('map');
    this.app.root.addChild(mapContainer);
    
    // Load map geometry
    this.loadMapGeometry(mapContainer, mapData);
    
    // Load map entities
    this.loadMapEntities(mapContainer, mapData);
    
    // Load skybox
    this.loadSkybox();
    
    // Trigger map loaded event
    this.app.fire('map:loaded', mapName);
};

// Unload map
MapLoader.prototype.unloadMap = function() {
    if (this.currentMap) {
        // Find and remove map container
        var mapContainer = this.app.root.findByName('map');
        if (mapContainer) {
            mapContainer.destroy();
        }
        
        // Reset current map
        this.currentMap = null;
    }
};

// Load map geometry
MapLoader.prototype.loadMapGeometry = function(container, mapData) {
    // Create ground
    var ground = new pc.Entity('ground');
    ground.addComponent('model', {
        type: 'plane',
        castShadows: true
    });
    ground.setLocalScale(100, 1, 100);
    ground.setLocalPosition(0, 0, 0);
    container.addChild(ground);
    
    // Create walls and obstacles
    if (mapData.walls) {
        for (var i = 0; i < mapData.walls.length; i++) {
            var wallData = mapData.walls[i];
            var wall = new pc.Entity('wall_' + i);
            wall.addComponent('model', {
                type: 'box',
                castShadows: true
            });
            wall.setLocalScale(wallData.scale);
            wall.setLocalPosition(wallData.position);
            wall.setLocalEulerAngles(wallData.rotation);
            container.addChild(wall);
        }
    }
};

// Load map entities
MapLoader.prototype.loadMapEntities = function(container, mapData) {
    // Load spawn points
    if (mapData.spawns) {
        for (var i = 0; i < mapData.spawns.length; i++) {
            var spawnData = mapData.spawns[i];
            var spawn = new pc.Entity('spawn_' + i);
            spawn.addComponent('model', {
                type: 'sphere',
                castShadows: true
            });
            spawn.setLocalScale(0.5, 0.5, 0.5);
            spawn.setLocalPosition(spawnData.position);
            spawn.tags.add('spawn');
            spawn.team = spawnData.team;
            container.addChild(spawn);
        }
    }
    
    // Load waypoints
    if (mapData.waypoints) {
        for (var i = 0; i < mapData.waypoints.length; i++) {
            var waypointData = mapData.waypoints[i];
            var waypoint = new pc.Entity('waypoint_' + i);
            waypoint.addComponent('model', {
                type: 'sphere',
                castShadows: true
            });
            waypoint.setLocalScale(0.3, 0.3, 0.3);
            waypoint.setLocalPosition(waypointData.position);
            waypoint.tags.add('waypoint');
            container.addChild(waypoint);
        }
    }
    
    // Load bomb sites
    if (mapData.bombSites) {
        for (var i = 0; i < mapData.bombSites.length; i++) {
            var siteData = mapData.bombSites[i];
            var site = new pc.Entity('bomb_site_' + i);
            site.addComponent('model', {
                type: 'box',
                castShadows: true
            });
            site.setLocalScale(siteData.scale);
            site.setLocalPosition(siteData.position);
            site.tags.add('bomb_site');
            container.addChild(site);
        }
    }
};

// Load skybox
MapLoader.prototype.loadSkybox = function() {
    if (this.skyboxAsset) {
        this.app.scene.skybox = this.skyboxAsset.resource;
    }
};

// Get spawn points for team
MapLoader.prototype.getSpawnPoints = function(team) {
    var spawns = this.app.root.findByTag('spawn');
    var teamSpawns = [];
    
    for (var i = 0; i < spawns.length; i++) {
        if (spawns[i].team === team) {
            teamSpawns.push(spawns[i]);
        }
    }
    
    return teamSpawns;
};

// Get random spawn point for team
MapLoader.prototype.getRandomSpawnPoint = function(team) {
    var spawns = this.getSpawnPoints(team);
    if (spawns.length > 0) {
        return spawns[Math.floor(Math.random() * spawns.length)];
    }
    return null;
};

// Get bomb sites
MapLoader.prototype.getBombSites = function() {
    return this.app.root.findByTag('bomb_site');
}; 