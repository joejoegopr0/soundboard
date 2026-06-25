// MPC-Style Studio Soundboard Core Engine

// Audio Variables
let audioCtx = null;
let globalGainNode = null;
let analyserNode = null;

// IndexedDB Configuration
const DB_NAME = "SonicDeckDB";
const STORE_NAME = "custom_pads";

// State Management
let currentBank = "A"; // "A", "B", "C"
let visualizerMode = "wave"; // "wave" or "freq"
let animationFrameId = null;
let editingPadIndex = null; // Track which pad is being configured in the modal
const urlCache = {}; // Global cache for fetched AudioBuffers to prevent duplicate network calls

// Audio Trimmer State Management
let trimmerFile = null;
let trimmerAudioBuffer = null;
let trimmerStartSec = 0;
let trimmerPreviewSource = null;
let trimmerPreviewStartTime = null;
let trimmerTargetPadIndex = null;

// Hotkey mapping for 4x4 grid (0-15)
const keyMap = {
  "1": 0, "2": 1, "3": 2, "4": 3,
  "q": 4, "w": 5, "e": 6, "r": 7,
  "a": 8, "s": 9, "d": 10, "f": 11,
  "z": 12, "x": 13, "c": 14, "v": 15
};

// 12 Preset Sounds definitions (Bank A)
const PRESETS = [
  { id: "fart", title: "Fart", recPath: "assets/sounds/fart.mp3", duration: 0.5 },
  { id: "applause", title: "Applause", recPath: "assets/sounds/applause.mp3", duration: 2.5 },
  { id: "laughter", title: "Laughter", recPath: "assets/sounds/laughter.mp3", duration: 1.6 },
  { id: "laser", title: "Laser Gun", duration: 0.3 },
  { id: "dundun", title: "Dun Dun", duration: 1.2 },
  { id: "crickets", title: "Crickets", duration: 2.2 },
  { id: "stinks", title: "Stinks Quote", duration: 2.0 },
  { id: "honk", title: "Horn Honk", duration: 0.4 },
  { id: "snore", title: "Snoring", duration: 2.5 },
  { id: "cash", title: "Cash Register", duration: 0.6 },
  { id: "cleanup", title: "Clean Up PA", duration: 2.2 },
  { id: "airhorn", title: "Air Horn", recPath: "assets/sounds/airhorn.mp3", duration: 1.0 }
];

