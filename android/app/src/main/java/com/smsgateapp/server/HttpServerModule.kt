package com.smsgateapp.server

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.net.Inet4Address
import java.net.NetworkInterface

class HttpServerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var server: SmsHttpServer? = null

    override fun getName() = NAME

    @ReactMethod
    fun start(port: Double, username: String, password: String, promise: Promise) {
        try {
            server?.stop()
            server = SmsHttpServer(port.toInt(), username, password) { requestId, method, path, body ->
                emitHttpRequest(requestId, method, path, body)
            }
            server!!.start(fi.iki.elonen.NanoHTTPD.SOCKET_READ_TIMEOUT, false)
            val ip = getLocalIpAddress()
            promise.resolve("http://$ip:${port.toInt()}")
        } catch (e: Exception) {
            promise.reject("SERVER_START_FAILED", e.message ?: "Unknown error", e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        server?.stop()
        server = null
        promise.resolve(null)
    }

    @ReactMethod
    fun isRunning(promise: Promise) {
        promise.resolve(server?.isAlive == true)
    }

    @ReactMethod
    fun respondToRequest(requestId: String, status: Double, body: String, promise: Promise) {
        server?.resolveRequest(requestId, status.toInt(), body)
        promise.resolve(null)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    private fun emitHttpRequest(requestId: String, method: String, path: String, body: String) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_HTTP_REQUEST, Arguments.createMap().apply {
                putString("requestId", requestId)
                putString("method", method)
                putString("path", path)
                putString("body", body)
            })
    }

    private fun getLocalIpAddress(): String {
        try {
            for (intf in NetworkInterface.getNetworkInterfaces()) {
                for (addr in intf.inetAddresses) {
                    if (!addr.isLoopbackAddress && addr is Inet4Address) {
                        return addr.hostAddress ?: continue
                    }
                }
            }
        } catch (_: Exception) {}
        return "127.0.0.1"
    }

    companion object {
        const val NAME = "HttpServer"
        const val EVENT_HTTP_REQUEST = "onHttpRequest"
    }
}
