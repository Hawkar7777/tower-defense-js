class SoundManager {
  constructor() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.sounds = {};
    this.masterVolume = 1.0;
    this.audioReady = false;
    this.userInteracted = false;

    // Track currently playing boss sources: { source, gainNode, name }
    this.activeBossSources = [];

    // If false, any sounds flagged as isBossSound will be skipped.
    this.allowBossSounds = false;

    this.setupInteractionListeners();
  }

  setupInteractionListeners() {
    if (/android|iphone|ipad/i.test(navigator.userAgent)) {
      const interactionEvents = ["click", "touchstart", "touchend", "keydown"];
      const handleInteraction = () => {
        this.userInteracted = true;
        this.resumeAudio();
        interactionEvents.forEach((event) => {
          document.removeEventListener(event, handleInteraction);
        });
      };
      interactionEvents.forEach((event) => {
        document.addEventListener(event, handleInteraction, { once: true });
      });
    } else {
      this.userInteracted = true;
    }
  }

  async loadSound(
    name,
    path,
    volume = 1,
    maxConcurrent = 5,
    isBossSound = false
  ) {
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
        volume,
        maxConcurrent,
        playingInstances: 0,
        isBossSound: Boolean(isBossSound),
      };
      console.log(
        `Sound '${name}' loaded successfully. isBossSound=${!!isBossSound}`
      );
    } catch (error) {
      console.error(`Error loading sound '${name}':`, error);
    }
  }

  // control whether boss sounds are allowed
  setBossSoundsEnabled(enabled) {
    const wasEnabled = this.allowBossSounds;
    this.allowBossSounds = Boolean(enabled);

    // If we just disabled boss sounds, forcibly stop any currently active boss sources
    if (wasEnabled && !this.allowBossSounds) {
      this.stopBossSounds();
    }
  }

  async playSound(name, volume = 1.0) {
    if (
      !this.userInteracted &&
      /android|iphone|ipad/i.test(navigator.userAgent)
    ) {
      console.debug("Skipping sound - no user interaction yet");
      return Promise.resolve();
    }

    if (this.audioContext.state === "suspended") {
      const resumed = await this.resumeAudio();
      if (!resumed) {
        console.debug("Audio context could not be resumed");
        return Promise.resolve();
      }
    }

    if (!this.audioReady) {
      console.debug("Audio not ready");
      return Promise.resolve();
    }

    const sound = this.sounds[name];
    if (!sound || !sound.buffer) {
      console.debug(`Sound '${name}' not found or not loaded`);
      return Promise.resolve();
    }

    // Guard: skip boss sounds unless allowed
    if (sound.isBossSound && !this.allowBossSounds) {
      console.debug(
        `Skipping boss sound '${name}' because boss sounds are disabled.`
      );
      return Promise.resolve();
    }

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

    source.__stoppedByManager = false;

    if (sound.isBossSound) {
      this.activeBossSources.push({ source, gainNode, name });
    }

    source.start(0);

    return new Promise((resolve) => {
      source.onended = () => {
        if (sound.isBossSound) {
          this.activeBossSources = this.activeBossSources.filter(
            (entry) => entry.source !== source
          );
        }

        if (!source.__stoppedByManager) {
          if (sound.playingInstances > 0) sound.playingInstances--;
        }

        resolve();
      };
    }).catch((error) => {
      if (sound.playingInstances > 0) sound.playingInstances--;
      console.debug(
        `Sound '${name}' playback error:`,
        error && error.message ? error.message : error
      );
    });
  }

  async resumeAudio() {
    if (!this.audioContext) return false;

    if (this.audioContext.state === "running") {
      this.audioReady = true;
      return true;
    }

    if (this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
        this.audioReady = true;
        return true;
      } catch (error) {
        console.error("Failed to resume AudioContext:", error);
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
      }
    }

    if (this.audioContext.state === "closed") {
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
    }

    return false;
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  stopBossSounds() {
    // Reset playingInstances for boss sounds
    Object.keys(this.sounds).forEach((soundName) => {
      const s = this.sounds[soundName];
      if (s && s.isBossSound) s.playingInstances = 0;
    });

    // Stop and disconnect all tracked boss sources
    this.activeBossSources.forEach((entry) => {
      const { source, gainNode } = entry;
      try {
        source.__stoppedByManager = true;
        try {
          source.stop(0);
        } catch (e) {
          /* ignore */
        }
        try {
          source.disconnect();
        } catch (e) {
          /* ignore */
        }
        try {
          gainNode.disconnect();
        } catch (e) {
          /* ignore */
        }
      } catch (err) {
        console.warn("Error while stopping a boss source:", err);
      }
    });

    this.activeBossSources = [];
    console.log(
      "Boss sounds force-stopped and playingInstances reset for boss sounds."
    );
  }
}

export const soundManager = new SoundManager();
