import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  storyModel: process.env.GEMINI_STORY_MODEL || "gemini-3.8-flash",
  imageModel: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image"
};

export function assertConfig() {
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to backend/.env.");
  }
}
