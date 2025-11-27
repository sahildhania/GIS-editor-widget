# GIS Editor Widget

A fully responsive GIS map viewer and feature editor built with ArcGIS API for JavaScript. Works seamlessly on desktop, tablet, and mobile devices.

## Features

- **Interactive map** with basemap switcher and legend
- **Add/manage FeatureLayers** by URL or use sample layers
- **Feature editing** with a collapsible editor panel
- **Mobile-responsive design** optimized for all screen sizes
- **Input validation & sanitization** to prevent injection attacks
- **Editable/read-only detection** with visual badges

## Files

- `index.html` — Main HTML page with responsive layout
- `css/style.css` — Fully responsive CSS with mobile-first breakpoints
- `js/main.js` — ArcGIS map logic, layer management, and input sanitization

## Quick Start

1. Open `index.html` in a web browser (no build step required).
2. The map loads with the default Trailheads FeatureLayer.
3. Click "Add Layer" to load additional FeatureLayers by URL, or choose a sample.
4. Click "📋 Expand Editor" to edit features in editable layers.

## Default Layers

**Trailheads (read-only):**
```
https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0
```

**ServiceRequest (editable sample):**
```
https://sampleserver6.arcgisonline.com/arcgis/rest/services/ServiceRequest/FeatureServer/0
```

## Responsive Breakpoints

| Screen Size | Layout | Editor |
|-------------|--------|--------|
| **Desktop** (>1024px) | Side-by-side controls | Slides in from right |
| **Tablet** (768–1024px) | Narrower controls panel | Responsive slide-in |
| **Mobile** (<768px) | Bottom drawer controls | Slides up from bottom |
| **Extra Small** (<400px) | Compact spacing | Mobile-optimized |

All layouts automatically adapt font sizes, button sizes, and spacing for optimal usability.

## Layer Management

- **Show/Hide**: Toggle layer visibility
- **Zoom**: Navigate to layer extent
- **Remove**: Delete layer from map
- **Editable Badge**: Indicates if layer supports create/update/delete operations

## Security

### Input Validation & Sanitization

The application implements client-side defense-in-depth:
- Strips angle brackets (`<>`) and control characters
- Removes script keywords (`script`, `eval`, `prompt`, `alert`)
- Filters template injection patterns (`${...}`)
- Sanitizes all attribute values before sending edits

**⚠️ Important**: Server-side validation is still required. Always validate and sanitize on your FeatureService backend:
- Whitelist/validate field types and lengths
- Escape/encode output when rendering data
- Use parameterized queries if applicable
- Implement CORS and authentication policies

## Configuration

To use a different ArcGIS JS API version, edit the script tag in `index.html`:
```html
<script src="https://js.arcgis.com/4.28/"></script>
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT (or add your license here)

