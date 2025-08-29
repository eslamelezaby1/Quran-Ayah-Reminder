# Quran Ayah Reminder

A beautiful Chrome extension that reminds you of Allah's words throughout your day with automatically rotating Quran verses.

## ✨ Features

- **🕒 Time-Based Ayah Rotation**: Ayahs automatically change based on your chosen time interval (15 minutes to 3 hours)
- **📱 Beautiful Notifications**: Receive beautiful notifications with Arabic text and optional English translations
- **🔄 Manual Control**: Force a new ayah anytime with the "New Ayah" button
- **⏰ Countdown Timer**: See exactly when the next ayah will be available
- **🌐 Online Integration**: Fetches fresh ayahs from the Quran API with fallback to embedded verses
- **⚙️ Customizable Settings**: Choose your preferred reminder interval and translation preferences
- **🔗 Quick Access**: Click notifications to open ayahs directly on Quran.com

## 🚀 How It Works

### Automatic Ayah Rotation
- **Time-Based System**: Instead of random ayahs every time, the extension now rotates ayahs based on time intervals
- **Smart Caching**: Once an ayah is fetched, it remains active until the time interval expires
- **Efficient API Usage**: Reduces API calls by only fetching new ayahs when needed

### Timer Display
- **Popup Timer**: Shows countdown to next ayah change in the popup
- **Options Timer**: Displays when next ayah will be available in the options page
- **Real-time Updates**: Timer updates every second to show accurate countdown

### Manual Controls
- **Send Ayah Now**: Send the current ayah as a notification immediately
- **New Ayah Button**: Force a new ayah before the time interval expires
- **Test Notifications**: Test the notification system anytime

## 📥 Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

## ⚙️ Configuration

### Reminder Intervals
- **15 minutes**: For frequent reminders
- **30 minutes**: Balanced approach
- **45 minutes**: Moderate frequency
- **60 minutes**: Default setting (every hour)
- **120 minutes**: Every 2 hours
- **180 minutes**: Every 3 hours

### Translation Options
- **Arabic Only**: Show only the Arabic text
- **With Translation**: Include English translation from Sahih International

## 🔧 Technical Details

### Architecture
- **Background Service Worker**: Handles alarms, API calls, and notifications
- **Popup Interface**: Main user interface with timer and controls
- **Options Page**: Settings configuration and testing
- **Storage Sync**: Settings and ayah data synced across devices

### API Integration
- **Primary Source**: [AlQuran Cloud API](https://alquran.cloud/api) for fresh ayahs
- **Fallback System**: Embedded fallback ayat if API fails
- **Translation Support**: English translations from Sahih International

### Time Management
- **Interval Tracking**: Uses Chrome alarms for precise timing
- **Timestamp Storage**: Stores when each ayah was fetched
- **Automatic Rotation**: Seamlessly switches ayahs when intervals expire

## 🎯 Use Cases

- **Daily Reminders**: Set hourly reminders for spiritual reflection
- **Study Aid**: Use shorter intervals for focused Quran study
- **Mindfulness**: Gentle reminders throughout the day
- **Family Time**: Share beautiful verses with family members

## 🛠️ Development

### File Structure
```
├── manifest.json          # Extension configuration
├── background.js          # Service worker and core logic
├── popup.html            # Main popup interface
├── popup.js              # Popup functionality
├── options.html          # Settings page
├── options.js            # Options functionality
├── styles.css            # Shared styling
├── assets/               # Icons and images
└── README.md             # This file
```

### Key Functions
- `getNewAyahIfNeeded()`: Smart ayah rotation logic
- `updateTimer()`: Real-time countdown display
- `scheduleAyahAlarm()`: Chrome alarm management
- `fetchRandomAyah()`: API integration with fallbacks

## 🔄 Recent Updates

### Version 2.0 - Time-Based Rotation
- ✅ **Smart Ayah Rotation**: Ayahs now change based on time intervals instead of every notification
- ✅ **Countdown Timer**: Real-time display showing when next ayah will be available
- ✅ **Manual Control**: New "New Ayah" button for immediate ayah changes
- ✅ **Efficient API Usage**: Reduced API calls through intelligent caching
- ✅ **Enhanced UI**: Modern, responsive design with better user experience

### Previous Features
- ✅ Automatic notifications at set intervals
- ✅ Arabic text with optional English translations
- ✅ Click notifications to open on Quran.com
- ✅ Customizable reminder intervals
- ✅ Fallback ayat system
- ✅ Cross-device synchronization

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve this extension.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Quran translations provided by [Sahih International](https://quran.com/sahih)
- API services by [AlQuran Cloud](https://alquran.cloud)
- Built with love for the Muslim community

---

**May Allah bless you and guide you through His beautiful words.** 🌟
