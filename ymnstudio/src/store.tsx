import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  AppSettings,
  DownloadMission,
  FeedGroup,
  HistoryEntry,
  HomeTabConfig,
  NavDestination,
  PlaylistInfo,
  StreamItem,
  SubscriptionChannel,
} from './types';

const STORAGE_KEY = 'ymntube_state_v1';

export const DEFAULT_TABS: HomeTabConfig[] = [
  { id: 'tab-kiosk', type: 'kiosk', title: 'Trending' },
  { id: 'tab-bookmarks', type: 'bookmarks', title: 'Bookmarked Playlists' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  viewMode: 'grid',
  defaultResolution: '720p',
  showComments: true,
  showDescription: true,
  showRelated: true,
  enableWatchHistory: true,
  enableSearchHistory: true,
  autoplay: true,
  seekDurationSeconds: 10,
  contentCountry: 'US',
  tabs: DEFAULT_TABS,
};

interface PersistedState {
  settings: AppSettings;
  subscriptions: SubscriptionChannel[];
  feedGroups: FeedGroup[];
  playlists: PlaylistInfo[];
  history: HistoryEntry[];
  searchHistory: string[];
  downloads: DownloadMission[];
}

const DEFAULT_PERSISTED: PersistedState = {
  settings: DEFAULT_SETTINGS,
  subscriptions: [
    {
      id: 'UCXuqSBlHAE6Xw-yeJA0Tunw',
      name: 'Linus Tech Tips',
      url: 'https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw',
      avatar: 'https://yt3.googleusercontent.com/Vy6KL7EM_apxPSxF0pPy5w_c87YDTOlBQo3MADDF0Wl51kwxmt9wmRotnt2xQXwlrcyO0Xe56w=s176-c-k-c0x00ffffff-no-rj',
      subscriberCountText: '16M subscribers',
      notificationMode: 'enabled',
    },
    {
      id: 'UCBJycsmduvYEL83R_U4JriQ',
      name: 'Marques Brownlee',
      url: 'https://www.youtube.com/channel/UCBJycsmduvYEL83R_U4JriQ',
      avatar: 'https://yt3.googleusercontent.com/lkH37D712tiyphnu0Id0D5MwwQ7IRuwgQLVD05iMXlDWO-kDHut3uI4MgIEAQ9StK0qOST7fiA=s176-c-k-c0x00ffffff-no-rj',
      subscriberCountText: '19.8M subscribers',
      notificationMode: 'enabled',
    },
    {
      id: 'UCLA_DiR1FfKNvjuUpBHmylQ',
      name: 'NASA',
      url: 'https://www.youtube.com/channel/UCLA_DiR1FfKNvjuUpBHmylQ',
      avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_mL9n2kM8x_vP8qK9j6sQ8W0sK1gR5wP5v9Jg=s176-c-k-c0x00ffffff-no-rj',
      subscriberCountText: '12.1M subscribers',
      notificationMode: 'enabled',
    },
  ],
  feedGroups: [
    {
      id: 'group-tech',
      name: 'Tech & Science',
      icon: 'computer',
      channelIds: ['UCXuqSBlHAE6Xw-yeJA0Tunw', 'UCBJycsmduvYEL83R_U4JriQ', 'UCLA_DiR1FfKNvjuUpBHmylQ'],
    },
  ],
  playlists: [
    {
      id: 'playlist-watch-later',
      name: 'Watch Later',
      description: 'Saved streams to watch later',
      items: [],
      updatedAt: Date.now(),
    },
  ],
  history: [],
  searchHistory: [],
  downloads: [],
};

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PERSISTED;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : DEFAULT_PERSISTED.subscriptions,
      feedGroups: Array.isArray(parsed.feedGroups) ? parsed.feedGroups : DEFAULT_PERSISTED.feedGroups,
      playlists: Array.isArray(parsed.playlists) ? parsed.playlists : DEFAULT_PERSISTED.playlists,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      searchHistory: Array.isArray(parsed.searchHistory) ? parsed.searchHistory : [],
      downloads: Array.isArray(parsed.downloads) ? parsed.downloads : [],
    };
  } catch {
    return DEFAULT_PERSISTED;
  }
}

