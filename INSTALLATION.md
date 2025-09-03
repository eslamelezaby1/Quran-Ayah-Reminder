# 📦 Installation Guide - Ayah Reminder

This guide will help you install and test the Ayah Reminder extension with the latest notification fixes.

## 🚀 Quick Installation

### Step 1: Download the Extension
1. Download or clone this repository to your computer
2. Make sure all files are present:
   - `manifest.json`
   - `background.js`
   - `popup.html`, `popup.js`
   - `options.html`, `options.js`
   - `styles.css`
   - `assets/` folder with icons
   - `test-notifications.html`

### Step 2: Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the extension folder
5. The extension should appear in your extensions list

### Step 3: Grant Permissions
1. Click "Details" on the Ayah Reminder extension
2. Ensure all permissions are granted:
   - ✅ Notifications
   - ✅ Storage
   - ✅ Alarms
3. Enable "Allow in incognito" if desired

## 🧪 Testing the Installation

### Test 1: Basic Functionality
1. Click the extension icon in your toolbar
2. You should see the popup with:
   - Current ayah display
   - Timer countdown
   - Action buttons
3. Click "Send Ayah Now" to test immediate notifications

### Test 2: Notification Permissions
1. Open `test-notifications.html` in Chrome
2. Click "Test Connection" - should show ✅
3. Click "Check Permissions" - should show ✅
4. Click "Send Test Notification" - should show ✅

### Test 3: Alarm Scheduling
1. In the extension popup, click "Settings"
2. Choose a short interval (10 minutes)
3. Save settings
4. Wait for the timer to count down
5. Notification should appear when timer reaches "Now!"

## 🔧 Troubleshooting Installation

### Extension Won't Load
- **Error:** "Manifest file is missing or unreadable"
  - Solution: Check that `manifest.json` exists and is valid JSON
- **Error:** "Background script failed to load"
  - Solution: Check that `background.js` exists and has no syntax errors

### Permissions Issues
- **Error:** "Permission denied"
  - Solution: Go to `chrome://extensions/` → Details → Permissions
- **Error:** "Notifications blocked"
  - Solution: Check Chrome settings → Privacy → Site Settings → Notifications

### Extension Not Working
1. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Find Ayah Reminder
   - Click "Reload"

2. **Check console for errors:**
   - Press F12 to open DevTools
   - Go to Console tab
   - Look for error messages

3. **Test with debug features:**
   - Open extension popup
   - Click "Debug Alarms"
   - Click "Debug Storage"
   - Check console output

## 🎯 Common Issues & Solutions

### Issue: "Extension not initialized"
**Solution:**
1. Reload the extension
2. Check console for initialization errors
3. Try the debug features

### Issue: "Notifications not appearing"
**Solution:**
1. Check system notification settings
2. Ensure Chrome notifications are enabled
3. Test with "Send Ayah Now" button
4. Use the test page (`test-notifications.html`)

### Issue: "Timer stuck at 0:00"
**Solution:**
1. Click "Debug Alarms" in popup
2. Check if alarms are properly scheduled
3. Try "New Ayah" button to reset timer
4. Reload extension if needed

### Issue: "Settings not saving"
**Solution:**
1. Click "Debug Storage" in popup
2. Check Chrome sync status
3. Try refreshing the options page
4. Restart Chrome

## 📋 Pre-Installation Checklist

Before installing, ensure:

- [ ] Chrome browser is up to date
- [ ] Developer mode is enabled
- [ ] All extension files are present
- [ ] No conflicting extensions are installed
- [ ] System notifications are enabled
- [ ] Chrome notifications are allowed

## 🧹 Post-Installation Cleanup

After successful installation:

1. **Test all features:**
   - Immediate notifications
   - Scheduled notifications
   - Settings changes
   - Ayah display

2. **Verify permissions:**
   - Notifications work
   - Storage saves settings
   - Alarms trigger properly

3. **Check for conflicts:**
   - Other notification extensions
   - System notification settings
   - Chrome notification settings

## 🆘 Getting Help

If you encounter issues:

1. **Check the console logs** (F12 → Console)
2. **Use the debug features** in the extension
3. **Test with the notification test page**
4. **Review the troubleshooting section** in README.md
5. **Submit an issue** with detailed error messages

## 🔄 Updating the Extension

To update to a newer version:

1. Download the new files
2. Go to `chrome://extensions/`
3. Click "Reload" on Ayah Reminder
4. Test functionality to ensure it works

## 📝 Notes

- The extension requires Chrome 88+ for Manifest V3
- Service workers may take a moment to initialize
- Alarms may not work if Chrome is completely closed
- System sleep/hibernation may affect alarm timing
- Test notifications work best when Chrome is active

---

**Happy testing! 🌟**
