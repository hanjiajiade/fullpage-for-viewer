chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'download-screenshot') {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const filename = `screenshot_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;

    chrome.downloads.download({
      url: msg.dataUrl,
      filename,
      saveAs: false,
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.commands.onCommand.addListener(command => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0]) return;
    const modeMap = {
      'capture-full': 'full',
      'capture-visible': 'visible',
      'capture-area': 'area',
      'capture-element': 'element',
    };
    const mode = modeMap[command];
    if (mode) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'capture', mode });
    }
  });
});