// Curated GitHub/Web-Hosted Sound Library (Discord, Retro Gaming, and Memes)
const WEB_SOUNDS = [
  // Discord Notification Sounds
  { title: "Discord Join", url: "https://raw.githubusercontent.com/lefuturiste/discord-sounds/master/incoming-user.mp3", category: "discord" },
  { title: "Discord Leave", url: "https://raw.githubusercontent.com/lefuturiste/discord-sounds/master/deconnected.mp3", category: "discord" },
  { title: "Discord Ringtone", url: "https://raw.githubusercontent.com/lefuturiste/discord-sounds/master/incoming-ring.mp3", category: "discord" },
  { title: "Discord Mute", url: "https://raw.githubusercontent.com/lefuturiste/discord-sounds/master/muted.mp3", category: "discord" },
  { title: "Discord Deafen", url: "https://raw.githubusercontent.com/lefuturiste/discord-sounds/master/deaf.mp3", category: "discord" },
  { title: "Discord Undeafen", url: "https://raw.githubusercontent.com/lefuturiste/discord-sounds/master/undeaf.mp3", category: "discord" },
  { title: "Discord Unmute", url: "https://raw.githubusercontent.com/lefuturiste/discord-sounds/master/unmuted.mp3", category: "discord" },
  { title: "Discord Ringing", url: "https://raw.githubusercontent.com/lefuturiste/discord-sounds/master/call-ringing.mp3", category: "discord" },
  { title: "Discord Outgoing", url: "https://raw.githubusercontent.com/lefuturiste/discord-sounds/master/outgoing-ring.mp3", category: "discord" },

  // Jitsi Meet Reactions
  { title: "Wow Surprise", url: "https://raw.githubusercontent.com/jitsi/jitsi-meet/master/sounds/reactions-surprise.mp3", category: "reactions" },
  { title: "Thumbs Up", url: "https://raw.githubusercontent.com/jitsi/jitsi-meet/master/sounds/reactions-thumbs-up.mp3", category: "reactions" },
  { title: "Crowd Laughter", url: "https://raw.githubusercontent.com/jitsi/jitsi-meet/master/sounds/reactions-laughter.mp3", category: "reactions" },
  { title: "Crowd Applause", url: "https://raw.githubusercontent.com/jitsi/jitsi-meet/master/sounds/reactions-applause.mp3", category: "reactions" },

  // SoundManager2 Retro UI Chimes & Clicks
  { title: "Click Low", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/click-low.mp3", category: "interface" },
  { title: "Click High", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/click-high.mp3", category: "interface" },
  { title: "Retro Beep A", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/button-0.mp3", category: "interface" },
  { title: "Retro Beep B", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/button-1.mp3", category: "interface" },
  { title: "Retro Beep C", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/button-2.mp3", category: "interface" },
  { title: "Retro Beep D", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/button-3.mp3", category: "interface" },
  { title: "Retro Beep E", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/button-4.mp3", category: "interface" },
  { title: "Retro Beep F", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/button-5.mp3", category: "interface" },
  { title: "Retro Beep G", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/button-6.mp3", category: "interface" },
  { title: "Retro Beep H", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/button-7.mp3", category: "interface" },
  { title: "Retro Beep I", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/button-8.mp3", category: "interface" },

  // SoundManager2 Drum / Instrument SFX
  { title: "Snare Drum", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/snare.mp3", category: "instruments" },
  { title: "Bass Drum", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/bass.mp3", category: "instruments" },
  { title: "Closed Hat", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/hat-closed.mp3", category: "instruments" },
  { title: "Open Hat", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/hat-open.mp3", category: "instruments" },
  { title: "Crash Cymbal", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/crash.mp3", category: "instruments" },
  { title: "Ride Cymbal", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/ride.mp3", category: "instruments" },
  { title: "High Tom", url: "https://raw.githubusercontent.com/scottschiller/soundmanager2/master/demo/_mp3/tom-high.mp3", category: "instruments" },

  // Extra Meme Classics
  { title: "Fart Reverb", url: "https://raw.githubusercontent.com/ItzOnlyAnimal/AliuPlugins/main/fart.mp3", category: "memes" },
  { title: "Original Airhorn", url: "https://raw.githubusercontent.com/hamvocke/airhorn/master/airhorn.mp3", category: "memes" }
];

// Grid Pad States (3 Banks A, B, C of 16 pads each)
const padStates = {
  A: Array.from({ length: 16 }, (_, i) => createInitialPad(i, "A")),
  B: Array.from({ length: 16 }, (_, i) => createInitialPad(i, "B")),
  C: Array.from({ length: 16 }, (_, i) => createInitialPad(i, "C"))
};

function createInitialPad(index, bank) {
  // Bank A has 12 presets on rows 1-3 (indices 0 to 11)
  if (bank === "A" && index < 12) {
    const preset = PRESETS[index];
    return {
      presetId: preset.id,
      title: preset.title,
      duration: preset.duration || 1.0,
      recPath: preset.recPath || null,
      audioBuffer: null,
      customFile: null,
      url: null, // Host URL if custom web sound
      loop: false,
      volume: 1.0,
      isPlaying: false,
      gainNode: null,
      activeSources: [],
      playTimeout: null
    };
  }
  
  // Custom Empty Pad
  return {
    presetId: null,
    title: "Empty Slot",
    duration: 0,
    recPath: null,
    audioBuffer: null,
    customFile: null,
    url: null,
    loop: false,
    volume: 1.0,
    isPlaying: false,
    gainNode: null,
    activeSources: [],
    playTimeout: null
  };
}

// ==========================================
// IndexedDB Persistence Helpers
// ==========================================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function savePadDataToDB(bank, index, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(data, `${bank}_${index}`);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function loadPadDataFromDB(bank, index) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(`${bank}_${index}`);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removePadDataFromDB(bank, index) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(`${bank}_${index}`);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function clearDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function saveCustomPadSettings(bank, index, pad) {
  try {
    const saved = await loadPadDataFromDB(bank, index);
    if (saved) {
      saved.volume = pad.volume;
      saved.loop = pad.loop;
      await savePadDataToDB(bank, index, saved);
    }
  } catch (err) {
    console.error("Failed to save pad settings to DB:", err);
  }
}

function decodeAllLoadedCustomSounds() {
  Object.keys(padStates).forEach(bankKey => {
    padStates[bankKey].forEach((pad, i) => {
      if (!pad.audioBuffer) {
        if (pad.customFile) {
          const fileReader = new FileReader();
          fileReader.onload = (e) => {
            const ab = e.target.result;
            decodeAudioDataSafe(ab, pad.customFile.name)
              .then((decoded) => {
                pad.audioBuffer = decoded;
                if (bankKey === currentBank) {
                  updatePadDOM(i);
                }
              })
              .catch((err) => {
                console.error(`Decoding custom file failed for pad ${i} in bank ${bankKey}:`, err);
              });
          };
          fileReader.readAsArrayBuffer(pad.customFile);
        } else if (pad.url) {
          fetchAndDecodeSound(pad, pad.url).then(() => {
            if (bankKey === currentBank) {
              updatePadDOM(i);
            }
          }).catch(() => {});
        }
      }
    });
  });
}

// ==========================================
// Audio Context Initialization & Loading
// ==========================================

function initAudio() {
  if (audioCtx) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass();

  // Nodes setup
  globalGainNode = audioCtx.createGain();
  globalGainNode.gain.setValueAtTime(parseFloat(document.getElementById("global-volume").value), audioCtx.currentTime);

  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 256;

  globalGainNode.connect(analyserNode);
  analyserNode.connect(audioCtx.destination);

  // Initialize individual gains for all pads
  Object.keys(padStates).forEach(bankKey => {
    padStates[bankKey].forEach((pad) => {
      setupPadGainNode(pad);
    });
  });

  // Pre-load default preset audio files into AudioBuffers
  loadPresetFiles();

  // Decode all custom files and web files restored from DB
  decodeAllLoadedCustomSounds();

  // Start Visualizer
  startVisualizer();
}

function setupPadGainNode(pad) {
  if (pad.gainNode) return;
  pad.gainNode = audioCtx.createGain();
  pad.gainNode.gain.setValueAtTime(pad.volume, audioCtx.currentTime);
  pad.gainNode.connect(globalGainNode);
}

async function loadPresetFiles() {
  padStates.A.forEach(async (pad) => {
    if (pad.recPath) {
      try {
        const response = await fetch(pad.recPath);
        const arrayBuffer = await response.arrayBuffer();
        const decodedBuffer = await decodeAudioDataSafe(arrayBuffer, pad.recPath);
        pad.audioBuffer = decodedBuffer;
      } catch (e) {
        console.warn(`Could not load pre-recorded asset for ${pad.presetId}, fallback synthesis will be used.`);
      }
    }
  });
}

async function resumeAudioContext() {
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
}

// ==========================================
// Web Audio API Synthesizers
// ==========================================

// White Noise generator node helper
let whiteNoiseBuffer = null;
function getNoiseBuffer() {
  if (whiteNoiseBuffer) return whiteNoiseBuffer;
  const sampleRate = audioCtx.sampleRate;
  const bufferSize = 2 * sampleRate;
  whiteNoiseBuffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
  const data = whiteNoiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return whiteNoiseBuffer;
}

// Synthesizer Route Router
function playSynthSound(id, dest, duration, pad) {
  const ctx = audioCtx;
  const oscs = [];
  const nodes = [];

  if (id === "fart") {
    // Fart Synth
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(90, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + duration * 0.9);

    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(80, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + duration * 0.8);

    const lfo = ctx.createOscillator();
    lfo.type = "sawtooth";
    lfo.frequency.setValueAtTime(23, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.45, ctx.currentTime);

    const flutterNode = ctx.createGain();
    flutterNode.gain.setValueAtTime(0.5, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(flutterNode.gain);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(250, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);

    osc1.connect(flutterNode);
    osc2.connect(flutterNode);
    flutterNode.connect(filter);
    filter.connect(dest);

    lfo.start();
    osc1.start();
    osc2.start();

    oscs.push(osc1, osc2, lfo);
    nodes.push(lfoGain, flutterNode, filter);

  } else if (id === "applause") {
    // Applause Synth (Background Noise + clappers)
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer();
    noise.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1200, ctx.currentTime);
    noiseFilter.Q.setValueAtTime(0.8, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, ctx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.3);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(dest);
    noise.start();

    oscs.push(noise);
    nodes.push(noiseFilter, noiseGain);

    const clappers = [];
    const numClappers = 8;
    for (let i = 0; i < numClappers; i++) {
      const interval = setInterval(() => {
        if (!pad.isPlaying) return;
        const clap = ctx.createBufferSource();
        clap.buffer = getNoiseBuffer();

        const clapFilt = ctx.createBiquadFilter();
        clapFilt.type = "bandpass";
        clapFilt.frequency.setValueAtTime(950 + Math.random() * 900, ctx.currentTime);
        clapFilt.Q.setValueAtTime(2.2, ctx.currentTime);

        const clapGain = ctx.createGain();
        clapGain.gain.setValueAtTime(0.45 + Math.random() * 0.4, ctx.currentTime);
        clapGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.02 + Math.random() * 0.035);

        clap.connect(clapFilt);
        clapFilt.connect(clapGain);
        clapGain.connect(dest);
        clap.start();

        setTimeout(() => {
          clap.disconnect();
          clapFilt.disconnect();
          clapGain.disconnect();
        }, 100);
      }, 90 + Math.random() * 100);
      clappers.push(interval);
    }
    pad.clapperIntervals = clappers;

  } else if (id === "laughter") {
    // Laughter Synth (3 chuckling voices)
    const basePitches = [160, 210, 245];
    const modRates = [5.6, 6.3, 4.8];
    const startOffsets = [0, 0.08, 0.15];

    basePitches.forEach((pitch, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(pitch, ctx.currentTime + startOffsets[i]);

      const f1 = ctx.createBiquadFilter();
      f1.type = "bandpass";
      f1.frequency.setValueAtTime(800, ctx.currentTime);
      f1.Q.setValueAtTime(3.0, ctx.currentTime);

      const f2 = ctx.createBiquadFilter();
      f2.type = "bandpass";
      f2.frequency.setValueAtTime(1250, ctx.currentTime);
      f2.Q.setValueAtTime(3.0, ctx.currentTime);

      const mixer = ctx.createGain();
      mixer.gain.setValueAtTime(0.35, ctx.currentTime);

      osc.connect(f1);
      osc.connect(f2);
      f1.connect(mixer);
      f2.connect(mixer);

      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(modRates[i], ctx.currentTime + startOffsets[i]);

      const lfoVol = ctx.createGain();
      lfoVol.gain.setValueAtTime(0.35, ctx.currentTime);

      const pitchMod = ctx.createGain();
      pitchMod.gain.setValueAtTime(30, ctx.currentTime);

      lfo.connect(lfoVol);
      lfo.connect(pitchMod);
      pitchMod.connect(osc.frequency);

      const volMod = ctx.createGain();
      volMod.gain.setValueAtTime(0.55, ctx.currentTime);
      lfoVol.connect(volMod.gain);

      mixer.connect(volMod);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.7, ctx.currentTime + startOffsets[i] + 0.1);
      env.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + duration);

      volMod.connect(env);
      env.connect(dest);

      setTimeout(() => {
        if (pad.isPlaying && ctx.state === "running") {
          try {
            osc.start();
            lfo.start();
          } catch(e) {}
        }
      }, startOffsets[i] * 1000);

      oscs.push(osc, lfo);
      nodes.push(f1, f2, mixer, lfoVol, pitchMod, volMod, env);
    });

  } else if (id === "laser") {
    // Laser Gun (Arcade pitch sweep)
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(250, ctx.currentTime);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.8, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(dest);

    osc.start();
    oscs.push(osc);
    nodes.push(filter, env);

  } else if (id === "dundun") {
    // Law & Order "Dun Dun"
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(55, ctx.currentTime);
    
    const filter1 = ctx.createBiquadFilter();
    filter1.type = "lowpass";
    filter1.frequency.setValueAtTime(150, ctx.currentTime);
    
    const env1 = ctx.createGain();
    env1.gain.setValueAtTime(0.8, ctx.currentTime);
    env1.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.45);

    osc1.connect(filter1);
    filter1.connect(env1);
    env1.connect(dest);

    const osc2 = ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(48, ctx.currentTime + 0.35);

    const filter2 = ctx.createBiquadFilter();
    filter2.type = "lowpass";
    filter2.frequency.setValueAtTime(180, ctx.currentTime);

    const env2 = ctx.createGain();
    env2.gain.setValueAtTime(0, ctx.currentTime);
    env2.gain.setValueAtTime(0.8, ctx.currentTime + 0.35);
    env2.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + duration);

    osc2.connect(filter2);
    filter2.connect(env2);
    env2.connect(dest);

    [0, 0.35].forEach(delay => {
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer();

      const noiseFilt = ctx.createBiquadFilter();
      noiseFilt.type = "bandpass";
      noiseFilt.frequency.setValueAtTime(1100, ctx.currentTime);
      noiseFilt.Q.setValueAtTime(2.0, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, ctx.currentTime);
      noiseGain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
      noiseGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + delay + 0.08);

      noise.connect(noiseFilt);
      noiseFilt.connect(noiseGain);
      noiseGain.connect(dest);

      setTimeout(() => {
        if (pad.isPlaying && ctx.state === "running") {
          try { noise.start(); } catch(e) {}
        }
      }, delay * 1000);

      oscs.push(noise);
      nodes.push(noiseFilt, noiseGain);
    });

    osc1.start();
    setTimeout(() => {
      if (pad.isPlaying && ctx.state === "running") {
        try { osc2.start(); } catch(e) {}
      }
    }, 350);

    oscs.push(osc1, osc2);
    nodes.push(filter1, env1, filter2, env2);

  } else if (id === "crickets") {
    // Crickets Chirp
    const chirpDuration = 0.045;
    const chirperInterval = setInterval(() => {
      if (!pad.isPlaying) return;

      for (let idx = 0; idx < 3; idx++) {
        const timeDelay = idx * 0.06;
        
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(3900 + Math.random() * 150, ctx.currentTime + timeDelay);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, ctx.currentTime);
        env.gain.setValueAtTime(0.3, ctx.currentTime + timeDelay);
        env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeDelay + chirpDuration);

        osc.connect(env);
        env.connect(dest);
        
        try {
          osc.start(ctx.currentTime + timeDelay);
          osc.stop(ctx.currentTime + timeDelay + 0.1);
        } catch(e) {}
      }
    }, 450);

    pad.cricketsInterval = chirperInterval;

  } else if (id === "stinks") {
    // SpongeBob quote: "Oh brother, this guy stinks!"
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = "Oh brother, this guy stinks!";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15;
      utterance.pitch = 1.35;
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const engVoice = voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-GB"));
        if (engVoice) utterance.voice = engVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }

  } else if (id === "honk") {
    // Car Horn Honk
    [0, 0.16].forEach(delay => {
      const osc1 = ctx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(375, ctx.currentTime + delay);

      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(435, ctx.currentTime + delay);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(700, ctx.currentTime);
      filter.Q.setValueAtTime(1.0, ctx.currentTime);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.setValueAtTime(0.65, ctx.currentTime + delay);
      env.gain.linearRampToValueAtTime(0.5, ctx.currentTime + delay + 0.02);
      env.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + delay + 0.12);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(env);
      env.connect(dest);

      setTimeout(() => {
        if (pad.isPlaying && ctx.state === "running") {
          try {
            osc1.start();
            osc2.start();
          } catch(e) {}
        }
      }, delay * 1000);

      oscs.push(osc1, osc2);
      nodes.push(filter, env);
    });

  } else if (id === "snore") {
    // Snoring
    const snoreNoise = ctx.createBufferSource();
    snoreNoise.buffer = getNoiseBuffer();
    snoreNoise.loop = true;

    const snoreFilter = ctx.createBiquadFilter();
    snoreFilter.type = "bandpass";
    snoreFilter.frequency.setValueAtTime(160, ctx.currentTime);
    snoreFilter.Q.setValueAtTime(2.5, ctx.currentTime);
    snoreFilter.frequency.linearRampToValueAtTime(240, ctx.currentTime + 0.7);
    snoreFilter.frequency.linearRampToValueAtTime(160, ctx.currentTime + 1.2);

    const snoreLfo = ctx.createOscillator();
    snoreLfo.type = "sine";
    snoreLfo.frequency.setValueAtTime(12, ctx.currentTime);

    const snoreLfoGain = ctx.createGain();
    snoreLfoGain.gain.setValueAtTime(0.35, ctx.currentTime);

    const snoreFlutter = ctx.createGain();
    snoreFlutter.gain.setValueAtTime(0.4, ctx.currentTime);
    snoreLfo.connect(snoreLfoGain);
    snoreLfoGain.connect(snoreFlutter.gain);

    const snoreGain = ctx.createGain();
    snoreGain.gain.setValueAtTime(0, ctx.currentTime);
    snoreGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.5);
    snoreGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    snoreNoise.connect(snoreFilter);
    snoreFilter.connect(snoreFlutter);
    snoreFlutter.connect(snoreGain);
    snoreGain.connect(dest);

    snoreNoise.start();
    snoreLfo.start();

    const sighNoise = ctx.createBufferSource();
    sighNoise.buffer = getNoiseBuffer();
    sighNoise.loop = true;

    const sighFilter = ctx.createBiquadFilter();
    sighFilter.type = "lowpass";
    sighFilter.frequency.setValueAtTime(220, ctx.currentTime);

    const sighGain = ctx.createGain();
    sighGain.gain.setValueAtTime(0, ctx.currentTime);
    sighGain.gain.setValueAtTime(0.3, ctx.currentTime + 1.35);
    sighGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    sighNoise.connect(sighFilter);
    sighFilter.connect(sighGain);
    sighGain.connect(dest);

    setTimeout(() => {
      if (pad.isPlaying && ctx.state === "running") {
        try { sighNoise.start(); } catch(e) {}
      }
    }, 1300);

    oscs.push(snoreNoise, snoreLfo, sighNoise);
    nodes.push(snoreFilter, snoreLfoGain, snoreFlutter, snoreGain, sighFilter, sighGain);

  } else if (id === "cash") {
    // Cash Register
    const bellFrequencies = [980, 1370, 1550, 2100];
    bellFrequencies.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.2, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

      osc.connect(env);
      env.connect(dest);
      osc.start();

      oscs.push(osc);
      nodes.push(env);
    });

    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer();

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, ctx.currentTime);
    filter.Q.setValueAtTime(2.0, ctx.currentTime);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.setValueAtTime(0.35, ctx.currentTime + 0.08);
    
    const shakeLfo = ctx.createOscillator();
    shakeLfo.type = "sawtooth";
    shakeLfo.frequency.setValueAtTime(18, ctx.currentTime);
    
    const shakeLfoGain = ctx.createGain();
    shakeLfoGain.gain.setValueAtTime(0.3, ctx.currentTime);

    const flutter = ctx.createGain();
    flutter.gain.setValueAtTime(0.5, ctx.currentTime);
    shakeLfo.connect(shakeLfoGain);
    shakeLfoGain.connect(flutter.gain);

    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(flutter);
    flutter.connect(env);
    env.connect(dest);

    setTimeout(() => {
      if (pad.isPlaying && ctx.state === "running") {
        try {
          noise.start();
          shakeLfo.start();
        } catch(e) {}
      }
    }, 80);

    oscs.push(noise, shakeLfo);
    nodes.push(filter, shakeLfoGain, flutter, env);

  } else if (id === "cleanup") {
    // Supermarket PA chime + speak
    [0, 0.22].forEach((delay, index) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(index === 0 ? 554.37 : 440, ctx.currentTime + delay);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.setValueAtTime(0.35, ctx.currentTime + delay);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.6);

      const d = ctx.createDelay();
      d.delayTime.setValueAtTime(0.2, ctx.currentTime);
      const f = ctx.createGain();
      f.gain.setValueAtTime(0.35, ctx.currentTime);

      osc.connect(env);
      env.connect(dest);

      env.connect(d);
      d.connect(f);
      f.connect(d);
      d.connect(dest);

      setTimeout(() => {
        if (pad.isPlaying && ctx.state === "running") {
          try { osc.start(); } catch(e) {}
        }
      }, delay * 1000);

      oscs.push(osc);
      nodes.push(env, d, f);
    });

    setTimeout(() => {
      if (pad.isPlaying && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = "Clean up on aisle three.";
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        utterance.pitch = 0.95;
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const engVoice = voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-GB"));
          if (engVoice) utterance.voice = engVoice;
        }
        
        window.speechSynthesis.speak(utterance);
      }
    }, 850);

  } else if (id === "airhorn") {
    // Air Horn
    const baseFreqs = [220, 222, 330, 440, 660, 880];
    const gains = [1.0, 0.8, 0.7, 0.5, 0.3, 0.1];

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0, ctx.currentTime);
    oscGain.gain.linearRampToValueAtTime(0.65, ctx.currentTime + 0.015);
    
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(750, ctx.currentTime);
    filter.Q.setValueAtTime(1.8, ctx.currentTime);

    baseFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.94, ctx.currentTime + duration);

      const indGain = ctx.createGain();
      indGain.gain.setValueAtTime(gains[idx], ctx.currentTime);

      osc.connect(indGain);
      indGain.connect(oscGain);
      osc.start();
      oscs.push(osc);
    });

    oscGain.connect(filter);
    filter.connect(dest);

    oscs.push(oscGain);
    nodes.push(filter);
  }

  // Save references for cleanup
  pad.activeSources = oscs;
  pad.activeNodes = nodes;
}

