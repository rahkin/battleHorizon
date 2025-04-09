export const VEHICLES = [
    {
        id: 'scout',
        name: 'Scout Vehicle',
        type: 'Light Reconnaissance',
        description: 'Fast and agile scout vehicle perfect for reconnaissance missions. Low armor but high speed makes it ideal for hit-and-run tactics.',
        health: 100,
        speed: 120,
        weaponType: 'Light Machine Gun',
        damage: 15,
        dimensions: {
            body: { width: 0.25, height: 0.0625, length: 0.5 },
            cabin: { width: 0.1875, height: 0.075, length: 0.25 },
            wheels: { radius: 0.05, width: 0.05 }
        }
    },
    {
        id: 'tank',
        name: 'Battle Tank',
        type: 'Heavy Assault',
        description: 'Heavy armored tank with devastating firepower. Slower but can take and deal significant damage.',
        health: 200,
        speed: 60,
        weaponType: 'Heavy Cannon',
        damage: 50,
        dimensions: {
            body: { width: 0.35, height: 0.08, length: 0.6 },
            cabin: { width: 0.25, height: 0.1, length: 0.3 },
            wheels: { radius: 0.07, width: 0.07 }
        }
    },
    {
        id: 'apc',
        name: 'Armored Personnel Carrier',
        type: 'Transport/Support',
        description: 'Balanced vehicle with good armor and moderate speed. Equipped with medium weapons for support roles.',
        health: 150,
        speed: 90,
        weaponType: 'Autocannon',
        damage: 25,
        dimensions: {
            body: { width: 0.3, height: 0.07, length: 0.55 },
            cabin: { width: 0.22, height: 0.085, length: 0.28 },
            wheels: { radius: 0.06, width: 0.06 }
        }
    }
]; 