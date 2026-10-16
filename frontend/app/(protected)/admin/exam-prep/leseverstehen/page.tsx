"use client";

import AdminExamTypePage from "@/componenets/admin/examPrep/AdminExamTypePage";
import ExamSectionManager from "@/componenets/admin/examPrep/ExamSectionManager";

export default function AdminExamLeseverstehenPage() {
    return <AdminExamTypePage>{(exam) => <ExamSectionManager section="LESEVERSTEHEN" examType={exam} />}</AdminExamTypePage>;
}
