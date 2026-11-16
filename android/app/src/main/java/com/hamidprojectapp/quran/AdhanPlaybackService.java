package com.hamidprojectapp.quran;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class AdhanPlaybackService extends Service {
    public static final String ACTION_PLAY = "com.hamidprojectapp.quran.PLAY_ADHAN";
    public static final String ACTION_STOP = "com.hamidprojectapp.quran.STOP_ADHAN";
    public static final String EXTRA_SOUND = "sound";
    public static final String EXTRA_PRAYER = "prayer";
    private static final int NOTIFICATION_ID = 9020;
    private MediaPlayer player;

    @Override public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || ACTION_STOP.equals(intent.getAction())) {
            stopPlayback();
            stopSelf();
            return START_NOT_STICKY;
        }
        String sound = intent.getStringExtra(EXTRA_SOUND);
        String prayer = intent.getStringExtra(EXTRA_PRAYER);
        if (sound == null) sound = "adhan";
        if (prayer == null) prayer = "Waktu sholat";
        stopPlayerOnly();
        startPlaybackNotification(prayer);
        String resourceName = "adhan".equals(sound) ? "adhan" : "adhan_fajr";
        int resourceId = getResources().getIdentifier(resourceName, "raw", getPackageName());
        if (resourceId == 0) {
            android.util.Log.e("QuranPrayer", "Audio res/raw/" + resourceName + ".mp3 belum tersedia");
            stopPlayback();
            stopSelf();
            return START_NOT_STICKY;
        }
        try {
            player = MediaPlayer.create(this, resourceId);
            if (player == null) throw new IllegalStateException("MediaPlayer tidak dapat dibuat");
            player.setOnCompletionListener(mp -> { stopPlayback(); stopSelf(); });
            player.setOnErrorListener((mp, what, extra) -> { stopPlayback(); stopSelf(); return true; });
            player.start();
        } catch (Exception error) {
            android.util.Log.e("QuranPrayer", "Gagal memutar audio adzan", error);
            stopPlayback();
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    private void startPlaybackNotification(String prayer) {
        Intent stop = new Intent(this, AdhanPlaybackService.class);
        stop.setAction(ACTION_STOP);
        PendingIntent stopPending = PendingIntent.getService(this, 9021, stop,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        Notification notification = new NotificationCompat.Builder(this, "quran_adhan_playback")
            .setSmallIcon(getApplicationInfo().icon)
            .setContentTitle("Adzan " + prayer)
            .setContentText("Audio adzan sedang diputar")
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_media_pause, "Hentikan adzan", stopPending)
            .build();
        if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(NOTIFICATION_ID, notification);
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null && manager.getNotificationChannel("quran_adhan_playback") == null) {
            NotificationChannel channel = new NotificationChannel("quran_adhan_playback", "Pemutaran Adzan", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Kontrol audio adzan yang sedang diputar");
            manager.createNotificationChannel(channel);
        }
    }

    private void stopPlayerOnly() {
        if (player != null) {
            try { if (player.isPlaying()) player.stop(); } catch (Exception ignored) {}
            player.release();
            player = null;
        }
    }

    private void stopPlayback() {
        stopPlayerOnly();
        stopForeground(true);
    }

    @Override public void onDestroy() {
        stopPlayback();
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}