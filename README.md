# 📖 Ayah Reminder

A Chrome extension that sends periodic notifications with random Quran verses to remind you of Allah's words throughout your day.

## ✨ Features

- **🕐 Customizable Intervals**: Choose from 10 minutes to 3 hours between reminders
- **🌐 Online Quran API**: Fetches authentic Quran verses from Al-Quran Cloud API
- **🔄 Fallback System**: Uses embedded verses when API is unavailable
- **🔔 Smart Notifications**: Click notifications to open verses on Quran.com
- **⚙️ Easy Settings**: Simple options page to configure reminder frequency

## 🚀 Installation

### From Chrome Web Store (When Available)
1. Visit the Chrome Web Store
2. Search for "Ayah Reminder"
3. Click "Add to Chrome"
4. Confirm the installation


### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will be installed and ready to use

## 🎮 How to Use

### Getting Started
1. **Install the extension** using one of the methods above
2. **Click the extension icon** in your Chrome toolbar
3. **Configure settings** by clicking "Settings" in the popup
4. **Choose your reminder interval** (10 minutes to 3 hours)
5. **Save your settings** and you're all set!

### Main Features
- **📖 Send Now**: Get an immediate Quran verse notification
- **🔄 New Ayah**: Request a fresh verse right away
- **⚙️ Settings**: Adjust reminder frequency and test notifications
- **⏰ Timer**: See when the next reminder will arrive
- **🚀 Initialize**: Manual initialization if extension needs setup

### Notification Interaction
- **Click any notification** to open the verse on Quran.com
- **Notifications appear** based on your chosen interval
- **Verses are randomly selected** from the entire Quran

## 🔧 Configuration

### Reminder Intervals
- Every 10 minutes
- Every 15 minutes  
- Every 30 minutes
- Every 45 minutes
- Every 60 minutes (1 hour)
- Every 2 hours
- Every 3 hours

### Settings Page
Access settings by:
1. Clicking the extension icon
2. Clicking "Settings" button
3. Or going to `chrome://extensions/` → Ayah Reminder → "Extension options"

## 🛠️ Technical Details

### Permissions Used
- **notifications**: To display Quran verse reminders
- **storage**: To save user settings and sync across devices
- **alarms**: To schedule periodic reminders
- **host_permissions**: Access to Al-Quran Cloud API

### Architecture
- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background script for alarms and notifications
- **Popup Interface**: User-friendly control panel
- **Options Page**: Settings configuration
- **Fallback System**: Embedded verses for offline reliability

### API Integration
- **Primary**: Al-Quran Cloud API (https://api.alquran.cloud)
- **Fallback**: Embedded verses when API is unavailable
- **Random Selection**: Fetches random verses from the entire Quran

## 🎨 User Interface

### Popup Features
- Current verse display with Arabic text and reference
- Countdown timer to next reminder
- Quick action buttons (Send Now, New Ayah, Settings)
- Extension status and error handling
- Manual initialization option

### Options Page
- Interval selection dropdown (10 minutes to 3 hours)
- Test notification button
- Next ayah countdown timer
- Helpful information section
- Easy navigation back to extension

## 🔒 Privacy & Security

- **No personal data collected**: Extension only stores your reminder preferences
- **Secure API calls**: Uses HTTPS for all external requests
- **Local storage**: Settings stored locally in Chrome
- **No tracking**: No analytics or user tracking

## 🐛 Troubleshooting

### Common Issues

**Notifications not appearing when timer ends:**
- Check Chrome notification permissions for the extension
- Ensure the extension is enabled and not paused
- Verify your chosen interval settings are saved
- Try using the "Send Ayah Now" button to test immediate notifications
- Check if your system is in "Do Not Disturb" mode
- Restart Chrome and reload the extension

**Extension not working after Chrome update:**
- Go to `chrome://extensions/`
- Find Ayah Reminder
- Click "Reload" if needed
- Check if any permissions were revoked

**Settings not saving:**
- Check Chrome sync status
- Try refreshing the options page
- Restart Chrome if needed
- Use the debug storage feature to repair settings

**Timer shows "Now!" but no notification:**
- Click the "Debug Alarms" button in the popup
- Check the browser console for error messages
- Try manually sending a notification with "Send Ayah Now"
- Verify the background script is running properly

### Advanced Troubleshooting

**Step-by-step notification fix:**

1. **Check Permissions:**
   - Go to `chrome://extensions/`
   - Find Ayah Reminder
   - Click "Details"
   - Ensure "Allow in incognito" is enabled
   - Check that all permissions are granted

2. **Test Notifications:**
   - Open the extension popup
   - Click "Send Ayah Now" to test immediate notifications
   - If this works, the issue is with alarm scheduling
   - If this fails, check notification permissions

3. **Debug Extension:**
   - Open the extension popup
   - Click "Debug Alarms" to check alarm status
   - Click "Debug Storage" to repair any corrupted settings
   - Check the browser console (F12) for detailed error messages

4. **Reset Extension:**
   - Go to `chrome://extensions/`
   - Find Ayah Reminder
   - Click "Remove" then reinstall
   - This will reset all settings and alarms

5. **Check System Settings:**
   - Ensure Chrome notifications are enabled in system settings
   - Check if "Focus Assist" (Windows) or "Do Not Disturb" (Mac) is active
   - Verify Chrome is not muted

**Using the Test Page:**
- Open `test-notifications.html` in Chrome
- Run through all the test buttons to identify the specific issue
- Check the console for detailed error messages
- Use the debug features to repair any problems

### Debug Features

The extension includes built-in debugging features for troubleshooting alarm and storage issues:

- **Debug Alarms:** Checks alarm status and scheduling
- **Debug Storage:** Repairs corrupted settings and data
- **Test Notifications:** Sends immediate test notifications
- **Status Check:** Verifies extension initialization

### Common Error Messages

**"Notification permission required":**
- Grant notification permissions in Chrome settings
- Check system notification settings

**"Background script not initialized":**
- Reload the extension
- Check if the service worker is running

**"Alarm creation failed":**
- Try the debug alarms feature
- Restart Chrome and reload extension

**"Storage sync failed":**
- Check Chrome sync status
- Use debug storage to repair settings

### Performance Tips

- **Shorter intervals** (10-30 minutes) work more reliably than longer ones
- **Keep Chrome running** to ensure alarms trigger properly
- **Avoid system sleep** during testing periods
- **Check console logs** for detailed debugging information

### Getting Help

If you're still experiencing issues:

1. **Check the console logs** (F12 → Console tab) for error messages
2. **Use the debug features** in the extension popup
3. **Test with the notification test page** (`test-notifications.html`)
4. **Try resetting the extension** completely
5. **Submit an issue** with detailed error messages and steps to reproduce

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
1. Clone the repository
2. Load as unpacked extension in Chrome (`chrome://extensions/` → Developer mode → Load unpacked)
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Al-Quran Cloud API**: For providing authentic Quran text
- **Quran.com**: For hosting the verse links
- **Chrome Extensions Team**: For the excellent extension platform

## 📞 Support

If you encounter any issues or have questions:
- Check the troubleshooting section above
- Review the extension's options page for help
- Submit an issue on the project repository

---

**May this extension help you stay connected to Allah's words throughout your day. 🌟**
