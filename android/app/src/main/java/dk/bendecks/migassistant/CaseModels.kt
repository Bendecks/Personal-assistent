package dk.bendecks.migassistant

enum class CaseStatus(val label: String) {
    ACTION_NEEDED("Skal følges op"),
    WAITING("Venter på svar"),
    CLOSED("Lukket")
}

data class FollowUpCase(
    val id: Int,
    val title: String,
    val counterpart: String,
    val channel: String,
    val status: CaseStatus,
    val lastUpdate: String,
    val nextAction: String,
    val followUpDate: String,
    val notes: String
)