interface YmnTubeContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;

  subscriptions: SubscriptionChannel[];
  isSubscribed: (channelId: string) => boolean;
  toggleSubscribe: (channel: Omit<SubscriptionChannel, 'notificationMode'>) => void;
  setChannelNotificationMode: (channelId: string, mode: 'enabled' | 'disabled') => void;
  importSubscriptions: (channels: SubscriptionChannel[]) => number;

  feedGroups: FeedGroup[];
  createFeedGroup: (name: string, icon: string, channelIds: string[]) => void;
  deleteFeedGroup: (id: string) => void;

  playlists: PlaylistInfo[];
  createPlaylist: (name: string, initialStream?: StreamItem) => PlaylistInfo;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addStreamToPlaylist: (playlistId: string, stream: StreamItem) => void;
  removeStreamFromPlaylist: (playlistId: string, streamId: string) => void;

  history: HistoryEntry[];
  recordWatch: (stream: StreamItem) => void;
  clearWatchHistory: () => void;

  searchHistory: string[];
  addSearchQuery: (q: string) => void;
  removeSearchQuery: (q: string) => void;
  clearSearchHistory: () => void;

  downloads: DownloadMission[];
  startDownload: (stream: StreamItem, kind: 'video' | 'audio' | 'subtitle', format: string, quality: string) => void;
  toggleDownloadPause: (id: string) => void;
  deleteDownload: (id: string) => void;
  clearCompletedDownloads: () => void;

  playQueue: StreamItem[];
  currentQueueIndex: number;
  currentStream: StreamItem | null;
  playerOpen: boolean;
  playerMinimized: boolean;
  playerStartSeconds: number;
  playStream: (stream: StreamItem, startSeconds?: number) => void;
  playAll: (streams: StreamItem[], startIndex?: number) => void;
  enqueueNext: (stream: StreamItem) => void;
  enqueueEnd: (stream: StreamItem) => void;
  selectQueueIndex: (index: number) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlayerMinimized: (minimized: boolean) => void;
  closePlayer: () => void;
  seekPlayerTo: (seconds: number) => void;

  destination: NavDestination;
  activeChannelId: string | null;
  activePlaylistId: string | null;
  searchQuery: string;
  navigate: (dest: NavDestination, opts?: { channelId?: string; playlistId?: string; query?: string }) => void;

  playlistModalStream: StreamItem | null;
  setPlaylistModalStream: (s: StreamItem | null) => void;
  downloadModalStream: StreamItem | null;
  setDownloadModalStream: (s: StreamItem | null) => void;

  toastMessage: string | null;
  showToast: (msg: string) => void;

  exportBackupJson: () => string;
  importBackupJson: (jsonText: string) => boolean;
}

const YmnTubeContext = createContext<YmnTubeContextValue | null>(null);

