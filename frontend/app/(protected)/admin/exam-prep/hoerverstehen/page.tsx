"use client";

import AdminExamTypePage from "@/componenets/admin/examPrep/AdminExamTypePage";
import ExamSectionManager from "@/componenets/admin/examPrep/ExamSectionManager";

export default function AdminExamHoerverstehenPage() {
    return <AdminExamTypePage>{(exam) => <ExamSectionManager section="HOERVERSTEHEN" examType={exam} />}</AdminExamTypePage>;
}
