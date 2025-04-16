package com.tskplatform.app;

import android.content.Context;
import android.util.Log;
import android.webkit.JavascriptInterface;

import androidx.annotation.NonNull;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.messaging.FirebaseMessaging;

import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.json.JSONObject;

/**
 * Handles the Firebase Cloud Messaging token generation and registration
 */
public class FirebaseTokenProvider {
    private static final String TAG = "FirebaseTokenProvider";
    private static final String API_ENDPOINT = "https://tskplatform.replit.app/api/notifications";
    
    private final Context context;
    private String firebaseToken = null;
    private final OkHttpClient httpClient;
    
    public FirebaseTokenProvider(Context context) {
        this.context = context;
        
        // Set up HTTP client with reasonable timeouts
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();
        
        // Check if we have a stored token in SharedPreferences first
        String savedToken = context.getSharedPreferences("tsk_firebase_prefs", Context.MODE_PRIVATE)
            .getString("firebase_token", null);
            
        if (savedToken != null && !savedToken.isEmpty()) {
            firebaseToken = savedToken;
            Log.d(TAG, "Retrieved token from SharedPreferences: " + firebaseToken.substring(0, Math.min(8, firebaseToken.length())) + "...");
        }
        
        // Request a fresh token anyway to ensure it's up-to-date
        refreshToken();
    }
    
    /**
     * Get the Firebase token - returns cached token if available or null if not yet ready
     */
    public String getToken() {
        return firebaseToken;
    }
    
    /**
     * Refresh the Firebase token by requesting a new one
     */
    public void refreshToken() {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(new OnCompleteListener<String>() {
                @Override
                public void onComplete(@NonNull Task<String> task) {
                    if (!task.isSuccessful()) {
                        Log.w(TAG, "Fetching FCM registration token failed", task.getException());
                        return;
                    }
                    
                    try {
                        // Get new FCM registration token
                        String token = task.getResult();
                        
                        // Check if token is different from current one
                        boolean isNewToken = firebaseToken == null || !firebaseToken.equals(token);
                        
                        // Update the token
                        firebaseToken = token;
                        
                        // Log first few characters of token for debugging
                        if (token != null && token.length() > 8) {
                            Log.d(TAG, "FCM Token: " + token.substring(0, 8) + "...");
                        } else {
                            Log.d(TAG, "FCM Token: " + token);
                        }
                        
                        // Save to SharedPreferences for persistence
                        context.getSharedPreferences("tsk_firebase_prefs", Context.MODE_PRIVATE)
                            .edit()
                            .putString("firebase_token", token)
                            .putLong("token_timestamp", System.currentTimeMillis())
                            .apply();
                        
                        Log.d(TAG, "Saved FCM token to SharedPreferences");
                        
                        // If this is a new token, we might want to auto-register it when 
                        // we know the user's ID (but we'll let the app handle this explicitly)
                    } catch (Exception e) {
                        Log.e(TAG, "Error processing FCM token", e);
                    }
                }
            });
    }
    
    /**
     * Delete the Firebase token
     */
    public void deleteToken() {
        // First remove from SharedPreferences
        try {
            context.getSharedPreferences("tsk_firebase_prefs", Context.MODE_PRIVATE)
                .edit()
                .remove("firebase_token")
                .remove("token_timestamp")
                .apply();
            
            Log.d(TAG, "Removed FCM token from SharedPreferences");
        } catch (Exception e) {
            Log.e(TAG, "Error removing token from SharedPreferences", e);
        }
        
        // Then delete from Firebase
        FirebaseMessaging.getInstance().deleteToken()
            .addOnCompleteListener(new OnCompleteListener<Void>() {
                @Override
                public void onComplete(@NonNull Task<Void> task) {
                    if (!task.isSuccessful()) {
                        Log.w(TAG, "Deleting FCM token failed", task.getException());
                        return;
                    }
                    
                    Log.d(TAG, "FCM token deleted from Firebase");
                    firebaseToken = null;
                }
            });
    }
    
