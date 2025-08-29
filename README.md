# Quran Ayah Reminder – Chrome Extension

## 📌 Goal
A Chrome Extension that periodically shows a **random Quran ayah** in a browser notification.  
- The notification contains the Arabic text (and optionally English translation).  
- Clicking the notification opens the ayah on https://quran.com.  
- If the API is unavailable, the extension falls back to a small set of embedded ayat.  
- User can configure the interval (15–180 minutes) and whether to show translation.

---

## ⚙️ Features
1. **Automatic Reminders**  
   - Uses `chrome.alarms` (Manifest V3 service worker safe) to trigger notifications.  
   - Default = every **60 minutes**.

2. **Random Ayah Fetching**  
   - Arabic text: `https://api.alquran.cloud/v1/ayah/random`.  
   - English translation (optional): `https://api.alquran.cloud/v1/ayah/{number}/en.sahih`.

3. **Fallback Ayat**  
   - If the API fails, pick from a small local set of short ayat with translations.

4. **Options Page**  
   - Select interval (15, 30, 45, 60, 120, 180 minutes).  
   - Toggle English translation.  
   - "Send test notification now" button.

5. **Popup Page**  
   - Button: "Send ayah now".  
   - Shows last delivered ayah (saved in `chrome.storage.sync`).

6. **Storage & Sync**  
   - All settings saved in `chrome.storage.sync`.  
   - Extension remembers last ayah delivered.

---

## 📂 Project Structure
```
quran-ayah-reminder/
  manifest.json
  background.js
  popup.html
  popup.js
  options.html
  options.js
  styles.css
  assets/
    icon16.png
    icon48.png
    icon128.png
  README.md
```

---

## 🔑 Manifest Setup
- **Manifest Version**: V3  
- **Permissions**:  
  - `"notifications"`, `"storage"`, `"alarms"`  
- **Host Permissions**:  
  - `"https://api.alquran.cloud/*"`  
- **Background**:  
  - `"service_worker": "background.js"`  
- **Action**:  
  - Popup = `popup.html`  
- **Options Page**:  
  - `options.html`  

---

## 📜 Implementation Details
1. **background.js (service worker)**  
   - On install: save defaults → schedule alarm.  
   - On alarm: fetch random ayah → show notification.  
   - Fallback if fetch fails.  
   - Save last ayah to storage.  
   - On notification click: open Quran.com link.  
   - Handle messages from popup & options (send now, test).

2. **options.html / options.js**  
   - UI to change interval + toggle translation.  
   - Save settings to storage.  
   - Button to trigger test notification.

3. **popup.html / popup.js**  
   - Show last delivered ayah reference.  
   - Button to send ayah now.

4. **styles.css**  
   - Simple, clean styling for options + popup.

5. **assets/**  
   - Include placeholder PNG icons (16, 48, 128).  
   - Even a 1px transparent PNG works (use base64).

6. **README.md**  
   - This file (instructions, usage, notes).

---

## 🚀 Installation
1. Clone or download the project folder.  
2. Open Chrome and go to: `chrome://extensions/`.  
3. Enable **Developer Mode**.  
4. Click **Load unpacked** → select the `quran-ayah-reminder` folder.  
5. The extension will appear in your toolbar.

---

## 🖥️ Usage
- By default, you'll get a notification every 60 minutes.  
- To change settings:  
  - Right-click → **Options**.  
- To trigger instantly:  
  - Click the extension icon → "Send ayah now".  
- Notifications can be clicked to open the ayah on Quran.com.

---

## 🛠️ Troubleshooting
- If notifications don't appear:  
  - Ensure Chrome notifications are enabled in system settings.  
  - Reopen Chrome after enabling the extension.  
- Minimum allowed interval = **15 minutes**.

---

## 🔒 Privacy
- No tracking, no analytics.  
- Only external API calls are to `https://api.alquran.cloud`.

---

## 📄 License
MIT License. Free to use and modify.

---

## 🎯 Quick Start
1. **Load Extension**: Follow installation steps above
2. **First Notification**: Will appear within 60 minutes (or your chosen interval)
3. **Customize**: Right-click extension → Options to adjust settings
4. **Test**: Use "Send ayah now" button to test immediately

## 🔧 Development Notes
- Built with **Manifest V3** for modern Chrome compatibility
- Uses `chrome.alarms` instead of `setInterval` for reliable scheduling
- Service worker handles background tasks and notifications
- Fallback ayat ensure functionality even when offline
- All settings sync across devices via Chrome sync storage

---

*May this extension help you stay connected to the words of Allah throughout your day.* 🌟
