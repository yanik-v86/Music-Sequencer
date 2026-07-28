const ROOT_FREQ = 261.63;
const STEPS = 16;
const MAX_PATTERNS = 16;

const SCALES = {
  major:      [0, 2, 4, 5, 7, 9, 11, 12],
  minor:      [0, 2, 3, 5, 7, 8, 10, 12],
  pentatonic: [0, 2, 4, 7, 9, 12, 14, 16],
  blues:      [0, 3, 5, 6, 7, 10, 12, 15],
  dorian:     [0, 2, 3, 5, 7, 9, 10, 12],
  mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11, 12],
  wholeTone:  [0, 2, 4, 6, 8, 10, 12, 14],
};

const MOODS = [
  { id:'warm',   label:'Warm',   scale:'major',     wave:'sine',     filter:4800, colors:['#c96d4a','#d48a5a','#e0a060','#c97a50'], bg:'#f4efe8' },
  { id:'deep',   label:'Deep',   scale:'minor',     wave:'sawtooth', filter:900, colors:['#7a6a9a','#9a7aba','#8a6aaa','#6a5a8a'], bg:'#ece8f0' },
  { id:'airy',   label:'Airy',   scale:'pentatonic',wave:'triangle', filter:4500, colors:['#7d9a7a','#9aba8a','#6aaa7a','#8aba90'], bg:'#e8f0e8' },
  { id:'edge',   label:'Edge',   scale:'blues',     wave:'square',   filter:1800, colors:['#c96d4a','#b84a3a','#d45a5a','#c94a3a'], bg:'#f4ece8' },
  { id:'mellow', label:'Mellow', scale:'dorian',    wave:'sine',     filter:3800, colors:['#b89a6a','#c9aa7a','#d0ba8a','#b09060'], bg:'#f0ece4' },
  { id:'bright', label:'Bright', scale:'mixolydian',wave:'triangle', filter:6500, colors:['#e8a040','#f0b860','#d89030','#e8b050'], bg:'#f4f0e8' },
  { id:'dark',   label:'Dark',   scale:'harmonicMinor',wave:'sawtooth',filter:600,colors:['#5a4a6a','#6a4a5a','#4a3a6a','#7a5a6a'], bg:'#e8e4ec' },
  { id:'dream',  label:'Dream',  scale:'wholeTone',wave:'triangle', filter:5000, colors:['#9ab8c9','#7aaac9','#8ac0d4','#6aa0b8'], bg:'#e8eef0' },
  { id:'cyber',  label:'Cyber',  scale:'harmonicMinor',wave:'square',   filter:1400, colors:['#ff2d78','#00e5ff','#b537ff','#ff6b35'], bg:'#0d0d1a' },
  { id:'neon',   label:'Neon',   scale:'minor',     wave:'sawtooth', filter:1600, colors:['#ff007f','#00f0ff','#ffcc00','#7f00ff'], bg:'#120016' },
  { id:'void',   label:'Void',   scale:'wholeTone', wave:'sine',     filter:5500, colors:['#2a4a7f','#4a7abf','#1a2a6a','#6a9adf'], bg:'#080c16' },
  { id:'nebula', label:'Nebula', scale:'pentatonic',wave:'triangle', filter:4500, colors:['#9a4aff','#4affd9','#ff4a9a','#4a6aff'], bg:'#0c0814' },
];

const TRACKS = [
  { id:'m0',  name:'C3',  type:'melody', freqIdx:0 },
  { id:'m1',  name:'D3',  type:'melody', freqIdx:1 },
  { id:'m2',  name:'E3',  type:'melody', freqIdx:2 },
  { id:'m3',  name:'F3',  type:'melody', freqIdx:3 },
  { id:'m4',  name:'G3',  type:'melody', freqIdx:4 },
  { id:'m5',  name:'A3',  type:'melody', freqIdx:5 },
  { id:'m6',  name:'B3',  type:'melody', freqIdx:6 },
  { id:'m7',  name:'C4',  type:'melody', freqIdx:7 },
  { id:'b0',  name:'Bass 1', type:'bass', freqIdx:0 },
  { id:'b1',  name:'Bass 2', type:'bass', freqIdx:1 },
  { id:'b2',  name:'Bass 3', type:'bass', freqIdx:2 },
  { id:'b3',  name:'Bass 4', type:'bass', freqIdx:3 },
  { id:'p0',  name:'Kick',   type:'perc', sound:'kick' },
  { id:'p1',  name:'Snare',  type:'perc', sound:'snare' },
  { id:'p2',  name:'HH Cls', type:'perc', sound:'hhClosed' },
  { id:'p3',  name:'HH Open',type:'perc', sound:'hhOpen' },
  { id:'p4',  name:'Clap',   type:'perc', sound:'clap' },
  { id:'p5',  name:'Tom',    type:'perc', sound:'tom' },
];

const TRACK_COUNT = TRACKS.length;

const SECTION_RANGES = {
  melody:     [0, 8],
  bass:       [8, 12],
  percussion: [12, 18],
};

let pattern = Array.from({length:TRACK_COUNT}, () => Array(STEPS).fill(false));
let muted = new Array(TRACK_COUNT).fill(false);
let trackOverrides = new Array(TRACK_COUNT).fill(null);
let trackVolumes = new Array(TRACK_COUNT).fill(1.0);
let sectionMuted = { melody: false, bass: false, percussion: false };
let patternBank = [];
let patternTrackVolumes = [];
let patternMoods = new Array(MAX_PATTERNS).fill(0);
let patternOctaves = new Array(MAX_PATTERNS).fill(0);
let currentPatternIdx = 0;
let overdubMode = false;
let previewEnabled = true;
let metronomeEnabled = false;
let metronomeVolume = 0.4;
let quantizeStepSize = 1;
let recordedEvents = [];
let isRecording = false;
let recordStartTime = 0;
let timelinePlaying = false;
let timelinePlayhead = 0;
let timelineTimerID = null;
let tlCells = [];
let timelineTracks = new Map(); // trackId -> { row, name, type, sound }
let timelineDuration = 0; // in seconds
let timelineResolutionMode = 'steps'; // 'steps' | 'seconds'
let timelineEventIndex = 0;
let timelineNextEventTime = 0;

let pendingPatternIdx = null;
let pendingOverdubToggle = false;

let octaveShift = 0;
let playing = false;
let displayStep = -1;
let scheduleStep = -1;
let bpm = 110;
let volume = 0.7;
let currentMood = MOODS[0];

let audioCtx = null;
let masterGain = null;
let voiceBus = null;
let dryGain = null;
let reverbGain = null;
let reverbNode = null;
let delayGain = null;
let delayNode = null;
let delayFeedback = null;
let reverbMix = 0.25;
let delayMix = 0.15;
let analyser = null;
let visualizerCanvas = null;
let visualizerCtx = null;
let visualizerAnimationId = null;
let nextNoteTime = 0;
let timerID = null;
const SCHEDULE_AHEAD = 0.1;

for (let p = 0; p < MAX_PATTERNS; p++) {
  patternBank.push(Array.from({length:TRACK_COUNT}, () => Array(STEPS).fill(false)));
  patternTrackVolumes.push(new Array(TRACK_COUNT).fill(1.0));
}

const sectionName = { melody:'melody', bass:'bass', perc:'percussion' };

function isSectionMuted(trackType) {
  return sectionMuted[sectionName[trackType]];
}

function isTrackMuted(r) {
  return muted[r] || isSectionMuted(TRACKS[r].type);
}

function freqForMood(track, mood, octave) {
  if (octave == null) octave = octaveShift;
  const intervals = SCALES[mood.scale];
  const semi = intervals[track.freqIdx];
  const o = (track.type === 'bass' ? -12 : 0) + octave * 12;
  return ROOT_FREQ * Math.pow(2, (semi + o) / 12);
}

function getAudioDest() {
  return voiceBus || masterGain;
}

function createReverbImpulseResponse(duration, decay) {
  const sampleRate = audioCtx.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioCtx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);
  for (let i = 0; i < length; i++) {
    const percent = i / length;
    const val = (Math.random() * 2 - 1) * Math.pow(1 - percent, decay);
    left[i] = val;
    right[i] = (Math.random() * 2 - 1) * Math.pow(1 - percent, decay);
  }
  return impulse;
}

function initEffects() {
  voiceBus = audioCtx.createGain();
  
  dryGain = audioCtx.createGain();
  dryGain.gain.value = 1.0;
  voiceBus.connect(dryGain);
  dryGain.connect(masterGain);
  
  reverbNode = audioCtx.createConvolver();
  try {
    reverbNode.buffer = createReverbImpulseResponse(2.0, 2.5);
  } catch(e) {
    console.error('Error creating reverb impulse response:', e);
  }
  reverbGain = audioCtx.createGain();
  reverbGain.gain.value = reverbMix;
  
  voiceBus.connect(reverbGain);
  reverbGain.connect(reverbNode);
  reverbNode.connect(masterGain);
  
  delayNode = audioCtx.createDelay(2.0);
  delayNode.delayTime.value = 30 / bpm;
  delayFeedback = audioCtx.createGain();
  delayFeedback.gain.value = 0.4;
  delayGain = audioCtx.createGain();
  delayGain.gain.value = delayMix;
  
  voiceBus.connect(delayGain);
  delayGain.connect(delayNode);
  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  delayNode.connect(masterGain);
  
  delayNode.connect(reverbGain);
}

function updateDelayTime() {
  if (delayNode && audioCtx) {
    const delayTime = 30 / bpm;
    delayNode.delayTime.setTargetAtTime(delayTime, audioCtx.currentTime, 0.2);
  }
}

