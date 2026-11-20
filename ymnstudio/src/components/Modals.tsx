import React, { useState } from 'react';
import { Check, Download, Film, ListPlus, Music, Plus, Subtitles, X } from 'lucide-react';
import { useYmnTube } from '../store';

export const Modals: React.FC = () => {
  const {
    playlistModalStream,
    setPlaylistModalStream,
    playlists,
    createPlaylist,
    addStreamToPlaylist,
    removeStreamFromPlaylist,
    downloadModalStream,
    setDownloadModalStream,
    startDownload,
  } = useYmnTube();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [dlKind, setDlKind] = useState<'video' | 'audio' | 'subtitle'>('video');
  const [dlQuality, setDlQuality] = useState('1080p MP4');

  const qualityOptions: Record<'video' | 'audio' | 'subtitle', { format: string; label: string }[]> = {
    video: [
      { format: 'MPEG-4', label: '1080p60 MP4' },
      { format: 'MPEG-4', label: '720p MP4' },
      { format: 'WebM', label: '1080p WebM (VP9)' },
      { format: 'MPEG-4', label: '480p MP4' },
      { format: 'MPEG-4', label: '360p MP4' },
    ],
    audio: [
      { format: 'M4A', label: 'M4A 128 kbps' },
      { format: 'WebM Opus', label: 'Opus 160 kbps' },
      { format: 'WebM Opus', label: 'Opus 70 kbps' },
    ],
    subtitle: [
      { format: 'SRT', label: 'English (SRT)' },
      { format: 'TTML', label: 'English (TTML)' },
    ],
  };

  return (
    <>
      {playlistModalStream && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPlaylistModalStream(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2 font-semibold">
                <ListPlus className="h-5 w-5 text-[var(--accent)]" />
                <span>Add to Playlist</span>
              </div>
              <button
                onClick={() => setPlaylistModalStream(null)}
                className="rounded-full p-1 hover:bg-[var(--bg-contrast)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 line-clamp-1 text-xs text-[var(--text-secondary)]">{playlistModalStream.title}</p>

            <div className="mt-3 max-h-60 space-y-1.5 overflow-y-auto">
              {playlists.map((pl) => {
                const inList = pl.items.some((i) => i.id === playlistModalStream.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() =>
                      inList
                        ? removeStreamFromPlaylist(pl.id, playlistModalStream.id)
                        : addStreamToPlaylist(pl.id, playlistModalStream)
                    }
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-[var(--bg-contrast)]"
                  >
                    <div>
                      <div className="font-medium">{pl.name}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{pl.items.length} streams</div>
                    </div>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border ${
                        inList
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                          : 'border-[var(--border-color)]'
                      }`}
                    >
                      {inList && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPlaylistName.trim()) return;
                createPlaylist(newPlaylistName, playlistModalStream);
                setNewPlaylistName('');
              }}
              className="mt-4 flex gap-2 border-t border-[var(--border-color)] pt-3"
            >
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="New playlist name..."
                className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                <Plus className="h-4 w-4" /> Create
              </button>
            </form>
          </div>
        </div>
      )}

      {downloadModalStream && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDownloadModalStream(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2 font-semibold">
                <Download className="h-5 w-5 text-[var(--accent)]" />
                <span>Download Stream</span>
              </div>
              <button
                onClick={() => setDownloadModalStream(null)}
                className="rounded-full p-1 hover:bg-[var(--bg-contrast)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 line-clamp-2 text-sm font-medium">{downloadModalStream.title}</p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setDlKind('video');
                  setDlQuality(qualityOptions.video[0].label);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium ${
                  dlKind === 'video' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-contrast)]'
                }`}
              >
                <Film className="h-4 w-4" /> Video
              </button>
              <button
                onClick={() => {
                  setDlKind('audio');
                  setDlQuality(qualityOptions.audio[0].label);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium ${
                  dlKind === 'audio' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-contrast)]'
                }`}
              >
                <Music className="h-4 w-4" /> Audio
              </button>
              <button
                onClick={() => {
                  setDlKind('subtitle');
                  setDlQuality(qualityOptions.subtitle[0].label);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium ${
                  dlKind === 'subtitle' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-contrast)]'
                }`}
              >
                <Subtitles className="h-4 w-4" /> Subtitles
              </button>
            </div>

            <div className="mt-3 space-y-1.5">
              {qualityOptions[dlKind].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setDlQuality(opt.label)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                    dlQuality === opt.label
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 font-medium'
                      : 'border-[var(--border-color)] hover:bg-[var(--bg-contrast)]'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{opt.format}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDownloadModalStream(null)}
                className="rounded-lg px-4 py-2 text-sm hover:bg-[var(--bg-contrast)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const opt =
                    qualityOptions[dlKind].find((o) => o.label === dlQuality) || qualityOptions[dlKind][0];
                  startDownload(downloadModalStream, dlKind, opt.format, opt.label);
                  setDownloadModalStream(null);
                }}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
