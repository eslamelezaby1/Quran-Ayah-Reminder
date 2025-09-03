// Quran Ayah Reminder - Popup Script
// Handles popup functionality and displays last delivered ayah

document.addEventListener('DOMContentLoaded', function() {
  // Initialize popup
  loadLastAyah();
  setupEventListeners();
  startTimer(); // Start the timer on popup load
  
  // Test background script connection
  testBackgroundConnection();
  
  // Check extension status
  checkExtensionStatus();
  
  // Check for wake-up when popup opens
  checkWakeUp();
  
  // Listen for visibility changes (when system wakes up)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      console.log('Popup became visible, checking for wake-up...');
      checkWakeUp();
      // Re-check status when popup becomes visible
      checkExtensionStatus();
    }
  });
});

// Set up event listeners
function setupEventListeners() {
  // Send ayah now button
  const sendNowBtn = document.getElementById('sendNowBtn');
  if (sendNowBtn) {
    sendNowBtn.addEventListener('click', sendAyahNow);
  }
  
  // New ayah button
  const newAyahBtn = document.getElementById('newAyahBtn');
  if (newAyahBtn) {
    newAyahBtn.addEventListener('click', forceNewAyah);
  }
  
  // Options button
  const optionsBtn = document.getElementById('optionsBtn');
  if (optionsBtn) {
    optionsBtn.addEventListener('click', openOptions);
  }
  
  // Debug button (only if element exists)
  const debugBtn = document.getElementById('debugBtn');
  if (debugBtn) {
    debugBtn.addEventListener('click', debugAlarms);
  }
  
  // Storage debug button (only if element exists)
  const storageDebugBtn = document.getElementById('storageDebugBtn');
  if (storageDebugBtn) {
    storageDebugBtn.addEventListener('click', debugStorage);
  }
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
    console.log('🔍 Loading last ayah from storage...');
    
    const result = await chrome.storage.sync.get(['lastAyah', 'lastAyahTime', 'interval']);
    console.log('Storage result:', result);
    
    const lastAyah = result.lastAyah;
    const lastAyahTime = result.lastAyahTime;
    const interval = result.interval || 60;
    
    console.log('Parsed data:', {
      lastAyah: lastAyah,
      lastAyahTime: lastAyahTime,
      interval: interval
    });
    
    const lastAyahInfo = document.getElementById('lastAyahInfo');
    const ayahTimer = document.getElementById('ayahTimer');
    
    if (lastAyah && lastAyah.text) {
      console.log('✅ Ayah found, displaying...');
      // Display last ayah
      lastAyahInfo.innerHTML = `
        <div class="ayah-text">
          <p class="arabic-text">${lastAyah.text}</p>
          <p class="reference">${lastAyah.surah} ${lastAyah.ayah}</p>
        </div>
      `;
      
      // Show and update timer
      ayahTimer.style.display = 'block';
      updateTimer(lastAyahTime, interval);
    } else {
      console.log('❌ No ayah found in storage');
      // No ayah yet - try to get one automatically
      console.log('Attempting to get initial ayah...');
      
      try {
        // Try to get a new ayah from background script
        const response = await chrome.runtime.sendMessage({ action: 'forceNewAyah' });
        if (response && response.success) {
          console.log('✅ Initial ayah created, reloading...');
          // Wait a moment then reload
          setTimeout(() => {
            loadLastAyah();
          }, 1000);
          return;
        }
      } catch (forceError) {
        console.error('Failed to force new ayah:', forceError);
      }
      
      // Show message and provide manual option
      lastAyahInfo.innerHTML = `
        <div class="no-ayah-section">
          <p class="no-ayah">No ayah delivered yet.</p>
          <p class="no-ayah-help">This usually means the extension hasn't been initialized properly.</p>
          <button id="initAyahBtn" class="btn btn-primary" style="margin-top: 10px;">🚀 Initialize Extension</button>
        </div>
      `;
      
      // Add event listener to the initialization button
      setTimeout(() => {
        const initBtn = document.getElementById('initAyahBtn');
        if (initBtn) {
          initBtn.addEventListener('click', async () => {
            try {
              initBtn.disabled = true;
              initBtn.textContent = 'Initializing...';
              
              // Try multiple initialization methods
              await chrome.runtime.sendMessage({ action: 'forceNewAyah' });
              await chrome.runtime.sendMessage({ action: 'checkWakeUp' });
              
              // Wait and reload
              setTimeout(() => {
                loadLastAyah();
              }, 2000);
            } catch (error) {
              console.error('Initialization failed:', error);
              initBtn.textContent = '❌ Failed';
              setTimeout(() => {
                initBtn.textContent = '🚀 Initialize Extension';
                initBtn.disabled = false;
              }, 3000);
            }
          });
        }
      }, 100);
      
      // Show timer with "Ready" message
      ayahTimer.style.display = 'block';
      document.getElementById('timeRemaining').textContent = 'Ready!';
    }
  } catch (error) {
    console.error('❌ Error loading last ayah:', error);
    
    const lastAyahInfo = document.getElementById('lastAyahInfo');
    lastAyahInfo.innerHTML = `
      <div class="error-section">
        <p class="error">❌ Error loading ayah information</p>
        <p class="error-details">${error.message}</p>
        <button id="retryBtn" class="btn btn-secondary" style="margin-top: 10px;">🔄 Retry</button>
      </div>
    `;
    
    // Add retry button functionality
    setTimeout(() => {
      const retryBtn = document.getElementById('retryBtn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          loadLastAyah();
        });
      }
    }, 100);
    
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
  
  // Check for wake-up every 30 seconds to ensure timer accuracy
  setInterval(async () => {
    try {
      await checkWakeUp();
    } catch (error) {
      console.error('Error in periodic wake-up check:', error);
    }
  }, 30000);
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
    // Check if we need to refresh the ayah
    checkAndRefreshAyah();
  } else {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    timeRemainingElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // If the time remaining is suspiciously large (more than 2x the interval), 
    // it might indicate a system wake-up scenario
    if (timeRemaining > intervalMs * 2) {
      console.log('Suspicious timer value detected, checking for wake-up...');
      checkWakeUp();
    }
  }
}

