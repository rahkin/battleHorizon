import { Room, Client } from "colyseus";
import { GameState, Player } from "../schema/GameState";

export class GameRoom extends Room<GameState> {
    maxClients = 10;

    onCreate(options: any) {
        this.setState(new GameState());
        console.log("GameRoom created!", options);

        // Handle player movement
        this.onMessage("playerMove", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = data.x;
                player.y = data.y;
                player.z = data.z;
                player.rotationX = data.rotationX;
                player.rotationY = data.rotationY;
                player.rotationZ = data.rotationZ;
            }
        });

        // Handle player shooting
        this.onMessage("playerShoot", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (player && !player.isDead && player.ammo > 0) {
                player.ammo--;
                this.broadcast("playerShoot", {
                    playerId: client.sessionId,
                    position: {
                        x: player.x,
                        y: player.y,
                        z: player.z
                    },
                    rotation: {
                        x: player.rotationX,
                        y: player.rotationY,
                        z: player.rotationZ
                    }
                }, { except: client });
            }
        });

        // Handle player hit
        this.onMessage("playerHit", (client, data) => {
            const targetPlayer = this.state.players.get(data.targetId);
            if (targetPlayer && !targetPlayer.isDead) {
                targetPlayer.health -= data.damage;
                if (targetPlayer.health <= 0) {
                    targetPlayer.isDead = true;
                    targetPlayer.health = 0;
                    this.broadcast("playerDeath", {
                        playerId: data.targetId,
                        killerId: client.sessionId
                    });
                }
            }
        });

        // Handle weapon reload
        this.onMessage("weaponReload", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (player && !player.isDead) {
                player.ammo = 30;
                this.broadcast("weaponReload", {
                    playerId: client.sessionId
                });
            }
        });
    }

    onJoin(client: Client) {
        console.log(client.sessionId, "joined!");
        
        const player = new Player();
        player.id = client.sessionId;
        player.x = 0;
        player.y = 2;
        player.z = 0;
        player.rotationX = 0;
        player.rotationY = 0;
        player.rotationZ = 0;
        player.health = 100;
        player.ammo = 30;
        player.isDead = false;
        
        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client) {
        console.log(client.sessionId, "left!");
        
        this.state.players.delete(client.sessionId);
    }

    onDispose() {
        console.log("Room", this.roomId, "disposing...");
    }
} 