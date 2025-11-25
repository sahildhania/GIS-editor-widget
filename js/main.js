require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Legend",
  "esri/widgets/Editor"
], function(Map, MapView, FeatureLayer, Legend, Editor) {

  const map = new Map({ basemap: "streets-vector" });

  const view = new MapView({
    container: "map",
    map: map,
    center: [-98.5795, 39.8283],
    zoom: 4
  });

  const layersListEl = document.getElementById('layersList');
  const layerUrlInput = document.getElementById('layerUrl');
  const addBtn = document.getElementById('addBtn');
  const clearBtn = document.getElementById('clearBtn');
  const sampleSelect = document.getElementById('sampleSelect');

  // Default FeatureLayer to add on load
  const DEFAULT_LAYER_URL = 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0';
  // A commonly used editable sample (may be reachable depending on network)
  const EDITABLE_SAMPLE_URL = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/ServiceRequest/FeatureServer/0';

  const addedLayers = [];

  // Client-side wrapper to sanitize attributes before sending edits to the server.
  // This is defense-in-depth; server-side validation is still required.
  (function wrapApplyEdits() {
    const original = FeatureLayer.prototype.applyEdits;
    function sanitizeAttributeValue(v) {
      if (v == null) return v;
      if (typeof v !== 'string') return v;
      // remove control chars
      let s = v.replace(/[\x00-\x1F\x7F]/g, '');
      // remove angle brackets
      s = s.replace(/[<>]/g, '');
      // strip dangerous words/patterns
      s = s.replace(/javascript\s*:/gi, '');
      s = s.replace(/\b(script|eval|prompt|alert|onerror|onload|new Function)\b/gi, '');
      // remove template injection patterns
      s = s.replace(/\$\{.*?\}/g, '');
      // limit length
      const MAX = 2000;
      if (s.length > MAX) s = s.slice(0, MAX);
      return s;
    }

    FeatureLayer.prototype.applyEdits = function () {
      try {
        const args = Array.from(arguments);
        const edits = args[0] || {};
        ['addFeatures', 'updateFeatures', 'deleteFeatures'].forEach(op => {
          const list = edits[op] || (edits.features && (op === 'addFeatures' ? edits.features.add : null));
          if (Array.isArray(list)) {
            list.forEach(f => {
              if (f && f.attributes) {
                Object.keys(f.attributes).forEach(k => {
                  try {
                    f.attributes[k] = sanitizeAttributeValue(f.attributes[k]);
                  } catch (e) {
                    // ignore per-field errors
                  }
                });
              }
            });
          }
        });
      } catch (e) {
        console.warn('Sanitizer wrapper encountered an error', e);
      }
      return original.apply(this, arguments);
    };
  })();

  let editorWidget = null;

  function updateEditorLayers() {
    if (!editorWidget) return;
    // Only include layers that report edit capabilities
    const editableInfos = addedLayers
      .filter(e => e.editable)
      .map(e => ({ layer: e.layer }));
    editorWidget.layerInfos = editableInfos;
  }

  function renderLayers() {
    layersListEl.innerHTML = '';
    addedLayers.forEach((entry, idx) => {
      const div = document.createElement('div');
      div.className = 'layer-item';

      const title = document.createElement('div');
      title.className = 'layer-title';
      title.textContent = entry.title || entry.layer.url || `Layer ${idx+1}`;

      // editable badge
      const badge = document.createElement('div');
      badge.style.marginLeft = '8px';
      badge.style.fontSize = '0.8rem';
      badge.style.color = entry.editable ? '#0b6ef6' : '#888';
      badge.textContent = entry.editable ? 'editable' : 'read-only';

      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = entry.layer.visible ? 'Hide' : 'Show';
      toggleBtn.addEventListener('click', () => {
        entry.layer.visible = !entry.layer.visible;
        toggleBtn.textContent = entry.layer.visible ? 'Hide' : 'Show';
      });

      const zoomBtn = document.createElement('button');
      zoomBtn.textContent = 'Zoom';
      zoomBtn.addEventListener('click', () => {
        view.goTo(entry.layer.fullExtent || entry.layer.initialExtent).catch(()=>{});
      });

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        map.remove(entry.layer);
        const i = addedLayers.indexOf(entry);
        if(i>=0) addedLayers.splice(i,1);
        renderLayers();
        updateEditorLayers();
      });

      div.appendChild(title);
      div.appendChild(badge);
      div.appendChild(toggleBtn);
      div.appendChild(zoomBtn);
      div.appendChild(removeBtn);

      layersListEl.appendChild(div);
    });
  }

  

  function addLayerFromUrl(url) {
    if(!url) return;
    const fl = new FeatureLayer({ url });
    fl.load().then(() => {
      const title = fl.title || fl.id || fl.url;
      // determine editability from capabilities if available
      const caps = (fl.capabilities || '').toString();
      const editable = /Create|Update|Delete|Editing/i.test(caps);
      addedLayers.push({ layer: fl, title, editable });
      map.add(fl);
      renderLayers();
      updateEditorLayers();
      // zoom to layer extent if available
      if(fl.fullExtent) view.goTo(fl.fullExtent).catch(()=>{});
    }).catch(err => {
      alert('Failed to load layer: ' + (err && err.message));
      console.error(err);
    });
  }

  addBtn.addEventListener('click', () => {
    const url = layerUrlInput.value.trim();
    addLayerFromUrl(url);
  });

  clearBtn.addEventListener('click', () => {
    addedLayers.slice().forEach(e => map.remove(e.layer));
    addedLayers.length = 0;
    renderLayers();
    updateEditorLayers();
  });

  sampleSelect.addEventListener('change', () => {
    const url = sampleSelect.value;
    if(url) {
      layerUrlInput.value = url;
      addLayerFromUrl(url);
      sampleSelect.selectedIndex = 0;
    }
  });

  // Load editable sample button
  const loadEditableBtn = document.getElementById('loadEditableBtn');
  if (loadEditableBtn) {
    loadEditableBtn.addEventListener('click', () => {
      layerUrlInput.value = EDITABLE_SAMPLE_URL;
      addLayerFromUrl(EDITABLE_SAMPLE_URL);
    });
  }

  // Add a Legend widget so symbology is visible when layers load
  view.when(() => {
    const legend = new Legend({ view });
    view.ui.add(legend, 'bottom-right');

    // create Editor widget and add to UI (will show editable layers)
    try {
      editorWidget = new Editor({ view, layerInfos: [] });
      view.ui.add(editorWidget, 'top-right');
    } catch (e) {
      console.warn('Editor widget could not be created', e);
    }

    // Basic input sanitization for Editor widget to reduce XSS risk.
    // This intercepts user input/paste inside the Editor DOM and strips angle brackets.
    (function attachEditorSanitizer() {
      function sanitizeString(s) {
        if (!s || typeof s !== 'string') return s;
        // remove angle brackets and common script patterns
        return s.replace(/</g, '').replace(/>/g, '').replace(/script\s*:/gi, '');
      }

      function isInsideEditor(node) {
        if (!node || !node.closest) return false;
        return !!node.closest('[class*="esri-editor"]');
      }

      // sanitize on input events inside editor
      document.addEventListener('input', function (ev) {
        const el = ev.target;
        if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
        if (!isInsideEditor(el)) return;
        const clean = sanitizeString(el.value);
        if (clean !== el.value) {
          el.value = clean;
        }
      }, true);

      // sanitize pasted content
      document.addEventListener('paste', function (ev) {
        const el = ev.target;
        if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
        if (!isInsideEditor(el)) return;
        const pasted = (ev.clipboardData || window.clipboardData).getData('text');
        const clean = sanitizeString(pasted);
        if (clean !== pasted) {
          ev.preventDefault();
          // insert sanitized text at cursor
          const start = el.selectionStart || 0;
          const end = el.selectionEnd || 0;
          const val = el.value;
          el.value = val.slice(0, start) + clean + val.slice(end);
          const pos = start + clean.length;
          el.setSelectionRange(pos, pos);
        }
      }, true);

      // before apply/save: sanitize all inputs in editor container
      function sanitizeEditorFields() {
        const editorNode = document.querySelector('[class*="esri-editor"]');
        if (!editorNode) return;
        const inputs = editorNode.querySelectorAll('input[type="text"], textarea');
        inputs.forEach(i => {
          i.value = sanitizeString(i.value);
        });
      }

      // Hook save/apply buttons in editor (delegated)
      document.addEventListener('click', function (ev) {
        const btn = ev.target;
        if (!(btn instanceof HTMLElement)) return;
        if (!isInsideEditor(btn)) return;
        const text = (btn.textContent || '').toLowerCase();
        if (/save|apply|ok|submit/.test(text)) {
          try { sanitizeEditorFields(); } catch (e) { /* ignore */ }
        }
      }, true);
    })();

    // Prefill the input with the default layer and add it
    try {
      layerUrlInput.value = DEFAULT_LAYER_URL;
      addLayerFromUrl(DEFAULT_LAYER_URL);
    } catch (e) {
      console.warn('Failed to add default layer', e);
    }
  });

});