export const YmnTubeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(loadState);

  const [playQueue, setPlayQueue] = useState<StreamItem[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerMinimized, setPlayerMinimized] = useState(false);
  const [playerStartSeconds, setPlayerStartSeconds] = useState(0);

  const [destination, setDestination] = useState<NavDestination>('home');
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [playlistModalStream, setPlaylistModalStream] = useState<StreamItem | null>(null);
  const [downloadModalStream, setDownloadModalStream] = useState<StreamItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2800);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  // Progress active download missions smoothly
  useEffect(() => {
    const hasActive = state.downloads.some((d) => d.status === 'downloading' || d.status === 'queued');
    if (!hasActive) return;
    const timer = setInterval(() => {
      setState((prev) => ({
        ...prev,
        downloads: prev.downloads.map((d) => {
          if (d.status === 'queued') {
            return { ...d, status: 'downloading', progress: 8 };
          }
          if (d.status === 'downloading') {
            const next = Math.min(100, d.progress + 18);
            return {
              ...d,
              progress: next,
              status: next >= 100 ? 'completed' : 'downloading',
            };
          }
          return d;
        }),
      }));
    }, 700);
    return () => clearInterval(timer);
  }, [state.downloads]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: DEFAULT_SETTINGS,
    }));
    showToast('Settings reset to defaults');
  }, [showToast]);

  const isSubscribed = useCallback(
    (channelId: string) => state.subscriptions.some((s) => s.id === channelId),
    [state.subscriptions]
  );

  const toggleSubscribe = useCallback(
    (channel: Omit<SubscriptionChannel, 'notificationMode'>) => {
      setState((prev) => {
        const exists = prev.subscriptions.some((s) => s.id === channel.id);
        if (exists) {
          showToast(`Unsubscribed from ${channel.name}`);
          return {
            ...prev,
            subscriptions: prev.subscriptions.filter((s) => s.id !== channel.id),
          };
        }
        showToast(`Subscribed to ${channel.name}`);
        return {
          ...prev,
          subscriptions: [{ ...channel, notificationMode: 'enabled' }, ...prev.subscriptions],
        };
      });
    },
    [showToast]
  );

  const setChannelNotificationMode = useCallback((channelId: string, mode: 'enabled' | 'disabled') => {
    setState((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) => (s.id === channelId ? { ...s, notificationMode: mode } : s)),
    }));
  }, []);

  const importSubscriptions = useCallback(
    (channels: SubscriptionChannel[]) => {
      let added = 0;
      setState((prev) => {
        const existingIds = new Set(prev.subscriptions.map((s) => s.id));
        const newOnes = channels.filter((c) => c.id && !existingIds.has(c.id));
        added = newOnes.length;
        return {
          ...prev,
          subscriptions: [...newOnes, ...prev.subscriptions],
        };
      });
      return added;
    },
    []
  );

  const createFeedGroup = useCallback(
    (name: string, icon: string, channelIds: string[]) => {
      const group: FeedGroup = {
        id: `group-${Date.now()}`,
        name: name.trim() || 'Feed Group',
        icon,
        channelIds,
      };
      setState((prev) => ({
        ...prev,
        feedGroups: [...prev.feedGroups, group],
      }));
      showToast(`Created group "${group.name}"`);
    },
    [showToast]
  );

  const deleteFeedGroup = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      feedGroups: prev.feedGroups.filter((g) => g.id !== id),
    }));
  }, []);

  const createPlaylist = useCallback(
    (name: string, initialStream?: StreamItem) => {
      const pl: PlaylistInfo = {
        id: `pl-${Date.now()}`,
        name: name.trim() || 'New Playlist',
        items: initialStream ? [initialStream] : [],
        thumbnail: initialStream?.thumbnail,
        updatedAt: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        playlists: [pl, ...prev.playlists],
      }));
      showToast(`Created playlist "${pl.name}"`);
      return pl;
    },
    [showToast]
  );

  const deletePlaylist = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        playlists: prev.playlists.filter((p) => p.id !== id),
      }));
      showToast('Playlist deleted');
    },
    [showToast]
  );

  const renamePlaylist = useCallback((id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      playlists: prev.playlists.map((p) => (p.id === id ? { ...p, name, updatedAt: Date.now() } : p)),
    }));
  }, []);

  const addStreamToPlaylist = useCallback(
    (playlistId: string, stream: StreamItem) => {
      setState((prev) => ({
        ...prev,
        playlists: prev.playlists.map((p) => {
          if (p.id !== playlistId) return p;
          if (p.items.some((i) => i.id === stream.id)) return p;
          return {
            ...p,
            items: [...p.items, stream],
            thumbnail: p.thumbnail || stream.thumbnail,
            updatedAt: Date.now(),
          };
        }),
      }));
      showToast('Added to playlist');
    },
    [showToast]
  );

  const removeStreamFromPlaylist = useCallback((playlistId: string, streamId: string) => {
    setState((prev) => ({
      ...prev,
      playlists: prev.playlists.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              items: p.items.filter((i) => i.id !== streamId),
              updatedAt: Date.now(),
            }
          : p
      ),
    }));
  }, []);

  const recordWatch = useCallback((stream: StreamItem) => {
    setState((prev) => {
      if (!prev.settings.enableWatchHistory) return prev;
      const existing = prev.history.find((h) => h.stream.id === stream.id);
      const filtered = prev.history.filter((h) => h.stream.id !== stream.id);
      const entry: HistoryEntry = {
        stream,
        accessDate: Date.now(),
        repeatCount: (existing?.repeatCount || 0) + 1,
        progressSeconds: existing?.progressSeconds || 0,
      };
      return {
        ...prev,
        history: [entry, ...filtered].slice(0, 200),
      };
    });
  }, []);

  const clearWatchHistory = useCallback(() => {
    setState((prev) => ({ ...prev, history: [] }));
    showToast('Watch history cleared');
  }, [showToast]);

  const addSearchQuery = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setState((prev) => {
      if (!prev.settings.enableSearchHistory) return prev;
      return {
        ...prev,
        searchHistory: [trimmed, ...prev.searchHistory.filter((x) => x !== trimmed)].slice(0, 25),
      };
    });
  }, []);

  const removeSearchQuery = useCallback((q: string) => {
    setState((prev) => ({
      ...prev,
      searchHistory: prev.searchHistory.filter((x) => x !== q),
    }));
  }, []);

  const clearSearchHistory = useCallback(() => {
    setState((prev) => ({ ...prev, searchHistory: [] }));
    showToast('Search history cleared');
  }, [showToast]);

  const startDownload = useCallback(
    (stream: StreamItem, kind: 'video' | 'audio' | 'subtitle', format: string, quality: string) => {
      const sizeMap = { video: '48.6 MB', audio: '6.4 MB', subtitle: '42 KB' };
      const mission: DownloadMission = {
        id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        stream,
        kind,
        format,
        quality,
        sizeText: sizeMap[kind],
        progress: 0,
        status: 'queued',
        createdAt: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        downloads: [mission, ...prev.downloads],
      }));
      showToast(`Download queued: ${stream.title}`);
    },
    [showToast]
  );

  const toggleDownloadPause = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      downloads: prev.downloads.map((d) => {
        if (d.id !== id || d.status === 'completed') return d;
        return {
          ...d,
          status: d.status === 'paused' ? 'downloading' : 'paused',
        };
      }),
    }));
  }, []);

  const deleteDownload = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      downloads: prev.downloads.filter((d) => d.id !== id),
    }));
  }, []);

  const clearCompletedDownloads = useCallback(() => {
    setState((prev) => ({
      ...prev,
      downloads: prev.downloads.filter((d) => d.status !== 'completed'),
    }));
  }, []);

  const playStream = useCallback(
    (stream: StreamItem, startSeconds = 0) => {
      setPlayQueue((prev) => {
        const idx = prev.findIndex((s) => s.id === stream.id);
        if (idx !== -1) {
          setCurrentQueueIndex(idx);
          return prev;
        }
        const next = [stream, ...prev];
        setCurrentQueueIndex(0);
        return next;
      });
      setPlayerStartSeconds(startSeconds);
      setPlayerOpen(true);
      setPlayerMinimized(false);
      recordWatch(stream);
    },
    [recordWatch]
  );

  const playAll = useCallback(
    (streams: StreamItem[], startIndex = 0) => {
      if (streams.length === 0) return;
      setPlayQueue(streams);
      setCurrentQueueIndex(startIndex);
      setPlayerStartSeconds(0);
      setPlayerOpen(true);
      setPlayerMinimized(false);
      recordWatch(streams[startIndex]);
    },
    [recordWatch]
  );

  const enqueueNext = useCallback(
    (stream: StreamItem) => {
      setPlayQueue((prev) => {
        if (prev.length === 0 || currentQueueIndex < 0) {
          setCurrentQueueIndex(0);
          setPlayerOpen(true);
          setPlayerMinimized(true);
          return [stream];
        }
        const copy = [...prev.filter((s) => s.id !== stream.id)];
        copy.splice(Math.min(currentQueueIndex + 1, copy.length), 0, stream);
        return copy;
      });
      showToast('Enqueued next');
    },
    [currentQueueIndex, showToast]
  );

  const enqueueEnd = useCallback(
    (stream: StreamItem) => {
      setPlayQueue((prev) => {
        if (prev.some((s) => s.id === stream.id)) return prev;
        if (prev.length === 0) {
          setCurrentQueueIndex(0);
          setPlayerOpen(true);
          setPlayerMinimized(true);
        }
        return [...prev, stream];
      });
      showToast('Enqueued to queue');
    },
    [showToast]
  );

  const selectQueueIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= playQueue.length) return;
      setCurrentQueueIndex(index);
      setPlayerStartSeconds(0);
      recordWatch(playQueue[index]);
    },
    [playQueue, recordWatch]
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      setPlayQueue((prev) => {
        const next = prev.filter((_, i) => i !== index);
        if (next.length === 0) {
          setCurrentQueueIndex(-1);
          setPlayerOpen(false);
        } else if (index < currentQueueIndex) {
          setCurrentQueueIndex((i) => Math.max(0, i - 1));
        } else if (index === currentQueueIndex) {
          setCurrentQueueIndex((i) => Math.min(i, next.length - 1));
        }
        return next;
      });
    },
    [currentQueueIndex]
  );

  const clearQueue = useCallback(() => {
    setPlayQueue([]);
    setCurrentQueueIndex(-1);
    setPlayerOpen(false);
  }, []);

  const playNext = useCallback(() => {
    if (currentQueueIndex + 1 < playQueue.length) {
      selectQueueIndex(currentQueueIndex + 1);
    }
  }, [currentQueueIndex, playQueue.length, selectQueueIndex]);

  const playPrevious = useCallback(() => {
    if (currentQueueIndex > 0) {
      selectQueueIndex(currentQueueIndex - 1);
    }
  }, [currentQueueIndex, selectQueueIndex]);

  const closePlayer = useCallback(() => {
    setPlayerOpen(false);
    setPlayerMinimized(false);
  }, []);

  const seekPlayerTo = useCallback((seconds: number) => {
    setPlayerStartSeconds(seconds);
  }, []);

  const navigate = useCallback(
    (dest: NavDestination, opts?: { channelId?: string; playlistId?: string; query?: string }) => {
      setDestination(dest);
      if (opts?.channelId !== undefined) setActiveChannelId(opts.channelId);
      if (opts?.playlistId !== undefined) setActivePlaylistId(opts.playlistId);
      if (opts?.query !== undefined) setSearchQuery(opts.query);
      if (playerOpen) setPlayerMinimized(true);
    },
    [playerOpen]
  );

  const exportBackupJson = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importBackupJson = useCallback(
    (jsonText: string) => {
      try {
        const parsed = JSON.parse(jsonText) as Partial<PersistedState>;
        setState((prev) => ({
          settings: { ...prev.settings, ...(parsed.settings || {}) },
          subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : prev.subscriptions,
          feedGroups: Array.isArray(parsed.feedGroups) ? parsed.feedGroups : prev.feedGroups,
          playlists: Array.isArray(parsed.playlists) ? parsed.playlists : prev.playlists,
          history: Array.isArray(parsed.history) ? parsed.history : prev.history,
          searchHistory: Array.isArray(parsed.searchHistory) ? parsed.searchHistory : prev.searchHistory,
          downloads: Array.isArray(parsed.downloads) ? parsed.downloads : prev.downloads,
        }));
        showToast('Backup imported successfully');
        return true;
      } catch {
        showToast('Invalid backup JSON file');
        return false;
      }
    },
    [showToast]
  );

  const currentStream =
    currentQueueIndex >= 0 && currentQueueIndex < playQueue.length ? playQueue[currentQueueIndex] : null;

  return (
    <YmnTubeContext.Provider
      value={{
        settings: state.settings,
        updateSettings,
        resetSettings,
        subscriptions: state.subscriptions,
        isSubscribed,
        toggleSubscribe,
        setChannelNotificationMode,
        importSubscriptions,
        feedGroups: state.feedGroups,
        createFeedGroup,
        deleteFeedGroup,
        playlists: state.playlists,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        addStreamToPlaylist,
        removeStreamFromPlaylist,
        history: state.history,
        recordWatch,
        clearWatchHistory,
        searchHistory: state.searchHistory,
        addSearchQuery,
        removeSearchQuery,
        clearSearchHistory,
        downloads: state.downloads,
        startDownload,
        toggleDownloadPause,
        deleteDownload,
        clearCompletedDownloads,
        playQueue,
        currentQueueIndex,
        currentStream,
        playerOpen,
        playerMinimized,
        playerStartSeconds,
        playStream,
        playAll,
        enqueueNext,
        enqueueEnd,
        selectQueueIndex,
        removeFromQueue,
        clearQueue,
        playNext,
        playPrevious,
        setPlayerMinimized,
        closePlayer,
        seekPlayerTo,
        destination,
        activeChannelId,
        activePlaylistId,
        searchQuery,
        navigate,
        playlistModalStream,
        setPlaylistModalStream,
        downloadModalStream,
        setDownloadModalStream,
        toastMessage,
        showToast,
        exportBackupJson,
        importBackupJson,
      }}
    >
      {children}
    </YmnTubeContext.Provider>
  );
};

export function useYmnTube(): YmnTubeContextValue {
  const ctx = useContext(YmnTubeContext);
  if (!ctx) throw new Error('useYmnTube must be used within YmnTubeProvider');
  return ctx;
}
