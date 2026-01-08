"use client";

import { useState, useRef, useEffect } from "react";
import { chatAi, updateSessionTitle } from "@/services/chatAi";
import { type ChatRequest, ChatResponse, ChatMessage } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import Thinking from "@/componenets/Thinking";
import { ChatSessionDto } from "@/types/chat";

type ChatContentProps = {
  allMessages: ChatMessage[];
  sessionId: string;
  onSaveTitle: (updated: ChatSessionDto) => void;
};

export default function ChatContent({
  allMessages,
  sessionId,
  onSaveTitle,
}: Readonly<ChatContentProps>) {
  const initialAssistantMessage: ChatMessage = {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm DeutschBridge Assistant. Ask me anything in German or English.",
    timestamp: "",
  };

  // Local messages state
  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistantMessage]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [chatData, setChatData] = useState<ChatResponse | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [timestamp] = useState(() => Date.now().toString());


  // Scroll to bottom whenever messages change
  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Update local messages whenever parent `allmessages` changes
  useEffect(() => {
    if (!Array.isArray(allMessages)) return;
    setMessages([initialAssistantMessage, ...allMessages]);
  }, [allMessages]);

  // Handle sending a new message
  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: timestamp.toString(),
      role: "user",
      content: input.trim(),
      timestamp: timestamp.toString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    const newRequest: ChatRequest = {
      question: userMsg.content,
      sessionId: sessionId,
    };
    getChatData(newRequest);
  };

  // Update session title
  const saveTitle = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!sessionTitle.trim()) return;
    updateSessionTitle(sessionId, sessionTitle ?? "")
      .then((response) => onSaveTitle(response))
      .catch((err) => console.error(err));
  };

  // Update messages when AI responds
  useEffect(() => {
    if (!chatData) return;

    const assistantMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: chatData.content,
      timestamp: Date.now().toString(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setThinking(false);
  }, [chatData]);

  const getChatData = (request: ChatRequest) => {
    chatAi(request)
      .then((data) => setChatData(data))
      .catch((err) => console.error(err));
  };

  return (
    <div className="p-10 space-y-8 dark:text-white max-w-5xl mx-auto">
      <div className="max-w-4xl mx-auto w-full">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-gray-100 dark:bg-gray-900 z-10 p-2 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <header className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your AI Tutor!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Practice conversational German with an AI tutor.
            </p>
          </header>
          {sessionId && (
            <form onSubmit={saveTitle}>
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Set title..."
                  className="px-2 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none w-full md:w-50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 hover:cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </div>

        <div
          ref={containerRef}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow h-[60vh] overflow-auto"
        >
          <div className="space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] ${
                  m.role === "user" ? "ml-auto text-right" : ""
                }`}
              >
                <div
                  className={`inline-block px-4 py-2 rounded-xl ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {thinking && <Thinking />}
          </div>
        </div>

        <form onSubmit={send} className="mt-4 flex gap-3">
          <input
            name="message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
          />
          <button
            className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover: cursor-pointer"
            type="submit"
            disabled={thinking}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
