class SoundManager {
  constructor() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.sounds = {}; // Stores { soundName: { path, volume, maxConcurrent, pool: [], playingInstances: [] } }
  }

  loadSound(name, path, volume = 1, maxConcurrent = 5) {
    if (this.sounds[name]) {
      console.warn(`Sound '${name}' already loaded.`);
      return;
    }

    const soundData = {
      path: path,
      volume: volume,
      maxConcurrent: maxConcurrent,
      pool: [],
      playingInstances: [],
    };

    for (let i = 0; i < maxConcurrent; i++) {
      const audio = new Audio(path);
      audio.volume = volume;
      audio.load(); // Preload the sound
      soundData.pool.push(audio);
    }
    this.sounds[name] = soundData;
  }

  playSound(name, customVolume) {
    const soundData = this.sounds[name];
    if (!soundData) {
      console.warn(
        `Sound '${name}' not loaded. Call soundManager.loadSound() first.`
      );
      return;
    }

    // Filter out finished instances from playingInstances
    // An audio element is considered "finished" if its 'ended' flag is true.
    // Also, if currentTime is 0 and it's paused, it's ready for reuse.
    soundData.playingInstances = soundData.playingInstances.filter(
      (instance) =>
        !instance.ended && (instance.currentTime > 0 || !instance.paused)
    );

    // If we have too many instances currently playing, find the oldest to reuse
    if (soundData.playingInstances.length >= soundData.maxConcurrent) {
      const oldestInstance = soundData.playingInstances.shift(); // Remove oldest
      if (oldestInstance) {
        oldestInstance.pause();
        oldestInstance.currentTime = 0;
      } else {
        // This case should ideally not happen if playingInstances is managed correctly
        // but provides a fallback to prevent errors.
        console.warn(
          `No oldest instance found to stop for sound '${name}'. Skipping sound.`
        );
        return;
      }
    }

    // Find an available instance in the pool that is not currently playing
    let audioInstance = soundData.pool.find(
      (instance) =>
        instance.paused || instance.ended || instance.currentTime === 0
    );

    if (!audioInstance) {
      // Fallback: If no suitable instance was found, create a new temporary one.
      // This indicates 'maxConcurrent' might be too low or pooling logic needs review.
      audioInstance = new Audio(soundData.path);
      console.warn(
        `Sound pool for '${name}' exhausted, creating new temporary instance. Consider increasing maxConcurrent for this sound.`
      );
    }

    // Apply custom volume if provided, otherwise use the default loaded volume
    audioInstance.volume =
      customVolume !== undefined ? customVolume : soundData.volume;

    audioInstance.pause(); // Stop if it was playing from a previous use
    audioInstance.currentTime = 0; // Rewind to start
    audioInstance.play().catch((e) => {
      // Catch "NotAllowedError" if user hasn't interacted, or other playback errors
      console.warn(`Sound '${name}' playback prevented:`, e);
    });

    // Add the instance to currently playing ones if it's not already there
    if (!soundData.playingInstances.includes(audioInstance)) {
      soundData.playingInstances.push(audioInstance);
    }
  }
}

export const soundManager = new SoundManager();
