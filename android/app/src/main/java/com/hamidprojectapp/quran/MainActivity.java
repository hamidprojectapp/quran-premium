package com.hamidprojectapp.quran;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(NativePickerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
