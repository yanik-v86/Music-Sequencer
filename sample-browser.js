// Sample Browser UI — Sidebar sample browser with drag & drop, categories, preview

const SampleBrowser = (function() {
  // ─── State ───
  let currentBank = 'factory';
  let currentCategory = 'all';
  let searchQuery = '';
  let isDragging = false;
  let draggedSampleId = null;
  let targetTrackId = null;
  
  // Bank definitions
  const banks = {
    factory: {
      name: 'Factory',
      samples: {
        // Bass
        'bass-sub-c2': { name: 'Sub Bass C2', category: 'bass', type: 'tonal', rootNote: 36 },
        'bass-sub-c1': { name: 'Sub Bass C1', category: 'bass', type: 'tonal', rootNote: 24 },
        'bass-acid-c2': { name: 'Acid Bass C2', category: 'bass', type: 'tonal', rootNote: 36 },
        'bass-acid-c1': { name: 'Acid Bass C1', category: 'bass', type: 'tonal', rootNote: 24 },
        'bass-fm-c2': { name: 'FM Bass C2', category: 'bass', type: 'tonal', rootNote: 36 },
        'bass-reese-c2': { name: 'Reese Bass C2', category: 'bass', type: 'tonal', rootNote: 36 },
        
        // Melody
        'melody-piano-c4': { name: 'FM Piano C4', category: 'melody', type: 'tonal', rootNote: 60 },
        'melody-piano-c5': { name: 'FM Piano C5', category: 'melody', type: 'tonal', rootNote: 72 },
        'melody-pluck-c4': { name: 'Pluck C4', category: 'melody', type: 'tonal', rootNote: 60 },
        'melody-pluck-c5': { name: 'Pluck C5', category: 'melody', type: 'tonal', rootNote: 72 },
        'melody-saw-c4': { name: 'Saw Lead C4', category: 'melody', type: 'tonal', rootNote: 60 },
        'melody-saw-c5': { name: 'Saw Lead C5', category: 'melody', type: 'tonal', rootNote: 72 },
        'melody-square-c4': { name: 'Square Lead C4', category: 'melody', type: 'tonal', rootNote: 60 },
        'melody-square-c5': { name: 'Square Lead C5', category: 'melody', type: 'tonal', rootNote: 72 },
        'melody-organ-c4': { name: 'Organ C4', category: 'melody', type: 'tonal', rootNote: 60 },
        'melody-organ-c5': { name: 'Organ C5', category: 'melody', type: 'tonal', rootNote: 72 },
      }
    },
    user: {
      name: 'User Samples',
      samples: {}
    }
  };
  
  const categories = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'bass', label: 'Bass', icon: '🎵' },
    { id: 'melody', label: 'Melody', icon: '🎹' },
    { id: 'drums', label: 'Drums', icon: '🥁' },
    { id: 'fx', label: 'FX', icon: '✨' }
  ];
  
  // ─── DOM Elements ───
  let bankSelect, searchInput, fileInput, categoriesEl, listEl, loadStatusEl;
  
  // ─── Init ───
  function init() {
    bankSelect = document.getElementById('sampleBankSelect');
    searchInput = document.getElementById('sampleSearch');
    fileInput = document.getElementById('sampleFileInput');
    categoriesEl = document.getElementById('sampleCategories');
    listEl = document.getElementById('sampleList');
    loadStatusEl = document.getElementById('sampleLoadStatus');
    
    if (!bankSelect || !listEl) {
      console.warn('[SampleBrowser] DOM elements not found');
      return;
    }
    
    // Populate bank selector
    populateBankSelect();
    
    // Populate categories
    renderCategories();
    
    // Render initial sample list
    renderSampleList();
    
    // Event listeners
    bankSelect.addEventListener('change', onBankChange);
    searchInput.addEventListener('input', onSearch);
    fileInput.addEventListener('change', onFilesSelected);
    
    // Drag & drop on list
    setupDragDrop();
    
    console.log('[SampleBrowser] Initialized');
  }
  
  function populateBankSelect() {
    bankSelect.innerHTML = '';
    for (const [id, bank] of Object.entries(banks)) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = bank.name;
      bankSelect.appendChild(opt);
    }
    bankSelect.value = currentBank;
  }
  
  function renderCategories() {
    categoriesEl.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'sample-category-btn' + (cat.id === currentCategory ? ' active' : '');
      btn.dataset.category = cat.id;
      btn.innerHTML = `${cat.icon} ${cat.label}`;
      btn.addEventListener('click', () => onCategoryChange(cat.id));
      categoriesEl.appendChild(btn);
    });
  }
  
  function getFilteredSamples() {
    const bank = banks[currentBank];
    if (!bank) return [];
    
    return Object.entries(bank.samples)
      .filter(([id, sample]) => {
        // Category filter
        if (currentCategory !== 'all' && sample.category !== currentCategory) return false;
        
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const name = sample.name.toLowerCase();
          if (!name.includes(query)) return false;
        }
        
        return true;
      })
      .map(([id, sample]) => ({ id, ...sample }));
  }
  
  function renderSampleList() {
    const samples = getFilteredSamples();
    
    if (samples.length === 0) {
      listEl.innerHTML = '<div class="sample-empty" style="padding:16px;text-align:center;color:var(--text-muted);font-size:11px">No samples found</div>';
      return;
    }
    
    listEl.innerHTML = '';
    
    samples.forEach(sample => {
      const meta = SampleEngine.getMetadata(sample.id);
      const isLoaded = !!meta;
      const isAssigned = isSampleAssigned(sample.id);
      
      const item = document.createElement('div');
      item.className = 'sample-item' + (isAssigned ? ' assigned' : '');
      item.dataset.sampleId = sample.id;
      item.draggable = true;
      
      const duration = meta ? meta.duration.toFixed(1) + 's' : '—';
      const typeLabel = sample.type === 'tonal' ? '🎹 Tonal' : '🥁 One-shot';
      const rootNote = meta && meta.rootNote ? midiToNoteName(meta.rootNote) : '';
      
      item.innerHTML = `
        <div class="sample-item-info">
          <div class="sample-item-name">${escapeHtml(sample.name)}</div>
          <div class="sample-item-meta">
            <span class="sample-item-duration">${duration}</span>
            <span class="sample-item-type">${typeLabel}${rootNote ? ' • ' + rootNote : ''}</span>
            ${!isLoaded ? '<span class="sample-item-status" style="color:var(--accent-gold)">Not loaded</span>' : ''}
          </div>
        </div>
        <div class="sample-item-actions">
          <button class="sample-action-btn preview-btn" title="Preview" data-action="preview">▶</button>
          <button class="sample-action-btn assign-btn" title="Assign to selected track" data-action="assign">➕</button>
          <button class="sample-action-btn load-btn" title="Load sample" data-action="load" style="display:${isLoaded ? 'none' : 'inline-flex'}">⬇</button>
        </div>
      `;
      
      // Event listeners
      item.addEventListener('dragstart', onDragStart);
      item.addEventListener('dragend', onDragEnd);
      item.addEventListener('click', (e) => {
        if (e.target.closest('.sample-action-btn')) return;
        // Click to assign to selected track
        assignToSelectedTrack(sample.id);
      });
      
      item.querySelector('[data-action="preview"]').addEventListener('click', (e) => {
        e.stopPropagation();
        previewSample(sample.id);
      });
      
      item.querySelector('[data-action="assign"]').addEventListener('click', (e) => {
        e.stopPropagation();
        assignToSelectedTrack(sample.id);
      });
      
      item.querySelector('[data-action="load"]').addEventListener('click', async (e) => {
        e.stopPropagation();
        await loadSample(sample.id);
      });
      
      listEl.appendChild(item);
    });
  }
  
  function isSampleAssigned(sampleId) {
    for (const [, assignment] of SampleEngine.getAllTrackSamples()) {
      if (assignment.sampleId === sampleId) return true;
    }
    return false;
  }
  
  function midiToNoteName(midi) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = notes[midi % 12];
    return `${note}${octave}`;
  }
  
  function escapeHtml(str) {
    return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
  }
  
  // ─── Event Handlers ───
  function onBankChange(e) {
    currentBank = e.target.value;
    renderSampleList();
  }
  
  function onCategoryChange(catId) {
    currentCategory = catId;
    document.querySelectorAll('.sample-category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === catId);
    });
    renderSampleList();
  }
  
  function onSearch(e) {
    searchQuery = e.target.value;
    renderSampleList();
  }
  
  async function onFilesSelected(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    showLoadStatus(`Loading ${files.length} sample(s)...`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sampleId = 'user-' + file.name.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
      
      updateLoadStatus((i + 1) / files.length, `Loading ${file.name}...`);
      
      try {
        await SampleEngine.loadSampleFromFile(sampleId, file, {
          category: detectCategory(file.name),
          name: file.name
        });
        
        // Add to user bank
        banks.user.samples[sampleId] = {
          name: file.name,
          category: detectCategory(file.name),
          type: 'tonal' // default, user can change
        };
      } catch (err) {
        console.error('Failed to load sample:', file.name, err);
      }
    }
    
    hideLoadStatus();
    fileInput.value = ''; // Reset for re-selection
    
    if (currentBank === 'user') renderSampleList();
    populateBankSelect(); // Update user bank option
  }
  
  function detectCategory(filename) {
    const name = filename.toLowerCase();
    if (name.includes('kick') || name.includes('snare') || name.includes('hat') || name.includes('clap') || name.includes('tom') || name.includes('perc') || name.includes('drum')) return 'drums';
    if (name.includes('bass') || name.includes('sub') || name.includes('808')) return 'bass';
    if (name.includes('lead') || name.includes('synth') || name.includes('piano') || name.includes('pad') || name.includes('pluck') || name.includes('keys')) return 'melody';
    if (name.includes('fx') || name.includes('effect') || name.includes('riser') || name.includes('downlifter') || name.includes('impact')) return 'fx';
    return 'melody';
  }
  
  function showLoadStatus(message) {
    loadStatusEl.style.display = 'block';
    loadStatusEl.innerHTML = `<div>${message}</div><div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div>`;
  }
  
  function updateLoadStatus(progress, message) {
    const fill = loadStatusEl.querySelector('.progress-fill');
    const text = loadStatusEl.querySelector('div');
    if (fill) fill.style.width = (progress * 100) + '%';
    if (text) text.textContent = message;
  }
  
  function hideLoadStatus() {
    loadStatusEl.style.display = 'none';
  }
  
  // ─── Drag & Drop ───
  function setupDragDrop() {
    // Drop zone: track labels in grid
    document.addEventListener('dragover', (e) => {
      const trackLabel = e.target.closest('.track-label');
      if (trackLabel && isDragging) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        trackLabel.classList.add('drag-over');
      } else {
        document.querySelectorAll('.track-label.drag-over').forEach(el => el.classList.remove('drag-over'));
      }
    });
    
    document.addEventListener('dragleave', (e) => {
      const trackLabel = e.target.closest('.track-label');
      if (trackLabel && !trackLabel.contains(e.relatedTarget)) {
        trackLabel.classList.remove('drag-over');
      }
    });
    
    document.addEventListener('drop', (e) => {
      const trackLabel = e.target.closest('.track-label');
      if (trackLabel && isDragging && draggedSampleId) {
        e.preventDefault();
        const trackId = parseInt(trackLabel.dataset.trackRow);
        assignSampleToTrack(trackId, draggedSampleId);
        trackLabel.classList.remove('drag-over');
      }
      document.querySelectorAll('.track-label.drag-over').forEach(el => el.classList.remove('drag-over'));
      isDragging = false;
      draggedSampleId = null;
      document.querySelectorAll('.sample-item.dragging').forEach(el => el.classList.remove('dragging'));
    });
  }
  
  function onDragStart(e) {
    isDragging = true;
    draggedSampleId = e.currentTarget.dataset.sampleId;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', draggedSampleId);
  }
  
  function onDragEnd(e) {
    isDragging = false;
    draggedSampleId = null;
    e.currentTarget.classList.remove('dragging');
  }
  
  // ─── Assignment ───
  function assignSampleToTrack(trackId, sampleId) {
    if (!SampleEngine.hasSample(sampleId)) {
      // Auto-load if not loaded
      loadSample(sampleId).then(() => {
        doAssign(trackId, sampleId);
      });
    } else {
      doAssign(trackId, sampleId);
    }
  }
  
  function doAssign(trackId, sampleId) {
    const track = TRACKS[trackId];
    const meta = SampleEngine.getMetadata(sampleId);
    const isTonal = meta?.isTonal || meta?.loop || meta?.rootNote !== undefined;
    
    const options = {
      pitch: 0,
      gain: 1,
      velocity: 1,
      env: isTonal ? { attack: 0.005, decay: 0.1, sustain: 0.7, release: 0.2 } : { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
    };
    
    SampleEngine.assignSampleToTrack(trackId, sampleId, options);
    updateTrackSoundLabel(trackId);
    renderSampleList(); // Refresh assigned state
    
    console.log(`[SampleBrowser] Assigned ${sampleId} to track ${trackId} (${track.name})`);
  }
  
  function assignToSelectedTrack(sampleId) {
    // Find currently selected/active track (could be from context menu or last clicked)
    // For now, show a prompt or use a global selected track
    const selectedTrack = getSelectedTrackForAssignment();
    if (selectedTrack !== null) {
      assignSampleToTrack(selectedTrack, sampleId);
    } else {
      // Show toast or context hint
      showToast('Right-click a track → "Load Sample" to assign');
    }
  }
  
  function getSelectedTrackForAssignment() {
    // Could store last right-clicked track
    return window.lastContextTrackId ?? null;
  }
  
  function updateTrackSoundLabel(trackId) {
    const assignment = SampleEngine.getTrackSample(trackId);
    const labelEl = document.querySelector(`.track-sound[data-track-row="${trackId}"]`);
    if (labelEl && assignment) {
      const meta = SampleEngine.getMetadata(assignment.sampleId);
      labelEl.textContent = meta ? meta.name : assignment.sampleId;
    }
  }
  
  // ─── Preview ───
  function previewSample(sampleId) {
    if (!SampleEngine.hasSample(sampleId)) {
      loadSample(sampleId).then(() => {
        SampleEngine.previewSample(sampleId);
        updatePreviewButton(sampleId, true);
        setTimeout(() => updatePreviewButton(sampleId, false), 2000);
      });
    } else {
      SampleEngine.previewSample(sampleId);
      updatePreviewButton(sampleId, true);
      setTimeout(() => updatePreviewButton(sampleId, false), 2000);
    }
  }
  
  function updatePreviewButton(sampleId, playing) {
    const btn = document.querySelector(`.sample-item[data-sample-id="${sampleId}"] .preview-btn`);
    if (btn) {
      btn.classList.toggle('playing', playing);
      btn.textContent = playing ? '⏹' : '▶';
    }
  }
  
  // ─── Load Sample (for user bank) ───
  async function loadSample(sampleId) {
    const bank = banks[currentBank];
    if (!bank || !bank.samples[sampleId]) return;
    
    const sampleInfo = bank.samples[sampleId];
    // For factory samples, they're already generated
    // For user samples, they're already loaded via file input
    
    renderSampleList();
  }
  
  // ─── Toast Helper ───
  function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: rgba(20,20,40,0.9); backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border); color: var(--text);
      padding: 10px 16px; border-radius: 8px; font-size: 12px;
      z-index: 1000; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
  
  // ─── Public API ───
  const api = {
    init,
    renderSampleList,
    assignSampleToTrack,
    previewSample,
    getCurrentBank: () => currentBank,
    getBanks: () => banks
  };
  
  window.SampleBrowser = api;
  return api;
})();