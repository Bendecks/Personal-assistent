package dk.bendecks.migassistant

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class AssistantNotificationListener : NotificationListenerService() {
    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        val notification = sbn ?: return
        if (!isSupportedPackage(notification.packageName)) return

        val extras = notification.notification.extras
        val sender = extras.getCharSequence(Notification.EXTRA_TITLE)
            ?.toString()
            ?.trim()
            .orEmpty()

        val body = sequenceOf(
            extras.getCharSequence(Notification.EXTRA_BIG_TEXT),
            extras.getCharSequence(Notification.EXTRA_TEXT),
            extras.getCharSequence(Notification.EXTRA_SUB_TEXT)
        )
            .mapNotNull { it?.toString()?.trim() }
            .firstOrNull { it.isNotBlank() }
            .orEmpty()

        if (sender.isBlank() && body.isBlank()) return

        NotificationInboxStore(applicationContext).upsert(
            CapturedMessage(
                key = notification.key,
                packageName = notification.packageName,
                sender = sender,
                text = body,
                timestamp = notification.postTime,
                processed = false
            )
        )
    }

    private fun isSupportedPackage(packageName: String): Boolean =
        packageName in SUPPORTED_PACKAGES

    companion object {
        private val SUPPORTED_PACKAGES = setOf(
            "com.google.android.gm",
            "com.facebook.orca",
            "com.google.android.apps.messaging",
            "com.samsung.android.messaging",
            "com.android.messaging",
            "com.netcompany.aulanativeprivate"
        )
    }
}
