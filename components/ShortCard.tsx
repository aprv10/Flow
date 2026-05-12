import type { FeedItem } from "@/lib/types";

type ShortCardProps = {
  item: FeedItem;
  index: number;
};

export function ShortCard({ item, index }: ShortCardProps) {
  return (
    <article className="relative flex min-h-[calc(78vh-1.5rem)] flex-col justify-end overflow-hidden rounded-lg border border-white/10 bg-zinc-950 p-5 [scroll-snap-align:start] lg:min-h-[calc(100vh-4.5rem)]">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(20,184,166,0.22),transparent_42%),linear-gradient(0deg,rgba(0,0,0,0.92),rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.82))]" />
      <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-medium text-zinc-300">
        Short {index}
      </div>
      <div className="relative space-y-3">
        <div className="aspect-[9/16] w-full rounded-md border border-dashed border-white/15 bg-white/[0.03]">
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">
            YouTube embed placeholder
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-teal-200">{item.channelTitle}</p>
          <h2 className="text-2xl font-semibold leading-tight text-white">{item.title}</h2>
          <p className="text-sm leading-6 text-zinc-300">{item.reason}</p>
        </div>
      </div>
    </article>
  );
}
