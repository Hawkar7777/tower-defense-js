class SoundManager {
  constructor() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.sounds = {}; // Stores { soundName: { buffer, volume, maxConcurrent, playingInstances } }
    this.masterVolume = 1.0;
    this.audioReady = false;
  }

  // Load a sound and decode it into an AudioBuffer
  async loadSound(name, path, volume = 1, maxConcurrent = 5) {
    if (this.sounds[name]) {
      console.warn(`Sound '${name}' already loaded.`);
      return;
    }

    try {
      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.sounds[name] = {
        buffer: audioBuffer,
        volume: volume,
        maxConcurrent: maxConcurrent,
        playingInstances: 0,
      };

      console.log(`Sound '${name}' loaded successfully.`);
    } catch (error) {
      console.error(`Error loading sound '${name}':`, error);
    }
  }

  // Play a sound with optional volume adjustment
  playSound(name, volume = 1.0) {
    if (!this.audioReady || this.audioContext.state === "suspended") {
      console.debug("Audio not ready or context suspended");
      return Promise.resolve();
    }

    const sound = this.sounds[name];
    if (!sound || !sound.buffer) {
      console.debug(`Sound '${name}' not found or not loaded`);
      return Promise.resolve();
    }

    // Check if we've reached the maximum concurrent instances
    if (sound.playingInstances >= sound.maxConcurrent) {
      console.debug(`Max concurrent instances reached for '${name}'`);
      return Promise.resolve();
    }

    sound.playingInstances++;

    const source = this.audioContext.createBufferSource();
    source.buffer = sound.buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume * sound.volume * this.masterVolume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start(0);

    return new Promise((resolve) => {
      source.onended = () => {
        sound.playingInstances--;
        resolve();
      };
    }).catch((error) => {
      sound.playingInstances--;
      console.debug(`Sound '${name}' playback error:`, error.message);
    });
  }

  // Resume the audio context (must be called from a user interaction)
  resumeAudio() {
    if (this.audioContext.state === "suspended") {
      this.audioContext
        .resume()
        .then(() => {
          console.log("AudioContext resumed successfully");
          this.audioReady = true;
        })
        .catch((error) => {
          console.error("Failed to resume AudioContext:", error);
        });
    }
  }

  // Set master volume (0.0 to 1.0)
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
}

export const soundManager = new SoundManager();
