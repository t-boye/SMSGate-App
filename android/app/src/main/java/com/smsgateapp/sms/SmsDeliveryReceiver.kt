package com.smsgateapp.sms

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.SmsManager

class SmsDeliveryReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val messageId = intent.getStringExtra("messageId") ?: return
        val recipientId = intent.getStringExtra("recipientId") ?: return
        val phone = intent.getStringExtra("phone") ?: ""

        val module = SmsReceiverModule.instance?.get() ?: return

        when (intent.action) {
            ACTION_SMS_SENT -> {
                val (status, error) = when (resultCode) {
                    Activity.RESULT_OK -> "sent" to null
                    SmsManager.RESULT_ERROR_GENERIC_FAILURE -> "failed" to "Generic failure"
                    SmsManager.RESULT_ERROR_NO_SERVICE -> "failed" to "No service"
                    SmsManager.RESULT_ERROR_NULL_PDU -> "failed" to "Null PDU"
                    SmsManager.RESULT_ERROR_RADIO_OFF -> "failed" to "Radio off"
                    else -> "failed" to "Unknown error ($resultCode)"
                }
                module.emitDeliveryUpdate(messageId, recipientId, status, error)
            }
            ACTION_SMS_DELIVERED -> {
                val status = if (resultCode == Activity.RESULT_OK) "delivered" else "failed"
                val error = if (resultCode != Activity.RESULT_OK) "Delivery failed ($resultCode)" else null
                module.emitDeliveryUpdate(messageId, recipientId, status, error)
            }
        }
    }

    companion object {
        const val ACTION_SMS_SENT = "com.smsgateapp.SMS_SENT"
        const val ACTION_SMS_DELIVERED = "com.smsgateapp.SMS_DELIVERED"
    }
}
