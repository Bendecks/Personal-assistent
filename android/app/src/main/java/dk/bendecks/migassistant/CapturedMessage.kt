package dk.bendecks.migassistant

data class CapturedMessage(
    val key: String,
    val packageName: String,
    val sender: String,
    val text: String,
    val timestamp: Long,
    val processed: Boolean
)
