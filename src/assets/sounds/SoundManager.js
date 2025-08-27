class SoundManager {
  constructor() {
    // Create audio context
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.sounds = {};
    this.masterVolume = 1.0;
    this.audioReady = false;
    this.userInteracted = false;

    // Set up interaction listeners for mobile devices
    this.setupInteractionListeners();
  }

  setupInteractionListeners() {
    // Only set up listeners for mobile devices
    if (/android|iphone|ipad/i.test(navigator.userAgent)) {
      const interactionEvents = ["click", "touchstart", "touchend", "keydown"];

      const handleInteraction = () => {
        this.userInteracted = true;
        this.resumeAudio();

        // Remove all listeners after first interaction
        interactionEvents.forEach((event) => {
          document.removeEventListener(event, handleInteraction);
        });
      };

      // Add listeners for all interaction events
      interactionEvents.forEach((event) => {
        document.addEventListener(event, handleInteraction, { once: true });
      });
    } else {
      // For desktop, mark as interacted immediately
      this.userInteracted = true;
    }
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
  async playSound(name, volume = 1.0) {
    // If we haven't had user interaction yet on mobile, skip sound
    if (
      !this.userInteracted &&
      /android|iphone|ipad/i.test(navigator.userAgent)
    ) {
      console.debug("Skipping sound - no user interaction yet");
      return Promise.resolve();
    }

    // If context is suspended, try to resume it first
    if (this.audioContext.state === "suspended") {
      const resumed = await this.resumeAudio();
      if (!resumed) {
        console.debug("Audio context could not be resumed");
        return;
      }
    }

    if (!this.audioReady) {
      console.debug("Audio not ready");
      return;
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

  // Resume the audio context (with fixes for Capacitor)
  resumeAudio() {
    if (!this.audioContext) {
      return Promise.resolve(false);
    }

    // If already running, no need to resume
    if (this.audioContext.state === "running") {
      this.audioReady = true;
      return Promise.resolve(true);
    }

    // If suspended, try to resume
    if (this.audioContext.state === "suspended") {
      return this.audioContext
        .resume()
        .then(() => {
          console.log("AudioContext resumed successfully");
          this.audioReady = true;
          return true;
        })
        .catch((error) => {
          console.error("Failed to resume AudioContext:", error);

          // Create a new context if resume fails (fix for Capacitor)
          try {
            this.audioContext = new (window.AudioContext ||
              window.webkitAudioContext)();
            this.audioReady = true;
            return true;
          } catch (e) {
            console.error("Failed to create new AudioContext:", e);
            this.audioReady = false;
            return false;
          }
        });
    }

    // Handle closed context by creating a new one
    if (this.audioContext.state === "closed") {
      try {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        this.audioReady = true;
        return Promise.resolve(true);
      } catch (e) {
        console.error("Failed to create new AudioContext:", e);
        this.audioReady = false;
        return Promise.resolve(false);
      }
    }

    return Promise.resolve(false);
  }

  // Set master volume (0.0 to 1.0)
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
}

export const soundManager = new SoundManager();
