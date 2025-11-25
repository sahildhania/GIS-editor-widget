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

  const addedLayers = [];

  let editorWidget = null;

  function updateEditorLayers() {
    if (!editorWidget) return;
    const layerInfos = addedLayers.map(e => ({ layer: e.layer }));
    editorWidget.layerInfos = layerInfos;
  }

  function renderLayers() {
    layersListEl.innerHTML = '';
    addedLayers.forEach((entry, idx) => {
      const div = document.createElement('div');
      div.className = 'layer-item';

      const title = document.createElement('div');
      title.className = 'layer-title';
      title.textContent = entry.title || entry.layer.url || `Layer ${idx+1}`;

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
      addedLayers.push({ layer: fl, title });
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

    // Prefill the input with the default layer and add it
    try {
      layerUrlInput.value = DEFAULT_LAYER_URL;
      addLayerFromUrl(DEFAULT_LAYER_URL);
    } catch (e) {
      console.warn('Failed to add default layer', e);
    }
  });

});
