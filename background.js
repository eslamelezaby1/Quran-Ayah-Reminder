// Quran Ayah Reminder - Background Service Worker
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

// CRITICAL: Initialize extension immediately when service worker starts
console.log('Quran Ayah Reminder service worker starting...');
initializeExtension();

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed or updated:', details.reason);
  await initializeExtension();
});

// CRITICAL: Add startup event listener for when Chrome first opens
chrome.runtime.onStartup.addListener(async () => {
  console.log('Chrome started up - initializing Quran Ayah Reminder');
  await initializeExtension();
});

// CRITICAL: Add initialization function
async function initializeExtension() {
  if (isInitialized) {
    console.log('Extension already initialized, skipping...');
    return;
  }
  
  try {
    console.log('Initializing extension...');
    
    // Check if we need to initialize settings
    const result = await chrome.storage.sync.get(['interval']);
    if (!result.interval) {
      console.log('No settings found, setting defaults');
      await chrome.storage.sync.set(DEFAULT_SETTINGS);
    }
    
    // Check if we need an initial ayah
    const ayahResult = await chrome.storage.sync.get(['lastAyah']);
    if (!ayahResult.lastAyah) {
      console.log('No ayah found, getting initial ayah');
      await getNewAyahIfNeeded();
    }
    
    // Schedule alarm
    await scheduleAyahAlarm();
    
    isInitialized = true;
    console.log('Extension initialization complete');
  } catch (error) {
    console.error('Error during extension initialization:', error);
    // Try again in a few seconds
    setTimeout(() => {
      if (!isInitialized) {
        console.log('Retrying initialization...');
        initializeExtension();
      }
    }, 5000);
  }
}

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'quran-ayah-reminder') {
    console.log('Ayah alarm triggered, sending notification...');
    await sendAyahNotification();
    
    // Verify next alarm is scheduled
    setTimeout(async () => {
      const nextAlarm = await chrome.alarms.get('quran-ayah-reminder');
      if (!nextAlarm) {
        console.log('Next alarm missing after notification, recreating...');
        await scheduleAyahAlarm();
      }
    }, 1000);
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId === 'quran-ayah') {
    // Get the last ayah from storage
    const result = await chrome.storage.sync.get(['lastAyah']);
    if (result.lastAyah && result.lastAyah.number) {
      // Open the ayah on Quran.com
      const url = `https://quran.com/${result.lastAyah.number}`;
      await chrome.tabs.create({ url });
    }
  }
});

// Handle messages from popup and options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // This ensures the service worker stays active
  if (request.action === 'ping') {
    sendResponse({ status: 'active', initialized: isInitialized });
    return true;
  }
  
  if (request.action === 'sendAyahNow') {
    sendAyahNotification();
    sendResponse({ success: true });
  } else if (request.action === 'testNotification') {
    sendAyahNotification(true);
    sendResponse({ success: true });
  } else if (request.action === 'getSettings') {
    chrome.storage.sync.get(['interval'], (result) => {
      sendResponse(result);
    });
    return true; // Keep message channel open for async response
  } else if (request.action === 'updateSettings') {
    chrome.storage.sync.set(request.settings, () => {
      scheduleAyahAlarm();
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'forceNewAyah') {
    getNewAyahIfNeeded(true);
    sendResponse({ success: true });
  } else if (request.action === 'checkWakeUp') {
    // Check if system woke up and handle timer reset
    handleWakeUp();
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    // Return extension status for debugging
    sendResponse({ 
      initialized: isInitialized, 
      timestamp: Date.now(),
      lastWakeTime: lastWakeTime
    });
  } else if (request.action === 'debugAlarms') {
    // CRITICAL: Add debug alarm action
    debugAlarmStatus();
    sendResponse({ success: true, message: 'Alarm debug started - check console' });
  } else if (request.action === 'debugStorage') {
    // CRITICAL: Add debug storage action
    debugAndRepairStorage();
    sendResponse({ success: true, message: 'Storage debug started - check console' });
  }
});

// CRITICAL: Add periodic health check to ensure extension stays active
setInterval(async () => {
  try {
    // Check if our alarm still exists and is working
    const alarm = await chrome.alarms.get('quran-ayah-reminder');
    if (!alarm) {
      console.log('Alarm missing, recreating...');
      await scheduleAyahAlarm();
    } else {
      console.log('Health check: Alarm is active, next at:', new Date(alarm.scheduledTime).toLocaleString());
      
      // Additional verification: check if alarm is scheduled in the future
      const now = Date.now();
      if (alarm.scheduledTime && alarm.scheduledTime < now) {
        console.log('Alarm is in the past, rescheduling...');
        await scheduleAyahAlarm();
      }
    }
    
    // Send ping to keep service worker alive
    chrome.runtime.sendMessage({ action: 'ping' }).catch(() => {
      // Ignore errors, this is just to keep the service worker active
    });
  } catch (error) {
    console.error('Health check failed:', error);
    // Try to recover
    await scheduleAyahAlarm();
  }
}, 60000); // Check every minute

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

// Schedule the ayah alarm
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
    
    // Clear existing alarm
    console.log('🧹 Clearing existing alarm...');
    await chrome.alarms.clear('quran-ayah-reminder');
    
    // Create new alarm with more reliable settings
    console.log(`⏰ Creating new alarm with interval: ${interval} minutes`);
    await chrome.alarms.create('quran-ayah-reminder', {
      delayInMinutes: interval,
      periodInMinutes: interval
    });
    
    // Verify alarm was created
    console.log('🔍 Verifying alarm creation...');
    const alarm = await chrome.alarms.get('quran-ayah-reminder');
    if (alarm) {
      console.log(`✅ Ayah alarm scheduled successfully for every ${interval} minutes`);
      console.log(`📅 Next alarm at: ${new Date(Date.now() + interval * 60 * 1000).toLocaleString()}`);
      console.log('🔍 Alarm details:', alarm);
    } else {
      console.error('❌ Failed to create alarm - alarm not found after creation');
      console.log('🔄 Trying alternative approach with shorter delay...');
      // Try alternative approach with shorter delay
      await chrome.alarms.create('quran-ayah-reminder', {
        delayInMinutes: 1,
        periodInMinutes: interval
      });
      console.log(`🔄 Alternative alarm scheduling attempted`);
      
      // Verify alternative alarm
      const altAlarm = await chrome.alarms.get('quran-ayah-reminder');
      if (altAlarm) {
        console.log('✅ Alternative alarm created successfully');
      } else {
        console.error('❌ Alternative alarm also failed');
      }
    }
  } catch (error) {
    console.error('❌ Error scheduling alarm:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Fallback: try to create a simple alarm
    console.log('🔄 Attempting fallback alarm creation...');
    try {
      await chrome.alarms.create('quran-ayah-reminder', {
        delayInMinutes: 1,
        periodInMinutes: DEFAULT_SETTINGS.interval
      });
      console.log('✅ Fallback alarm created successfully');
      
      // Verify fallback alarm
      const fallbackAlarm = await chrome.alarms.get('quran-ayah-reminder');
      if (fallbackAlarm) {
        console.log('✅ Fallback alarm verified:', fallbackAlarm);
      } else {
        console.error('❌ Fallback alarm verification failed');
      }
    } catch (fallbackError) {
      console.error('❌ Fallback alarm creation failed:', fallbackError);
      console.error('🔍 Fallback error details:', {
        name: fallbackError.name,
        message: fallbackError.message
      });
    }
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
