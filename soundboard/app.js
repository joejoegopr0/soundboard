// Soundboard Application Core Logic

// Lazy-initialized Audio State
let audioCtx = null;
let globalGainNode = null;
let analyserNode = null;
let noiseBuffer = null;
let isSynthesizerMode = false; // false = Recordings, true = Synthesizer

// Sound Definitions & Configurations
const sounds = {
  airhorn: {
    title: "Air Horn",
    emoji: "📢",
    recPath: "assets/sounds/airhorn.mp3",
    synthDuration: 1.0, // seconds
    audioElement: null,
    mediaSource: null,
    gainNode: null,
    activeNodes: null,
    playTimeout: null,
    loop: false,
    isPlaying: false
  },
  fart: {
    title: "Fart Sounds",
    emoji: "💨",
    recPath: "assets/sounds/fart.mp3",
    synthDuration: 0.5,
    audioElement: null,
    mediaSource: null,
    gainNode: null,
    activeNodes: null,
    playTimeout: null,
    loop: false,
    isPlaying: false
  },
  laughter: {
    title: "Audience Laughter",
    emoji: "😆",
    recPath: "assets/sounds/laughter.mp3",
    synthDuration: 1.6,
    audioElement: null,
    mediaSource: null,
    gainNode: null,
    activeNodes: null,
    playTimeout: null,
    loop: false,
    isPlaying: false
  },
  applause: {
    title: "Audience Applause",
    emoji: "👏",
    recPath: "assets/sounds/applause.mp3",
    synthDuration: 2.5,
    audioElement: null,
    mediaSource: null,
    gainNode: null,
    activeNodes: null,
    playTimeout: null,
    loop: false,
    isPlaying: false
  }
};

// Hotkey mappings (1-4 and Q-R)
const keyMap = {
  "1": "airhorn",
  "q": "airhorn",
  "2": "fart",
  "w": "fart",
  "3": "laughter",
  "e": "laughter",
  "4": "applause",
  "r": "applause"
};

// Canvas Visualizer Configuration
let canvas = null;
let canvasCtx = null;
let visualizerMode = "wave"; // "wave" or "freq"
let animationFrameId = null;

// Initialize the Web Audio API Context and Nodes
function initAudio() {
  if (audioCtx) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass();

  // Create nodes
  globalGainNode = audioCtx.createGain();
  globalGainNode.gain.value = parseFloat(document.getElementById("global-volume").value);

  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 256;

  // Connect chains
  globalGainNode.connect(analyserNode);
  analyserNode.connect(audioCtx.destination);

  // Initialize individual gains and audio elements for pre-recordings
  Object.keys(sounds).forEach(id => {
    const s = sounds[id];
    
    // Per-sound gain node
    s.gainNode = audioCtx.createGain();
    s.gainNode.gain.value = parseFloat(document.getElementById(`vol-${id}`).value);
    s.gainNode.connect(globalGainNode);

    // Audio Element
    const audio = new Audio();
    audio.src = s.recPath;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    s.audioElement = audio;

    // Connect audio element source
    s.mediaSource = audioCtx.createMediaElementSource(audio);
    s.mediaSource.connect(s.gainNode);

    // Recording ended event listener
    audio.addEventListener("ended", () => {
      if (!s.loop) {
        setCardUIState(id, false);
        s.isPlaying = false;
      }
    });
  });

  // Start Visualizer render loop
  startVisualizer();
}

// Generate circular white noise buffer for synthesizing applause/farts
function getNoiseBuffer() {
  if (noiseBuffer) return noiseBuffer;

  const sampleRate = audioCtx.sampleRate;
  const bufferSize = 2 * sampleRate; // 2 seconds
  noiseBuffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
  const data = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return noiseBuffer;
}

// Ensure Audio Context is resumed (browsers require user interaction)
async function resumeAudioContext() {
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
}

// ==========================================
// Web Audio API Synthesizers
// ==========================================

