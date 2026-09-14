import { GrammarLesson, QuizQuestion, TRANSLATABLE_GRAMMAR_LEVELS } from "@/types/grammar";
import { AppLanguage } from "@/lib/i18n/translations";

export function isTranslatableLevel(level: string): boolean {
    return TRANSLATABLE_GRAMMAR_LEVELS.includes(level);
}

/** Farsi content only actually applies when the lesson's level is translatable AND a Farsi value was entered. */
function shouldUseFa(lesson: Pick<GrammarLesson, "level">, lang: AppLanguage): boolean {
    return lang === "fa" && isTranslatableLevel(lesson.level);
}

export function localizedLessonText(lesson: GrammarLesson, lang: AppLanguage) {
    const fa = shouldUseFa(lesson, lang);
    return {
        title: (fa && lesson.titleFa) || lesson.title,
        summary: (fa && lesson.summaryFa) || lesson.summary,
        content: (fa && lesson.contentFa) || lesson.content,
        example: (fa && lesson.exampleFa) || lesson.example,
        usageTips: (fa && lesson.usageTipsFa) || lesson.usageTips,
        dir: fa && lesson.titleFa ? ("rtl" as const) : ("ltr" as const),
    };
}

export function localizedQuestionText(question: QuizQuestion, lessonLevel: string, lang: AppLanguage) {
    const fa = lang === "fa" && isTranslatableLevel(lessonLevel);
    const title = (fa && question.titleFa) || question.title;
    const text = (fa && question.questionFa) || question.question;
    return {
        title,
        question: text,
        dir: fa && question.questionFa ? ("rtl" as const) : ("ltr" as const),
    };
}