// Cleanup active synth oscillators and intervals
function cleanupSynthNodes(pad) {
  if (pad.activeSources) {
    pad.activeSources.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch(e) {}
    });
    pad.activeSources = [];
  }
  if (pad.activeNodes) {
    pad.activeNodes.forEach(node => {
      try { node.disconnect(); } catch(e) {}
    });
    pad.activeNodes = [];
  }
  if (pad.clapperIntervals) {
    pad.clapperIntervals.forEach(id => clearInterval(id));
    pad.clapperIntervals = null;
  }
  if (pad.cricketsInterval) {
    clearInterval(pad.cricketsInterval);
    pad.cricketsInterval = null;
  }
  if ('speechSynthesis' in window && (pad.presetId === "stinks" || pad.presetId === "cleanup")) {
    window.speechSynthesis.cancel();
  }
}

// ==========================================
// Playing & Stopping Sound Controls
// ==========================================

async function playPad(index) {
  await resumeAudioContext();
  const pad = padStates[currentBank][index];

  // If already playing, stop first to restart (snappy MPC re-trigger)
  if (pad.isPlaying) {
    stopPad(index);
  }

  pad.isPlaying = true;
  setPadUIState(index, true);

  // 1. Play loaded AudioBuffer (either local file or cached web sound)
  if (pad.audioBuffer) {
    const sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = pad.audioBuffer;
    sourceNode.loop = pad.loop;
    
    // Connect to pad gain node
    sourceNode.connect(pad.gainNode);
    pad.activeSources.push(sourceNode);

    sourceNode.onended = () => {
      pad.activeSources = pad.activeSources.filter(src => src !== sourceNode);
      if (pad.activeSources.length === 0 && !pad.loop) {
        pad.isPlaying = false;
        setPadUIState(index, false);
      }
    };

    sourceNode.start(0);

  // 2. Play preset sound (fetched buffer or synth fallback)
  } else if (pad.presetId) {
    playSynthSound(pad.presetId, pad.gainNode, pad.duration, pad);

    // Timeout release
    pad.playTimeout = setTimeout(() => {
      if (pad.loop && pad.isPlaying) {
        cleanupSynthNodes(pad);
        playPad(index); // loop trigger
      } else {
        stopPad(index);
      }
    }, pad.duration * 1000);

  // 3. Play Web/GitHub Sound that hasn't loaded or failed
  } else if (pad.url && !pad.audioBuffer) {
    // If it's a web sound but not decoded yet, fetch and decode, then play
    setPadUIState(index, true);
    try {
      await fetchAndDecodeSound(pad, pad.url);
      if (pad.audioBuffer && pad.isPlaying) {
        // Recurse play now that buffer is decoded
        pad.isPlaying = false; // reset state before play
        playPad(index);
      } else {
        stopPad(index);
      }
    } catch(e) {
      stopPad(index);
    }
  } else if (pad.customFile && !pad.audioBuffer) {
    // If local file is not decoded yet, decode it, then play
    setPadUIState(index, true);
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const ab = e.target.result;
      decodeAudioDataSafe(ab, pad.customFile.name)
        .then((decoded) => {
          pad.audioBuffer = decoded;
          if (pad.isPlaying) {
            pad.isPlaying = false;
            playPad(index);
          }
        })
        .catch((err) => {
          stopPad(index);
          console.error("Decoding custom file failed:", err);
        });
    };
    fileReader.readAsArrayBuffer(pad.customFile);
  } else {
    // Empty pad
    pad.isPlaying = false;
    setPadUIState(index, false);
  }
}