// 1. Air Horn Synthesizer
function playAirHornSynth(s) {
  const ctx = audioCtx;
  const dest = s.gainNode;
  const oscs = [];

  // Harmonics frequencies to simulate air pressure resonance
  const baseFreqs = [220, 222, 330, 440, 660, 880];
  const gains = [1.0, 0.8, 0.7, 0.5, 0.3, 0.1];

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0, ctx.currentTime);
  oscGain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.015); // Instant slap attack
  
  // Bandpass filter to compress frequencies and focus tone
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(750, ctx.currentTime);
  filter.Q.setValueAtTime(1.8, ctx.currentTime);

  baseFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // Natural slight pitch drop as air pressure releases
    osc.frequency.exponentialRampToValueAtTime(freq * 0.94, ctx.currentTime + s.synthDuration);

    const indGain = ctx.createGain();
    indGain.gain.setValueAtTime(gains[idx], ctx.currentTime);

    osc.connect(indGain);
    indGain.connect(oscGain);
    osc.start();
    oscs.push(osc);
  });

  oscGain.connect(filter);
  filter.connect(dest);

  s.activeNodes = {
    oscs,
    gain: oscGain,
    filter
  };
}

// 2. Fart Synthesizer (Sawtooth sweeping down + Low-frequency flutter)
function playFartSynth(s) {
  const ctx = audioCtx;
  const dest = s.gainNode;

  // Base sweep oscillator
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(95, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + s.synthDuration * 0.9);

  // Rumble triangle oscillator
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(80, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + s.synthDuration * 0.8);

  // Flutter LFO to modulate gain (simulating skin vibration)
  const lfo = ctx.createOscillator();
  lfo.type = "sawtooth";
  lfo.frequency.setValueAtTime(23, ctx.currentTime); // 23Hz flapping speed

  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(0.42, ctx.currentTime); // Modulation depth

  const flutterNode = ctx.createGain();
  flutterNode.gain.setValueAtTime(0.5, ctx.currentTime);

  lfo.connect(lfoGain);
  lfoGain.connect(flutterNode.gain);

  // Filter out harsh highs for muddy bass farts
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(260, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + s.synthDuration);

  // White noise element for air leakage / turbulence
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer();
  noise.loop = true;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(160, ctx.currentTime);
  noiseFilter.Q.setValueAtTime(3.0, ctx.currentTime);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + s.synthDuration * 0.8);

  // Connect chains
  osc.connect(flutterNode);
  osc2.connect(flutterNode);
  flutterNode.connect(filter);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);

  const outputGain = ctx.createGain();
  outputGain.gain.setValueAtTime(1, ctx.currentTime);
  outputGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + s.synthDuration);

  filter.connect(outputGain);
  noiseGain.connect(outputGain);
  outputGain.connect(dest);

  // Start synths
  lfo.start();
  osc.start();
  osc2.start();
  noise.start();

  s.activeNodes = {
    oscs: [osc, osc2, lfo, noise],
    nodes: [lfoGain, flutterNode, filter, noiseFilter, noiseGain, outputGain]
  };
}

