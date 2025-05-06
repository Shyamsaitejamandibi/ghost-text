import { openrouter } from "@openrouter/ai-sdk-provider";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const SYSTEM_PROMPT = `You are a helpful auto-complete assistant. IMPORTANT: Do not repeat! NEVER USE THE INCOMING PROMPT OR USER MESSAGE IN THE INCOMING PROMPT OR USER MESSAGE IN YOUR RESPONSE. Make sure to add a Leading space please when necessary (VERY IMPORTANT!). Please ONLY provide the next characters for the following text.`;

export async function POST(request: Request) {
  try {
    const { userText } = await request.json();

    if (!userText) {
      return Response.json({ error: "Missing prompt" }, { status: 400 });
    }

    const { text } = await generateText({
      model: google("gemini-1.5-pro-latest"),
      prompt: `${SYSTEM_PROMPT} ${userText}`,
    });

    return Response.json({ completion: text }, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
