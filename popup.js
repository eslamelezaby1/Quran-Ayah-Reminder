// Quran Ayah Reminder - Popup Script
// Handles popup functionality and displays last delivered ayah

document.addEventListener('DOMContentLoaded', function() {
  // Initialize popup
  loadLastAyah();
  setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
  // Send ayah now button
  const sendNowBtn = document.getElementById('sendNowBtn');
  sendNowBtn.addEventListener('click', sendAyahNow);
  
  // Options button
  const optionsBtn = document.getElementById('optionsBtn');
  optionsBtn.addEventListener('click', openOptions);
}

// Send ayah now
async function sendAyahNow() {
  try {
    // Disable button temporarily
    const sendNowBtn = document.getElementById('sendNowBtn');
    sendNowBtn.disabled = true;
    sendNowBtn.textContent = 'Sending...';
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({ action: 'sendAyahNow' });
    
    if (response && response.success) {
      // Update button text temporarily
      sendNowBtn.textContent = '✓ Sent!';
      setTimeout(() => {
        sendNowBtn.textContent = '📖 Send Ayah Now';
        sendNowBtn.disabled = false;
      }, 2000);
      
      // Refresh last ayah info
      setTimeout(() => {
        loadLastAyah();
      }, 1000);
    }
  } catch (error) {
    console.error('Error sending ayah:', error);
    
    // Reset button
    const sendNowBtn = document.getElementById('sendNowBtn');
    sendNowBtn.textContent = '❌ Error';
    sendNowBtn.disabled = false;
    
    setTimeout(() => {
      sendNowBtn.textContent = '📖 Send Ayah Now';
      sendNowBtn.disabled = false;
    }, 2000);
  }
}

// Open options page
function openOptions() {
  chrome.runtime.openOptionsPage();
}

// Load last delivered ayah
async function loadLastAyah() {
  try {
    const result = await chrome.storage.sync.get(['lastAyah']);
    const lastAyah = result.lastAyah;
    
    const lastAyahInfo = document.getElementById('lastAyahInfo');
    
    if (lastAyah && lastAyah.text) {
      // Display last ayah
      lastAyahInfo.innerHTML = `
        <div class="ayah-text">
          <p class="arabic-text">${lastAyah.text}</p>
          ${lastAyah.translation ? `<p class="translation">${lastAyah.translation}</p>` : ''}
          <p class="reference">${lastAyah.surah} ${lastAyah.ayah}</p>
        </div>
      `;
    } else {
      // No ayah yet
      lastAyahInfo.innerHTML = `
        <p class="no-ayah">No ayah delivered yet. Click "Send Ayah Now" to get started!</p>
      `;
    }
  } catch (error) {
    console.error('Error loading last ayah:', error);
    
    const lastAyahInfo = document.getElementById('lastAyahInfo');
    lastAyahInfo.innerHTML = `
      <p class="error">Error loading ayah information</p>
    `;
  }
}

// Listen for storage changes to update display
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.lastAyah) {
    loadLastAyah();
  }
});
