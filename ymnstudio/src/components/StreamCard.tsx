import React, { useState } from 'react';
import { Download, ListPlus, MoreVertical, Play, PlusCircle } from 'lucide-react';
import type { ItemViewMode, StreamItem } from '../types';
import { useYmnTube } from '../store';

interface StreamCardProps {
  stream: StreamItem;
  viewMode: ItemViewMode;
  extraMeta?: string;
}

export const StreamCard: React.FC<StreamCardProps> = ({ stream, viewMode, extraMeta }) => {
  const { playStream, enqueueNext, enqueueEnd, setPlaylistModalStream, setDownloadModalStream, navigate } =
    useYmnTube();
  const [menuOpen, setMenuOpen] = useState(false);

  const openChannel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stream.uploaderId) {
      navigate('channel', { channelId: stream.uploaderId });
    }
  };

  const durationBadge = (
    <span
      className={`absolute bottom-1.5 right-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium text-white ${
        stream.isLive ? 'bg-[#e53935]/90' : 'bg-black/80'
      }`}
    >
      {stream.isLive ? 'LIVE' : stream.durationText || '0:00'}
    </span>
  );

  const actionMenu = menuOpen && (
    <div
      className="absolute right-1 top-8 z-30 w-48 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] py-1 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-[var(--bg-contrast)]"
        onClick={() => {
          setMenuOpen(false);
          enqueueNext(stream);
        }}
      >
        <Play className="h-3.5 w-3.5" /> Play next in queue
      </button>
      <button
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-[var(--bg-contrast)]"
        onClick={() => {
          setMenuOpen(false);
          enqueueEnd(stream);
        }}
      >
        <PlusCircle className="h-3.5 w-3.5" /> Enqueue to queue
      </button>
      <button
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-[var(--bg-contrast)]"
        onClick={() => {
          setMenuOpen(false);
          setPlaylistModalStream(stream);
        }}
      >
        <ListPlus className="h-3.5 w-3.5" /> Add to playlist
      </button>
      <button
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-[var(--bg-contrast)]"
        onClick={() => {
          setMenuOpen(false);
          setDownloadModalStream(stream);
        }}
      >
        <Download className="h-3.5 w-3.5" /> Download
      </button>
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => playStream(stream)}
        className="group relative flex cursor-pointer gap-3 rounded-lg p-2 transition hover:bg-[var(--bg-contrast)]"
      >
        <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-md bg-black sm:w-44">
          <img src={stream.thumbnail} alt={stream.title} className="h-full w-full object-cover" loading="lazy" />
          {durationBadge}
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[var(--text-primary)]">{stream.title}</h3>
          <button
            onClick={openChannel}
            className="mt-1 block truncate text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]"
          >
            {stream.uploaderName}
          </button>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {[stream.viewCountText, stream.uploadedDate, extraMeta].filter(Boolean).join(' • ')}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          aria-label="More options"
          className="h-8 w-8 shrink-0 rounded-full p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-contrast)]"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {actionMenu}
      </div>
    );
  }

  return (
    <div
      onClick={() => playStream(stream)}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-lg transition ${
        viewMode === 'card'
          ? 'border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm'
          : 'hover:bg-[var(--bg-card)]'
      }`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <img
          src={stream.thumbnail}
          alt={stream.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        {durationBadge}
      </div>
      <div className="flex items-start gap-2.5 p-2.5">
        {stream.uploaderAvatar ? (
          <img
            src={stream.uploaderAvatar}
            alt={stream.uploaderName}
            onClick={openChannel}
            className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-[var(--bg-contrast)] object-cover"
          />
        ) : (
          <div
            onClick={openChannel}
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary-header)] text-xs font-bold text-white"
          >
            {stream.uploaderName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[var(--text-primary)]">{stream.title}</h3>
          <button
            onClick={openChannel}
            className="mt-1 block truncate text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]"
          >
            {stream.uploaderName}
          </button>
          <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
            {[stream.viewCountText, stream.uploadedDate, extraMeta].filter(Boolean).join(' • ')}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          aria-label="More options"
          className="h-7 w-7 shrink-0 rounded-full p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-contrast)]"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
      {actionMenu}
    </div>
  );
};
