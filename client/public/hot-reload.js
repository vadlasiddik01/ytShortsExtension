// Hot reload implementation for Chrome extensions
// This script will reload the extension when files change
// Inspired by xpl/crx-hotreload

const filesInDirectory = dir => new Promise(resolve =>
  dir.createReader().readEntries(entries => {
    Promise.all(entries.filter(e => e.name[0] !== '.').map(e =>
      e.isDirectory
        ? filesInDirectory(e)
        : new Promise(resolve => e.file(resolve))
    ))
    .then(files => [].concat(...files))
    .then(resolve)
  })
);

const timestampForFilesInDirectory = dir =>
  filesInDirectory(dir).then(files =>
    files.map(f => f.name + f.lastModifiedDate).join());

const reload = () => {
  chrome.runtime.reload();
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    // NB: see https://github.com/xpl/crx-hotreload/issues/5
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
    }
    
    // Close the extension popup
    chrome.action?.getBadgeText({}, () => {
      if (!chrome.runtime.lastError) {
        chrome.runtime.sendMessage({ action: 'hotReload' });
      }
    });
  });
};

const watchChanges = (dir, lastTimestamp) => {
  timestampForFilesInDirectory(dir).then(timestamp => {
    if (!lastTimestamp || (lastTimestamp === timestamp)) {
      setTimeout(() => watchChanges(dir, timestamp), 1000); // Check every second
    } else {
      reload();
    }
  });
};

chrome.management.getSelf(self => {
  if (self.installType === 'development') {
    // Start watching for file changes
    chrome.runtime.getPackageDirectoryEntry(dir => watchChanges(dir));
    console.log('💧 Hot reload activated!');
  }
});