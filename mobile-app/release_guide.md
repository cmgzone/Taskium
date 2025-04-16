# TSK Platform App Release Guide

This guide explains how to prepare and generate a signed release version of the TSK Platform app for Google Play Store submission.

## Prerequisites

1. Android Studio installed
2. The TSK Platform Android project opened in Android Studio
3. A Google Play Developer account (requires $25 one-time registration fee)

## Step 1: Update the App Version

Before generating a release build, update the version information in your app's `build.gradle` file:

```gradle
android {
    defaultConfig {
        applicationId "com.tskplatform.app"
        minSdkVersion 23
        targetSdkVersion 33
        versionCode 1  // Increment this for each release
        versionName "1.0.0"  // Update semantic version
    }
}
```

## Step 2: Generate a Signing Key

1. In Android Studio, select **Build** > **Generate Signed Bundle / APK**
2. Select **Android App Bundle** or **APK** (AAB is preferred by Google Play)
3. Click **Create new...**
4. Fill in the key store details:
   - Key store path: Choose a secure location (e.g., `tsk_platform_keystore.jks`)
   - Password: Create a strong password
   - Key alias: `tsk_platform_key`
   - Key password: Create a strong password (can be same as keystore password)
   - Certificate validity: 25+ years recommended
   - Organization details: Your company information
5. Click **OK** to generate the keystore

**IMPORTANT:** Store the keystore file and passwords securely. If you lose them, you won't be able to update your app on Google Play in the future.

## Step 3: Generate the Signed Bundle/APK

1. Still in the "Generate Signed Bundle or APK" dialog, select the keystore you just created
2. Enter the keystore password and key password
3. Select a destination folder for the release build
4. Click **Finish**
5. Select the **release** build variant
6. Click **Create**

## Step 4: Verify the Release Build

Before uploading to Google Play:

1. Install the release build on a test device
2. Verify all features work as expected
3. Check for any performance issues or crashes
4. Test on multiple device sizes if possible

## Step 5: Prepare Store Listing Content

Use the content in `mobile-app/store_assets/store_listing.md` to fill in your Google Play Console listing:

1. App name: "TSK Platform"
2. Short description
3. Full description
4. App category: Finance
5. Content rating
6. Upload all graphic assets from the `mobile-app/store_assets/` directory

## Step 6: Submit for Review

In the Google Play Console:

1. Upload your signed AAB/APK file
2. Complete all required metadata
3. Add release notes
4. Set pricing and availability
5. Complete the content rating questionnaire
6. Provide your privacy policy URL
7. Submit for review

## Important Notes

- Your app will be reviewed by Google before it's published
- Review typically takes 1-3 days
- Address any policy violations if your app is rejected
- Set up app signing by Google for enhanced security

## Keystore Backup Strategy

Create a secure backup of:
1. The keystore file (.jks)
2. The keystore password
3. The key alias
4. The key password

Store these in at least two secure locations, such as:
- A password manager
- An encrypted USB drive kept in a safe place
- A secure cloud storage service

This backup is **critical** since losing the keystore means losing the ability to update your app in the future.