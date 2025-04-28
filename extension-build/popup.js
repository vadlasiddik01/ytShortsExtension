// Get elements
const hideShorts = document.getElementById('hideShorts');
const blockShorts = document.getElementById('blockShorts');
const optionsButton = document.getElementById('options-button');

// Load settings on popup open
chrome.storage.sync.get(['hideShorts', 'blockShorts'], (result) => {
  hideShorts.checked = result.hideShorts || false;
  blockShorts.checked = result.blockShorts || false;
});

// Function to safely send messages to tabs
function safelySendMessageToYoutubeTabs(message) {
  try {
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      if (tabs && tabs.length > 0) {
        tabs.forEach(tab => {
          if (tab && tab.id) {
            try {
              chrome.tabs.sendMessage(tab.id, message, () => {
                // Check for errors but ignore them - the content script may not be loaded yet
                if (chrome.runtime.lastError) {
                  console.log('Tab not ready:', chrome.runtime.lastError.message);
                }
              });
            } catch (err) {
              console.log('Error sending message to tab:', err);
            }
          }
        });
      }
    });
  } catch (err) {
    console.log('Error querying tabs:', err);
  }
}

// Save settings on toggle
hideShorts.addEventListener('change', () => {
  chrome.storage.sync.set({ hideShorts: hideShorts.checked });
  
  safelySendMessageToYoutubeTabs({
    action: 'updateSettings',
    hideShorts: hideShorts.checked,
    blockShorts: blockShorts.checked
  });
});

blockShorts.addEventListener('change', () => {
  chrome.storage.sync.set({ blockShorts: blockShorts.checked });
  
  safelySendMessageToYoutubeTabs({
    action: 'updateSettings',
    hideShorts: hideShorts.checked,
    blockShorts: blockShorts.checked
  });
});

// Open options page
optionsButton.addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});
