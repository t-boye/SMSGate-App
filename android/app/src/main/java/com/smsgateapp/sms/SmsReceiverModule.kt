package com.smsgateapp.sms

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.lang.ref.WeakReference

class SmsReceiverModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    init {
        instance = WeakReference(this)
    }

    override fun getName() = NAME

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    fun emitSmsReceived(from: String, body: String, timestamp: Long) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_SMS_RECEIVED, Arguments.createMap().apply {
                putString("from", from)
                putString("body", body)
                putDouble("timestamp", timestamp.toDouble())
            })
    }

    fun emitDeliveryUpdate(messageId: String, recipientId: String, status: String, error: String?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_DELIVERY_UPDATE, Arguments.createMap().apply {
                putString("messageId", messageId)
                putString("recipientId", recipientId)
                putString("status", status)
                if (error != null) putString("error", error)
            })
    }

    companion object {
        const val NAME = "SmsReceiver"
        const val EVENT_SMS_RECEIVED = "onSmsReceived"
        const val EVENT_DELIVERY_UPDATE = "onDeliveryUpdate"

        var instance: WeakReference<SmsReceiverModule>? = null
    }
}
