package com.hamidprojectapp.quran;

import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.geolocation.GeolocationPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(NativePickerPlugin.class);
        registerPlugin(QiblaCompassPlugin.class);
        registerPlugin(PrayerReminderPlugin.class);
        registerPlugin(GeolocationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
