"use client";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // PLugin for full markdown support

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
}

export default function ChatAssistant() {
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("gpt-4"); // Default model
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
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
        </div>
      </div>

      {/* Messages display */}
      <div className="flex-1 overflow-y-auto mb-2 border border-gray-300 rounded p-2 bg-gray-50">
        {messages.length === 0 && !loading && (
          <p className="text-gray-500 text-sm">Ask a question or get suggestions. For example: "What resource should I add next?"</p>
        )}
      {/* --- STYLED MESSAGE BUBBLES --- */} 
      {messages.map((msg, idx) => ( 
        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}> 
          <div className={`max-w-[80%] rounded-lg px-4 py-2 shadow ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}> 
            {msg.role === 'assistant' ? ( 
              <article className="prose prose-sm max-w-none prose-blue"> 
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown> 
              </article> ) : ( <p className="whitespace-pre-wrap">{msg.content}</p> )} </div> </div> ))} {/* --- END STYLED BUBBLES --- */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-1 py-0.5 shadow">
              <span className="animate-pulse">● ● ●</span>
            </div>
          </div>
        )}
        {/* Scroll to bottom reference */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input box */}
      <div className="p-4 border-t border-gray-300 bg-blue-50">
        <div className="relative">
        <textarea 
          className="w-full border border-gray-300 rounded px-2 pr-12 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500" 
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the assistant..."
          disabled={!apiKey || loading}
        />
        <button 
          onClick={sendMessage} 
          disabled={!apiKey || loading || !input.trim()} 
          className="absolute bottom-2.5 right-2.5 bg-blue-600 text-white p-1 rounded-md disabled:bg-gray-400 hover:bg-blue-700 transition-colors" 
          aria-label="Send message" 
        >
          {/* Send */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  </div>
  );
}
