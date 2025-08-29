// Quran Ayah Reminder - Popup Script
// Handles popup functionality and displays last delivered ayah

document.addEventListener('DOMContentLoaded', function() {
  // Initialize popup
  loadLastAyah();
  setupEventListeners();
  startTimer(); // Start the timer on popup load
});

// Set up event listeners
function setupEventListeners() {
  // Send ayah now button
  const sendNowBtn = document.getElementById('sendNowBtn');
  sendNowBtn.addEventListener('click', sendAyahNow);
  
  // New ayah button
  const newAyahBtn = document.getElementById('newAyahBtn');
  newAyahBtn.addEventListener('click', forceNewAyah);
  
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

// Force new ayah
async function forceNewAyah() {
  try {
    // Disable button temporarily
    const newAyahBtn = document.getElementById('newAyahBtn');
    newAyahBtn.disabled = true;
    newAyahBtn.textContent = 'Getting...';
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({ action: 'forceNewAyah' });
    
    if (response && response.success) {
      // Update button text temporarily
      newAyahBtn.textContent = '✓ New Ayah!';
      setTimeout(() => {
        newAyahBtn.textContent = '🔄 New Ayah';
        newAyahBtn.disabled = false;
      }, 2000);
      
      // Refresh last ayah info and timer
      setTimeout(() => {
        loadLastAyah();
      }, 1000);
    }
  } catch (error) {
    console.error('Error getting new ayah:', error);
    
    // Reset button
    const newAyahBtn = document.getElementById('newAyahBtn');
    newAyahBtn.textContent = '❌ Error';
    newAyahBtn.disabled = false;
    
    setTimeout(() => {
      newAyahBtn.textContent = '🔄 New Ayah';
      newAyahBtn.disabled = false;
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
    const result = await chrome.storage.sync.get(['lastAyah', 'lastAyahTime', 'interval']);
    const lastAyah = result.lastAyah;
    const lastAyahTime = result.lastAyahTime;
    const interval = result.interval || 60;
    
    const lastAyahInfo = document.getElementById('lastAyahInfo');
    const ayahTimer = document.getElementById('ayahTimer');
    
    if (lastAyah && lastAyah.text) {
      // Display last ayah
      lastAyahInfo.innerHTML = `
        <div class="ayah-text">
          <p class="arabic-text">${lastAyah.text}</p>
          ${lastAyah.translation ? `<p class="translation">${lastAyah.translation}</p>` : ''}
          <p class="reference">${lastAyah.surah} ${lastAyah.ayah}</p>
        </div>
      `;
      
      // Show and update timer
      ayahTimer.style.display = 'block';
      updateTimer(lastAyahTime, interval);
    } else {
      // No ayah yet
      lastAyahInfo.innerHTML = `
        <p class="no-ayah">No ayah delivered yet. Click "Send Ayah Now" to get started!</p>
      `;
      
      // Show timer with "Ready" message
      ayahTimer.style.display = 'block';
      document.getElementById('timeRemaining').textContent = 'Ready!';
    }
  } catch (error) {
    console.error('Error loading last ayah:', error);
    
    const lastAyahInfo = document.getElementById('lastAyahInfo');
    lastAyahInfo.innerHTML = `
      <p class="error">Error loading ayah information</p>
    `;
    
    // Show timer with error state
    const ayahTimer = document.getElementById('ayahTimer');
    ayahTimer.style.display = 'block';
    document.getElementById('timeRemaining').textContent = 'Error';
  }
}

// Start the timer
function startTimer() {
  // Update timer every second
  setInterval(async () => {
    try {
      const result = await chrome.storage.sync.get(['lastAyahTime', 'interval']);
      const lastAyahTime = result.lastAyahTime;
      const interval = result.interval || 60;
      
      if (lastAyahTime) {
        updateTimer(lastAyahTime, interval);
      }
    } catch (error) {
      console.error('Error updating timer:', error);
    }
  }, 1000);
}

// Update the timer display
function updateTimer(lastAyahTime, interval) {
  const now = Date.now();
  const timeSinceLastAyah = now - lastAyahTime;
  const intervalMs = interval * 60 * 1000; // Convert minutes to milliseconds
  const timeRemaining = Math.max(0, intervalMs - timeSinceLastAyah);
  
  const timeRemainingElement = document.getElementById('timeRemaining');
  
  if (timeRemaining <= 0) {
    timeRemainingElement.textContent = 'Now!';
    // Refresh ayah info
    loadLastAyah();
  } else {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    timeRemainingElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Listen for storage changes to update display
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.lastAyah || changes.lastAyahTime || changes.interval)) {
    loadLastAyah();
  }
});
