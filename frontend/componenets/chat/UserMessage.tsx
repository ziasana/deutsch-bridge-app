import type { ChatMessage } from "@/types/chat";

/** Plain user bubble - no selection handling, no tutor styling (see spec s11 - selection is
 *  AI Tutor content only). */
export default function UserMessage({ message }: Readonly<{ message: ChatMessage }>) {
    return (
        <div className="flex justify-end">
            <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-md bg-[linear-gradient(135deg,hsl(228_78%_44%),hsl(216_100%_62%))] px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                {message.content}
            </div>
        </div>
    );
}
