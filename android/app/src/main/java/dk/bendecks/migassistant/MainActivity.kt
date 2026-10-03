package dk.bendecks.migassistant

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.app.NotificationManagerCompat
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val store = CaseStore(this)
        val inboxStore = NotificationInboxStore(this)

        setContent {
            MaterialTheme {
                var cases by remember { mutableStateOf(store.load()) }
                var filter by remember { mutableStateOf<CaseStatus?>(null) }
                var editing by remember { mutableStateOf<FollowUpCase?>(null) }
                var adding by remember { mutableStateOf(false) }
                var update by remember { mutableStateOf<UpdateInfo?>(null) }
                var inbox by remember { mutableStateOf(inboxStore.load()) }
                var showInbox by remember { mutableStateOf(false) }

                LaunchedEffect(Unit) {
                    update = withContext(Dispatchers.IO) {
                        UpdateManager.checkForUpdate(BuildConfig.VERSION_NAME)
                    }
                }

                fun persist(next: List<FollowUpCase>) {
                    cases = next
                    store.save(next)
                }

                Scaffold(
                    topBar = { TopAppBar(title = { Text("Mig · Korrespondancer") }) },
                    floatingActionButton = {
                        FloatingActionButton(onClick = { adding = true }) { Text("+") }
                    }
                ) { padding ->
                    Column(
                        Modifier
                            .fillMaxSize()
                            .padding(padding)
                            .padding(horizontal = 16.dp)
                    ) {
                        update?.let { info ->
                            UpdateCard(
                                info = info,
                                onUpdate = {
                                    val started = UpdateManager.downloadAndInstall(this@MainActivity, info)
                                    if (!started) {
                                        Toast.makeText(
                                            this@MainActivity,
                                            "Tillad installation fra Mig, og tryk derefter Opdater igen.",
                                            Toast.LENGTH_LONG
                                        ).show()
                                    }
                                }
                            )
                            Spacer(Modifier.height(12.dp))
                        }

                        val notificationAccess = NotificationManagerCompat
                            .getEnabledListenerPackages(this@MainActivity)
                            .contains(packageName)
                        CommunicationInboxCard(
                            enabled = notificationAccess,
                            unreadCount = inbox.count { !it.processed },
                            onEnable = {
                                startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
                            },
                            onOpen = {
                                inbox = inboxStore.load()
                                showInbox = true
                            }
                        )
                        Spacer(Modifier.height(12.dp))

                        Summary(cases)
                        Spacer(Modifier.height(12.dp))
                        StatusFilters(filter) { filter = it }
                        Spacer(Modifier.height(8.dp))

                        val visible = cases
                            .filter { filter == null || it.status == filter }
                            .sortedWith(
                                compareBy<FollowUpCase> { it.status == CaseStatus.CLOSED }
                                    .thenBy { it.id }
                            )

                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(visible, key = { it.id }) { item ->
                                CaseCard(
                                    item = item,
                                    onEdit = { editing = item },
                                    onStatus = { status ->
                                        persist(cases.map {
                                            if (it.id == item.id) it.copy(status = status) else it
                                        })
                                    }
                                )
                            }
                        }
                    }
                }

                if (adding) {
                    CaseEditorDialog(
                        original = null,
                        nextId = (cases.maxOfOrNull { it.id } ?: 0) + 1,
                        onDismiss = { adding = false },
                        onSave = {
                            persist(cases + it)
                            adding = false
                        }
                    )
                }

                if (showInbox) {
                    InboxDialog(
                        messages = inbox.filter { !it.processed }.sortedByDescending { it.timestamp },
                        onDismiss = { showInbox = false },
                        onRefresh = { inbox = inboxStore.load() },
                        onIgnore = { message ->
                            inboxStore.markProcessed(message.key)
                            inbox = inboxStore.load()
                        },
                        onCreateCase = { message ->
                            val newCase = message.toCase((cases.maxOfOrNull { it.id } ?: 0) + 1)
                            persist(cases + newCase)
                            inboxStore.markProcessed(message.key)
                            inbox = inboxStore.load()
                        }
                    )
                }

                editing?.let { current ->
                    CaseEditorDialog(
                        original = current,
                        nextId = current.id,
                        onDismiss = { editing = null },
                        onSave = { changed ->
                            persist(cases.map { if (it.id == changed.id) changed else it })
                            editing = null
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun Summary(cases: List<FollowUpCase>) {
    val action = cases.count { it.status == CaseStatus.ACTION_NEEDED }
    val waiting = cases.count { it.status == CaseStatus.WAITING }
    val parked = cases.count { it.status == CaseStatus.PARKED }
    val closed = cases.count { it.status == CaseStatus.CLOSED }

    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text("Overblik", fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(6.dp))
            Text("$action aktive · $waiting venter · $parked parkeret · $closed lukket")
        }
    }
}

@Composable
private fun StatusFilters(selected: CaseStatus?, onSelect: (CaseStatus?) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
                selected = selected == null,
                onClick = { onSelect(null) },
                label = { Text("Alle") }
            )
            FilterChip(
                selected = selected == CaseStatus.ACTION_NEEDED,
                onClick = { onSelect(CaseStatus.ACTION_NEEDED) },
                label = { Text("Aktiv") }
            )
            FilterChip(
                selected = selected == CaseStatus.WAITING,
                onClick = { onSelect(CaseStatus.WAITING) },
                label = { Text("Venter") }
            )
        }
        FilterChip(
            selected = selected == CaseStatus.PARKED,
            onClick = { onSelect(CaseStatus.PARKED) },
            label = { Text("Parkeret") }
        )
    }
}