function drawVisualizer() {
  visualizerAnimationId = requestAnimationFrame(drawVisualizer);
  if (!analyser || !visualizerCtx || !visualizerCanvas) return;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);
  
  const width = visualizerCanvas.width;
  const height = visualizerCanvas.height;
  
  visualizerCtx.clearRect(0, 0, width, height);
  
  const strokeColor = (currentMood && currentMood.colors) ? currentMood.colors[0] : '#c96d4a';
  
  visualizerCtx.lineWidth = 1.8;
  visualizerCtx.strokeStyle = strokeColor;
  visualizerCtx.shadowBlur = 4;
  visualizerCtx.shadowColor = strokeColor;
  visualizerCtx.beginPath();
  
  const sliceWidth = width / bufferLength;
  let x = 0;
  
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * height) / 2;
    
    if (i === 0) {
      visualizerCtx.moveTo(x, y);
    } else {
      visualizerCtx.lineTo(x, y);
    }
    
    x += sliceWidth;
  }
  
  visualizerCtx.lineTo(width, height / 2);
  visualizerCtx.stroke();
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = volume;
    
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    initEffects();
    
    visualizerCanvas = document.getElementById('visualizer');
    if (visualizerCanvas) {
      visualizerCtx = visualizerCanvas.getContext('2d');
      drawVisualizer();
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playPluckString(freq, time, dur, vol, isBass = false) {
  const period = 1 / freq;
  const size = Math.max(isBass ? 256 : 128, Math.ceil(audioCtx.sampleRate * period));
  const buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * i / size);
  }
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const delay = audioCtx.createDelay(1.0);
  delay.delayTime.setValueAtTime(period, time);
  
  const feedback = audioCtx.createGain();
  const decayRate = isBass ? 0.985 : Math.min(0.995, Math.exp(-0.0006 * freq));
  feedback.gain.setValueAtTime(decayRate, time);
  feedback.gain.setValueAtTime(decayRate, time + dur - 0.05);
  feedback.gain.linearRampToValueAtTime(0, time + dur);
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(isBass ? freq * 1.5 : Math.min(10000, freq * 7), time);
  filter.Q.value = 0.5;
  
  delay.connect(filter);
  filter.connect(feedback);
  feedback.connect(delay);
  
  noise.connect(delay);
  
  const env = audioCtx.createGain();
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(vol * (isBass ? 0.6 : 0.45), time + 0.003);
  env.gain.setValueAtTime(vol * (isBass ? 0.6 : 0.45), time + dur - 0.05);
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  
  delay.connect(env);
  env.connect(getAudioDest());
  
  noise.start(time);
  noise.stop(time + period);
  
  if (isBass) {
    const sub = audioCtx.createOscillator();
    const subEnv = audioCtx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq, time);
    subEnv.gain.setValueAtTime(0, time);
    subEnv.gain.linearRampToValueAtTime(vol * 0.45, time + 0.01);
    subEnv.gain.exponentialRampToValueAtTime(0.001, time + dur);
    
    sub.connect(subEnv);
    subEnv.connect(getAudioDest());
    sub.start(time);
    sub.stop(time + dur);
  }
}

function playFMPiano(freq, time, dur, vol) {
  const carrier = audioCtx.createOscillator();
  const modulator = audioCtx.createOscillator();
  const modGain = audioCtx.createGain();
  const env = audioCtx.createGain();
  
  carrier.type = 'sine';
  carrier.frequency.setValueAtTime(freq, time);
  
  modulator.type = 'sine';
  const ratio = 2;
  modulator.frequency.setValueAtTime(freq * ratio, time);
  
  const modFreq = freq * ratio;
  const modIndex = 4.5;
  const maxModGain = modIndex * modFreq;
  
  modGain.gain.setValueAtTime(maxModGain, time);
  modGain.gain.exponentialRampToValueAtTime(maxModGain * 0.03, time + dur * 0.35);
  modGain.gain.linearRampToValueAtTime(0, time + dur);
  
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(vol * 0.35, time + 0.005);
  env.gain.exponentialRampToValueAtTime(vol * 0.12, time + dur * 0.3);
  env.gain.linearRampToValueAtTime(0, time + dur);
  
  modulator.connect(modGain);
  modGain.connect(carrier.frequency);
  carrier.connect(env);
  env.connect(getAudioDest());
  
  carrier.start(time);
  modulator.start(time);
  carrier.stop(time + dur);
  modulator.stop(time + dur);
}

function playSynthLead(freq, time, dur, waveType, filterFreq, vol) {
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const oscGain1 = audioCtx.createGain();
  const oscGain2 = audioCtx.createGain();
  const env = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  
  osc1.type = waveType;
  osc1.frequency.setValueAtTime(freq, time);
  osc1.detune.setValueAtTime(-14, time);
  
  osc2.type = waveType;
  osc2.frequency.setValueAtTime(freq, time);
  osc2.detune.setValueAtTime(14, time);
  
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(vol * 0.22, time + 0.01);
  env.gain.setValueAtTime(vol * 0.22, time + dur - 0.06);
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  
  filter.type = 'lowpass';
  filter.Q.setValueAtTime(2.2, time);
  filter.frequency.setValueAtTime(filterFreq, time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(120, filterFreq * 0.25), time + dur);
  
  osc1.connect(oscGain1);
  osc2.connect(oscGain2);
  oscGain1.gain.setValueAtTime(0.5, time);
  oscGain2.gain.setValueAtTime(0.5, time);
  
  oscGain1.connect(filter);
  oscGain2.connect(filter);
  filter.connect(env);
  env.connect(getAudioDest());
  
  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + dur);
  osc2.stop(time + dur);
}

function playOrgan(freq, time, dur, vol) {
  const env = audioCtx.createGain();
  const harmonics = [1, 2, 3, 4];
  const relativeGains = [1.0, 0.5, 0.35, 0.18];
  
  harmonics.forEach((h, index) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * h, time);
    
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(relativeGains[index] * 0.25, time);
    
    osc.connect(g);
    g.connect(env);
    
    osc.start(time);
    osc.stop(time + dur);
  });
  
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(vol * 0.35, time + 0.004);
  env.gain.setValueAtTime(vol * 0.35, time + dur - 0.02);
  env.gain.linearRampToValueAtTime(0, time + dur);
  
  env.connect(getAudioDest());
}

function playSubBass(freq, time, dur, vol) {
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 1.5, time);
  osc.frequency.exponentialRampToValueAtTime(freq, time + 0.022);
  
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(vol * 0.65, time + 0.008);
  env.gain.exponentialRampToValueAtTime(vol * 0.3, time + dur * 0.5);
  env.gain.linearRampToValueAtTime(0, time + dur);
  
  osc.connect(env);
  env.connect(getAudioDest());
  
  osc.start(time);
  osc.stop(time + dur);
}

function playAcidBass(freq, time, dur, vol) {
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);
  
  filter.type = 'lowpass';
  filter.Q.setValueAtTime(10.0, time);
  filter.frequency.setValueAtTime(2400, time);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.4, time + dur * 0.45);
  
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(vol * 0.32, time + 0.006);
  env.gain.exponentialRampToValueAtTime(vol * 0.12, time + dur * 0.65);
  env.gain.linearRampToValueAtTime(0, time + dur);
  
  osc.connect(filter);
  filter.connect(env);
  env.connect(getAudioDest());
  
  osc.start(time);
  osc.stop(time + dur);
}

function playSquareBass(freq, time, dur, vol) {
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, time);
  
  filter.type = 'lowpass';
  filter.Q.setValueAtTime(1.8, time);
  filter.frequency.setValueAtTime(freq * 3.5, time);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.1, time + dur * 0.4);
  
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(vol * 0.28, time + 0.008);
  env.gain.setValueAtTime(vol * 0.2, time + dur * 0.45);
  env.gain.exponentialRampToValueAtTime(0.001, time + dur);
  
  osc.connect(filter);
  filter.connect(env);
  env.connect(getAudioDest());
  
  osc.start(time);
  osc.stop(time + dur);
}

function playTone(freq, time, dur, waveType, filterFreq, vol, trackType = 'melody') {
  const v = vol != null ? vol : 0.25;
  if (trackType === 'melody') {
    if (waveType === 'sine') {
      playFMPiano(freq, time, dur, v);
    } else if (waveType === 'triangle') {
      playPluckString(freq, time, dur, v, false);
    } else if (waveType === 'sawtooth') {
      playSynthLead(freq, time, dur, 'sawtooth', filterFreq, v);
    } else if (waveType === 'square') {
      playOrgan(freq, time, dur, v);
    } else {
      playSynthLead(freq, time, dur, waveType, filterFreq, v);
    }
  } else if (trackType === 'bass') {
    if (waveType === 'sine') {
      playSubBass(freq, time, dur, v);
    } else if (waveType === 'triangle') {
      playPluckString(freq, time, dur, v, true);
    } else if (waveType === 'sawtooth') {
      playAcidBass(freq, time, dur, v);
    } else if (waveType === 'square') {
      playSquareBass(freq, time, dur, v);
    } else {
      playSubBass(freq, time, dur, v);
    }
  } else {
    playFMPiano(freq, time, dur, v);
  }
}

