package com.tskplatform.app;

import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.webkit.WebStorage;

/**
 * Application class for TSK Platform
 * Handles application-wide settings and preferences
 */
public class TSKPlatformApp extends Application {
    private static final String PREFERENCES_NAME = "TSKPlatformPrefs";
    private static final String KEY_DARK_MODE = "dark_mode";
    private static final String KEY_LAST_LOGIN = "last_login";
    private static final String KEY_AUTH_TOKEN = "auth_token";
    
    private static TSKPlatformApp instance;
    private SharedPreferences sharedPreferences;
    
    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        sharedPreferences = getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }
    
    public static TSKPlatformApp getInstance() {
        return instance;
    }
    
    /**
     * Check if dark mode is enabled
     */
    public boolean isDarkModeEnabled() {
        return sharedPreferences.getBoolean(KEY_DARK_MODE, false);
    }
    
    /**
     * Set dark mode preference
     */
    public void setDarkMode(boolean enabled) {
        sharedPreferences.edit().putBoolean(KEY_DARK_MODE, enabled).apply();
    }
    
    /**
     * Store authentication token
     */
    public void setAuthToken(String token) {
        if (token == null || token.isEmpty()) {
            sharedPreferences.edit().remove(KEY_AUTH_TOKEN).apply();
        } else {
            sharedPreferences.edit().putString(KEY_AUTH_TOKEN, token).apply();
            // Update last login time when setting a valid token
            setLastLoginTime(System.currentTimeMillis());
        }
    }
    
    /**
     * Get stored authentication token
     */
    public String getAuthToken() {
        return sharedPreferences.getString(KEY_AUTH_TOKEN, null);
    }
    
    /**
     * Set the last login timestamp
     */
    public void setLastLoginTime(long timestamp) {
        sharedPreferences.edit().putLong(KEY_LAST_LOGIN, timestamp).apply();
    }
    
    /**
     * Get the last login timestamp
     */
    public long getLastLoginTime() {
        return sharedPreferences.getLong(KEY_LAST_LOGIN, 0);
    }
    
    /**
     * Clear all app data (used when logging out)
     */
    public void clearAppData() {
        // Clear preferences
        sharedPreferences.edit().clear().apply();
        
        // Clear web storage
        WebStorage.getInstance().deleteAllData();
        
        // Clear cookies (requires additional implementation in MainActivity)
    }
    
    /**
     * Get device information for debugging
     */
    public String getDeviceInfo() {
        return "Model: " + Build.MODEL + 
               ", Android: " + Build.VERSION.RELEASE + 
               ", SDK: " + Build.VERSION.SDK_INT;
    }
}