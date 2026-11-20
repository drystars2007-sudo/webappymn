package org.schabi.newpipe.data

import android.content.Context
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.schabi.newpipe.model.PersistedAppState

class LocalStore(context: Context) {
    private val prefs = context.getSharedPreferences("ymntube_store", Context.MODE_PRIVATE)
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    fun load(): PersistedAppState {
        val raw = prefs.getString(KEY_STATE, null) ?: return PersistedAppState()
        return runCatching { json.decodeFromString<PersistedAppState>(raw) }
            .getOrDefault(PersistedAppState())
    }

    fun save(state: PersistedAppState) {
        runCatching {
            prefs.edit().putString(KEY_STATE, json.encodeToString(state)).apply()
        }
    }

    companion object {
        private const val KEY_STATE = "app_state_v1"
    }
}