// 3. Laughter Synthesizer (Vocal formants + pitch/volume chuckle modulation)
function playLaughterSynth(s) {
  const ctx = audioCtx;
  const dest = s.gainNode;
  const voices = [];
  
  // Create 3 asynchronous chuckling voices
  const basePitches = [165, 210, 245];
  const modRates = [5.6, 6.3, 4.8];
  const startOffsets = [0, 0.08, 0.15];

  basePitches.forEach((pitch, i) => {
    // Vocal source (sawtooth)
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(pitch, ctx.currentTime + startOffsets[i]);

    // Vocal Formant parallel filters for "ha" vowel (F1 ≈ 800Hz, F2 ≈ 1200Hz)
    const f1 = ctx.createBiquadFilter();
    f1.type = "bandpass";
    f1.frequency.setValueAtTime(800, ctx.currentTime + startOffsets[i]);
    f1.Q.setValueAtTime(3.0, ctx.currentTime);

    const f2 = ctx.createBiquadFilter();
    f2.type = "bandpass";
    f2.frequency.setValueAtTime(1250, ctx.currentTime + startOffsets[i]);
    f2.Q.setValueAtTime(3.0, ctx.currentTime);

    const mixer = ctx.createGain();
    mixer.gain.setValueAtTime(0.35, ctx.currentTime);

    osc.connect(f1);
    osc.connect(f2);
    f1.connect(mixer);
    f2.connect(mixer);

    // Laugh cadence LFO (modulates pitch and volume at 5Hz to chuckle)
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(modRates[i], ctx.currentTime + startOffsets[i]);

    const lfoVolumeGain = ctx.createGain();
    lfoVolumeGain.gain.setValueAtTime(0.35, ctx.currentTime);

    const pitchModGain = ctx.createGain();
    pitchModGain.gain.setValueAtTime(30, ctx.currentTime); // Pitch sweep range

    lfo.connect(lfoVolumeGain);
    lfo.connect(pitchModGain);
    pitchModGain.connect(osc.frequency);

    const volumeModNode = ctx.createGain();
    volumeModNode.gain.setValueAtTime(0.55, ctx.currentTime);
    lfoVolumeGain.connect(volumeModNode.gain);

    mixer.connect(volumeModNode);

    // Global envelope for voice decay
    const voiceEnvelope = ctx.createGain();
    voiceEnvelope.gain.setValueAtTime(0, ctx.currentTime);
    voiceEnvelope.gain.linearRampToValueAtTime(0.8, ctx.currentTime + startOffsets[i] + 0.1);
    voiceEnvelope.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + s.synthDuration);

    volumeModNode.connect(voiceEnvelope);
    voiceEnvelope.connect(dest);

    // Start offset delays
    setTimeout(() => {
      if (s.isPlaying && ctx.state === "running") {
        try {
          osc.start();
          lfo.start();
        } catch(e) {}
      }
    }, startOffsets[i] * 1000);

    voices.push({
      osc, lfo,
      nodes: [f1, f2, mixer, lfoVolumeGain, pitchModGain, volumeModNode, voiceEnvelope]
    });
  });

  s.activeNodes = { voices };
}

// 4. Applause (Crowd) Synthesizer (Stochastic impulses + noise backdrop)
function playApplauseSynth(s) {
  const ctx = audioCtx;
  const dest = s.gainNode;

  // Backdrop crowd ambient noise
  const bgNoise = ctx.createBufferSource();
  bgNoise.buffer = getNoiseBuffer();
  bgNoise.loop = true;

  const bgFilter = ctx.createBiquadFilter();
  bgFilter.type = "bandpass";
  bgFilter.frequency.setValueAtTime(1200, ctx.currentTime);
  bgFilter.Q.setValueAtTime(0.8, ctx.currentTime);

  const bgGain = ctx.createGain();
  bgGain.gain.setValueAtTime(0, ctx.currentTime);
  bgGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.3); // Smooth fade in
  bgGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + s.synthDuration);

  bgNoise.connect(bgFilter);
  bgFilter.connect(bgGain);
  bgGain.connect(dest);
  bgNoise.start();

  // Spawning 8 stochastically timed clap triggers (discrete clapping hands)
  const clappers = [];
  const numClappers = 8;

  for (let i = 0; i < numClappers; i++) {
    const intervalId = setInterval(() => {
      if (!s.isPlaying) return;

      const clapSource = ctx.createBufferSource();
      clapSource.buffer = getNoiseBuffer();

      const clapFilter = ctx.createBiquadFilter();
      clapFilter.type = "bandpass";
      clapFilter.frequency.setValueAtTime(950 + Math.random() * 900, ctx.currentTime);
      clapFilter.Q.setValueAtTime(2.2, ctx.currentTime);

      const clapGain = ctx.createGain();
      clapGain.gain.setValueAtTime(0.45 + Math.random() * 0.4, ctx.currentTime);
      // Very sharp impulse decay
      clapGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.02 + Math.random() * 0.035);

      clapSource.connect(clapFilter);
      clapFilter.connect(clapGain);
      clapGain.connect(dest);
      
      clapSource.start();

      // Cleanup single clap nodes
      setTimeout(() => {
        clapSource.disconnect();
        clapFilter.disconnect();
        clapGain.disconnect();
      }, 100);

    }, 85 + Math.random() * 105); // randomized clapping rate per hand

    clappers.push(intervalId);
  }

  s.activeNodes = {
    bgNoise,
    bgGain,
    bgFilter,
    clappers
  };
}

