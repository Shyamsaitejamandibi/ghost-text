import { useCallback, useEffect, useRef, useState } from "react";

export function useGhostCompletion(text: string) {
  const [ghost, setGhost] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const lastTextRef = useRef<string>("");
  const lastCompletionRef = useRef<string>("");

  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearGhost = useCallback(() => setGhost(""), []);

  // Sanitize input to prevent prompt injection
  const sanitizeInput = useCallback((input: string) => {
    // Basic sanitization
    return input
      .replace(/[\\"`]/g, (match) => `\\${match}`) // Escape characters that could break JSON
      .trim();
  }, []);

  useEffect(() => {
    // Don't make API calls for very short text
    if (text.trim().length < 5) {
      clearGhost();
      return;
    }

    // Don't make API calls if text hasn't changed significantly
    // (More than just a character or two)
    if (
      text === lastTextRef.current ||
      (lastTextRef.current &&
        text.length > lastTextRef.current.length &&
        text.startsWith(lastTextRef.current) &&
        text.length - lastTextRef.current.length < 3)
    ) {
      return;
    }

    // Update the last text we've seen
    lastTextRef.current = text;

    // Debounce the API call
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      try {
        setStatus("loading");

        const sanitizedText = sanitizeInput(text);

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userText: sanitizedText,
          }),
          signal: controllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Network response was not ok");
        }

        const data = await response.json();

        // Only set ghost if the completion is different from the user's text
        // and not a repetition of what we've already suggested
        if (
          data.completion &&
          data.completion !== text &&
          data.completion !== lastCompletionRef.current &&
          data.completion.length > text.length
        ) {
          // Check if completion seems repetitive
          const newContent = data.completion.slice(text.length);
          const isRepetitive =
            text.includes(newContent) ||
            (lastCompletionRef.current &&
              lastCompletionRef.current.includes(newContent));

          if (!isRepetitive) {
            setGhost(data.completion);
            lastCompletionRef.current = data.completion;
          } else {
            // If repetitive, don't show ghost
            clearGhost();
          }
        } else {
          clearGhost();
        }

        setStatus("idle");
      } catch (error: any) {
        if (error.name === "AbortError") {
          setStatus("idle");
          return;
        }
        setStatus("error");
        console.error("Error fetching ghost completion:", error);
      }
    }, 400); // Slightly reduced debounce time for better responsiveness

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [clearGhost, text, sanitizeInput]);

  return { ghost, status, clearGhost };
}
