document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', () => {
    const mode = card.dataset.mode;
    showStatus('Capturing...', '');
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs[0]) return;
      const tabId = tabs[0].id;

      // Try sending message to existing content script first
      chrome.tabs.sendMessage(tabId, { action: 'capture', mode }, response => {
        if (chrome.runtime.lastError) {
          // Content script not loaded — inject it dynamically
          injectAndCapture(tabId, mode);
        } else if (response && response.success) {
          showStatus('Screenshot saved!', 'success');
        } else {
          showStatus('Capture failed. Please try again.', 'error');
        }
      });
    });
  });
});

function injectAndCapture(tabId, mode) {
  showStatus('Initializing...', '');
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['lib/html2canvas.min.js', 'content.js'],
  }).then(() => {
    // Wait briefly for scripts to initialize
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { action: 'capture', mode }, response => {
        if (chrome.runtime.lastError) {
          showStatus('Error: Cannot capture on this page.', 'error');
        } else if (response && response.success) {
          showStatus('Screenshot saved!', 'success');
        } else {
          showStatus('Capture failed. Please try again.', 'error');
        }
      });
    }, 300);
  }).catch(err => {
    showStatus('Error: ' + err.message, 'error');
  });
}

document.getElementById('shortcut-link').addEventListener('click', e => {
  e.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

function showStatus(msg, type) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status' + (type ? ' ' + type : '');
  setTimeout(() => el.classList.add('hidden'), 3000);
}
