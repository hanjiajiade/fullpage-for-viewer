# Fullpage Screenshot

> A lightweight Chrome extension for capturing full-page, visible area, selected region, and specific element screenshots — all auto-saved as PNG.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Manifest](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## Features

| Mode | Shortcut | Description |
|------|----------|-------------|
| **Full Page** | `Alt + Shift + F` | Capture the entire scrollable page in one shot |
| **Visible Area** | `Alt + Shift + V` | Capture only the current viewport |
| **Select Area** | `Alt + Shift + A` | Drag to crop any specific region |
| **Select Element** | `Alt + Shift + E` | Hover & click to capture a DOM element |

All screenshots are **automatically downloaded as PNG** with a timestamped filename.

---

## Preview

```
┌──────────────────────────────────────
│  📷  Fullpage Screenshot             │
│      Capture & Save                  │
──────────────────────────────────────┤
│  🖼  Full Page Screenshot    ⇧F    │
│     Capture the entire page          │
│                                      │
│  👁  Visible Area Screenshot ⌥V    │
│     Capture the current viewport     │
│                                      │
│    Select Area             ⌥A    │
│     Drag to crop a region            │
│                                      │
│  ↗  Select Element          ⌥⇧E    │
│     Hover & click an element         │
└──────────────────────────────────────┘
```

---

## Installation

### From Source

1. **Clone the repository**

   ```bash
   git clone https://github.com/hanjiajiade/fullpage-for-viewer.git
   cd fullpage-for-viewer
   ```

2. **Load the extension in Chrome**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in the top-right corner)
   - Click **Load unpacked**
   - Select the project folder

3. **Done!** The extension icon will appear in your toolbar.

---

## Usage

### Popup Interface

Click the extension icon in the Chrome toolbar to open the popup. Click any of the four mode cards to trigger the corresponding screenshot.

### Keyboard Shortcuts

| Action | Windows / Linux | macOS |
|--------|-----------------|-------|
| Full Page | `Alt + Shift + F` | `⌥ + ⇧ + F` |
| Visible Area | `Alt + Shift + V` | `⌥ + ⇧ + V` |
| Select Area | `Alt + Shift + A` | ` + ⇧ + A` |
| Select Element | `Alt + Shift + E` | `⌥ + ⇧ + E` |

> Shortcuts can be customized at `chrome://extensions/shortcuts`.

### Select Area Mode

1. Activate the mode via popup or shortcut
2. **Drag** on the page to draw a selection rectangle
3. **Release** to capture the selected region
4. Press `ESC` to cancel

### Select Element Mode

1. Activate the mode via popup or shortcut
2. **Hover** over any element — it will be highlighted with a blue outline
3. **Click** to capture that element
4. Press `ESC` to cancel

---

## How It Works

```
┌──────────┐     sendMessage      ┌──────────────┐
│  Popup   │ ──────────────────▶ │ Content Script│
│  / Hotkey│                      │  (content.js) │
└──────────┘                      └──────┬───────┘
                                         │
                                  html2canvas
                                  renders DOM
                                  to Canvas
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │   Canvas →   │
                                  │  Blob →      │
                                  │  DataURL     │
                                  └──────┬───────┘
                                         │ sendMessage
                                         ▼
                                  ┌──────────────┐
                                  │  Background   │
                                  │  (background.js)
                                  │  downloads    │
                                  │  PNG file     │
                                  └──────────────┘
```

### Technical Stack

- **Manifest V3** — Latest Chrome extension architecture
- **html2canvas** — DOM-to-Canvas rendering engine
- **Vanilla JS** — Zero framework dependencies, minimal footprint
- **chrome.downloads API** — Native auto-download support

---

## Project Structure

```
fullpage-for-viewer/
├── manifest.json          # Extension configuration (MV3)
├── popup.html             # Popup UI structure
├── popup.css              # Popup styles
├── popup.js               # Popup interaction logic
├── background.js          # Service worker (download handler)
├── content.js             # Content script (capture engine)
├── lib/
│   └── html2canvas.min.js # Screenshot rendering library
├── icons/
│   ├── icon16.png         # Toolbar icon
│   ├── icon48.png         # Extensions page icon
│   ── icon128.png        # Chrome Web Store icon
└── .gitignore
```

---

## Permissions

| Permission | Purpose |
|-----------|---------|
| `activeTab` | Access the current active tab for screenshot capture |
| `scripting` | Dynamically inject scripts when content script is not pre-loaded |
| `downloads` | Auto-save screenshots as PNG files |

> No data is collected, transmitted, or stored externally. All processing happens locally in your browser.

---

## Browser Compatibility

| Browser | Status |
|---------|--------|
| Google Chrome | Supported |
| Microsoft Edge | Supported (Chromium-based) |
| Other Chromium browsers | Likely supported |

---

## Troubleshooting

### "Error: Please refresh the page and try again"

The extension automatically falls back to dynamic script injection. If it still fails:
- Make sure you're on a **regular web page** (not `chrome://` pages)
- Refresh the page and try again

### Screenshot appears blank or incomplete

- Wait for the page to **fully load** before capturing
- Some pages use lazy-loading images that may not render

### Browser feels slow during capture

- Large pages require more memory — close unnecessary tabs
- The `scale` option is capped at `2x` to balance quality and performance

### Cross-origin images not captured

- html2canvas uses `useCORS: true`, but the image server must allow cross-origin access
- Some images may appear blank due to CORS restrictions

---

## License

[MIT](LICENSE)

---

## Contributing

Pull requests and issue reports are welcome! Feel free to fork this repo and submit your improvements.
