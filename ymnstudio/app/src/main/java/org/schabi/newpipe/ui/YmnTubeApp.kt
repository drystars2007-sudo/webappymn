@file:OptIn(ExperimentalMaterial3Api::class)

package org.schabi.newpipe.ui

import android.annotation.SuppressLint
import android.content.Intent
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import coil.compose.AsyncImage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.schabi.newpipe.R
import org.schabi.newpipe.data.LocalStore
import org.schabi.newpipe.model.*
import org.schabi.newpipe.network.YouTubeRepository

@Composable
fun YmnTubeApp() {
    val context = LocalContext.current
    val store = remember { LocalStore(context) }
    var appState by remember { mutableStateOf(store.load()) }

    fun updateState(transform: (PersistedAppState) -> PersistedAppState) {
        val next = transform(appState)
        appState = next
        store.save(next)
    }

    var destination by remember { mutableStateOf(NavDestination.HOME) }
    var activeChannelId by remember { mutableStateOf<String?>(null) }
    var activePlaylistId by remember { mutableStateOf<String?>(null) }
    var searchQuery by remember { mutableStateOf("") }
    var searchMode by remember { mutableStateOf(false) }
    var searchInput by remember { mutableStateOf("") }
    var suggestions by remember { mutableStateOf<List<String>>(emptyList()) }

    var playQueue by remember { mutableStateOf<List<StreamItem>>(emptyList()) }
    var currentQueueIndex by remember { mutableStateOf(-1) }
    var playerOpen by remember { mutableStateOf(false) }
    var playerMinimized by remember { mutableStateOf(false) }
    var playerStartSeconds by remember { mutableStateOf(0) }

    var playlistModalStream by remember { mutableStateOf<StreamItem?>(null) }
    var downloadModalStream by remember { mutableStateOf<StreamItem?>(null) }

    val snackbarHostState = remember { SnackbarHostState() }
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    fun showToast(msg: String) {
        scope.launch {
            snackbarHostState.currentSnackbarData?.dismiss()
            snackbarHostState.showSnackbar(msg)
        }
    }

    fun playStream(stream: StreamItem, startSec: Int = 0) {
        val existingIdx = playQueue.indexOfFirst { it.id == stream.id }
        if (existingIdx != -1) {
            currentQueueIndex = existingIdx
        } else {
            playQueue = listOf(stream) + playQueue
            currentQueueIndex = 0
        }
        playerStartSeconds = startSec
        playerOpen = true
        playerMinimized = false

        if (appState.settings.enableWatchHistory) {
            updateState { s ->
                val prev = s.history.find { it.stream.id == stream.id }
                val filtered = s.history.filterNot { it.stream.id == stream.id }
                val entry = HistoryEntry(
                    stream = stream,
                    accessDate = System.currentTimeMillis(),
                    repeatCount = (prev?.repeatCount ?: 0) + 1
                )
                s.copy(history = (listOf(entry) + filtered).take(200))
            }
        }
    }

    fun playAll(streams: List<StreamItem>) {
        if (streams.isEmpty()) return
        playQueue = streams
        currentQueueIndex = 0
        playerStartSeconds = 0
        playerOpen = true
        playerMinimized = false
    }

    fun navigateTo(dest: NavDestination, channelId: String? = null, playlistId: String? = null, query: String? = null) {
        destination = dest
        if (channelId != null) activeChannelId = channelId
        if (playlistId != null) activePlaylistId = playlistId
        if (query != null) searchQuery = query
        if (playerOpen) playerMinimized = true
    }

    fun submitSearch(q: String) {
        val trimmed = q.trim()
        if (trimmed.isEmpty()) return
        searchMode = false
        suggestions = emptyList()
        if (appState.settings.enableSearchHistory) {
            updateState { s ->
                s.copy(searchHistory = (listOf(trimmed) + s.searchHistory.filterNot { it == trimmed }).take(25))
            }
        }
        navigateTo(NavDestination.SEARCH, query = trimmed)
    }

    // Progress simulated downloads
    LaunchedEffect(appState.downloads) {
        val hasActive = appState.downloads.any { it.status == "queued" || it.status == "downloading" }
        if (hasActive) {
            delay(700)
            updateState { s ->
                s.copy(
                    downloads = s.downloads.map { d ->
                        when (d.status) {
                            "queued" -> d.copy(status = "downloading", progress = 10)
                            "downloading" -> {
                                val next = (d.progress + 20).coerceAtMost(100)
                                d.copy(progress = next, status = if (next >= 100) "completed" else "downloading")
                            }
                            else -> d
                        }
                    }
                )
            }
        }
    }

    // Live search suggestions
    LaunchedEffect(searchInput, searchMode) {
        if (!searchMode || searchInput.isBlank()) {
            suggestions = emptyList()
        } else {
            delay(180)
            suggestions = YouTubeRepository.fetchSuggestions(searchInput)
        }
    }

    BackHandler(enabled = drawerState.isOpen || searchMode || (playerOpen && !playerMinimized) || destination != NavDestination.HOME) {
        when {
            drawerState.isOpen -> scope.launch { drawerState.close() }
            searchMode -> searchMode = false
            playerOpen && !playerMinimized -> playerMinimized = true
            destination != NavDestination.HOME -> destination = NavDestination.HOME
        }
    }

    YmnTubeTheme(mode = appState.settings.theme) {
        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                ModalDrawerSheet(modifier = Modifier.width(280.dp)) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(160.dp)
                            .background(Color(0xFF992722))
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.background_header),
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            alpha = 0.55f,
                            modifier = Modifier.fillMaxSize()
                        )
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.Bottom
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Image(
                                    painter = painterResource(id = R.mipmap.ic_launcher),
                                    contentDescription = "YmnTube",
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                )
                                Spacer(Modifier.width(12.dp))
                                Text("YmnTube", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                            }
                            Spacer(Modifier.height(10.dp))
                            Text("YouTube", color = Color.White.copy(alpha = 0.9f), fontSize = 12.sp)
                        }
                    }

                    Spacer(Modifier.height(8.dp))
                    val drawerItems = buildList {
                        add(Triple(NavDestination.HOME, "Home", Icons.Default.Home))
                        add(Triple(NavDestination.SUBSCRIPTIONS, "Subscriptions", Icons.Default.Subscriptions))
                        add(Triple(NavDestination.FEED, "What's New", Icons.Default.RssFeed))
                        add(Triple(NavDestination.BOOKMARKS, "Bookmarked Playlists", Icons.Default.Bookmark))
                        add(Triple(NavDestination.DOWNLOADS, "Downloads", Icons.Default.Download))
                        if (appState.settings.enableWatchHistory) {
                            add(Triple(NavDestination.HISTORY, "History", Icons.Default.History))
                        }
                        add(Triple(NavDestination.TRENDING, "Trending", Icons.Default.Whatshot))
                    }
                    drawerItems.forEach { (dest, label, icon) ->
                        NavigationDrawerItem(
                            label = { Text(label) },
                            selected = destination == dest,
                            icon = { Icon(icon, contentDescription = null) },
                            onClick = {
                                navigateTo(dest)
                                scope.launch { drawerState.close() }
                            },
                            modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                        )
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                    NavigationDrawerItem(
                        label = { Text("Settings") },
                        selected = destination == NavDestination.SETTINGS,
                        icon = { Icon(Icons.Default.Settings, contentDescription = null) },
                        onClick = {
                            navigateTo(NavDestination.SETTINGS)
                            scope.launch { drawerState.close() }
                        },
                        modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                    )
                    NavigationDrawerItem(
                        label = { Text("About") },
                        selected = destination == NavDestination.ABOUT,
                        icon = { Icon(Icons.Default.Info, contentDescription = null) },
                        onClick = {
                            navigateTo(NavDestination.ABOUT)
                            scope.launch { drawerState.close() }
                        },
                        modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                    )
                }
            }
        ) {
            Scaffold(
                snackbarHost = { SnackbarHost(snackbarHostState) },
                topBar = {
                    TopAppBar(
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = Color.Black,
                            titleContentColor = Color.White,
                            navigationIconContentColor = Color.White,
                            actionIconContentColor = Color.White
                        ),
                        navigationIcon = {
                            if (searchMode) {
                                IconButton(onClick = { searchMode = false }) {
                                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                                }
                            } else {
                                IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                    Icon(Icons.Default.Menu, contentDescription = "Menu")
                                }
                            }
                        },
                        title = {
                            if (searchMode) {
                                OutlinedTextField(
                                    value = searchInput,
                                    onValueChange = { searchInput = it },
                                    placeholder = { Text("Search YouTube...", color = Color.White.copy(alpha = 0.6f)) },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                                    keyboardActions = KeyboardActions(onSearch = { submitSearch(searchInput) }),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White,
                                        focusedBorderColor = Color.Transparent,
                                        unfocusedBorderColor = Color.Transparent
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                )
                            } else {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.clickable { navigateTo(NavDestination.HOME) }
                                ) {
                                    Image(
                                        painter = painterResource(id = R.drawable.ymntube_toolbar_logo),
                                        contentDescription = "YmnTube",
                                        modifier = Modifier.size(36.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text("YmnTube", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                }
                            }
                        },
                        actions = {
                            if (searchMode) {
                                IconButton(onClick = {
                                    if (searchInput.isNotEmpty()) searchInput = "" else submitSearch(searchInput)
                                }) {
                                    Icon(Icons.Default.Close, contentDescription = "Clear")
                                }
                            } else {
                                IconButton(onClick = { searchMode = true }) {
                                    Icon(Icons.Default.Search, contentDescription = "Search")
                                }
                                IconButton(onClick = {
                                    val modes = ThemeMode.entries
                                    val next = modes[(modes.indexOf(appState.settings.theme) + 1) % modes.size]
                                    updateState { it.copy(settings = it.settings.copy(theme = next)) }
                                }) {
                                    Icon(
                                        if (appState.settings.theme == ThemeMode.LIGHT) Icons.Default.LightMode else Icons.Default.DarkMode,
                                        contentDescription = "Toggle theme"
                                    )
                                }
                            }
                        }
                    )
                },
                bottomBar = {
                    NavigationBar {
                        NavigationBarItem(
                            selected = destination == NavDestination.HOME,
                            onClick = { navigateTo(NavDestination.HOME) },
                            icon = { Icon(Icons.Default.Home, contentDescription = null) },
                            label = { Text("Home") }
                        )
                        NavigationBarItem(
                            selected = destination == NavDestination.DOWNLOADS,
                            onClick = { navigateTo(NavDestination.DOWNLOADS) },
                            icon = { Icon(Icons.Default.Download, contentDescription = null) },
                            label = { Text("Downloads") }
                        )
                        NavigationBarItem(
                            selected = destination == NavDestination.SETTINGS,
                            onClick = { navigateTo(NavDestination.SETTINGS) },
                            icon = { Icon(Icons.Default.Settings, contentDescription = null) },
                            label = { Text("Settings") }
                        )
                        if (appState.settings.enableWatchHistory) {
                            NavigationBarItem(
                                selected = destination == NavDestination.HISTORY,
                                onClick = { navigateTo(NavDestination.HISTORY) },
                                icon = { Icon(Icons.Default.History, contentDescription = null) },
                                label = { Text("History") }
                            )
                        }
                    }
                }
            ) { innerPadding ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    when (destination) {
                        NavDestination.HOME -> HomeScreen(
                            appState = appState,
                            onPlay = { playStream(it) },
                            onOpenChannel = { navigateTo(NavDestination.CHANNEL, channelId = it) },
                            onAddToPlaylist = { playlistModalStream = it },
                            onDownload = { downloadModalStream = it },
                            onCreatePlaylist = { name ->
                                val pl = PlaylistInfo(id = "pl-${System.currentTimeMillis()}", name = name)
                                updateState { it.copy(playlists = listOf(pl) + it.playlists) }
                            },
                            onOpenPlaylist = { navigateTo(NavDestination.PLAYLIST, playlistId = it) },
                            onDeletePlaylist = { id ->
                                updateState { it.copy(playlists = it.playlists.filterNot { p -> p.id == id }) }
                            },
                            onPlayAll = { playAll(it) }
                        )
                        NavDestination.TRENDING -> TrendingScreen(
                            viewMode = appState.settings.viewMode,
                            onPlay = { playStream(it) },
                            onOpenChannel = { navigateTo(NavDestination.CHANNEL, channelId = it) },
                            onAddToPlaylist = { playlistModalStream = it },
                            onDownload = { downloadModalStream = it }
                        )
                        NavDestination.BOOKMARKS -> BookmarksScreen(
                            playlists = appState.playlists,
                            onCreatePlaylist = { name ->
                                val pl = PlaylistInfo(id = "pl-${System.currentTimeMillis()}", name = name)
                                updateState { it.copy(playlists = listOf(pl) + it.playlists) }
                            },
                            onOpenPlaylist = { navigateTo(NavDestination.PLAYLIST, playlistId = it) },
                            onDeletePlaylist = { id ->
                                updateState { it.copy(playlists = it.playlists.filterNot { p -> p.id == id }) }
                            },
                            onPlayAll = { playAll(it) }
                        )
                        NavDestination.PLAYLIST -> {
                            val pl = appState.playlists.find { it.id == activePlaylistId }
                            PlaylistDetailScreen(
                                playlist = pl,
                                onPlay = { playStream(it) },
                                onPlayAll = { playAll(it) },
                                onRemoveItem = { streamId ->
                                    if (pl != null) {
                                        updateState { s ->
                                            s.copy(
                                                playlists = s.playlists.map {
                                                    if (it.id == pl.id) it.copy(items = it.items.filterNot { x -> x.id == streamId }) else it
                                                }
                                            )
                                        }
                                    }
                                },
                                onOpenChannel = { navigateTo(NavDestination.CHANNEL, channelId = it) },
                                onAddToPlaylist = { playlistModalStream = it },
                                onDownload = { downloadModalStream = it }
                            )
                        }
                        NavDestination.SEARCH -> SearchScreen(
                            query = searchQuery,
                            viewMode = appState.settings.viewMode,
                            subscriptions = appState.subscriptions,
                            onPlay = { playStream(it) },
                            onOpenChannel = { navigateTo(NavDestination.CHANNEL, channelId = it) },
                            onToggleSubscribe = { ch ->
                                updateState { s ->
                                    val exists = s.subscriptions.any { it.id == ch.id }
                                    val next = if (exists) s.subscriptions.filterNot { it.id == ch.id }
                                    else listOf(SubscriptionChannel(ch.id, ch.name, avatar = ch.avatar, subscriberCountText = ch.subscriberCountText)) + s.subscriptions
                                    s.copy(subscriptions = next)
                                }
                            },
                            onAddToPlaylist = { playlistModalStream = it },
                            onDownload = { downloadModalStream = it }
                        )
                        NavDestination.CHANNEL -> activeChannelId?.let { chId ->
                            ChannelScreen(
                                channelId = chId,
                                subscriptions = appState.subscriptions,
                                viewMode = appState.settings.viewMode,
                                onPlay = { playStream(it) },
                                onPlayAll = { playAll(it) },
                                onToggleSubscribe = { ch ->
                                    updateState { s ->
                                        val exists = s.subscriptions.any { it.id == ch.id }
                                        val next = if (exists) s.subscriptions.filterNot { it.id == ch.id } else listOf(ch) + s.subscriptions
                                        s.copy(subscriptions = next)
                                    }
                                },
                                onAddToPlaylist = { playlistModalStream = it },
                                onDownload = { downloadModalStream = it }
                            )
                        }
                        NavDestination.SUBSCRIPTIONS -> SubscriptionsScreen(
                            subscriptions = appState.subscriptions,
                            onOpenChannel = { navigateTo(NavDestination.CHANNEL, channelId = it) },
                            onToggleNotify = { id ->
                                updateState { s ->
                                    s.copy(subscriptions = s.subscriptions.map {
                                        if (it.id == id) it.copy(notificationsEnabled = !it.notificationsEnabled) else it
                                    })
                                }
                            },
                            onUnsubscribe = { id ->
                                updateState { s -> s.copy(subscriptions = s.subscriptions.filterNot { it.id == id }) }
                            }
                        )
                        NavDestination.FEED -> FeedScreen(
                            subscriptions = appState.subscriptions,
                            viewMode = appState.settings.viewMode,
                            onPlay = { playStream(it) },
                            onOpenChannel = { navigateTo(NavDestination.CHANNEL, channelId = it) },
                            onAddToPlaylist = { playlistModalStream = it },
                            onDownload = { downloadModalStream = it }
                        )
                        NavDestination.HISTORY -> HistoryScreen(
                            history = appState.history,
                            onPlay = { playStream(it) },
                            onPlayAll = { playAll(it) },
                            onClear = {
                                updateState { it.copy(history = emptyList()) }
                                showToast("Watch history cleared")
                            },
                            onOpenChannel = { navigateTo(NavDestination.CHANNEL, channelId = it) },
                            onAddToPlaylist = { playlistModalStream = it },
                            onDownload = { downloadModalStream = it }
                        )
                        NavDestination.DOWNLOADS -> DownloadsScreen(
                            downloads = appState.downloads,
                            onPlay = { playStream(it) },
                            onTogglePause = { id ->
                                updateState { s ->
                                    s.copy(downloads = s.downloads.map { d ->
                                        if (d.id == id && d.status != "completed") {
                                            d.copy(status = if (d.status == "paused") "downloading" else "paused")
                                        } else d
                                    })
                                }
                            },
                            onDelete = { id ->
                                updateState { s -> s.copy(downloads = s.downloads.filterNot { it.id == id }) }
                            }
                        )
                        NavDestination.SETTINGS -> SettingsScreen(
                            settings = appState.settings,
                            onUpdate = { next -> updateState { it.copy(settings = next) } },
                            onClearWatchHistory = {
                                updateState { it.copy(history = emptyList()) }
                                showToast("Watch history cleared")
                            },
                            onClearSearchHistory = {
                                updateState { it.copy(searchHistory = emptyList()) }
                                showToast("Search history cleared")
                            },
                            onClearCache = {
                                YouTubeRepository.clearCache()
                                showToast("Metadata cache wiped")
                            }
                        )
                        NavDestination.ABOUT -> AboutScreen()
                    }

                    // Search Suggestions / History Dropdown
                    if (searchMode) {
                        val listToShow = if (searchInput.isBlank()) appState.searchHistory else suggestions
                        if (listToShow.isNotEmpty()) {
                            Surface(
                                color = MaterialTheme.colorScheme.surface,
                                shadowElevation = 8.dp,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(max = 320.dp)
                            ) {
                                LazyColumn {
                                    items(listToShow) { term ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable {
                                                    searchInput = term
                                                    submitSearch(term)
                                                }
                                                .padding(horizontal = 16.dp, vertical = 12.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                if (searchInput.isBlank()) Icons.Default.History else Icons.Default.Search,
                                                contentDescription = null,
                                                modifier = Modifier.size(18.dp),
                                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                            Spacer(Modifier.width(12.dp))
                                            Text(term, fontSize = 14.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Mini-player Bar
                    val activeStream = playQueue.getOrNull(currentQueueIndex)
                    if (playerOpen && playerMinimized && activeStream != null) {
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            shadowElevation = 8.dp,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .padding(8.dp)
                                .fillMaxWidth()
                                .clickable { playerMinimized = false }
                        ) {
                            Row(
                                modifier = Modifier.padding(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                AsyncImage(
                                    model = activeStream.thumbnail,
                                    contentDescription = activeStream.title,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(width = 72.dp, height = 42.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                )
                                Spacer(Modifier.width(10.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(activeStream.title, maxLines = 1, overflow = TextOverflow.Ellipsis, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                    Text(activeStream.uploaderName, maxLines = 1, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                IconButton(onClick = { playerMinimized = false }) {
                                    Icon(Icons.Default.KeyboardArrowUp, contentDescription = "Expand")
                                }
                                IconButton(onClick = { playerOpen = false }) {
                                    Icon(Icons.Default.Close, contentDescription = "Close")
                                }
                            }
                        }
                    }
                }
            }

            // Fullscreen Video Detail Player Overlay
            val currentStream = playQueue.getOrNull(currentQueueIndex)
            if (playerOpen && !playerMinimized && currentStream != null) {
                VideoPlayerScreen(
                    stream = currentStream,
                    startSeconds = playerStartSeconds,
                    playQueue = playQueue,
                    currentQueueIndex = currentQueueIndex,
                    settings = appState.settings,
                    subscriptions = appState.subscriptions,
                    onMinimize = { playerMinimized = true },
                    onClose = { playerOpen = false },
                    onSelectQueueIndex = {
                        currentQueueIndex = it
                        playerStartSeconds = 0
                    },
                    onSeekTo = { playerStartSeconds = it },
                    onPlayStream = { playStream(it) },
                    onToggleSubscribe = { ch ->
                        updateState { s ->
                            val exists = s.subscriptions.any { it.id == ch.id }
                            val next = if (exists) s.subscriptions.filterNot { it.id == ch.id } else listOf(ch) + s.subscriptions
                            s.copy(subscriptions = next)
                        }
                    },
                    onAddToPlaylist = { playlistModalStream = it },
                    onDownload = { downloadModalStream = it },
                    onOpenChannel = {
                        playerMinimized = true
                        navigateTo(NavDestination.CHANNEL, channelId = it)
                    },
                    onShare = {
                        val intent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_TEXT, "https://www.youtube.com/watch?v=${currentStream.id}")
                        }
                        context.startActivity(Intent.createChooser(intent, "Share stream"))
                    }
                )
            }

            // Add to Playlist Dialog
            playlistModalStream?.let { stream ->
                var newPlName by remember { mutableStateOf("") }
                AlertDialog(
                    onDismissRequest = { playlistModalStream = null },
                    title = { Text("Add to Playlist") },
                    text = {
                        Column {
                            appState.playlists.forEach { pl ->
                                val inList = pl.items.any { it.id == stream.id }
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            updateState { s ->
                                                s.copy(playlists = s.playlists.map { p ->
                                                    if (p.id != pl.id) p
                                                    else if (inList) p.copy(items = p.items.filterNot { it.id == stream.id })
                                                    else p.copy(items = p.items + stream)
                                                })
                                            }
                                        }
                                        .padding(vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Checkbox(checked = inList, onCheckedChange = null)
                                    Spacer(Modifier.width(8.dp))
                                    Text("${pl.name} (${pl.items.size})")
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                OutlinedTextField(
                                    value = newPlName,
                                    onValueChange = { newPlName = it },
                                    placeholder = { Text("New playlist...") },
                                    singleLine = true,
                                    modifier = Modifier.weight(1f)
                                )
                                Spacer(Modifier.width(6.dp))
                                Button(onClick = {
                                    if (newPlName.isNotBlank()) {
                                        val pl = PlaylistInfo(
                                            id = "pl-${System.currentTimeMillis()}",
                                            name = newPlName.trim(),
                                            items = listOf(stream)
                                        )
                                        updateState { it.copy(playlists = listOf(pl) + it.playlists) }
                                        newPlName = ""
                                    }
                                }) {
                                    Text("Create")
                                }
                            }
                        }
                    },
                    confirmButton = {
                        TextButton(onClick = { playlistModalStream = null }) { Text("Done") }
                    }
                )
            }

            // Download Dialog
            downloadModalStream?.let { stream ->
                var kind by remember { mutableStateOf("video") }
                var quality by remember { mutableStateOf("1080p MP4") }
                AlertDialog(
                    onDismissRequest = { downloadModalStream = null },
                    title = { Text("Download Stream") },
                    text = {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(stream.title, maxLines = 2, overflow = TextOverflow.Ellipsis, fontSize = 13.sp)
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                listOf("video" to "Video", "audio" to "Audio", "subtitle" to "Subtitle").forEach { (k, label) ->
                                    FilterChip(
                                        selected = kind == k,
                                        onClick = {
                                            kind = k
                                            quality = when (k) {
                                                "audio" -> "M4A 128kbps"
                                                "subtitle" -> "English SRT"
                                                else -> "1080p MP4"
                                            }
                                        },
                                        label = { Text(label) }
                                    )
                                }
                            }
                        }
                    },
                    confirmButton = {
                        Button(onClick = {
                            val mission = DownloadMission(
                                id = "dl-${System.currentTimeMillis()}",
                                stream = stream,
                                kind = kind,
                                format = kind.uppercase(),
                                quality = quality
                            )
                            updateState { it.copy(downloads = listOf(mission) + it.downloads) }
                            downloadModalStream = null
                            showToast("Download queued")
                        }) {
                            Text("Download")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { downloadModalStream = null }) { Text("Cancel") }
                    }
                )
            }
        }
    }
}

@Composable
private fun StreamRowItem(
    stream: StreamItem,
    onPlay: () -> Unit,
    onOpenChannel: () -> Unit,
    onAddToPlaylist: () -> Unit,
    onDownload: () -> Unit
) {
    var menuExpanded by remember { mutableStateOf(false) }
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onPlay() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(10.dp)
    ) {
        Row(modifier = Modifier.padding(10.dp), verticalAlignment = Alignment.Top) {
            Box(
                modifier = Modifier
                    .size(width = 148.dp, height = 84.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color.Black)
            ) {
                AsyncImage(
                    model = stream.thumbnail,
                    contentDescription = stream.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                if (stream.durationText.isNotBlank()) {
                    Text(
                        text = stream.durationText,
                        color = Color.White,
                        fontSize = 10.sp,
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(4.dp)
                            .background(
                                if (stream.isLive) Color(0xFFE53935) else Color.Black.copy(alpha = 0.8f),
                                RoundedCornerShape(4.dp)
                            )
                            .padding(horizontal = 5.dp, vertical = 2.dp)
                    )
                }
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = stream.title,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = stream.uploaderName,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.clickable {
                        if (stream.uploaderId.isNotBlank()) onOpenChannel()
                    }
                )
                val meta = listOf(stream.viewCountText, stream.uploadedDate).filter { it.isNotBlank() }.joinToString(" • ")
                if (meta.isNotBlank()) {
                    Text(meta, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Box {
                IconButton(onClick = { menuExpanded = true }) {
                    Icon(Icons.Default.MoreVert, contentDescription = "Options")
                }
                DropdownMenu(expanded = menuExpanded, onDismissRequest = { menuExpanded = false }) {
                    DropdownMenuItem(
                        text = { Text("Add to playlist") },
                        leadingIcon = { Icon(Icons.Default.PlaylistAdd, contentDescription = null) },
                        onClick = {
                            menuExpanded = false
                            onAddToPlaylist()
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Download") },
                        leadingIcon = { Icon(Icons.Default.Download, contentDescription = null) },
                        onClick = {
                            menuExpanded = false
                            onDownload()
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun HomeScreen(
    appState: PersistedAppState,
    onPlay: (StreamItem) -> Unit,
    onOpenChannel: (String) -> Unit,
    onAddToPlaylist: (StreamItem) -> Unit,
    onDownload: (StreamItem) -> Unit,
    onCreatePlaylist: (String) -> Unit,
    onOpenPlaylist: (String) -> Unit,
    onDeletePlaylist: (String) -> Unit,
    onPlayAll: (List<StreamItem>) -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }
    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = selectedTab) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }, text = { Text("Trending") })
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }, text = { Text("Bookmarked Playlists") })
        }
        if (selectedTab == 0) {
            TrendingScreen(appState.settings.viewMode, onPlay, onOpenChannel, onAddToPlaylist, onDownload)
        } else {
            BookmarksScreen(appState.playlists, onCreatePlaylist, onOpenPlaylist, onDeletePlaylist, onPlayAll)
        }
    }
}

@Composable
private fun TrendingScreen(
    viewMode: ItemViewMode,
    onPlay: (StreamItem) -> Unit,
    onOpenChannel: (String) -> Unit,
    onAddToPlaylist: (StreamItem) -> Unit,
    onDownload: (StreamItem) -> Unit
) {
    var category by remember { mutableStateOf("now") }
    var items by remember { mutableStateOf<List<StreamItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(category) {
        loading = true
        items = YouTubeRepository.fetchTrending(category)
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            val cats = listOf("now" to "Trending", "music" to "Music", "gaming" to "Gaming", "movies" to "Movies")
            items(cats) { (id, label) ->
                FilterChip(selected = category == id, onClick = { category = id }, label = { Text(label) })
            }
        }
        Spacer(Modifier.height(8.dp))
        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(items, key = { it.id }) { stream ->
                    StreamRowItem(
                        stream = stream,
                        onPlay = { onPlay(stream) },
                        onOpenChannel = { onOpenChannel(stream.uploaderId) },
                        onAddToPlaylist = { onAddToPlaylist(stream) },
                        onDownload = { onDownload(stream) }
                    )
                }
            }
        }
    }
}

@Composable
private fun BookmarksScreen(
    playlists: List<PlaylistInfo>,
    onCreatePlaylist: (String) -> Unit,
    onOpenPlaylist: (String) -> Unit,
    onDeletePlaylist: (String) -> Unit,
    onPlayAll: (List<StreamItem>) -> Unit
) {
    var name by remember { mutableStateOf("") }
    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                placeholder = { Text("New playlist name...") },
                singleLine = true,
                modifier = Modifier.weight(1f)
            )
            Spacer(Modifier.width(8.dp))
            Button(onClick = {
                if (name.isNotBlank()) {
                    onCreatePlaylist(name.trim())
                    name = ""
                }
            }) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(Modifier.width(4.dp))
                Text("Create")
            }
        }
        Spacer(Modifier.height(12.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(playlists, key = { it.id }) { pl ->
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { onOpenPlaylist(pl.id) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Bookmark, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(pl.name, fontWeight = FontWeight.SemiBold)
                            Text("${pl.items.size} streams", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        if (pl.items.isNotEmpty()) {
                            IconButton(onClick = { onPlayAll(pl.items) }) {
                                Icon(Icons.Default.PlayArrow, contentDescription = "Play all")
                            }
                        }
                        IconButton(onClick = { onDeletePlaylist(pl.id) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PlaylistDetailScreen(
    playlist: PlaylistInfo?,
    onPlay: (StreamItem) -> Unit,
    onPlayAll: (List<StreamItem>) -> Unit,
    onRemoveItem: (String) -> Unit,
    onOpenChannel: (String) -> Unit,
    onAddToPlaylist: (StreamItem) -> Unit,
    onDownload: (StreamItem) -> Unit
) {
    if (playlist == null) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("Playlist not found") }
        return
    }
    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("${playlist.name} (${playlist.items.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            if (playlist.items.isNotEmpty()) {
                Button(onClick = { onPlayAll(playlist.items) }) { Text("Play All") }
            }
        }
        Spacer(Modifier.height(10.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(playlist.items, key = { it.id }) { stream ->
                StreamRowItem(
                    stream = stream,
                    onPlay = { onPlay(stream) },
                    onOpenChannel = { onOpenChannel(stream.uploaderId) },
                    onAddToPlaylist = { onAddToPlaylist(stream) },
                    onDownload = { onDownload(stream) }
                )
            }
        }
    }
}

@Composable
private fun SearchScreen(
    query: String,
    viewMode: ItemViewMode,
    subscriptions: List<SubscriptionChannel>,
    onPlay: (StreamItem) -> Unit,
    onOpenChannel: (String) -> Unit,
    onToggleSubscribe: (ChannelSummary) -> Unit,
    onAddToPlaylist: (StreamItem) -> Unit,
    onDownload: (StreamItem) -> Unit
) {
    var streams by remember { mutableStateOf<List<StreamItem>>(emptyList()) }
    var channels by remember { mutableStateOf<List<ChannelSummary>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(query) {
        loading = true
        val res = YouTubeRepository.search(query)
        streams = res.first
        channels = res.second
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        Text("Results for: $query", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
        Spacer(Modifier.height(8.dp))
        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(channels, key = { "ch-${it.id}" }) { ch ->
                    val sub = subscriptions.any { it.id == ch.id }
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable { onOpenChannel(ch.id) },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            AsyncImage(
                                model = ch.avatar.ifBlank { R.mipmap.ic_launcher },
                                contentDescription = ch.name,
                                modifier = Modifier.size(44.dp).clip(CircleShape),
                                contentScale = ContentScale.Crop
                            )
                            Spacer(Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(ch.name, fontWeight = FontWeight.SemiBold)
                                Text(ch.subscriberCountText, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Button(onClick = { onToggleSubscribe(ch) }) {
                                Text(if (sub) "Subscribed" else "Subscribe", fontSize = 12.sp)
                            }
                        }
                    }
                }
                items(streams, key = { it.id }) { stream ->
                    StreamRowItem(
                        stream = stream,
                        onPlay = { onPlay(stream) },
                        onOpenChannel = { onOpenChannel(stream.uploaderId) },
                        onAddToPlaylist = { onAddToPlaylist(stream) },
                        onDownload = { onDownload(stream) }
                    )
                }
            }
        }
    }
}

@Composable
private fun ChannelScreen(
    channelId: String,
    subscriptions: List<SubscriptionChannel>,
    viewMode: ItemViewMode,
    onPlay: (StreamItem) -> Unit,
    onPlayAll: (List<StreamItem>) -> Unit,
    onToggleSubscribe: (SubscriptionChannel) -> Unit,
    onAddToPlaylist: (StreamItem) -> Unit,
    onDownload: (StreamItem) -> Unit
) {
    var channel by remember { mutableStateOf<ChannelInfo?>(null) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(channelId) {
        loading = true
        channel = YouTubeRepository.fetchChannel(channelId)
        loading = false
    }

    if (loading || channel == null) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        return
    }
    val ch = channel!!
    val sub = subscriptions.any { it.id == ch.id }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column {
                    Image(
                        painter = painterResource(id = R.drawable.placeholder_channel_banner),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxWidth().height(110.dp)
                    )
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        AsyncImage(
                            model = ch.avatar.ifBlank { R.mipmap.ic_launcher },
                            contentDescription = ch.name,
                            modifier = Modifier.size(52.dp).clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(ch.name, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                            Text(ch.subscriberCountText, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Button(onClick = {
                            onToggleSubscribe(SubscriptionChannel(ch.id, ch.name, avatar = ch.avatar, subscriberCountText = ch.subscriberCountText))
                        }) {
                            Text(if (sub) "Subscribed" else "Subscribe", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
        items(ch.videos, key = { it.id }) { stream ->
            StreamRowItem(
                stream = stream,
                onPlay = { onPlay(stream) },
                onOpenChannel = {},
                onAddToPlaylist = { onAddToPlaylist(stream) },
                onDownload = { onDownload(stream) }
            )
        }
    }
}

@Composable
private fun SubscriptionsScreen(
    subscriptions: List<SubscriptionChannel>,
    onOpenChannel: (String) -> Unit,
    onToggleNotify: (String) -> Unit,
    onUnsubscribe: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Text("Subscriptions (${subscriptions.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        }
        items(subscriptions, key = { it.id }) { sub ->
            Card(
                modifier = Modifier.fillMaxWidth().clickable { onOpenChannel(sub.id) },
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(
                        model = sub.avatar.ifBlank { R.mipmap.ic_launcher },
                        contentDescription = sub.name,
                        modifier = Modifier.size(44.dp).clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(sub.name, fontWeight = FontWeight.SemiBold)
                        Text(sub.subscriberCountText.ifBlank { "YouTube" }, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    IconButton(onClick = { onToggleNotify(sub.id) }) {
                        Icon(
                            if (sub.notificationsEnabled) Icons.Default.Notifications else Icons.Default.NotificationsOff,
                            contentDescription = "Notifications"
                        )
                    }
                    TextButton(onClick = { onUnsubscribe(sub.id) }) {
                        Text("Unsubscribe", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun FeedScreen(
    subscriptions: List<SubscriptionChannel>,
    viewMode: ItemViewMode,
    onPlay: (StreamItem) -> Unit,
    onOpenChannel: (String) -> Unit,
    onAddToPlaylist: (StreamItem) -> Unit,
    onDownload: (StreamItem) -> Unit
) {
    var items by remember { mutableStateOf<List<StreamItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(subscriptions.size) {
        loading = true
        items = YouTubeRepository.fetchFeed(subscriptions.map { it.id })
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        Text("What's New", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Spacer(Modifier.height(8.dp))
        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        } else if (items.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No recent feed items from subscribed channels.")
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(items, key = { it.id }) { stream ->
                    StreamRowItem(
                        stream = stream,
                        onPlay = { onPlay(stream) },
                        onOpenChannel = { onOpenChannel(stream.uploaderId) },
                        onAddToPlaylist = { onAddToPlaylist(stream) },
                        onDownload = { onDownload(stream) }
                    )
                }
            }
        }
    }
}

@Composable
private fun HistoryScreen(
    history: List<HistoryEntry>,
    onPlay: (StreamItem) -> Unit,
    onPlayAll: (List<StreamItem>) -> Unit,
    onClear: () -> Unit,
    onOpenChannel: (String) -> Unit,
    onAddToPlaylist: (StreamItem) -> Unit,
    onDownload: (StreamItem) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("Watch History (${history.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            if (history.isNotEmpty()) {
                Row {
                    TextButton(onClick = { onPlayAll(history.map { it.stream }) }) { Text("Play All") }
                    TextButton(onClick = onClear) { Text("Clear") }
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        if (history.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("Watch history is empty.") }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(history, key = { it.stream.id }) { entry ->
                    StreamRowItem(
                        stream = entry.stream,
                        onPlay = { onPlay(entry.stream) },
                        onOpenChannel = { onOpenChannel(entry.stream.uploaderId) },
                        onAddToPlaylist = { onAddToPlaylist(entry.stream) },
                        onDownload = { onDownload(entry.stream) }
                    )
                }
            }
        }
    }
}

@Composable
private fun DownloadsScreen(
    downloads: List<DownloadMission>,
    onPlay: (StreamItem) -> Unit,
    onTogglePause: (String) -> Unit,
    onDelete: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        Text("Downloads", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Spacer(Modifier.height(8.dp))
        if (downloads.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No download missions queued.")
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(downloads, key = { it.id }) { d ->
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable { onPlay(d.stream) },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(d.stream.title, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Medium)
                                    Text("${d.format} • ${d.quality} • ${d.status}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                if (d.status != "completed") {
                                    IconButton(onClick = { onTogglePause(d.id) }) {
                                        Icon(if (d.status == "paused") Icons.Default.PlayArrow else Icons.Default.Pause, contentDescription = null)
                                    }
                                }
                                IconButton(onClick = { onDelete(d.id) }) {
                                    Icon(Icons.Default.Delete, contentDescription = null)
                                }
                            }
                            Spacer(Modifier.height(6.dp))
                            LinearProgressIndicator(progress = { d.progress / 100f }, modifier = Modifier.fillMaxWidth())
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SettingsScreen(
    settings: AppSettings,
    onUpdate: (AppSettings) -> Unit,
    onClearWatchHistory: () -> Unit,
    onClearSearchHistory: () -> Unit,
    onClearCache: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { Text("Settings", fontWeight = FontWeight.Bold, fontSize = 20.sp) }
        item {
            Text("Theme", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 6.dp)) {
                ThemeMode.entries.forEach { m ->
                    FilterChip(
                        selected = settings.theme == m,
                        onClick = { onUpdate(settings.copy(theme = m)) },
                        label = { Text(m.name.lowercase().replaceFirstChar { it.uppercase() }) }
                    )
                }
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Watch History")
                Switch(checked = settings.enableWatchHistory, onCheckedChange = { onUpdate(settings.copy(enableWatchHistory = it)) })
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Search History")
                Switch(checked = settings.enableSearchHistory, onCheckedChange = { onUpdate(settings.copy(enableSearchHistory = it)) })
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Autoplay Videos")
                Switch(checked = settings.autoplay, onCheckedChange = { onUpdate(settings.copy(autoplay = it)) })
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = onClearWatchHistory) { Text("Clear Watch History", fontSize = 12.sp) }
                OutlinedButton(onClick = onClearSearchHistory) { Text("Clear Search", fontSize = 12.sp) }
            }
        }
        item {
            OutlinedButton(onClick = onClearCache) { Text("Wipe Cached Metadata") }
        }
    }
}

@Composable
private fun AboutScreen() {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Image(
            painter = painterResource(id = R.mipmap.ic_launcher),
            contentDescription = "YmnTube",
            modifier = Modifier.size(80.dp).clip(RoundedCornerShape(16.dp))
        )
        Spacer(Modifier.height(14.dp))
        Text("YmnTube", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Text("Version 1.0.0 • GPL-3.0-or-later", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(16.dp))
        Text(
            "Privacy-respecting YouTube Android client with subscriptions, local playlists, watch history, and customizable themes.",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
private fun VideoPlayerScreen(
    stream: StreamItem,
    startSeconds: Int,
    playQueue: List<StreamItem>,
    currentQueueIndex: Int,
    settings: AppSettings,
    subscriptions: List<SubscriptionChannel>,
    onMinimize: () -> Unit,
    onClose: () -> Unit,
    onSelectQueueIndex: (Int) -> Unit,
    onSeekTo: (Int) -> Unit,
    onPlayStream: (StreamItem) -> Unit,
    onToggleSubscribe: (SubscriptionChannel) -> Unit,
    onAddToPlaylist: (StreamItem) -> Unit,
    onDownload: (StreamItem) -> Unit,
    onOpenChannel: (String) -> Unit,
    onShare: () -> Unit
) {
    var detail by remember { mutableStateOf<VideoDetail?>(null) }
    var tabIndex by remember { mutableStateOf(0) }

    LaunchedEffect(stream.id) {
        detail = YouTubeRepository.fetchVideoDetail(stream)
    }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Top bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.Black)
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(onClick = onMinimize) {
                    Icon(Icons.Default.KeyboardArrowDown, contentDescription = "Minimize", tint = Color.White)
                }
                Text(stream.title, color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f), fontSize = 13.sp)
                Row {
                    IconButton(enabled = currentQueueIndex > 0, onClick = { onSelectQueueIndex(currentQueueIndex - 1) }) {
                        Icon(Icons.Default.SkipPrevious, contentDescription = "Previous", tint = Color.White)
                    }
                    IconButton(enabled = currentQueueIndex < playQueue.lastIndex, onClick = { onSelectQueueIndex(currentQueueIndex + 1) }) {
                        Icon(Icons.Default.SkipNext, contentDescription = "Next", tint = Color.White)
                    }
                    IconButton(onClick = onClose) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                    }
                }
            }

            // Embedded privacy-enhanced player WebView
            val embedUrl = "https://www.youtube-nocookie.com/embed/${stream.id}?autoplay=${if (settings.autoplay) 1 else 0}&start=$startSeconds&rel=0"
            AndroidView(
                factory = { ctx ->
                    WebView(ctx).apply {
                        this.settings.javaScriptEnabled = true
                        this.settings.domStorageEnabled = true
                        this.settings.mediaPlaybackRequiresUserGesture = false
                        webChromeClient = WebChromeClient()
                        webViewClient = WebViewClient()
                        loadUrl(embedUrl)
                    }
                },
                update = { webView ->
                    if (webView.url != embedUrl) {
                        webView.loadUrl(embedUrl)
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f)
                    .background(Color.Black)
            )

            LazyColumn(
                modifier = Modifier.weight(1f).padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    Text(detail?.stream?.title ?: stream.title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    val meta = listOf(stream.viewCountText, stream.uploadedDate).filter { it.isNotBlank() }.joinToString(" • ")
                    if (meta.isNotBlank()) {
                        Text(meta, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                item {
                    val chId = detail?.stream?.uploaderId?.ifBlank { stream.uploaderId } ?: stream.uploaderId
                    val chName = detail?.stream?.uploaderName?.ifBlank { stream.uploaderName } ?: stream.uploaderName
                    val sub = subscriptions.any { it.id == chId }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = chName,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.clickable { if (chId.isNotBlank()) onOpenChannel(chId) }
                        )
                        if (chId.isNotBlank()) {
                            Button(onClick = {
                                onToggleSubscribe(SubscriptionChannel(chId, chName))
                            }) {
                                Text(if (sub) "Subscribed" else "Subscribe", fontSize = 12.sp)
                            }
                        }
                    }
                }

                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = { onAddToPlaylist(stream) }) {
                            Icon(Icons.Default.PlaylistAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Playlist", fontSize = 12.sp)
                        }
                        OutlinedButton(onClick = { onDownload(stream) }) {
                            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Download", fontSize = 12.sp)
                        }
                        OutlinedButton(onClick = onShare) {
                            Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Share", fontSize = 12.sp)
                        }
                    }
                }

                item {
                    TabRow(selectedTabIndex = tabIndex) {
                        Tab(selected = tabIndex == 0, onClick = { tabIndex = 0 }, text = { Text("Related") })
                        Tab(selected = tabIndex == 1, onClick = { tabIndex = 1 }, text = { Text("Details") })
                        Tab(selected = tabIndex == 2, onClick = { tabIndex = 2 }, text = { Text("Queue (${playQueue.size})") })
                    }
                }

                when (tabIndex) {
                    0 -> items(detail?.related ?: emptyList(), key = { it.id }) { rel ->
                        StreamRowItem(
                            stream = rel,
                            onPlay = { onPlayStream(rel) },
                            onOpenChannel = { onOpenChannel(rel.uploaderId) },
                            onAddToPlaylist = { onAddToPlaylist(rel) },
                            onDownload = { onDownload(rel) }
                        )
                    }
                    1 -> {
                        val chapters = detail?.chapters ?: emptyList()
                        items(chapters) { ch ->
                            OutlinedButton(onClick = { onSeekTo(ch.startSeconds) }, modifier = Modifier.fillMaxWidth()) {
                                Text("${ch.title} (${ch.startSeconds}s)")
                            }
                        }
                        item {
                            Text(detail?.description ?: stream.shortDescription, fontSize = 13.sp)
                        }
                        if (settings.showComments) {
                            items(detail?.comments ?: emptyList()) { c ->
                                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                                    Column(modifier = Modifier.padding(10.dp).fillMaxWidth()) {
                                        Text("${c.author} • ${c.publishedTime}", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                                        Spacer(Modifier.height(4.dp))
                                        Text(c.text, fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }
                    2 -> itemsIndexed(playQueue) { idx, q ->
                        Card(
                            modifier = Modifier.fillMaxWidth().clickable { onSelectQueueIndex(idx) },
                            colors = CardDefaults.cardColors(
                                containerColor = if (idx == currentQueueIndex) MaterialTheme.colorScheme.surfaceVariant else MaterialTheme.colorScheme.surface
                            )
                        ) {
                            Row(modifier = Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text("${idx + 1}. ", fontWeight = FontWeight.Bold)
                                Text(q.title, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            }
        }
    }
}