// Check if we need to refresh the ayah and handle wake-up
async function checkAndRefreshAyah() {
  try {
    // Check for wake-up with background script
    await chrome.runtime.sendMessage({ action: 'checkWakeUp' });
    
    // Refresh ayah info
    await loadLastAyah();
  } catch (error) {
    console.error('Error checking wake-up:', error);
  }
}

// Check for wake-up when popup opens
async function checkWakeUp() {
  try {
    console.log('Checking for wake-up...');
    await chrome.runtime.sendMessage({ action: 'checkWakeUp' });
    console.log('Wake-up check completed');
  } catch (error) {
    console.error('Error checking wake-up on popup open:', error);
  }
}

// Listen for storage changes to update display
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.lastAyah || changes.lastAyahTime || changes.interval)) {
    loadLastAyah();
  }
});

// Test background script connection
async function testBackgroundConnection() {
  try {
    console.log('Testing background script connection...');
    const response = await chrome.runtime.sendMessage({ action: 'testConnection' });
    console.log('Background connection test response:', response);
  } catch (error) {
    console.error('Background connection test failed:', error);
  }
}

// CRITICAL: Add extension status check for debugging
async function checkExtensionStatus() {
  try {
    console.log('Checking extension status...');
    const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
    
    if (response) {
      console.log('Extension status:', response);
      
      // Display status in popup for debugging
      const statusElement = document.getElementById('extensionStatus');
      if (statusElement) {
        statusElement.innerHTML = `
          <div class="status-info">
            <!-- <p><strong>Status:</strong> ${response.initialized ? '✅ Active' : '❌ Not Initialized'}</p> -->
            <!-- <p><strong>Last Check:</strong> ${new Date(response.timestamp).toLocaleString()}</p> -->
            <!-- <p><strong>Last Wake:</strong> ${new Date(response.lastWakeTime).toLocaleString()}</p> -->
          </div>
        `;
        statusElement.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('Extension status check failed:', error);
    
    // Show error status
    const statusElement = document.getElementById('extensionStatus');
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="status-error">
          <p><strong>Status:</strong> ❌ Connection Failed</p>
          <p><strong>Error:</strong> ${error.message}</p>
        </div>
      `;
      statusElement.style.display = 'block';
    }
  }
}

// CRITICAL: Add alarm debugging function
async function debugAlarms() {
  try {
    // Disable button temporarily
    const debugBtn = document.getElementById('debugBtn');
    debugBtn.disabled = true;
    debugBtn.textContent = 'Debugging...';
    
    console.log('🔍 Starting alarm debug...');
    
    // Send debug message to background script
    const response = await chrome.runtime.sendMessage({ action: 'debugAlarms' });
    
    if (response && response.success) {
      // Update button text temporarily
      debugBtn.textContent = '✅ Debug Complete!';
      setTimeout(() => {
        debugBtn.textContent = '🔍 Debug Alarms';
        debugBtn.disabled = false;
      }, 3000);
      
      // Show debug message
      const statusElement = document.getElementById('extensionStatus');
      if (statusElement) {
        statusElement.innerHTML = `
          <div class="status-info">
            <p><strong>Debug:</strong> ✅ ${response.message}</p>
            <p><strong>Check Console:</strong> Open DevTools (F12) and look at the Console tab</p>
            <p><strong>Background Script:</strong> Look for "ALARM DEBUG INFORMATION" in the console</p>
          </div>
        `;
        statusElement.style.display = 'block';
      }
      
      console.log('🔍 Alarm debug completed. Check the background script console for detailed information.');
    }
  } catch (error) {
    console.error('❌ Error debugging alarms:', error);
    
    // Reset button
    const debugBtn = document.getElementById('debugBtn');
    debugBtn.textContent = '❌ Debug Failed';
    debugBtn.disabled = false;
    
    setTimeout(() => {
      debugBtn.textContent = '🔍 Debug Alarms';
      debugBtn.disabled = false;
    }, 3000);
    
    // Show error status
    const statusElement = document.getElementById('extensionStatus');
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="status-error">
          <p><strong>Debug Failed:</strong> ❌ ${error.message}</p>
          <p><strong>Check Console:</strong> Look for error messages in the popup console</p>
        </div>
      `;
      statusElement.style.display = 'block';
    }
  }
}

// CRITICAL: Add storage debugging function
async function debugStorage() {
  try {
    // Disable button temporarily
    const storageDebugBtn = document.getElementById('storageDebugBtn');
    storageDebugBtn.disabled = true;
    storageDebugBtn.textContent = 'Debugging...';
    
    console.log('💾 Starting storage debug...');
    
    // Send debug message to background script
    const response = await chrome.runtime.sendMessage({ action: 'debugStorage' });
    
    if (response && response.success) {
      // Update button text temporarily
      storageDebugBtn.textContent = '✅ Debug Complete!';
      setTimeout(() => {
        storageDebugBtn.textContent = '💾 Debug Storage';
        storageDebugBtn.disabled = false;
      }, 3000);
      
      // Show debug message
      const statusElement = document.getElementById('extensionStatus');
      if (statusElement) {
        statusElement.innerHTML = `
          <div class="status-info">
            <p><strong>Storage Debug:</strong> ✅ ${response.message}</p>
            <p><strong>Check Console:</strong> Open DevTools (F12) and look at the Console tab</p>
            <p><strong>Background Script:</strong> Look for "STORAGE DEBUG AND REPAIR" in the console</p>
            <p><strong>Next Step:</strong> After debug completes, try reloading the popup</p>
          </div>
        `;
        statusElement.style.display = 'block';
      }
      
      console.log('💾 Storage debug completed. Check the background script console for detailed information.');
      
      // Wait a moment then reload the ayah data
      setTimeout(() => {
        loadLastAyah();
      }, 2000);
    }
  } catch (error) {
    console.error('❌ Error debugging storage:', error);
    
    // Reset button
    const storageDebugBtn = document.getElementById('storageDebugBtn');
    storageDebugBtn.textContent = '❌ Debug Failed';
    storageDebugBtn.disabled = false;
    
    setTimeout(() => {
      storageDebugBtn.textContent = '💾 Debug Storage';
      storageDebugBtn.disabled = false;
    }, 3000);
    
    // Show error status
    const statusElement = document.getElementById('extensionStatus');
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="status-error">
          <p><strong>Storage Debug Failed:</strong> ❌ ${error.message}</p>
          <p><strong>Check Console:</strong> Look for error messages in the popup console</p>
        </div>
      `;
      statusElement.style.display = 'block';
    }
  }
}
