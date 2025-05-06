import { useCallback, useEffect, useRef, useState } from "react";

export function useGhostCompletion(text: string) {
  const [ghost, setGhost] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearGhost = useCallback(() => setGhost(""), []);

  useEffect(() => {
    if (text.trim().length === 0) {
      clearGhost();
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();
      try {
        setStatus("loading");
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userText: text,
          }),
          signal: controllerRef.current.signal,
        });
        const { completion, error } = await response.json();
        if (!response.ok) {
          throw new Error("Network response was not ok", { cause: error });
        }
        setGhost(completion);
        setStatus("idle");
      } catch (error: any) {
        if (error.name === "AbortError") {
          setStatus("idle");
          return;
        }
        setStatus("error");
        console.error("Error fetching ghost completion:", error);
      }
    }, 2000);
  }, [clearGhost, text]);

  return { ghost, status, clearGhost };
}
