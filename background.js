// Ayah Reminder - Background Service Worker
// Handles alarms, fetches ayahs, and shows notifications

// Fallback ayat in case API fails
const FALLBACK_AYAT = [
  {
    text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    surah: "Al-Baqarah",
    ayah: 153,
    number: 153
  },
  {
    text: "رَبِّ اشْرَحْ لِي صَدْرِي",
    surah: "Ta-Ha",
    ayah: 25,
    number: 25
  },
  {
    text: "إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّى يُغَيِّرُوا مَا بِأَنفُسِهِمْ",
    surah: "Ar-Ra'd",
    ayah: 11,
    number: 11
  },
  {
    text: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ",
    surah: "Hud",
    ayah: 88,
    number: 88
  },
  {
    text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    surah: "Ash-Sharh",
    ayah: 5,
    number: 5
  }
];

// Default settings
const DEFAULT_SETTINGS = {
  interval: 10 // minutes
};

// Track used ayahs to avoid repetition
let usedAyahs = new Set();
let lastAyahHash = '';
let lastWakeTime = Date.now();
let isInitialized = false;
let healthCheckInterval = null;

// CRITICAL: Initialize extension immediately when service worker starts
console.log('Ayah Reminder service worker starting...');
initializeExtension();

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed or updated:', details.reason);
  await initializeExtension();
});

// CRITICAL: Add startup event listener for when Chrome first opens
chrome.runtime.onStartup.addListener(async () => {
  console.log('Chrome started up - initializing Ayah Reminder');
  await initializeExtension();
});