function makeNoiseBuffer(dur) {
  const len = Math.ceil(audioCtx.sampleRate * dur);
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function playNoiseBurse(time, dur, hpFreq, vol) {
  const src = audioCtx.createBufferSource();
  src.buffer = makeNoiseBuffer(dur);
  const env = audioCtx.createGain();
  const v = vol != null ? vol : 0.25;
  env.gain.setValueAtTime(v * 0.7, time);
  env.gain.exponentialRampToValueAtTime(0.001, time + dur);
  const hpf = audioCtx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = hpFreq || 4000;
  const lpf = audioCtx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = Math.min((hpFreq || 4000) * 2.5, 14000);
  src.connect(hpf);
  hpf.connect(lpf);
  lpf.connect(env);
  env.connect(getAudioDest());
  src.start(time);
  src.stop(time + dur);
}

function playMetallicHats(time, dur, isClosed, vol) {
  const oscFrequencies = [263, 400, 543, 674, 821, 953];
  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(11000, time);
  bandpass.Q.setValueAtTime(2.5, time);
  
  const highpass = audioCtx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(8000, time);
  
  const env = audioCtx.createGain();
  const peakVol = isClosed ? 0.16 * vol : 0.12 * vol;
  const decay = isClosed ? 0.05 : 0.32;
  
  env.gain.setValueAtTime(peakVol, time);
  env.gain.exponentialRampToValueAtTime(0.001, time + decay);
  
  const oscs = oscFrequencies.map(freq => {
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    osc.connect(bandpass);
    return osc;
  });
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = makeNoiseBuffer(decay * 1.5);
  const noiseHpf = audioCtx.createBiquadFilter();
  noiseHpf.type = 'highpass';
  noiseHpf.frequency.setValueAtTime(9000, time);
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(peakVol * 0.4, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decay);
  
  noise.connect(noiseHpf);
  noiseHpf.connect(noiseGain);
  noiseGain.connect(env);
  
  bandpass.connect(highpass);
  highpass.connect(env);
  env.connect(getAudioDest());
  
  oscs.forEach(o => {
    o.start(time);
    o.stop(time + decay);
  });
  noise.start(time);
  noise.stop(time + decay);
}

function playPerc(sound, time, dur, vol = 1.0) {
  switch (sound) {
    case 'kick': {
      const osc = audioCtx.createOscillator();
      const env = audioCtx.createGain();
      const clickOsc = audioCtx.createOscillator();
      const clickEnv = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(55, time + 0.025);
      osc.frequency.exponentialRampToValueAtTime(32, time + dur);
      
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(0.7 * vol, time + 0.004);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur);
      
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(1000, time);
      clickOsc.frequency.exponentialRampToValueAtTime(80, time + 0.015);
      
      clickEnv.gain.setValueAtTime(0.35 * vol, time);
      clickEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, time);
      
      osc.connect(filter);
      clickOsc.connect(filter);
      filter.connect(env);
      env.connect(getAudioDest());
      
      clickEnv.connect(getAudioDest());
      
      osc.start(time);
      osc.stop(time + dur);
      clickOsc.start(time);
      clickOsc.stop(time + 0.015);
      break;
    }
    case 'snare': {
      const bodyOsc = audioCtx.createOscillator();
      const bodyEnv = audioCtx.createGain();
      
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(180, time);
      bodyOsc.frequency.exponentialRampToValueAtTime(100, time + 0.07);
      
      bodyEnv.gain.setValueAtTime(0.32 * vol, time);
      bodyEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
      
      const noise = audioCtx.createBufferSource();
      noise.buffer = makeNoiseBuffer(dur * 0.75);
      
      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1800, time);
      noiseFilter.Q.setValueAtTime(1.5, time);
      
      const noiseHpf = audioCtx.createBiquadFilter();
      noiseHpf.type = 'highpass';
      noiseHpf.frequency.setValueAtTime(1000, time);
      
      const noiseEnv = audioCtx.createGain();
      noiseEnv.gain.setValueAtTime(0.32 * vol, time);
      noiseEnv.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.55);
      
      bodyOsc.connect(bodyEnv);
      bodyEnv.connect(getAudioDest());
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseHpf);
      noiseHpf.connect(noiseEnv);
      noiseEnv.connect(getAudioDest());
      
      bodyOsc.start(time);
      bodyOsc.stop(time + 0.08);
      noise.start(time);
      noise.stop(time + dur * 0.75);
      break;
    }
    case 'hhClosed':
      playMetallicHats(time, dur * 0.25, true, vol);
      break;
    case 'hhOpen':
      playMetallicHats(time, dur * 0.75, false, vol);
      break;
    case 'clap': {
      const bp = audioCtx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1100;
      bp.Q.value = 1.2;
      bp.connect(getAudioDest());
      
      const numBursts = 4;
      for (let i = 0; i < numBursts; i++) {
        const burstTime = time + i * 0.012;
        const isLast = (i === numBursts - 1);
        const burstDur = isLast ? 0.15 : 0.012;
        const burstVol = (isLast ? 0.25 : 0.15) * vol;
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = makeNoiseBuffer(burstDur);
        
        const nGain = audioCtx.createGain();
        nGain.gain.setValueAtTime(burstVol, burstTime);
        nGain.gain.exponentialRampToValueAtTime(0.001, burstTime + burstDur);
        
        noise.connect(nGain);
        nGain.connect(bp);
        
        noise.start(burstTime);
        noise.stop(burstTime + burstDur);
      }
      break;
    }
    case 'tom': {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(170, time);
      osc.frequency.exponentialRampToValueAtTime(75, time + dur * 0.7);
      
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.42 * vol, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur);
      
      const click = audioCtx.createBufferSource();
      click.buffer = makeNoiseBuffer(0.012);
      const clickFilter = audioCtx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(900, time);
      
      const clickGain = audioCtx.createGain();
      clickGain.gain.setValueAtTime(0.2 * vol, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
      
      click.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(getAudioDest());
      
      osc.connect(env);
      env.connect(getAudioDest());
      
      osc.start(time);
      osc.stop(time + dur);
      click.start(time);
      click.stop(time + 0.012);
      break;
    }
    case 'rim': {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(1700, time);
      osc2.frequency.setValueAtTime(450, time);
      
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.25 * vol, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, time);
      filter.Q.value = 5.0;
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(env);
      env.connect(getAudioDest());
      
      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.045);
      osc2.stop(time + 0.045);
      break;
    }
    case 'shaker': {
      const src = audioCtx.createBufferSource();
      src.buffer = makeNoiseBuffer(dur * 0.55);
      const hpf = audioCtx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.setValueAtTime(6500, time);
      
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(0.06 * vol, time + dur * 0.12);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.55);
      
      src.connect(hpf);
      hpf.connect(env);
      env.connect(getAudioDest());
      
      src.start(time);
      src.stop(time + dur * 0.55);
      break;
    }
    case 'tamb': {
      const frequencies = [5800, 6700, 7500, 8300];
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.06 * vol, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
      
      const oscs = frequencies.map(f => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, time);
        osc.connect(env);
        return osc;
      });
      
      const noise = audioCtx.createBufferSource();
      noise.buffer = makeNoiseBuffer(0.07);
      const noiseHpf = audioCtx.createBiquadFilter();
      noiseHpf.type = 'highpass';
      noiseHpf.frequency.setValueAtTime(6000, time);
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.04 * vol, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
      
      noise.connect(noiseHpf);
      noiseHpf.connect(noiseGain);
      noiseGain.connect(getAudioDest());
      
      env.connect(getAudioDest());
      oscs.forEach(o => {
        o.start(time);
        o.stop(time + 0.11);
      });
      noise.start(time);
      noise.stop(time + 0.07);
      break;
    }
    case 'crash': {
      const duration = Math.max(1.1, dur * 2.5);
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.2 * vol, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const fMod = audioCtx.createGain();
      
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(320, time);
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(450, time);
      
      fMod.gain.setValueAtTime(800, time);
      
      osc2.connect(fMod);
      fMod.connect(osc1.frequency);
      
      const hpf = audioCtx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.setValueAtTime(4000, time);
      
      osc1.connect(hpf);
      
      const noise = audioCtx.createBufferSource();
      noise.buffer = makeNoiseBuffer(duration);
      const noiseHpf = audioCtx.createBiquadFilter();
      noiseHpf.type = 'highpass';
      noiseHpf.frequency.setValueAtTime(5000, time);
      
      noise.connect(noiseHpf);
      noiseHpf.connect(env);
      hpf.connect(env);
      
      env.connect(getAudioDest());
      
      osc1.start(time);
      osc2.start(time);
      noise.start(time);
      
      osc1.stop(time + duration);
      osc2.stop(time + duration);
      noise.stop(time + duration);
      break;
    }
    case 'ride': {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(380, time);
      osc2.frequency.setValueAtTime(580, time);
      
      const envBell = audioCtx.createGain();
      envBell.gain.setValueAtTime(0.06 * vol, time);
      envBell.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3000, time);
      filter.Q.value = 3.0;
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(envBell);
      envBell.connect(getAudioDest());
      
      const noise = audioCtx.createBufferSource();
      noise.buffer = makeNoiseBuffer(dur * 1.3);
      const noiseHpf = audioCtx.createBiquadFilter();
      noiseHpf.type = 'highpass';
      noiseHpf.frequency.setValueAtTime(8000, time);
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.02 * vol, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + dur * 1.05);
      
      noise.connect(noiseHpf);
      noiseHpf.connect(noiseGain);
      noiseGain.connect(getAudioDest());
      
      osc1.start(time);
      osc2.start(time);
      noise.start(time);
      
      osc1.stop(time + 0.28);
      osc2.stop(time + 0.28);
      noise.stop(time + dur * 1.3);
      break;
    }
    case 'cowbell': {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(540, time);
      osc2.frequency.setValueAtTime(800, time);
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, time);
      filter.Q.setValueAtTime(10, time);
      
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(0.2 * vol, time + 0.002);
      env.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(env);
      env.connect(getAudioDest());
      
      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.22);
      osc2.stop(time + 0.22);
      break;
    }
    case 'conga': {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, time);
      osc.frequency.exponentialRampToValueAtTime(110, time + dur * 0.35);
      
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.4 * vol, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.75);
      
      const slap = audioCtx.createBufferSource();
      slap.buffer = makeNoiseBuffer(0.012);
      const slapFilter = audioCtx.createBiquadFilter();
      slapFilter.type = 'bandpass';
      slapFilter.frequency.setValueAtTime(1500, time);
      const slapGain = audioCtx.createGain();
      slapGain.gain.setValueAtTime(0.15 * vol, time);
      slapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
      
      slap.connect(slapFilter);
      slapFilter.connect(slapGain);
      slapGain.connect(getAudioDest());
      
      osc.connect(env);
      env.connect(getAudioDest());
      
      osc.start(time);
      osc.stop(time + dur * 0.75);
      slap.start(time);
      slap.stop(time + 0.012);
      break;
    }
  }
}

function playMetronomeClick(time, isAccent) {
  if (!audioCtx || !metronomeEnabled) return;
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(isAccent ? 1200 : 900, time);
  osc.frequency.exponentialRampToValueAtTime(400, time + 0.03);
  const env = audioCtx.createGain();
  const vol = metronomeVolume * (isAccent ? 0.5 : 0.25);
  env.gain.setValueAtTime(vol, time);
  env.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
  osc.connect(env);
  env.connect(masterGain);
  osc.start(time);
  osc.stop(time + 0.03);
}

function quantizeStep(step) {
  if (quantizeStepSize <= 0) return step;
  const qs = Math.max(1, Math.round(quantizeStepSize));
  return Math.round(step / qs) * qs;
}

function updateQuantGrid() {
  const stepNums = document.querySelectorAll('.step-num');
  stepNums.forEach((el, i) => {
    if (i === 0) return;
    const step = i - 1;
    const isSnap = quantizeStepSize <= 0 || quantizeStep(step) === step;
    el.style.opacity = isSnap ? '' : '0.25';
  });
}

