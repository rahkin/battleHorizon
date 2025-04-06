import { Schema, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
    @type("string") id: string;
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") z: number = 0;
    @type("number") rotationX: number = 0;
    @type("number") rotationY: number = 0;
    @type("number") rotationZ: number = 0;
    @type("number") health: number = 100;
    @type("number") currentWeapon: number = 0;
    @type("number") ammo: number = 30;
    @type("boolean") isDead: boolean = false;
}

export class GameState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
} 