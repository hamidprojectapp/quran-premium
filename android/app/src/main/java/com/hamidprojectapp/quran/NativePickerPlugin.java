package com.hamidprojectapp.quran;

import android.app.AlertDialog;
import android.content.DialogInterface;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativePicker")
public class NativePickerPlugin extends Plugin {
    @PluginMethod
    public void show(PluginCall call) {
        JSArray options = call.getArray("options");
        String title = call.getString("title", "Pilih");
        int selectedIndex = call.getInt("selectedIndex", 0);

        if (options == null || options.length() == 0) {
            call.reject("Pilihan tidak tersedia.");
            return;
        }

        final CharSequence[] labels = new CharSequence[options.length()];
        try {
            for (int i = 0; i < options.length(); i++) {
                labels[i] = options.getString(i);
            }
        } catch (Exception error) {
            call.reject("Daftar pilihan tidak valid.", error);
            return;
        }

        getActivity().runOnUiThread(() -> {
            AlertDialog dialog = new AlertDialog.Builder(getActivity())
                .setTitle(title)
                .setSingleChoiceItems(labels, selectedIndex, (shown, which) -> {
                    JSObject result = new JSObject();
                    result.put("index", which);
                    result.put("cancelled", false);
                    call.resolve(result);
                    shown.dismiss();
                })
                .setNegativeButton("Batal", (shown, which) -> {
                    JSObject result = new JSObject();
                    result.put("cancelled", true);
                    call.resolve(result);
                })
                .create();

            dialog.setOnCancelListener(shown -> {
                JSObject result = new JSObject();
                result.put("cancelled", true);
                call.resolve(result);
            });
            dialog.show();
        });
    }
}
