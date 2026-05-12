export type FeedItem = {
  id: string;
  title: string;
  channelTitle: string;
  reason: string;
};

export type YoutubeShort = {
  title: string;
  channel: string;
  thumbnail: string;
  videoId: string;
  description: string;
};

export type FeedResponse = {
  videos: YoutubeShort[];
};

export type VibeIntent = {
  topics: string[];
  tone: string[];
  pacing: string;
  emotionalEnergy: string;
  intellectualDepth: string;
  antiSignals: string[];
  searchQueries: string[];
  rerankGuidance: string[];
};

export type RerankedVideo = YoutubeShort & {
  matchScore: number;
  reason: string;
};

export type RerankResponse = {
  videos: RerankedVideo[];
};
