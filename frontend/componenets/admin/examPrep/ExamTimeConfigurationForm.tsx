"use client";

import { Fragment } from "react";
import { ExamSection } from "@/types/exam";
import { DraftRow, OUTSIDE_TOTAL_SECTIONS, rowError, sumEnabled } from "@/lib/examTimeSettings";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componenets/ui/table";
import Toggle from "@/componenets/admin/Toggle";

const SECTION_LABELS: Partial<Record<ExamSection, string>> = {
    LESEVERSTEHEN: "Leseverstehen",
    SPRACHBAUSTEINE: "Sprachbausteine",
    SCHRIFTLICHER_AUSDRUCK: "Schriftlicher Ausdruck",
};

/** Table of every Teil with its recommended time, in the same style as the other admin settings tables. */
export default function ExamTimeConfigurationForm({
    rows,
    onChange,
    min,
    max,
    disabled,
}: Readonly<{
    rows: DraftRow[];
    onChange: (index: number, patch: Partial<Pick<DraftRow, "minutes" | "enabled">>) => void;
    min: number;
    max: number;
    disabled?: boolean;
}>) {
    const sections = Array.from(new Set(rows.map((r) => r.entry.section)));

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Teil</TableHead>
                    <TableHead>Recommended time (min)</TableHead>
                    <TableHead>Enabled</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sections.map((section) => {
                    const sectionRows = rows.map((row, index) => ({ row, index })).filter(({ row }) => row.entry.section === section);
                    const subtotal = sumEnabled(sectionRows.map(({ row }) => row), min, max);
                    const separate = OUTSIDE_TOTAL_SECTIONS.includes(section);
                    return (
                        <Fragment key={section}>
                            {sectionRows.map(({ row, index }, position) => {
                                const error = rowError(row, min, max);
                                const inputId = `time-${section}-${row.entry.teil}`;
                                return (
                                    <TableRow key={inputId}>
                                        <TableCell className="font-medium text-foreground">
                                            {position === 0 && (
                                                <>
                                                    {SECTION_LABELS[section] ?? section}
                                                    {separate && (
                                                        <span className="block text-xs font-normal text-foreground/50">
                                                            Separate time slot, not part of the exam duration
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <label htmlFor={inputId}>Teil {row.entry.teil}</label>
                                        </TableCell>
                                        <TableCell>
                                            <input
                                                id={inputId}
                                                type="text"
                                                inputMode="numeric"
                                                value={row.minutes}
                                                onChange={(e) => onChange(index, { minutes: e.target.value })}
                                                aria-invalid={error != null}
                                                placeholder="–"
                                                disabled={disabled}
                                                className="w-24 rounded-lg border border-border bg-muted text-foreground px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none aria-[invalid=true]:border-red-500"
                                            />
                                            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
                                        </TableCell>
                                        <TableCell>
                                            <Toggle checked={row.enabled} disabled={disabled} onChange={(v) => onChange(index, { enabled: v })} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!separate && (
                                <TableRow>
                                    <TableCell />
                                    <TableCell className="text-foreground/60">Subtotal</TableCell>
                                    <TableCell className="font-medium text-foreground">{subtotal} min</TableCell>
                                    <TableCell />
                                </TableRow>
                            )}
                        </Fragment>
                    );
                })}
            </TableBody>
        </Table>
    );
}
