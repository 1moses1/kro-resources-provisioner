"use client";
import React, { useState, useRef, useEffect } from "react";

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
}

export default function ChatAssistant() {
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("gpt-4");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when a new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || !apiKey) {
      return;
    }
    const question = input.trim();
    // Append user message
    const newMessages: Message[] = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          apiKey,
          model,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await response.json();
      if (data.answer) {
        setMessages([...newMessages, { role: "assistant", content: data.answer }]);
      } else if (data.error) {
        setMessages([...newMessages, { role: "assistant", content: `Error: ${data.error}` }]);
      }
    } catch (err: any) {
      setMessages([...newMessages, { role: "assistant", content: `Error: ${err.message || err}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* API Key and Model inputs */}
      <div className="mb-3 space-y-2">
        <div>
          <label className="text-sm font-medium mr-2">API Key:</label>
          <input 
            type="password" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
            placeholder="sk-... (OpenAI API Key)" 
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium mr-2">Model:</label>
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)} 
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4">GPT-4o</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
        </div>
      </div>

      {/* Messages display */}
      <div className="flex-1 overflow-y-auto mb-2 border border-gray-300 rounded p-2 bg-gray-50">
        {messages.length === 0 && !loading && (
          <p className="text-gray-500 text-sm">Ask a question or get suggestions. For example: "What resource should I add next?"</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-3 whitespace-pre-wrap ${msg.role === "assistant" ? "text-blue-900" : "text-gray-900"}`}>
            <strong>{msg.role === "assistant" ? "Assistant: " : "You: "}</strong>
            <span>{msg.content}</span>
          </div>
        ))}
        {loading && (
          <div className="text-gray-500 text-sm">Assistant is typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input box */}
      <div>
        <textarea 
          className="w-full border border-gray-300 rounded px-2 py-1"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question and press Enter to send..."
          disabled={!apiKey || loading}
        />
        <button 
          onClick={sendMessage}
          disabled={!apiKey || loading || !input.trim()}
          className="mt-1 w-full bg-blue-600 text-white text-sm font-medium py-1.5 rounded disabled:bg-gray-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}
