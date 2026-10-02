package dk.bendecks.migassistant

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

class CaseStore(context: Context) {
    private val prefs = context.getSharedPreferences("mig_cases", Context.MODE_PRIVATE)

    fun load(): List<FollowUpCase> {
        val raw = prefs.getString(KEY, null) ?: return seed().also(::save)
        return try {
            val arr = JSONArray(raw)
            buildList {
                for (i in 0 until arr.length()) {
                    val o = arr.getJSONObject(i)
                    add(
                        FollowUpCase(
                            id = o.getInt("id"),
                            title = o.getString("title"),
                            counterpart = o.optString("counterpart"),
                            channel = o.optString("channel", "E-mail"),
                            status = runCatching { CaseStatus.valueOf(o.getString("status")) }
                                .getOrDefault(CaseStatus.ACTION_NEEDED),
                            lastUpdate = o.optString("lastUpdate"),
                            nextAction = o.optString("nextAction"),
                            followUpDate = o.optString("followUpDate"),
                            notes = o.optString("notes")
                        )
                    )
                }
            }
        } catch (_: Exception) {
            seed().also(::save)
        }
    }

    fun save(cases: List<FollowUpCase>) {
        val arr = JSONArray()
        cases.forEach { c ->
            arr.put(
                JSONObject()
                    .put("id", c.id)
                    .put("title", c.title)
                    .put("counterpart", c.counterpart)
                    .put("channel", c.channel)
                    .put("status", c.status.name)
                    .put("lastUpdate", c.lastUpdate)
                    .put("nextAction", c.nextAction)
                    .put("followUpDate", c.followUpDate)
                    .put("notes", c.notes)
            )
        }
        prefs.edit().putString(KEY, arr.toString()).apply()
    }

    private fun seed() = listOf(
        FollowUpCase(
            id = 1,
            title = "Hybel – stænkplade, fuger og greb",
            counterpart = "Bent / Hybel",
            channel = "E-mail",
            status = CaseStatus.WAITING,
            lastUpdate = "17/09/2026",
            nextAction = "Følg op hos Bent, hvis der stadig ikke er svar.",
            followUpDate = "",
            notes = "Mail sendt 17/9. Intet svar fundet."
        ),
        FollowUpCase(
            id = 2,
            title = "Køkken-el",
            counterpart = "Lasse / Hybel",
            channel = "E-mail / telefon",
            status = CaseStatus.WAITING,
            lastUpdate = "02/10/2026",
            nextAction = "Følg op hos Lasse/Hybel om løsning og tidspunkt.",
            followUpDate = "",
            notes = "Rykket flere gange. Stadig uløst. Elektriker har foreslået ekstra gruppe og fordeling af ovne/opvaskemaskiner på faser."
        )
    )

    companion object {
        private const val KEY = "cases_json"
    }
}