function stopPad(index) {
  const pad = padStates[currentBank][index];
  if (!pad.isPlaying) return;

  pad.isPlaying = false;
  setPadUIState(index, false);

  if (pad.playTimeout) {
    clearTimeout(pad.playTimeout);
    pad.playTimeout = null;
  }

  // Stop buffer source node
  if (pad.activeSources) {
    pad.activeSources.forEach(source => {
      try { source.stop(); source.disconnect(); } catch(e) {}
    });
    pad.activeSources = [];
  }

  cleanupSynthNodes(pad);
}

function stopAllSounds() {
  const pads = padStates[currentBank];
  pads.forEach((_, index) => {
    stopPad(index);
  });
}

function setPadUIState(index, active) {
  const padEl = document.querySelector(`[data-index="${index}"]`);
  const stopBtn = padEl ? padEl.querySelector(".pad-stop-btn") : null;
  
  if (active) {
    if (padEl) padEl.classList.add("playing");
    if (stopBtn) stopBtn.removeAttribute("disabled");
  } else {
    if (padEl) padEl.classList.remove("playing");
    if (stopBtn) stopBtn.setAttribute("disabled", "true");
  }
}

// ==========================================
// Custom Audio Upload Handlers
// ==========================================

// Fetch and decode a remote sound with global caching
async function fetchAndDecodeSound(pad, url) {
  if (urlCache[url]) {
    pad.audioBuffer = urlCache[url];
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    
    const decoded = await decodeAudioDataSafe(arrayBuffer, url);
    urlCache[url] = decoded;
    pad.audioBuffer = decoded;
  } catch (e) {
    console.error("Failed to fetch hosted audio:", e);
    pad.title = "Load Error";
    updatePadDOM(Object.keys(padStates[currentBank]).find(k => padStates[currentBank][k] === pad));
    throw e;
  }
}

async function handleAbletonClip(index, file) {
  const fileReader = new FileReader();
  fileReader.onload = async (e) => {
    const buffer = e.target.result;
    let xmlText = "";
    
    // Check if gzipped (magic bytes: 0x1f, 0x8b)
    const isGzipped = new Uint8Array(buffer.slice(0, 2))[0] === 0x1f && new Uint8Array(buffer.slice(0, 2))[1] === 0x8b;
    
    try {
      if (isGzipped) {
        // Decompress using Compression Streams API (DecompressionStream)
        const response = new Response(buffer);
        const decompressedStream = response.body.pipeThrough(new DecompressionStream("gzip"));
        xmlText = await new Response(decompressedStream).text();
      } else {
        xmlText = new TextDecoder().decode(buffer);
      }

      // Parse XML or search for file references
      const nameRegex = /Name\s+Value="([^"]+\.(?:wav|aif|aiff|flac|mp3|m4a|mp4|aac|ogg))"/i;
      const fileRefRegex = /<FileRef[^>]*>[\s\S]*?<Name\s+Value="([^"]+)"/i;
      
      let refName = "";
      let match = xmlText.match(fileRefRegex);
      if (match) {
        refName = match[1];
      } else {
        match = xmlText.match(nameRegex);
        if (match) refName = match[1];
      }
      
      if (refName) {
        alert(`Ableton Clip (.alc) loaded!\n\nThis clip references the audio sample:\n👉 "${refName}"\n\nSince browsers cannot access local files directly, please locate and drag-and-drop the actual file "${refName}" (or click the pad to choose it) to load the audio.`);
      } else {
        alert("Ableton Clip (.alc) parsed, but we couldn't locate a direct audio file reference inside the metadata. Please upload the raw WAV/AIFF audio file directly.");
      }
    } catch (err) {
      console.error("Failed to parse Ableton Live Clip:", err);
      alert("This Ableton Clip (.alc) could not be parsed. Please upload the raw audio file (.wav, .aif, .aiff) instead.");
    }
  };
  fileReader.readAsArrayBuffer(file);
}

async function handleAudioUpload(index, file) {
  await resumeAudioContext();
  const pad = padStates[currentBank][index];

  // Stop current if playing
  stopPad(index);

  const lowerName = file.name.toLowerCase();

  // Ableton specific formats checks
  if (lowerName.endsWith(".alc")) {
    handleAbletonClip(index, file);
    return;
  }

  if (lowerName.endsWith(".asd")) {
    alert("This is an Ableton Analysis File (.asd), which stores warp markers and wave shape metadata, but does not contain playable audio.\n\nPlease upload the original audio file (e.g. .wav or .aiff file with the same name) instead.");
    return;
  }

  if (lowerName.endsWith(".als")) {
    alert("This is an Ableton Live Set (.als), which represents a full Ableton project.\n\nPlease bounce/export your track or clip to a WAV, AIFF, or FLAC audio file from Ableton Live first, then load that audio file here.");
    return;
  }

  // Open the audio trimmer modal for cropping
  openAudioTrimmerModal(index, file);
}

