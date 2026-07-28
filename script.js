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
let recordStartStep = 0;
let timelinePlaying = false;
let timelinePlayhead = -1;
let timelineTimerID = null;
let tlCells = [];
const TL_STEPS = 32;

let octaveShift = 0;
let playing = false;
let displayStep = -1;
let scheduleStep = -1;
let bpm = 110;
let volume = 0.7;
let currentMood = MOODS[0];

let audioCtx = null;
let masterGain = null;
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

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, time, dur, waveType, filterFreq, vol) {
  const osc = audioCtx.createOscillator();
  osc.type = waveType;
  osc.frequency.value = freq;
  const env = audioCtx.createGain();
  const attack = 0.006;
  const release = Math.min(dur * 0.4, 0.18);
  const gainVal = vol != null ? vol : waveType === 'square' || waveType === 'sawtooth' ? 0.20 : 0.25;
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(gainVal, time + attack);
  env.gain.setValueAtTime(gainVal * 0.85, time + dur - release);
  env.gain.linearRampToValueAtTime(0, time + dur);
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFreq, time);
  filter.frequency.linearRampToValueAtTime(Math.min(filterFreq * 1.3, 12000), time + dur * 0.3);
  filter.Q.value = 0.7;
  const sat = audioCtx.createWaveShaper();
  const k = 0.5;
  sat.curve = new Float32Array([-1, -k, k, 1]);
  osc.connect(filter);
  filter.connect(sat);
  sat.connect(env);
  env.connect(masterGain);
  osc.start(time);
  osc.stop(time + dur);
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
  env.connect(masterGain);
  src.start(time);
  src.stop(time + dur);
}

