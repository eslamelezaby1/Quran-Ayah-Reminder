// Quran Ayah Reminder - Background Service Worker
// Handles alarms, fetches ayahs, and shows notifications

// Fallback ayat in case API fails
const FALLBACK_AYAT = [
  {
    text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    translation: "Indeed, Allah is with the patient",
    surah: "Al-Baqarah",
    ayah: 153,
    number: 153
  },
  {
    text: "رَبِّ اشْرَحْ لِي صَدْرِي",
    translation: "My Lord, expand for me my breast",
    surah: "Ta-Ha",
    ayah: 25,
    number: 25
  },
  {
    text: "إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّى يُغَيِّرُوا مَا بِأَنفُسِهِمْ",
    translation: "Indeed, Allah will not change the condition of a people until they change what is in themselves",
    surah: "Ar-Ra'd",
    ayah: 11,
    number: 11
  },
  {
    text: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ",
    translation: "And my success is not but through Allah",
    surah: "Hud",
    ayah: 88,
    number: 88
  },
  {
    text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "For indeed, with hardship [will be] ease",
    surah: "Ash-Sharh",
    ayah: 5,
    number: 5
  }
];

// Default settings
const DEFAULT_SETTINGS = {
  interval: 60, // minutes
  showTranslation: false
};

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
    chrome.storage.sync.get(['interval', 'showTranslation'], (result) => {
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
    if (force || !lastAyah || timeSinceLastAyah >= intervalMs) {
      console.log('Getting new ayah...');
      const newAyah = await fetchRandomAyah();
      
      if (newAyah) {
        // Save new ayah with timestamp
        await chrome.storage.sync.set({ 
          lastAyah: newAyah,
          lastAyahTime: now
        });
        console.log(`New ayah set: ${newAyah.surah} ${newAyah.ayah}`);
        return newAyah;
      } else {
        // Fallback to embedded ayat
        const fallbackAyah = getRandomFallbackAyah();
        await chrome.storage.sync.set({ 
          lastAyah: fallbackAyah,
          lastAyahTime: now
        });
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
    return fallbackAyah;
  }
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
    await showAyahNotification(fallbackAyah, isTest);
  }
}

// Fetch random ayah from API
async function fetchRandomAyah() {
  try {
    // Get settings
    const result = await chrome.storage.sync.get(['showTranslation']);
    const showTranslation = result.showTranslation || false;
    
    // Fetch random ayah
    const response = await fetch('https://api.alquran.cloud/v1/ayah/random');
    if (!response.ok) throw new Error('API response not ok');
    
    const data = await response.json();
    const ayah = data.data;
    
    let translation = '';
    if (showTranslation) {
      try {
        const translationResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${ayah.number}/en.sahih`);
        if (translationResponse.ok) {
          const translationData = await translationResponse.json();
          translation = translationData.data.text;
        }
      } catch (error) {
        console.log('Translation fetch failed, continuing without it');
      }
    }
    
    return {
      text: ayah.text,
      translation: translation,
      surah: ayah.surah.name,
      ayah: ayah.numberInSurah,
      number: ayah.number
    };
  } catch (error) {
    console.error('Error fetching ayah:', error);
    return null;
  }
}

// Get random fallback ayah
function getRandomFallbackAyah() {
  const randomIndex = Math.floor(Math.random() * FALLBACK_AYAT.length);
  return FALLBACK_AYAT[randomIndex];
}

// Show ayah notification
async function showAyahNotification(ayah, isTest = false) {
  const settings = await chrome.storage.sync.get(['showTranslation']);
  const showTranslation = settings.showTranslation || false;
  
  let message = ayah.text;
  if (showTranslation && ayah.translation) {
    message += `\n\n${ayah.translation}`;
  }
  
  const notificationOptions = {
    type: 'basic',
    iconUrl: 'assets/icon128.png',
    title: isTest ? 'Test: Quran Ayah' : 'Quran Ayah',
    message: message,
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
  if (namespace === 'sync' && (changes.interval || changes.showTranslation)) {
    console.log('Settings changed, rescheduling alarm');
    scheduleAyahAlarm();
  }
});
