"use client";
import RefreshButton from "@/componenets/RefreshButton";
import { useEffect, useRef, useState } from "react";
import {deleteSession} from "../services/chatAi";
import {toast} from "react-toastify";
interface Topic {
  id: string;
  title?: string;
  userId?: string;
}

interface SidebarProps {
  sessions: Topic[];
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  selectedSessionId: string;
  onRefresh:() => void;
}

export default function ChatSidebar({
  sessions,
  onSelect,
  onNewChat, onRefresh,
  selectedSessionId,
}: Readonly<SidebarProps>) {

  const [openId, setOpenId] = useState<string | null>(null);
  const containerRef = useRef<HTMLUListElement>(null);

  // Close tooltip if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = (sessionId:string) =>{
    if(confirm("Are you sure to delete all chat in this session!")) {
      if (sessionId)
        deleteSession(sessionId)
            .then((res) => {
              if (res.status == 204)
                toast.success("Session deleted!")
              onRefresh();
            })
            .catch((err) => {
              console.error(err.message);
            });
    }
  };

  return (
    <aside className="w-full h-full ">
      <div className="flex w-full items-center gap-4 rounded-lg p-4 ">
        {/* Left column */}
        <div className="flex-1">
          <div className="cursor-pointer px-2 py-1 bg-blue-100 rounded hover:bg-blue-300 dark:hover:bg-blue-700 text-gray-700 dark:text-gray-300">
          <button onClick={onNewChat} className=" text-sm font-semibold text-blue-500 transition">
            New Chat
          </button>

            <button onClick={onNewChat} className="text-base font-medium cursor-pointer  p-2 ml-3 bg-blue-100 text-blue-500 rounded-lg transition">
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
              >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536M4 20h4l11-11-4-4-11 11v4z"
                />
              </svg>
            </button>
          </div>

        </div>

        {/* Right column */}
        <div className="flex items-center justify-end">
          <RefreshButton onClick={onRefresh}/>
        </div>
      </div>


      <div className="mb-6">
        <h3 className="text-sm font-semibold pl-2.5 text-gray-900 dark:text-gray-400 mb-2">
          Chat History
        </h3>
        <ul ref={containerRef} className="space-y-2 group">
          {sessions.map((session) => (
              <li
                  key={session.id}
                  className={` flex justify-between items-center py-1 rounded
                  ${session.id === selectedSessionId
                      ? "bg-gray-300 dark:bg-gray-600"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  }
 `}
              >
                {/* Session button */}
                <button
                    type="button"
                    onClick={() => onSelect(session.id)}
                    className={`
              cursor-pointer text-gray-700 dark:text-gray-300
              px-2 py-1 rounded flex-1 text-left
            `}
                >
                  {session.title ?? session.id}
                </button>

                {/* Three dots button */}
                <div className="relative inline-block  opacity-0 group-hover:opacity-100">
            <span
                onClick={() => setOpenId(openId === session.id ? null : session.id)}
                className="cursor-pointer px-2 py-1 text-gray-500 hover:text-gray-700 select-none"
            >
              &#8942; {/* vertical ellipsis */}
            </span>

                  {/* Tooltip / menu */}
                  {openId === session.id && (
                      <div className="absolute top-full right-0 mt-2 min-w-[120px] rounded-md bg-black py-1 text-sm text-white shadow-lg z-50">
                        <a
                            href={session.id}
                            className="block px-4 py-2 hover:bg-gray-700 transition-colors"
                            onClick={() => setOpenId(null)}
                        >
                          Edit
                        </a>
                        <a
                            className="block cursor-pointer px-4 py-2  hover:bg-gray-700 transition-colors"
                            onClick={() => handleDelete(session.id)}
                        >
                          Delete
                        </a>
                      </div>
                  )}
                </div>
              </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
