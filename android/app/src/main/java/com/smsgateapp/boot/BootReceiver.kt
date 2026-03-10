package com.smsgateapp.boot

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.smsgateapp.service.GatewayForegroundService
import com.smsgateapp.service.ServiceModule

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val validActions = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            "com.htc.intent.action.QUICKBOOT_POWERON",
        )
        if (intent.action !in validActions) return

        val prefs = context.getSharedPreferences(ServiceModule.PREFS_NAME, Context.MODE_PRIVATE)
        if (!prefs.getBoolean(ServiceModule.KEY_AUTO_START, false)) return

        val serviceIntent = Intent(context, GatewayForegroundService::class.java)
            .setAction(GatewayForegroundService.ACTION_START)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
