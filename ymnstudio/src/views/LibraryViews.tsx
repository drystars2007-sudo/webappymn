import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle2,
  Download,
  FolderPlus,
  History,
  Pause,
  Play,
  RefreshCw,
  Rss,
  Trash2,
  Upload,
} from 'lucide-react';
import type { StreamItem, SubscriptionChannel } from '../types';
import { useYmnTube } from '../store';
import { StreamCard } from '../components/StreamCard';
import { streamGridClass, ViewModeToggle } from './BrowseViews';

export const SubscriptionsView: React.FC = () => {
  const {
    subscriptions,
    toggleSubscribe,
    setChannelNotificationMode,
    importSubscriptions,
    feedGroups,
    createFeedGroup,
    deleteFeedGroup,
    navigate,
    showToast,
  } = useYmnTube();
  const fileRef = useRef<HTMLInputElement>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const handleExportNewPipeJson = () => {
    const payload = {
      app_version: '0.27.6',
      app_version_int: 1000,
      subscriptions: subscriptions.map((s) => ({
        service_id: 0,
        url: s.url || `https://www.youtube.com/channel/${s.id}`,
        name: s.name,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ymntube_subscriptions_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Subscriptions exported');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [];
      const mapped: SubscriptionChannel[] = list
        .filter((item: any) => item?.url || item?.name)
        .map((item: any) => {
          const url = String(item.url || '');
          const id = url.split('/').pop() || item.name;
          return {
            id,
            name: String(item.name || id),
            url,
            avatar: '/assets/ic_launcher.png',
            notificationMode: 'enabled',
          };
        });
      const count = importSubscriptions(mapped);
      showToast(`Imported ${count} new subscription${count === 1 ? '' : 's'}`);
    } catch {
      showToast('Invalid NewPipe subscriptions JSON');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Subscriptions ({subscriptions.length})</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGroupModalOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--bg-contrast)]"
          >
            <FolderPlus className="h-3.5 w-3.5" /> New Group
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--bg-contrast)]"
          >
            <Upload className="h-3.5 w-3.5" /> Import JSON
          </button>
          <button
            onClick={handleExportNewPipeJson}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--bg-contrast)]"
          >
            <Download className="h-3.5 w-3.5" /> Export JSON
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden" />
        </div>
      </div>

      {groupModalOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!groupName.trim()) return;
            createFeedGroup(groupName, 'tv', selectedChannels);
            setGroupName('');
            setSelectedChannels([]);
            setGroupModalOpen(false);
          }}
          className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4"
        >
          <div className="text-sm font-semibold">Create Feed Group</div>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name..."
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
          />
          <div className="flex flex-wrap gap-2">
            {subscriptions.map((sub) => {
              const checked = selectedChannels.includes(sub.id);
              return (
                <button
                  type="button"
                  key={sub.id}
                  onClick={() =>
                    setSelectedChannels((prev) =>
                      prev.includes(sub.id) ? prev.filter((x) => x !== sub.id) : [...prev, sub.id]
                    )
                  }
                  className={`rounded-lg px-2.5 py-1 text-xs ${
                    checked ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-contrast)]'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setGroupModalOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs hover:bg-[var(--bg-contrast)]"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white">
              Create Group
            </button>
          </div>
        </form>
      )}

      {/* Feed Groups */}
      {feedGroups.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Feed Groups</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {feedGroups.map((g) => (
              <div
                key={g.id}
                onClick={() => navigate('feed')}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 hover:border-[var(--accent)]"
              >
                <div>
                  <div className="text-sm font-semibold">{g.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{g.channelIds.length} channels</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFeedGroup(g.id);
                  }}
                  className="rounded-full p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-contrast)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscribed Channels */}
      {subscriptions.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-secondary)]">
          No subscriptions yet. Open any channel or import your NewPipe subscriptions JSON.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              onClick={() => navigate('channel', { channelId: sub.id })}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 hover:border-[var(--accent)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={sub.avatar || '/assets/ic_launcher.png'}
                  alt={sub.name}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{sub.name}</div>
                  <div className="truncate text-xs text-[var(--text-secondary)]">
                    {sub.subscriberCountText || 'YouTube'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() =>
                    setChannelNotificationMode(sub.id, sub.notificationMode === 'enabled' ? 'disabled' : 'enabled')
                  }
                  className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-contrast)]"
                  title="Toggle feed notifications"
                >
                  {sub.notificationMode === 'enabled' ? (
                    <Bell className="h-4 w-4 text-[var(--accent)]" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => toggleSubscribe(sub)}
                  className="rounded-lg bg-[var(--bg-contrast)] px-2.5 py-1.5 text-xs hover:opacity-80"
                >
                  Unsubscribe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const FeedView: React.FC = () => {
  const { subscriptions, feedGroups, settings } = useYmnTube();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [items, setItems] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(false);

  const targetChannelIds =
    selectedGroupId === 'all'
      ? subscriptions.map((s) => s.id)
      : feedGroups.find((g) => g.id === selectedGroupId)?.channelIds || [];

  const loadFeed = () => {
    if (targetChannelIds.length === 0) {
      setItems([]);
      return;
    }
    setLoading(true);
    fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelIds: targetChannelIds }),
    })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFeed();
  }, [selectedGroupId, subscriptions.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Rss className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-lg font-bold">What's New</h2>
          <button
            onClick={() => setSelectedGroupId('all')}
            className={`rounded-lg px-3 py-1 text-xs font-medium ${
              selectedGroupId === 'all' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-card)]'
            }`}
          >
            All Subscriptions
          </button>
          {feedGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroupId(g.id)}
              className={`rounded-lg px-3 py-1 text-xs font-medium ${
                selectedGroupId === g.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-card)]'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadFeed}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs hover:bg-[var(--bg-contrast)]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Feed
          </button>
          <ViewModeToggle />
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-[var(--text-secondary)]">Refreshing subscription feeds...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-secondary)]">
          No recent feed items. Subscribe to channels and click Refresh Feed.
        </div>
      ) : (
        <div className={streamGridClass(settings.viewMode)}>
          {items.map((item) => (
            <StreamCard key={item.id} stream={item} viewMode={settings.viewMode} />
          ))}
        </div>
      )}
    </div>
  );
};