// Master trigger to synthesize a sound
function triggerSynth(id) {
  const s = sounds[id];
  s.isPlaying = true;
  setCardUIState(id, true);

  if (id === "airhorn") playAirHornSynth(s);
  else if (id === "fart") playFartSynth(s);
  else if (id === "laughter") playLaughterSynth(s);
  else if (id === "applause") playApplauseSynth(s);

  // Schedule release/cleanup
  s.playTimeout = setTimeout(() => {
    if (s.loop && s.isPlaying) {
      cleanupSynthNodes(s);
      triggerSynth(id); // Re-loop sound
    } else {
      stopSound(id);
    }
  }, s.synthDuration * 1000);
}

// Cleanup active synthesizer nodes on stop
function cleanupSynthNodes(s) {
  if (!s.activeNodes) return;

  // Cleanup airhorn or fart
  if (s.activeNodes.oscs) {
    s.activeNodes.oscs.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch(e) {}
    });
  }
  if (s.activeNodes.gain) s.activeNodes.gain.disconnect();
  if (s.activeNodes.filter) s.activeNodes.filter.disconnect();
  if (s.activeNodes.nodes) {
    s.activeNodes.nodes.forEach(node => {
      try { node.disconnect(); } catch(e) {}
    });
  }

  // Cleanup laughter voices
  if (s.activeNodes.voices) {
    s.activeNodes.voices.forEach(voice => {
      try {
        voice.osc.stop();
        voice.lfo.stop();
        voice.osc.disconnect();
        voice.lfo.disconnect();
        voice.nodes.forEach(n => n.disconnect());
      } catch(e) {}
    });
  }

  // Cleanup applause
  if (s.activeNodes.clappers) {
    s.activeNodes.clappers.forEach(intervalId => clearInterval(intervalId));
  }
  if (s.activeNodes.bgNoise) {
    try { s.activeNodes.bgNoise.stop(); s.activeNodes.bgNoise.disconnect(); } catch(e) {}
  }
  if (s.activeNodes.bgGain) s.activeNodes.bgGain.disconnect();
  if (s.activeNodes.bgFilter) s.activeNodes.bgFilter.disconnect();

  s.activeNodes = null;
}

// ==========================================
// Playing & Stopping Sound Controls
// ==========================================

async function playSound(id) {
  await resumeAudioContext();
  const s = sounds[id];

  // If already playing, stop it first to restart trigger (polyphonic overlap control)
  if (s.isPlaying) {
    stopSound(id);
  }

  if (isSynthesizerMode) {
    triggerSynth(id);
  } else {
    // Recording Player mode
    s.isPlaying = true;
    setCardUIState(id, true);
    s.audioElement.loop = s.loop;
    s.audioElement.currentTime = 0;
    
    // Play with fallback handling
    s.audioElement.play().catch(err => {
      console.warn(`Local file playback failed: ${err.message}. Cascading to Web Audio synthesis fallback.`);
      triggerSynth(id);
    });
  }
}

function stopSound(id) {
  const s = sounds[id];
  if (!s.isPlaying) return;

  s.isPlaying = false;
  setCardUIState(id, false);

  // Clear scheduling timeout
  if (s.playTimeout) {
    clearTimeout(s.playTimeout);
    s.playTimeout = null;
  }

  if (isSynthesizerMode || !s.audioElement.paused) {
    // Stop recording or synth
    if (s.audioElement) {
      s.audioElement.pause();
      s.audioElement.currentTime = 0;
    }
    cleanupSynthNodes(s);
  }
}

function stopAllSounds() {
  Object.keys(sounds).forEach(id => {
    stopSound(id);
  });
}

// Sync Sound Card with UI states (active colors, buttons state)
function setCardUIState(id, active) {
  const card = document.querySelector(`.pad-${id}`);
  const stopBtn = document.getElementById(`stop-${id}`);
  
  if (active) {
    card.classList.add("playing");
    stopBtn.removeAttribute("disabled");
  } else {
    card.classList.remove("playing");
    stopBtn.setAttribute("disabled", "true");
  }
}

// ==========================================
// Canvas Audio Waveform Visualizer
// ==========================================