function updateTimelineGridForQuant() {
  if (!tlCells.length) return;
  const stepNums = document.querySelectorAll('.tl-step-num');
  stepNums.forEach((el, i) => {
    if (i === 0) return;
    const step = i - 1;
    const isSnap = quantizeStepSize <= 0 || quantizeStep(step) === step;
    el.style.opacity = isSnap ? '' : '0.2';
  });
}

function previewCell(r, c) {
  initAudio();
  const track = TRACKS[r];
  const stepDuration = 60 / bpm / 4;
  const trkVol = trackVolumes[r];
  if (track.type === 'perc') {
    const sound = trackOverrides[r] || track.sound;
    playPerc(sound, audioCtx.currentTime, stepDuration * 0.85, trkVol);
  } else {
    const freq = freqForMood(track, currentMood);
    const wave = trackOverrides[r] || currentMood.wave;
    playTone(freq, audioCtx.currentTime, stepDuration * 0.85, wave, currentMood.filter, (track.type === 'bass' ? 0.35 : 0.28) * trkVol, track.type);
  }
}

const PERC_SOUNDS = ['kick','snare','hhClosed','hhOpen','clap','tom','rim','shaker','tamb','crash','ride','cowbell','conga'];
const BASS_WAVES = ['default','sine','square','sawtooth','triangle'];

function getPlayPattern() {
  return overdubMode ? patternBank[overdubReturnPattern] : pattern;
}

function schedule() {
  if (!playing) return;
  const now = audioCtx.currentTime;
  const stepDuration = 60 / bpm / 4;
  const playPattern = getPlayPattern();

  while (nextNoteTime < now + SCHEDULE_AHEAD) {
    const prevStep = scheduleStep;
    scheduleStep = (scheduleStep + 1) % STEPS;
    const t = nextNoteTime;

    // Apply queued changes at loop boundary (wrap from last step to first)
    if (prevStep === STEPS - 1 && scheduleStep === 0) {
      if (pendingPatternIdx !== null) {
        loadPattern(pendingPatternIdx);
        pendingPatternIdx = null;
        updatePatButtons();
      }
      if (pendingOverdubToggle) {
        toggleOverdub();
        pendingOverdubToggle = false;
        updatePatButtons();
      }
    }

    for (let r = 0; r < TRACK_COUNT; r++) {
      if (!playPattern[r][scheduleStep] || isTrackMuted(r)) continue;
      const track = TRACKS[r];
      const trkVol = getPlayTrackVolumes()[r];
      if (track.type === 'perc') {
        const sound = getPlayTrackOverrides()[r] || track.sound;
        playPerc(sound, t, stepDuration * 0.85, trkVol);
        // Record if recording
        if (isRecording) {
          const relTime = t - recordStartTime;
          recordedEvents.push({
            track: r,
            time: relTime,
            type: 'perc',
            sound: sound,
            vol: trkVol,
            dur: stepDuration * 0.85
          });
          // Track this track for timeline grid
          if (!timelineTracks.has(r)) {
            timelineTracks.set(r, { row: timelineTracks.size, name: track.name, type: 'perc', sound: sound });
          }
        }
      } else {
        const freq = freqForMood(track, getPlayMood(), getPlayOctave());
        const wave = getPlayTrackOverrides()[r] || getPlayMood().wave;
        const filter = getPlayMood().filter;
        const baseVol = (track.type === 'bass' ? 0.35 : 0.28) * trkVol;
        playTone(freq, t, stepDuration * 0.85, wave, filter, baseVol, track.type);
        // Record if recording
        if (isRecording) {
          const relTime = t - recordStartTime;
          recordedEvents.push({
            track: r,
            time: relTime,
            type: track.type,
            freq: freq,
            wave: wave,
            filter: filter,
            vol: baseVol,
            dur: stepDuration * 0.85,
            mood: getPlayMood().id,
            octave: getPlayOctave()
          });
          if (!timelineTracks.has(r)) {
            timelineTracks.set(r, { row: timelineTracks.size, name: track.name, type: track.type });
          }
        }
      }
    }

    // Update timeline duration during recording
    if (isRecording) {
      timelineDuration = t - recordStartTime;
      // Update timeline grid in real-time (throttled)
      if (Math.floor(timelineDuration / timelineResolution) !== Math.floor((t - stepDuration - recordStartTime) / timelineResolution)) {
        buildTimelineGrid();
      }
    }

    if (metronomeEnabled) {
      let metroInterval = 4;
      if (quantizeStepSize > 0) metroInterval = Math.max(2, quantizeStepSize);
      if (scheduleStep % metroInterval === 0) {
        playMetronomeClick(t, scheduleStep === 0);
      }
    }

    if (scheduleStep !== displayStep) {
      displayStep = scheduleStep;
      requestAnimationFrame(() => renderPlayhead());
    }
    stepDisplay.textContent = (displayStep + 1) + '/' + STEPS;
    nextNoteTime += stepDuration;
  }

  timerID = setTimeout(schedule, SCHEDULE_AHEAD * 1000 * 0.5);
}

function startPlayback() {
  initAudio();
  if (playing) return;
  playing = true;
  displayStep = -1;
  scheduleStep = -1;
  nextNoteTime = audioCtx.currentTime + 0.05;
  statusDisplay.textContent = 'playing';
  playBtn.innerHTML = '▌▌ Pause';
  schedule();
}

function stopPlayback() {
  playing = false;
  if (timerID) { clearTimeout(timerID); timerID = null; }
  // Clear pending queue on stop
  pendingPatternIdx = null;
  pendingOverdubToggle = false;
  displayStep = -1;
  statusDisplay.textContent = 'stopped';
  stepDisplay.textContent = '';
  playBtn.innerHTML = '▶ Play';
  renderPlayhead();
  updatePatButtons();
}

function togglePlay() {
  if (playing) stopPlayback();
  else startPlayback();
}

function buildTimelineGrid() {
  const container = document.getElementById('tlGrid');
  container.innerHTML = '';
  tlCells = [];

  // Determine which tracks have recorded events
  const usedTracks = new Map(); // trackId -> { row, name, type, sound }
  let row = 0;
  for (const ev of recordedEvents) {
    if (!usedTracks.has(ev.track)) {
      const track = TRACKS[ev.track];
      const name = track.type === 'perc' ? (ev.sound || track.sound) : track.name;
      usedTracks.set(ev.track, { row: row++, name, type: track.type, sound: ev.sound || track.sound });
    }
  }
  timelineTracks = usedTracks;

// Calculate grid resolution
  const stepDuration = 60 / bpm / 4;
  const numCols = timelineResolutionMode === 'seconds'
    ? Math.max(Math.ceil(timelineDuration) + 2, 32)
    : Math.max(Math.ceil(timelineDuration / stepDuration) + 2, 32);

  container.style.setProperty('--tl-steps', numCols);
  const totalWidth = 30 + numCols * 28;
  container.style.width = totalWidth + 'px';
  container.style.minWidth = totalWidth + 'px';
  const frag = document.createDocumentFragment();

  // Header
  const header = document.createElement('div');
  header.className = 'tl-grid-header';
  const corner = document.createElement('div');
  corner.className = 'tl-step-num';
  header.appendChild(corner);
  for (let c = 0; c < numCols; c++) {
    const el = document.createElement('div');
    el.className = 'tl-step-num';
    if (timelineResolutionMode === 'seconds') {
      el.textContent = (c % 1 === 0) ? c.toFixed(0) : '';
    } else {
      el.textContent = (c % 4 === 0) ? '' + (Math.floor(c / 4) + 1) : '';
    }
    header.appendChild(el);
  }
  frag.appendChild(header);

  // Track rows
  for (const [trackId, info] of timelineTracks.entries()) {
    const label = document.createElement('div');
    label.className = 'tl-track-label';
    label.textContent = info.name;
    frag.appendChild(label);

    const cells = [];
    for (let c = 0; c < numCols; c++) {
      const cell = document.createElement('div');
      cell.className = 'tl-cell';
      cell.dataset.tlRow = info.row;
      cell.dataset.tlCol = c;
      frag.appendChild(cell);
      cells.push(cell);
    }
    tlCells.push(cells);
  }

  container.appendChild(frag);

  // Render recorded events
  for (const ev of recordedEvents) {
    const trackInfo = timelineTracks.get(ev.track);
    if (!trackInfo) continue;
    const col = timelineResolutionMode === 'seconds'
      ? Math.round(ev.time)
      : Math.round(ev.time / stepDuration);
    if (col >= 0 && col < numCols) {
      updateTimelineCell(trackInfo.row, col, true, trackInfo.type, trackInfo.sound);
    }
  }
}

function updateTimelineCell(row, col, on, type, sound) {
  if (!tlCells[row]) return;
  const cell = tlCells[row][col];
  if (!cell) return;
  if (on) {
    cell.classList.add('on');
    let palette;
    if (type === 'melody') {
      palette = currentMood.colors;
    } else if (type === 'bass') {
      palette = ['#7d9a7a','#8aaa7a','#6a8a6a','#9aba8a'];
    } else {
      const percColors = { kick:'#c96d4a', snare:'#d48a5a', hhClosed:'#e0a060', hhOpen:'#c97a50', clap:'#b84a3a', tom:'#d45a5a', rim:'#c94a3a', shaker:'#a060c0', tamb:'#c0a060', crash:'#ff6b35', ride:'#b537ff', cowbell:'#ff2d78', conga:'#00e5ff' };
      palette = [percColors[sound] || '#c99a4a'];
    }
    cell.style.setProperty('--tl-cell-color', palette[row % palette.length]);
  } else {
    cell.classList.remove('on');
  }
}

function renderTimelinePlayhead() {
  const numCols = tlCells[0]?.length || 0;
  for (let c = 0; c < numCols; c++) {
    const isActive = (c === timelinePlayhead);
    for (let r = 0; r < tlCells.length; r++) {
      const cell = tlCells[r][c];
      if (cell) cell.classList.toggle('playhead', isActive);
    }
  }
  // Auto-scroll to keep playhead visible
  if (timelinePlayhead >= 0) {
    const wrap = document.querySelector('.tl-grid-wrap');
    const cellWidth = 28;
    const labelWidth = 30;
    const targetX = labelWidth + timelinePlayhead * cellWidth - wrap.clientWidth / 2;
    wrap.scrollLeft = Math.max(0, targetX);
  }
}

