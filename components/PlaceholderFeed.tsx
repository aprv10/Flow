import { ShortCard } from "@/components/ShortCard";
import type { FeedItem } from "@/lib/types";

const placeholderItems: FeedItem[] = [
  {
    id: "placeholder-1",
    title: "Why simple ideas can feel like magic",
    channelTitle: "Placeholder Channel",
    reason: "A future match explanation will describe why this fits the requested vibe.",
  },
  {
    id: "placeholder-2",
    title: "A quiet look at deep technical curiosity",
    channelTitle: "Placeholder Channel",
    reason: "This slot represents a ranked Short returned by the backend.",
  },
  {
    id: "placeholder-3",
    title: "Building without the noise",
    channelTitle: "Placeholder Channel",
    reason: "Each result will keep one concise reason for why it belongs in the feed.",
  },
];

export function PlaceholderFeed() {
  return (
    <div className="h-[78vh] min-h-[560px] overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3 [scroll-snap-type:y_mandatory] lg:h-[calc(100vh-3rem)]">
      <div className="space-y-3">
        {placeholderItems.map((item, index) => (
          <ShortCard key={item.id} item={item} index={index + 1} />
        ))}
      </div>
    </div>
  );
}
