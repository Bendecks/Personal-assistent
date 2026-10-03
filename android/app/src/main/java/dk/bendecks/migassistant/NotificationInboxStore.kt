package dk.bendecks.migassistant

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

class NotificationInboxStore(context: Context) {
    private val prefs = context.getSharedPreferences("mig_notification_inbox", Context.MODE_PRIVATE)

    fun load(): List<CapturedMessage> {
        val raw = prefs.getString(KEY, null) ?: return emptyList()
        return try {
            val arr = JSONArray(raw)
            buildList {
                for (i in 0 until arr.length()) {
                    val o = arr.getJSONObject(i)
                    add(
                        CapturedMessage(
                            key = o.getString("key"),
                            packageName = o.optString("packageName"),
                            sender = o.optString("sender"),
                            text = o.optString("text"),
                            timestamp = o.optLong("timestamp"),
                            processed = o.optBoolean("processed", false)
                        )
                    )
                }
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun upsert(message: CapturedMessage) {
        val current = load().toMutableList()
        val index = current.indexOfFirst { it.key == message.key }
        if (index >= 0) {
            val existing = current[index]
            current[index] = message.copy(processed = existing.processed)
        } else {
            current.add(message)
        }
        save(current.takeLast(200))
    }

    fun markProcessed(key: String) {
        save(load().map { if (it.key == key) it.copy(processed = true) else it })
    }

    private fun save(messages: List<CapturedMessage>) {
        val arr = JSONArray()
        messages.forEach { message ->
            arr.put(
                JSONObject()
                    .put("key", message.key)
                    .put("packageName", message.packageName)
                    .put("sender", message.sender)
                    .put("text", message.text)
                    .put("timestamp", message.timestamp)
                    .put("processed", message.processed)
            )
        }
        prefs.edit().putString(KEY, arr.toString()).apply()
    }

    companion object {
        private const val KEY = "messages_json"
    }
}