function startTimelinePlayback() {
  initAudio();
  if (timelinePlaying) return;
  if (recordedEvents.length === 0) return;
  timelinePlaying = true;
  timelinePlayhead = -1;
  timelineEventIndex = 0;
  timelineNextEventTime = audioCtx.currentTime + 0.05;
  tlStatus.textContent = 'playing';
  tlPlayBtn.innerHTML = '▌▌ Pause';
  // Sort events by time
  recordedEvents.sort((a, b) => a.time - b.time);
  scheduleTimeline();
}

function stopTimelinePlayback() {
  timelinePlaying = false;
  if (timelineTimerID) { clearTimeout(timelineTimerID); timelineTimerID = null; }
  timelinePlayhead = -1;
  tlStatus.textContent = 'idle';
  tlPlayBtn.innerHTML = '▶ Play';
  renderTimelinePlayhead();
}

function scheduleTimeline() {
  if (!timelinePlaying) return;
  const now = audioCtx.currentTime;
  const stepDuration = 60 / bpm / 4;
  const numCols = tlCells[0]?.length || 0;
  
  // Advance playhead based on time
  const elapsed = now - timelineNextEventTime + 0.01; // small offset
  timelinePlayhead = Math.floor(elapsed / stepDuration);
  
  // Check if we've passed the end
  if (timelineEventIndex >= recordedEvents.length && timelinePlayhead > numCols) {
    stopTimelinePlayback();
    return;
  }

  // Play events at current time
  while (timelineEventIndex < recordedEvents.length) {
    const ev = recordedEvents[timelineEventIndex];
    const eventTime = timelineNextEventTime + ev.time;
    if (eventTime > now + 0.05) break; // schedule ahead
    
    const track = TRACKS[ev.track];
    if (track && !isTrackMuted(ev.track)) {
      if (ev.type === 'perc') {
        playPerc(ev.sound, eventTime, ev.dur || stepDuration * 0.85, ev.vol || 1.0);
      } else {
        playTone(ev.freq, eventTime, ev.dur || stepDuration * 0.85, ev.wave, ev.filter || currentMood.filter, ev.vol || 0.25, ev.type);
      }
    }
    timelineEventIndex++;
  }

  requestAnimationFrame(() => renderTimelinePlayhead());
  const maxTime = recordedEvents.length > 0 ? recordedEvents[recordedEvents.length - 1].time : 0;
  tlStatus.textContent = 'playing ' + (now - timelineNextEventTime).toFixed(1) + 's / ' + maxTime.toFixed(1) + 's';
  timelineTimerID = setTimeout(scheduleTimeline, stepDuration * 1000 * 0.5);
}

function clearTimeline() {
  recordedEvents = [];
  timelineTracks.clear();
  timelineDuration = 0;
  timelineEventIndex = 0;
  buildTimelineGrid();
  stopTimelinePlayback();
  tlStatus.textContent = 'cleared';
}

function exportTimeline() {
  const data = {
    version: 2,
    bpm, mood: currentMood.id,
    timelineResolution: tlResSelect.value,
    events: recordedEvents,
    trackOverrides: trackOverrides.map(v => v || null),
  };
  const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sequence-recording.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importTimeline(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.events && Array.isArray(data.events)) {
        recordedEvents = data.events;
        if (data.timelineResolution) {
          tlResSelect.value = data.timelineResolution;
        }
        buildTimelineGrid();
        tlStatus.textContent = recordedEvents.length + ' events loaded';
        document.getElementById('timelineWrap').style.display = recordedEvents.length > 0 ? '' : 'none';
      }
    } catch(err) {
      alert('Could not import: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function initRecording() {
  initAudio();
  isRecording = !isRecording;
  if (isRecording) {
    if (!playing) startPlayback();
    recordedEvents = [];
    timelineTracks.clear();
    timelineDuration = 0;
    recordStartTime = audioCtx.currentTime;
    buildTimelineGrid();
    recBtn.classList.add('is-recording');
    recBtn.innerHTML = '● Rec ●';
    document.getElementById('timelineWrap').style.display = '';
    tlStatus.textContent = 'recording...';
  } else {
    recBtn.classList.remove('is-recording');
    recBtn.innerHTML = '● Rec';
    timelineDuration = audioCtx.currentTime - recordStartTime;
    tlStatus.textContent = recordedEvents.length + ' events recorded, ' + timelineDuration.toFixed(1) + 's';
    buildTimelineGrid();
  }
}

function saveCurrentPattern() {
  for (let r = 0; r < TRACK_COUNT; r++)
    for (let c = 0; c < STEPS; c++)
      patternBank[currentPatternIdx][r][c] = pattern[r][c];
  patternMoods[currentPatternIdx] = parseInt(moodSelect.value);
  patternOctaves[currentPatternIdx] = octaveShift;
}

function loadPattern(idx) {
  saveCurrentPattern();
  currentPatternIdx = idx;
  const src = patternBank[idx];
  for (let r = 0; r < TRACK_COUNT; r++)
    for (let c = 0; c < STEPS; c++)
      pattern[r][c] = src[r][c];
  trackVolumes = patternTrackVolumes[idx];
  for (let r = 0; r < TRACK_COUNT; r++)
    for (let c = 0; c < STEPS; c++)
      updateCell(r, c);
  moodSelect.value = patternMoods[idx];
  applyMood(MOODS[patternMoods[idx]]);
  octaveShift = patternOctaves[idx];
  updateOctaveDisplay();
  updatePatButtons();
  updatePatNoteIndicators();
  updateVolumeBars();
  autoSave();
}

let autoSave = function(){};

const grid = document.getElementById('grid');
const fragment = document.createDocumentFragment();

const headerDiv = document.createElement('div');
headerDiv.className = 'grid-header';
const corner = document.createElement('div');
corner.className = 'step-num';
headerDiv.appendChild(corner);
for (let c = 0; c < STEPS; c++) {
  const el = document.createElement('div');
  el.className = 'step-num';
  el.textContent = (c % 4 === 0) ? '' + (Math.floor(c / 4) + 1) : '';
  headerDiv.appendChild(el);
}
fragment.appendChild(headerDiv);

const sectionInfo = {
  melody:     { badge: 'Melody', cls: 'badge-melody' },
  bass:       { badge: 'Bass', cls: 'badge-bass' },
  percussion: { badge: 'Percussion', cls: 'badge-perc' },
};

let prevType = null;
const cellElements = [];
const sectionMuteButtons = {};

const typeToSection = { melody:'melody', bass:'bass', perc:'percussion' };

TRACKS.forEach((track, r) => {
  if (!prevType || track.type !== prevType) {
    const div = document.createElement('div');
    div.className = 'section-divider';
    div.style.gridColumn = '1 / -1';
    const sec = typeToSection[track.type];
    const info = sectionInfo[sec];
    div.innerHTML = `<span class="badge ${info.cls}">${info.badge}</span>`;
    const muteBtn = document.createElement('button');
    muteBtn.className = 'section-mute';
    muteBtn.textContent = 'On';
    muteBtn.dataset.section = sec;
    div.dataset.section = sec;
    muteBtn.addEventListener('click', () => {
      sectionMuted[sec] = !sectionMuted[sec];
      muteBtn.classList.toggle('is-muted', sectionMuted[sec]);
      muteBtn.textContent = sectionMuted[sec] ? 'Off' : 'On';
      updateSectionMuteVisual(sec);
      autoSave();
    });
    div.appendChild(muteBtn);
    sectionMuteButtons[sec] = muteBtn;
    fragment.appendChild(div);
  }
  prevType = track.type;

  const label = document.createElement('div');
  label.className = 'track-label';
  label.dataset.trackRow = r;

  const volBar = document.createElement('div');
  volBar.className = 'vol-bar';
  volBar.dataset.trackRow = r;
  const volFill = document.createElement('div');
  volFill.className = 'vol-bar-fill';
  volFill.style.height = (trackVolumes[r] * 100) + '%';
  volBar.appendChild(volFill);

  function setTrackVolume(row, clientY) {
    const rect = volBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    trackVolumes[row] = Math.round(pct * 100) / 100;
    volFill.style.height = (trackVolumes[row] * 100) + '%';
    autoSave();
  }
  volBar.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    const row = parseInt(volBar.dataset.trackRow);
    setTrackVolume(row, e.clientY);
    function onMove(ev) { setTrackVolume(row, ev.clientY); }
    function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  label.appendChild(volBar);
  const nameSpan = document.createElement('span');
  nameSpan.textContent = track.name;
  nameSpan.style.cursor = 'pointer';
  function toggleTrackMute() {
    muted[r] = !muted[r];
    muteBtn.classList.toggle('is-muted', muted[r]);
    updateRowMuteVisual(r);
    autoSave();
  }
  nameSpan.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTrackMute();
  });
  label.appendChild(nameSpan);
  const soundSpan = document.createElement('span');
  soundSpan.className = 'track-sound';
  soundSpan.dataset.trackRow = r;
  label.appendChild(soundSpan);
  const muteBtn = document.createElement('button');
  muteBtn.className = 'mute-btn';
  muteBtn.textContent = '♫';
  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTrackMute();
  });
  label.appendChild(muteBtn);
  label.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showCtxMenu(r, e.clientX, e.clientY);
  });
  fragment.appendChild(label);

  const cells = [];
  for (let c = 0; c < STEPS; c++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.trackRow = r;
    cell.addEventListener('mouseenter', () => highlightRow(r, true));
    cell.addEventListener('mouseleave', () => highlightRow(r, false));
    cell.addEventListener('click', () => {
      let targetCol = c;
      if (quantizeStepSize > 1) {
        targetCol = quantizeStep(c);
      }
      pattern[r][targetCol] = !pattern[r][targetCol];
      updateCell(r, targetCol);
      updatePatNoteIndicators();
      autoSave();
      if (previewEnabled && pattern[r][targetCol]) previewCell(r, targetCol);
      if (isRecording && playing && pattern[r][targetCol]) {
        const pos = ((scheduleStep >= 0 ? scheduleStep : 0) + 1) % TL_STEPS;
        const quantPos = quantizeStep(pos);
        recordedEvents.push({ track: r, step: quantPos });
        updateTimelineCell(r, quantPos, true);
        document.getElementById('timelineWrap').style.display = '';
      }
    });
    fragment.appendChild(cell);
    cells.push(cell);
  }
  cellElements.push(cells);

  label.addEventListener('mouseenter', () => highlightRow(r, true));
  label.addEventListener('mouseleave', () => highlightRow(r, false));
});
grid.appendChild(fragment);

