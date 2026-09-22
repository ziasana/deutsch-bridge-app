import {
    Briefcase,
    Home,
    GraduationCap,
    MessageCircle,
    Target,
    MapPin,
    Heart,
    BookOpen,
    Puzzle,
    Mic,
    Ear,
    Book,
    PenLine,
    Quote,
    ClipboardCheck,
    LucideIcon,
} from "lucide-react";
import { CEFRLevel, ExamType, LearningFocus, LearningReason } from "@/types/onboarding";

export const CEFR_LEVELS: { code: CEFRLevel; label: string; description: string }[] = [
    { code: "A1", label: "A1 · Beginner", description: "I know basic words and simple sentences." },
    { code: "A2", label: "A2 · Elementary", description: "I can communicate in familiar everyday situations." },
    { code: "B1", label: "B1 · Intermediate", description: "I can handle many everyday conversations." },
    { code: "B2", label: "B2 · Upper Intermediate", description: "I can discuss complex topics with reasonable confidence." },
    { code: "C1", label: "C1 · Advanced", description: "I can express myself fluently in complex situations." },
    { code: "C2", label: "C2 · Proficient", description: "I understand almost everything and express myself precisely." },
];

export const CEFR_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const LEARNING_REASON_OPTIONS: { value: LearningReason; label: string; description: string; icon: LucideIcon }[] = [
    { value: "WORK", label: "Work & Career", description: "Improve German for my job", icon: Briefcase },
    { value: "EVERYDAY_LIFE", label: "Everyday Life", description: "Communicate more confidently in daily life", icon: Home },
    { value: "STUDY", label: "Study & University", description: "Prepare for studying in German", icon: GraduationCap },
    { value: "COMMUNICATION", label: "Communication", description: "Speak and understand German better", icon: MessageCircle },
    { value: "EXAM", label: "Exam Preparation", description: "Prepare for a German exam", icon: Target },
    { value: "LIVING_IN_GERMANY", label: "Living in Germany", description: "Feel more confident living in Germany", icon: MapPin },
    { value: "PERSONAL_INTEREST", label: "Personal Interest", description: "I simply want to learn German", icon: Heart },
];

export const FOCUS_AREA_OPTIONS: { value: LearningFocus; label: string; description: string; icon: LucideIcon }[] = [
    { value: "VOCABULARY", label: "Vocabulary", description: "Learn and remember more words", icon: BookOpen },
    { value: "GRAMMAR", label: "Grammar", description: "Build stronger German sentence structures", icon: Puzzle },
    { value: "SPEAKING", label: "Speaking", description: "Express myself more confidently", icon: Mic },
    { value: "LISTENING", label: "Listening", description: "Understand spoken German better", icon: Ear },
    { value: "READING", label: "Reading", description: "Understand German texts more easily", icon: Book },
    { value: "WRITING", label: "Writing", description: "Write clearer and more accurate German", icon: PenLine },
    { value: "EXPRESSIONS", label: "Expressions", description: "Learn natural German expressions", icon: Quote },
    { value: "EXAM", label: "Exam Skills", description: "Practice exam-specific tasks", icon: ClipboardCheck },
];

export const EXAM_TYPE_OPTIONS: { value: ExamType; label: string }[] = [
    { value: "TELC", label: "TELC" },
    { value: "GOETHE", label: "Goethe" },
    { value: "TESTDAF", label: "TestDaF" },
    { value: "DSH", label: "DSH" },
    { value: "OTHER", label: "Other" },
];

export const DAILY_WORD_OPTIONS: { value: number; pace: string }[] = [
    { value: 5, pace: "Relaxed" },
    { value: 10, pace: "Balanced" },
    { value: 15, pace: "Focused" },
    { value: 20, pace: "Intensive" },
];
