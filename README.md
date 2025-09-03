# 📖 Quran Ayah Reminder

A Chrome extension that sends periodic notifications with random Quran verses to remind you of Allah's words throughout your day.

## ✨ Features

- **🕐 Customizable Intervals**: Choose from 10 minutes to 3 hours between reminders
- **🌐 Online Quran API**: Fetches authentic Quran verses from Al-Quran Cloud API
- **🔄 Fallback System**: Uses embedded verses when API is unavailable
- **🔔 Smart Notifications**: Click notifications to open verses on Quran.com
- **⚙️ Easy Settings**: Simple options page to configure reminder frequency

## 🚀 Installation

### From Chrome Web Store (Recommended)
1. Visit the Chrome Web Store
2. Search for "Quran Ayah Reminder"
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
3. Or going to `chrome://extensions/` → Quran Ayah Reminder → "Extension options"

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

**Notifications not appearing:**
- Check Chrome notification permissions
- Ensure extension is enabled
- Verify your chosen interval settings

**Extension not working after Chrome update:**
- Go to `chrome://extensions/`
- Find Quran Ayah Reminder
- Click "Reload" if needed

**Settings not saving:**
- Check Chrome sync status
- Try refreshing the options page
- Restart Chrome if needed

### Debug Features
The extension includes built-in debugging features for troubleshooting alarm and storage issues.

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
