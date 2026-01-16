"use client";

import { useEffect, useState } from "react";
import ChatSidebar from "@/componenets/ChatSidebar"

import ChatContent from "@/componenets/ChatContent";
import { getSessions, getMessagesBySession } from "@/services/chatAi";
import { useParams } from "next/navigation";
import { type ChatMessage, ChatSessionDto } from "@/types/chat";
import {toast, ToastContainer} from "react-toastify";

export default function GrammarPage() {
  const { slug } = useParams();
  const [sessions, setSessions] = useState<ChatSessionDto[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const getData = () =>{
    getSessions()
        .then((data) => {
          setSessions(data);
        })
        .catch((err) => console.error(err));
  }

  useEffect(() => {
    getData()
  }, [slug]);

  const handleSessionOnSelect = (sessionId: string) => {
    setSessionId(sessionId);
    getMessagesBySession(sessionId)
      .then((data) => {
        setMessages(data);
      })
      .catch((err) => console.error(err));
  };

  const handleOnNewChat = () => {
    setMessages([]);
    setSessionId("");
    toast("New chat is initiated!");
  };

  // Update only the edited session title
  const handleUpdatedTitle = (updatedTitle: ChatSessionDto) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedTitle.id ? updatedTitle : s))
    );
  };
  const handleRefreshList =() =>{
    setMessages([]);
    getData();
  }

  return (
    <div className="flex h-screen  bg-gray-100 dark:bg-gray-900 p-6">
      <div className="w-full fixed top-12 left-0  p-4">
        <div className="max-w-6xl mx-auto flex h-screen pt-5 overflow-hidden ">
          {/* Mobile toggle button */}
          <button
            className="md:hidden sticky fixed top-0 left-0 z-50 p-1 bg-blue-500 text-white rounded shadow"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <button
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            ></button>
          )}

          {/* Sidebar */}
          <div
            className={`mt-[70px] sm:mt-0 fixed pl-2 pr-2
          inset-y-1  w-72 bg-white dark:bg-gray-900 border-r dark:border-gray-700  overflow-y-auto z-50
          transform transition-transform duration-300 ease-in-out
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 md:relative
        `}
          >
            <ChatSidebar
              sessions={sessions}
              onSelect={handleSessionOnSelect}
              onNewChat={handleOnNewChat}
              selectedSessionId={sessionId}
              onRefresh={handleRefreshList}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">

            <ChatContent
              allMessages={messages}
              sessionId={sessionId}
              onSaveTitle={handleUpdatedTitle}
            />

            <ToastContainer
                toastClassName={
                    "relative mt-17 flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer"
                }/>
          </div>
        </div>
      </div>
    </div>
  );
}
