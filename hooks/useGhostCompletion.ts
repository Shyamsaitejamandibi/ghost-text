import { useCallback, useEffect, useRef, useState } from "react";

export function useGhostCompletion(text: string) {
  const [ghost, setGhost] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearGhost = useCallback(() => setGhost(""), []);

  useEffect(() => {
    // short input -> nothing to do
    if (text.trim().length < 1) {
      clearGhost();
      setStatus("idle");
      return;
    }

    // debounce: restart the 500ms timer if the text changes
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      // cancel all previous requests
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      try {
        setStatus("loading");
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userText: text }),
          signal: controllerRef.current.signal,
        });
        const { completion, error } = await response.json();
        if (!response.ok)
          throw new Error(error ?? "Failed to fetch completion");

        setGhost(completion);
        setStatus("idle");
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setStatus("error");
        console.error("Error fetching ghost completion:", e);
      }
    }, 500);
  }, [clearGhost, text]);

  return { ghost, status, clearGhost };
}
