package com.tskplatform.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.annotation.NonNull;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * WebAppInterface provides a bridge between JavaScript and Android native code
 * This allows the web application to access device-specific functionality
 */
public class WebAppInterface {
    private final Context context;
    private final MainActivity activity;

    public WebAppInterface(Context context, MainActivity activity) {
        this.context = context;
        this.activity = activity;
    }

    /**
     * Show a toast message
     */
    @JavascriptInterface
    public void showToast(String message) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }

    /**
     * Get device information
     */
    @JavascriptInterface
    public String getDeviceInfo() {
        return TSKPlatformApp.getInstance().getDeviceInfo();
    }

    /**
     * Trigger device vibration
     */
    @JavascriptInterface
    public void vibrate(int milliseconds) {
        Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE));
        } else {
            vibrator.vibrate(milliseconds);
        }
    }

    /**
     * Open external URL in browser
     */
    @JavascriptInterface
    public void openExternalUrl(@NonNull String url) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        context.startActivity(intent);
    }

    /**
     * Get authentication token from device storage
     */
    @JavascriptInterface
    public String getAuthToken() {
        return TSKPlatformApp.getInstance().getAuthToken();
    }

    /**
     * Store authentication token in device storage
     */
    @JavascriptInterface
    public void setAuthToken(String token) {
        TSKPlatformApp.getInstance().setAuthToken(token);
    }

    /**
     * Clear app data (logout)
     */
    @JavascriptInterface
    public void clearAppData() {
        TSKPlatformApp.getInstance().clearAppData();
    }

    /**
     * Get app's dark mode preference
     */
    @JavascriptInterface
    public boolean isDarkModeEnabled() {
        return TSKPlatformApp.getInstance().isDarkModeEnabled();
    }

    /**
     * Set app's dark mode preference
     */
    @JavascriptInterface
    public void setDarkMode(boolean enabled) {
        TSKPlatformApp.getInstance().setDarkMode(enabled);
    }

    /**
     * Share content using device's share functionality
     */
    @JavascriptInterface
    public void shareContent(String title, String text, String url) {
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
        
        String shareText = text;
        if (url != null && !url.isEmpty()) {
            shareText += "\n" + url;
        }
        
        shareIntent.putExtra(Intent.EXTRA_TEXT, shareText);
        context.startActivity(Intent.createChooser(shareIntent, "Share via"));
    }

    /**
     * Returns network connection type
     */
    @JavascriptInterface
    public String getConnectionType() {
        return activity.getConnectionType();
    }
}