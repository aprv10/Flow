export const requiredEnv = {
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
  mistralApiKey: process.env.MISTRAL_API_KEY,
};

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(`Missing required environment variable: ${name}`);
    this.name = "MissingEnvError";
  }
}

export function getRequiredEnv(name: "YOUTUBE_API_KEY" | "MISTRAL_API_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new MissingEnvError(name);
  }

  return value;
}
