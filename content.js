(function () {
  let activeOverlay = null;
  let highlightedElement = null;
  let loadingIndicator = null;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action !== 'capture') return;
    cleanup();

    switch (msg.mode) {
      case 'full':
        captureFull();
        break;
      case 'visible':
        captureVisible();
        break;
      case 'area':
        startAreaSelect();
        break;
      case 'element':
        startElementSelect();
        break;
    }
    sendResponse({ success: true });
    return true;
  });

  function showLoading(text) {
    removeLoading();
    loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'fps-loading';
    loadingIndicator.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.85); color: #fff; padding: 20px 32px;
      border-radius: 12px; font-size: 14px; font-family: sans-serif;
      z-index: 2147483647; display: flex; align-items: center; gap: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%;
      animation: fps-spin 0.8s linear infinite;
    `;
    const style = document.createElement('style');
    style.textContent = `@keyframes fps-spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    loadingIndicator.appendChild(spinner);
    const label = document.createElement('span');
    label.textContent = text;
    loadingIndicator.appendChild(label);
    document.body.appendChild(loadingIndicator);
  }

  function removeLoading() {
    if (loadingIndicator) {
      loadingIndicator.remove();
      loadingIndicator = null;
    }
    const style = document.getElementById('fps-loading')?.previousElementSibling;
    if (style && style.tagName === 'STYLE') style.remove();
  }

  function getCanvasOptions(overrides) {
    return Object.assign({
      scale: Math.min(window.devicePixelRatio || 1, 2),
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 5000,
      removeContainer: true,
    }, overrides);
  }

  function captureFull() {
    showLoading('Capturing full page...');
    const scrollHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const scrollWidth = Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth
    );

    html2canvas(document.documentElement, getCanvasOptions({
      width: scrollWidth,
      height: scrollHeight,
      windowWidth: scrollWidth,
      windowHeight: scrollHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    })).then(canvas => {
      removeLoading();
      sendToDownload(canvas);
    }).catch(err => {
      removeLoading();
      console.error('Full page capture failed:', err);
    });
  }

  function captureVisible() {
    showLoading('Capturing visible area...');
    html2canvas(document.body, getCanvasOptions({
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      x: 0,
      y: 0,
    })).then(canvas => {
      removeLoading();
      sendToDownload(canvas);
    }).catch(err => {
      removeLoading();
      console.error('Visible capture failed:', err);
    });
  }

  function captureRegion(x, y, w, h) {
    showLoading('Capturing selected area...');
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    html2canvas(document.body, getCanvasOptions({
      width: w,
      height: h,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      scrollX: scrollX,
      scrollY: scrollY,
      x: x - scrollX,
      y: y - scrollY,
    })).then(canvas => {
      removeLoading();
      sendToDownload(canvas);
    }).catch(err => {
      removeLoading();
      console.error('Region capture failed:', err);
    });
  }

  function sendToDownload(canvas) {
    canvas.toBlob(blob => {
      const reader = new FileReader();
      reader.onload = () => {
        chrome.runtime.sendMessage({ action: 'download-screenshot', dataUrl: reader.result });
      };
      reader.readAsDataURL(blob);
    }, 'image/png');
  }

  function startAreaSelect() {
    const overlay = document.createElement('div');
    overlay.id = 'fps-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 2147483647; cursor: crosshair;
    `;

    const mask = document.createElement('div');
    mask.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.3);
    `;
    overlay.appendChild(mask);

    const selector = document.createElement('div');
    selector.style.cssText = `
      position: absolute; border: 2px solid #4A90D9;
      background: rgba(74,144,217,0.15); display: none;
      pointer-events: none;
    `;
    overlay.appendChild(selector);

    const tip = document.createElement('div');
    tip.style.cssText = `
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      background: #333; color: #fff; padding: 8px 16px; border-radius: 8px;
      font-size: 13px; font-family: sans-serif; z-index: 2147483647;
      pointer-events: none; white-space: nowrap;
    `;
    tip.textContent = 'Drag to select area, ESC to cancel';
    overlay.appendChild(tip);

    let startX, startY, dragging = false;

    overlay.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      selector.style.display = 'block';
      selector.style.left = startX + 'px';
      selector.style.top = startY + 'px';
      selector.style.width = '0px';
      selector.style.height = '0px';
    });

    overlay.addEventListener('mousemove', e => {
      if (!dragging) return;
      const x = Math.min(startX, e.clientX);
      const y = Math.min(startY, e.clientY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);
      selector.style.left = x + 'px';
      selector.style.top = y + 'px';
      selector.style.width = w + 'px';
      selector.style.height = h + 'px';
      tip.textContent = `${w} x ${h} px — Release to capture, ESC to cancel`;
    });

    overlay.addEventListener('mouseup', e => {
      if (!dragging) return;
      dragging = false;
      const x = Math.min(startX, e.clientX);
      const y = Math.min(startY, e.clientY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);
      if (w > 5 && h > 5) {
        cleanup();
        captureRegion(x, y, w, h);
      }
    });

    document.addEventListener('keydown', handleEsc);
    document.body.appendChild(overlay);
    activeOverlay = overlay;
  }

  function startElementSelect() {
    const tip = document.createElement('div');
    tip.id = 'fps-tip';
    tip.style.cssText = `
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      background: #333; color: #fff; padding: 8px 16px; border-radius: 8px;
      font-size: 13px; font-family: sans-serif; z-index: 2147483647;
      pointer-events: none; white-space: nowrap;
    `;
    tip.textContent = 'Hover an element and click to capture, ESC to cancel';
    document.body.appendChild(tip);

    document.addEventListener('mousemove', handleHover);
    document.addEventListener('click', handleElementClick, true);
    document.addEventListener('keydown', handleEsc);
  }

  function handleHover(e) {
    clearHighlight();
    const el = e.target;
    if (el.id === 'fps-tip') return;
    highlightedElement = el;
    el.style.outline = '2px solid #4A90D9';
    el.style.outlineOffset = '1px';
  }

  function clearHighlight() {
    if (highlightedElement) {
      highlightedElement.style.outline = '';
      highlightedElement.style.outlineOffset = '';
      highlightedElement = null;
    }
  }

  function handleElementClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.target;
    if (el.id === 'fps-tip') return;
    clearHighlight();
    cleanup();
    const rect = el.getBoundingClientRect();
    captureRegion(rect.left, rect.top, rect.width, rect.height);
  }

  function handleEsc(e) {
    if (e.key === 'Escape') {
      cleanup();
    }
  }

  function cleanup() {
    clearHighlight();
    removeLoading();
    if (activeOverlay) {
      activeOverlay.remove();
      activeOverlay = null;
    }
    const tip = document.getElementById('fps-tip');
    if (tip) tip.remove();
    document.removeEventListener('mousemove', handleHover);
    document.removeEventListener('click', handleElementClick, true);
    document.removeEventListener('keydown', handleEsc);
  }
})();
