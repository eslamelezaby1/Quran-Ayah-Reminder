// Ayah Reminder - Popup Script
// Handles popup functionality and displays last delivered ayah

document.addEventListener('DOMContentLoaded', function() {
  // Initialize popup
  loadLastAyah();
  setupEventListeners();
  
  // Test background script connection
  testBackgroundConnection();
  
  // Listen for visibility changes (when system wakes up)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      console.log('Popup became visible, checking for wake-up...');
      checkWakeUp();
    }
  });
});

// Set up event listeners
function setupEventListeners() {
  // New ayah button (only visible button)
  const newAyahBtn = document.getElementById('newAyahBtn');
  if (newAyahBtn) {
    newAyahBtn.addEventListener('click', forceNewAyah);
  }
  
  // Options button
  const optionsBtn = document.getElementById('optionsBtn');
  if (optionsBtn) {
    optionsBtn.addEventListener('click', openOptions);
  }
}

// Send ayah now
async function sendAyahNow() {
  try {
    const sendNowBtn = document.getElementById('sendNowBtn');
    sendNowBtn.disabled = true;
    sendNowBtn.textContent = 'Sending...';
    
    const response = await chrome.runtime.sendMessage({ action: 'sendAyahNow' });
    
    if (response && response.success) {
      sendNowBtn.textContent = '✓ Sent!';
      setTimeout(() => {
        sendNowBtn.textContent = '📖 Send Ayah Now';
        sendNowBtn.disabled = false;
      }, 2000);
      
      // Refresh last ayah info
      setTimeout(() => {
        loadLastAyah();
      }, 1000);
    } else {
      throw new Error(response?.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error sending ayah:', error);
    
    const sendNowBtn = document.getElementById('sendNowBtn');
    sendNowBtn.textContent = '❌ Error';
    sendNowBtn.disabled = false;
    
    // Show error message
    showErrorMessage(`Failed to send notification: ${error.message}`);
    
    setTimeout(() => {
      sendNowBtn.textContent = '📖 Send Ayah Now';
      sendNowBtn.disabled = false;
    }, 2000);
  }
}

// Force new ayah
async function forceNewAyah() {
  try {
    const newAyahBtn = document.getElementById('newAyahBtn');
    newAyahBtn.disabled = true;
    newAyahBtn.textContent = 'Getting...';
    
    const response = await chrome.runtime.sendMessage({ action: 'forceNewAyah' });
    
    if (response && response.success) {
      newAyahBtn.textContent = '✓ New Ayah!';
      setTimeout(() => {
        newAyahBtn.textContent = '🔄 New Ayah';
        newAyahBtn.disabled = false;
      }, 2000);
      
      // Refresh last ayah info and timer
      setTimeout(() => {
        loadLastAyah();
      }, 1000);
    } else {
      throw new Error(response?.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error getting new ayah:', error);
    
    const newAyahBtn = document.getElementById('newAyahBtn');
    newAyahBtn.textContent = '❌ Error';
    newAyahBtn.disabled = false;
    
    // Show error message
    showErrorMessage(`Failed to get new ayah: ${error.message}`);
    
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

// Show error message
function showErrorMessage(message) {
  const statusElement = document.getElementById('extensionStatus');
  if (statusElement) {
    statusElement.innerHTML = `
      <div class="status-error">
        <p><strong>Error:</strong> ${message}</p>
        <p><strong>Solution:</strong> Check notification permissions and try again</p>
      </div>
    `;
    statusElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 5000);
  }
}

// Load last delivered ayah - IMPROVED
async function loadLastAyah() {
  try {
    console.log('🔍 Loading last ayah from storage...');
    
    const result = await chrome.storage.sync.get(['lastAyah', 'lastAyahTime', 'interval']);
    console.log('Storage result:', result);
    
    const lastAyah = result.lastAyah;
    const lastAyahTime = result.lastAyahTime;
    const interval = result.interval || 10; // Default to 10 minutes
    
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
      
      // Try to get initial ayah
      console.log('Attempting to get initial ayah...');
      
      try {
        const response = await chrome.runtime.sendMessage({ action: 'forceNewAyah' });
        if (response && response.success) {
          console.log('✅ Initial ayah created, reloading...');
          setTimeout(() => {
            loadLastAyah();
          }, 1000);
          return;
        } else {
          throw new Error(response?.error || 'Failed to create initial ayah');
        }
      } catch (forceError) {
        console.error('Failed to force new ayah:', forceError);
        
        // Show message and provide manual option
        lastAyahInfo.innerHTML = `
          <div class="no-ayah-section">
            <p class="no-ayah">No ayah delivered yet.</p>
            <p class="no-ayah-help">Click "New Ayah" to get started.</p>
            <p class="error-details">Error: ${forceError.message}</p>
          </div>
        `;
      }
      
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

// Start the timer - IMPROVED
function startTimer() {
  // Update timer every second
  setInterval(async () => {
    try {
      const result = await chrome.storage.sync.get(['lastAyahTime', 'interval']);
      const lastAyahTime = result.lastAyahTime;
      const interval = result.interval || 10;
      
      if (lastAyahTime) {
        updateTimer(lastAyahTime, interval);
      }
    } catch (error) {
      console.error('Error updating timer:', error);
    }
  }, 1000);
  
  // Check for wake-up every 30 seconds
  setInterval(async () => {
    try {
      await checkWakeUp();
    } catch (error) {
      console.error('Error in periodic wake-up check:', error);
    }
  }, 30000);
}

// Update the timer display - IMPROVED
function updateTimer(lastAyahTime, interval) {
  const now = Date.now();
  const timeSinceLastAyah = now - lastAyahTime;
  const intervalMs = interval * 60 * 1000; // Convert minutes to milliseconds
  const timeRemaining = Math.max(0, intervalMs - timeSinceLastAyah);
  
  const timeRemainingElement = document.getElementById('timeRemaining');
  
  if (timeRemaining <= 0) {
    timeRemainingElement.textContent = 'Now!';
    // Check if we need to refresh the ayah and trigger notification
    checkAndRefreshAyah();
  } else {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    timeRemainingElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // If the time remaining is suspiciously large, check for wake-up
    if (timeRemaining > intervalMs * 2) {
      console.log('Suspicious timer value detected, checking for wake-up...');
      checkWakeUp();
    }
  }
}

// Check if we need to refresh the ayah and handle wake-up - IMPROVED
async function checkAndRefreshAyah() {
  try {
    console.log('⏰ Timer expired, checking for new ayah...');
    
    // Check with background script if timer has actually expired
    const response = await chrome.runtime.sendMessage({ action: 'checkTimerExpired' });
    
    if (response && response.expired) {
      console.log('✅ Timer confirmed expired, triggering notification...');
      
      // Trigger notification from background script
      await chrome.runtime.sendMessage({ action: 'sendAyahNow' });
      
      // Refresh ayah info after a short delay
      setTimeout(() => {
        loadLastAyah();
      }, 1000);
    } else {
      console.log('⚠️ Timer not actually expired, continuing...');
    }
    
    // Always check for wake-up
    await chrome.runtime.sendMessage({ action: 'checkWakeUp' });
    
  } catch (error) {
    console.error('Error checking wake-up:', error);
    
    // Show error message
    showErrorMessage(`Timer check failed: ${error.message}`);
  }
}

// Check for wake-up when popup opens - IMPROVED
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
    console.log('Storage changed, updating display...');
    loadLastAyah();
  }
});

// Test background script connection
async function testBackgroundConnection() {
  try {
    console.log('Testing background script connection...');
    const response = await chrome.runtime.sendMessage({ action: 'ping' });
    console.log('Background connection test response:', response);
    
    if (!response || !response.initialized) {
      console.warn('⚠️ Background script not fully initialized');
      showErrorMessage('Background script not initialized. Try reloading the extension.');
    }
  } catch (error) {
    console.error('Background connection test failed:', error);
    showErrorMessage('Cannot connect to background script. Extension may not be working properly.');
  }
}

// Check extension status - IMPROVED
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
            <p><strong>Status:</strong> ${response.initialized ? '✅ Active' : '❌ Not Initialized'}</p>
            <p><strong>Last Check:</strong> ${new Date(response.timestamp).toLocaleString()}</p>
          </div>
        `;
        statusElement.style.display = 'block';
        
        // Hide status after 3 seconds
        setTimeout(() => {
          statusElement.style.display = 'none';
        }, 3000);
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

// Debug alarms
async function debugAlarms() {
  try {
    const debugBtn = document.getElementById('debugBtn');
    debugBtn.disabled = true;
    debugBtn.textContent = 'Debugging...';
    
    console.log('🔍 Starting alarm debug...');
    
    const response = await chrome.runtime.sendMessage({ action: 'debugAlarms' });
    
    if (response && response.success) {
      debugBtn.textContent = '✅ Debug Complete!';
      setTimeout(() => {
        debugBtn.textContent = '🔍 Debug Alarms';
        debugBtn.disabled = false;
      }, 3000);
      
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
    } else {
      throw new Error(response?.error || 'Debug failed');
    }
  } catch (error) {
    console.error('❌ Error debugging alarms:', error);
    
    const debugBtn = document.getElementById('debugBtn');
    debugBtn.textContent = '❌ Debug Failed';
    debugBtn.disabled = false;
    
    setTimeout(() => {
      debugBtn.textContent = '🔍 Debug Alarms';
      debugBtn.disabled = false;
    }, 3000);
    
    showErrorMessage(`Alarm debug failed: ${error.message}`);
  }
}

// Debug storage
async function debugStorage() {
  try {
    const storageDebugBtn = document.getElementById('storageDebugBtn');
    storageDebugBtn.disabled = true;
    storageDebugBtn.textContent = 'Debugging...';
    
    console.log('💾 Starting storage debug...');
    
    const response = await chrome.runtime.sendMessage({ action: 'debugStorage' });
    
    if (response && response.success) {
      storageDebugBtn.textContent = '✅ Debug Complete!';
      setTimeout(() => {
        storageDebugBtn.textContent = '💾 Debug Storage';
        storageDebugBtn.disabled = false;
      }, 3000);
      
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
    } else {
      throw new Error(response?.error || 'Storage debug failed');
    }
  } catch (error) {
    console.error('❌ Error debugging storage:', error);
    
    const storageDebugBtn = document.getElementById('storageDebugBtn');
    storageDebugBtn.textContent = '❌ Debug Failed';
    storageDebugBtn.disabled = false;
    
    setTimeout(() => {
      storageDebugBtn.textContent = '💾 Debug Storage';
      storageDebugBtn.disabled = false;
    }, 3000);
    
    showErrorMessage(`Storage debug failed: ${error.message}`);
  }
}