// CRITICAL: Add initialization function
async function initializeExtension() {
  if (isInitialized) {
    console.log('Extension already initialized, skipping...');
    return;
  }
  
  try {
    console.log('🚀 Initializing extension...');
    
    // Check notification permissions first
    await checkNotificationPermissions();
    
    // Check if we need to initialize settings
    const result = await chrome.storage.sync.get(['interval']);
    if (!result.interval) {
      console.log('📝 No settings found, setting defaults');
      await chrome.storage.sync.set(DEFAULT_SETTINGS);
    }
    
    // Check if we need an initial ayah
    const ayahResult = await chrome.storage.sync.get(['lastAyah']);
    if (!ayahResult.lastAyah) {
      console.log('📖 No ayah found, getting initial ayah');
      await getNewAyahIfNeeded();
    }
    
    // Schedule alarm with retry logic
    console.log('🔔 Scheduling initial alarm...');
    let alarmScheduled = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!alarmScheduled && retryCount < maxRetries) {
      try {
        await scheduleAyahAlarm();
        
        // Verify alarm was created
        const alarm = await chrome.alarms.get('quran-ayah-reminder');
        if (alarm) {
          console.log('✅ Initial alarm scheduled successfully');
          alarmScheduled = true;
        } else {
          console.log(`⚠️ Alarm verification failed (attempt ${retryCount + 1}/${maxRetries})`);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log('🔄 Retrying alarm scheduling...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          }
        }
      } catch (alarmError) {
        console.error(`❌ Alarm scheduling failed (attempt ${retryCount + 1}/${maxRetries}):`, alarmError.message);
        retryCount++;
        if (retryCount < maxRetries) {
          console.log('🔄 Retrying alarm scheduling...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      }
    }
    
    if (!alarmScheduled) {
      console.error('❌ Failed to schedule alarm after all retries');
      // Continue initialization anyway - the health check will try to fix this
    }
    
    // Start health check
    startHealthCheck();
    
    isInitialized = true;
    console.log('✅ Extension initialization complete');
  } catch (error) {
    console.error('❌ Error during extension initialization:', error);
    console.error('🔍 Initialization error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Try again in a few seconds
    setTimeout(() => {
      if (!isInitialized) {
        console.log('🔄 Retrying initialization...');
        initializeExtension();
      }
    }, 5000);
  }
}

// Check notification permissions
async function checkNotificationPermissions() {
  try {
    const permissions = await chrome.permissions.getAll();
    console.log('Current permissions:', permissions);
    
    if (!permissions.permissions || !permissions.permissions.includes('notifications')) {
      console.error('❌ Notification permission not granted');
      throw new Error('Notification permission required');
    }
    
    console.log('✅ Notification permissions verified');
  } catch (error) {
    console.error('❌ Error checking notification permissions:', error);
    throw error;
  }
}

// Handle alarms - IMPROVED with better error handling
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'quran-ayah-reminder') {
    console.log('🔔 Ayah alarm triggered!');
    
    try {
      // Check if it's actually time for a notification
      const result = await chrome.storage.sync.get(['lastAyahTime', 'interval']);
      const lastAyahTime = result.lastAyahTime;
      const interval = result.interval || DEFAULT_SETTINGS.interval;
      const now = Date.now();
      
      if (lastAyahTime) {
        const timeSinceLastAyah = now - lastAyahTime;
        const intervalMs = interval * 60 * 1000;
        
        console.log(`Timer check: ${timeSinceLastAyah}ms since last ayah, interval: ${intervalMs}ms`);
        
        // Only send notification if enough time has passed
        if (timeSinceLastAyah >= intervalMs) {
          console.log('✅ Timer expired, sending notification');
          await sendAyahNotification();
        } else {
          console.log('⚠️ Timer not expired yet, rescheduling alarm');
        }
      } else {
        console.log('✅ No last ayah time, sending notification');
        await sendAyahNotification();
      }
      
      // Always schedule next alarm
      await scheduleAyahAlarm();
      
      console.log('✅ Notification sent and next alarm scheduled');
    } catch (error) {
      console.error('❌ Error handling alarm:', error);
      
      // Try to recover by scheduling next alarm
      try {
        await scheduleAyahAlarm();
      } catch (scheduleError) {
        console.error('❌ Failed to schedule recovery alarm:', scheduleError);
      }
      
      // Try to send a fallback notification
      try {
        const fallbackAyah = getRandomFallbackAyah();
        await showAyahNotification(fallbackAyah, false);
        console.log('✅ Fallback notification sent');
      } catch (fallbackError) {
        console.error('❌ Failed to send fallback notification:', fallbackError);
      }
    }
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId === 'quran-ayah') {
    try {
      const result = await chrome.storage.sync.get(['lastAyah']);
      if (result.lastAyah && result.lastAyah.number) {
        const url = `https://quran.com/${result.lastAyah.number}`;
        await chrome.tabs.create({ url });
      }
    } catch (error) {
      console.error('❌ Error opening ayah link:', error);
    }
  }
});

// Handle notification permission changes
chrome.permissions.onRemoved.addListener(async (permissions) => {
  if (permissions.permissions && permissions.permissions.includes('notifications')) {
    console.log('❌ Notification permission removed');
    // Try to re-request permission
    try {
      await chrome.permissions.request({ permissions: ['notifications'] });
      console.log('✅ Notification permission re-granted');
    } catch (error) {
      console.error('❌ Failed to re-request notification permission:', error);
    }
  }
});

// Handle messages from popup and options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'active', initialized: isInitialized });
    return true;
  }
  
  if (request.action === 'sendAyahNow') {
    sendAyahNotification().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('❌ Error sending ayah now:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'testNotification') {
    sendAyahNotification(true).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('❌ Error sending test notification:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'getSettings') {
    chrome.storage.sync.get(['interval'], (result) => {
      sendResponse(result);
    });
    return true;
  } else if (request.action === 'updateSettings') {
    chrome.storage.sync.set(request.settings, () => {
      scheduleAyahAlarm().then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('❌ Error scheduling alarm after settings update:', error);
        sendResponse({ success: false, error: error.message });
      });
    });
    return true;
  } else if (request.action === 'forceNewAyah') {
    getNewAyahIfNeeded(true).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('❌ Error forcing new ayah:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'checkWakeUp') {
    handleWakeUp().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('❌ Error checking wake-up:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'getStatus') {
    sendResponse({ 
      initialized: isInitialized, 
      timestamp: Date.now()
    });
  } else if (request.action === 'debugAlarms') {
    debugAlarmStatus().then(() => {
      sendResponse({ success: true, message: 'Alarm debug started - check console' });
    }).catch((error) => {
      console.error('❌ Error debugging alarms:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'debugStorage') {
    debugAndRepairStorage().then(() => {
      sendResponse({ success: true, message: 'Storage debug started - check console' });
    }).catch((error) => {
      console.error('❌ Error debugging storage:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'checkTimerExpired') {
    checkTimerExpired().then((expired) => {
      sendResponse({ expired: expired });
    }).catch((error) => {
      console.error('❌ Error checking timer expiration:', error);
      sendResponse({ expired: false, error: error.message });
    });
    return true;
  }
});

// Start health check to ensure extension stays active
function startHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    try {
      console.log('🔍 Performing health check...');
      
      // Check if our alarm still exists and is working
      const alarm = await chrome.alarms.get('quran-ayah-reminder');
      if (!alarm) {
        console.log('❌ Alarm missing, recreating...');
        await scheduleAyahAlarm();
      } else {
        console.log('✅ Health check: Alarm is active');
        console.log('📅 Next alarm at:', new Date(alarm.scheduledTime).toLocaleString());
        
        // Additional verification: check if alarm is scheduled in the future
        const now = Date.now();
        if (alarm.scheduledTime && alarm.scheduledTime < now) {
          console.log('⚠️ Alarm is in the past, rescheduling...');
          await scheduleAyahAlarm();
        } else if (alarm.scheduledTime) {
          const timeUntilAlarm = alarm.scheduledTime - now;
          console.log(`⏰ Time until next alarm: ${Math.floor(timeUntilAlarm / 60000)} minutes`);
        }
      }
      
      // Check if timer has expired and send notification if needed
      const expired = await checkTimerExpired();
      if (expired) {
        console.log('⏰ Timer expired during health check, sending notification');
        await sendAyahNotification();
        await scheduleAyahAlarm();
      }
      
      // Verify extension is still initialized
      if (!isInitialized) {
        console.log('⚠️ Extension not initialized, reinitializing...');
        await initializeExtension();
      }
      
      // Send ping to keep service worker alive
      chrome.runtime.sendMessage({ action: 'ping' }).catch(() => {
        // Ignore errors, this is just to keep the service worker active
      });
      
      console.log('✅ Health check completed successfully');
    } catch (error) {
      console.error('❌ Health check failed:', error);
      console.error('🔍 Health check error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Try to recover
      try {
        console.log('🔄 Attempting recovery from health check failure...');
        await scheduleAyahAlarm();
        console.log('✅ Recovery attempt completed');
      } catch (recoveryError) {
        console.error('❌ Recovery attempt failed:', recoveryError.message);
      }
    }
  }, 30000); // Check every 30 seconds instead of every minute
}

// Check if timer has expired
async function checkTimerExpired() {
  try {
    const result = await chrome.storage.sync.get(['lastAyahTime', 'interval']);
    const lastAyahTime = result.lastAyahTime;
    const interval = result.interval || DEFAULT_SETTINGS.interval;
    
    if (!lastAyahTime) {
      return true; // No last ayah time, consider it expired
    }
    
    const now = Date.now();
    const timeSinceLastAyah = now - lastAyahTime;
    const intervalMs = interval * 60 * 1000;
    
    return timeSinceLastAyah >= intervalMs;
  } catch (error) {
    console.error('❌ Error checking timer expiration:', error);
    return false;
  }
}

// Handle system wake-up
async function handleWakeUp() {
  const now = Date.now();
  const timeSinceLastWake = now - lastWakeTime;
  
  console.log(`Wake-up check: ${timeSinceLastWake}ms since last wake, threshold: ${5 * 60 * 1000}ms`);
  
  // If more than 5 minutes have passed since last wake, consider it a sleep cycle
  if (timeSinceLastWake > 5 * 60 * 1000) {
    console.log('System wake-up detected, checking timer status...');
    
    const result = await chrome.storage.sync.get(['lastAyahTime', 'interval']);
    const lastAyahTime = result.lastAyahTime;
    const interval = result.interval || DEFAULT_SETTINGS.interval;
    
    if (lastAyahTime) {
      const timeSinceLastAyah = now - lastAyahTime;
      const intervalMs = interval * 60 * 1000;
      
      console.log(`Timer check: ${timeSinceLastAyah}ms since last ayah, interval: ${intervalMs}ms`);
      
      // If it's time for a new ayah, send it immediately
      if (timeSinceLastAyah >= intervalMs) {
        console.log('Timer expired during sleep, sending ayah now');
        await sendAyahNotification();
      } else {
        console.log('Timer still active, rescheduling alarm');
        await scheduleAyahAlarm();
      }
    } else {
      console.log('No last ayah time found, scheduling new alarm');
      await scheduleAyahAlarm();
    }
  } else {
    console.log('No significant time gap detected, normal operation');
  }
  
  lastWakeTime = now;
}

// Handle extension suspend (when system goes to sleep)
chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension suspending, system going to sleep...');
  lastWakeTime = Date.now();
});

// Handle extension startup (when system wakes up)
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension started up, checking timer status...');
  await handleWakeUp();
});

