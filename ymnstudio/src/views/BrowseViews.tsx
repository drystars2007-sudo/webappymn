import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  Bookmark,
  Flame,
  FolderPlus,
  LayoutGrid,
  List,
  Play,
  RefreshCw,
  SquareStack,
  Trash2,
  Tv,
} from 'lucide-react';
import type { ChannelInfo, ChannelSummary, ItemViewMode, StreamItem } from '../types';
import { useYmnTube } from '../store';
import { StreamCard } from '../components/StreamCard';
import { FeedView, SubscriptionsView } from './LibraryViews';

export const ViewModeToggle: React.FC = () => {
  const { settings, updateSettings } = useYmnTube();
  const modes: { id: ItemViewMode; icon: React.ReactNode; label: string }[] = [
    { id: 'list', icon: <List className="h-4 w-4" />, label: 'List' },
    { id: 'grid', icon: <LayoutGrid className="h-4 w-4" />, label: 'Grid' },
    { id: 'card', icon: <SquareStack className="h-4 w-4" />, label: 'Card' },
  ];

  return (
    <div className="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-0.5">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => updateSettings({ viewMode: m.id })}
          title={m.label}
          className={`rounded-md p-1.5 transition ${
            settings.viewMode === m.id
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {m.icon}
        </button>
      ))}
    </div>
  );
};

export function streamGridClass(viewMode: ItemViewMode): string {
  if (viewMode === 'list') return 'flex flex-col gap-1';
  if (viewMode === 'card') return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';
  return 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';
}

export const TrendingView: React.FC = () => {
  const { settings } = useYmnTube();
  const [category, setCategory] = useState<'now' | 'music' | 'gaming' | 'movies'>('now');
  const [items, setItems] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrending = (cat: string) => {
    setLoading(true);
    fetch(`/api/trending?category=${encodeURIComponent(cat)}`)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTrending(category);
  }, [category]);

  const categories: { id: 'now' | 'music' | 'gaming' | 'movies'; label: string }[] = [
    { id: 'now', label: 'Trending' },
    { id: 'music', label: 'Music' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'movies', label: 'Movies' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                category === c.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-contrast)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTrending(category)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs hover:bg-[var(--bg-contrast)]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <ViewModeToggle />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2 rounded-lg bg-[var(--bg-card)] p-2">
              <div className="aspect-video w-full rounded bg-[var(--bg-contrast)]" />
              <div className="h-4 w-4/5 rounded bg-[var(--bg-contrast)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--bg-contrast)]" />
            </div>
          ))}
        </div>
      ) : (
        <div className={streamGridClass(settings.viewMode)}>
          {items.map((stream) => (
            <StreamCard key={stream.id} stream={stream} viewMode={settings.viewMode} />
          ))}
        </div>
      )}
    </div>
  );
};

export const BookmarksView: React.FC = () => {
  const { playlists, createPlaylist, deletePlaylist, playAll, navigate } = useYmnTube();
  const [name, setName] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Bookmark className="h-4 w-4 text-[var(--accent)]" /> Bookmarked Playlists
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createPlaylist(name);
            setName('');
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New playlist name..."
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            <FolderPlus className="h-3.5 w-3.5" /> Create
          </button>
        </form>
      </div>

      {playlists.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-secondary)]">
          No playlists yet. Create one above or add streams from any video menu.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => navigate('playlist', { playlistId: pl.id })}
              className="group cursor-pointer overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] transition hover:border-[var(--accent)]"
            >
              <div className="relative aspect-video w-full bg-[var(--bg-contrast)]">
                {pl.items[0]?.thumbnail || pl.thumbnail ? (
                  <img
                    src={pl.items[0]?.thumbnail || pl.thumbnail}
                    alt={pl.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--text-secondary)]">
                    Empty Playlist
                  </div>
                )}
                <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-xs font-medium text-white">
                  {pl.items.length} streams
                </div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{pl.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Local playlist</p>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {pl.items.length > 0 && (
                    <button
                      onClick={() => playAll(pl.items)}
                      className="rounded-full p-2 text-[var(--accent)] hover:bg-[var(--bg-contrast)]"
                      title="Play all"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deletePlaylist(pl.id)}
                    className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-contrast)]"
                    title="Delete playlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PlaylistDetailView: React.FC<{ playlistId: string }> = ({ playlistId }) => {
  const { playlists, playAll, removeStreamFromPlaylist, renamePlaylist, navigate, settings, showToast } =
    useYmnTube();
  const playlist = playlists.find((p) => p.id === playlistId);
  const [editingName, setEditingName] = useState(playlist?.name || '');

  if (!playlist) {
    return (
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center">
        <p className="text-sm text-[var(--text-secondary)]">Playlist not found.</p>
        <button
          onClick={() => navigate('bookmarks')}
          className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white"
        >
          Back to Playlists
        </button>
      </div>
    );
  }

  const handleExport = () => {
    const content = playlist.items.map((i) => `https://www.youtube.com/watch?v=${i.id}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${playlist.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    showToast('Playlist URLs exported');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={() => editingName.trim() && renamePlaylist(playlist.id, editingName.trim())}
            className="bg-transparent text-lg font-bold outline-none focus:border-b focus:border-[var(--accent)]"
          />
          <span className="text-xs text-[var(--text-secondary)]">({playlist.items.length} streams)</span>
        </div>
        <div className="flex gap-2">
          {playlist.items.length > 0 && (
            <>
              <button
                onClick={() => playAll(playlist.items)}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                <Play className="h-3.5 w-3.5" /> Play All
              </button>
              <button
                onClick={handleExport}
                className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs hover:bg-[var(--bg-contrast)]"
              >
                Export URLs
              </button>
            </>
          )}
        </div>
      </div>

      {playlist.items.length === 0 ? (
        <p className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-secondary)]">
          This playlist has no streams yet.
        </p>
      ) : (
        <div className="space-y-2">
          {playlist.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="flex-1">
                <StreamCard stream={item} viewMode={settings.viewMode === 'list' ? 'list' : 'list'} />
              </div>
              <button
                onClick={() => removeStreamFromPlaylist(playlist.id, item.id)}
                className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-contrast)] hover:text-[var(--accent)]"
                title="Remove from playlist"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const HomeTabsView: React.FC = () => {
  const { settings } = useYmnTube();
  const tabs = settings.tabs.length > 0 ? settings.tabs : [{ id: 'tab-kiosk', type: 'kiosk' as const, title: 'Trending' }];
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border-color)]">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.type === 'kiosk' && <Flame className="h-4 w-4" />}
              {tab.type === 'bookmarks' && <Bookmark className="h-4 w-4" />}
              {tab.type === 'subscriptions' && <Tv className="h-4 w-4" />}
              <span>{tab.title}</span>
            </button>
          );
        })}
      </div>

      {activeTab.type === 'kiosk' && <TrendingView />}
      {activeTab.type === 'bookmarks' && <BookmarksView />}
      {activeTab.type === 'subscriptions' && <SubscriptionsView />}
      {activeTab.type === 'feed' && <FeedView />}
    </div>
  );
};

