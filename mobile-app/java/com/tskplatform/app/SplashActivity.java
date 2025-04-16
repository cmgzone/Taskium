package com.tskplatform.app;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.appcompat.app.AppCompatActivity;

/**
 * SplashActivity is the entry point of the application
 * It displays a splash screen for a short duration before launching MainActivity
 */
public class SplashActivity extends AppCompatActivity {
    private static final int SPLASH_DURATION = 1500; // 1.5 seconds

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // No need to set content view as we're using a theme with a splash background
        // defined in styles.xml as @style/SplashTheme
        
        // Post a delayed handler to launch the main activity
        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                // Create an intent to start MainActivity
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                
                // Pass any received intent extras
                if (getIntent() != null && getIntent().getExtras() != null) {
                    intent.putExtras(getIntent().getExtras());
                }
                
                // If we were launched from a deep link, pass the data
                if (getIntent() != null && getIntent().getData() != null) {
                    intent.setData(getIntent().getData());
                }
                
                startActivity(intent);
                
                // Apply a fade transition
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
                
                // Close the splash activity
                finish();
            }
        }, SPLASH_DURATION);
    }
}