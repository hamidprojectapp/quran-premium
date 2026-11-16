package com.hamidprojectapp.quran;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import java.util.Calendar;

public class PrayerAlarmReceiver extends BroadcastReceiver {
    private static final String CHANNEL = "quran_prayer_reminders";

    static PendingIntent pending(Context context, String name) {
        Intent intent = new Intent(context, PrayerAlarmReceiver.class);
        intent.setAction("com.hamidprojectapp.quran.PRAYER_" + name);
        intent.putExtra("name", name);
        return PendingIntent.getBroadcast(context, name.hashCode(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
    }

    static void schedule(Context context, String name, int hour, int minute, int lead, String sound) {
        Calendar when = Calendar.getInstance();
        when.set(Calendar.HOUR_OF_DAY, hour);
        when.set(Calendar.MINUTE, minute);
        when.set(Calendar.SECOND, 0);
        when.set(Calendar.MILLISECOND, 0);
        when.add(Calendar.MINUTE, -lead);
        if (when.getTimeInMillis() <= System.currentTimeMillis()) when.add(Calendar.DAY_OF_YEAR, 1);
        Intent intent = new Intent(context, PrayerAlarmReceiver.class);
        intent.setAction("com.hamidprojectapp.quran.PRAYER_" + name);
        intent.putExtra("name", name);
        intent.putExtra("sound", sound);
        intent.putExtra("hour", hour);
        intent.putExtra("minute", minute);
        intent.putExtra("lead", lead);
        PendingIntent operation = PendingIntent.getBroadcast(context, name.hashCode(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;
        if (Build.VERSION.SDK_INT >= 23) {
            if (Build.VERSION.SDK_INT >= 31 && !alarms.canScheduleExactAlarms()) alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when.getTimeInMillis(), operation);
            else alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when.getTimeInMillis(), operation);
        } else alarms.setExact(AlarmManager.RTC_WAKEUP, when.getTimeInMillis(), operation);
    }

    static void cancel(Context context, String name) {
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms != null) alarms.cancel(pending(context, name));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String name = intent.getStringExtra("name");
        if (name == null) name = "Waktu sholat";
        String sound = intent.getStringExtra("sound");
        if (sound == null) sound = "short";
        createChannel(context, sound);
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent content = open == null ? null : PendingIntent.getActivity(context, 9001, open,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(context.getApplicationInfo().icon)
            .setContentTitle("Waktu sholat " + name)
            .setContentText("Saatnya menunaikan sholat.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_ALARM);
        if (content != null) builder.setContentIntent(content);
        if ("silent".equals(sound)) builder.setSilent(true);
        else builder.setDefaults(Notification.DEFAULT_ALL);
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(name.hashCode(), builder.build());

        int hour = intent.getIntExtra("hour", -1);
        int minute = intent.getIntExtra("minute", -1);
        int lead = intent.getIntExtra("lead", 0);
        if (hour >= 0 && minute >= 0) schedule(context, name, hour, minute, lead, sound);
    }

    private void createChannel(Context context, String sound) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null || manager.getNotificationChannel(CHANNEL) != null) return;
            NotificationChannel channel = new NotificationChannel(CHANNEL, "Pengingat Sholat", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Pengingat waktu sholat Quran Premium");
            if ("silent".equals(sound)) channel.setSound(null, null);
            manager.createNotificationChannel(channel);
        }
    }
}