import { toast } from "@/lib/toast";
import { accentForSection, toastThemeStyle } from "@/componenets/exam/lessonTheme";
import { ExamSection } from "@/types/exam";
import { ExamPracticeSessionResult } from "@/types/examTime";
import { zeitCheckMessage } from "@/lib/examTime";

const STARTED_TOAST_ID = "exam-timer-started";

/** Fixed id: React strict mode or a quick re-open never stacks two "started" toasts. */
export function showTimerStartedToast(section?: ExamSection) {
    toast.info("Zeit gestartet", { toastId: STARTED_TOAST_ID, autoClose: 2500, style: section ? toastThemeStyle(accentForSection(section)) : undefined });
}

export function showZeitCheckToast(result: ExamPracticeSessionResult) {
    const message = zeitCheckMessage(result);
    const content = (
        <div>
            <p className="font-semibold">{message.title}</p>
            {message.lines.map((line) => (
                <p key={line}>{line}</p>
            ))}
        </div>
    );
    const options = { autoClose: 9000, style: toastThemeStyle(accentForSection(result.section)) };
    if (message.tone === "within") toast.success(content, options);
    else toast.info(content, options);
}