function playPerc(sound, time, dur) {
  switch (sound) {
    case 'kick': {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + dur);
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.65, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur);
      const boost = audioCtx.createBiquadFilter();
      boost.type = 'lowpass';
      boost.frequency.value = 400;
      osc.connect(boost);
      boost.connect(env);
      env.connect(masterGain);
      osc.start(time);
      osc.stop(time + dur);
      break;
    }
    case 'snare': {
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + dur * 0.3);
      const envO = audioCtx.createGain();
      envO.gain.setValueAtTime(0.25, time);
      envO.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.4);
      playNoiseBurse(time, dur * 0.5, 1500, 0.18);
      osc.connect(envO);
      envO.connect(masterGain);
      osc.start(time);
      osc.stop(time + dur);
      break;
    }
    case 'hhClosed':
      playNoiseBurse(time, dur * 0.25, 5000, 0.10);
      break;
    case 'hhOpen':
      playNoiseBurse(time, dur * 0.7, 4000, 0.08);
      break;
    case 'clap': {
      for (let i = 0; i < 3; i++)
        playNoiseBurse(time + i * 0.012, dur * 0.25, 1500, 0.05 * (1 - i * 0.25));
      break;
    }
    case 'tom': {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(60, time + dur * 0.6);
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.4, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(env);
      env.connect(masterGain);
      osc.start(time);
      osc.stop(time + dur);
      break;
    }
    case 'rim': {
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, time);
      osc.frequency.exponentialRampToValueAtTime(200, time + dur * 0.3);
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.15, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.25);
      const lpf = audioCtx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 4000;
      osc.connect(lpf);
      lpf.connect(env);
      env.connect(masterGain);
      osc.start(time);
      osc.stop(time + dur);
      break;
    }
    case 'shaker': {
      for (let i = 0; i < 3; i++)
        playNoiseBurse(time + i * dur * 0.15, dur * 0.1, 6000, 0.025);
      break;
    }
    case 'tamb': {
      for (let i = 0; i < 3; i++)
        playNoiseBurse(time + i * 0.008, dur * 0.2, 5000, 0.04);
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + dur * 0.25);
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.12, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.25);
      osc.connect(env);
      env.connect(masterGain);
      osc.start(time);
      osc.stop(time + dur);
      break;
    }
    case 'crash': {
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.35, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.8);
      const src = audioCtx.createBufferSource();
      src.buffer = makeNoiseBuffer(dur);
      const hpf = audioCtx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 2000;
      const lpf = audioCtx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 8000;
      src.connect(hpf);
      hpf.connect(lpf);
      lpf.connect(env);
      env.connect(masterGain);
      src.start(time);
      src.stop(time + dur);
      break;
    }
    case 'ride': {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 280;
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.2, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.6);
      const lpf = audioCtx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 3000;
      osc.connect(lpf);
      lpf.connect(env);
      env.connect(masterGain);
      osc.start(time);
      osc.stop(time + dur);
      playNoiseBurse(time, dur * 0.2, 5000, 0.035);
      break;
    }
    case 'cowbell': {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 400;
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.2, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.35);
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 10;
      osc.connect(filter);
      filter.connect(env);
      env.connect(masterGain);
      osc.start(time);
      osc.stop(time + dur);
      break;
    }
    case 'conga': {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, time);
      osc.frequency.exponentialRampToValueAtTime(60, time + dur * 0.5);
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0.35, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(env);
      env.connect(masterGain);
      osc.start(time);
      osc.stop(time + dur);
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
    playTone(freq, audioCtx.currentTime, stepDuration * 0.85, wave, currentMood.filter, (track.type === 'bass' ? 0.35 : 0.28) * trkVol);
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
    scheduleStep = (scheduleStep + 1) % STEPS;
    const t = nextNoteTime;

    for (let r = 0; r < TRACK_COUNT; r++) {
      if (!playPattern[r][scheduleStep] || isTrackMuted(r)) continue;
      const track = TRACKS[r];
      const trkVol = getPlayTrackVolumes()[r];
      if (track.type === 'perc') {
        const sound = getPlayTrackOverrides()[r] || track.sound;
        playPerc(sound, t, stepDuration * 0.85, trkVol);
      } else {
        const freq = freqForMood(track, getPlayMood(), getPlayOctave());
        const wave = getPlayTrackOverrides()[r] || getPlayMood().wave;
        playTone(freq, t, stepDuration * 0.85, wave, getPlayMood().filter, (track.type === 'bass' ? 0.35 : 0.28) * trkVol);
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
  displayStep = -1;
  statusDisplay.textContent = 'stopped';
  stepDisplay.textContent = '';
  playBtn.innerHTML = '▶ Play';
  renderPlayhead();
}

function togglePlay() {
  if (playing) stopPlayback();
  else startPlayback();
}

function buildTimelineGrid() {
  const container = document.getElementById('tlGrid');
  container.innerHTML = '';
  container.style.setProperty('--tl-steps', TL_STEPS);
  tlCells = [];
  const frag = document.createDocumentFragment();

  const header = document.createElement('div');
  header.className = 'tl-grid-header';
  const corner = document.createElement('div');
  corner.className = 'tl-step-num';
  header.appendChild(corner);
  for (let c = 0; c < TL_STEPS; c++) {
    const el = document.createElement('div');
    el.className = 'tl-step-num';
    el.textContent = (c % 4 === 0) ? '' + (Math.floor(c / 4) + 1) : '';
    header.appendChild(el);
  }
  frag.appendChild(header);

  TRACKS.forEach((track, r) => {
    const label = document.createElement('div');
    label.className = 'tl-track-label';
    label.textContent = track.name;
    frag.appendChild(label);

    const cells = [];
    for (let c = 0; c < TL_STEPS; c++) {
      const cell = document.createElement('div');
      cell.className = 'tl-cell';
      cell.dataset.tlRow = r;
      cell.dataset.tlCol = c;
      frag.appendChild(cell);
      cells.push(cell);
    }
    tlCells.push(cells);
  });

  container.appendChild(frag);
  updateTimelineGridForQuant();
}

function updateTimelineCell(row, col, on) {
  if (!tlCells[row]) return;
  const cell = tlCells[row][col];
  if (!cell) return;
  if (on) {
    cell.classList.add('on');
    const track = TRACKS[row];
    const palette = track.type === 'melody' ? currentMood.colors
      : track.type === 'bass' ? ['#7d9a7a','#8aaa7a','#6a8a6a','#9aba8a']
      : ['#c99a4a','#d4aa5a','#b88a3a','#e0b86a'];
    cell.style.setProperty('--tl-cell-color', palette[row % palette.length]);
  } else {
    cell.classList.remove('on');
  }
}

function renderTimelinePlayhead() {
  for (let c = 0; c < TL_STEPS; c++) {
    const isActive = (c === timelinePlayhead);
    for (let r = 0; r < TRACK_COUNT && r < tlCells.length; r++) {
      const cell = tlCells[r] && tlCells[r][c];
      if (cell) cell.classList.toggle('playhead', isActive);
    }
  }
}

function startTimelinePlayback() {
  initAudio();
  if (timelinePlaying) return;
  if (recordedEvents.length === 0) return;
  timelinePlaying = true;
  timelinePlayhead = -1;
  tlStatus.textContent = 'playing';
  tlPlayBtn.innerHTML = '▌▌ Pause';
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

  const nextStep = timelinePlayhead + 1;
  const nextTime = now + 0.01;
  const qs = Math.max(1, Math.round(quantizeStepSize));
  const maxStep = Math.ceil(TL_STEPS / qs) * qs;

  if (nextStep >= maxStep) {
    stopTimelinePlayback();
    return;
  }

  timelinePlayhead = quantizeStep(nextStep);

  const eventsAtStep = recordedEvents.filter(e => e.step === timelinePlayhead);
  for (const ev of eventsAtStep) {
    const track = TRACKS[ev.track];
    if (!track || isTrackMuted(ev.track)) continue;
    const trkVol = trackVolumes[ev.track];
    if (track.type === 'perc') {
      const sound = trackOverrides[ev.track] || track.sound;
      playPerc(sound, nextTime, stepDuration * 0.85, trkVol);
    } else {
      const freq = freqForMood(track, currentMood);
      const wave = trackOverrides[ev.track] || currentMood.wave;
      playTone(freq, nextTime, stepDuration * 0.85, wave, currentMood.filter, (track.type === 'bass' ? 0.35 : 0.28) * trkVol);
    }
  }

  requestAnimationFrame(() => renderTimelinePlayhead());
  tlStatus.textContent = 'playing ' + (timelinePlayhead + 1) + '/' + TL_STEPS;
  timelineTimerID = setTimeout(scheduleTimeline, stepDuration * 1000 * 0.5);
}

function clearTimeline() {
  recordedEvents = [];
  for (let r = 0; r < TRACK_COUNT && r < tlCells.length; r++)
    for (let c = 0; c < TL_STEPS && c < tlCells[r].length; c++)
      updateTimelineCell(r, c, false);
  stopTimelinePlayback();
  tlStatus.textContent = 'cleared';
}

function exportTimeline() {
  const data = {
    version: 1,
    bpm, mood: currentMood.id,
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
        for (let r = 0; r < TRACK_COUNT && r < tlCells.length; r++)
          for (let c = 0; c < TL_STEPS && c < tlCells[r].length; c++)
            updateTimelineCell(r, c, false);
        for (const ev of recordedEvents)
          updateTimelineCell(ev.track, ev.step, true);
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
    for (let r = 0; r < TRACK_COUNT && r < tlCells.length; r++)
      for (let c = 0; c < TL_STEPS && c < tlCells[r].length; c++)
        updateTimelineCell(r, c, false);
    recordStartStep = (scheduleStep + 1) % STEPS;
    recBtn.classList.add('is-recording');
    recBtn.innerHTML = '● Rec ●';
    document.getElementById('timelineWrap').style.display = '';
    tlStatus.textContent = 'recording...';
  } else {
    recBtn.classList.remove('is-recording');
    recBtn.innerHTML = '● Rec';
    tlStatus.textContent = recordedEvents.length + ' events recorded';
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

function trackSoundLabel(r) {
  const track = TRACKS[r];
  if (track.type === 'perc') return trackOverrides[r] || track.sound;
  if (track.type === 'bass') return trackOverrides[r] || 'mood';
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
    options = [{ label: 'Mood default', value: '' }];
    BASS_WAVES.forEach(w => {
      if (w !== 'default') options.push({ label: w.charAt(0).toUpperCase() + w.slice(1), value: w });
    });
  } else { ctxMenu.classList.remove('open'); return; }
  let html = '<div class="context-menu-header">' + (track.type === 'perc' ? 'Percussion' : 'Wave') + '</div>';
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
        if (overdubMode) {
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
    b.classList.toggle('is-active', parseInt(b.dataset.pat) === currentPatternIdx);
    b.classList.toggle('is-playing', overdubMode && parseInt(b.dataset.pat) === overdubReturnPattern);
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
});
volSlider.addEventListener('input', () => {
  volume = volSlider.value / 100;
  if (masterGain) masterGain.gain.value = volume;
});

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

odubBtn.addEventListener('click', () => {
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
    if (overdubLastEditedPattern !== currentPatternIdx) loadPattern(overdubLastEditedPattern);
    startPlayback();
  }
  odubBtn.classList.toggle('is-overdubbing', overdubMode);
  odubBtn.innerHTML = overdubMode ? '<span class="dot"></span> Overdub ●' : '<span class="dot"></span> Overdub';
  updateGhostNotes();
  updatePatButtons();
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