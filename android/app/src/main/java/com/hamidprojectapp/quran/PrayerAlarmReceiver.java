package com.hamidprojectapp.quran;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import org.json.JSONObject;

public class PrayerAlarmReceiver extends BroadcastReceiver {
    static int requestCode(String id) { return id.hashCode() & 0x7fffffff; }

    static PendingIntent pending(Context context, String id) {
        Intent intent = new Intent(context, PrayerAlarmReceiver.class);
        intent.setAction("com.hamidprojectapp.quran.PRAYER_" + id);
        intent.putExtra("eventId", id);
        return PendingIntent.getBroadcast(context, requestCode(id), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
    }

    static void scheduleAt(Context context, JSONObject event) {
        String id = event.optString("id", "");
        long at = event.optLong("at", 0L);
        if (id.isEmpty() || at <= System.currentTimeMillis()) return;
        Intent intent = new Intent(context, PrayerAlarmReceiver.class);
        intent.setAction("com.hamidprojectapp.quran.PRAYER_" + id);
        intent.putExtra("eventId", id);
        intent.putExtra("name", event.optString("name", "Sholat"));
        intent.putExtra("sound", event.optString("sound", "short"));
        PendingIntent operation = PendingIntent.getBroadcast(context, requestCode(id), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;
        if (Build.VERSION.SDK_INT >= 31 && !alarms.canScheduleExactAlarms()) {
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, operation);
        } else if (Build.VERSION.SDK_INT >= 23) {
            alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, operation);
        } else {
            alarms.setExact(AlarmManager.RTC_WAKEUP, at, operation);
        }
    }

    static void cancel(Context context, String id) {
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms != null && !id.isEmpty()) alarms.cancel(pending(context, id));
    }

    static void cancelLegacy(Context context, String name) {
        if (name == null || name.isEmpty()) return;
        Intent intent = new Intent(context, PrayerAlarmReceiver.class);
        intent.setAction("com.hamidprojectapp.quran.PRAYER_" + name);
        intent.putExtra("name", name);
        PendingIntent old = PendingIntent.getBroadcast(context, name.hashCode(), intent,
            PendingIntent.FLAG_NO_CREATE | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (old != null) {
            if (alarms != null) alarms.cancel(old);
            old.cancel();
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String id = intent.getStringExtra("eventId");
        String name = intent.getStringExtra("name");
        String sound = intent.getStringExtra("sound");
        if (name == null) name = "Waktu sholat";
        if (sound == null) sound = "short";
        String channelId = "quran_prayer_" + sound;
        createChannel(context, channelId, sound);

        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent content = open == null ? null : PendingIntent.getActivity(context, 9001, open,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
            .setSmallIcon(context.getApplicationInfo().icon)
            .setContentTitle("Waktu sholat " + name)
            .setContentText(("adhan".equals(sound) || "fajr".equals(sound)) ? "Saatnya menunaikan sholat." : "Pengingat waktu sholat.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_ALARM);
        if (content != null) builder.setContentIntent(content);
        if ("silent".equals(sound) || "adhan".equals(sound) || "fajr".equals(sound)) builder.setSilent(true);
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify((id == null ? name : id).hashCode(), builder.build());

        if ("adhan".equals(sound) || "fajr".equals(sound)) {
            Intent play = new Intent(context, AdhanPlaybackService.class);
            play.setAction(AdhanPlaybackService.ACTION_PLAY);
            play.putExtra(AdhanPlaybackService.EXTRA_SOUND, sound);
            play.putExtra(AdhanPlaybackService.EXTRA_PRAYER, name);
            try {
                if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(play);
                else context.startService(play);
            } catch (Exception error) { android.util.Log.e("QuranPrayer", "Tidak dapat memulai audio adzan", error); }
        }
    }

    private void createChannel(Context context, String channelId, String sound) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null || manager.getNotificationChannel(channelId) != null) return;
        NotificationChannel channel = new NotificationChannel(channelId, "Pengingat Sholat", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Pengingat waktu sholat Quran Premium");
        if ("silent".equals(sound) || "adhan".equals(sound) || "fajr".equals(sound)) channel.setSound(null, null);
        manager.createNotificationChannel(channel);
    }
}