// Reload custom user sounds from IndexedDB on page load/bank switch
async function loadCustomSoundsFromDB() {
  const pads = padStates[currentBank];
  for (let i = 0; i < pads.length; i++) {
    const saved = await loadPadDataFromDB(currentBank, i);
    if (saved) {
      const pad = pads[i];
      pad.presetId = null;

      // Case A: Stored remote Web URL sound
      if (saved.type === "web") {
        pad.title = saved.title;
        pad.url = saved.url;
        pad.customFile = null;
        pad.volume = saved.volume !== undefined ? saved.volume : 1.0;
        pad.loop = saved.loop !== undefined ? saved.loop : false;

        if (pad.gainNode && audioCtx) {
          pad.gainNode.gain.setValueAtTime(pad.volume, audioCtx.currentTime);
        }

      // Case B: Stored local uploaded File sound
      } else if (saved.type === "local" || saved instanceof File) {
        const file = saved instanceof File ? saved : saved.file;
        pad.customFile = file;
        pad.url = null;
        pad.volume = saved.volume !== undefined ? saved.volume : 1.0;
        pad.loop = saved.loop !== undefined ? saved.loop : false;
        
        let name = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        if (name.length > 16) name = name.substring(0, 14) + "...";
        pad.title = name;

        if (pad.gainNode && audioCtx) {
          pad.gainNode.gain.setValueAtTime(pad.volume, audioCtx.currentTime);
        }
      }
    }
  }

  // Update UI and trigger decoding if AudioContext is initialized
  for (let i = 0; i < pads.length; i++) {
    updatePadDOM(i);
  }
  if (audioCtx) {
    decodeAllLoadedCustomSounds();
  }
}

// Reset Soundboard
async function resetBoard() {
  if (confirm("Are you sure you want to reset the soundboard? This will delete all your uploaded custom sound pads across all banks.")) {
    stopAllSounds();
    await clearDB();
    
    // Reinitialize state
    Object.keys(padStates).forEach(bankKey => {
      padStates[bankKey] = Array.from({ length: 16 }, (_, i) => createInitialPad(i, bankKey));
      padStates[bankKey].forEach(pad => {
        if (audioCtx) setupPadGainNode(pad);
      });
    });

    if (audioCtx) {
      await loadPresetFiles();
    }

    renderSoundboard();
  }
}

// ==========================================
// Pad Configuration Modal Managers
// ==========================================

function openPadConfigModal(index) {
  resumeAudioContext();
  editingPadIndex = index;
  
  const modal = document.getElementById("pad-config-modal");
  const padNumSpan = document.getElementById("modal-pad-num");
  const searchInput = document.getElementById("modal-sound-search");

  // Reset modal state
  padNumSpan.textContent = index + 1;
  searchInput.value = "";
  
  // Show Step 1, hide Step 2
  document.getElementById("modal-step-choose").classList.remove("hidden");
  document.getElementById("modal-step-search").classList.add("hidden");

  // Show modal overlay
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");

  // Populate curated list in background
  renderModalSoundList("");
}

function closePadConfigModal() {
  const modal = document.getElementById("pad-config-modal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  editingPadIndex = null;
}

function renderModalSoundList(query) {
  const listContainer = document.getElementById("modal-sound-list");
  listContainer.innerHTML = "";

  const filtered = WEB_SOUNDS.filter(s => 
    s.title.toLowerCase().includes(query.toLowerCase()) || 
    s.category.toLowerCase().includes(query.toLowerCase())
  );

  filtered.forEach(sound => {
    const item = document.createElement("div");
    item.className = "modal-sound-item";
    item.innerHTML = `
      <div class="modal-sound-info">
        <span class="modal-sound-title">${sound.title}</span>
      </div>
      <span class="modal-sound-category">${sound.category}</span>
    `;

    // Click sound item to select
    item.addEventListener("click", async () => {
      const pad = padStates[currentBank][editingPadIndex];
      stopPad(editingPadIndex);

      // Save properties
      pad.title = sound.title;
      pad.url = sound.url;
      pad.presetId = null;
      pad.customFile = null;
      pad.audioBuffer = null; // Clear old buffer

      // Store in DB
      try {
        await savePadDataToDB(currentBank, editingPadIndex, {
          type: "web",
          title: sound.title,
          url: sound.url,
          volume: pad.volume,
          loop: pad.loop
        });
      } catch (err) {
        console.error("Failed to save web metadata to DB:", err);
      }

      // Render pad details
      updatePadDOM(editingPadIndex);
      closePadConfigModal();

      // Trigger fetch-and-decode immediately in background
      fetchAndDecodeSound(pad, sound.url).then(() => {
        updatePadDOM(editingPadIndex);
      }).catch(() => {});
    });

    listContainer.appendChild(item);
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `<div style="text-align:center; padding: 1.5rem; font-size: 0.75rem; font-weight:700; color: var(--text-muted);">No matching sounds found.</div>`;
  }
}

// ==========================================
// Rendering and DOM Managers
// ==========================================

function renderSoundboard() {
  const grid = document.getElementById("soundboard-grid");
  grid.innerHTML = "";

  const pads = padStates[currentBank];
  pads.forEach((pad, index) => {
    const card = document.createElement("article");
    card.className = "sound-card";
    card.setAttribute("data-index", index);
    
    card.innerHTML = `
      <div class="card-header">
        <span class="hotkey-badge">${getHotkeyText(index)}</span>
        <div style="display:flex; gap:0.25rem;">
          <button class="loop-btn-pad ${pad.loop ? 'active' : ''}" aria-label="Loop pad" title="Toggle Loop">L</button>
          <button class="loop-btn-pad pad-edit-btn" aria-label="Configure pad" title="Configure Pad">E</button>
        </div>
      </div>
      <div class="pad-info">
        <span class="pad-title">${pad.title}</span>
        <span class="pad-subtitle">${getPadSubtitle(pad)}</span>
      </div>
      <div class="card-controls">
        <input type="range" class="pad-vol-slider" min="0" max="1.5" step="0.05" value="${pad.volume}" aria-label="Pad volume" title="Pad Volume">
        <button class="pad-stop-btn" aria-label="Stop pad" disabled>■</button>
      </div>
      <input type="file" class="hidden-file-input" accept="audio/*, .wav, .aif, .aiff, .flac, .mp3, .m4a, .aac, .ogg, .alc, .asd, .als">
    `;

    // Click trigger playing
    card.addEventListener("click", () => {
      playPad(index);
    });

    // Edit button opens modal
    card.querySelector(".pad-edit-btn").addEventListener("click", (e) => {
      e.stopPropagation(); // Stop play click trigger
      openPadConfigModal(index);
    });

    // Double-click is still supported as a shortcut to open the modal
    card.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      openPadConfigModal(index);
    });

    // Hidden input change trigger (for local file option)
    card.querySelector(".hidden-file-input").addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleAudioUpload(index, e.target.files[0]);
      }
    });

    // Loop trigger toggle
    card.querySelector(".loop-btn-pad:not(.pad-edit-btn)").addEventListener("click", async (e) => {
      e.stopPropagation();
      pad.loop = !pad.loop;
      e.target.classList.toggle("active", pad.loop);
      if (pad.customFile || pad.url) {
        await saveCustomPadSettings(currentBank, index, pad);
      }
    });

    // Stop pad trigger
    card.querySelector(".pad-stop-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      stopPad(index);
    });

    // Volume slider trigger
    card.querySelector(".pad-vol-slider").addEventListener("click", (e) => {
      e.stopPropagation();
    });

    card.querySelector(".pad-vol-slider").addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      pad.volume = val;
      if (pad.gainNode && audioCtx) {
        pad.gainNode.gain.setValueAtTime(val, audioCtx.currentTime);
      }
    });

    card.querySelector(".pad-vol-slider").addEventListener("change", async (e) => {
      if (pad.customFile || pad.url) {
        await saveCustomPadSettings(currentBank, index, pad);
      }
    });

    // Drag-and-Drop events
    card.addEventListener("dragenter", (e) => {
      e.preventDefault();
      card.classList.add("drag-over");
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("drag-over");
      if (e.dataTransfer.files.length > 0) {
        handleAudioUpload(index, e.dataTransfer.files[0]);
      }
    });

    grid.appendChild(card);
  });
}

function updatePadDOM(index) {
  const pad = padStates[currentBank][index];
  const padEl = document.querySelector(`[data-index="${index}"]`);
  if (!padEl) return;

  padEl.querySelector(".pad-title").textContent = pad.title;
  padEl.querySelector(".pad-subtitle").textContent = getPadSubtitle(pad);
}

function getPadSubtitle(pad) {
  if (pad.presetId) return "Preset";
  if (pad.customFile) return "Custom File";
  if (pad.url) return "GitHub Audio";
  return "Empty Slot";
}

function getHotkeyText(index) {
  return Object.keys(keyMap).find(key => keyMap[key] === index).toUpperCase();
}

// ==========================================
// Canvas Audio Visualizer
// ==========================================

