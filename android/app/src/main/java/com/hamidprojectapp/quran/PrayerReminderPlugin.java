package com.hamidprojectapp.quran;

import android.Manifest;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.PermissionState;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

@CapacitorPlugin(name = "PrayerReminder", permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) })
public class PrayerReminderPlugin extends Plugin {
    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) {
            call.resolve();
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        if (getPermissionState("notifications") == PermissionState.GRANTED) call.resolve();
        else call.reject("Izin notifikasi belum diberikan.");
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        JSONArray items = call.getArray("prayers");
        if (items == null) {
            call.reject("Daftar jadwal sholat tidak ditemukan.");
            return;
        }
        try {
            getContext().getSharedPreferences("prayer_reminders", Context.MODE_PRIVATE)
                .edit().putString("items", items.toString()).apply();
            int scheduled = 0;
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                PrayerAlarmReceiver.cancel(getContext(), item.optString("name", ""));
                if (!item.optBoolean("enabled", false)) continue;
                int hour = item.optInt("hour", -1);
                int minute = item.optInt("minute", -1);
                int lead = item.optInt("lead", 0);
                if (hour < 0 || hour > 23 || minute < 0 || minute > 59) continue;
                PrayerAlarmReceiver.schedule(getContext(), item.optString("name", "Sholat"), hour, minute, lead, item.optString("sound", "short"));
                scheduled++;
            }
            JSObject result = new JSObject();
            result.put("scheduled", scheduled);
            result.put("exactAlarmAllowed", Build.VERSION.SDK_INT < 31 || getContext().getSystemService(AlarmManager.class).canScheduleExactAlarms());
            result.put("notificationPermissionRequired", Build.VERSION.SDK_INT >= 33);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Gagal menjadwalkan pengingat sholat.", error);
        }
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 31) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        String raw = getContext().getSharedPreferences("prayer_reminders", Context.MODE_PRIVATE).getString("items", "[]");
        try {
            JSONArray items = new JSONArray(raw);
            for (int i = 0; i < items.length(); i++) PrayerAlarmReceiver.cancel(getContext(), items.getJSONObject(i).optString("name", ""));
        } catch (Exception ignored) {}
        getContext().getSharedPreferences("prayer_reminders", Context.MODE_PRIVATE).edit().remove("items").apply();
        call.resolve();
    }
}