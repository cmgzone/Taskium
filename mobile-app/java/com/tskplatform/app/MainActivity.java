package com.tskplatform.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.firebase.messaging.FirebaseMessaging;

/**
 * Main activity for the TSK Platform Android app
 * Contains a WebView that loads the web app and JavaScript interfaces for native functionality
 */
public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";
    private static final String WEB_APP_URL = "https://tskplatform.replit.app/";
    private static final String APP_HOST = "tskplatform.replit.app";
    private static final String[] ALLOWED_HOSTS = {"tskplatform.replit.app", "replit.app"};
    
    private WebView webView;
    private ProgressBar progressBar;
    private SwipeRefreshLayout swipeRefreshLayout;
    private boolean isPageLoaded = false;
    private String pendingDeepLink = null;
    
    // Notification components
    private NotificationManager notificationManager;
    private FirebaseTokenProvider firebaseTokenProvider;
    private ActivityResultLauncher<String> requestPermissionLauncher;
    private PermissionCallback pendingPermissionCallback;
    
    // BroadcastReceiver for FCM messages
    private BroadcastReceiver fcmBroadcastReceiver;
    
    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Initialize components
        webView = findViewById(R.id.webview);
        progressBar = findViewById(R.id.progressBar);
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        
        // Configure WebView
        configureWebView();
        
        // Pull to refresh functionality
        swipeRefreshLayout.setOnRefreshListener(() -> {
            webView.reload();
        });
        
        // Initialize notification components
        initializeNotifications();
        
        // Handle intent for deep linking
        handleIntent(getIntent());
    }
    
    /**
     * Configure the WebView settings
     */
    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setAllowFileAccess(true);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // Add JavaScript interfaces
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");
        
        // Set WebViewClient with improved external link handling
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
                isPageLoaded = false;
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                swipeRefreshLayout.setRefreshing(false);
                isPageLoaded = true;
                
                // Process any pending deep link
                if (pendingDeepLink != null) {
                    navigateToDeepLink(pendingDeepLink);
                    pendingDeepLink = null;
                }
            }
            
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                
                // Check if this URL is a special scheme that should always be opened externally without confirmation
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("sms:")) {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true; // Indicate we handled the URL
                }
                
                // Check if this is an external URL that should be opened in a browser
                if (shouldOpenInExternalBrowser(url)) {
                    // Show confirmation dialog for external URLs
                    showExternalLinkConfirmationDialog(url);
                    return true; // Indicate we handled the URL
                }
                
                // Normal navigation within our domain
                return false; // Let WebView handle the URL
            }
            
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    progressBar.setVisibility(View.GONE);
                    swipeRefreshLayout.setRefreshing(false);
                    
                    // Show offline page or error message
                    showErrorPage();
                }
            }
        });
        
        // Load the web app
        webView.loadUrl(WEB_APP_URL);
    }
    
    /**
     * Initialize notification components
     */
    private void initializeNotifications() {
        // Create notification manager and add its interface to WebView
        notificationManager = new NotificationManager(this);
        webView.addJavascriptInterface(notificationManager.new NotificationInterface(), "AndroidNotification");
        
        // Create Firebase token provider and add its interface to WebView
        firebaseTokenProvider = new FirebaseTokenProvider(this);
        webView.addJavascriptInterface(firebaseTokenProvider.new TokenInterface(), "FirebaseNotification");
        
        // Initialize permission launcher for notification permissions
        requestPermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            isGranted -> {
                if (pendingPermissionCallback != null) {
                    pendingPermissionCallback.onResult(isGranted);
                    pendingPermissionCallback = null;
                }
            }
        );
        
        // Register receiver for FCM messages
        fcmBroadcastReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String type = intent.getStringExtra("type");
                String title = intent.getStringExtra("title");
                String message = intent.getStringExtra("message");
                String deepLink = intent.getStringExtra("deepLink");
                
                // If the app is in the foreground, pass the notification to JavaScript
                if (isPageLoaded) {
                    String js = "if (window.handlePushNotification) { window.handlePushNotification('" +
                        type + "', '" + escapeJsString(title) + "', '" + escapeJsString(message) + 
                        "', '" + escapeJsString(deepLink) + "'); }";
                    webView.evaluateJavascript(js, null);
                }
            }
        };
        
        // Register the receiver
        registerReceiver(fcmBroadcastReceiver, new IntentFilter("com.tskplatform.app.FCM_MESSAGE"));
    }
    
    /**
     * Request notification permission
     */
    public void requestNotificationPermission(PermissionCallback callback) {
        if (Build.VERSION.SDK_INT >= 33) { // Android 13 (TIRAMISU)
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) 
                == PackageManager.PERMISSION_GRANTED) {
                // Permission already granted
                callback.onResult(true);
            } else {
                // Request permission
                pendingPermissionCallback = callback;
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
            }
        } else {
            // For older Android versions, permission is granted at install time
            callback.onResult(true);
        }
    }
    
    /**
     * Handle new intents for deep linking
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }
    
    /**
     * Handle the intent for deep linking
     */
    private void handleIntent(Intent intent) {
        if (intent != null) {
            // Check for deep link from notification
            String deepLink = intent.getStringExtra("deepLink");
            if (deepLink != null) {
                if (isPageLoaded) {
                    navigateToDeepLink(deepLink);
                } else {
                    pendingDeepLink = deepLink;
                }
            }
        }
    }
    
    /**
     * Navigate to a deep link in the WebView
     */
    private void navigateToDeepLink(String deepLink) {
        // Make sure the deepLink starts with a slash
        if (!deepLink.startsWith("/")) {
            deepLink = "/" + deepLink;
        }
        
        // Use JavaScript to navigate to the deep link
        String js = "if (window.location.pathname !== '" + escapeJsString(deepLink) + "') { " +
                    "window.location.href = '" + escapeJsString(deepLink) + "'; }";
        webView.evaluateJavascript(js, null);
    }
    
    /**
     * Show an error page when offline or other errors
     */
    private void showErrorPage() {
        String errorHtml = "<html><body style='text-align:center;padding-top:50px;'>" +
                "<h1>Connection Error</h1>" +
                "<p>Please check your internet connection and try again.</p>" +
                "<button onclick='window.location.reload();'>Retry</button>" +
                "</body></html>";
        webView.loadData(errorHtml, "text/html", "UTF-8");
    }
    
    /**
     * Handle back button presses
     */
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    /**
     * Clean up resources when the activity is destroyed
     */
    @Override
    protected void onDestroy() {
        super.onDestroy();
        
        // Unregister the FCM broadcast receiver
        if (fcmBroadcastReceiver != null) {
            unregisterReceiver(fcmBroadcastReceiver);
        }
    }
    
    /**
     * Show a confirmation dialog for external links
     *
     * @param url The external URL that will be opened
     */
    private void showExternalLinkConfirmationDialog(String url) {
        String displayUrl = url;
        try {
            // For cleaner display, only show the host if available
            Uri uri = Uri.parse(url);
            if (uri.getHost() != null) {
                displayUrl = uri.getHost();
                // Add the path if it exists and it's not just "/"
                if (uri.getPath() != null && !uri.getPath().equals("/")) {
                    displayUrl += uri.getPath();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing URL for display: " + url, e);
        }
        
        // Create a confirmation dialog
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Leave the App?");
        builder.setMessage("You're about to leave the TSK Platform app and open:\n\n" + displayUrl);
        
        // Add the buttons
        builder.setPositiveButton("Open", (dialog, which) -> {
            // User confirmed, open the URL in external browser
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        });
        builder.setNegativeButton("Cancel", (dialog, which) -> {
            // User cancelled, do nothing
            dialog.dismiss();
        });
        
        // Create and show the AlertDialog
        AlertDialog dialog = builder.create();
        dialog.show();
    }
    
    /**
     * Determines if a URL should be opened in an external browser
     * 
     * @param url The URL to check
     * @return true if the URL should be opened in an external browser, false otherwise
     */
    private boolean shouldOpenInExternalBrowser(String url) {
        if (url == null || url.isEmpty()) {
            return false;
        }
        
        try {
            Uri uri = Uri.parse(url);
            String host = uri.getHost();
            
            // If there's no host, it's likely a relative URL, so keep it in the WebView
            if (host == null) {
                return false;
            }
            
            // Check if this URL is a special link type that should always be external
            String scheme = uri.getScheme();
            if (scheme != null) {
                // Special schemes like tel:, mailto:, etc. should be handled by the system
                if (isSpecialScheme(scheme)) {
                    Log.d(TAG, "Opening special scheme URL: " + url);
                    return true;
                }
                
                // Other non-HTTP(S) schemes should also be handled externally
                if (!scheme.equals("http") && !scheme.equals("https")) {
                    Log.d(TAG, "Opening external URL (non-HTTP scheme): " + url);
                    return true;
                }
                
                // Check for specific URLs that should be opened externally
                if (isExternalServiceUrl(host)) {
                    Log.d(TAG, "Opening external service URL: " + url);
                    return true;
                }
                
                // Check if URL is our app domain or allowed subdomains
                for (String allowedHost : ALLOWED_HOSTS) {
                    if (host.equals(allowedHost) || host.endsWith("." + allowedHost)) {
                        // This is our app domain or a subdomain, so keep it in WebView
                        return false;
                    }
                }
                
                // If we reach here, it's not our domain or subdomain, so open externally
                Log.d(TAG, "Opening external URL (different domain): " + url);
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing URL: " + url, e);
        }
        
        // Default case: keep it in the WebView
        return false;
    }
    
    /**
     * Check if a URL scheme is a special scheme that should be handled by the system
     */
    private boolean isSpecialScheme(String scheme) {
        if (scheme == null) {
            return false;
        }
        
        // List of special URL schemes that should be handled by the system
        String[] specialSchemes = {
            "tel", "mailto", "sms", "smsto", "mms", "mmsto",
            "geo", "google.navigation", "market", "intent",
            "whatsapp", "telegram", "line", "viber", "tg",
            "bitcoin", "ethereum",
            "maps", // for Google Maps
            "spotify", "youtube", "vnd.youtube"
        };
        
        for (String specialScheme : specialSchemes) {
            if (scheme.equalsIgnoreCase(specialScheme)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if a URL host is for an external service that should be opened in a browser
     */
    private boolean isExternalServiceUrl(String host) {
        // List of external services that should always open in browser/external app
        String[] externalServices = {
            "twitter.com", "www.twitter.com", "x.com", "www.x.com",
            "facebook.com", "www.facebook.com", "fb.com", "www.fb.com",
            "instagram.com", "www.instagram.com",
            "linkedin.com", "www.linkedin.com",
            "youtube.com", "www.youtube.com", "youtu.be",
            "medium.com", "www.medium.com",
            "github.com", "www.github.com",
            "play.google.com", "apps.apple.com",
            "docs.google.com", "drive.google.com", "sheets.google.com", "slides.google.com"
        };
        
        for (String service : externalServices) {
            if (host.equals(service)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Escape a string for use in JavaScript
     */
    private String escapeJsString(String str) {
        if (str == null) {
            return "";
        }
        return str.replace("'", "\\'").replace("\n", "\\n");
    }
    
    /**
     * Callback interface for permission requests
     */
    public interface PermissionCallback {
        void onResult(boolean granted);
    }
}