package com.tskplatform.app;

import android.app.NotificationChannel;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.webkit.JavascriptInterface;

import androidx.core.app.NotificationCompat;

/**
 * Manages notifications for the TSK Platform app
 * Provides a JavaScript interface for creating and displaying notifications
 */
public class NotificationManager {
    private static final String TAG = "NotificationManager";
    
    // Notification channel IDs
    private static final String CHANNEL_ID_MINING = "tsk_mining";
    private static final String CHANNEL_ID_CHAT = "tsk_chat";
    private static final String CHANNEL_ID_ALERTS = "tsk_alerts";
    
    private final Context context;
    
    public NotificationManager(Context context) {
        this.context = context;
        createNotificationChannels();
    }
    
    /**
     * Create the notification channels (required for Android 8.0+)
     */
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            android.app.NotificationManager notificationManager = 
                (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            
            // Mining rewards channel
            NotificationChannel miningChannel = new NotificationChannel(
                CHANNEL_ID_MINING,
                "Mining Rewards",
                android.app.NotificationManager.IMPORTANCE_HIGH
            );
            miningChannel.setDescription("Notifications for TSK mining rewards");
            miningChannel.enableLights(true);
            miningChannel.setLightColor(Color.BLUE);
            miningChannel.enableVibration(true);
            notificationManager.createNotificationChannel(miningChannel);
            
            // Chat messages channel
            NotificationChannel chatChannel = new NotificationChannel(
                CHANNEL_ID_CHAT,
                "Chat Messages",
                android.app.NotificationManager.IMPORTANCE_HIGH
            );
            chatChannel.setDescription("Notifications for chat messages");
            chatChannel.enableLights(true);
            chatChannel.setLightColor(Color.GREEN);
            chatChannel.enableVibration(true);
            notificationManager.createNotificationChannel(chatChannel);
            
            // General alerts channel
            NotificationChannel alertsChannel = new NotificationChannel(
                CHANNEL_ID_ALERTS,
                "General Alerts",
                android.app.NotificationManager.IMPORTANCE_DEFAULT
            );
            alertsChannel.setDescription("General system notifications and alerts");
            alertsChannel.enableLights(true);
            alertsChannel.setLightColor(Color.RED);
            alertsChannel.enableVibration(true);
            notificationManager.createNotificationChannel(alertsChannel);
        }
    }
    
    /**
     * JavaScript interface for notifications
     */
    public class NotificationInterface {
        /**
         * Check if notifications are enabled for the app
         */
        @JavascriptInterface
        public boolean areNotificationsEnabled() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                android.app.NotificationManager notificationManager = 
                    (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                return notificationManager.areNotificationsEnabled();
            } else {
                // On older Android versions, assume notifications are enabled
                return true;
            }
        }
        
        /**
         * Request notification permission
         * On Android 13+ this will prompt the user for permission
         * On older versions, this will always return true
         */
        @JavascriptInterface
        public void requestNotificationPermission(final NotificationCallback callback) {
            if (Build.VERSION.SDK_INT >= 33) { // Android 13 (TIRAMISU)
                // Request permission directly
                // This requires using an Activity to request the permission
                if (context instanceof MainActivity) {
                    final MainActivity activity = (MainActivity) context;
                    activity.requestNotificationPermission(new MainActivity.PermissionCallback() {
                        @Override
                        public void onResult(boolean granted) {
                            callback.onResult(granted);
                        }
                    });
                } else {
                    // Not an activity context, so we can't request permission
                    callback.onResult(false);
                }
            } else {
                // For older Android versions, just check if notifications are enabled
                callback.onResult(areNotificationsEnabled());
            }
        }
        
        /**
         * Show a mining reward notification
         */
        @JavascriptInterface
        public void showMiningRewardNotification(double amount, int streakDay, String deepLink) {
            String title = "Mining Reward";
            String message;
            
            if (streakDay > 0) {
                message = "You've earned " + amount + " TSK (Day " + streakDay + " streak bonus)";
            } else {
                message = "You've earned " + amount + " TSK";
            }
            
            showNotification(CHANNEL_ID_MINING, title, message, deepLink, R.drawable.ic_mining);
        }
        
        /**
         * Show a chat message notification
         */
        @JavascriptInterface
        public void showChatMessageNotification(String sender, String message, String deepLink) {
            String title = "Message from " + sender;
            showNotification(CHANNEL_ID_CHAT, title, message, deepLink, R.drawable.ic_chat);
        }
        
        /**
         * Show a system notification
         */
        @JavascriptInterface
        public void showSystemNotification(String title, String message, String deepLink) {
            showNotification(CHANNEL_ID_ALERTS, title, message, deepLink, R.drawable.ic_notification);
        }
    }
    
    /**
     * Show a notification with the specified parameters
     */
    private void showNotification(String channelId, String title, String message, String deepLink, int iconResId) {
        try {
            // Ensure notification channels are created for Android O and above
            createNotificationChannels();
            
            // Validate parameters
            if (title == null || title.isEmpty()) {
                title = "TSK Platform";
            }
            
            if (message == null || message.isEmpty()) {
                message = "You have a new notification";
            }
            
            // Create an intent for the notification click
            Intent intent = new Intent(context, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            
            // Add the deep link if provided
            if (deepLink != null && !deepLink.isEmpty()) {
                intent.putExtra("deepLink", deepLink);
            }
            
            // Create a PendingIntent with unique request code
            int requestCode = Math.abs((int) System.currentTimeMillis());
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );
            
            // Get default notification sound
            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            
            // Build the notification with expanded text style for longer messages
            NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(iconResId)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setAutoCancel(true)
                .setSound(defaultSoundUri)
                .setVibrate(new long[]{0, 300, 200, 300})
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH);
            
            // Get the notification manager
            android.app.NotificationManager notificationManager = 
                (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            
            if (notificationManager != null) {
                // Generate a unique notification ID based on timestamp and message hash
                int notificationId = Math.abs(("tsk:" + channelId + ":" + title.hashCode() + ":" + System.currentTimeMillis()).hashCode());
                
                // Show the notification
                notificationManager.notify(notificationId, notificationBuilder.build());
            }
        } catch (Exception e) {
            android.util.Log.e("NotificationManager", "Error showing notification", e);
        }
    }
    
    /**
     * Callback interface for notification permission
     */
    public interface NotificationCallback {
        @JavascriptInterface
        void onResult(boolean granted);
    }
}