    /**
     * Register the token with the server
     */
    private boolean registerWithServer(String token, int userId, String platform) {
        try {
            // Validate token
            if (token == null || token.isEmpty()) {
                Log.e(TAG, "Cannot register null or empty token");
                return false;
            }
            
            // Create JSON body for the request
            JSONObject requestBody = new JSONObject();
            requestBody.put("token", token);
            requestBody.put("userId", userId);
            requestBody.put("platform", platform);
            requestBody.put("deviceId", token.substring(0, Math.min(32, token.length())));
            requestBody.put("deviceName", Build.MANUFACTURER + " " + Build.MODEL);
            requestBody.put("appVersion", "1.0.0");
            
            // Build the request
            Request request = new Request.Builder()
                .url(API_ENDPOINT + "/register-device")
                .post(RequestBody.create(
                    MediaType.parse("application/json"),
                    requestBody.toString()
                ))
                .addHeader("Content-Type", "application/json")
                .build();
            
            // Log the request for debugging
            Log.d(TAG, "Sending token registration request to: " + API_ENDPOINT + "/register-device");
            Log.d(TAG, "Request body: " + requestBody.toString());
            
            // Execute the request
            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    Log.e(TAG, "Failed to register token with server: " + response.code());
                    // Get the response body for more detailed error info
                    String responseBody = response.body() != null ? response.body().string() : "No response body";
                    Log.e(TAG, "Server error response: " + responseBody);
                    return false;
                }
                
                Log.d(TAG, "Token registered successfully with server");
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error registering token with server", e);
            return false;
        }
    }
    
    /**
     * Unregister the token from the server
     */
    private boolean unregisterFromServer(String token) {
        try {
            // Create JSON body for the request
            JSONObject requestBody = new JSONObject();
            requestBody.put("token", token);
            requestBody.put("deviceId", token.substring(0, Math.min(32, token.length())));
            
            // Build the request
            Request request = new Request.Builder()
                .url(API_ENDPOINT + "/unregister-device")
                .post(RequestBody.create(
                    MediaType.parse("application/json"),
                    requestBody.toString()
                ))
                .addHeader("Content-Type", "application/json")
                .build();
            
            // Execute the request
            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    Log.e(TAG, "Failed to unregister token from server: " + response.code());
                    return false;
                }
                
                Log.d(TAG, "Token unregistered successfully from server");
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error unregistering token from server", e);
            return false;
        }
    }
    
    /**
     * JavaScript interface for Firebase token operations
     */
    public class TokenInterface {
        /**
         * Get the Firebase token (called from JavaScript)
         */
        @JavascriptInterface
        public String getFirebaseToken() {
            return firebaseToken;
        }
        
        /**
         * Register for push notifications (called from JavaScript)
         */
        @JavascriptInterface
        public void registerForPushNotifications(final String token, final int userId, final RegisterCallback callback) {
            // Run this in a background thread to avoid blocking the UI
            new Thread(() -> {
                boolean success = registerWithServer(token, userId, "android-firebase");
                
                // Callback on the main thread
                if (context instanceof MainActivity) {
                    final MainActivity activity = (MainActivity) context;
                    activity.runOnUiThread(() -> {
                        if (success) {
                            callback.onResult(true, null);
                        } else {
                            callback.onResult(false, "Failed to register with server");
                        }
                    });
                }
            }).start();
        }
        
        /**
         * Unregister from push notifications (called from JavaScript)
         */
        @JavascriptInterface
        public void unregisterFromPushNotifications(final RegisterCallback callback) {
            // Check if we have a token
            if (firebaseToken == null) {
                if (context instanceof MainActivity) {
                    final MainActivity activity = (MainActivity) context;
                    activity.runOnUiThread(() -> {
                        callback.onResult(false, "No token available");
                    });
                }
                return;
            }
            
            // Run this in a background thread to avoid blocking the UI
            new Thread(() -> {
                boolean success = unregisterFromServer(firebaseToken);
                
                // Also delete the token from Firebase
                deleteToken();
                
                // Callback on the main thread
                if (context instanceof MainActivity) {
                    final MainActivity activity = (MainActivity) context;
                    activity.runOnUiThread(() -> {
                        if (success) {
                            callback.onResult(true, null);
                        } else {
                            callback.onResult(false, "Failed to unregister from server");
                        }
                    });
                }
            }).start();
        }
    }
    
    /**
     * Callback interface for registration operations
     */
    public interface RegisterCallback {
        @JavascriptInterface
        void onResult(boolean success, String error);
    }
}