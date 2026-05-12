export const requiredEnv = {
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
  llmApiKey: process.env.LLM_API_KEY,
  llmModel: process.env.LLM_MODEL,
};

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(`Missing required environment variable: ${name}`);
    this.name = "MissingEnvError";
  }
}

export function getRequiredEnv(name: "YOUTUBE_API_KEY" | "LLM_API_KEY" | "LLM_MODEL") {
  const value = process.env[name];

  if (!value) {
    throw new MissingEnvError(name);
  }

  return value;
}
