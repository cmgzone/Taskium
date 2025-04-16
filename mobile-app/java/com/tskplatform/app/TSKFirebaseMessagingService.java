package com.tskplatform.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;
import java.util.Random;

/**
 * Firebase Cloud Messaging Service that handles incoming push notifications
 */
public class TSKFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "FCMService";
    
    // Notification channel IDs
    private static final String CHANNEL_ID_MINING = "tsk_mining";
    private static final String CHANNEL_ID_CHAT = "tsk_chat";
    private static final String CHANNEL_ID_ALERTS = "tsk_alerts";
    
    @Override
    public void onNewToken(@NonNull String token) {
        Log.d(TAG, "Refreshed FCM token: " + token);
        
        // Store the new token
        // This is mainly to handle background token refreshes when app is not actively running
        // We'll store it in SharedPreferences so it can be retrieved when the app launches
        try {
            getApplicationContext()
                .getSharedPreferences("tsk_firebase_prefs", Context.MODE_PRIVATE)
                .edit()
                .putString("firebase_token", token)
                .putLong("token_timestamp", System.currentTimeMillis())
                .apply();
            
            Log.d(TAG, "Saved new FCM token to SharedPreferences");
        } catch (Exception e) {
            Log.e(TAG, "Error saving token to SharedPreferences", e);
        }
    }
    
    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Log.d(TAG, "From: " + remoteMessage.getFrom());
        
        // Check if message contains a data payload
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
            
            // Handle the data payload
            handleDataMessage(remoteMessage.getData());
        }
        
        // Check if message contains a notification payload
        if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "Message Notification Body: " + remoteMessage.getNotification().getBody());
            
            // Handle the notification payload
            handleNotificationMessage(remoteMessage);
        }
    }
    
    /**
     * Handle data payload notifications
     */
    private void handleDataMessage(Map<String, String> data) {
        try {
            String type = data.get("type");
            String title = data.get("title");
            String body = data.get("message") != null ? data.get("message") : data.get("body");
            String deepLink = data.get("deepLink");
            
            // Send a broadcast to the app if it's in the foreground
            Intent intent = new Intent("com.tskplatform.app.FCM_MESSAGE");
            intent.putExtra("type", type);
            intent.putExtra("title", title);
            intent.putExtra("message", body);
            intent.putExtra("deepLink", deepLink);
            
            // Add any additional data based on message type
            if ("mining".equals(type)) {
                String amount = data.get("amount");
                String streakDay = data.get("streakDay");
                intent.putExtra("amount", amount);
                intent.putExtra("streakDay", streakDay);
                
                // Show a notification for mining rewards
                showMiningNotification(title, body, deepLink, amount, streakDay);
            } else if ("chat".equals(type)) {
                String sender = data.get("sender");
                intent.putExtra("sender", sender);
                
                // Show a notification for chat messages
                showChatNotification(sender, body, deepLink);
            } else {
                // Show a general notification for other types
                showGeneralNotification(title, body, deepLink);
            }
            
            sendBroadcast(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error handling data message", e);
        }
    }
    
    /**
     * Handle notification payload notifications
     */
    private void handleNotificationMessage(RemoteMessage remoteMessage) {
        try {
            String title = remoteMessage.getNotification().getTitle();
            String body = remoteMessage.getNotification().getBody();
            String deepLink = "/";
            
            // Check if there's a data payload with a deep link
            if (remoteMessage.getData().containsKey("deepLink")) {
                deepLink = remoteMessage.getData().get("deepLink");
            }
            
            // Show a general notification
            showGeneralNotification(title, body, deepLink);
            
            // Send a broadcast to the app if it's in the foreground
            Intent intent = new Intent("com.tskplatform.app.FCM_MESSAGE");
            intent.putExtra("type", "general");
            intent.putExtra("title", title);
            intent.putExtra("message", body);
            intent.putExtra("deepLink", deepLink);
            sendBroadcast(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error handling notification message", e);
        }
    }
    
    /**
     * Show a mining reward notification
     */
    private void showMiningNotification(String title, String message, String deepLink, String amount, String streakDay) {
        // Use the mining channel for mining notifications
        showNotification(CHANNEL_ID_MINING, title, message, deepLink, R.drawable.ic_mining);
    }
    
    /**
     * Show a chat message notification
     */
    private void showChatNotification(String sender, String message, String deepLink) {
        String title = "Message from " + sender;
        
        // Use the chat channel for chat notifications
        showNotification(CHANNEL_ID_CHAT, title, message, deepLink, R.drawable.ic_chat);
    }
    
    /**
     * Show a general system notification
     */
    private void showGeneralNotification(String title, String message, String deepLink) {
        // Use the alerts channel for general notifications
        showNotification(CHANNEL_ID_ALERTS, title, message, deepLink, R.drawable.ic_notification);
    }
    
    /**
     * Show a notification with the given parameters
     */
    private void showNotification(String channelId, String title, String message, String deepLink, int iconResId) {
        try {
            Context context = getApplicationContext();
            
            // Ensure notification channels are created for Android O and above
            createNotificationChannels(context);
            
            // Validate parameters
            if (title == null || title.isEmpty()) {
                title = "TSK Platform";
            }
            
            if (message == null || message.isEmpty()) {
                message = "You have a new notification";
            }
            
            // Create an intent for when the notification is clicked
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            
            // Add the deep link if provided
            if (deepLink != null && !deepLink.isEmpty()) {
                intent.putExtra("deepLink", deepLink);
            }
            
            // Create a pending intent with a more reliable unique request code
            int requestCode = Math.abs(title.hashCode() + message.hashCode() + (int)System.currentTimeMillis());
            PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                requestCode,
                intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );
            
            // Get the notification sound
            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            
            // Build the notification with expanded text for longer messages
            NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, channelId)
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
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            
            if (notificationManager != null) {
                // Generate a unique notification ID based on content
                int notificationId = Math.abs(("tsk_fcm:" + channelId + ":" + title.hashCode() + ":" + System.currentTimeMillis()).hashCode());
                
                // Show the notification
                notificationManager.notify(notificationId, notificationBuilder.build());
                Log.d(TAG, "Successfully displayed notification: " + title);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error showing notification", e);
        }
    }
    
    /**
     * Create notification channels for Android 8.0+
     */
    private void createNotificationChannels(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            
            // Mining rewards channel
            NotificationChannel miningChannel = new NotificationChannel(
                CHANNEL_ID_MINING,
                "Mining Rewards",
                NotificationManager.IMPORTANCE_HIGH
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
                NotificationManager.IMPORTANCE_HIGH
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
                NotificationManager.IMPORTANCE_DEFAULT
            );
            alertsChannel.setDescription("General system notifications and alerts");
            alertsChannel.enableLights(true);
            alertsChannel.setLightColor(Color.RED);
            alertsChannel.enableVibration(true);
            notificationManager.createNotificationChannel(alertsChannel);
        }
    }
}