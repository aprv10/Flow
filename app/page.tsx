import { PlaceholderFeed } from "@/components/PlaceholderFeed";
import { SearchInput } from "@/components/SearchInput";

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,440px)] lg:items-start">
        <div className="flex min-h-[34vh] flex-col justify-center gap-8 py-8 lg:sticky lg:top-6 lg:min-h-[calc(100vh-3rem)]">
          <div className="space-y-5">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-teal-200/80">
              Vibe-based Shorts
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Build a feed by describing how it should feel.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                Describe the emotional or intellectual tone you want, then preview the
                vertical feed shell that will later be powered by YouTube and AI ranking.
              </p>
            </div>
          </div>

          <SearchInput />
        </div>

        <PlaceholderFeed />
      </section>
    </main>
  );
}
