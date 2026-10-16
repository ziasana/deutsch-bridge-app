"use client";

import AdminExamTypePage from "@/componenets/admin/examPrep/AdminExamTypePage";
import DtzOralManager from "@/componenets/admin/examPrep/DtzOralManager";
import TelcSpeakingManager from "@/componenets/admin/examPrep/TelcSpeakingManager";

export default function AdminExamMuendlicherAusdruckPage() {
    return <AdminExamTypePage>{(exam) => (exam === "DTZ" ? <DtzOralManager /> : <TelcSpeakingManager />)}</AdminExamTypePage>;
}
