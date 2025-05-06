"use client";

import { useCallback, useRef, useState } from "react";
import { useGhostCompletion } from "../hooks/useGhostCompletion";

export const Editor = () => {
  const [text, setText] = useState("");
  const { ghost, status, clearGhost } = useGhostCompletion(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      if (ghost) clearGhost();
    },
    [ghost, clearGhost]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (ghost) {
        if (e.key === "Tab") {
          e.preventDefault();
          setText((prev) => prev + ghost);
          clearGhost();
        } else if (e.key === "Escape") {
          e.preventDefault();
          clearGhost();
        }
      }
    },
    [ghost, clearGhost]
  );

  return (
    <div className="relative w-full max-w-3xl">
      {/* Ghost text is shown in a separate div to avoid affecting the textarea's value */}

      <textarea
        ref={textareaRef}
        className="peer w-full min-h-64 p-4 border rounded-md font-mono text-sm"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type something..."
        aria-autocomplete="both"
        role="textbox"
      />
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 font-mono text-sm whitespace-pre-wrap text-gray-400 z-0">
        <span className="invisible">{text}</span>
        <span>{ghost}</span>
      </div>
    </div>
  );
};

export default Editor;
