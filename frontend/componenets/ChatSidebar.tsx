"use client";
import RefreshButton from "@/componenets/RefreshButton";

interface Topic {
  id: string;
  title?: string;
  userId?: string;
}

interface SidebarProps {
  sessions: Topic[];
  onSelect: (sessionId: string) => void;
  onClose?: () => void; // for mobile
  onNewChat: () => void;
  selectedSessionId: string;
  onRefresh:() => void;
}

export default function ChatSidebar({
  sessions,
  onSelect,
  onNewChat,
    onRefresh,
  selectedSessionId,
  onClose,
}: Readonly<SidebarProps>) {

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
        <ul>
          {sessions.map((session) => (
            <li
              key={session.id} >
              <button type={"button"}
              onClick={() => onSelect(session.id)}
              className={`cursor-pointer px-2 py-1 rounded text-gray-700 dark:text-gray-300
              ${
                session.id === selectedSessionId
                  ? "bg-gray-300 dark:bg-gray-600"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {" "}
              {session.title ?? session.id}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
