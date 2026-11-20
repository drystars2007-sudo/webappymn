import React, { useRef, useState } from 'react';
import {
  Check,
  Database,
  Download,
  Info,
  Palette,
  RotateCcw,
  Search,
  Sliders,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import type { HomeTabConfig, ItemViewMode, ThemeMode } from '../types';
import { DEFAULT_TABS, useYmnTube } from '../store';

const AVAILABLE_TABS: HomeTabConfig[] = [
  { id: 'tab-kiosk', type: 'kiosk', title: 'Trending' },
  { id: 'tab-bookmarks', type: 'bookmarks', title: 'Bookmarked Playlists' },
  { id: 'tab-subscriptions', type: 'subscriptions', title: 'Subscriptions' },
  { id: 'tab-feed', type: 'feed', title: "What's New" },
];

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetSettings,
    clearWatchHistory,
    clearSearchHistory,
    exportBackupJson,
    importBackupJson,
    showToast,
  } = useYmnTube();

  const [filterText, setFilterText] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const q = filterText.trim().toLowerCase();
  const matches = (keywords: string) => !q || keywords.toLowerCase().includes(q);

  const toggleTab = (tab: HomeTabConfig) => {
    const exists = settings.tabs.some((t) => t.id === tab.id);
    if (exists && settings.tabs.length <= 1) {
      showToast('At least one home tab must remain');
      return;
    }
    const next = exists ? settings.tabs.filter((t) => t.id !== tab.id) : [...settings.tabs, tab];
    updateSettings({ tabs: next });
  };

  const handleWipeMetadataCache = async () => {
    try {
      await fetch('/api/cache/clear', { method: 'POST' });
      showToast('Metadata cache wiped');
    } catch {
      showToast('Failed to clear cache');
    }
  };

  const handleExportBackup = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `YmnTubeData-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Backup exported');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importBackupJson(text);
    e.target.value = '';
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Settings</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search settings..."
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-xs outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {matches('appearance theme light dark black view mode grid list card') && (
        <section className="space-y-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
            <Palette className="h-4 w-4" /> Appearance
          </h3>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[var(--text-secondary)]">Theme</div>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'black'] as ThemeMode[]).map((t) => (
                <button
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium capitalize ${
                    settings.theme === t
                      ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                      : 'border-[var(--border-color)] hover:bg-[var(--bg-contrast)]'
                  }`}
                >
                  {settings.theme === t && <Check className="h-3.5 w-3.5" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[var(--text-secondary)]">Default Item View Mode</div>
            <div className="grid grid-cols-3 gap-2">
              {(['list', 'grid', 'card'] as ItemViewMode[]).map((vm) => (
                <button
                  key={vm}
                  onClick={() => updateSettings({ viewMode: vm })}
                  className={`rounded-lg border py-2 text-xs font-medium capitalize ${
                    settings.viewMode === vm
                      ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                      : 'border-[var(--border-color)] hover:bg-[var(--bg-contrast)]'
                  }`}
                >
                  {vm}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {matches('content home tabs trending bookmarks subscriptions feed') && (
        <section className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
              <Sliders className="h-4 w-4" /> Content & Home Tabs
            </h3>
            <button
              onClick={() => updateSettings({ tabs: DEFAULT_TABS })}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]"
            >
              Reset tabs
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {AVAILABLE_TABS.map((tab) => {
              const active = settings.tabs.some((t) => t.id === tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => toggleTab(tab)}
                  className="flex items-center justify-between rounded-lg border border-[var(--border-color)] px-3 py-2.5 text-xs hover:bg-[var(--bg-contrast)]"
                >
                  <span className="font-medium">{tab.title}</span>
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      active ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border-color)]'
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {matches('video audio player resolution autoplay comments description related') && (
        <section className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
            <Video className="h-4 w-4" /> Video & Audio
          </h3>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-sm font-medium">Default Resolution</div>
              <div className="text-xs text-[var(--text-secondary)]">Preferred stream quality</div>
            </div>
            <select
              value={settings.defaultResolution}
              onChange={(e) => updateSettings({ defaultResolution: e.target.value })}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-2.5 py-1.5 text-xs"
            >
              {['1080p', '720p', '480p', '360p'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {[
            { key: 'autoplay' as const, label: 'Autoplay on open', sub: 'Start playback immediately when opening a video' },
            { key: 'showDescription' as const, label: 'Show description', sub: 'Display video description & chapters' },
            { key: 'showComments' as const, label: 'Show comments', sub: 'Display comments tab in video detail' },
            { key: 'showRelated' as const, label: "Show 'Next' and 'Similar' videos", sub: 'Display related streams panel' },
          ].map((item) => (
            <label key={item.key} className="flex cursor-pointer items-center justify-between py-1">
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-[var(--text-secondary)]">{item.sub}</div>
              </div>
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={(e) => updateSettings({ [item.key]: e.target.checked })}
                className="h-4 w-4 accent-[var(--accent)]"
              />
            </label>
          ))}
        </section>
      )}

      {matches('history cache watch search wipe clear metadata') && (
        <section className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
            <Database className="h-4 w-4" /> History & Cache
          </h3>

          <label className="flex cursor-pointer items-center justify-between py-1">
            <div>
              <div className="text-sm font-medium">Watch history</div>
              <div className="text-xs text-[var(--text-secondary)]">Keep track of watched streams</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableWatchHistory}
              onChange={(e) => updateSettings({ enableWatchHistory: e.target.checked })}
              className="h-4 w-4 accent-[var(--accent)]"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between py-1">
            <div>
              <div className="text-sm font-medium">Search history</div>
              <div className="text-xs text-[var(--text-secondary)]">Save search queries locally</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableSearchHistory}
              onChange={(e) => updateSettings({ enableSearchHistory: e.target.checked })}
              className="h-4 w-4 accent-[var(--accent)]"
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={clearWatchHistory}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs hover:bg-[var(--bg-contrast)]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear Watch History
            </button>
            <button
              onClick={clearSearchHistory}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs hover:bg-[var(--bg-contrast)]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear Search History
            </button>
            <button
              onClick={handleWipeMetadataCache}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs hover:bg-[var(--bg-contrast)]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Wipe Cached Metadata
            </button>
          </div>
        </section>
      )}

      {matches('backup restore export import reset') && (
        <section className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
            <Download className="h-4 w-4" /> Backup & Restore
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              <Download className="h-3.5 w-3.5" /> Export Backup
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3.5 py-2 text-xs font-medium hover:bg-[var(--bg-contrast)]"
            >
              <Upload className="h-3.5 w-3.5" /> Import Backup
            </button>
            <button
              onClick={resetSettings}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3.5 py-2 text-xs font-medium text-[var(--accent)] hover:bg-[var(--bg-contrast)]"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Settings
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </div>
        </section>
      )}
    </div>
  );
};

export const AboutView: React.FC = () => {
  return (
    <div className="mx-auto max-w-xl space-y-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center">
      <img src="/assets/ic_launcher.png" alt="YmnTube" className="mx-auto h-20 w-20 rounded-2xl shadow-lg" />
      <div>
        <h1 className="text-2xl font-bold">YmnTube</h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Based on NewPipe • GPL-3.0-or-later</p>
      </div>
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        YmnTube is a privacy-respecting YouTube streaming client. Browse trending streams, search videos and channels,
        manage local playlists and subscriptions without a Google account, and keep your watch history stored locally in
        your browser.
      </p>
      <div className="flex items-center justify-center gap-2 rounded-lg bg-[var(--bg-contrast)] p-3 text-xs text-[var(--text-secondary)]">
        <Info className="h-4 w-4 shrink-0 text-[var(--accent)]" />
        <span>All subscriptions, playlists, watch history, and preferences stay local on your device.</span>
      </div>
    </div>
  );
};
