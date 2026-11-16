package com.hamidprojectapp.quran;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONArray;
import org.json.JSONObject;

public class PrayerBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action) &&
            !"android.intent.action.TIME_SET".equals(action) &&
            !"android.intent.action.TIMEZONE_CHANGED".equals(action) &&
            !"android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED".equals(action)) return;
        String raw = context.getSharedPreferences("prayer_reminders", Context.MODE_PRIVATE).getString("events", "[]");
        try {
            JSONArray events = new JSONArray(raw);
            long now = System.currentTimeMillis();
            for (int i = 0; i < events.length(); i++) {
                JSONObject event = events.getJSONObject(i);
                if (event.optLong("at", 0L) > now) PrayerAlarmReceiver.scheduleAt(context, event);
            }
        } catch (Exception error) {
            android.util.Log.e("QuranPrayer", "Gagal memulihkan alarm setelah boot", error);
        }
    }
}