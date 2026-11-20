package org.schabi.newpipe.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import org.schabi.newpipe.model.ChannelInfo
import org.schabi.newpipe.model.ChannelSummary
import org.schabi.newpipe.model.ChapterItem
import org.schabi.newpipe.model.CommentItem
import org.schabi.newpipe.model.StreamItem
import org.schabi.newpipe.model.VideoDetail
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

object YouTubeRepository {
    private val client = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val cache = mutableMapOf<String, Any>()

    val fallbackStreams = listOf(
        StreamItem(
            id = "aqz-KE-bpKQ",
            title = "Big Buck Bunny 60fps 4K - Blender Open Movie",
            uploaderName = "Blender Foundation",
            uploaderId = "UCSMOQeBJ2RAnuFungnQOxLg",
            thumbnail = "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
            durationText = "10:34",
            viewCountText = "18.5M views",
            uploadedDate = "3 weeks ago",
            shortDescription = "Blender Foundation open movie project in 4K 60fps."
        ),
        StreamItem(
            id = "LXb3EKWsInQ",
            title = "COSTA RICA IN 4K 60fps HDR (Ultra HD)",
            uploaderName = "Jacob + Katie Schwarz",
            uploaderId = "UCcJ4K_4N0L3vP0bX6K0H1Lw",
            thumbnail = "https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg",
            durationText = "5:14",
            viewCountText = "145M views",
            uploadedDate = "2 months ago"
        ),
        StreamItem(
            id = "21X5lGlDOfg",
            title = "NASA Live: Official Stream of NASA TV",
            uploaderName = "NASA",
            uploaderId = "UCLA_DiR1FfKNvjuUpBHmylQ",
            thumbnail = "https://i.ytimg.com/vi/21X5lGlDOfg/hqdefault.jpg",
            durationText = "LIVE",
            viewCountText = "24.5K watching",
            uploadedDate = "Live now",
            isLive = true
        ),
        StreamItem(
            id = "eRsGyueVLvQ",
            title = "Sintel - Third Open Movie by Blender Foundation",
            uploaderName = "Blender Foundation",
            uploaderId = "UCSMOQeBJ2RAnuFungnQOxLg",
            thumbnail = "https://i.ytimg.com/vi/eRsGyueVLvQ/hqdefault.jpg",
            durationText = "14:48",
            viewCountText = "9.1M views",
            uploadedDate = "4 months ago"
        ),
        StreamItem(
            id = "jfKfPfyJRdk",
            title = "lofi hip hop radio - beats to relax/study to",
            uploaderName = "Lofi Girl",
            uploaderId = "UCSJ4gkVC6NrvII8umztf0Ow",
            thumbnail = "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
            durationText = "LIVE",
            viewCountText = "38.2K watching",
            uploadedDate = "Live now",
            isLive = true
        )
    )

    fun clearCache() {
        cache.clear()
    }

    private fun fetchUrl(url: String): String {
        val req = Request.Builder()
            .url(url)
            .header(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            )
            .header("Accept-Language", "en-US,en;q=0.9")
            .header("Cookie", "CONSENT=YES+cb.20210328-17-p0.en+FX+667;")
            .build()
        client.newCall(req).execute().use { res ->
            if (!res.isSuccessful) error("HTTP ${res.code}")
            return res.body?.string() ?: ""
        }
    }

    suspend fun fetchTrending(category: String): List<StreamItem> = withContext(Dispatchers.IO) {
        val key = "trending:$category"
        (cache[key] as? List<StreamItem>)?.let { return@withContext it }

        val query = when (category) {
            "music" -> "official music video 4k"
            "gaming" -> "gaming showcase trailer 4k"
            "movies" -> "official movie trailer 4k"
            else -> "popular science tech documentary 2026"
        }

        val url = if (category == "now") {
            "https://www.youtube.com/feed/trending"
        } else {
            "https://www.youtube.com/results?search_query=${URLEncoder.encode(query, "UTF-8")}&sp=EgIQAQ%3D%3D"
        }

        val items = runCatching {
            val html = fetchUrl(url)
            val data = extractJsonAfterMarker(html, "var ytInitialData =")
                ?: extractJsonAfterMarker(html, "ytInitialData =")
            parseVideosFromJson(data)
        }.getOrDefault(emptyList())

        val result = if (items.isNotEmpty()) {
            items
        } else {
            runCatching {
                val searchHtml = fetchUrl(
                    "https://www.youtube.com/results?search_query=${URLEncoder.encode(query, "UTF-8")}&sp=EgIQAQ%3D%3D"
                )
                val data = extractJsonAfterMarker(searchHtml, "var ytInitialData =")
                    ?: extractJsonAfterMarker(searchHtml, "ytInitialData =")
                parseVideosFromJson(data)
            }.getOrDefault(emptyList())
        }

        val finalItems = if (result.isNotEmpty()) result.take(30) else fallbackStreams
        cache[key] = finalItems
        finalItems
    }