function getCellEl(row, col) {
  return cellElements[row][col];
}

function updateSectionMuteVisual(sec) {
  const [start, end] = SECTION_RANGES[sec];
  for (let r = start; r < end; r++) {
    for (let c = 0; c < STEPS; c++) {
      getCellEl(r, c).classList.toggle('section-muted', sectionMuted[sec]);
    }
  }
}

function updateRowMuteVisual(r) {
  for (let c = 0; c < STEPS; c++) {
    getCellEl(r, c).classList.toggle('track-muted', muted[r]);
  }
}

function highlightRow(r, on) {
  const cls = 'row-hover';
  for (let c = 0; c < STEPS; c++) {
    getCellEl(r, c).classList.toggle(cls, on);
  }
}

const INSTRUMENT_NAMES = {
  sine: 'Piano',
  triangle: 'Pluck',
  sawtooth: 'Synth',
  square: 'Organ'
};

const BASS_NAMES = {
  sine: 'Sub',
  triangle: 'Pluck',
  sawtooth: 'Acid',
  square: 'Retro'
};

function trackSoundLabel(r) {
  const track = TRACKS[r];
  if (track.type === 'perc') {
    const s = trackOverrides[r] || track.sound;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  if (track.type === 'bass') {
    const w = trackOverrides[r];
    return w ? (BASS_NAMES[w] || w) : 'mood';
  }
  if (track.type === 'melody') {
    const w = trackOverrides[r];
    return w ? (INSTRUMENT_NAMES[w] || w) : 'mood';
  }
  return '';
}
function updateTrackSoundLabel(r) {
  const el = document.querySelector(`.track-sound[data-track-row="${r}"]`);
  if (el) el.textContent = trackSoundLabel(r);
}
function updateAllTrackSoundLabels() {
  for (let r = 0; r < TRACK_COUNT; r++) updateTrackSoundLabel(r);
}

function updateVolumeBars() {
  document.querySelectorAll('.vol-bar-fill').forEach((fill, i) => {
    if (i < TRACK_COUNT) fill.style.height = (trackVolumes[i] * 100) + '%';
  });
}

function updatePatNoteIndicators() {
  for (let p = 0; p < MAX_PATTERNS; p++) {
    let hasNotes = false;
    for (let r = 0; r < TRACK_COUNT; r++) {
      if (patternBank[p][r].some(v => v)) { hasNotes = true; break; }
    }
    const btn = document.querySelector(`.pat-btn[data-pat="${p}"]`);
    if (btn) btn.classList.toggle('has-notes', hasNotes);
  }
}

const ctxMenu = document.getElementById('ctxMenu');
ctxMenu.addEventListener('click', (e) => {
  const item = e.target.closest('.context-menu-item');
  if (!item) return;
  const row = parseInt(ctxMenu.dataset.trackRow);
  const val = item.dataset.value;
  trackOverrides[row] = val === '' ? null : val;
  updateTrackSoundLabel(row);
  updateCell(row, 0);
  autoSave();
  ctxMenu.classList.remove('open');
});
document.addEventListener('click', (e) => {
  if (!ctxMenu.contains(e.target)) ctxMenu.classList.remove('open');
});

function showCtxMenu(r, x, y) {
  const track = TRACKS[r];
  let options = [];
  const current = trackOverrides[r] || '';
  if (track.type === 'perc') {
    options = [{ label: 'Default (' + track.sound + ')', value: '' }];
    PERC_SOUNDS.forEach(s => {
      if (s !== track.sound) options.push({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s });
    });
  } else if (track.type === 'bass') {
    options = [
      { label: 'Mood default', value: '' },
      { label: 'Warm Sub Bass', value: 'sine' },
      { label: 'Acoustic/Fretless Bass', value: 'triangle' },
      { label: 'Acid Bassline', value: 'sawtooth' },
      { label: 'Retro Square Bass', value: 'square' }
    ];
  } else if (track.type === 'melody') {
    options = [
      { label: 'Mood default', value: '' },
      { label: 'FM Piano / Bell', value: 'sine' },
      { label: 'Plucked String', value: 'triangle' },
      { label: 'Analog Synth', value: 'sawtooth' },
      { label: 'Drawbar Organ', value: 'square' }
    ];
  } else { ctxMenu.classList.remove('open'); return; }
  let html = '<div class="context-menu-header">' + (track.type === 'perc' ? 'Percussion' : 'Instrument') + '</div>';
  options.forEach(o => {
    const active = o.value === current ? ' is-active' : '';
    html += '<div class="context-menu-item' + active + '" data-value="' + o.value + '">' + o.label + '</div>';
  });
  ctxMenu.innerHTML = html;
  ctxMenu.dataset.trackRow = r;
  ctxMenu.style.left = Math.min(x, window.innerWidth - 170) + 'px';
  ctxMenu.style.top = Math.min(y, window.innerHeight - 300) + 'px';
  ctxMenu.classList.add('open');
}

function updateCell(row, col) {
  const cell = getCellEl(row, col);
  if (pattern[row][col]) {
    cell.classList.add('on');
    const track = TRACKS[row];
    const palette = track.type === 'melody' ? currentMood.colors
      : track.type === 'bass' ? ['#7d9a7a','#8aaa7a','#6a8a6a','#9aba8a']
      : ['#c99a4a','#d4aa5a','#b88a3a','#e0b86a'];
    cell.style.setProperty('--cell-color', palette[row % palette.length]);
  } else {
    cell.classList.remove('on');
  }
}

function updateGhostNotes() {
  for (let r = 0; r < TRACK_COUNT; r++) {
    for (let c = 0; c < STEPS; c++) {
      getCellEl(r, c).classList.remove('ghost');
    }
  }
  if (overdubMode && currentPatternIdx !== overdubReturnPattern) {
    const playPat = patternBank[overdubReturnPattern];
    for (let r = 0; r < TRACK_COUNT; r++) {
      for (let c = 0; c < STEPS; c++) {
        if (playPat[r][c] && !pattern[r][c]) {
          const cell = getCellEl(r, c);
          cell.classList.add('ghost');
          const track = TRACKS[r];
          const palette = track.type === 'melody' ? currentMood.colors
            : track.type === 'bass' ? ['#7d9a7a','#8aaa7a','#6a8a6a','#9aba8a']
            : ['#c99a4a','#d4aa5a','#b88a3a','#e0b86a'];
          cell.style.setProperty('--cell-color', palette[r % palette.length]);
        }
      }
    }
  }
}

function renderPlayhead() {
  for (let c = 0; c < STEPS; c++) {
    const isActive = (c === displayStep);
    for (let r = 0; r < TRACK_COUNT; r++) {
      getCellEl(r, c).classList.toggle('playhead', isActive);
    }
  }
}

function applyMood(mood) {
  currentMood = mood;
  document.getElementById('moodTag').textContent = mood.label;
  document.body.className = 'mood-' + mood.id;
  for (let r = 0; r < TRACK_COUNT; r++)
    for (let c = 0; c < STEPS; c++)
      updateCell(r, c);
  updateGhostNotes();
}

function randomPattern() {
  for (let r = 0; r < TRACK_COUNT; r++) {
    const density = TRACKS[r].type === 'perc' ? 0.35 : 0.25;
    for (let c = 0; c < STEPS; c++) {
      pattern[r][c] = Math.random() < density;
    }
  }
  const currentSound = (r) => trackOverrides[r] || TRACKS[r].sound;
  const kickIdx = TRACKS.findIndex((t, i) => currentSound(i) === 'kick');
  if (kickIdx >= 0) pattern[kickIdx] = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];
  const snareIdx = TRACKS.findIndex((t, i) => currentSound(i) === 'snare');
  if (snareIdx >= 0) pattern[snareIdx] = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
  for (let r = 0; r < TRACK_COUNT; r++)
    for (let c = 0; c < STEPS; c++)
      updateCell(r, c);
  updatePatNoteIndicators();
}

function clearPattern() {
  for (let r = 0; r < TRACK_COUNT; r++)
    for (let c = 0; c < STEPS; c++)
      pattern[r][c] = false;
  for (let r = 0; r < TRACK_COUNT; r++)
    for (let c = 0; c < STEPS; c++)
      updateCell(r, c);
  updatePatNoteIndicators();
}

