import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

export async function POST(request: Request) {
  const { userText } = await request.json();

  if (!userText) {
    return new Response(JSON.stringify({ error: "No text provided" }), {
      status: 400,
    });
  }
  try {
    const { text } = await generateText({
      model: openrouter("deepseek/deepseek-chat-v3-0324:free"),
      prompt: `Complete this text naturally, continuing the user's thought: "${userText}"`,
      system:
        "You are an intelligent auto-complete assistant. Provide natural, contextual completions that match the user's writing style and intent. Keep completions concise and relevant. Don't repeat what the user has already written.",
    });
    return new Response(JSON.stringify({ completion: text }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}