function startVisualizer() {
  const canvas = document.getElementById("visualizer-canvas");
  const canvasCtx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.parentElement.clientHeight * window.devicePixelRatio;
    canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    animationFrameId = requestAnimationFrame(draw);

    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    // Clear Canvas
    canvasCtx.fillStyle = "#ffffff";
    canvasCtx.fillRect(0, 0, width, height);

    if (visualizerMode === "wave") {
      analyserNode.getByteTimeDomainData(dataArray);

      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = "#000000";
      canvasCtx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(width, height / 2);
      canvasCtx.stroke();
    } else {
      analyserNode.getByteFrequencyData(dataArray);

      const barWidth = (width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      canvasCtx.fillStyle = "#000000";

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 4.2;
        canvasCtx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    }
  }

  draw();
}

// ==========================================
// Setup User Interface Listeners
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  // Render Soundboard on load
  renderSoundboard();

  // Load Custom Sounds from DB
  openDB().then(() => {
    loadCustomSoundsFromDB();
  });

  // Set up ResizeObserver for Trimmer Waveform Canvas to handle layout reflows dynamically
  const trimmerObserverCanvas = document.getElementById("trimmer-waveform-canvas");
  if (trimmerObserverCanvas) {
    const trimmerResizeObserver = new ResizeObserver(() => {
      if (trimmerAudioBuffer) {
        drawTrimmerWaveform();
      }
    });
    trimmerResizeObserver.observe(trimmerObserverCanvas);
  }

  // Bank Switches
  const bankButtons = document.querySelectorAll(".bank-btn");
  bankButtons.forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const targetBank = e.target.getAttribute("data-bank");
      if (currentBank === targetBank) return;

      // Stop sounds of active bank first
      stopAllSounds();

      // Toggle Active buttons
      bankButtons.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");

      // Switch state and re-render
      currentBank = targetBank;
      
      if (audioCtx) {
        padStates[currentBank].forEach(pad => {
          setupPadGainNode(pad);
        });
      }

      renderSoundboard();
      await loadCustomSoundsFromDB();
    });
  });

  // Global Volume Slider
  const globalVolInput = document.getElementById("global-volume");
  const globalVolValue = document.getElementById("global-volume-value");

  globalVolInput.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    globalVolValue.textContent = `${Math.round(val * 100)}%`;
    if (globalGainNode) {
      globalGainNode.gain.setValueAtTime(val, audioCtx.currentTime);
    }
  });

  // Action Buttons
  document.getElementById("btn-stop-all").addEventListener("click", () => {
    stopAllSounds();
  });

  document.getElementById("btn-clear-custom").addEventListener("click", () => {
    resetBoard();
  });

  // Visualizer Mode toggle
  document.getElementById("viz-mode-wave").addEventListener("click", (e) => {
    visualizerMode = "wave";
    e.target.classList.add("active");
    document.getElementById("viz-mode-freq").classList.remove("active");
  });

  document.getElementById("viz-mode-freq").addEventListener("click", (e) => {
    visualizerMode = "freq";
    e.target.classList.add("active");
    document.getElementById("viz-mode-wave").classList.remove("active");
  });

  // ==========================================
  // Modal Event Listeners
  // ==========================================
  
  const modal = document.getElementById("pad-config-modal");
  const closeBtn = document.getElementById("modal-close-btn");
  const sourceLocalBtn = document.getElementById("btn-source-local");
  const sourceWebBtn = document.getElementById("btn-source-web");
  const searchBackBtn = document.getElementById("btn-search-back");
  const modalSearchInput = document.getElementById("modal-sound-search");

  // Close modal click
  closeBtn.addEventListener("click", closePadConfigModal);
  
  // Close on overlay backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closePadConfigModal();
  });

  // Select Option Local: open file picker
  sourceLocalBtn.addEventListener("click", async () => {
    await resumeAudioContext();
    const activeCard = document.querySelector(`[data-index="${editingPadIndex}"]`);
    if (activeCard) {
      activeCard.querySelector(".hidden-file-input").click();
    }
    closePadConfigModal();
  });

  // Select Option Web: open step 2 search catalog
  sourceWebBtn.addEventListener("click", () => {
    document.getElementById("modal-step-choose").classList.add("hidden");
    document.getElementById("modal-step-search").classList.remove("hidden");
    modalSearchInput.focus();
  });

  // Back to select step
  searchBackBtn.addEventListener("click", () => {
    document.getElementById("modal-step-search").classList.add("hidden");
    document.getElementById("modal-step-choose").classList.remove("hidden");
  });

  // Search input change in modal
  modalSearchInput.addEventListener("input", (e) => {
    renderModalSoundList(e.target.value);
  });

  // Keyboard Hotkey triggers (4x4 matrix)
  window.addEventListener("keydown", (e) => {
    if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
      return;
    }

    const key = e.key.toLowerCase();

    // Stop all on Spacebar
    if (key === " " || key === "spacebar") {
      e.preventDefault();
      stopAllSounds();
      return;
    }

    const padIndex = keyMap[key];
    if (padIndex !== undefined) {
      e.preventDefault();
      
      // Simulate hardware click press styling
      const padEl = document.querySelector(`[data-index="${padIndex}"]`);
      if (padEl) padEl.classList.add("keyboard-active");
      
      playPad(padIndex);
    }
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    const padIndex = keyMap[key];
    if (padIndex !== undefined) {
      const padEl = document.querySelector(`[data-index="${padIndex}"]`);
      if (padEl) padEl.classList.remove("keyboard-active");
    }
  });

  // ==========================================
  // Audio Trimmer Modal Event Listeners
  // ==========================================
  const trimmerModal = document.getElementById("audio-trimmer-modal");
  const trimmerCloseBtn = document.getElementById("trimmer-close-btn");
  const trimmerCancelBtn = document.getElementById("btn-trimmer-cancel");
  const trimmerPreviewBtn = document.getElementById("btn-trimmer-preview");
  const trimmerSaveBtn = document.getElementById("btn-trimmer-save");
  const trimmerRange = document.getElementById("trimmer-range");
  const trimmerCanvas = document.getElementById("trimmer-waveform-canvas");

  trimmerCloseBtn.addEventListener("click", closeAudioTrimmerModal);
  trimmerCancelBtn.addEventListener("click", closeAudioTrimmerModal);
  
  trimmerModal.addEventListener("click", (e) => {
    if (e.target === trimmerModal) closeAudioTrimmerModal();
  });

  trimmerRange.addEventListener("input", (e) => {
    if (!trimmerAudioBuffer) return;
    trimmerStartSec = parseFloat(e.target.value);
    const duration = trimmerAudioBuffer.duration;
    const sliceDuration = Math.min(5, duration);

    document.getElementById("trimmer-start-time").textContent = `Start: ${formatTime(trimmerStartSec)}`;
    document.getElementById("trimmer-end-time").textContent = `End: ${formatTime(trimmerStartSec + sliceDuration)}`;

    // Stop active preview when scrubbing
    stopTrimmerPreview();

    drawTrimmerWaveform();
  });

  trimmerPreviewBtn.addEventListener("click", toggleTrimmerPreview);
  trimmerSaveBtn.addEventListener("click", saveTrimmedClip);

  // Drag and click on canvas to select audio slice visually
  let isCanvasDragging = false;

  function updateTrimmerFromClick(offsetX) {
    if (!trimmerAudioBuffer) return;
    const duration = trimmerAudioBuffer.duration;
    const sliceDuration = Math.min(5, duration);
    const canvasWidth = trimmerCanvas.clientWidth;
    
    // Calculate clicked time offset
    const clickTime = (offsetX / canvasWidth) * duration;
    
    // Center the 5-second slice on the cursor
    trimmerStartSec = Math.max(0, Math.min(duration - sliceDuration, clickTime - sliceDuration / 2));
    
    // Update range input slider
    trimmerRange.value = trimmerStartSec;
    
    // Update timestamps
    document.getElementById("trimmer-start-time").textContent = `Start: ${formatTime(trimmerStartSec)}`;
    document.getElementById("trimmer-end-time").textContent = `End: ${formatTime(trimmerStartSec + sliceDuration)}`;
    
    // Stop active preview
    stopTrimmerPreview();
    
    // Re-render
    drawTrimmerWaveform();
  }

  trimmerCanvas.addEventListener("mousedown", (e) => {
    isCanvasDragging = true;
    updateTrimmerFromClick(e.offsetX);
  });

  trimmerCanvas.addEventListener("mousemove", (e) => {
    if (isCanvasDragging) {
      updateTrimmerFromClick(e.offsetX);
    }
  });

  window.addEventListener("mouseup", () => {
    isCanvasDragging = false;
  });

  // Touch triggers
  trimmerCanvas.addEventListener("touchstart", (e) => {
    isCanvasDragging = true;
    const rect = e.target.getBoundingClientRect();
    const offsetX = e.touches[0].clientX - rect.left;
    updateTrimmerFromClick(offsetX);
    e.preventDefault();
  }, { passive: false });

  trimmerCanvas.addEventListener("touchmove", (e) => {
    if (isCanvasDragging) {
      const rect = e.target.getBoundingClientRect();
      const offsetX = e.touches[0].clientX - rect.left;
      updateTrimmerFromClick(offsetX);
      e.preventDefault();
    }
  }, { passive: false });

  trimmerCanvas.addEventListener("touchend", () => {
    isCanvasDragging = false;
  });
});

