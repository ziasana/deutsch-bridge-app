import type { ChatMessage } from "@/types/chat";

/** Plain user bubble - no selection handling, no tutor styling (see spec s11 - selection is
 *  AI Tutor content only). */
export default function UserMessage({ message }: Readonly<{ message: ChatMessage }>) {
    return (
        <div className="ml-auto max-w-[85%] text-right">
            <div className="inline-block rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
                {message.content}
            </div>
        </div>
    );
}
