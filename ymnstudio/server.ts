import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ChannelInfo,
  ChannelSummary,
  ChapterItem,
  CommentItem,
  StreamItem,
  VideoDetail,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T, ttlMs = CACHE_TTL_MS): T {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

// Curated fallback streams & channels (used only if live YouTube requests fail or are blocked)
const FALLBACK_CHANNELS: ChannelInfo[] = [
  {
    id: 'UCXuqSBlHAE6Xw-yeJA0Tunw',
    name: 'Linus Tech Tips',
    avatar: 'https://yt3.googleusercontent.com/Vy6KL7EM_apxPSxF0pPy5w_c87YDTOlBQo3MADDF0Wl51kwxmt9wmRotnt2xQXwlrcyO0Xe56w=s176-c-k-c0x00ffffff-no-rj',
    banner: '/assets/placeholder_channel_banner.png',
    subscriberCountText: '16M subscribers',
    description:
      'Linus Tech Tips is a passionate team of professionally curious experts in consumer technology and video production.',
    videos: [
      {
        id: 'dQw4w9WgXcQ',
        title: 'Building the Ultimate Silent Workstation — 2026 Edition',
        uploaderName: 'Linus Tech Tips',
        uploaderId: 'UCXuqSBlHAE6Xw-yeJA0Tunw',
        thumbnail: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
        duration: 942,
        durationText: '15:42',
        viewCount: 1240000,
        viewCountText: '1.2M views',
        uploadedDate: '2 days ago',
      },
    ],
  },
  {
    id: 'UCBJycsmduvYEL83R_U4JriQ',
    name: 'Marques Brownlee',
    avatar: 'https://yt3.googleusercontent.com/lkH37D712tiyphnu0Id0D5MwwQ7IRuwgQLVD05iMXlDWO-kDHut3uI4MgIEAQ9StK0qOST7fiA=s176-c-k-c0x00ffffff-no-rj',
    banner: '/assets/placeholder_channel_banner.png',
    subscriberCountText: '19.8M subscribers',
    description: 'MKBHD: Quality Tech Videos | YouTuber | Geek | Consumer Electronics.',
    videos: [],
  },
  {
    id: 'UCCj956IF62FbT7Gouszaj9w',
    name: 'BBC',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_nN0yR6c2qH8m1pQ-v9z9K_W_fF3xG3uG6Q8A=s176-c-k-c0x00ffffff-no-rj',
    banner: '/assets/placeholder_channel_banner.png',
    subscriberCountText: '14.5M subscribers',
    description:
      'The BBC is the world’s leading public service broadcaster. Science, nature documentaries, comedy, and entertainment.',
    videos: [],
  },
  {
    id: 'UCLA_DiR1FfKNvjuUpBHmylQ',
    name: 'NASA',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_mL9n2kM8x_vP8qK9j6sQ8W0sK1gR5wP5v9Jg=s176-c-k-c0x00ffffff-no-rj',
    banner: '/assets/placeholder_channel_banner.png',
    subscriberCountText: '12.1M subscribers',
    description: "NASA's mission is to pioneer the future in space exploration, scientific discovery and aeronautics research.",
    videos: [],
  },
];

const FALLBACK_STREAMS: StreamItem[] = [
  {
    id: 'aqz-KE-bpKQ',
    title: 'Big Buck Bunny 60fps 4K - Blender Open Movie',
    uploaderName: 'Blender Foundation',
    uploaderId: 'UCSMOQeBJ2RAnuFungnQOxLg',
    thumbnail: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
    duration: 634,
    durationText: '10:34',
    viewCount: 18500000,
    viewCountText: '18.5M views',
    uploadedDate: '3 weeks ago',
    shortDescription: 'Blender Foundation open movie project in crisp 4K 60fps.',
  },
  {
    id: 'YE7VzlLtp-4',
    title: 'Big Buck Bunny (Original HD Release)',
    uploaderName: 'Blender Foundation',
    uploaderId: 'UCSMOQeBJ2RAnuFungnQOxLg',
    thumbnail: 'https://i.ytimg.com/vi/YE7VzlLtp-4/hqdefault.jpg',
    duration: 596,
    durationText: '9:56',
    viewCount: 12300000,
    viewCountText: '12.3M views',
    uploadedDate: '1 month ago',
  },
  {
    id: 'LXb3EKWsInQ',
    title: 'COSTA RICA IN 4K 60fps HDR (Ultra HD)',
    uploaderName: 'Jacob + Katie Schwarz',
    uploaderId: 'UCcJ4K_4N0L3vP0bX6K0H1Lw',
    thumbnail: 'https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg',
    duration: 314,
    durationText: '5:14',
    viewCount: 145000000,
    viewCountText: '145M views',
    uploadedDate: '2 months ago',
  },
  {
    id: '21X5lGlDOfg',
    title: 'NASA Live: Official Stream of NASA TV',
    uploaderName: 'NASA',
    uploaderId: 'UCLA_DiR1FfKNvjuUpBHmylQ',
    thumbnail: 'https://i.ytimg.com/vi/21X5lGlDOfg/hqdefault.jpg',
    duration: 0,
    durationText: 'LIVE',
    viewCount: 24500,
    viewCountText: '24.5K watching',
    uploadedDate: 'Live now',
    isLive: true,
  },
  {
    id: 'eRsGyueVLvQ',
    title: 'Sintel - Third Open Movie by Blender Foundation',
    uploaderName: 'Blender Foundation',
    uploaderId: 'UCSMOQeBJ2RAnuFungnQOxLg',
    thumbnail: 'https://i.ytimg.com/vi/eRsGyueVLvQ/hqdefault.jpg',
    duration: 888,
    durationText: '14:48',
    viewCount: 9100000,
    viewCountText: '9.1M views',
    uploadedDate: '4 months ago',
  },
  {
    id: 'R6MlUcmOul8',
    title: 'Tears of Steel - Blender VFX Open Movie',
    uploaderName: 'Blender Foundation',
    uploaderId: 'UCSMOQeBJ2RAnuFungnQOxLg',
    thumbnail: 'https://i.ytimg.com/vi/R6MlUcmOul8/hqdefault.jpg',
    duration: 734,
    durationText: '12:14',
    viewCount: 6400000,
    viewCountText: '6.4M views',
    uploadedDate: '6 months ago',
  },
  {
    id: 'jNQXAC9IVRw',
    title: 'Me at the zoo',
    uploaderName: 'jawed',
    uploaderId: 'UC4QobU6STFB0P71PMvOGN5A',
    thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
    duration: 19,
    durationText: '0:19',
    viewCount: 340000000,
    viewCountText: '340M views',
    uploadedDate: '19 years ago',
  },
  {
    id: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio 📚 beats to relax/study to',
    uploaderName: 'Lofi Girl',
    uploaderId: 'UCSJ4gkVC6NrvII8umztf0Ow',
    thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    duration: 0,
    durationText: 'LIVE',
    viewCount: 38200,
    viewCountText: '38.2K watching',
    uploadedDate: 'Live now',
    isLive: true,
  },
];

async function fetchYouTubeText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+667;',
    },
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) {
    throw new Error(`YouTube HTTP ${res.status}`);
  }
  return res.text();
}

