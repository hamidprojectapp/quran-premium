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

@CapacitorPlugin(name = "PrayerReminder", permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) })
public class PrayerReminderPlugin extends Plugin {
    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) {
            call.resolve(); return;
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
        JSONArray events = call.getArray("events");
        if (events == null) { call.reject("Daftar alarm bertanggal tidak ditemukan."); return; }
        try {
            Context context = getContext();
            String old = context.getSharedPreferences("prayer_reminders", Context.MODE_PRIVATE).getString("events", "[]");
            JSONArray previous = new JSONArray(old);
            for (int i = 0; i < previous.length(); i++) PrayerAlarmReceiver.cancel(context, previous.getJSONObject(i).optString("id", ""));
            String legacy = context.getSharedPreferences("prayer_reminders", Context.MODE_PRIVATE).getString("items", "[]");
            JSONArray oldItems = new JSONArray(legacy);
            for (int i = 0; i < oldItems.length(); i++) PrayerAlarmReceiver.cancelLegacy(context, oldItems.getJSONObject(i).optString("name", ""));
            int scheduled = 0;
            JSONArray future = new JSONArray();
            long now = System.currentTimeMillis();
            for (int i = 0; i < events.length(); i++) {
                JSONObject event = events.getJSONObject(i);
                if (!event.optBoolean("enabled", true)) continue;
                long at = event.optLong("at", 0L);
                if (at <= now) continue;
                PrayerAlarmReceiver.scheduleAt(context, event);
                future.put(event);
                scheduled++;
            }
            context.getSharedPreferences("prayer_reminders", Context.MODE_PRIVATE).edit().putString("events", future.toString()).remove("items").apply();
            JSObject result = new JSObject();
            result.put("scheduled", scheduled);
            result.put("exactAlarmAllowed", Build.VERSION.SDK_INT < 31 || context.getSystemService(AlarmManager.class).canScheduleExactAlarms());
            result.put("notificationPermissionRequired", Build.VERSION.SDK_INT >= 33);
            call.resolve(result);
        } catch (Exception error) { call.reject("Gagal menjadwalkan pengingat sholat.", error); }
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 31) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void testAdhan(PluginCall call) {
        String sound = call.getString("sound", "adhan");
        Intent intent = new Intent(getContext(), AdhanPlaybackService.class);
        intent.setAction(AdhanPlaybackService.ACTION_PLAY);
        intent.putExtra(AdhanPlaybackService.EXTRA_SOUND, sound);
        intent.putExtra(AdhanPlaybackService.EXTRA_PRAYER, "Tes suara");
        try {
            if (Build.VERSION.SDK_INT >= 26) getContext().startForegroundService(intent);
            else getContext().startService(intent);
            call.resolve();
        } catch (Exception error) { call.reject("Tidak dapat memulai tes suara adzan.", error); }
    }

    @PluginMethod
    public void stopAdhan(PluginCall call) {
        Intent intent = new Intent(getContext(), AdhanPlaybackService.class);
        intent.setAction(AdhanPlaybackService.ACTION_STOP);
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        Context context = getContext();
        String raw = context.getSharedPreferences("prayer_reminders", Context.MODE_PRIVATE).getString("events", "[]");
        try {
            JSONArray events = new JSONArray(raw);
            for (int i = 0; i < events.length(); i++) PrayerAlarmReceiver.cancel(context, events.getJSONObject(i).optString("id", ""));
        } catch (Exception ignored) {}
        context.getSharedPreferences("prayer_reminders", Context.MODE_PRIVATE).edit().remove("events").apply();
        Intent stop = new Intent(context, AdhanPlaybackService.class);
        stop.setAction(AdhanPlaybackService.ACTION_STOP);
        context.startService(stop);
        call.resolve();
    }
}