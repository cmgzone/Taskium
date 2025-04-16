# TSK Platform Android App

This folder contains the Android wrapper application for the TSK Platform web application. The app uses a WebView to load the web application while providing native Android features and offline capabilities.

## Features

- Native Android experience for TSK Platform
- Offline detection and error handling
- Pull-to-refresh functionality
- Dark mode support
- JavaScript to Android bridge for native features
- Deep link handling
- Share functionality
- Persistent session management
- Push notifications via Firebase Cloud Messaging (FCM)
- Background notification processing
- Notification channels for different types of alerts
- Deep linking from notifications

## Build Requirements

- Android Studio Arctic Fox (2020.3.1) or newer
- Android SDK 30 (Android 11) or higher
- Gradle 7.0.2 or higher
- JDK 11 or higher

## Build Instructions

1. Open the project in Android Studio
2. Sync Gradle files
3. Build the project (Build > Make Project)
4. Run on an emulator or device (Run > Run 'app')

## Production Deployment

To create a signed APK for distribution:

1. In Android Studio, go to Build > Generate Signed Bundle/APK
2. Select APK
3. Create or select your keystore
4. Select the release build variant
5. Complete the signing process

## Configuration

The app is configured to use `https://tskplatform.replit.app/` as the default URL. To change this:

1. Update the `WEB_APP_URL` constant in `MainActivity.java`
2. Rebuild the project

## Firebase Cloud Messaging Setup

The app uses Firebase Cloud Messaging (FCM) for push notifications. To set up FCM for your own version:

1. Create a project in the [Firebase Console](https://console.firebase.google.com/)
2. Add an Android app to the project with the package name `com.tskplatform.app`
3. Download the `google-services.json` file and place it in the app directory
4. Update the server endpoint URLs in `FirebaseTokenProvider.java` if needed

### Notification Channels

The app creates the following notification channels:

- **Mining Rewards** (`tsk_mining`): For mining-related notifications
- **Chat Messages** (`tsk_chat`): For chat and message notifications
- **General Alerts** (`tsk_alerts`): For system alerts and other notifications

### Testing FCM Notifications

You can test FCM notifications by sending a test message from the Firebase Console with the following payload structure:

```json
{
  "to": "[DEVICE_TOKEN]",
  "notification": {
    "title": "Test Notification",
    "body": "This is a test notification"
  },
  "data": {
    "type": "mining",
    "amount": "50.5",
    "streakDay": "3",
    "deepLink": "/mining"
  }
}
```

For chat messages, use:

```json
{
  "data": {
    "type": "chat",
    "sender": "John",
    "message": "Hello there!",
    "deepLink": "/chat"
  }
}
```

## JavaScript Interface

The app exposes multiple JavaScript interfaces that can be accessed from the web application:

### 1. Android Interface

The main interface named `Android` provides general functionality:

```javascript
// Check if Android interface is available
if (typeof Android !== 'undefined') {
  // Access Android functions
  Android.showToast('Hello from web app!');
  
  // Get device info
  const deviceInfo = Android.getDeviceInfo();
  
  // Trigger vibration
  Android.vibrate(100);
  
  // Get connection type
  const connectionType = Android.getConnectionType();
}
```

Available methods:

- `showToast(message)`: Display a toast message
- `getDeviceInfo()`: Get device information
- `vibrate(milliseconds)`: Trigger device vibration
- `openExternalUrl(url)`: Open URL in external browser
- `getAuthToken()`: Get stored auth token
- `setAuthToken(token)`: Store auth token
- `clearAppData()`: Clear app data (logout)
- `isDarkModeEnabled()`: Check if dark mode is enabled
- `setDarkMode(enabled)`: Set dark mode preference
- `shareContent(title, text, url)`: Share content using native share dialog
- `getConnectionType()`: Get current connection type

### 2. AndroidNotification Interface

Interface for handling native notifications:

```javascript
// Check if notification interface is available
if (typeof AndroidNotification !== 'undefined') {
  // Request notification permission
  AndroidNotification.requestNotificationPermission(function(granted) {
    if (granted) {
      console.log('Notification permission granted');
    } else {
      console.log('Notification permission denied');
    }
  });
  
  // Check if notifications are enabled
  const notificationsEnabled = AndroidNotification.areNotificationsEnabled();
  
  // Show mining reward notification
  AndroidNotification.showMiningRewardNotification(50.5, 3, '/mining');
  
  // Show chat message notification
  AndroidNotification.showChatMessageNotification('John', 'Hello there!', '/chat');
  
  // Show system notification
  AndroidNotification.showSystemNotification('Update Available', 'A new version is ready to install', '/settings');
}
```

Available methods:

- `requestNotificationPermission(callback)`: Request notification permission from the user
- `areNotificationsEnabled()`: Check if notifications are enabled
- `showMiningRewardNotification(amount, streakDay, deepLink)`: Show a mining reward notification
- `showChatMessageNotification(sender, message, deepLink)`: Show a chat message notification
- `showSystemNotification(title, message, deepLink)`: Show a general system notification

### 3. FirebaseNotification Interface 

Interface for Firebase Cloud Messaging:

```javascript
// Check if Firebase interface is available
if (typeof FirebaseNotification !== 'undefined') {
  // Get Firebase token
  const token = FirebaseNotification.getFirebaseToken();
  
  // Register for push notifications with the server
  FirebaseNotification.registerForPushNotifications(token, userId, function(success, error) {
    if (success) {
      console.log('Successfully registered for push notifications');
    } else {
      console.error('Failed to register for push notifications:', error);
    }
  });
  
  // Unregister from push notifications
  FirebaseNotification.unregisterFromPushNotifications(function(success, error) {
    if (success) {
      console.log('Successfully unregistered from push notifications');
    } else {
      console.error('Failed to unregister from push notifications:', error);
    }
  });
}
```

Available methods:

- `getFirebaseToken()`: Get the device's Firebase Cloud Messaging token
- `registerForPushNotifications(token, userId, callback)`: Register the token with the server
- `unregisterFromPushNotifications(callback)`: Unregister from push notifications

## Folder Structure

- `java/com/tskplatform/app/`: Java source files
  - `MainActivity.java`: Main activity with WebView
  - `SplashActivity.java`: Splash screen activity
  - `TSKPlatformApp.java`: Application class
  - `WebAppInterface.java`: JavaScript interface
  - `NotificationManager.java`: Notification management
  - `FirebaseTokenProvider.java`: Firebase token management
  - `TSKFirebaseMessagingService.java`: FCM service for push notifications
- `res/`: Resources
  - `drawable/`: Icons and images
  - `layout/`: Layout XML files
  - `values/`: Resource values (strings, colors, styles)
- `AndroidManifest.xml`: App manifest
- `google-services.json`: Firebase configuration