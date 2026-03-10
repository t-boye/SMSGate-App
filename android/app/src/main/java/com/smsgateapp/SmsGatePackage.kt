package com.smsgateapp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.smsgateapp.server.HttpServerModule
import com.smsgateapp.service.ServiceModule
import com.smsgateapp.sms.SmsReceiverModule
import com.smsgateapp.sms.SmsSenderModule

class SmsGatePackage : ReactPackage {

    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
        listOf(
            SmsSenderModule(context),
            SmsReceiverModule(context),
            HttpServerModule(context),
            ServiceModule(context),
        )

    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
