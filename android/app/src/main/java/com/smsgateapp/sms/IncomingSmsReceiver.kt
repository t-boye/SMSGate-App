package com.smsgateapp.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

class IncomingSmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        // Group multipart messages by originating address
        val grouped = mutableMapOf<String, StringBuilder>()
        var timestamp = System.currentTimeMillis()

        for (sms in messages) {
            val from = sms.originatingAddress ?: continue
            grouped.getOrPut(from) { StringBuilder() }.append(sms.messageBody)
            timestamp = sms.timestampMillis
        }

        val module = SmsReceiverModule.instance?.get() ?: return

        for ((from, body) in grouped) {
            module.emitSmsReceived(from, body.toString(), timestamp)
        }
    }
}
