// Quran Ayah Reminder - Options Script
// Handles options page functionality and saves user settings

document.addEventListener('DOMContentLoaded', function() {
  // Initialize options page
  loadCurrentSettings();
  setupEventListeners();
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
      intervalSelect.value = result.interval || 60;
      
      // Set translation checkbox
      const showTranslation = document.getElementById('showTranslation');
      showTranslation.checked = result.showTranslation || false;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Save settings
async function saveSettings(event) {
  event.preventDefault();
  
  try {
    // Get form values
    const interval = parseInt(document.getElementById('intervalSelect').value);
    const showTranslation = document.getElementById('showTranslation').checked;
    
    // Validate interval
    if (interval < 15 || interval > 180) {
      showMessage('Please select a valid interval between 15 and 180 minutes.', 'error');
      return;
    }
    
    // Prepare settings object
    const settings = {
      interval: interval,
      showTranslation: showTranslation
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
  if (namespace === 'sync' && (changes.interval || changes.showTranslation)) {
    loadCurrentSettings();
  }
});
