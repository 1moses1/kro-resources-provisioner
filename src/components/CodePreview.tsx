"use client";
import React, { useMemo } from "react";
import hljs from "highlight.js/lib/core";

// --- FIX START: Import and register the JSON language ---
import yamlLang from "highlight.js/lib/languages/yaml";
import jsonLang from "highlight.js/lib/languages/json";

// Register languages for highlight.js (only once)
if (!hljs.getLanguage("yaml")) {
  hljs.registerLanguage("yaml", yamlLang);
}
if (!hljs.getLanguage("json")) {
  hljs.registerLanguage("json", jsonLang);
}
// --- FIX END ---


// --- FIX START: Make props more generic ---
interface CodePreviewProps {
  content: string;
  language: 'yaml' | 'json';
}
// --- FIX END ---


export default function CodePreview({ content, language }: CodePreviewProps) {
  // Compute highlighted HTML when content or language changes
  const highlighted = useMemo(() => {
    try {
      // --- FIX START: Use the language prop for highlighting ---
      return hljs.highlight(content, { language }).value;
      // --- FIX END ---
    } catch {
      return hljs.highlightAuto(content).value;
    }
  }, [content, language]);


  return (
    <pre className="text-sm leading-6 overflow-x-auto">
      {/* --- FIX START: Use the language prop for the CSS class --- */}
      <code
        className={`hljs language-${language}`}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      {/* --- FIX END --- */}
    </pre>
  );
}


