// Sample Engine — File-based sample playback with tonal support
// Supports: drum hits (one-shots) + tonal samples (pitched, multi-sample, looped)

const SampleEngine = (function() {
  // ─── State ───
  let audioCtx = null;
  let masterGain = null;
  let voiceBus = null;
  
  const loadedSamples = new Map();      // sampleId → AudioBuffer
  const sampleMetadata = new Map();     // sampleId → { name, duration, channels, sampleRate, loopStart, loopEnd, rootNote, loop, isTonal }
  const sampleBuffers = new Map();      // sampleId → ArrayBuffer (for re-decode / IndexedDB)
  
  // Voice pooling
  const voicePool = { sources: [], gains: [], filters: [] };
  
  // Per-track sample assignments
  const trackSamples = new Map();       // trackId → { sampleId, pitch, gain, filter, env, loop, offset, duration, isTonal }
  
  // Preview state
  let previewVoice = null;
  
  // ─── Init ───
  function init(ctx, master) {
    audioCtx = ctx;
    masterGain = master;
    
    voiceBus = audioCtx.createGain();
    voiceBus.connect(masterGain);
    
    // Pre-create voice nodes (gains and filters only - sources must be fresh each play)
    for (let i = 0; i < 48; i++) {
      voicePool.gains.push(audioCtx.createGain());
      voicePool.filters.push(audioCtx.createBiquadFilter());
    }
    
    console.log('[SampleEngine] Initialized');
    return true;
  }
  
  // ─── Voice Pool Management ───
  function acquireVoice() {
    const source = audioCtx.createBufferSource();
    const gain = voicePool.gains.pop() || audioCtx.createGain();
    const filter = voicePool.filters.pop() || audioCtx.createBiquadFilter();
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(voiceBus);
    
    return { source, gain, filter };
  }
  
  function releaseVoice(voice) {
    try { voice.source.disconnect(); } catch(_) {}
    try { voice.filter.disconnect(); } catch(_) {}
    try { voice.gain.disconnect(); } catch(_) {}
    
    voice.filter.type = 'lowpass';
    voice.filter.frequency.value = 20000;
    voice.filter.Q.value = 1;
    voice.gain.gain.value = 1;
    
    voicePool.gains.push(voice.gain);
    voicePool.filters.push(voice.filter);
  }
  
  // ─── Sample Loading & Decoding ───
  async function loadSample(sampleId, arrayBuffer, metadata = {}) {
    try {
      const buffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      
      loadedSamples.set(sampleId, buffer);
      sampleBuffers.set(sampleId, arrayBuffer);
      sampleMetadata.set(sampleId, {
        name: metadata.name || sampleId,
        duration: buffer.duration,
        channels: buffer.numberOfChannels,
        sampleRate: buffer.sampleRate,
        loopStart: metadata.loopStart || 0,
        loopEnd: metadata.loopEnd || buffer.duration,
        rootNote: metadata.rootNote !== undefined ? metadata.rootNote : 60, // MIDI note (C4 = 60)
        loop: metadata.loop !== false,
        isTonal: metadata.isTonal !== false,
        ...metadata
      });
      
      console.log(`[SampleEngine] Loaded: ${sampleId} (${buffer.duration.toFixed(2)}s, ${buffer.numberOfChannels}ch, root=${sampleMetadata.get(sampleId).rootNote})`);
      return buffer;
    } catch (e) {
      console.error(`[SampleEngine] Failed to decode ${sampleId}:`, e);
      throw e;
    }
  }
  
  async function fetchAndLoadSample(sampleId, url, metadata = {}) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return loadSample(sampleId, arrayBuffer, { ...metadata, name: metadata.name || sampleId });
  }
  
  async function loadSampleFromFile(sampleId, file, metadata = {}) {
    const arrayBuffer = await file.arrayBuffer();
    return loadSample(sampleId, arrayBuffer, { ...metadata, name: metadata.name || file.name });
  }
  
  function getSample(sampleId) { return loadedSamples.get(sampleId); }
  function getMetadata(sampleId) { return sampleMetadata.get(sampleId); }
  function hasSample(sampleId) { return loadedSamples.has(sampleId); }
  function unloadSample(sampleId) {
    loadedSamples.delete(sampleId);
    sampleBuffers.delete(sampleId);
    sampleMetadata.delete(sampleId);
  }
  function clearAllSamples() {
    loadedSamples.clear();
    sampleBuffers.clear();
    sampleMetadata.clear();
  }
  
  // ─── Tonal Playback (pitch-shifted, loopable) ───
  function playTonalSample(sampleId, time, options = {}) {
    const buffer = loadedSamples.get(sampleId);
    const meta = sampleMetadata.get(sampleId);
    
    if (!buffer || !meta) {
      console.warn(`[SampleEngine] Sample not loaded: ${sampleId}`);
      return null;
    }
    
    const {
      note = 60,           // MIDI note to play
      startNote = null,    // starting MIDI note for glide
      glideTime = 0,       // glide/portamento time in seconds
      velocity = 1,        // 0-1
      gain = 1,            // track gain
      filter = null,       // { type, frequency, Q }
      env = null,          // { attack, decay, sustain, release }
      offset = 0,          // start offset in seconds
      duration = null,     // override duration (null = full sample or loop)
      loop = meta.loop,    // override loop
      loopStart = meta.loopStart,
      loopEnd = meta.loopEnd,
      onEnd = null         // callback when stopped
    } = options;
    
    // Calculate playbackRate from root note
    const rootNote = meta.rootNote;
    const semitones = note - rootNote;
    const playbackRate = Math.pow(2, semitones / 12);
    const startPlaybackRate = startNote !== null ? Math.pow(2, (startNote - rootNote) / 12) : playbackRate;
    
    const voice = acquireVoice();
    const { source, gain: gainNode, filter: filterNode } = voice;
    
    source.buffer = buffer;
    source.playbackRate.setValueAtTime(startPlaybackRate, time);
    
    // Glide/Portamento
    if (glideTime > 0 && startNote !== null && startNote !== note) {
      source.playbackRate.exponentialRampToValueAtTime(playbackRate, time + glideTime);
    }
    
    // Loop setup
    if (loop && buffer.duration > loopEnd) {
      source.loop = true;
      source.loopStart = loopStart;
      source.loopEnd = loopEnd;
    }
    
    // Filter
    if (filter) {
      filterNode.type = filter.type || 'lowpass';
      filterNode.frequency.value = filter.frequency || 20000;
      filterNode.Q.value = filter.Q || 1;
    } else {
      filterNode.frequency.value = 20000;
    }
    
    // Envelope
    const v = velocity * gain;
    const a = env?.attack || 0.005;
    const d = env?.decay || 0.1;
    const s = env?.sustain !== undefined ? env.sustain : 0.7;
    const r = env?.release || 0.1;
    
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(v, time + a);
    gainNode.gain.linearRampToValueAtTime(v * s, time + a + d);
    
    // Determine stop time
    let stopTime;
    if (duration !== null) {
      stopTime = time + duration;
    } else if (loop) {
      stopTime = time + (loopEnd - loopStart) * 4; // default 4 loops
    } else {
      stopTime = time + buffer.duration - offset;
    }
    
    // Schedule release
    const releaseStart = stopTime - r;
    if (releaseStart > time + a + d) {
      gainNode.gain.setValueAtTime(v * s, releaseStart);
      gainNode.gain.linearRampToValueAtTime(0.0001, stopTime);
    } else {
      gainNode.gain.linearRampToValueAtTime(0.0001, stopTime);
    }
    
    source.start(time, offset);
    source.stop(stopTime);
    
    // Cleanup
    source.onended = () => {
      releaseVoice(voice);
      if (onEnd) onEnd();
    };
    
    return {
      voice,
      stop: (t = audioCtx.currentTime) => {
        const r = env?.release || 0.1;
        gainNode.gain.cancelScheduledValues(t);
        gainNode.gain.setValueAtTime(gainNode.gain.value, t);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + r);
        source.stop(t + r);
      },
      setFilter: (freq, q) => {
        filterNode.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.01);
        if (q !== undefined) filterNode.Q.value = q;
      },
      setGain: (g) => {
        gainNode.gain.setTargetAtTime(g * velocity, audioCtx.currentTime, 0.01);
      }
    };
  }
  
  // ─── One-shot Playback (drums, FX) ───
  function playOneShot(sampleId, time, options = {}) {
    const buffer = loadedSamples.get(sampleId);
    const meta = sampleMetadata.get(sampleId);
    
    if (!buffer) {
      console.warn(`[SampleEngine] Sample not loaded: ${sampleId}`);
      return null;
    }
    
    const {
      pitch = 0,           // semitones
      gain = 1,
      velocity = 1,
      filter = null,
      env = null,
      offset = 0,
      duration = null,
      pan = 0
    } = options;
    
    const voice = acquireVoice();
    const { source, gain: gainNode, filter: filterNode } = voice;
    
    source.buffer = buffer;
    source.playbackRate.value = Math.pow(2, pitch / 12);
    
    if (filter) {
      filterNode.type = filter.type || 'lowpass';
      filterNode.frequency.value = filter.frequency || 20000;
      filterNode.Q.value = filter.Q || 1;
    }
    
    const v = velocity * gain;
    const a = env?.attack || 0.001;
    const d = env?.decay || 0.1;
    const s = env?.sustain !== undefined ? env.sustain : 0;
    const r = env?.release || 0.05;
    
    const dur = duration || buffer.duration;
    const stopTime = time + dur;
    
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(v, time + a);
    if (s > 0) {
      gainNode.gain.linearRampToValueAtTime(v * s, time + a + d);
      gainNode.gain.setValueAtTime(v * s, stopTime - r);
    }
    gainNode.gain.linearRampToValueAtTime(0.0001, stopTime);
    
    source.start(time, offset);
    source.stop(stopTime);
    
    source.onended = () => releaseVoice(voice);
    
    return {
      voice,
      stop: (t = audioCtx.currentTime) => {
        const r = env?.release || 0.05;
        gainNode.gain.cancelScheduledValues(t);
        gainNode.gain.setValueAtTime(gainNode.gain.value, t);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + r);
        source.stop(t + r);
      },
      stopTime
    };
  }
  
  // ─── Track Assignment ───
  function assignSampleToTrack(trackId, sampleId, options = {}) {
    const meta = sampleMetadata.get(sampleId);
    if (!meta) {
      console.warn(`[SampleEngine] Cannot assign unknown sample: ${sampleId}`);
      return false;
    }
    
    trackSamples.set(trackId, {
      sampleId,
      isTonal: meta.isTonal || meta.loop || meta.rootNote !== undefined,
      ...options
    });
    
    return true;
  }
  
  function getTrackSample(trackId) { return trackSamples.get(trackId); }
  function getAllTrackSamples() { return trackSamples; }
  function clearTrackSample(trackId) { trackSamples.delete(trackId); }
  
  // ─── Play by Track ID (uses assignment) ───
  function playTrack(trackId, time, noteOrOptions, options = {}) {
    const assignment = trackSamples.get(trackId);
    if (!assignment) return null;
    
    const { sampleId, isTonal, ...trackOpts } = assignment;
    const mergedOpts = { ...trackOpts, ...options };
    
    if (isTonal) {
      const note = typeof noteOrOptions === 'number' ? noteOrOptions : (noteOrOptions?.note || 60);
      const glideTime = noteOrOptions?.glideTime || 0;
      const startNote = noteOrOptions?.startNote;
      return playTonalSample(sampleId, time, { ...mergedOpts, note, glideTime, startNote });
    } else {
      return playOneShot(sampleId, time, mergedOpts);
    }
  }
  
  // ─── Preview (audition) ───
  function previewSample(sampleId, options = {}) {
    stopPreview();
    const time = audioCtx.currentTime + 0.02;
    if (getMetadata(sampleId)?.isTonal) {
      previewVoice = playTonalSample(sampleId, time, { note: 60, duration: 2, ...options });
    } else {
      previewVoice = playOneShot(sampleId, time, options);
    }
    return previewVoice;
  }
  
  function stopPreview() {
    if (previewVoice) {
      previewVoice.stop();
      previewVoice = null;
    }
  }
  
  // ─── Utility: Generate tone as sample (for factory presets) ───
  async function generateToneSample(sampleId, options = {}) {
    const {
      type = 'sine',
      frequency = 440,
      duration = 2,
      sampleRate = 44100,
      envelope = null
    } = options;
    
    const length = Math.ceil(sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    const env = envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.5 };
    const totalSamples = length;
    const attackSamples = Math.ceil(env.attack * sampleRate);
    const decaySamples = Math.ceil(env.decay * sampleRate);
    const releaseSamples = Math.ceil(env.release * sampleRate);
    const sustainStart = attackSamples + decaySamples;
    const sustainEnd = totalSamples - releaseSamples;
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let val = 0;
      
      switch (type) {
        case 'sine':
          val = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          val = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
        case 'sawtooth':
          val = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
        case 'triangle':
          val = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
          break;
      }
      
      // Apply envelope
      let envVal = 1;
      if (i < attackSamples) {
        envVal = i / attackSamples;
      } else if (i < sustainStart) {
        envVal = 1 - (1 - env.sustain) * ((i - attackSamples) / decaySamples);
      } else if (i < sustainEnd) {
        envVal = env.sustain;
      } else {
        envVal = env.sustain * (1 - (i - sustainEnd) / releaseSamples);
      }
      
      data[i] = val * envVal * 0.5;
    }
    
    // Convert to WAV ArrayBuffer
    const wavBuffer = bufferToWav(buffer);
    return loadSample(sampleId, wavBuffer, {
      name: `${type}-${frequency}Hz`,
      rootNote: frequencyToMidiNote(frequency),
      loop: false,
      loopStart: 0,
      loopEnd: duration,
      isTonal: true
    });
  }
  
  function bufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const bytesPerSample = 2;
    const dataLength = numChannels * length * bytesPerSample;
    const arrayBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(arrayBuffer);
    
    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    
    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, 16, true);
    
    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write samples
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  }
  
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  function frequencyToMidiNote(freq) {
    return Math.round(69 + 12 * Math.log2(freq / 440));
  }
  
  // ─── Factory Bank Generation ───
  async function generateFactoryBanks() {
    console.log('[SampleEngine] Generating factory tonal samples...');
    
    // Bass samples (C2 = 65.41 Hz, C1 = 32.70 Hz)
    await generateToneSample('bass-sub-c2', { type: 'sine', frequency: 65.41, duration: 3, envelope: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.5 } });
    await generateToneSample('bass-sub-c1', { type: 'sine', frequency: 32.70, duration: 3, envelope: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.5 } });
    
    await generateToneSample('bass-acid-c2', { type: 'sawtooth', frequency: 65.41, duration: 2, envelope: { attack: 0.005, decay: 0.4, sustain: 0.5, release: 0.3 } });
    await generateToneSample('bass-acid-c1', { type: 'sawtooth', frequency: 32.70, duration: 2, envelope: { attack: 0.005, decay: 0.4, sustain: 0.5, release: 0.3 } });
    
    await generateToneSample('bass-fm-c2', { type: 'sine', frequency: 65.41, duration: 2, envelope: { attack: 0.003, decay: 0.2, sustain: 0.4, release: 0.4 } });
    await generateToneSample('bass-reese-c2', { type: 'sawtooth', frequency: 65.41, duration: 2, envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.5 } });
    
    // Melody samples (C4 = 261.63 Hz, C5 = 523.25 Hz)
    await generateToneSample('melody-piano-c4', { type: 'sine', frequency: 261.63, duration: 2, envelope: { attack: 0.002, decay: 0.15, sustain: 0.3, release: 0.8 } });
    await generateToneSample('melody-piano-c5', { type: 'sine', frequency: 523.25, duration: 2, envelope: { attack: 0.002, decay: 0.15, sustain: 0.3, release: 0.8 } });
    
    await generateToneSample('melody-pluck-c4', { type: 'triangle', frequency: 261.63, duration: 1.5, envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.5 } });
    await generateToneSample('melody-pluck-c5', { type: 'triangle', frequency: 523.25, duration: 1.5, envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.5 } });
    
    await generateToneSample('melody-saw-c4', { type: 'sawtooth', frequency: 261.63, duration: 2, envelope: { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.4 } });
    await generateToneSample('melody-saw-c5', { type: 'sawtooth', frequency: 523.25, duration: 2, envelope: { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.4 } });
    
    await generateToneSample('melody-square-c4', { type: 'square', frequency: 261.63, duration: 2, envelope: { attack: 0.005, decay: 0.05, sustain: 0.8, release: 0.3 } });
    await generateToneSample('melody-square-c5', { type: 'square', frequency: 523.25, duration: 2, envelope: { attack: 0.005, decay: 0.05, sustain: 0.8, release: 0.3 } });
    
    await generateToneSample('melody-organ-c4', { type: 'sine', frequency: 261.63, duration: 3, envelope: { attack: 0.05, decay: 0, sustain: 1, release: 0.5 } });
    await generateToneSample('melody-organ-c5', { type: 'sine', frequency: 523.25, duration: 3, envelope: { attack: 0.05, decay: 0, sustain: 1, release: 0.5 } });
    
    console.log('[SampleEngine] Factory samples generated');
  }
  
  // ─── Public API ───
  const api = {
    init,
    loadSample,
    fetchAndLoadSample,
    loadSampleFromFile,
    getSample,
    getMetadata,
    hasSample,
    unloadSample,
    clearAllSamples,
    playTonalSample,
    playOneShot,
    assignSampleToTrack,
    getTrackSample,
    getAllTrackSamples,
    clearTrackSample,
    playTrack,
    previewSample,
    stopPreview,
    generateToneSample,
    generateFactoryBanks,
    // For debugging/inspection
    get loadedCount() { return loadedSamples.size; },
    get loadedIds() { return Array.from(loadedSamples.keys()); }
  };

  window.SampleEngine = api;
  return api;
})();