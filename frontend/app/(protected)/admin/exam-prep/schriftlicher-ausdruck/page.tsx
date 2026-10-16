"use client";

import AdminExamTypePage from "@/componenets/admin/examPrep/AdminExamTypePage";
import DtzWritingManager from "@/componenets/admin/examPrep/DtzWritingManager";
import ExamSectionManager from "@/componenets/admin/examPrep/ExamSectionManager";

export default function AdminExamSchriftlicherAusdruckPage() {
    return <AdminExamTypePage>{(exam) => (exam === "DTZ" ? <DtzWritingManager /> : <ExamSectionManager section="SCHRIFTLICHER_AUSDRUCK" />)}</AdminExamTypePage>;
}
