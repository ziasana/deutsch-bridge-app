import { cn } from "@/lib/utils";
import { RESULT_LABEL, RESULT_TONE } from "@/lib/examSimulation";
import type { ResultStatus } from "@/types/examSimulation";

export default function SimResultBadge({ status, className }: Readonly<{ status: ResultStatus | null | undefined; className?: string }>) {
    if (!status) return null;
    return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold", RESULT_TONE[status], className)}>{RESULT_LABEL[status]}</span>;
}
