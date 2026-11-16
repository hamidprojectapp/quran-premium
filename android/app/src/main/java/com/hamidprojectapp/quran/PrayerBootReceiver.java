package com.hamidprojectapp.quran;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONArray;
import org.json.JSONObject;

public class PrayerBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) &&
            !"android.intent.action.TIME_SET".equals(intent.getAction()) &&
            !"android.intent.action.TIMEZONE_CHANGED".equals(intent.getAction())) return;
        String raw = context.getSharedPreferences("prayer_reminders", Context.MODE_PRIVATE).getString("items", "[]");
        try {
            JSONArray items = new JSONArray(raw);
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                if (!item.optBoolean("enabled", false)) continue;
                PrayerAlarmReceiver.schedule(context, item.optString("name", "Sholat"),
                    item.optInt("hour", -1), item.optInt("minute", -1),
                    item.optInt("lead", 0), item.optString("sound", "short"));
            }
        } catch (Exception ignored) {}
    }
}