function extractJsonAfterMarker(html: string, marker: string): Record<string, any> | null {
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  const start = html.indexOf('{', idx + marker.length);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const jsonStr = html.slice(start, i + 1);
        try {
          return JSON.parse(jsonStr);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function textFromRuns(obj: any): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj.simpleText === 'string') return obj.simpleText;
  if (Array.isArray(obj.runs)) {
    return obj.runs.map((r: any) => r?.text ?? '').join('');
  }
  if (typeof obj.content === 'string') return obj.content;
  return '';
}

function parseDurationTextToSeconds(text: string): number {
  if (!text || text.toUpperCase() === 'LIVE') return 0;
  const parts = text
    .trim()
    .split(':')
    .map((p) => Number(p))
    .filter((n) => !Number.isNaN(n));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function parseVideoRenderer(v: any): StreamItem | null {
  if (!v || !v.videoId) return null;
  const title = textFromRuns(v.title) || 'Untitled video';
  const uploaderName =
    textFromRuns(v.ownerText) ||
    textFromRuns(v.shortBylineText) ||
    textFromRuns(v.longBylineText) ||
    'YouTube Channel';
  const browseId =
    v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
    v.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
    v.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
    '';
  const uploaderAvatar =
    v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.at(-1)?.url ||
    v.channelThumbnail?.thumbnails?.at(-1)?.url ||
    undefined;

  const thumbs = v.thumbnail?.thumbnails;
  const thumbnail =
    (Array.isArray(thumbs) && thumbs.length > 0 ? thumbs.at(-1).url : null) ||
    `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

  const durationText = textFromRuns(v.lengthText);
  const badges = Array.isArray(v.badges) ? v.badges : [];
  const isLive =
    !durationText &&
    (badges.some((b: any) => b?.metadataBadgeRenderer?.style?.includes('LIVE')) ||
      textFromRuns(v.thumbnailOverlays?.[0]?.thumbnailOverlayTimeStatusRenderer?.text).toUpperCase() === 'LIVE');

  const duration = parseDurationTextToSeconds(durationText);
  const viewCountText = textFromRuns(v.shortViewCountText) || textFromRuns(v.viewCountText) || '';
  const uploadedDate = textFromRuns(v.publishedTimeText) || (isLive ? 'Live now' : '');
  const shortDescription = textFromRuns(v.detailedMetadataSnippets?.[0]?.snippetText) || textFromRuns(v.descriptionSnippet);

  return {
    id: v.videoId,
    title,
    uploaderName,
    uploaderId: browseId,
    uploaderAvatar,
    thumbnail,
    duration,
    durationText: isLive ? 'LIVE' : durationText || undefined,
    viewCountText,
    uploadedDate,
    isLive,
    shortDescription: shortDescription || undefined,
  };
}

function collectNodesByKey(root: unknown, targetKeys: string[], out: any[] = []): any[] {
  if (!root || typeof root !== 'object') return out;
  if (Array.isArray(root)) {
    for (const item of root) collectNodesByKey(item, targetKeys, out);
    return out;
  }
  const rec = root as Record<string, unknown>;
  for (const key of targetKeys) {
    if (rec[key] && typeof rec[key] === 'object') {
      out.push({ key, node: rec[key] });
    }
  }
  for (const val of Object.values(rec)) {
    if (val && typeof val === 'object') {
      collectNodesByKey(val, targetKeys, out);
    }
  }
  return out;
}

function dedupeStreams(items: StreamItem[]): StreamItem[] {
  const seen = new Set<string>();
  const result: StreamItem[] = [];
  for (const item of items) {
    if (!item.id || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function parseChannelRenderer(c: any): ChannelSummary | null {
  if (!c || !c.channelId) return null;
  const thumbs = c.thumbnail?.thumbnails;
  let avatar = Array.isArray(thumbs) && thumbs.length > 0 ? thumbs.at(-1).url : '';
  if (avatar.startsWith('//')) avatar = `https:${avatar}`;
  return {
    id: c.channelId,
    name: textFromRuns(c.title) || 'Channel',
    avatar,
    subscriberCountText: textFromRuns(c.subscriberCountText) || textFromRuns(c.videoCountText) || '',
    description: textFromRuns(c.descriptionSnippet),
    videoCountText: textFromRuns(c.videoCountText),
  };
}

function parseDescriptionChapters(description: string): ChapterItem[] {
  const chapters: ChapterItem[] = [];
  const lines = description.split(/\r?\n/);
  const regex = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+[-–—]?\s*(.+)$/;
  for (const line of lines) {
    const m = line.trim().match(regex);
    if (!m) continue;
    const hours = m[1] ? Number(m[1]) : 0;
    const mins = Number(m[2]);
    const secs = Number(m[3]);
    const startSeconds = hours * 3600 + mins * 60 + secs;
    chapters.push({ title: m[4].trim(), startSeconds });
  }
  return chapters;
}

function parseRssFeedXml(xml: string, fallbackChannelName?: string): StreamItem[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  const items: StreamItem[] = [];
  const feedAuthorMatch = xml.match(/<author>\s*<name>([\s\S]*?)<\/name>/);
  const feedChannelIdMatch = xml.match(/<yt:channelId>([\s\S]*?)<\/yt:channelId>/);
  const channelName = decodeXml(feedAuthorMatch?.[1] || fallbackChannelName || 'Channel');
  const channelId = decodeXml(feedChannelIdMatch?.[1] || '');

  for (const entry of entries) {
    const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1]?.trim();
    if (!videoId) continue;
    const title = decodeXml(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] || 'Untitled');
    const published = entry.match(/<published>(.*?)<\/published>/)?.[1]?.trim() || '';
    const views = entry.match(/views="(\d+)"/)?.[1];
    const thumb = entry.match(/<media:thumbnail url="(.*?)"/)?.[1] || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const desc = decodeXml(entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] || '');

    items.push({
      id: videoId,
      title,
      uploaderName: channelName,
      uploaderId: channelId,
      thumbnail: thumb,
      duration: 0,
      viewCount: views ? Number(views) : undefined,
      viewCountText: views ? `${formatCompactNumber(Number(views))} views` : undefined,
      uploadedDate: published ? formatRelativeDate(published) : '',
      shortDescription: desc.slice(0, 140),
    });
  }
  return items;
}

function decodeXml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function formatCompactNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function formatRelativeDate(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
  const diffDays = Math.floor((Date.now() - ts) / 86_400_000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

async function fetchTrending(category: string): Promise<StreamItem[]> {
  const cacheKey = `trending:${category}`;
  const cached = getCached<StreamItem[]>(cacheKey);
  if (cached) return cached;

  const bpMap: Record<string, string> = {
    now: '',
    music: '4gINGgt5dG1hX2NoYXJ0cw%3D%3D',
    gaming: '4gIcGhpnYW1pbmdfY29ycHVzX21vc3RfcG9wdWxhcg%3D%3D',
    movies: '4gIKGgh0cmFpbGVycw%3D%3D',
  };
  const bp = bpMap[category] ?? '';
  const url = bp
    ? `https://www.youtube.com/feed/trending?bp=${bp}`
    : 'https://www.youtube.com/feed/trending';

  try {
    const html = await fetchYouTubeText(url);
    const data = extractJsonAfterMarker(html, 'var ytInitialData =') || extractJsonAfterMarker(html, 'ytInitialData =');
    if (data) {
      const nodes = collectNodesByKey(data, ['videoRenderer', 'gridVideoRenderer']);
      const parsed = dedupeStreams(nodes.map((n) => parseVideoRenderer(n.node)).filter(Boolean) as StreamItem[]);
      if (parsed.length > 0) {
        return setCached(cacheKey, parsed.slice(0, 30));
      }
    }
  } catch {
    // fallback below
  }

  // Fallback: fetch search for popular category if /feed/trending returns empty (YouTube deprecated trending tab in some regions)
  const fallbackQueryMap: Record<string, string> = {
    now: 'popular science documentary tech 2026',
    music: 'official music video 4k',
    gaming: 'gaming showcase trailer 4k',
    movies: 'official movie trailer 4k',
  };
  try {
    const searchRes = await fetchSearch(fallbackQueryMap[category] || fallbackQueryMap.now, 'videos');
    if (searchRes.streams.length > 0) {
      return setCached(cacheKey, searchRes.streams);
    }
  } catch {
    // ignore
  }

  return setCached(cacheKey, FALLBACK_STREAMS, 60_000);
}

async function fetchSearch(
  query: string,
  filter: string
): Promise<{ streams: StreamItem[]; channels: ChannelSummary[] }> {
  const cacheKey = `search:${filter}:${query}`;
  const cached = getCached<{ streams: StreamItem[]; channels: ChannelSummary[] }>(cacheKey);
  if (cached) return cached;

  const spMap: Record<string, string> = {
    videos: 'EgIQAQ%3D%3D',
    channels: 'EgIQAg%3D%3D',
  };
  const sp = spMap[filter] ? `&sp=${spMap[filter]}` : '';
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${sp}`;

  try {
    const html = await fetchYouTubeText(url);
    const data = extractJsonAfterMarker(html, 'var ytInitialData =') || extractJsonAfterMarker(html, 'ytInitialData =');
    if (data) {
      const videoNodes = collectNodesByKey(data, ['videoRenderer', 'compactVideoRenderer']);
      const channelNodes = collectNodesByKey(data, ['channelRenderer']);
      const streams = dedupeStreams(
        videoNodes.map((n) => parseVideoRenderer(n.node)).filter(Boolean) as StreamItem[]
      ).slice(0, 30);
      const channels = channelNodes
        .map((n) => parseChannelRenderer(n.node))
        .filter(Boolean) as ChannelSummary[];
      if (streams.length > 0 || channels.length > 0) {
        return setCached(cacheKey, { streams, channels });
      }
    }
  } catch {
    // fallback
  }

  const qLower = query.toLowerCase();
  const streams = FALLBACK_STREAMS.filter(
    (s) => s.title.toLowerCase().includes(qLower) || s.uploaderName.toLowerCase().includes(qLower)
  );
  const channels = FALLBACK_CHANNELS.filter((c) => c.name.toLowerCase().includes(qLower));
  return {
    streams: streams.length > 0 ? streams : FALLBACK_STREAMS,
    channels,
  };
}

async function fetchVideoDetail(videoId: string): Promise<VideoDetail> {
  const cacheKey = `video:${videoId}`;
  const cached = getCached<VideoDetail>(cacheKey);
  if (cached) return cached;

  try {
    const html = await fetchYouTubeText(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`);
    const player =
      extractJsonAfterMarker(html, 'var ytInitialPlayerResponse =') ||
      extractJsonAfterMarker(html, 'ytInitialPlayerResponse =');
    const initialData =
      extractJsonAfterMarker(html, 'var ytInitialData =') || extractJsonAfterMarker(html, 'ytInitialData =');

    const vd = player?.videoDetails;
    if (vd) {
      const duration = Number(vd.lengthSeconds || 0);
      const description = vd.shortDescription || '';
      const relatedNodes = initialData ? collectNodesByKey(initialData, ['compactVideoRenderer']) : [];
      const related = dedupeStreams(
        relatedNodes.map((n) => parseVideoRenderer(n.node)).filter(Boolean) as StreamItem[]
      )
        .filter((s) => s.id !== videoId)
        .slice(0, 15);

      const primaryInfo = initialData
        ? collectNodesByKey(initialData, ['videoPrimaryInfoRenderer'])[0]?.node
        : null;
      const secondaryInfo = initialData
        ? collectNodesByKey(initialData, ['videoSecondaryInfoRenderer'])[0]?.node
        : null;

      const subscriberCountText = textFromRuns(secondaryInfo?.owner?.videoOwnerRenderer?.subscriberCountText) || '';
      const uploaderAvatar =
        secondaryInfo?.owner?.videoOwnerRenderer?.thumbnail?.thumbnails?.at(-1)?.url || undefined;
      const uploadedDate = textFromRuns(primaryInfo?.dateText) || '';
      const viewCount = Number(vd.viewCount || 0);

      const detail: VideoDetail = {
        id: videoId,
        title: vd.title || 'Untitled Video',
        uploaderName: vd.author || 'YouTube Channel',
        uploaderId: vd.channelId || '',
        uploaderAvatar,
        thumbnail:
          vd.thumbnail?.thumbnails?.at(-1)?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration,
        durationText: vd.isLiveContent ? 'LIVE' : formatDuration(duration),
        viewCount,
        viewCountText: viewCount ? `${formatCompactNumber(viewCount)} views` : '',
        uploadedDate,
        isLive: Boolean(vd.isLiveContent),
        description,
        likeCountText: 'Like',
        subscriberCountText,
        chapters: parseDescriptionChapters(description),
        related: related.length > 0 ? related : FALLBACK_STREAMS.filter((s) => s.id !== videoId),
        comments: buildCommentsFromInitialData(initialData),
        tags: Array.isArray(vd.keywords) ? vd.keywords.slice(0, 10) : [],
      };
      return setCached(cacheKey, detail);
    }
  } catch {
    // fallback below
  }

  const fb = FALLBACK_STREAMS.find((s) => s.id === videoId) || FALLBACK_STREAMS[0];
  return {
    ...fb,
    id: videoId,
    description: fb.shortDescription || `Watch ${fb.title} on YmnTube.`,
    likeCountText: '—',
    subscriberCountText: '',
    chapters: [],
    related: FALLBACK_STREAMS.filter((s) => s.id !== videoId),
    comments: [],
    tags: [],
  };
}

