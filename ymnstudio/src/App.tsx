import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Download,
  Flame,
  History,
  Home,
  Info,
  Menu,
  Moon,
  Rss,
  Search,
  Settings,
  Sun,
  Tv,
  X,
} from 'lucide-react';
import type { NavDestination } from './types';
import { YmnTubeProvider, useYmnTube } from './store';
import {
  BookmarksView,
  ChannelView,
  HomeTabsView,
  PlaylistDetailView,
  SearchView,
  TrendingView,
} from './views/BrowseViews';
import { DownloadsView, FeedView, HistoryView, SubscriptionsView } from './views/LibraryViews';
import { AboutView, SettingsView } from './views/SettingsViews';
import { Modals } from './components/Modals';
import { PlayerOverlay } from './components/PlayerOverlay';

const AppShell: React.FC = () => {
  const {
    settings,
    updateSettings,
    destination,
    activeChannelId,
    activePlaylistId,
    searchQuery,
    searchHistory,
    addSearchQuery,
    removeSearchQuery,
    navigate,
    downloads,
    toastMessage,
  } = useYmnTube();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setInputQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchOpen || !inputQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/suggestions?q=${encodeURIComponent(inputQuery.trim())}`)
        .then((r) => r.json())
        .then((d) => setSuggestions(Array.isArray(d.suggestions) ? d.suggestions : []))
        .catch(() => setSuggestions([]));
    }, 180);
    return () => clearTimeout(timer);
  }, [inputQuery, searchOpen]);

  const submitSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    addSearchQuery(trimmed);
    setSearchOpen(false);
    setSuggestions([]);
    navigate('search', { query: trimmed });
  };

  const cycleTheme = () => {
    const order = ['light', 'dark', 'black'] as const;
    const next = order[(order.indexOf(settings.theme) + 1) % order.length];
    updateSettings({ theme: next });
  };

  const activeDownloads = downloads.filter((d) => d.status === 'downloading' || d.status === 'queued').length;

  const drawerItems: { dest: NavDestination; label: string; icon: React.ReactNode }[] = [
    { dest: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { dest: 'subscriptions', label: 'Subscriptions', icon: <Tv className="h-5 w-5" /> },
    { dest: 'feed', label: "What's New", icon: <Rss className="h-5 w-5" /> },
    { dest: 'bookmarks', label: 'Bookmarked Playlists', icon: <Bookmark className="h-5 w-5" /> },
    { dest: 'downloads', label: 'Downloads', icon: <Download className="h-5 w-5" /> },
    ...(settings.enableWatchHistory ? [{ dest: 'history' as const, label: 'History', icon: <History className="h-5 w-5" /> }] : []),
    { dest: 'trending', label: 'Trending', icon: <Flame className="h-5 w-5" /> },
  ];

  const bottomNavItems: { dest: NavDestination; label: string; icon: React.ReactNode; badge?: number }[] = [
    { dest: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { dest: 'downloads', label: 'Downloads', icon: <Download className="h-5 w-5" />, badge: activeDownloads },
    { dest: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
    ...(settings.enableWatchHistory
      ? [{ dest: 'history' as const, label: 'History', icon: <History className="h-5 w-5" /> }]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Top Black Toolbar (matching toolbar_layout.xml) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-black px-3 text-white shadow-md">
        {!searchOpen ? (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation drawer"
                className="rounded-full p-2 hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('home')}
                className="flex items-center gap-2 focus:outline-none"
                title="YmnTube Home"
              >
                <img src="/assets/ymntube_toolbar_logo.png" alt="YmnTube" className="h-10 w-10 object-contain" />
                <span className="text-base font-bold tracking-tight">YmnTube</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search YouTube"
                className="rounded-full p-2 hover:bg-white/10"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={cycleTheme}
                title={`Theme: ${settings.theme}`}
                className="rounded-full p-2 hover:bg-white/10"
              >
                {settings.theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </>
        ) : (
          <div className="relative flex w-full items-center gap-2">
            <button
              onClick={() => {
                setSearchOpen(false);
                setSuggestions([]);
              }}
              className="rounded-full p-2 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch(inputQuery);
              }}
              className="flex flex-1 items-center"
            >
              <input
                autoFocus
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Search YouTube..."
                className="w-full rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white placeholder-white/60 outline-none focus:bg-white/15"
              />
            </form>
            <button
              onClick={() => submitSearch(inputQuery)}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Search
            </button>

            {(suggestions.length > 0 || (!inputQuery.trim() && searchHistory.length > 0)) && (
              <div className="absolute left-0 right-0 top-12 z-40 max-h-80 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] py-1 text-[var(--text-primary)] shadow-2xl">
                {!inputQuery.trim()
                  ? searchHistory.map((item) => (
                      <div
                        key={item}
                        onClick={() => submitSearch(item)}
                        className="flex cursor-pointer items-center justify-between px-4 py-2 text-sm hover:bg-[var(--bg-contrast)]"
                      >
                        <span className="flex items-center gap-2.5">
                          <History className="h-4 w-4 text-[var(--text-secondary)]" />
                          {item}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSearchQuery(item);
                          }}
                          className="rounded-full p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-main)]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  : suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => submitSearch(s)}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-[var(--bg-contrast)]"
                      >
                        <Search className="h-4 w-4 text-[var(--text-secondary)]" />
                        <span>{s}</span>
                      </button>
                    ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Slide-out Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/55" onClick={() => setDrawerOpen(false)}>
          <aside
            className="flex h-full w-72 flex-col bg-[var(--bg-nav)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header matching drawer_header.xml */}
            <div className="relative overflow-hidden bg-[var(--primary-header)] text-white">
              <img
                src="/assets/background_header.png"
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-55"
              />
              <div className="relative flex items-center gap-3 px-4 pb-4 pt-8">
                <img src="/assets/ic_launcher.png" alt="YmnTube" className="h-12 w-12 rounded-xl shadow" />
                <div className="text-xl font-bold">YmnTube</div>
              </div>
              <div className="relative flex items-center gap-2 bg-black/35 px-4 py-2 text-xs font-medium">
                <Tv className="h-4 w-4" />
                <span>YouTube</span>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              {drawerItems.map((item) => {
                const active = destination === item.dest;
                return (
                  <button
                    key={item.dest}
                    onClick={() => {
                      navigate(item.dest);
                      setDrawerOpen(false);
                    }}
                    className={`flex w-full items-center gap-4 px-5 py-3 text-left text-sm font-medium transition ${
                      active
                        ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-contrast)]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="my-2 border-t border-[var(--border-color)]" />

              <button
                onClick={() => {
                  navigate('settings');
                  setDrawerOpen(false);
                }}
                className={`flex w-full items-center gap-4 px-5 py-3 text-left text-sm font-medium ${
                  destination === 'settings'
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-contrast)]'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => {
                  navigate('about');
                  setDrawerOpen(false);
                }}
                className={`flex w-full items-center gap-4 px-5 py-3 text-left text-sm font-medium ${
                  destination === 'about'
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-contrast)]'
                }`}
              >
                <Info className="h-5 w-5" />
                <span>About</span>
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 pb-20 sm:px-6">
        {destination === 'home' && <HomeTabsView />}
        {destination === 'trending' && <TrendingView />}
        {destination === 'bookmarks' && <BookmarksView />}
        {destination === 'subscriptions' && <SubscriptionsView />}
        {destination === 'feed' && <FeedView />}
        {destination === 'history' && <HistoryView />}
        {destination === 'downloads' && <DownloadsView />}
        {destination === 'settings' && <SettingsView />}
        {destination === 'about' && <AboutView />}
        {destination === 'search' && <SearchView query={searchQuery} />}
        {destination === 'channel' && activeChannelId && <ChannelView channelId={activeChannelId} />}
        {destination === 'playlist' && activePlaylistId && <PlaylistDetailView playlistId={activePlaylistId} />}
      </main>

      {/* Bottom Navigation Bar (matching main_navigation.xml) */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-14 items-center justify-around border-t border-[var(--border-color)] bg-[var(--bg-nav)]">
        {bottomNavItems.map((item) => {
          const active = destination === item.dest;
          return (
            <button
              key={item.dest}
              onClick={() => navigate(item.dest)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium transition ${
                active ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute right-1/4 top-1 rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <PlayerOverlay />
      <Modals />

      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-black/90 px-4 py-2 text-xs font-medium text-white shadow-xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => (
  <YmnTubeProvider>
    <AppShell />
  </YmnTubeProvider>
);

export default App;
