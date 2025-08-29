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
  interval: 60 // minutes
};

// Track used ayahs to avoid repetition
let usedAyahs = new Set();
let lastAyahHash = '';

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Quran Ayah Reminder installed');
    
    // Set default settings
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
    
    // Schedule first alarm and get initial ayah
    await scheduleAyahAlarm();
    await getNewAyahIfNeeded();
  }
});

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'quran-ayah-reminder') {
    await sendAyahNotification();
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
  }
});

// Schedule the ayah alarm
async function scheduleAyahAlarm() {
  const result = await chrome.storage.sync.get(['interval']);
  const interval = result.interval || DEFAULT_SETTINGS.interval;
  
  // Clear existing alarm
  await chrome.alarms.clear('quran-ayah-reminder');
  
  // Create new alarm
  await chrome.alarms.create('quran-ayah-reminder', {
    delayInMinutes: interval,
    periodInMinutes: interval
  });
  
  console.log(`Ayah alarm scheduled for every ${interval} minutes`);
}

// Check if we need a new ayah and get one if needed
async function getNewAyahIfNeeded(force = false) {
  try {
    console.log(`getNewAyahIfNeeded called with force=${force}`);
    
    const result = await chrome.storage.sync.get(['lastAyah', 'lastAyahTime', 'interval']);
    const lastAyah = result.lastAyah;
    const lastAyahTime = result.lastAyahTime;
    const interval = result.interval || DEFAULT_SETTINGS.interval;
    
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
    
    if (shouldGetNewAyah) {
      console.log('Getting new ayah...');
      const newAyah = await fetchRandomAyah();
      
      if (newAyah) {
        // Save new ayah with timestamp
        console.log('Saving new ayah to storage:', newAyah.surah, newAyah.ayah);
        await chrome.storage.sync.set({ 
          lastAyah: newAyah,
          lastAyahTime: now
        });
        
        // Track this ayah to avoid repetition
        trackAyahUsage(newAyah);
        
        console.log(`New ayah set: ${newAyah.surah} ${newAyah.ayah}`);
        return newAyah;
      } else {
        // Fallback to embedded ayat
        console.log('API failed, using fallback ayah');
        const fallbackAyah = getRandomFallbackAyah();
        await chrome.storage.sync.set({ 
          lastAyah: fallbackAyah,
          lastAyahTime: now
        });
        
        // Track this ayah to avoid repetition
        trackAyahUsage(fallbackAyah);
        
        console.log(`Fallback ayah set: ${fallbackAyah.surah} ${fallbackAyah.ayah}`);
        return fallbackAyah;
      }
    } else {
      // Use existing ayah
      console.log('Using existing ayah, time not elapsed yet');
      return lastAyah;
    }
  } catch (error) {
    console.error('Error in getNewAyahIfNeeded:', error);
    
    // Fallback to embedded ayat
    const fallbackAyah = getRandomFallbackAyah();
    await chrome.storage.sync.set({ 
      lastAyah: fallbackAyah,
      lastAyahTime: Date.now()
    });
    
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
