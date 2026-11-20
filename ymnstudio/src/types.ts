export type ThemeMode = 'light' | 'dark' | 'black';
export type ItemViewMode = 'list' | 'grid' | 'card';

export type NavDestination =
  | 'home'
  | 'subscriptions'
  | 'feed'
  | 'bookmarks'
  | 'downloads'
  | 'history'
  | 'trending'
  | 'settings'
  | 'about'
  | 'search'
  | 'channel'
  | 'playlist';

export interface HomeTabConfig {
  id: string;
  type: 'kiosk' | 'bookmarks' | 'subscriptions' | 'feed';
  title: string;
}

export interface StreamItem {
  id: string;
  title: string;
  uploaderName: string;
  uploaderId: string;
  uploaderAvatar?: string;
  thumbnail: string;
  duration: number;
  durationText?: string;
  viewCount?: number;
  viewCountText?: string;
  uploadedDate: string;
  isLive?: boolean;
  shortDescription?: string;
}

export interface ChannelSummary {
  id: string;
  name: string;
  avatar: string;
  subscriberCountText: string;
  description: string;
  videoCountText?: string;
}

export interface ChannelInfo extends ChannelSummary {
  banner: string;
  videos: StreamItem[];
}

export interface ChapterItem {
  title: string;
  startSeconds: number;
}

export interface CommentItem {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  publishedTime: string;
  likeCount: string;
  isPinned?: boolean;
}

export interface VideoDetail extends StreamItem {
  description: string;
  likeCountText: string;
  subscriberCountText: string;
  chapters: ChapterItem[];
  related: StreamItem[];
  comments: CommentItem[];
  tags: string[];
}

export interface PlaylistInfo {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  items: StreamItem[];
  updatedAt: number;
}

export interface SubscriptionChannel {
  id: string;
  name: string;
  url: string;
  avatar: string;
  subscriberCountText?: string;
  description?: string;
  notificationMode: 'enabled' | 'disabled';
}

export interface FeedGroup {
  id: string;
  name: string;
  icon: string;
  channelIds: string[];
}

export interface HistoryEntry {
  stream: StreamItem;
  accessDate: number;
  repeatCount: number;
  progressSeconds: number;
}

export interface DownloadMission {
  id: string;
  stream: StreamItem;
  kind: 'video' | 'audio' | 'subtitle';
  format: string;
  quality: string;
  sizeText: string;
  progress: number;
  status: 'queued' | 'downloading' | 'paused' | 'completed';
  createdAt: number;
}

export interface AppSettings {
  theme: ThemeMode;
  viewMode: ItemViewMode;
  defaultResolution: string;
  showComments: boolean;
  showDescription: boolean;
  showRelated: boolean;
  enableWatchHistory: boolean;
  enableSearchHistory: boolean;
  autoplay: boolean;
  seekDurationSeconds: number;
  contentCountry: string;
  tabs: HomeTabConfig[];
}