// ==========================================
// Audio Trimmer Helpers and Processing
// ==========================================

function openAudioTrimmerModal(padIndex, file) {
  trimmerTargetPadIndex = padIndex;
  trimmerFile = file;
  trimmerAudioBuffer = null;
  trimmerStartSec = 0;
  trimmerPreviewSource = null;

  const modal = document.getElementById("audio-trimmer-modal");
  const loadingOverlay = document.getElementById("trimmer-loading-overlay");
  const contentDiv = document.getElementById("trimmer-content");
  const previewBtn = document.getElementById("btn-trimmer-preview");
  const saveBtn = document.getElementById("btn-trimmer-save");

  // Reset UI elements
  loadingOverlay.classList.remove("hidden");
  contentDiv.classList.add("hidden");
  previewBtn.setAttribute("disabled", "true");
  saveBtn.setAttribute("disabled", "true");
  previewBtn.textContent = "Preview Trim";

  // Show Trimmer Modal
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");

  // Read and decode the audio file asynchronously
  const fileReader = new FileReader();
  fileReader.onload = async (e) => {
    try {
      const buffer = e.target.result;
      if (!audioCtx) {
        initAudio();
      }
      
      // Force resume suspended AudioContext
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      decodeAudioDataSafe(buffer, trimmerFile.name)
        .then((decodedBuffer) => {
          try {
            trimmerAudioBuffer = decodedBuffer;
            
            // Hide loading spinner and show trimmer controls
            loadingOverlay.classList.add("hidden");
            contentDiv.classList.remove("hidden");
            previewBtn.removeAttribute("disabled");
            saveBtn.removeAttribute("disabled");

            // Setup scrubber range input values
            const rangeSlider = document.getElementById("trimmer-range");
            const maxScroll = Math.max(0, trimmerAudioBuffer.duration - 5);
            rangeSlider.min = "0";
            rangeSlider.max = maxScroll.toString();
            rangeSlider.step = "0.02";
            rangeSlider.value = "0";

            // Setup initial labels
            const sliceDuration = Math.min(5, trimmerAudioBuffer.duration);
            document.getElementById("trimmer-start-time").textContent = "Start: 0.0s";
            document.getElementById("trimmer-end-time").textContent = `End: ${formatTime(sliceDuration)}`;
            document.getElementById("trimmer-total-duration").textContent = `Total: ${formatTime(trimmerAudioBuffer.duration)}`;

            // Render waveform after a short delay to allow browser layout calculations
            setTimeout(drawTrimmerWaveform, 50);
          } catch (innerErr) {
            console.error("Trimmer initialization error:", innerErr);
            alert("Error rendering trimmer: " + innerErr.message);
            closeAudioTrimmerModal();
          }
        })
        .catch((err) => {
          console.error("AudioContext decodeAudioData error:", err);
          alert("Failed to decode audio file. Please check file format.");
          closeAudioTrimmerModal();
        });
    } catch (err) {
      console.error("FileReader onload error:", err);
      alert("Error reading file: " + err.message);
      closeAudioTrimmerModal();
    }
  };
  fileReader.readAsArrayBuffer(file);
}

function closeAudioTrimmerModal() {
  const modal = document.getElementById("audio-trimmer-modal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");

  stopTrimmerPreview();

  trimmerFile = null;
  trimmerAudioBuffer = null;
  trimmerTargetPadIndex = null;
}

function formatTime(sec) {
  if (isNaN(sec) || sec === null || sec === undefined) return "0.0s";
  const mins = Math.floor(sec / 60);
  const secsVal = (sec % 60).toFixed(1);
  
  if (mins > 0) {
    const paddedSecs = secsVal.length < 4 ? "0" + secsVal : secsVal;
    return `${mins}:${paddedSecs}`;
  } else {
    return `${secsVal}s`;
  }
}

