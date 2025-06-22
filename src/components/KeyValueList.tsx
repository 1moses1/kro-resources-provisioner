"use client";
import React from "react";
// import "highlight.js/styles/github.css"; // Import your preferred highlight.js theme
import "highlight.js/styles/github-dark.css"; // Import dark theme for highlight.js

export type KeyValueEntry = {
  key: string;
  value: string;
};

export interface KeyValueListProps {
  entries: { key: string; value: string }[];
  onChange: (entries: { key: string; value: string }[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  valueAsTextarea?: boolean;
}


export default function KeyValueList({
  entries,
  onChange,
  keyPlaceholder = "key",
  valuePlaceholder = "value",
  valueAsTextarea = false,
}: KeyValueListProps) {
  const updateEntry = (index: number, updated: { key?: string; value?: string }) => {
    const newEntries = [...entries];
    newEntries[index] = {
      key: updated.key !== undefined ? updated.key : newEntries[index].key,
      value: updated.value !== undefined ? updated.value : newEntries[index].value,
    };
    onChange(newEntries);
  };


  const addEntry = () => {
    onChange([...entries, { key: "", value: "" }]);
  };


  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };


  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <div key={index} className="flex space-x-2 items-center">
          <input
            type="text"
            className="w-1/3 border rounded px-2 py-1 text-sm"
            placeholder={keyPlaceholder}
            value={entry.key}
            onChange={(e) => updateEntry(index, { key: e.target.value })}
          />
          {valueAsTextarea ? (
            <textarea
              className="w-2/3 border rounded px-2 py-1 text-sm"
              placeholder={valuePlaceholder}
              value={entry.value}
              onChange={(e) => updateEntry(index, { value: e.target.value })}
            />
          ) : (
            <input
              type="text"
              className="w-2/3 border rounded px-2 py-1 text-sm"
              placeholder={valuePlaceholder}
              value={entry.value}
              onChange={(e) => updateEntry(index, { value: e.target.value })}
            />
          )}
          <button
            type="button"
            className="text-red-600 text-sm"
            onClick={() => removeEntry(index)}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-blue-600 text-sm mt-1"
        onClick={addEntry}
      >
        + Add
      </button>
    </div>
  );
}





