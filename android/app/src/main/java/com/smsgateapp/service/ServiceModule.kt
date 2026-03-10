package com.smsgateapp.service

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ServiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = NAME

    @ReactMethod
    fun startForegroundService(promise: Promise) {
        try {
            val intent = Intent(reactContext, GatewayForegroundService::class.java)
                .setAction(GatewayForegroundService.ACTION_START)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            // Persist auto-start preference for BootReceiver
            reactContext.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
                .edit().putBoolean(KEY_AUTO_START, true).apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SERVICE_START_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun stopForegroundService(promise: Promise) {
        try {
            val intent = Intent(reactContext, GatewayForegroundService::class.java)
                .setAction(GatewayForegroundService.ACTION_STOP)
            reactContext.startService(intent)
            reactContext.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
                .edit().putBoolean(KEY_AUTO_START, false).apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SERVICE_STOP_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        val prefs = reactContext.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
        promise.resolve(prefs.getBoolean(KEY_AUTO_START, false))
    }

    @ReactMethod
    fun setAutoStart(enabled: Boolean, promise: Promise) {
        reactContext.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_AUTO_START, enabled).apply()
        promise.resolve(null)
    }

    companion object {
        const val NAME = "ServiceManager"
        const val PREFS_NAME = "SmsGatePrefs"
        const val KEY_AUTO_START = "autoStartOnBoot"
    }
}
