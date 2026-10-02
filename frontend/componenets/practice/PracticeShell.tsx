import { ReactNode } from "react";

/** Page frame shared by the flashcard-style practice sessions: soft brand atmosphere, one centered column. */
export default function PracticeShell({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-xl">{children}</div>
        </div>
    );
}
