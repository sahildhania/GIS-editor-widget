# GIS Editor Widget

This is a small responsive web page that uses the ArcGIS API for JavaScript to display a map and let you add FeatureLayers by URL.

Files added:
- `index.html` — main page with map and controls
- `css/style.css` — responsive styles
- `js/main.js` — ArcGIS map and UI logic
 - Editor widget integrated to allow editing of editable FeatureLayers

Default behavior:
- On page load the Trailheads FeatureLayer is added automatically: `https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0`.

Usage:
1. Open `index.html` in a browser that can load the ArcGIS CDN (no build step required).
2. Paste a FeatureLayer or MapServer sublayer URL into the input (or choose a sample) and click "Add Layer".
3. Use the added layers list to show/hide, zoom to or remove layers.

Notes:
- The page uses the ArcGIS JS API from the CDN (`https://js.arcgis.com/4.28/`). If you need a different version, edit the script tag in `index.html`.
- Sample layer URLs are provided in the dropdown; replace them with your own FeatureServer/MapServer endpoints as needed.

Responsive behavior:
- Desktop: map and side panel appear side-by-side.
- Mobile/tablet: controls stack below the map for easier touch use.

Want me to add:
- a simple editing widget for features
- persistence (save edits)
- authentication for secured services

Tell me which features you want next.
# GIS-editor-widget
Editor widget by handled improper input validation

