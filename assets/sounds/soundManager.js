class SoundGenerator {
    constructor() {
        this.audioContext = null;
        this.backgroundLoop = null;
        this.initializeAudioContext();
    }

    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Resume audio context on user interaction
            document.addEventListener('click', () => {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            }, { once: true });
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }

    generateBeep(frequency, duration, volume = 0.1) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume;
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    generateChomp() {
        if (!this.audioContext) return;
        this.generateBeep(440, 0.1, 0.2);
    }

    generatePowerUp() {
        if (!this.audioContext) return;
        const frequencies = [440, 880, 1320, 1760];
        frequencies.forEach((freq, index) => {
            this.generateBeep(freq, 0.1, 0.2);
        });
    }

    generateGhostEaten() {
        if (!this.audioContext) return;
        const frequencies = [880, 440, 220, 110];
        frequencies.forEach((freq, index) => {
            this.generateBeep(freq, 0.1, 0.2);
        });
    }

    generateDeath() {
        if (!this.audioContext) return;
        const frequencies = [440, 220, 110, 55];
        frequencies.forEach((freq, index) => {
            this.generateBeep(freq, 0.2, 0.3);
        });
    }

    generateGameOver() {
        if (!this.audioContext) return;
        const frequencies = [880, 440, 220, 110, 55];
        frequencies.forEach((freq, index) => {
            this.generateBeep(freq, 0.3, 0.4);
        });
    }

    generateWin() {
        if (!this.audioContext) return;
        const frequencies = [220, 440, 880, 1760, 3520];
        frequencies.forEach((freq, index) => {
            this.generateBeep(freq, 0.2, 0.3);
        });
    }

    generateBackgroundMusic() {
        if (!this.audioContext) return;
        
        // Stop any existing background music
        this.stopBackgroundMusic();
        
        const playPattern = () => {
            // Play a simple pattern: alternating between two notes
            this.generateBeep(440, 0.2, 0.1); // A4
            this.generateBeep(880, 0.2, 0.1); // A5
        };
        
        // Play the pattern immediately
        playPattern();
        
        // Set up the loop
        this.backgroundLoop = setInterval(playPattern, 1600); // Play every 1.6 seconds
    }

    stopBackgroundMusic() {
        if (this.backgroundLoop) {
            clearInterval(this.backgroundLoop);
            this.backgroundLoop = null;
        }
    }
}

class SoundManager {
    constructor() {
        this.soundGenerator = new SoundGenerator();
        this.backgroundVolume = 0.1;
        this.effectsVolume = 0.2;
    }

    playBackground() {
        this.soundGenerator.generateBackgroundMusic();
    }

    stopBackground() {
        this.soundGenerator.stopBackgroundMusic();
    }

    playChomp() {
        this.soundGenerator.generateChomp();
    }

    playPowerUp() {
        this.soundGenerator.generatePowerUp();
    }

    playGhostEaten() {
        this.soundGenerator.generateGhostEaten();
    }

    playDeath() {
        this.soundGenerator.generateDeath();
    }

    playGameOver() {
        this.soundGenerator.generateGameOver();
    }

    playWin() {
        this.soundGenerator.generateWin();
    }

    stopAll() {
        this.stopBackground();
    }
}

export default new SoundManager(); 