function exportPattern() {
  saveCurrentPattern();
  const data = {
    version: 4,
    bpm, mood: currentMood.id,
    patterns: patternBank,
    patternTrackVolumes: patternTrackVolumes.map(v => Array.from(v)),
    patternMoods: patternMoods.map(i => MOODS[i].id),
    patternOctaves,
    currentPattern: currentPatternIdx,
    muted: Array.from(muted),
    sectionMuted,
  };
  const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sequencer-pattern.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importPattern(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.version >= 2 && data.patterns) {
        for (let p = 0; p < Math.min(MAX_PATTERNS, data.patterns.length); p++) {
          const src = data.patterns[p];
          for (let r = 0; r < Math.min(TRACK_COUNT, src.length); r++)
            for (let c = 0; c < Math.min(STEPS, src[r].length); c++)
              patternBank[p][r][c] = !!src[r][c];
          if (data.version >= 3 && data.patternMoods && data.patternMoods[p]) {
            const mi = MOODS.findIndex(m => m.id === data.patternMoods[p]);
            patternMoods[p] = mi >= 0 ? mi : 0;
          } else {
            const mi = data.mood ? MOODS.findIndex(m => m.id === data.mood) : -1;
            patternMoods[p] = mi >= 0 ? mi : 0;
          }
          if (data.version >= 3 && data.patternOctaves && data.patternOctaves[p] != null) {
            patternOctaves[p] = data.patternOctaves[p];
          } else {
            patternOctaves[p] = 0;
          }
          if (data.version >= 4 && data.patternTrackVolumes && data.patternTrackVolumes[p]) {
            const vsrc = data.patternTrackVolumes[p];
            for (let r = 0; r < Math.min(TRACK_COUNT, vsrc.length); r++)
              patternTrackVolumes[p][r] = vsrc[r];
          }
        }
        if (data.currentPattern != null) loadPattern(data.currentPattern);
        else loadPattern(0);
        if (data.muted) {
          for (let r = 0; r < Math.min(TRACK_COUNT, data.muted.length); r++) {
            muted[r] = !!data.muted[r];
            updateRowMuteVisual(r);
          }
        }
        if (data.sectionMuted) {
          for (const sec of ['melody','bass','percussion']) {
            if (data.sectionMuted[sec] != null) {
              sectionMuted[sec] = data.sectionMuted[sec];
              const btn = sectionMuteButtons[sec];
              if (btn) {
                btn.classList.toggle('is-muted', sectionMuted[sec]);
                btn.textContent = sectionMuted[sec] ? 'Off' : 'On';
              }
              updateSectionMuteVisual(sec);
            }
          }
        }
      } else if (data.pattern) {
        for (let r = 0; r < Math.min(TRACK_COUNT, data.pattern.length); r++)
          for (let c = 0; c < Math.min(STEPS, data.pattern[r].length); c++)
            pattern[r][c] = !!data.pattern[r][c];
        for (let r = 0; r < TRACK_COUNT; r++)
          for (let c = 0; c < STEPS; c++)
            updateCell(r, c);
      }
      if (data.bpm) {
        bpm = data.bpm;
        bpmSlider.value = bpm;
        bpmDisplay.textContent = bpm;
      }
      if (data.mood) {
        const found = MOODS.findIndex(m => m.id === data.mood);
        if (found >= 0) { moodSelect.value = found; applyMood(MOODS[found]); }
      }
    } catch(err) {
      alert('Could not import: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function buildPatButtons() {
  const container = document.getElementById('looperPats');
  container.innerHTML = '';
  for (let i = 0; i < MAX_PATTERNS; i++) {
    const btn = document.createElement('button');
    btn.className = 'pat-btn' + (i === 0 ? ' is-active' : '');
    btn.dataset.pat = i;
    btn.textContent = i + 1;
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.pat);
      if (idx !== currentPatternIdx) {
        if (playing) {
          pendingPatternIdx = idx;
          if (overdubMode) overdubLastEditedPattern = idx;
          updatePatButtons();
        } else if (overdubMode) {
          overdubLastEditedPattern = idx;
          saveCurrentPattern();
          currentPatternIdx = idx;
          const src = patternBank[idx];
          for (let r = 0; r < TRACK_COUNT; r++)
            for (let c = 0; c < STEPS; c++)
              pattern[r][c] = src[r][c];
          trackVolumes = patternTrackVolumes[idx];
          for (let r = 0; r < TRACK_COUNT; r++)
            for (let c = 0; c < STEPS; c++)
              updateCell(r, c);
          moodSelect.value = patternMoods[idx];
          applyMood(MOODS[patternMoods[idx]]);
          octaveShift = patternOctaves[idx];
          updateOctaveDisplay();
          updatePatButtons();
          updateGhostNotes();
          updateVolumeBars();
          autoSave();
        } else {
          loadPattern(idx);
        }
      }
    });
    container.appendChild(btn);
  }
}
buildPatButtons();

function updatePatButtons() {
  document.querySelectorAll('.pat-btn').forEach(b => {
    const idx = parseInt(b.dataset.pat);
    b.classList.toggle('is-active', idx === currentPatternIdx);
    b.classList.toggle('is-playing', overdubMode && idx === overdubReturnPattern);
    b.classList.toggle('is-queued', playing && idx === pendingPatternIdx);
  });
}

const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const randomBtn = document.getElementById('randomBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');
const statusDisplay = document.getElementById('statusDisplay');
const stepDisplay = document.getElementById('stepDisplay');
const bpmSlider = document.getElementById('bpmSlider');
const bpmDisplay = document.getElementById('bpmDisplay');
const volSlider = document.getElementById('volSlider');
const moodSelect = document.getElementById('moodSelect');
const odubBtn = document.getElementById('odubBtn');
const copyBtn = document.getElementById('copyBtn');
const octDown = document.getElementById('octDown');
const octUp = document.getElementById('octUp');
const octDisplay = document.getElementById('octDisplay');
const previewBtn = document.getElementById('previewBtn');
const recBtn = document.getElementById('recBtn');
const metroToggle = document.getElementById('metroToggle');
const metroVol = document.getElementById('metroVol');
const quantSelect = document.getElementById('quantSelect');
const quantLabel = document.getElementById('quantLabel');
const tlPlayBtn = document.getElementById('tlPlayBtn');
const tlStopBtn = document.getElementById('tlStopBtn');
const tlClearBtn = document.getElementById('tlClearBtn');
const tlExportBtn = document.getElementById('tlExportBtn');
const tlImportBtn = document.getElementById('tlImportBtn');
const tlFileInput = document.getElementById('tlFileInput');
const tlStatus = document.getElementById('tlStatus');
const reverbSlider = document.getElementById('reverbSlider');
const delaySlider = document.getElementById('delaySlider');

playBtn.addEventListener('click', togglePlay);
stopBtn.addEventListener('click', stopPlayback);

clearBtn.addEventListener('click', () => {
  if (!confirm('Clear current pattern?')) return;
  clearPattern();
});

randomBtn.addEventListener('click', randomPattern);
exportBtn.addEventListener('click', exportPattern);
importBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) importPattern(e.target.files[0]);
  fileInput.value = '';
});

previewBtn.addEventListener('click', () => {
  previewEnabled = !previewEnabled;
  previewBtn.classList.toggle('primary', previewEnabled);
  previewBtn.textContent = previewEnabled ? 'Preview' : 'Preview';
  autoSave();
});

bpmSlider.addEventListener('input', () => {
  bpm = parseInt(bpmSlider.value);
  bpmDisplay.textContent = bpm;
  updateDelayTime();
});
volSlider.addEventListener('input', () => {
  volume = volSlider.value / 100;
  if (masterGain) masterGain.gain.value = volume;
});

reverbSlider.addEventListener('input', () => {
  reverbMix = reverbSlider.value / 100;
  if (reverbGain && audioCtx) {
    reverbGain.gain.setTargetAtTime(reverbMix, audioCtx.currentTime, 0.05);
  }
});
reverbSlider.addEventListener('input', autoSave);

delaySlider.addEventListener('input', () => {
  delayMix = delaySlider.value / 100;
  if (delayGain && audioCtx) {
    delayGain.gain.setTargetAtTime(delayMix, audioCtx.currentTime, 0.05);
  }
});
delaySlider.addEventListener('input', autoSave);

let copyTarget = -1;
copyBtn.addEventListener('click', () => {
  copyTarget = (currentPatternIdx + 1) % MAX_PATTERNS;
  saveCurrentPattern();
  for (let r = 0; r < TRACK_COUNT; r++)
    for (let c = 0; c < STEPS; c++)
      patternBank[copyTarget][r][c] = pattern[r][c];
  updatePatNoteIndicators();
  copyBtn.textContent = '→ Copied to ' + 'ABCD'[copyTarget];
  setTimeout(() => { copyBtn.textContent = 'Copy →'; }, 1200);
});

let overdubReturnPattern = 0;
let overdubLastEditedPattern = 0;
let overdubMoodIdx = 0;
let overdubOctave = 0;
let overdubTrackVolumes = [];
let overdubTrackOverrides = [];

function getPlayMood() {
  return overdubMode ? MOODS[overdubMoodIdx] : currentMood;
}
function getPlayOctave() {
  return overdubMode ? overdubOctave : octaveShift;
}
function getPlayTrackVolumes() {
  return overdubMode ? overdubTrackVolumes : trackVolumes;
}
function getPlayTrackOverrides() {
  return overdubMode ? overdubTrackOverrides : trackOverrides;
}

function toggleOverdub() {
  overdubMode = !overdubMode;
  if (overdubMode) {
    overdubReturnPattern = currentPatternIdx;
    overdubLastEditedPattern = currentPatternIdx;
    overdubMoodIdx = patternMoods[overdubReturnPattern];
    overdubOctave = patternOctaves[overdubReturnPattern];
    overdubTrackVolumes = [...patternTrackVolumes[overdubReturnPattern]];
    overdubTrackOverrides = [...trackOverrides];
  } else {
    saveCurrentPattern();
    // Exit to the currently active pattern (not overdubReturnPattern if it changed)
    if (overdubLastEditedPattern !== currentPatternIdx) loadPattern(overdubLastEditedPattern);
    startPlayback();
  }
  odubBtn.classList.toggle('is-overdubbing', overdubMode);
  odubBtn.innerHTML = overdubMode ? '<span class="dot"></span> Overdub ●' : '<span class="dot"></span> Overdub';
  updateGhostNotes();
  updatePatButtons();
}

odubBtn.addEventListener('click', () => {
  if (playing) {
    pendingOverdubToggle = true;
  } else {
    toggleOverdub();
  }
});

function updateOctaveDisplay() {
  octDisplay.textContent = (octaveShift >= 0 ? '+' : '') + octaveShift;
}
octDown.addEventListener('click', () => {
  octaveShift = Math.max(-3, octaveShift - 1);
  patternOctaves[currentPatternIdx] = octaveShift;
  updateOctaveDisplay();
  autoSave();
});
octUp.addEventListener('click', () => {
  octaveShift = Math.min(3, octaveShift + 1);
  patternOctaves[currentPatternIdx] = octaveShift;
  updateOctaveDisplay();
  autoSave();
});

metroToggle.addEventListener('click', () => {
  metronomeEnabled = !metronomeEnabled;
  metroToggle.classList.toggle('primary', metronomeEnabled);
  autoSave();
});

metroVol.addEventListener('input', () => {
  metronomeVolume = metroVol.value / 100;
  autoSave();
});

quantSelect.addEventListener('change', () => {
  quantizeStepSize = parseInt(quantSelect.value);
  updateQuantGrid();
  autoSave();
});

recBtn.addEventListener('click', () => {
  initRecording();
  autoSave();
});

tlPlayBtn.addEventListener('click', () => {
  if (timelinePlaying) stopTimelinePlayback();
  else startTimelinePlayback();
});