// Schedule the ayah alarm - IMPROVED
async function scheduleAyahAlarm() {
  try {
    console.log('🔔 Starting alarm scheduling...');
    
    const result = await chrome.storage.sync.get(['interval']);
    const interval = result.interval || DEFAULT_SETTINGS.interval;
    
    console.log(`📊 Interval value: ${interval} minutes`);
    
    // Validate interval
    if (interval < 1 || interval > 1440) {
      console.error(`❌ Invalid interval: ${interval}. Must be between 1 and 1440 minutes`);
      return;
    }
    
    // Clear existing alarm first
    console.log('🧹 Clearing existing alarm...');
    try {
      await chrome.alarms.clear('quran-ayah-reminder');
      console.log('✅ Existing alarm cleared');
    } catch (clearError) {
      console.log('⚠️ Error clearing existing alarm (may not exist):', clearError.message);
    }
    
    // Wait a moment for the clear to take effect
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Try multiple alarm creation strategies
    let alarmCreated = false;
    const strategies = [
      // Strategy 1: Standard approach
      {
        name: 'Standard',
        options: {
          delayInMinutes: interval,
          periodInMinutes: interval
        }
      },
      // Strategy 2: Immediate start with period
      {
        name: 'Immediate',
        options: {
          delayInMinutes: 1,
          periodInMinutes: interval
        }
      },
      // Strategy 3: When-based approach
      {
        name: 'When-based',
        options: {
          when: Date.now() + (interval * 60 * 1000),
          periodInMinutes: interval
        }
      },
      // Strategy 4: Simple delay only
      {
        name: 'Delay-only',
        options: {
          delayInMinutes: interval
        }
      }
    ];
    
    for (const strategy of strategies) {
      if (alarmCreated) break;
      
      try {
        console.log(`🔄 Trying ${strategy.name} strategy...`);
        await chrome.alarms.create('quran-ayah-reminder', strategy.options);
        
        // Wait a moment for the alarm to be created
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify alarm was created
        const alarm = await chrome.alarms.get('quran-ayah-reminder');
        if (alarm) {
          console.log(`✅ ${strategy.name} strategy succeeded!`);
          console.log(`📅 Next alarm at: ${new Date(alarm.scheduledTime).toLocaleString()}`);
          console.log('🔍 Alarm details:', alarm);
          alarmCreated = true;
        } else {
          console.log(`❌ ${strategy.name} strategy failed - alarm not found after creation`);
        }
      } catch (strategyError) {
        console.log(`❌ ${strategy.name} strategy error:`, strategyError.message);
      }
    }
    
    if (!alarmCreated) {
      console.error('❌ All alarm creation strategies failed');
      
      // Final fallback: try to create a basic alarm without verification
      console.log('🆘 Attempting final fallback...');
      try {
        await chrome.alarms.create('quran-ayah-reminder', {
          delayInMinutes: 1
        });
        console.log('🆘 Final fallback alarm creation attempted');
        
        // Don't verify this one - just assume it worked
        console.log('⚠️ Assuming fallback alarm was created (no verification)');
      } catch (finalError) {
        console.error('❌ Final fallback also failed:', finalError.message);
        throw new Error('All alarm creation methods failed');
      }
    }
    
  } catch (error) {
    console.error('❌ Error scheduling alarm:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Schedule a retry in 30 seconds
    console.log('🔄 Scheduling retry in 30 seconds...');
    setTimeout(async () => {
      try {
        await scheduleAyahAlarm();
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError.message);
      }
    }, 30000);
  }
}