function buildCommentsFromInitialData(initialData: any): CommentItem[] {
  if (!initialData) return [];
  const commentNodes = collectNodesByKey(initialData, ['commentRenderer']);
  const list: CommentItem[] = [];
  for (const { node } of commentNodes) {
    const text = textFromRuns(node.contentText);
    if (!text) continue;
    list.push({
      id: node.commentId || String(list.length),
      author: textFromRuns(node.authorText) || 'Viewer',
      authorAvatar: node.authorThumbnail?.thumbnails?.at(-1)?.url,
      text,
      publishedTime: textFromRuns(node.publishedTimeText),
      likeCount: textFromRuns(node.voteCount) || '0',
      isPinned: Boolean(node.pinnedCommentBadge),
    });
  }
  return list.slice(0, 20);
}

async function fetchChannel(channelId: string): Promise<ChannelInfo> {
  const cacheKey = `channel:${channelId}`;
  const cached = getCached<ChannelInfo>(cacheKey);
  if (cached) return cached;

  const isHandle = channelId.startsWith('@');
  const pageUrl = isHandle
    ? `https://www.youtube.com/${channelId}/videos`
    : `https://www.youtube.com/channel/${encodeURIComponent(channelId)}/videos`;

  try {
    const [html, rssXml] = await Promise.all([
      fetchYouTubeText(pageUrl).catch(() => ''),
      !isHandle
        ? fetchYouTubeText(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`).catch(
            () => ''
          )
        : Promise.resolve(''),
    ]);

    const initialData = html
      ? extractJsonAfterMarker(html, 'var ytInitialData =') || extractJsonAfterMarker(html, 'ytInitialData =')
      : null;

    const header =
      initialData?.header?.c4TabbedHeaderRenderer ||
      initialData?.header?.pageHeaderRenderer ||
      null;
    const metadata = initialData?.metadata?.channelMetadataRenderer || {};

    const resolvedId = metadata.externalId || header?.channelId || channelId;
    const name = metadata.title || textFromRuns(header?.title) || 'YouTube Channel';
    const avatar =
      metadata.avatar?.thumbnails?.at(-1)?.url ||
      header?.avatar?.thumbnails?.at(-1)?.url ||
      header?.content?.pageHeaderViewModel?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.at(-1)
        ?.url ||
      '/assets/ic_launcher.png';
    const banner =
      header?.banner?.thumbnails?.at(-1)?.url ||
      header?.content?.pageHeaderViewModel?.banner?.imageBannerViewModel?.image?.sources?.at(-1)?.url ||
      '/assets/placeholder_channel_banner.png';
    const subscriberCountText =
      textFromRuns(header?.subscriberCountText) ||
      initialData?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel?.metadata?.contentMetadataViewModel
        ?.metadataRows?.[1]?.metadataParts?.[0]?.text?.content ||
      '';
    const description = metadata.description || '';

    const gridNodes = initialData ? collectNodesByKey(initialData, ['gridVideoRenderer', 'videoRenderer']) : [];
    let videos = dedupeStreams(
      gridNodes.map((n) => parseVideoRenderer(n.node)).filter(Boolean) as StreamItem[]
    ).map((v) => ({
      ...v,
      uploaderName: v.uploaderName === 'YouTube Channel' ? name : v.uploaderName,
      uploaderId: v.uploaderId || resolvedId,
    }));

    if (videos.length === 0 && rssXml) {
      videos = parseRssFeedXml(rssXml, name);
    }

    const info: ChannelInfo = {
      id: resolvedId,
      name,
      avatar,
      banner,
      subscriberCountText,
      description,
      videos,
    };
    return setCached(cacheKey, info);
  } catch {
    // fallback below
  }

  const fb = FALLBACK_CHANNELS.find((c) => c.id === channelId) || FALLBACK_CHANNELS[0];
  return {
    ...fb,
    videos: FALLBACK_STREAMS,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, app: 'YmnTube' });
  });

  app.get('/api/trending', async (req, res) => {
    const category = String(req.query.category || 'now');
    const items = await fetchTrending(category);
    res.json({ items });
  });

  app.get('/api/search', async (req, res) => {
    const q = String(req.query.q || '').trim();
    const filter = String(req.query.filter || 'all');
    if (!q) {
      res.json({ streams: [], channels: [] });
      return;
    }
    const result = await fetchSearch(q, filter);
    res.json(result);
  });

  app.get('/api/suggestions', async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q) {
      res.json({ suggestions: [] });
      return;
    }
    try {
      const r = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`,
        { signal: AbortSignal.timeout(3000) }
      );
      const json = (await r.json()) as [string, string[]];
      res.json({ suggestions: Array.isArray(json?.[1]) ? json[1].slice(0, 8) : [] });
    } catch {
      res.json({ suggestions: [] });
    }
  });

  app.get('/api/video/:id', async (req, res) => {
    const detail = await fetchVideoDetail(req.params.id);
    res.json(detail);
  });

  app.get('/api/channel/:id', async (req, res) => {
    const channel = await fetchChannel(req.params.id);
    res.json(channel);
  });

  app.post('/api/feed', async (req, res) => {
    const channelIds: string[] = Array.isArray(req.body?.channelIds) ? req.body.channelIds.slice(0, 25) : [];
    const results = await Promise.all(
      channelIds.map(async (id) => {
        if (!id.startsWith('UC')) {
          const ch = await fetchChannel(id);
          return ch.videos.slice(0, 5);
        }
        const cacheKey = `rss:${id}`;
        const cached = getCached<StreamItem[]>(cacheKey);
        if (cached) return cached;
        try {
          const xml = await fetchYouTubeText(
            `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(id)}`
          );
          const parsed = parseRssFeedXml(xml).slice(0, 8);
          return setCached(cacheKey, parsed);
        } catch {
          return [];
        }
      })
    );
    const merged = dedupeStreams(results.flat());
    res.json({ items: merged });
  });

  app.post('/api/cache/clear', (_req, res) => {
    cache.clear();
    res.json({ cleared: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`YmnTube server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