tlStopBtn.addEventListener('click', stopTimelinePlayback);
tlClearBtn.addEventListener('click', clearTimeline);
tlExportBtn.addEventListener('click', exportTimeline);
tlImportBtn.addEventListener('click', () => tlFileInput.click());
tlFileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) importTimeline(e.target.files[0]);
  tlFileInput.value = '';
});

const tlResSelect = document.getElementById('tlResSelect');
tlResSelect.addEventListener('change', () => {
  timelineResolutionMode = tlResSelect.value;
  buildTimelineGrid();
});

MOODS.forEach((m, i) => {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = m.label;
  moodSelect.appendChild(opt);
});
moodSelect.value = 0;
moodSelect.addEventListener('change', () => {
  applyMood(MOODS[parseInt(moodSelect.value)]);
  patternMoods[currentPatternIdx] = parseInt(moodSelect.value);
  autoSave();
});
applyMood(MOODS[0]);
if (previewEnabled) previewBtn.classList.add('primary');

const modalOverlay = document.getElementById('modalOverlay');
document.getElementById('modalClose').addEventListener('click', () => modalOverlay.classList.remove('open'));
document.getElementById('helpHint').addEventListener('click', () => modalOverlay.classList.add('open'));

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;

  if (e.key === ' ') { e.preventDefault(); togglePlay(); return; }
  if (e.key === 's' && !e.ctrlKey && !e.metaKey) { stopPlayback(); return; }
  if (e.key === 'r' && e.shiftKey) { recBtn.click(); return; }
  if (e.key === 'r') { odubBtn.click(); return; }
  if (e.key === 'c') { clearBtn.click(); return; }
  if (e.key === '?') { modalOverlay.classList.add('open'); return; }
  if (e.key === '/') { modalOverlay.classList.add('open'); return; }
  if (e.key === 'Escape') { modalOverlay.classList.remove('open'); return; }

  if (e.key === 'ArrowUp') { octUp.click(); return; }
  if (e.key === 'ArrowDown') { octDown.click(); return; }
  if (e.key === 'b') {
    const btn = sectionMuteButtons['bass'];
    if (btn) btn.click();
    return;
  }
  if (e.key === 'p') {
    const btn = sectionMuteButtons['percussion'];
    if (btn) btn.click();
    return;
  }
  if (e.key === 'm') {
    const btn = sectionMuteButtons['melody'];
    if (btn) btn.click();
    return;
  }

  if (e.key === 'o') {
    previewEnabled = !previewEnabled;
    previewBtn.classList.toggle('primary', previewEnabled);
    autoSave();
    return;
  }

  const n = parseInt(e.key);
  if (n >= 1 && n <= 9 && n <= MAX_PATTERNS) {
    const pats = document.querySelectorAll('.pat-btn');
    if (pats[n - 1]) pats[n - 1].click();
    return;
  }
});

const STORAGE_KEY = 'sequencer-state';

function saveState() {
  saveCurrentPattern();
  try {
    const data = {
      version: 4,
      patternBank,
      patternTrackVolumes: patternTrackVolumes.map(v => Array.from(v)),
      patternMoods: patternMoods.map(i => MOODS[i].id),
      patternOctaves,
      currentPattern: currentPatternIdx,
      bpm, volume,
      muted: Array.from(muted),
      trackVolumes: Array.from(trackVolumes),
      sectionMuted,
      octaveShift,
      trackOverrides: trackOverrides.map(v => v || null),
      previewEnabled,
      metronomeEnabled, metronomeVolume,
      quantizeStepSize,
      recordedEvents,
      reverbMix,
      delayMix,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch(_) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.patternBank) return false;

    for (let p = 0; p < Math.min(MAX_PATTERNS, data.patternBank.length); p++) {
      const src = data.patternBank[p];
      for (let r = 0; r < Math.min(TRACK_COUNT, src.length); r++)
        for (let c = 0; c < Math.min(STEPS, src[r].length); c++)
          patternBank[p][r][c] = !!src[r][c];
      if (data.patternMoods && data.patternMoods[p]) {
        const mi = MOODS.findIndex(m => m.id === data.patternMoods[p]);
        patternMoods[p] = mi >= 0 ? mi : 0;
      }
      if (data.patternOctaves && data.patternOctaves[p] != null)
        patternOctaves[p] = data.patternOctaves[p];
    }

    if (data.bpm != null) {
      bpm = data.bpm;
      bpmSlider.value = bpm;
      bpmDisplay.textContent = bpm;
    }
    if (data.volume != null) {
      volume = data.volume;
      volSlider.value = volume * 100;
      if (masterGain) masterGain.gain.value = volume;
    }
    if (data.octaveShift != null) {
      octaveShift = data.octaveShift;
      updateOctaveDisplay();
    }
    if (data.muted) {
      for (let r = 0; r < Math.min(TRACK_COUNT, data.muted.length); r++)
        muted[r] = !!data.muted[r];
    }
    if (data.sectionMuted) {
      for (const sec of ['melody','bass','percussion']) {
        if (data.sectionMuted[sec] != null) {
          sectionMuted[sec] = data.sectionMuted[sec];
          const btn = sectionMuteButtons[sec];
          if (btn) { btn.classList.toggle('is-muted', sectionMuted[sec]); btn.textContent = sectionMuted[sec] ? 'Off' : 'On'; }
          updateSectionMuteVisual(sec);
        }
      }
    }

    if (data.trackOverrides) {
      for (let r = 0; r < Math.min(TRACK_COUNT, data.trackOverrides.length); r++)
        trackOverrides[r] = data.trackOverrides[r] || null;
    }

    if (data.patternTrackVolumes) {
      for (let p = 0; p < Math.min(MAX_PATTERNS, data.patternTrackVolumes.length); p++) {
        const src = data.patternTrackVolumes[p];
        for (let r = 0; r < Math.min(TRACK_COUNT, src.length); r++)
          patternTrackVolumes[p][r] = src[r];
      }
    } else if (data.trackVolumes) {
      for (let p = 0; p < MAX_PATTERNS; p++)
        for (let r = 0; r < Math.min(TRACK_COUNT, data.trackVolumes.length); r++)
          patternTrackVolumes[p][r] = data.trackVolumes[r];
    }

    if (data.previewEnabled != null) {
      previewEnabled = data.previewEnabled;
      if (previewBtn) previewBtn.classList.toggle('primary', previewEnabled);
    }

    if (data.metronomeEnabled != null) {
      metronomeEnabled = data.metronomeEnabled;
      if (metroToggle) metroToggle.classList.toggle('primary', metronomeEnabled);
    }
    if (data.metronomeVolume != null) {
      metronomeVolume = data.metronomeVolume;
      if (metroVol) metroVol.value = metronomeVolume * 100;
    }
    if (data.quantizeStepSize != null) {
      quantizeStepSize = data.quantizeStepSize;
      if (quantSelect) quantSelect.value = '' + quantizeStepSize;
    }
    updateQuantGrid();
    if (data.recordedEvents) {
      recordedEvents = data.recordedEvents;
      for (const ev of recordedEvents) if (tlCells[ev.track]) updateTimelineCell(ev.track, ev.step, true);
      if (recordedEvents.length > 0) {
        const wrap = document.getElementById('timelineWrap');
        if (wrap) wrap.style.display = '';
      }
    }

    if (data.currentPattern != null) loadPattern(data.currentPattern);
    else loadPattern(0);

    for (let r = 0; r < TRACK_COUNT; r++) updateRowMuteVisual(r);
    updateAllTrackSoundLabels();
    if (data.reverbMix != null) {
      reverbMix = data.reverbMix;
      if (reverbSlider) reverbSlider.value = reverbMix * 100;
      if (reverbGain) reverbGain.gain.setValueAtTime(reverbMix, audioCtx.currentTime);
    }
    if (data.delayMix != null) {
      delayMix = data.delayMix;
      if (delaySlider) delaySlider.value = delayMix * 100;
      if (delayGain) delayGain.gain.setValueAtTime(delayMix, audioCtx.currentTime);
    }

    updatePatNoteIndicators();
    updateVolumeBars();
    return true;
  } catch(_) { return false; }
}

autoSave = function() { setTimeout(saveState, 0); };

const origClear = clearBtn.click;
clearBtn.addEventListener('click', autoSave);
randomBtn.addEventListener('click', autoSave);
exportBtn.addEventListener('click', autoSave);
bpmSlider.addEventListener('input', autoSave);
volSlider.addEventListener('input', autoSave);

if (!loadState()) {
  const demoSrc = [
    /* 0 C3   */ [1,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0],
    /* 1 D3   */ [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    /* 2 E3   */ [0,0,1,0, 0,0,0,0, 0,0,0,1, 0,0,1,0],
    /* 3 F3   */ [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    /* 4 G3   */ [0,0,0,1, 0,0,1,0, 0,0,1,0, 0,1,0,0],
    /* 5 A3   */ [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,0],
    /* 6 B3   */ [0,1,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
    /* 7 C4   */ [0,0,0,0, 1,0,0,1, 0,0,0,0, 0,0,0,1],
    /* 8 Bass1*/ [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,1],
    /* 9 Bass2*/ [0,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,0,0],
    /*10 Bass3*/ [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
    /*11 Bass4*/ [0,0,0,1, 0,0,0,0, 0,0,1,0, 0,0,0,0],
    /*12 Kick */ [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    /*13 Snare*/ [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    /*14 HH Cl*/ [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    /*15 HH Op*/ [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
    /*16 Clap */ [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    /*17 Tom  */ [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
  ];
  for (let r = 0; r < Math.min(TRACK_COUNT, demoSrc.length); r++)
    for (let c = 0; c < STEPS; c++)
      pattern[r][c] = demoSrc[r][c];
  for (let r = 0; r < TRACK_COUNT; r++)
    for (let c = 0; c < STEPS; c++)
      updateCell(r, c);
  for (let r = 0; r < TRACK_COUNT; r++)
    for (let c = 0; c < STEPS; c++)
      patternBank[0][r][c] = pattern[r][c];
  patternMoods[0] = 0;
  patternOctaves[0] = 0;
}

updateAllTrackSoundLabels();
updatePatNoteIndicators();
updateVolumeBars();
buildTimelineGrid();
updateQuantGrid();
updateTimelineGridForQuant();

console.log('✦ Sequencer ready — click Play or press Space');