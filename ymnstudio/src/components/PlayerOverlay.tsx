import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ListMusic,
  ListPlus,
  MessageSquare,
  Play,
  Share2,
  SkipBack,
  SkipForward,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';
import type { VideoDetail } from '../types';
import { useYmnTube } from '../store';
import { StreamCard } from './StreamCard';

function formatTimestamp(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const PlayerOverlay: React.FC = () => {
  const {
    currentStream,
    playQueue,
    currentQueueIndex,
    playerOpen,
    playerMinimized,
    playerStartSeconds,
    setPlayerMinimized,
    closePlayer,
    playNext,
    playPrevious,
    selectQueueIndex,
    removeFromQueue,
    clearQueue,
    seekPlayerTo,
    isSubscribed,
    toggleSubscribe,
    setPlaylistModalStream,
    setDownloadModalStream,
    navigate,
    settings,
    showToast,
  } = useYmnTube();

  const [detail, setDetail] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'comments' | 'related' | 'queue'>('related');

  useEffect(() => {
    if (!currentStream) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/video/${encodeURIComponent(currentStream.id)}`)
      .then((r) => r.json())
      .then((data: VideoDetail) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentStream?.id]);

  if (!playerOpen || !currentStream) return null;

  const subscribed = detail?.uploaderId ? isSubscribed(detail.uploaderId) : isSubscribed(currentStream.uploaderId);
  const activeChannelId = detail?.uploaderId || currentStream.uploaderId;
  const activeChannelName = detail?.uploaderName || currentStream.uploaderName;
  const activeAvatar = detail?.uploaderAvatar || currentStream.uploaderAvatar || '/assets/ic_launcher.png';

  const handleShare = async () => {
    const shareUrl = `https://www.youtube.com/watch?v=${currentStream.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Stream URL copied to clipboard');
    } catch {
      showToast(shareUrl);
    }
  };

  if (playerMinimized) {
    return (
      <div className="fixed bottom-16 left-2 right-2 z-40 mx-auto flex max-w-2xl items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2 shadow-2xl md:bottom-4 md:left-auto md:right-4 md:w-[420px]">
        <div
          onClick={() => setPlayerMinimized(false)}
          className="relative h-12 w-20 shrink-0 cursor-pointer overflow-hidden rounded-md bg-black"
        >
          <img src={currentStream.thumbnail} alt={currentStream.title} className="h-full w-full object-cover" />
        </div>
        <div onClick={() => setPlayerMinimized(false)} className="min-w-0 flex-1 cursor-pointer">
          <div className="truncate text-xs font-medium text-[var(--text-primary)]">{currentStream.title}</div>
          <div className="truncate text-[11px] text-[var(--text-secondary)]">{activeChannelName}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={playPrevious}
            disabled={currentQueueIndex <= 0}
            className="rounded-full p-1.5 hover:bg-[var(--bg-contrast)] disabled:opacity-40"
            title="Previous"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={playNext}
            disabled={currentQueueIndex >= playQueue.length - 1}
            className="rounded-full p-1.5 hover:bg-[var(--bg-contrast)] disabled:opacity-40"
            title="Next"
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPlayerMinimized(false)}
            className="rounded-full p-1.5 hover:bg-[var(--bg-contrast)]"
            title="Expand player"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={closePlayer}
            className="rounded-full p-1.5 hover:bg-[var(--bg-contrast)]"
            title="Close player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[var(--bg-main)]">
      {/* Top Player Bar */}
      <div className="flex h-12 shrink-0 items-center justify-between bg-black px-3 text-white">
        <button
          onClick={() => setPlayerMinimized(true)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm hover:bg-white/10"
        >
          <ChevronDown className="h-5 w-5" />
          <span className="hidden sm:inline">Minimize</span>
        </button>
        <span className="max-w-[60%] truncate text-xs font-medium text-white/85">{currentStream.title}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={playPrevious}
            disabled={currentQueueIndex <= 0}
            className="rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-35"
            title="Previous in queue"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={playNext}
            disabled={currentQueueIndex >= playQueue.length - 1}
            className="rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-35"
            title="Next in queue"
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <button onClick={closePlayer} className="rounded-lg p-1.5 hover:bg-white/10" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Video Detail */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-0 lg:grid-cols-3 lg:p-6">
          {/* Left Column: Player + Metadata */}
          <div className="lg:col-span-2">
            <div className="aspect-video w-full overflow-hidden bg-black lg:rounded-xl">
              <iframe
                key={`${currentStream.id}-${playerStartSeconds}`}
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(currentStream.id)}?autoplay=${
                  settings.autoplay ? 1 : 0
                }&start=${playerStartSeconds}&rel=0`}
                title={currentStream.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-4 lg:px-0">
              <h1 className="text-lg font-semibold leading-snug text-[var(--text-primary)]">
                {detail?.title || currentStream.title}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span>{detail?.viewCountText || currentStream.viewCountText || 'YouTube'}</span>
                {(detail?.uploadedDate || currentStream.uploadedDate) && (
                  <>
                    <span>•</span>
                    <span>{detail?.uploadedDate || currentStream.uploadedDate}</span>
                  </>
                )}
              </div>

              {/* Channel + Subscribe Row */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
                <button
                  onClick={() => {
                    if (activeChannelId) {
                      setPlayerMinimized(true);
                      navigate('channel', { channelId: activeChannelId });
                    }
                  }}
                  className="flex items-center gap-3 text-left"
                >
                  <img
                    src={activeAvatar}
                    alt={activeChannelName}
                    className="h-10 w-10 rounded-full bg-[var(--bg-contrast)] object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{activeChannelName}</div>
                    {detail?.subscriberCountText && (
                      <div className="text-xs text-[var(--text-secondary)]">{detail.subscriberCountText}</div>
                    )}
                  </div>
                </button>

                {activeChannelId && (
                  <button
                    onClick={() =>
                      toggleSubscribe({
                        id: activeChannelId,
                        name: activeChannelName,
                        url: `https://www.youtube.com/channel/${activeChannelId}`,
                        avatar: activeAvatar,
                        subscriberCountText: detail?.subscriberCountText,
                      })
                    }
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                      subscribed
                        ? 'bg-[var(--bg-contrast)] text-[var(--text-secondary)]'
                        : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
                    }`}
                  >
                    {subscribed ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                    {subscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                )}
              </div>

              {/* Action Controls Row */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setPlaylistModalStream(currentStream)}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium hover:bg-[var(--bg-contrast)]"
                >
                  <ListPlus className="h-4 w-4" /> Add to playlist
                </button>
                <button
                  onClick={() => setDownloadModalStream(currentStream)}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium hover:bg-[var(--bg-contrast)]"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium hover:bg-[var(--bg-contrast)]"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>

              {/* Detail Tabs (Mobile & Desktop) */}
              <div className="mt-5 flex border-b border-[var(--border-color)] text-xs font-medium">
                {settings.showRelated && (
                  <button
                    onClick={() => setActiveTab('related')}
                    className={`border-b-2 px-4 py-2.5 lg:hidden ${
                      activeTab === 'related'
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-transparent text-[var(--text-secondary)]'
                    }`}
                  >
                    Related
                  </button>
                )}
                {settings.showDescription && (
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`border-b-2 px-4 py-2.5 ${
                      activeTab === 'description'
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-transparent text-[var(--text-secondary)]'
                    }`}
                  >
                    Description
                  </button>
                )}
                {settings.showComments && (
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 ${
                      activeTab === 'comments'
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-transparent text-[var(--text-secondary)]'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Comments
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('queue')}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 ${
                    activeTab === 'queue'
                      ? 'border-[var(--accent)] text-[var(--accent)]'
                      : 'border-transparent text-[var(--text-secondary)]'
                  }`}
                >
                  <ListMusic className="h-3.5 w-3.5" /> Queue ({playQueue.length})
                </button>
              </div>

              {/* Tab Body */}
              <div className="mt-4">
                {(activeTab === 'description' || (activeTab === 'related' && !settings.showRelated)) && (
                  <div className="space-y-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
                    {loading ? (
                      <p className="text-xs text-[var(--text-secondary)]">Loading description...</p>
                    ) : (
                      <>
                        {detail?.chapters && detail.chapters.length > 0 && (
                          <div>
                            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                              <Clock className="h-3.5 w-3.5" /> Chapters
                            </h3>
                            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                              {detail.chapters.map((ch) => (
                                <button
                                  key={`${ch.startSeconds}-${ch.title}`}
                                  onClick={() => seekPlayerTo(ch.startSeconds)}
                                  className="flex items-center justify-between rounded-lg bg-[var(--bg-contrast)] px-3 py-2 text-left text-xs hover:opacity-90"
                                >
                                  <span className="truncate pr-2 font-medium">{ch.title}</span>
                                  <span className="shrink-0 font-mono text-[var(--accent)]">
                                    {formatTimestamp(ch.startSeconds)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--text-primary)]">
                          {detail?.description || currentStream.shortDescription || 'No description available.'}
                        </pre>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="space-y-3">
                    {loading && <p className="text-xs text-[var(--text-secondary)]">Loading comments...</p>}
                    {!loading && (!detail?.comments || detail.comments.length === 0) && (
                      <p className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-xs text-[var(--text-secondary)]">
                        No comments retrieved for this stream.
                      </p>
                    )}
                    {detail?.comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{c.author}</span>
                          <span className="text-[var(--text-secondary)]">{c.publishedTime}</span>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-[var(--text-primary)]">{c.text}</p>
                        <div className="mt-2 flex items-center gap-1 text-[var(--text-secondary)]">
                          <ThumbsUp className="h-3 w-3" /> {c.likeCount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'queue' && (
                  <div className="space-y-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                        Play Queue ({playQueue.length})
                      </span>
                      <button
                        onClick={clearQueue}
                        className="text-xs font-medium text-[var(--accent)] hover:underline"
                      >
                        Clear queue
                      </button>
                    </div>
                    {playQueue.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        onClick={() => selectQueueIndex(idx)}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 ${
                          idx === currentQueueIndex ? 'bg-[var(--accent)]/15' : 'hover:bg-[var(--bg-contrast)]'
                        }`}
                      >
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-black">
                          <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                          {idx === currentQueueIndex && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium">{item.title}</div>
                          <div className="truncate text-[11px] text-[var(--text-secondary)]">{item.uploaderName}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromQueue(idx);
                          }}
                          className="rounded-full p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-contrast)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'related' && (
                  <div className="space-y-1 lg:hidden">
                    {(detail?.related || []).map((rel) => (
                      <StreamCard key={rel.id} stream={rel} viewMode="list" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Desktop Related Streams) */}
          {settings.showRelated && (
            <div className="hidden lg:block">
              <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Next & Similar</h2>
              <div className="space-y-1">
                {loading && !detail && (
                  <p className="text-xs text-[var(--text-secondary)]">Loading related streams...</p>
                )}
                {(detail?.related || []).map((rel) => (
                  <StreamCard key={rel.id} stream={rel} viewMode="list" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