export const SearchView: React.FC<{ query: string }> = ({ query }) => {
  const { settings, navigate, isSubscribed, toggleSubscribe } = useYmnTube();
  const [filter, setFilter] = useState<'all' | 'videos' | 'channels'>('all');
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}&filter=${filter}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setStreams(Array.isArray(d.streams) ? d.streams : []);
          setChannels(Array.isArray(d.channels) ? d.channels : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStreams([]);
          setChannels([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-secondary)]">
            Showing results for: <strong className="text-[var(--text-primary)]">{query}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'videos', 'channels'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                filter === f
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-contrast)]'
              }`}
            >
              {f}
            </button>
          ))}
          <ViewModeToggle />
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-[var(--text-secondary)]">Searching YouTube...</p>
      ) : (
        <div className="space-y-6">
          {channels.length > 0 && filter !== 'videos' && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Channels</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {channels.map((ch) => {
                  const sub = isSubscribed(ch.id);
                  return (
                    <div
                      key={ch.id}
                      onClick={() => navigate('channel', { channelId: ch.id })}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 hover:border-[var(--accent)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={ch.avatar || '/assets/ic_launcher.png'}
                          alt={ch.name}
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{ch.name}</div>
                          <div className="truncate text-xs text-[var(--text-secondary)]">
                            {ch.subscriberCountText || ch.videoCountText}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubscribe({
                            id: ch.id,
                            name: ch.name,
                            url: `https://www.youtube.com/channel/${ch.id}`,
                            avatar: ch.avatar,
                            subscriberCountText: ch.subscriberCountText,
                            description: ch.description,
                          });
                        }}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          sub ? 'bg-[var(--bg-contrast)] text-[var(--text-secondary)]' : 'bg-[var(--accent)] text-white'
                        }`}
                      >
                        {sub ? 'Subscribed' : 'Subscribe'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filter !== 'channels' && (
            <div className={streamGridClass(settings.viewMode)}>
              {streams.map((s) => (
                <StreamCard key={s.id} stream={s} viewMode={settings.viewMode} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ChannelView: React.FC<{ channelId: string }> = ({ channelId }) => {
  const { settings, isSubscribed, toggleSubscribe, playAll } = useYmnTube();
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'videos' | 'about'>('videos');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/channel/${encodeURIComponent(channelId)}`)
      .then((r) => r.json())
      .then((d: ChannelInfo) => {
        if (!cancelled) setChannel(d);
      })
      .catch(() => {
        if (!cancelled) setChannel(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  if (loading) {
    return <p className="py-12 text-center text-sm text-[var(--text-secondary)]">Loading channel...</p>;
  }

  if (!channel) {
    return <p className="py-12 text-center text-sm text-[var(--text-secondary)]">Could not load channel.</p>;
  }

  const subscribed = isSubscribed(channel.id);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
        <div className="h-32 w-full overflow-hidden bg-black sm:h-44">
          <img
            src={channel.banner || '/assets/placeholder_channel_banner.png'}
            alt={channel.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-4">
            <img
              src={channel.avatar || '/assets/ic_launcher.png'}
              alt={channel.name}
              className="h-16 w-16 rounded-full border-2 border-[var(--bg-card)] object-cover"
            />
            <div>
              <h1 className="text-xl font-bold">{channel.name}</h1>
              <p className="text-xs text-[var(--text-secondary)]">{channel.subscriberCountText}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {channel.videos.length > 0 && (
              <button
                onClick={() => playAll(channel.videos)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-medium hover:bg-[var(--bg-contrast)]"
              >
                <Play className="h-3.5 w-3.5" /> Play All
              </button>
            )}
            <button
              onClick={() =>
                toggleSubscribe({
                  id: channel.id,
                  name: channel.name,
                  url: `https://www.youtube.com/channel/${channel.id}`,
                  avatar: channel.avatar,
                  subscriberCountText: channel.subscriberCountText,
                  description: channel.description,
                })
              }
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold uppercase ${
                subscribed
                  ? 'bg-[var(--bg-contrast)] text-[var(--text-secondary)]'
                  : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
              }`}
            >
              {subscribed ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[var(--border-color)]">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('videos')}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === 'videos'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)]'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setTab('about')}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === 'about'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)]'
            }`}
          >
            About
          </button>
        </div>
        <ViewModeToggle />
      </div>

      {tab === 'videos' ? (
        <div className={streamGridClass(settings.viewMode)}>
          {channel.videos.map((v) => (
            <StreamCard key={v.id} stream={v} viewMode={settings.viewMode} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <h3 className="text-sm font-semibold">Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-[var(--text-secondary)]">
            {channel.description || 'No channel description available.'}
          </p>
        </div>
      )}
    </div>
  );
};