// Check if we need a new ayah and get one if needed
async function getNewAyahIfNeeded(force = false) {
  try {
    console.log(`🔍 getNewAyahIfNeeded called with force=${force}`);
    
    const result = await chrome.storage.sync.get(['lastAyah', 'lastAyahTime', 'interval']);
    const lastAyah = result.lastAyah;
    const lastAyahTime = result.lastAyahTime;
    const interval = result.interval || DEFAULT_SETTINGS.interval;
    
    console.log('📊 Current state:', {
      lastAyah: lastAyah ? `${lastAyah.surah} ${lastAyah.ayah}` : 'None',
      lastAyahTime: lastAyahTime ? new Date(lastAyahTime).toLocaleString() : 'None',
      interval: interval
    });
    
    const now = Date.now();
    const timeSinceLastAyah = lastAyahTime ? (now - lastAyahTime) : Infinity;
    const intervalMs = interval * 60 * 1000; // Convert minutes to milliseconds
    
    // Get new ayah if:
    // 1. Force is true (manual request)
    // 2. No ayah exists yet
    // 3. Enough time has passed since last ayah
    // 4. Same ayah is being repeated (prevent stagnation)
    const shouldGetNewAyah = force || 
                            !lastAyah || 
                            timeSinceLastAyah >= intervalMs ||
                            isAyahRepeating(lastAyah);
    
    console.log('🔍 Should get new ayah?', {
      force,
      noAyah: !lastAyah,
      timeElapsed: timeSinceLastAyah >= intervalMs,
      repeating: isAyahRepeating(lastAyah),
      result: shouldGetNewAyah
    });
    
    if (shouldGetNewAyah) {
      console.log('📖 Getting new ayah...');
      const newAyah = await fetchRandomAyah();
      
      if (newAyah) {
        // Save new ayah with timestamp
        console.log('💾 Saving new ayah to storage:', newAyah.surah, newAyah.ayah);
        await chrome.storage.sync.set({ 
          lastAyah: newAyah,
          lastAyahTime: now
        });
        
        // Track this ayah to avoid repetition
        trackAyahUsage(newAyah);
        
        console.log(`✅ New ayah set: ${newAyah.surah} ${newAyah.ayah}`);
        return newAyah;
      } else {
        // Fallback to embedded ayat
        console.log('⚠️ API failed, using fallback ayah');
        const fallbackAyah = getRandomFallbackAyah();
        console.log('💾 Saving fallback ayah to storage:', fallbackAyah.surah, fallbackAyah.ayah);
        
        await chrome.storage.sync.set({ 
          lastAyah: fallbackAyah,
          lastAyahTime: now
        });
        
        // Track this ayah to avoid repetition
        trackAyahUsage(fallbackAyah);
        
        console.log(`✅ Fallback ayah set: ${fallbackAyah.surah} ${fallbackAyah.ayah}`);
        return fallbackAyah;
      }
    } else {
      // Use existing ayah
      console.log('📖 Using existing ayah, time not elapsed yet');
      return lastAyah;
    }
  } catch (error) {
    console.error('❌ Error in getNewAyahIfNeeded:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Fallback to embedded ayat
    console.log('🆘 Emergency fallback to embedded ayah');
    const fallbackAyah = getRandomFallbackAyah();
    console.log('💾 Saving emergency fallback ayah:', fallbackAyah.surah, fallbackAyah.ayah);
    
    try {
      await chrome.storage.sync.set({ 
        lastAyah: fallbackAyah,
        lastAyahTime: Date.now()
      });
      console.log('✅ Emergency fallback ayah saved');
    } catch (storageError) {
      console.error('❌ Failed to save emergency fallback ayah:', storageError);
    }
    
    // Track this ayah to avoid repetition
    trackAyahUsage(fallbackAyah);
    
    return fallbackAyah;
  }
}

// Track ayah usage to prevent repetition
function trackAyahUsage(ayah) {
  const ayahHash = `${ayah.surah}-${ayah.ayah}`;
  usedAyahs.add(ayahHash);
  lastAyahHash = ayahHash;
  
  // Keep only last 20 used ayahs to prevent memory bloat
  if (usedAyahs.size > 20) {
    const ayahArray = Array.from(usedAyahs);
    usedAyahs = new Set(ayahArray.slice(-20));
  }
  
  console.log(`Ayah tracked: ${ayahHash}, Total tracked: ${usedAyahs.size}`);
}

// Check if ayah is repeating
function isAyahRepeating(ayah) {
  if (!ayah) return false;
  
  const ayahHash = `${ayah.surah}-${ayah.ayah}`;
  const isRepeating = ayahHash === lastAyahHash;
  
  if (isRepeating) {
    console.log(`Ayah is repeating: ${ayahHash}`);
  }
  
  return isRepeating;
}

// Send ayah notification
async function sendAyahNotification(isTest = false) {
  try {
    // Get current ayah (or new one if needed)
    const ayah = await getNewAyahIfNeeded();
    
    if (ayah) {
      // Show notification
      await showAyahNotification(ayah, isTest);
    }
  } catch (error) {
    console.error('Error sending ayah notification:', error);
    
    // Fallback to embedded ayat
    const fallbackAyah = getRandomFallbackAyah();
    await chrome.storage.sync.set({ 
      lastAyah: fallbackAyah,
      lastAyahTime: Date.now()
    });
    
    // Track this ayah to avoid repetition
    trackAyahUsage(fallbackAyah);
    
    await showAyahNotification(fallbackAyah, isTest);
  }
}

// Fetch random ayah from AlQuran Cloud API
async function fetchRandomAyah() {
  try {
    console.log('Fetching random ayah from AlQuran Cloud API...');
    
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/random?t=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`API response not ok: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const ayah = data.data;
    
    console.log('Random ayah fetched:', ayah.surah.name, ayah.numberInSurah);
    
    return {
      text: ayah.text,
      surah: ayah.surah.name,
      ayah: ayah.numberInSurah,
      number: ayah.number
    };
  } catch (error) {
    console.error('Error fetching ayah from AlQuran Cloud API:', error);
    return null;
  }
}

// Fetch popular ayahs (like Ayat Al-Kursi)
async function fetchPopularAyah(ayahType = 'random') {
  try {
    const popularAyahs = {
      'kursi': '2:255',      // Ayat Al-Kursi
      'fatiha': '1:1',       // Al-Fatiha first verse
      'nasr': '110:1',       // Al-Nasr first verse
      'ikhlas': '112:1',     // Al-Ikhlas first verse
      'falaq': '113:1',      // Al-Falaq first verse
      'nas': '114:1'         // Al-Nas first verse
    };
    
    const reference = popularAyahs[ayahType] || popularAyahs['random'];
    console.log(`Fetching popular ayah: ${ayahType} (${reference})`);
    
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${reference}?t=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`API response not ok: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const ayah = data.data;
    
    return {
      text: ayah.text,
      surah: ayah.surah.name,
      ayah: ayah.numberInSurah,
      number: ayah.number
    };
  } catch (error) {
    console.error(`Error fetching popular ayah ${ayahType}:`, error);
    return null;
  }
}

// Get random fallback ayah with better randomization
function getRandomFallbackAyah() {
  // Use crypto.randomUUID() for better randomization if available
  let randomIndex;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    randomIndex = array[0] % FALLBACK_AYAT.length;
  } else {
    randomIndex = Math.floor(Math.random() * FALLBACK_AYAT.length);
  }
  
  return FALLBACK_AYAT[randomIndex];
}

