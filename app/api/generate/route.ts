import { openrouter } from "@openrouter/ai-sdk-provider";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function POST(request: Request) {
  try {
    const { userText } = await request.json();

    if (!userText || typeof userText !== "string") {
      return new Response(
        JSON.stringify({ error: "No text provided or invalid format" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Limit the length of text to prevent abuse
    if (userText.length > 1000) {
      return new Response(JSON.stringify({ error: "Text too long" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Sanitize input - prevent prompt injection
    const sanitizedText = userText
      .replace(/[\\"`]/g, (match) => `\\${match}`)
      .trim();

    // Detect repetition in user input
    const words = sanitizedText.split(/\s+/);
    const lastFourWords = words.slice(-4).join(" ").toLowerCase();
    const previousFourWords =
      words.length >= 8 ? words.slice(-8, -4).join(" ").toLowerCase() : "";

    // Check if we're seeing repetition in the user's input
    const isRepetitive =
      previousFourWords &&
      lastFourWords &&
      (previousFourWords.includes(lastFourWords) ||
        lastFourWords.includes(previousFourWords));

    // Adjust the prompt based on detected patterns
    let promptModifier = "";
    if (isRepetitive) {
      promptModifier =
        "I notice the user's text contains repetition. Please avoid continuing this repetitive pattern and instead provide a meaningful, diverse continuation.";
    }

    const { text } = await generateText({
      model: google("gemini-1.5-pro-latest"),
      prompt: `Given the following user text, provide a natural continuation that would make sense as an auto-completion. Keep the style consistent but add new, meaningful content.
      ${promptModifier}
      
User's text: "${sanitizedText}"

Your task is to continue this text in a way that:
1. Maintains the same style, tone, and context
2. Adds new information or advances the thought
3. Does NOT repeat what's already been written
4. Provides high-quality, helpful content

Your continuation should start exactly where the user's text ends.`,
      system:
        "You are an intelligent auto-complete assistant. Your job is to predict what the user might want to write next based on their current text. Do not repeat or rephrase what they've already written - instead, provide original continuations that flow naturally from their text. If you detect the user is writing code, continue with syntactically correct code in the same language and style. Focus on providing useful, contextually appropriate continuations.",
      maxTokens: 200,
      temperature: 0.3,
    });

    // Format the response to ensure it starts with the user's text
    let completion = sanitizedText;

    // Only add the generated text if it's not empty and not just repeating the input
    if (text && text.trim() !== sanitizedText.trim()) {
      // Check if the AI's response already includes the user's text as a prefix
      if (text.startsWith(sanitizedText)) {
        completion = text;
      } else {
        // Add only the new content, avoiding repetition
        completion = sanitizedText + text.trim();
      }
    }

    return new Response(JSON.stringify({ completion }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
