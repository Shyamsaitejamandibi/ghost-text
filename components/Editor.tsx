"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useGhostCompletion } from "../hooks/useGhostCompletion";

export const Editor = () => {
  const [text, setText] = useState("");
  const { ghost, status, clearGhost } = useGhostCompletion(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ghostDivRef = useRef<HTMLDivElement>(null);

  // Sync textarea and ghost div scroll positions
  useEffect(() => {
    const textarea = textareaRef.current;
    const ghostDiv = ghostDivRef.current;

    if (textarea && ghostDiv) {
      ghostDiv.scrollTop = textarea.scrollTop;
      ghostDiv.scrollLeft = textarea.scrollLeft;
    }
  }, [text, ghost]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      if (ghost) {
        clearGhost();
      }
    },
    [ghost, clearGhost]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.key === "Enter" || e.key === "Tab") && ghost) {
        e.preventDefault();

        // Only accept the completion portion, not the entire text
        const completionPart = ghost.slice(text.length);

        if (e.key === "Tab") {
          // For Tab, smoothly transition the completion part
          const finalText = text + completionPart;
          const steps = 3;
          const stepDuration = 30; // milliseconds

          for (let i = 1; i <= steps; i++) {
            setTimeout(() => {
              const partialCompletionLength = Math.floor(
                completionPart.length * (i / steps)
              );
              setText(text + completionPart.slice(0, partialCompletionLength));

              if (i === steps) {
                setText(finalText);
                clearGhost();
                // Focus the textarea after completion
                if (textareaRef.current) {
                  textareaRef.current.focus();
                }
              }
            }, i * stepDuration);
          }
        } else {
          // For Enter, instant completion
          setText(text + completionPart);
          clearGhost();
          // Focus the textarea after completion
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }
      }
    },
    [ghost, clearGhost, text]
  );

  // Calculate the visible ghost text (only the part after user's input)
  const visibleGhostText = ghost ? ghost.slice(text.length) : "";

  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 relative overflow-hidden">
        {/* Container to properly position the ghost text overlay */}
        <div className="relative w-full h-full">
          {/* Ghost text overlay */}
          {ghost && (
            <div
              ref={ghostDivRef}
              className="absolute inset-0 whitespace-pre-wrap pointer-events-none font-mono overflow-hidden"
              style={{
                padding: "0.5rem", // Match textarea padding
                zIndex: 5,
              }}
            >
              {/* Pre-text (matches user input) is invisible but maintains spacing */}
              <span className="invisible">{text}</span>
              {/* Ghost text suggestion is visible */}
              <span className="text-gray-300">{visibleGhostText}</span>
            </div>
          )}

          {/* Actual user input textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent border-none outline-none resize-none font-mono p-2"
            style={{
              zIndex: 10,
              position: "relative",
              caretColor: "black", // Ensure caret is visible in light mode
            }}
            placeholder="Type something... (Press Tab or Enter to accept suggestions)"
            aria-autocomplete="both"
            spellCheck="false"
          />

          {/* Status indicators */}
          <div className="absolute bottom-4 right-4 text-sm transition-opacity duration-200 bg-white dark:bg-gray-900 px-2 py-1 rounded-md opacity-80">
            {status === "loading" && (
              <span className="text-gray-500">Generating suggestion...</span>
            )}
            {ghost && status === "idle" && (
              <span className="text-xs text-gray-500">
                Press Tab for smooth completion or Enter for instant
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
