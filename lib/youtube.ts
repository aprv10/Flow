import { getRequiredEnv } from "@/lib/env";
import type { YoutubeShort } from "@/lib/types";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const SHORTS_MAX_SECONDS = 180;

type YouTubeThumbnail = {
  url: string;
  width?: number;
  height?: number;
};

type YouTubeSnippet = {
  title?: string;
  channelTitle?: string;
  description?: string;
  thumbnails?: {
    default?: YouTubeThumbnail;
    medium?: YouTubeThumbnail;
    high?: YouTubeThumbnail;
    standard?: YouTubeThumbnail;
    maxres?: YouTubeThumbnail;
  };
};

type YouTubeSearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: YouTubeSnippet;
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
  error?: YouTubeApiError;
};

type YouTubeVideoItem = {
  id: string;
  snippet?: YouTubeSnippet;
  contentDetails?: {
    duration?: string;
  };
  status?: {
    embeddable?: boolean;
  };
};

type YouTubeVideosResponse = {
  items?: YouTubeVideoItem[];
  error?: YouTubeApiError;
};

type YouTubeApiError = {
  message?: string;
  code?: number;
};

export class YouTubeApiErrorResponse extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeApiErrorResponse";
  }
}

export type SearchYouTubeShortsOptions = {
  query: string;
  maxResults?: number;
};

export async function searchYouTubeShorts({
  query,
  maxResults = 12,
}: SearchYouTubeShortsOptions): Promise<YoutubeShort[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const apiKey = getRequiredEnv("YOUTUBE_API_KEY");
  const resultLimit = normalizeMaxResults(maxResults);
  const searchLimit = clamp(resultLimit * 3, 10, 50);

  const searchItems = await searchVideos(apiKey, normalizedQuery, searchLimit);
  const orderedVideoIds = dedupe(
    searchItems
      .map((item) => item.id?.videoId)
      .filter((videoId): videoId is string => Boolean(videoId)),
  );

  if (orderedVideoIds.length === 0) {
    return [];
  }

  const videos = await getVideoDetails(apiKey, orderedVideoIds);
  const videosById = new Map(videos.map((video) => [video.id, video]));

  return orderedVideoIds
    .map((videoId, index) => {
      const video = videosById.get(videoId);

      if (!video || !isShortsCandidate(video)) {
        return null;
      }

      return {
        index,
        fitScore: getFeedFitScore(video),
        video: toYoutubeShort(video),
      };
    })
    .filter((item): item is { index: number; fitScore: number; video: YoutubeShort } =>
      Boolean(item),
    )
    .sort((a, b) => b.fitScore - a.fitScore || a.index - b.index)
    .slice(0, resultLimit)
    .map((item) => item.video);
}

async function searchVideos(apiKey: string, query: string, maxResults: number) {
  const url = buildYouTubeUrl("search", {
    part: "snippet",
    q: withShortsHint(query),
    type: "video",
    videoDuration: "short",
    videoEmbeddable: "true",
    safeSearch: "moderate",
    order: "relevance",
    maxResults: String(maxResults),
    key: apiKey,
  });

  const data = await fetchYouTube<YouTubeSearchResponse>(url);
  return data.items ?? [];
}

async function getVideoDetails(apiKey: string, videoIds: string[]) {
  const url = buildYouTubeUrl("videos", {
    part: "snippet,contentDetails,status",
    id: videoIds.join(","),
    key: apiKey,
  });

  const data = await fetchYouTube<YouTubeVideosResponse>(url);
  return data.items ?? [];
}

async function fetchYouTube<T extends { error?: YouTubeApiError }>(url: URL): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
  });

  const data = (await response.json()) as T;

  if (!response.ok || data.error) {
    throw new YouTubeApiErrorResponse(
      data.error?.message ?? `YouTube API request failed with status ${response.status}`,
    );
  }

  return data;
}

function buildYouTubeUrl(path: "search" | "videos", params: Record<string, string>) {
  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

function withShortsHint(query: string) {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("short") || lowerQuery.includes("#shorts")) {
    return query;
  }

  return `${query} #shorts`;
}

function isShortsCandidate(video: YouTubeVideoItem) {
  const durationSeconds = parseIsoDuration(video.contentDetails?.duration);

  return (
    video.status?.embeddable !== false &&
    durationSeconds > 0 &&
    durationSeconds <= SHORTS_MAX_SECONDS &&
    Boolean(video.snippet?.title && video.snippet.channelTitle)
  );
}

function getFeedFitScore(video: YouTubeVideoItem) {
  const durationSeconds = parseIsoDuration(video.contentDetails?.duration);
  const title = video.snippet?.title ?? "";
  const description = video.snippet?.description ?? "";
  const searchableText = `${title} ${description}`.toLowerCase();

  let score = 0;

  if (searchableText.includes("#shorts") || searchableText.includes("shorts")) {
    score += 2;
  }

  if (durationSeconds <= 60) {
    score += 1;
  }

  return score;
}

function toYoutubeShort(video: YouTubeVideoItem): YoutubeShort {
  const snippet = video.snippet;

  return {
    title: snippet?.title ?? "",
    channel: snippet?.channelTitle ?? "",
    thumbnail: getBestThumbnail(snippet),
    videoId: video.id,
    description: snippet?.description ?? "",
  };
}

function getBestThumbnail(snippet?: YouTubeSnippet) {
  return (
    snippet?.thumbnails?.maxres?.url ??
    snippet?.thumbnails?.standard?.url ??
    snippet?.thumbnails?.high?.url ??
    snippet?.thumbnails?.medium?.url ??
    snippet?.thumbnails?.default?.url ??
    ""
  );
}

function parseIsoDuration(duration?: string) {
  if (!duration) {
    return 0;
  }

  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);

  if (!match) {
    return 0;
  }

  const [, hours = "0", minutes = "0", seconds = "0"] = match;

  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function dedupe<T>(items: T[]) {
  return Array.from(new Set(items));
}

function normalizeMaxResults(value: number) {
  return clamp(Math.floor(value), 1, 25);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
