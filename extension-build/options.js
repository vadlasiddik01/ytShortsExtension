// Tab switching functionality
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;
    
    // Activate the tab
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show the panel
    panels.forEach(p => p.classList.remove('active'));
    document.getElementById(`${targetTab}-panel`).classList.add('active');
  });
});

// Placeholder for demonstration - in a real extension this would connect to Chrome storage
document.getElementById('add-filter').addEventListener('click', () => {
  alert('Custom filter functionality would be implemented here');
});

document.getElementById('save-categories').addEventListener('click', () => {
  alert('Category filter functionality would be implemented here');
});

document.getElementById('add-whitelist').addEventListener('click', () => {
  alert('Whitelist functionality would be implemented here');
});

document.getElementById('reset-stats').addEventListener('click', () => {
  alert('Statistics reset would be implemented here');
});

// Load placeholder stats
document.getElementById('shorts-blocked').textContent = '0';
document.getElementById('shorts-hidden').textContent = '0';