function startVisualizer() {
  canvas = document.getElementById("visualizer-canvas");
  canvasCtx = canvas.getContext("2d");

  // Resize canvas to match display container boundary
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

    // Clear Canvas with alpha fade to create motion trail blur
    canvasCtx.fillStyle = "rgba(7, 9, 19, 0.25)";
    canvasCtx.fillRect(0, 0, width, height);

    if (visualizerMode === "wave") {
      // Waveform / Oscilloscope view
      analyserNode.getByteTimeDomainData(dataArray);

      canvasCtx.lineWidth = 2.5;
      canvasCtx.strokeStyle = "rgba(0, 162, 255, 0.85)";
      
      // Neon shadow glow effect
      canvasCtx.shadowBlur = 8;
      canvasCtx.shadowColor = "#00A2FF";

      canvasCtx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Data centered around 128 (unsigned byte middle)
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
      // Frequency Spectrum Bar view
      analyserNode.getByteFrequencyData(dataArray);

      canvasCtx.shadowBlur = 0; // Disable blur shadows on heavy spectrum bars for performance

      const barWidth = (width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2.2;

        // Custom rainbow-glowing visualizer gradient
        const grad = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
        grad.addColorStop(0, "#4568dc");
        grad.addColorStop(1, "#38ef7d");

        canvasCtx.fillStyle = grad;
        canvasCtx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

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
  // Mode Selection switch handler
  const modeToggle = document.getElementById("mode-toggle");
  const modeRecText = document.getElementById("mode-rec-text");
  const modeSynthText = document.getElementById("mode-synth-text");

  modeToggle.addEventListener("click", () => {
    isSynthesizerMode = !isSynthesizerMode;
    modeToggle.setAttribute("aria-checked", isSynthesizerMode);
    
    // UI active font toggling
    if (isSynthesizerMode) {
      modeSynthText.classList.add("active");
      modeRecText.classList.remove("active");
    } else {
      modeRecText.classList.add("active");
      modeSynthText.classList.remove("active");
    }

    // Stop all active playbacks when shifting sources
    stopAllSounds();
  });

  // Global Volume control handler
  const globalVolInput = document.getElementById("global-volume");
  const globalVolValue = document.getElementById("global-volume-value");

  globalVolInput.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    globalVolValue.textContent = `${Math.round(val * 100)}%`;
    if (globalGainNode) {
      globalGainNode.gain.setValueAtTime(val, audioCtx.currentTime);
    }
  });

  // Sound grid triggers
  Object.keys(sounds).forEach(id => {
    const card = document.querySelector(`.pad-${id}`);
    const trigger = card.querySelector(".pad-trigger");
    const stopBtn = document.getElementById(`stop-${id}`);
    const loopBtn = document.getElementById(`loop-${id}`);
    const volInput = document.getElementById(`vol-${id}`);

    // Click to Play trigger
    trigger.addEventListener("click", () => {
      playSound(id);
    });

    // Stop button click
    stopBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      stopSound(id);
    });

    // Loop button toggle
    loopBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const s = sounds[id];
      s.loop = !s.loop;
      loopBtn.setAttribute("aria-pressed", s.loop);
      
      // If using HTML5 audio elements, update property directly
      if (s.audioElement) {
        s.audioElement.loop = s.loop;
      }
    });

    // Per-sound volume sliders
    volInput.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      sounds[id].gainNodeValue = val;
      if (sounds[id].gainNode) {
        sounds[id].gainNode.gain.setValueAtTime(val, audioCtx.currentTime);
      }
    });
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

  // Keyboard Hotkey triggers
  window.addEventListener("keydown", (e) => {
    // Ignore keystrokes inside search input
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

    const soundId = keyMap[key];
    if (soundId) {
      e.preventDefault();
      playSound(soundId);
      
      // Simulate button click visual depression for keyboard user response
      const triggerBtn = document.getElementById(`btn-${soundId}`);
      if (triggerBtn) {
        triggerBtn.parentElement.classList.add("keyboard-active");
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    const soundId = keyMap[key];
    if (soundId) {
      const triggerBtn = document.getElementById(`btn-${soundId}`);
      if (triggerBtn) {
        triggerBtn.parentElement.classList.remove("keyboard-active");
      }
    }
  });

  // Real-time Search and Filter Soundboard Pads
  const searchInput = document.getElementById("sound-search");
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    Object.keys(sounds).forEach(id => {
      const card = document.querySelector(`.pad-${id}`);
      const s = sounds[id];
      const match = s.title.toLowerCase().includes(query) || id.includes(query) || s.emoji.includes(query);

      if (match || query === "") {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
  });
});