@Composable
private fun CaseCard(
    item: FollowUpCase,
    onEdit: () -> Unit,
    onStatus: (CaseStatus) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onEdit)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text("Sag #${item.id}", style = MaterialTheme.typography.labelMedium)
            Text(item.title, fontWeight = FontWeight.Bold)
            if (item.counterpart.isNotBlank()) Text(item.counterpart)
            Spacer(Modifier.height(8.dp))
            Text(item.status.label, style = MaterialTheme.typography.labelLarge)
            if (item.nextAction.isNotBlank()) {
                Spacer(Modifier.height(6.dp))
                Text("Næste: ${item.nextAction}")
            }
            if (item.followUpDate.isNotBlank()) {
                Text("Opfølgning: ${item.followUpDate}")
            }
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (item.status != CaseStatus.ACTION_NEEDED) {
                    OutlinedButton(onClick = { onStatus(CaseStatus.ACTION_NEEDED) }) {
                        Text("Aktiv")
                    }
                }
                if (item.status != CaseStatus.WAITING) {
                    OutlinedButton(onClick = { onStatus(CaseStatus.WAITING) }) {
                        Text("Venter")
                    }
                }
                if (item.status != CaseStatus.PARKED) {
                    TextButton(onClick = { onStatus(CaseStatus.PARKED) }) {
                        Text("Parkér")
                    }
                }
                if (item.status != CaseStatus.CLOSED) {
                    TextButton(onClick = { onStatus(CaseStatus.CLOSED) }) {
                        Text("Luk")
                    }
                }
            }
        }
    }
}

@Composable
private fun UpdateCard(info: UpdateInfo, onUpdate: () -> Unit) {
    Card(Modifier.fillMaxWidth()) {
        Row(
            Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Column(Modifier.weight(1f)) {
                Text("Ny version ${info.version}", fontWeight = FontWeight.Bold)
                Text("Hent opdateringen direkte i appen.")
            }
            Button(onClick = onUpdate) { Text("Opdater") }
        }
    }
}

@Composable
private fun CaseEditorDialog(
    original: FollowUpCase?,
    nextId: Int,
    onDismiss: () -> Unit,
    onSave: (FollowUpCase) -> Unit
) {
    var title by remember(original) { mutableStateOf(original?.title ?: "") }
    var counterpart by remember(original) { mutableStateOf(original?.counterpart ?: "") }
    var channel by remember(original) { mutableStateOf(original?.channel ?: "E-mail") }
    var lastUpdate by remember(original) { mutableStateOf(original?.lastUpdate ?: "") }
    var nextAction by remember(original) { mutableStateOf(original?.nextAction ?: "") }
    var followUpDate by remember(original) { mutableStateOf(original?.followUpDate ?: "") }
    var notes by remember(original) { mutableStateOf(original?.notes ?: "") }
    var status by remember(original) { mutableStateOf(original?.status ?: CaseStatus.ACTION_NEEDED) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (original == null) "Ny sag #$nextId" else "Rediger sag #$nextId") },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Titel") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                item {
                    OutlinedTextField(
                        value = counterpart,
                        onValueChange = { counterpart = it },
                        label = { Text("Modpart") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                item {
                    OutlinedTextField(
                        value = channel,
                        onValueChange = { channel = it },
                        label = { Text("Kanal") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        CaseStatus.entries.forEach { value ->
                            FilterChip(
                                selected = status == value,
                                onClick = { status = value },
                                label = { Text(value.label) }
                            )
                        }
                    }
                }
                item {
                    OutlinedTextField(
                        value = lastUpdate,
                        onValueChange = { lastUpdate = it },
                        label = { Text("Seneste udvikling / dato") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                item {
                    OutlinedTextField(
                        value = nextAction,
                        onValueChange = { nextAction = it },
                        label = { Text("Næste handling") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                item {
                    OutlinedTextField(
                        value = followUpDate,
                        onValueChange = { followUpDate = it },
                        label = { Text("Følg op dato") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                item {
                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text("Noter") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3
                    )
                }
            }
        },
        confirmButton = {
            Button(
                enabled = title.isNotBlank(),
                onClick = {
                    onSave(
                        FollowUpCase(
                            id = nextId,
                            title = title.trim(),
                            counterpart = counterpart.trim(),
                            channel = channel.trim(),
                            status = status,
                            lastUpdate = lastUpdate.trim(),
                            nextAction = nextAction.trim(),
                            followUpDate = followUpDate.trim(),
                            notes = notes.trim()
                        )
                    )
                }
            ) { Text("Gem") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Annuller") }
        }
    )
}
