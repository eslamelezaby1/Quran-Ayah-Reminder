// Ayah Reminder - Options Script
// Handles options page functionality and saves user settings

document.addEventListener('DOMContentLoaded', function() {
  // Initialize options page
  loadCurrentSettings();
  setupEventListeners();
  startNextAyahTimer();
});

// Set up event listeners
function setupEventListeners() {
  // Form submission
  const optionsForm = document.getElementById('optionsForm');
  optionsForm.addEventListener('submit', saveSettings);
  
  // Test notification button
  const testBtn = document.getElementById('testBtn');
  testBtn.addEventListener('click', sendTestNotification);
  
  // Back to extension link
  const backLink = document.getElementById('backToExtension');
  backLink.addEventListener('click', goBackToExtension);
}

// Load current settings from storage
async function loadCurrentSettings() {
  try {
    const result = await chrome.runtime.sendMessage({ action: 'getSettings' });
    
    if (result) {
      // Set interval select
      const intervalSelect = document.getElementById('intervalSelect');
      intervalSelect.value = result.interval || 10;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Start timer to show when next ayah will be available
function startNextAyahTimer() {
  // Update timer every second
  setInterval(async () => {
    try {
      const result = await chrome.storage.sync.get(['lastAyahTime', 'interval']);
      const lastAyahTime = result.lastAyahTime;
      const interval = result.interval || 60;
      
      if (lastAyahTime) {
        updateNextAyahTimer(lastAyahTime, interval);
      }
    } catch (error) {
      console.error('Error updating next ayah timer:', error);
    }
  }, 1000);
}

// Update the next ayah timer display
function updateNextAyahTimer(lastAyahTime, interval) {
  const now = Date.now();
  const timeSinceLastAyah = now - lastAyahTime;
  const intervalMs = interval * 60 * 1000; // Convert minutes to milliseconds
  const timeRemaining = Math.max(0, intervalMs - timeSinceLastAyah);
  
  // Find or create the timer display element
  let timerElement = document.getElementById('nextAyahTimer');
  if (!timerElement) {
    // Create timer display if it doesn't exist
    const infoSection = document.querySelector('.info-section');
    if (infoSection) {
      timerElement = document.createElement('div');
      timerElement.id = 'nextAyahTimer';
      timerElement.className = 'next-ayah-timer';
      timerElement.innerHTML = '<h3>⏰ Next Ayah</h3><p>Next ayah will be available in: <span id="nextAyahTimeRemaining">--</span></p>';
      infoSection.appendChild(timerElement);
    }
  }
  
  if (timerElement) {
    const timeRemainingElement = timerElement.querySelector('#nextAyahTimeRemaining');
    if (timeRemainingElement) {
      if (timeRemaining <= 0) {
        timeRemainingElement.textContent = 'Now!';
        timeRemainingElement.style.color = '#e74c3c';
        timeRemainingElement.style.fontWeight = '700';
      } else {
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        timeRemainingElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        timeRemainingElement.style.color = '#2980b9';
        timeRemainingElement.style.fontWeight = '500';
      }
    }
  }
}

// Save settings
async function saveSettings(event) {
  event.preventDefault();
  
  try {
    // Get form values
    const interval = parseInt(document.getElementById('intervalSelect').value);
    
    // Validate interval
    if (interval < 10 || interval > 180) {
      showMessage('Please select a valid interval between 10 and 180 minutes.', 'error');
      return;
    }
    
    // Prepare settings object
    const settings = {
      interval: interval
    };
    
    // Save to storage
    const response = await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: settings
    });
    
    if (response && response.success) {
      showMessage('Settings saved successfully!', 'success');
      
      // Update form state
      const saveBtn = document.querySelector('button[type="submit"]');
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '✓ Saved!';
      saveBtn.disabled = true;
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }, 2000);
    } else {
      showMessage('Failed to save settings. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showMessage('An error occurred while saving settings.', 'error');
  }
}

// Send test notification
async function sendTestNotification() {
  try {
    // Disable button temporarily
    const testBtn = document.getElementById('testBtn');
    const originalText = testBtn.textContent;
    testBtn.disabled = true;
    testBtn.textContent = 'Sending...';
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({ action: 'testNotification' });
    
    if (response && response.success) {
      testBtn.textContent = '✓ Sent!';
      showMessage('Test notification sent! Check your notifications.', 'success');
    } else {
      testBtn.textContent = '❌ Failed';
      showMessage('Failed to send test notification.', 'error');
    }
    
    // Reset button after delay
    setTimeout(() => {
      testBtn.textContent = originalText;
      testBtn.disabled = false;
    }, 3000);
    
  } catch (error) {
    console.error('Error sending test notification:', error);
    
    const testBtn = document.getElementById('testBtn');
    testBtn.textContent = '❌ Error';
    testBtn.disabled = false;
    
    showMessage('Error sending test notification. Please try again.', 'error');
    
    setTimeout(() => {
      testBtn.textContent = '🧪 Test Notification';
      testBtn.disabled = false;
    }, 3000);
  }
}

// Go back to extension
function goBackToExtension(event) {
  event.preventDefault();
  window.close();
}

// Show message to user
function showMessage(message, type = 'info') {
  // Remove existing message
  const existingMessage = document.querySelector('.message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create new message
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  
  // Insert after header
  const header = document.querySelector('.header');
  header.insertAdjacentElement('afterend', messageDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 5000);
}

// Listen for storage changes to update form
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.interval)) {
    loadCurrentSettings();
  }
});
