package com.smsgateapp.server

import fi.iki.elonen.NanoHTTPD
import java.util.UUID
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

class SmsHttpServer(
    port: Int,
    private val username: String,
    private val password: String,
    private val onRequest: (requestId: String, method: String, path: String, body: String) -> Unit,
) : NanoHTTPD(port) {

    // requestId -> future that JS will resolve with the response JSON
    val pendingRequests = ConcurrentHashMap<String, CompletableFuture<Pair<Int, String>>>()

    override fun serve(session: IHTTPSession): Response {
        // Basic Auth
        if (username.isNotEmpty() && password.isNotEmpty()) {
            val authHeader = session.headers["authorization"] ?: ""
            val expected = "Basic " + android.util.Base64.encodeToString(
                "$username:$password".toByteArray(), android.util.Base64.NO_WRAP
            )
            if (authHeader != expected) {
                return newFixedLengthResponse(
                    Response.Status.UNAUTHORIZED, MIME_JSON,
                    """{"error":"Unauthorized"}"""
                ).also { it.addHeader("WWW-Authenticate", "Basic realm=\"SMS Gateway\"") }
            }
        }

        // Parse body
        val files = mutableMapOf<String, String>()
        try {
            session.parseBody(files)
        } catch (_: Exception) {}
        val body = files["postData"] ?: ""

        val requestId = UUID.randomUUID().toString()
        val future = CompletableFuture<Pair<Int, String>>()
        pendingRequests[requestId] = future

        // Fire event to JS
        onRequest(requestId, session.method.name, session.uri, body)

        // Block NanoHTTPD thread until JS responds (max 10 seconds)
        return try {
            val (status, responseBody) = future.get(10, TimeUnit.SECONDS)
            val nanoStatus = when (status) {
                200 -> Response.Status.OK
                201 -> Response.Status.CREATED
                400 -> Response.Status.BAD_REQUEST
                401 -> Response.Status.UNAUTHORIZED
                404 -> Response.Status.NOT_FOUND
                500 -> Response.Status.INTERNAL_ERROR
                else -> Response.Status.OK
            }
            newFixedLengthResponse(nanoStatus, MIME_JSON, responseBody)
        } catch (e: Exception) {
            newFixedLengthResponse(
                Response.Status.INTERNAL_ERROR, MIME_JSON,
                """{"error":"Request timeout"}"""
            )
        } finally {
            pendingRequests.remove(requestId)
        }
    }

    fun resolveRequest(requestId: String, status: Int, body: String) {
        pendingRequests[requestId]?.complete(status to body)
    }

    companion object {
        private const val MIME_JSON = "application/json"
    }
}
