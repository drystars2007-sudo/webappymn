package org.schabi.newpipe.model

import kotlinx.serialization.Serializable

@Serializable
enum class ThemeMode {
    LIGHT, DARK, BLACK
}

@Serializable
enum class ItemViewMode {
    LIST, GRID
}

enum class NavDestination {
    HOME,
    SUBSCRIPTIONS,
    FEED,
    BOOKMARKS,
    DOWNLOADS,
    HISTORY,
    TRENDING,
    SETTINGS,
    ABOUT,
    SEARCH,
    CHANNEL,
    PLAYLIST
}

@Serializable
data class StreamItem(
    val id: String,
    val title: String,
    val uploaderName: String,
    val uploaderId: String = "",
    val uploaderAvatar: String? = null,
    val thumbnail: String,
    val durationText: String = "",
    val viewCountText: String = "",
    val uploadedDate: String = "",
    val isLive: Boolean = false,
    val shortDescription: String = ""
)

@Serializable
data class ChannelSummary(
    val id: String,
    val name: String,
    val avatar: String = "",
    val subscriberCountText: String = "",
    val description: String = ""
)

@Serializable
data class ChannelInfo(
    val id: String,
    val name: String,
    val avatar: String = "",
    val banner: String = "",
    val subscriberCountText: String = "",
    val description: String = "",
    val videos: List<StreamItem> = emptyList()
)

@Serializable
data class ChapterItem(
    val title: String,
    val startSeconds: Int
)

@Serializable
data class CommentItem(
    val id: String,
    val author: String,
    val text: String,
    val publishedTime: String = "",
    val likeCount: String = "0"
)

@Serializable
data class VideoDetail(
    val stream: StreamItem,
    val description: String = "",
    val subscriberCountText: String = "",
    val chapters: List<ChapterItem> = emptyList(),
    val related: List<StreamItem> = emptyList(),
    val comments: List<CommentItem> = emptyList()
)

@Serializable
data class PlaylistInfo(
    val id: String,
    val name: String,
    val items: List<StreamItem> = emptyList(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Serializable
data class SubscriptionChannel(
    val id: String,
    val name: String,
    val url: String = "",
    val avatar: String = "",
    val subscriberCountText: String = "",
    val notificationsEnabled: Boolean = true
)

@Serializable
data class HistoryEntry(
    val stream: StreamItem,
    val accessDate: Long,
    val repeatCount: Int = 1
)

@Serializable
data class DownloadMission(
    val id: String,
    val stream: StreamItem,
    val kind: String,
    val format: String,
    val quality: String,
    val progress: Int = 0,
    val status: String = "queued"
)

@Serializable
data class AppSettings(
    val theme: ThemeMode = ThemeMode.DARK,
    val viewMode: ItemViewMode = ItemViewMode.GRID,
    val enableWatchHistory: Boolean = true,
    val enableSearchHistory: Boolean = true,
    val autoplay: Boolean = true,
    val showComments: Boolean = true,
    val showDescription: Boolean = true
)

@Serializable
data class PersistedAppState(
    val settings: AppSettings = AppSettings(),
    val subscriptions: List<SubscriptionChannel> = defaultSubscriptions(),
    val playlists: List<PlaylistInfo> = listOf(
        PlaylistInfo(id = "watch-later", name = "Watch Later")
    ),
    val history: List<HistoryEntry> = emptyList(),
    val searchHistory: List<String> = emptyList(),
    val downloads: List<DownloadMission> = emptyList()
)

fun defaultSubscriptions(): List<SubscriptionChannel> = listOf(
    SubscriptionChannel(
        id = "UCXuqSBlHAE6Xw-yeJA0Tunw",
        name = "Linus Tech Tips",
        url = "https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw",
        subscriberCountText = "16M subscribers"
    ),
    SubscriptionChannel(
        id = "UCBJycsmduvYEL83R_U4JriQ",
        name = "Marques Brownlee",
        url = "https://www.youtube.com/channel/UCBJycsmduvYEL83R_U4JriQ",
        subscriberCountText = "19.8M subscribers"
    ),
    SubscriptionChannel(
        id = "UCLA_DiR1FfKNvjuUpBHmylQ",
        name = "NASA",
        url = "https://www.youtube.com/channel/UCLA_DiR1FfKNvjuUpBHmylQ",
        subscriberCountText = "12.1M subscribers"
    )
)
