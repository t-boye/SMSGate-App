package com.smsgateapp.sms

import android.Manifest
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import java.util.concurrent.atomic.AtomicInteger

class SmsSenderModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = NAME

    @ReactMethod
    fun sendSms(
        messageId: String,
        recipientId: String,
        phoneNumber: String,
        message: String,
        simSlot: Int,
        trackDelivery: Boolean,
        promise: Promise,
    ) {
        // Runtime permission check (required Android 6+)
        if (reactContext.checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            promise.reject("PERMISSION_DENIED", "SEND_SMS permission not granted")
            return
        }

        try {
            val smsManager = getSmsManager(simSlot)
            val parts = smsManager.divideMessage(message)

            if (parts.size == 1) {
                val sentIntent = buildSentIntent(messageId, recipientId, phoneNumber)
                val deliveredIntent = if (trackDelivery) buildDeliveredIntent(messageId, recipientId, phoneNumber) else null
                smsManager.sendTextMessage(phoneNumber, null, parts[0], sentIntent, deliveredIntent)
            } else {
                val sentIntents = ArrayList<PendingIntent>(parts.size)
                val deliveredIntents = if (trackDelivery) ArrayList<PendingIntent>(parts.size) else null
                for (i in parts.indices) {
                    sentIntents.add(buildSentIntent(messageId, recipientId, phoneNumber))
                    deliveredIntents?.add(buildDeliveredIntent(messageId, recipientId, phoneNumber))
                }
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, sentIntents, deliveredIntents)
            }
            promise.resolve("queued")
        } catch (e: Exception) {
            promise.reject("SMS_SEND_FAILED", e.message ?: "Unknown error", e)
        }
    }

    @ReactMethod
    fun getSimCards(promise: Promise) {
        try {
            val result: WritableArray = Arguments.createArray()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                val mgr = reactContext.getSystemService(SubscriptionManager::class.java)
                val subs = mgr?.activeSubscriptionInfoList ?: emptyList()
                for (sub in subs) {
                    result.pushMap(Arguments.createMap().apply {
                        putInt("slotIndex", sub.simSlotIndex)
                        putString("displayName", sub.displayName?.toString() ?: "SIM ${sub.simSlotIndex + 1}")
                        putString("phoneNumber", sub.number ?: "")
                        putInt("subscriptionId", sub.subscriptionId)
                    })
                }
            }
            if (result.size() == 0) {
                result.pushMap(Arguments.createMap().apply {
                    putInt("slotIndex", 0)
                    putString("displayName", "SIM 1")
                    putString("phoneNumber", "")
                    putInt("subscriptionId", -1)
                })
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("GET_SIM_FAILED", e.message ?: "Unknown error", e)
        }
    }

    private fun getSmsManager(simSlot: Int): SmsManager {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            val mgr = reactContext.getSystemService(SubscriptionManager::class.java)
            val subs = mgr?.activeSubscriptionInfoList
            if (!subs.isNullOrEmpty()) {
                val sub = subs.firstOrNull { it.simSlotIndex == simSlot } ?: subs[0]
                return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    reactContext.getSystemService(SmsManager::class.java)
                        .createForSubscriptionId(sub.subscriptionId)
                } else {
                    @Suppress("DEPRECATION")
                    SmsManager.getSmsManagerForSubscriptionId(sub.subscriptionId)
                }
            }
        }
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            reactContext.getSystemService(SmsManager::class.java)
        } else {
            @Suppress("DEPRECATION")
            SmsManager.getDefault()
        }
    }

    private fun pendingIntentFlags() =
        PendingIntent.FLAG_UPDATE_CURRENT or
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0

    private fun buildSentIntent(messageId: String, recipientId: String, phone: String): PendingIntent {
        val intent = Intent(SmsDeliveryReceiver.ACTION_SMS_SENT).apply {
            setPackage(reactContext.packageName)
            putExtra("messageId", messageId)
            putExtra("recipientId", recipientId)
            putExtra("phone", phone)
        }
        return PendingIntent.getBroadcast(
            reactContext, requestCodeCounter.incrementAndGet(), intent, pendingIntentFlags()
        )
    }

    private fun buildDeliveredIntent(messageId: String, recipientId: String, phone: String): PendingIntent {
        val intent = Intent(SmsDeliveryReceiver.ACTION_SMS_DELIVERED).apply {
            setPackage(reactContext.packageName)
            putExtra("messageId", messageId)
            putExtra("recipientId", recipientId)
            putExtra("phone", phone)
        }
        return PendingIntent.getBroadcast(
            reactContext, requestCodeCounter.incrementAndGet(), intent, pendingIntentFlags()
        )
    }

    companion object {
        const val NAME = "SmsSender"
        private val requestCodeCounter = AtomicInteger(0)
    }
}