// Show ayah notification
async function showAyahNotification(ayah, isTest = false) {
  const notificationOptions = {
    type: 'basic',
    iconUrl: 'assets/icon128.png',
    title: isTest ? 'Test: Quran Ayah' : 'Quran Ayah',
    message: ayah.text,
    contextMessage: `${ayah.surah} ${ayah.ayah}`,
    requireInteraction: false,
    silent: false
  };
  
  await chrome.notifications.create('quran-ayah', notificationOptions);
  
  if (isTest) {
    console.log('Test notification sent');
  } else {
    console.log(`Ayah notification sent: ${ayah.surah} ${ayah.ayah}`);
  }
}

// Listen for storage changes to reschedule alarms
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.interval) {
    console.log('Settings changed, rescheduling alarm');
    scheduleAyahAlarm();
  }
});

// Reset used ayahs when extension is updated
chrome.runtime.onUpdateAvailable.addListener(() => {
  console.log('Extension update available, resetting ayah tracking');
  usedAyahs.clear();
  lastAyahHash = '';
});

// CRITICAL: Add alarm debugging function
async function debugAlarmStatus() {
  try {
    console.log('🔍 === ALARM DEBUG INFORMATION ===');
    
    // Check if we have the alarms permission
    const permissions = await chrome.permissions.getAll();
    console.log('Permissions:', permissions);
    
    // List all alarms
    const allAlarms = await chrome.alarms.getAll();
    console.log('All alarms in system:', allAlarms);
    
    // Check our specific alarm
    const ourAlarm = await chrome.alarms.get('quran-ayah-reminder');
    if (ourAlarm) {
      console.log('✅ Our alarm found:', ourAlarm);
      console.log('Alarm name:', ourAlarm.name);
      console.log('Alarm delay:', ourAlarm.delayInMinutes, 'minutes');
      console.log('Alarm period:', ourAlarm.periodInMinutes, 'minutes');
      console.log('Scheduled time:', ourAlarm.scheduledTime ? new Date(ourAlarm.scheduledTime).toLocaleString() : 'Not set');
      console.log('Is in future:', ourAlarm.scheduledTime ? (ourAlarm.scheduledTime > Date.now()) : 'Unknown');
    } else {
      console.log('❌ Our alarm not found');
    }
    
    // Check storage for interval setting
    const storage = await chrome.storage.sync.get(['interval']);
    console.log('Storage interval setting:', storage.interval);
    
    // Check if service worker is active
    console.log('Service worker active:', typeof chrome.runtime !== 'undefined');
    console.log('Chrome alarms API available:', typeof chrome.alarms !== 'undefined');
    
    console.log('🔍 === END ALARM DEBUG ===');
  } catch (error) {
    console.error('❌ Error in alarm debug:', error);
  }
}