    suspend fun search(query: String): Pair<List<StreamItem>, List<ChannelSummary>> =
        withContext(Dispatchers.IO) {
            val trimmed = query.trim()
            if (trimmed.isEmpty()) return@withContext Pair(emptyList(), emptyList())

            runCatching {
                val url = "https://www.youtube.com/results?search_query=${URLEncoder.encode(trimmed, "UTF-8")}"
                val html = fetchUrl(url)
                val data = extractJsonAfterMarker(html, "var ytInitialData =")
                    ?: extractJsonAfterMarker(html, "ytInitialData =")
                val videos = parseVideosFromJson(data).take(30)
                val channels = parseChannelsFromJson(data).take(10)
                if (videos.isNotEmpty() || channels.isNotEmpty()) {
                    return@withContext Pair(videos, channels)
                }
            }

            val lower = trimmed.lowercase()
            val filtered = fallbackStreams.filter {
                it.title.lowercase().contains(lower) || it.uploaderName.lowercase().contains(lower)
            }
            Pair(if (filtered.isNotEmpty()) filtered else fallbackStreams, emptyList())
        }

    suspend fun fetchSuggestions(query: String): List<String> = withContext(Dispatchers.IO) {
        val trimmed = query.trim()
        if (trimmed.isEmpty()) return@withContext emptyList()
        runCatching {
            val raw = fetchUrl(
                "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${
                    URLEncoder.encode(trimmed, "UTF-8")
                }"
            )
            val arr = JSONArray(raw).optJSONArray(1) ?: return@runCatching emptyList()
            buildList {
                for (i in 0 until minOf(arr.length(), 8)) {
                    add(arr.optString(i))
                }
            }
        }.getOrDefault(emptyList())
    }

    suspend fun fetchVideoDetail(stream: StreamItem): VideoDetail = withContext(Dispatchers.IO) {
        val key = "video:${stream.id}"
        (cache[key] as? VideoDetail)?.let { return@withContext it }

        val detail = runCatching {
            val html = fetchUrl("https://www.youtube.com/watch?v=${URLEncoder.encode(stream.id, "UTF-8")}")
            val player = extractJsonAfterMarker(html, "var ytInitialPlayerResponse =")
                ?: extractJsonAfterMarker(html, "ytInitialPlayerResponse =")
            val initialData = extractJsonAfterMarker(html, "var ytInitialData =")
                ?: extractJsonAfterMarker(html, "ytInitialData =")

            val vd = player?.optJSONObject("videoDetails")
            val title = vd?.optString("title")?.takeIf { it.isNotBlank() } ?: stream.title
            val author = vd?.optString("author")?.takeIf { it.isNotBlank() } ?: stream.uploaderName
            val channelId = vd?.optString("channelId")?.takeIf { it.isNotBlank() } ?: stream.uploaderId
            val description = vd?.optString("shortDescription") ?: stream.shortDescription
            val related = parseVideosFromJson(initialData).filter { it.id != stream.id }.take(15)
            val comments = parseCommentsFromJson(initialData)

            VideoDetail(
                stream = stream.copy(
                    title = title,
                    uploaderName = author,
                    uploaderId = channelId
                ),
                description = description,
                chapters = parseChapters(description),
                related = if (related.isNotEmpty()) related else fallbackStreams.filter { it.id != stream.id },
                comments = comments
            )
        }.getOrElse {
            VideoDetail(
                stream = stream,
                description = stream.shortDescription.ifBlank { stream.title },
                related = fallbackStreams.filter { it.id != stream.id }
            )
        }

        cache[key] = detail
        detail
    }

    suspend fun fetchChannel(channelId: String): ChannelInfo = withContext(Dispatchers.IO) {
        val key = "channel:$channelId"
        (cache[key] as? ChannelInfo)?.let { return@withContext it }

        val info = runCatching {
            val url = if (channelId.startsWith("@")) {
                "https://www.youtube.com/$channelId/videos"
            } else {
                "https://www.youtube.com/channel/${URLEncoder.encode(channelId, "UTF-8")}/videos"
            }
            val html = fetchUrl(url)
            val data = extractJsonAfterMarker(html, "var ytInitialData =")
                ?: extractJsonAfterMarker(html, "ytInitialData =")
            val metadata = data?.optJSONObject("metadata")?.optJSONObject("channelMetadataRenderer")
            val name = metadata?.optString("title")?.takeIf { it.isNotBlank() } ?: "YouTube Channel"
            val desc = metadata?.optString("description") ?: ""
            val avatar = metadata?.optJSONObject("avatar")?.optJSONArray("thumbnails")
                ?.let { it.optJSONObject(it.length() - 1)?.optString("url") } ?: ""
            val videos = parseVideosFromJson(data).map {
                it.copy(
                    uploaderName = it.uploaderName.ifBlank { name },
                    uploaderId = it.uploaderId.ifBlank { channelId }
                )
            }
            ChannelInfo(
                id = channelId,
                name = name,
                avatar = avatar,
                description = desc,
                videos = if (videos.isNotEmpty()) videos else fallbackStreams
            )
        }.getOrElse {
            ChannelInfo(
                id = channelId,
                name = "YouTube Channel",
                videos = fallbackStreams
            )
        }

        cache[key] = info
        info
    }

    suspend fun fetchFeed(channelIds: List<String>): List<StreamItem> = withContext(Dispatchers.IO) {
        val results = mutableListOf<StreamItem>()
        for (id in channelIds.take(15)) {
            if (!id.startsWith("UC")) continue
            runCatching {
                val xml = fetchUrl("https://www.youtube.com/feeds/videos.xml?channel_id=${URLEncoder.encode(id, "UTF-8")}")
                results.addAll(parseRssXml(xml).take(6))
            }
        }
        results.distinctBy { it.id }
    }

    private fun parseRssXml(xml: String): List<StreamItem> {
        val author = Regex("<author>\\s*<name>(.*?)</name>", RegexOption.DOT_MATCHES_ALL)
            .find(xml)?.groupValues?.get(1)?.trim() ?: "Channel"
        val channelId = Regex("<yt:channelId>(.*?)</yt:channelId>")
            .find(xml)?.groupValues?.get(1)?.trim() ?: ""
        val entries = Regex("<entry>(.*?)</entry>", RegexOption.DOT_MATCHES_ALL).findAll(xml)
        return entries.mapNotNull { m ->
            val block = m.groupValues[1]
            val videoId = Regex("<yt:videoId>(.*?)</yt:videoId>").find(block)?.groupValues?.get(1)?.trim()
                ?: return@mapNotNull null
            val title = Regex("<title>(.*?)</title>", RegexOption.DOT_MATCHES_ALL)
                .find(block)?.groupValues?.get(1)?.trim() ?: "Untitled"
            val published = Regex("<published>(.*?)</published>").find(block)?.groupValues?.get(1)?.take(10) ?: ""
            StreamItem(
                id = videoId,
                title = decodeXml(title),
                uploaderName = decodeXml(author),
                uploaderId = channelId,
                thumbnail = "https://i.ytimg.com/vi/$videoId/hqdefault.jpg",
                uploadedDate = published
            )
        }.toList()
    }

    private fun decodeXml(s: String): String = s
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")

    private fun parseChapters(description: String): List<ChapterItem> {
        val regex = Regex("^(?:(\\d{1,2}):)?(\\d{1,2}):(\\d{2})\\s+[-–—]?\\s*(.+)$")
        return description.lines().mapNotNull { line ->
            val m = regex.matchEntire(line.trim()) ?: return@mapNotNull null
            val h = m.groupValues[1].toIntOrNull() ?: 0
            val min = m.groupValues[2].toIntOrNull() ?: 0
            val sec = m.groupValues[3].toIntOrNull() ?: 0
            ChapterItem(title = m.groupValues[4].trim(), startSeconds = h * 3600 + min * 60 + sec)
        }
    }

    private fun extractJsonAfterMarker(html: String, marker: String): JSONObject? {
        val idx = html.indexOf(marker)
        if (idx == -1) return null
        val start = html.indexOf('{', idx + marker.length)
        if (start == -1) return null

        var depth = 0
        var inString = false
        var escaped = false
        for (i in start until html.length) {
            val ch = html[i]
            if (inString) {
                if (escaped) escaped = false
                else if (ch == '\\') escaped = true
                else if (ch == '"') inString = false
            } else {
                when (ch) {
                    '"' -> inString = true
                    '{' -> depth++
                    '}' -> {
                        depth--
                        if (depth == 0) {
                            return runCatching { JSONObject(html.substring(start, i + 1)) }.getOrNull()
                        }
                    }
                }
            }
        }
        return null
    }

    private fun parseVideosFromJson(root: JSONObject?): List<StreamItem> {
        if (root == null) return emptyList()
        val found = mutableListOf<StreamItem>()
        walkJson(root) { key, obj ->
            if (key == "videoRenderer" || key == "gridVideoRenderer" || key == "compactVideoRenderer") {
                val id = obj.optString("videoId")
                if (id.isNotBlank()) {
                    val title = textFromRuns(obj.optJSONObject("title")).ifBlank { "Untitled" }
                    val uploader = textFromRuns(obj.optJSONObject("ownerText"))
                        .ifBlank { textFromRuns(obj.optJSONObject("shortBylineText")) }
                        .ifBlank { textFromRuns(obj.optJSONObject("longBylineText")) }
                        .ifBlank { "YouTube Channel" }
                    val browseId = extractBrowseId(obj.optJSONObject("ownerText"))
                        .ifBlank { extractBrowseId(obj.optJSONObject("shortBylineText")) }
                    val durationText = textFromRuns(obj.optJSONObject("lengthText"))
                    val viewsText = textFromRuns(obj.optJSONObject("shortViewCountText"))
                        .ifBlank { textFromRuns(obj.optJSONObject("viewCountText")) }
                    val dateText = textFromRuns(obj.optJSONObject("publishedTimeText"))
                    val thumbArr = obj.optJSONObject("thumbnail")?.optJSONArray("thumbnails")
                    val thumb = thumbArr?.optJSONObject(thumbArr.length() - 1)?.optString("url")
                        ?.takeIf { it.isNotBlank() }
                        ?: "https://i.ytimg.com/vi/$id/hqdefault.jpg"
                    found.add(
                        StreamItem(
                            id = id,
                            title = title,
                            uploaderName = uploader,
                            uploaderId = browseId,
                            thumbnail = thumb,
                            durationText = durationText.ifBlank { "LIVE" },
                            viewCountText = viewsText,
                            uploadedDate = dateText,
                            isLive = durationText.isBlank()
                        )
                    )
                }
            }
        }
        return found.distinctBy { it.id }
    }

    private fun parseChannelsFromJson(root: JSONObject?): List<ChannelSummary> {
        if (root == null) return emptyList()
        val found = mutableListOf<ChannelSummary>()
        walkJson(root) { key, obj ->
            if (key == "channelRenderer") {
                val id = obj.optString("channelId")
                if (id.isNotBlank()) {
                    val name = textFromRuns(obj.optJSONObject("title")).ifBlank { "Channel" }
                    val subs = textFromRuns(obj.optJSONObject("subscriberCountText"))
                    val desc = textFromRuns(obj.optJSONObject("descriptionSnippet"))
                    val thumbs = obj.optJSONObject("thumbnail")?.optJSONArray("thumbnails")
                    var avatar = thumbs?.optJSONObject(thumbs.length() - 1)?.optString("url") ?: ""
                    if (avatar.startsWith("//")) avatar = "https:$avatar"
                    found.add(ChannelSummary(id = id, name = name, avatar = avatar, subscriberCountText = subs, description = desc))
                }
            }
        }
        return found.distinctBy { it.id }
    }

    private fun parseCommentsFromJson(root: JSONObject?): List<CommentItem> {
        if (root == null) return emptyList()
        val found = mutableListOf<CommentItem>()
        walkJson(root) { key, obj ->
            if (key == "commentRenderer") {
                val text = textFromRuns(obj.optJSONObject("contentText"))
                if (text.isNotBlank()) {
                    found.add(
                        CommentItem(
                            id = obj.optString("commentId", found.size.toString()),
                            author = textFromRuns(obj.optJSONObject("authorText")).ifBlank { "Viewer" },
                            text = text,
                            publishedTime = textFromRuns(obj.optJSONObject("publishedTimeText")),
                            likeCount = textFromRuns(obj.optJSONObject("voteCount")).ifBlank { "0" }
                        )
                    )
                }
            }
        }
        return found.take(20)
    }

    private fun walkJson(node: Any?, onObject: (String, JSONObject) -> Unit) {
        when (node) {
            is JSONObject -> {
                val keys = node.keys()
                while (keys.hasNext()) {
                    val key = keys.next()
                    val child = node.opt(key)
                    if (child is JSONObject) {
                        onObject(key, child)
                        walkJson(child, onObject)
                    } else if (child is JSONArray) {
                        walkJson(child, onObject)
                    }
                }
            }
            is JSONArray -> {
                for (i in 0 until node.length()) {
                    walkJson(node.opt(i), onObject)
                }
            }
        }
    }

    private fun textFromRuns(obj: JSONObject?): String {
        if (obj == null) return ""
        val simple = obj.optString("simpleText")
        if (simple.isNotBlank()) return simple
        val runs = obj.optJSONArray("runs") ?: return ""
        return buildString {
            for (i in 0 until runs.length()) {
                append(runs.optJSONObject(i)?.optString("text") ?: "")
            }
        }
    }

    private fun extractBrowseId(obj: JSONObject?): String {
        val runs = obj?.optJSONArray("runs") ?: return ""
        return runs.optJSONObject(0)
            ?.optJSONObject("navigationEndpoint")
            ?.optJSONObject("browseEndpoint")
            ?.optString("browseId") ?: ""
    }
}
