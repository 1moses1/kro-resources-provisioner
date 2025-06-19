"use client";
import React, { useMemo } from "react";
import hljs from "highlight.js/lib/core";
import yamlLang from "highlight.js/lib/languages/yaml";

// Register YAML language for highlight.js (only once)
if (!hljs.getLanguage("yaml")) {
  hljs.registerLanguage("yaml", yamlLang);
}

interface YamlPreviewProps {
  yaml: string;
}

export default function YamlPreview({ yaml }: YamlPreviewProps) {
  // Compute highlighted HTML when YAML text changes
  const highlighted = useMemo(() => {
    try {
      return hljs.highlight(yaml, { language: "yaml" }).value;
    } catch {
      return hljs.highlightAuto(yaml).value;
    }
  }, [yaml]);

  return (
    <pre className="text-sm leading-6 overflow-x-auto">
      <code 
        className="hljs language-yaml" 
        dangerouslySetInnerHTML={{ __html: highlighted }} 
      />
    </pre>
  );
}
