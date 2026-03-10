package com.smsgateapp.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import com.smsgateapp.MainActivity
import com.smsgateapp.R

class GatewayForegroundService : Service() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                createNotificationChannel()
                startForeground(NOTIFICATION_ID, buildNotification())
            }
            ACTION_STOP -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
                stopSelf()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SMS Gateway",
                NotificationManager.IMPORTANCE_LOW,
            ).apply {
                description = "Keeps the SMS Gateway running in the background"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val openIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0,
        )

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("SMS Gateway")
                .setContentText("Running — ready to send and receive messages")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(openIntent)
                .setOngoing(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("SMS Gateway")
                .setContentText("Running — ready to send and receive messages")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(openIntent)
                .setOngoing(true)
                .build()
        }
    }

    companion object {
        const val CHANNEL_ID = "sms_gateway_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.smsgateapp.START_SERVICE"
        const val ACTION_STOP = "com.smsgateapp.STOP_SERVICE"
    }
}
