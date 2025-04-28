// Get elements
const hideShorts = document.getElementById('hideShorts');
const blockShorts = document.getElementById('blockShorts');

// Load settings on popup open
chrome.storage.sync.get(['hideShorts', 'blockShorts'], (result) => {
  hideShorts.checked = result.hideShorts || false;
  blockShorts.checked = result.blockShorts || false;
});

// Save settings on toggle
hideShorts.addEventListener('change', () => {
  chrome.storage.sync.set({ hideShorts: hideShorts.checked });
  chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        hideShorts: hideShorts.checked,
        blockShorts: blockShorts.checked
      });
    });
  });
});

blockShorts.addEventListener('change', () => {
  chrome.storage.sync.set({ blockShorts: blockShorts.checked });
  chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        hideShorts: hideShorts.checked,
        blockShorts: blockShorts.checked
      });
    });
  });
});
