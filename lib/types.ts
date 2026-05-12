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