export const HistoryView: React.FC = () => {
  const { history, clearWatchHistory, playAll, settings } = useYmnTube();
  const [sortBy, setSortBy] = useState<'recent' | 'most'>('recent');

  const sorted = [...history].sort((a, b) =>
    sortBy === 'most' ? b.repeatCount - a.repeatCount : b.accessDate - a.accessDate
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-bold">Watch History</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSortBy('recent')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              sortBy === 'recent' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-card)]'
            }`}
          >
            Recently Watched
          </button>
          <button
            onClick={() => setSortBy('most')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              sortBy === 'most' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-card)]'
            }`}
          >
            Most Played
          </button>
          {sorted.length > 0 && (
            <>
              <button
                onClick={() => playAll(sorted.map((h) => h.stream))}
                className="flex items-center gap-1 rounded-lg bg-[var(--bg-contrast)] px-3 py-1.5 text-xs font-medium"
              >
                <Play className="h-3.5 w-3.5" /> Play All
              </button>
              <button
                onClick={clearWatchHistory}
                className="flex items-center gap-1 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs text-[var(--accent)] hover:bg-[var(--bg-contrast)]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            </>
          )}
          <ViewModeToggle />
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-secondary)]">
          Your watch history is empty.
        </div>
      ) : (
        <div className={streamGridClass(settings.viewMode)}>
          {sorted.map((entry) => (
            <StreamCard
              key={entry.stream.id}
              stream={entry.stream}
              viewMode={settings.viewMode}
              extraMeta={sortBy === 'most' ? `Played ${entry.repeatCount}×` : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DownloadsView: React.FC = () => {
  const { downloads, toggleDownloadPause, deleteDownload, clearCompletedDownloads, playStream } = useYmnTube();

  const barColors = {
    video: { bg: '#CD5656', fill: '#BC211D' },
    audio: { bg: '#555555', fill: '#111111' },
    subtitle: { bg: '#008ea4', fill: '#005a71' },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-bold">Downloads</h2>
        </div>
        {downloads.some((d) => d.status === 'completed') && (
          <button
            onClick={clearCompletedDownloads}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-xs hover:bg-[var(--bg-contrast)]"
          >
            Clear Completed
          </button>
        )}
      </div>

      {downloads.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-secondary)]">
          No download missions queued. Click Download on any stream to start.
        </div>
      ) : (
        <div className="space-y-2.5">
          {downloads.map((d) => {
            const palette = barColors[d.kind];
            return (
              <div
                key={d.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3"
              >
                <img
                  src={d.stream.thumbnail}
                  alt={d.stream.title}
                  onClick={() => playStream(d.stream)}
                  className="h-14 w-24 shrink-0 cursor-pointer rounded bg-black object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.stream.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="uppercase">{d.kind}</span>
                    <span>•</span>
                    <span>{d.quality}</span>
                    <span>•</span>
                    <span>{d.sizeText}</span>
                    <span>•</span>
                    <span className="capitalize">{d.status}</span>
                  </div>
                  <div
                    className="mt-2 h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: `${palette.bg}33` }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${d.progress}%`, backgroundColor: palette.fill }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {d.status === 'completed' ? (
                    <span className="flex items-center gap-1 px-2 text-xs font-medium text-emerald-500">
                      <CheckCircle2 className="h-4 w-4" /> Done
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleDownloadPause(d.id)}
                      className="rounded-full p-2 hover:bg-[var(--bg-contrast)]"
                      title={d.status === 'paused' ? 'Resume' : 'Pause'}
                    >
                      {d.status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => deleteDownload(d.id)}
                    className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-contrast)]"
                    title="Delete mission"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