function drawTrimmerWaveform() {
  const canvas = document.getElementById("trimmer-waveform-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  // Use parent container dimensions, fall back to safe defaults if they are zero
  const parentWidth = canvas.parentElement.clientWidth || 600;
  const parentHeight = canvas.parentElement.clientHeight || 120;
  
  if (parentWidth <= 0 || parentHeight <= 0) return;

  // Use window.devicePixelRatio for high-DPI crisp rendering
  const dpr = window.devicePixelRatio || 1;
  canvas.width = parentWidth * dpr;
  canvas.height = parentHeight * dpr;
  ctx.scale(dpr, dpr);

  const width = parentWidth;
  const height = parentHeight;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  if (!trimmerAudioBuffer) return;

  const leftChannel = trimmerAudioBuffer.getChannelData(0);
  const barWidth = 2;
  const gap = 1;
  const totalBars = Math.floor(width / (barWidth + gap));
  
  if (totalBars <= 0) return;

  const step = Math.ceil(leftChannel.length / totalBars);
  const amp = height / 2.2;

  ctx.fillStyle = "#000000"; // Brutalist black bars

  for (let i = 0; i < totalBars; i++) {
    let min = 1.0;
    let max = -1.0;
    for (let j = 0; j < step; j++) {
      const idx = i * step + j;
      if (idx < leftChannel.length) {
        const datum = leftChannel[idx];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
    }
    
    // Draw vertical bar representing min/max peak
    const x = i * (barWidth + gap);
    const y1 = (1 + min) * amp;
    const y2 = (1 + max) * amp;
    const barHeight = Math.max(1, y2 - y1);
    ctx.fillRect(x, y1, barWidth, barHeight);
  }

  // Draw Highlight selection slice
  const duration = trimmerAudioBuffer.duration;
  const sliceDuration = Math.min(5, duration);

  const startPercent = trimmerStartSec / duration;
  const durationPercent = sliceDuration / duration;

  const startX = startPercent * width;
  const sliceWidth = durationPercent * width;

  ctx.fillStyle = "rgba(57, 255, 20, 0.18)"; // transparent neon green
  ctx.fillRect(startX, 0, sliceWidth, height);

  ctx.strokeStyle = "#39ff14";
  ctx.lineWidth = 2.0;
  ctx.strokeRect(startX, 0, sliceWidth, height);

  // Draw red playhead if preview is playing
  if (trimmerPreviewSource && trimmerPreviewStartTime !== null) {
    const elapsed = audioCtx.currentTime - trimmerPreviewStartTime;
    const currentPlayTime = Math.min(trimmerStartSec + sliceDuration, trimmerStartSec + elapsed);
    const playheadPercent = currentPlayTime / duration;
    const playheadX = playheadPercent * width;

    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }
}

function toggleTrimmerPreview() {
  if (trimmerPreviewSource) {
    stopTrimmerPreview();
    return;
  }

  const sliceDuration = Math.min(5, trimmerAudioBuffer.duration);
  trimmerPreviewSource = audioCtx.createBufferSource();
  trimmerPreviewSource.buffer = trimmerAudioBuffer;
  trimmerPreviewSource.connect(globalGainNode);

  trimmerPreviewSource.onended = () => {
    trimmerPreviewSource = null;
    trimmerPreviewStartTime = null;
    document.getElementById("btn-trimmer-preview").textContent = "Preview Trim";
    drawTrimmerWaveform(); // Redraw once to clear playhead line
  };

  trimmerPreviewStartTime = audioCtx.currentTime;
  trimmerPreviewSource.start(0, trimmerStartSec, sliceDuration);
  document.getElementById("btn-trimmer-preview").textContent = "Stop Preview";

  // Start playhead animation
  animateTrimmerPlayhead();
}

function stopTrimmerPreview() {
  if (trimmerPreviewSource) {
    try { trimmerPreviewSource.stop(); } catch (e) {}
    trimmerPreviewSource = null;
    trimmerPreviewStartTime = null;
  }
  document.getElementById("btn-trimmer-preview").textContent = "Preview Trim";
  drawTrimmerWaveform(); // Redraw once to clear playhead line
}

function animateTrimmerPlayhead() {
  if (!trimmerPreviewSource) return;
  drawTrimmerWaveform();
  requestAnimationFrame(animateTrimmerPlayhead);
}

async function saveTrimmedClip() {
  if (!trimmerAudioBuffer) return;

  stopTrimmerPreview();

  const sliceDuration = Math.min(5, trimmerAudioBuffer.duration);
  const sampleRate = trimmerAudioBuffer.sampleRate;
  const startSample = Math.floor(trimmerStartSec * sampleRate);
  const numSamples = Math.round(sliceDuration * sampleRate);

  // Sliced Buffer creation
  const trimmedBuffer = audioCtx.createBuffer(
    trimmerAudioBuffer.numberOfChannels,
    numSamples,
    sampleRate
  );

  for (let channel = 0; channel < trimmerAudioBuffer.numberOfChannels; channel++) {
    const origData = trimmerAudioBuffer.getChannelData(channel);
    const trimmedData = trimmedBuffer.getChannelData(channel);
    for (let i = 0; i < numSamples; i++) {
      const srcIdx = startSample + i;
      trimmedData[i] = srcIdx < origData.length ? origData[srcIdx] : 0;
    }
  }

  // Encode to WAV
  const wavBlob = bufferToWav(trimmedBuffer);
  const originalBase = trimmerFile.name.substring(0, trimmerFile.name.lastIndexOf('.')) || trimmerFile.name;
  const newFileName = `${originalBase}_clip.wav`;
  const newFile = new File([wavBlob], newFileName, { type: "audio/wav" });

  const pad = padStates[currentBank][trimmerTargetPadIndex];
  
  // Stop pad if playing
  stopPad(trimmerTargetPadIndex);

  pad.audioBuffer = trimmedBuffer;
  pad.customFile = newFile;
  pad.presetId = null;
  pad.url = null;

  let name = newFileName.substring(0, newFileName.lastIndexOf('.')) || newFileName;
  if (name.length > 16) name = name.substring(0, 14) + "...";
  pad.title = name;

  // Save to IndexedDB
  try {
    await savePadDataToDB(currentBank, trimmerTargetPadIndex, {
      type: "local",
      name: newFileName,
      file: newFile,
      volume: pad.volume,
      loop: pad.loop
    });
  } catch (err) {
    console.error("Failed to save trimmed clip to DB:", err);
  }

  updatePadDOM(trimmerTargetPadIndex);
  closeAudioTrimmerModal();
}

// ==========================================
// JavaScript AudioBuffer to WAV File Encoder
// ==========================================

function bufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // 1 = raw PCM (16-bit)
  const bitDepth = 16;
  
  let result;
  if (numOfChan === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }
  
  const bufferLength = result.length * 2;
  const wavBuffer = new ArrayBuffer(44 + bufferLength);
  const view = new DataView(wavBuffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + bufferLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, bufferLength, true);
  
  // Write PCM audio samples
  floatTo16BitPCM(view, 44, result);
  
  return new Blob([view], { type: 'audio/wav' });
}

function interleave(inputL, inputR) {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;
  
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// ==========================================
// Custom AIFF (Audio Interchange File) Decoder
// ==========================================

function decodeAudioDataSafe(buffer, filename) {
  return new Promise((resolve, reject) => {
    let triedAIFF = false;

    // If it's a .aif or .aiff file, try custom AIFF decoder
    if (filename && (filename.toLowerCase().endsWith(".aif") || filename.toLowerCase().endsWith(".aiff"))) {
      triedAIFF = true;
      try {
        const decoded = decodeAIFF(buffer);
        resolve(decoded);
        return;
      } catch (err) {
        console.warn("Custom AIFF decoder failed, falling back to Web Audio decodeAudioData...", err);
      }
    }
    
    // Fall back to native decodeAudioData
    if (!audioCtx) {
      initAudio();
    }
    
    // decodeAudioData detaches/neuters the input buffer.
    // We clone it using slice(0) so the original remains intact if we need the AIFF fallback.
    let bufferClone;
    try {
      bufferClone = buffer.slice(0);
    } catch (sliceErr) {
      bufferClone = buffer;
    }

    audioCtx.decodeAudioData(bufferClone, (decoded) => {
      resolve(decoded);
    }, (err) => {
      if (triedAIFF) {
        reject(err);
        return;
      }

      // Final fallback try to decode as AIFF in case the extension was renamed/missing
      try {
        const decoded = decodeAIFF(buffer);
        resolve(decoded);
      } catch (finalErr) {
        reject(err || finalErr);
      }
    });
  });
}

function decodeAIFF(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  
  // Verify FORM header (AIFF/AIFC format indicator)
  if (view.getUint32(0, false) !== 0x464F524D) { // "FORM"
    throw new Error("Not a valid FORM/AIFF file (missing FORM tag)");
  }
  
  const fileType = view.getUint32(8, false);
  if (fileType !== 0x41494646 && fileType !== 0x41494643) { // "AIFF" or "AIFC"
    throw new Error("Not a valid AIFF or AIFC file (unsupported format code)");
  }
  
  let channels = 0;
  let sampleFrames = 0;
  let sampleSize = 0;
  let sampleRate = 0;
  let ssndOffset = 0;
  let ssndLength = 0;
  let compressionType = 0; // 0 = standard Big Endian PCM
  
  let offset = 12;
  while (offset < arrayBuffer.byteLength - 8) {
    const chunkId = view.getUint32(offset, false);
    const chunkLen = view.getUint32(offset + 4, false);
    
    if (chunkId === 0x434F4D4D) { // "COMM"
      channels = view.getUint16(offset + 8, false);
      sampleFrames = view.getUint32(offset + 10, false);
      sampleSize = view.getUint16(offset + 14, false);
      sampleRate = readDouble80(view, offset + 16);
      if (fileType === 0x41494643 && chunkLen >= 22) { // AIFC
        compressionType = view.getUint32(offset + 26, false);
      }
    } else if (chunkId === 0x53534E44) { // "SSND"
      const offsetParam = view.getUint32(offset + 8, false);
      ssndOffset = offset + 16 + offsetParam;
      ssndLength = chunkLen - 8;
    }
    
    // Chunk length must be padded to even bytes
    offset += 8 + (chunkLen % 2 === 0 ? chunkLen : chunkLen + 1);
  }
  
  if (!channels || !sampleFrames || !sampleSize || !sampleRate || !ssndOffset) {
    throw new Error("Missing required AIFF chunks (COMM or SSND)");
  }
  
  // Support 8-bit, 16-bit, and 24-bit PCM
  if (sampleSize !== 16 && sampleSize !== 24 && sampleSize !== 8) {
    throw new Error(`Unsupported AIFF sample size: ${sampleSize}-bit`);
  }
  
  if (!audioCtx) {
    initAudio();
  }
  
  // Create AudioBuffer
  const buffer = audioCtx.createBuffer(channels, sampleFrames, Math.round(sampleRate));
  const bytesPerSample = sampleSize / 8;
  const blockAlign = channels * bytesPerSample;
  
  // 'sowt' is little endian PCM, standard AIFF and 'twos' is big endian
  const isLittleEndian = (compressionType === 0x736F7774);
  
  // Extract samples
  for (let channel = 0; channel < channels; channel++) {
    const channelData = buffer.getChannelData(channel);
    let sampleOffset = ssndOffset + (channel * bytesPerSample);
    
    for (let i = 0; i < sampleFrames; i++) {
      if (sampleOffset >= arrayBuffer.byteLength) break;
      
      let val = 0;
      if (sampleSize === 16) {
        val = view.getInt16(sampleOffset, isLittleEndian) / 32768.0;
      } else if (sampleSize === 24) {
        let b0, b1, b2;
        if (isLittleEndian) {
          b0 = view.getUint8(sampleOffset + 2);
          b1 = view.getUint8(sampleOffset + 1);
          b2 = view.getUint8(sampleOffset);
        } else {
          b0 = view.getUint8(sampleOffset);
          b1 = view.getUint8(sampleOffset + 1);
          b2 = view.getUint8(sampleOffset + 2);
        }
        let intVal = (b0 << 16) | (b1 << 8) | b2;
        if (intVal & 0x800000) intVal -= 0x1000000; // Sign extend
        val = intVal / 8388608.0;
      } else if (sampleSize === 8) {
        val = view.getInt8(sampleOffset) / 128.0;
      }
      
      channelData[i] = val;
      sampleOffset += blockAlign;
    }
  }
  
  return buffer;
}

// Read IEEE 754 80-bit Extended Precision Float (Big Endian)
function readDouble80(view, offset) {
  const exponent = view.getUint16(offset, false);
  const hiMant = view.getUint32(offset + 2, false);
  const loMant = view.getUint32(offset + 6, false);
  
  const sign = (exponent & 0x8000) ? -1 : 1;
  let exp = exponent & 0x7FFF;
  
  if (exp === 0 && hiMant === 0 && loMant === 0) {
    return 0;
  }
  
  if (exp === 0x7FFF) {
    return hiMant === 0 && loMant === 0 ? sign * Infinity : NaN;
  }
  
  exp -= 16383; // Bias
  
  let doubleVal = hiMant * Math.pow(2, exp - 31) + loMant * Math.pow(2, exp - 63);
  return sign * doubleVal;
}
