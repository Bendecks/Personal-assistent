package dk.bendecks.migassistant

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class AssistantNotificationListener : NotificationListenerService() {
    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        val notification = sbn ?: return
        if (notification.packageName != GMAIL_PACKAGE) return

        val extras = notification.notification.extras
        val sender = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim().orEmpty()
        val body = (
            extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
                ?: extras.getCharSequence(Notification.EXTRA_TEXT)
        )?.toString()?.trim().orEmpty()

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

    companion object {
        private const val GMAIL_PACKAGE = "com.google.android.gm"
    }
}
