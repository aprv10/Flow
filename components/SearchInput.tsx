"use client";

import { FormEvent, useState } from "react";

const examples = [
  "Programming videos that feel magical",
  "Calm but intellectually deep AI content",
  "Startup videos without hustle culture",
  "Physics videos that create curiosity",
];

export function SearchInput() {
  const [value, setValue] = useState("");
  const [submittedValue, setSubmittedValue] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedValue(value.trim());
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-white/10 bg-white/[0.04] p-2 shadow-2xl shadow-black/30"
      >
        <label className="sr-only" htmlFor="vibe-query">
          Describe the feed vibe
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="vibe-query"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Calm but intellectually deep AI content"
            className="min-h-12 flex-1 rounded-md border border-white/10 bg-black/40 px-4 text-base text-white outline-none placeholder:text-zinc-500 focus:border-teal-300/70"
          />
          <button
            type="submit"
            className="min-h-12 rounded-md bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Preview feed
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setValue(example)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm text-zinc-300 hover:border-white/20 hover:text-white"
          >
            {example}
          </button>
        ))}
      </div>

      <p className="min-h-6 text-sm text-zinc-500">
        {submittedValue
          ? `Placeholder preview for: "${submittedValue}"`
          : "The API route is stubbed until YouTube and LLM logic are added."}
      </p>
    </div>
  );
}