// CRITICAL: Add storage debugging and repair function
async function debugAndRepairStorage() {
  try {
    console.log('🔧 === STORAGE DEBUG AND REPAIR ===');
    
    // Check current storage state
    const currentStorage = await chrome.storage.sync.get(null);
    console.log('Current storage state:', currentStorage);
    
    // Check if we have the required data
    const hasInterval = currentStorage.interval !== undefined;
    const hasLastAyah = currentStorage.lastAyah !== undefined;
    const hasLastAyahTime = currentStorage.lastAyahTime !== undefined;
    
    console.log('Storage health check:', {
      hasInterval,
      hasLastAyah,
      hasLastAyahTime,
      interval: currentStorage.interval,
      lastAyah: currentStorage.lastAyah ? `${currentStorage.lastAyah.surah} ${currentStorage.lastAyah.ayah}` : 'None',
      lastAyahTime: currentStorage.lastAyahTime ? new Date(currentStorage.lastAyahTime).toLocaleString() : 'None'
    });
    
    // Repair missing data
    let repairsMade = false;
    
    if (!hasInterval) {
      console.log('🔧 Repairing missing interval setting...');
      await chrome.storage.sync.set({ interval: DEFAULT_SETTINGS.interval });
      repairsMade = true;
    }
    
    if (!hasLastAyah || !hasLastAyahTime) {
      console.log('🔧 Repairing missing ayah data...');
      const newAyah = await getNewAyahIfNeeded(true);
      if (newAyah) {
        console.log('✅ Ayah data repaired');
        repairsMade = true;
      } else {
        console.error('❌ Failed to repair ayah data');
      }
    }
    
    if (repairsMade) {
      console.log('🔧 Storage repairs completed');
      // Verify repair
      const verifyStorage = await chrome.storage.sync.get(null);
      console.log('Storage after repair:', verifyStorage);
    } else {
      console.log('✅ Storage is healthy, no repairs needed');
    }
    
    console.log('🔧 === END STORAGE DEBUG AND REPAIR ===');
    return repairsMade;
  } catch (error) {
    console.error('❌ Error in storage debug and repair:', error);
    return false;
  }
}

// CRITICAL: Add final initialization check after a delay
// This ensures the extension is fully initialized even if early initialization fails
setTimeout(async () => {
  if (!isInitialized) {
    console.log('Delayed initialization check - retrying...');
    await initializeExtension();
  }
}, 10000); // Wait 10 seconds then check
