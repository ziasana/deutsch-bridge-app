export type AppLanguage = "en" | "fa";

/** Maps the account's stored preference (User.preferredLanguage: EN/DE/PR) to an app UI language. */
export function toAppLanguage(preferredLanguage: string | null | undefined): AppLanguage {
    return preferredLanguage === "PR" ? "fa" : "en";
}

export interface Dictionary {
    common: {
        iKnow: string;
        iDontKnow: string;
    };
    nav: {
        adminDashboard: string;
        dashboard: string;
        chatAi: string;
        vocabulary: string;
        expressions: string;
        home: string;
        contact: string;
        about: string;
        login: string;
        signup: string;
        profile: string;
        yourProgress: string;
        updatePassword: string;
        signOut: string;
        logout: string;
        darkMode: string;
        lightMode: string;
        manageReading: string;
        manageExamPrep: string;
        manageGrammar: string;
        manageExpressions: string;
        collapseSidebar: string;
        expandSidebar: string;
    };
    profile: {
        title: string;
        edit: string;
        cancel: string;
        name: string;
        email: string;
        learningPreferences: string;
        customizeDaily: string;
        learningLevel: string;
        dailyWordGoal: string;
        words: string;
        recommendedGoal: string;
        enableNotification: string;
        preferredLanguage: string;
        saveProfile: string;
        updated: string;
        joined: string;
        changePhoto: string;
        avatarUpdated: string;
        avatarUploadFailed: string;
        accountInfo: string;
    };
    dashboard: {
        welcome: string;
        subtitle: string;
        start: string;
        modules: {
            dailyWords: { title: string; description: string };
            grammarLessons: { title: string; description: string };
            expressions: { title: string; description: string };
            reading: { title: string; description: string };
            examPrep: { title: string; description: string };
            wordReview: { title: string; description: string };
            vocabularyTrainer: { title: string; description: string };
            aiChat: { title: string; description: string };
        };
        greeting: {
            morning: (name: string) => string;
            afternoon: (name: string) => string;
            evening: (name: string) => string;
            subtitle: string;
            streakDays: (count: number) => string;
        };
        continueLearning: {
            label: string;
            cta: string;
            startTitle: string;
            startDescription: string;
            startCta: string;
            progressOf: (completed: number, total: number) => string;
            dailyWordsTitle: string;
            dailyWordsDescription: string;
            vocabReviewTitle: string;
            vocabReviewDescription: (count: number) => string;
            grammarTitle: string;
            grammarDescription: string;
            readingTitle: string;
            readingDescription: string;
            expressionsTitle: string;
            expressionsDescription: string;
        };
        todaysPlan: {
            title: string;
            completedOf: (completed: number, total: number) => string;
            dailyWords: string;
            vocabReview: string;
            grammar: string;
            reading: string;
        };
        review: {
            title: string;
            wordsReady: (count: number) => string;
            expressionsReady: (count: number) => string;
            cta: string;
            allCaughtUpTitle: string;
            allCaughtUpSubtitle: string;
        };
        focus: {
            title: string;
            vocabularyTitle: string;
            vocabularyDescription: string;
            grammarTitle: string;
            grammarDescription: string;
            readingTitle: string;
            readingDescription: string;
            expressionsTitle: string;
            expressionsDescription: string;
            neutralDescription: string;
            cta: string;
        };
        week: {
            title: string;
            learningDaysOf: (days: number, total: number) => string;
            viewProgress: string;
            emptyTitle: string;
            emptySubtitle: string;
        };
        milestone: {
            title: string;
            reached: (count: number) => string;
            next: (count: number) => string;
        };
        error: {
            message: string;
            retry: string;
        };
        newContent: {
            summary: (total: number) => string;
            grammarLessons: (count: number) => string;
            readingArticles: (count: number) => string;
            expressions: (count: number) => string;
        };
    };
    reading: {
        title: string;
        subtitle: string;
        level: string;
        allLevels: string;
        textsUnit: string;
        searchPlaceholder: string;
        currentLevel: string;
        quiz: string;
        review: string;
        learned: string;
        newForYou: (count: number) => string;
        views: (count: number) => string;
        posted: (date: string) => string;
        notFound: string;
        previous: string;
        next: string;
        pageOf: (page: number, total: number) => string;
    };
    dailyWords: {
        title: string;
        subtitle: (total: number) => string;
        loadError: string;
        loadErrorSubtitle: string;
        retry: string;
        emptyTitle: string;
        emptySubtitle: string;
        savedToast: (word: string) => string;
        saveFailedToast: string;
        progressFailedToast: string;
        header: {
            learnedOf: (learned: number, total: number) => string;
            remaining: (count: number) => string;
            progressAria: (learned: number, total: number) => string;
        };
        card: {
            wordOf: (index: number, total: number) => string;
            playAria: (word: string) => string;
            saving: string;
            saved: string;
            save: string;
            learned: string;
            markLearned: string;
            previous: string;
            next: string;
            previousAria: string;
            nextAria: string;
        };
        overview: {
            title: (count: number) => string;
        };
        practice: {
            title: string;
            questionOf: (index: number, total: number) => string;
            prompt: (meaning: string) => string;
            correct: string;
            incorrect: (word: string) => string;
            finish: string;
            next: string;
            answerOptionsAria: string;
        };
        completion: {
            title: string;
            subtitle: (total: number) => string;
            review: string;
        };
    };
    readingArticle: {
        back: string;
        noArticleSelected: string;
        articleNotFound: string;
        views: (count: number) => string;
        posted: (date: string) => string;
        learned: string;
        markLearned: string;
        markNotLearned: string;
        markedLearned: string;
        markedNotLearned: string;
        saving: string;
        plural: string;
        literal: string;
        meaning: string;
        saved: string;
        save: string;
        savedToReview: (lemma: string) => string;
        keyVocabulary: string;
        keyVocabularySubtitle: string;
        quiz: {
            title: string;
            ready: string;
            loadingQuiz: string;
            start: string;
            noQuiz: string;
            questionOf: (current: number, total: number) => string;
            correct: string;
            incorrect: string;
            correctAnswer: string;
            addedToReview: (lemma: string) => string;
            seeResults: string;
            nextQuestion: string;
            checking: string;
            submitAnswer: string;
            comprehension: string;
            vocabInContext: string;
            goToArticle: string;
        };
    };
    vocabulary: {
        title: string;
        subtitle: string;
        practiceCta: string;
        addNew: string;
        searchPlaceholder: string;
        sourceTabs: { myWords: string; fromReading: string; fromAiTutor: string };
        filters: { level: string; all: string; mastery: string; bookmarked: string; bookmarkedOnly: string };
        mastery: { NEW: string; LEARNING: string; FAMILIAR: string; MASTERED: string };
        continueLearning: {
            title: string;
            subtitleReady: (count: number) => string;
            subtitleCaughtUp: string;
            seeAll: string;
        };
        allWords: { title: string; count: (n: number) => string };
        empty: { title: string; subtitle: string };
        card: {
            recall: string;
            context: string;
            practice: string;
            bookmarkAdd: string;
            bookmarkRemove: string;
            editAria: string;
            deleteAria: string;
            playAudioAria: string;
        };
        confirmDeleteTitle: string;
        confirmDelete: string;
        deleteAction: string;
        cancelAction: string;
        deleted: string;
        deleteFailed: string;
        previous: string;
        next: string;
        pageOf: (page: number, total: number) => string;
        modal: {
            addTitle: string;
            editTitle: string;
            word: string;
            article: string;
            articleNone: string;
            meaning: string;
            example: string;
            generateExample: string;
            generatingExample: string;
            generateExampleFailed: string;
            cancel: string;
            save: string;
            saving: string;
            added: string;
            addFailed: string;
            updated: string;
            updateFailed: string;
        };
        detail: {
            back: string;
            notFound: string;
            overallLabel: string;
            meaning: string;
            example: string;
            synonyms: string;
            practiceThis: string;
        };
        practice: {
            noWords: string;
            noWordsSubtitle: string;
            goToVocabulary: string;
            stepOf: (current: number, total: number) => string;
            itemOf: (current: number, total: number) => string;
            flipPrompt: string;
            knewIt: string;
            didntKnowIt: string;
            contextPromptCloze: string;
            contextPromptMeaning: string;
            next: string;
            sessionComplete: string;
            wordsPracticed: string;
            recallAccuracy: string;
            contextAccuracy: string;
            practiceAgain: string;
            backToVocabulary: string;
        };
    };
    chat: {
        newChat: string;
        newChatToast: string;
        chatHistory: string;
        rename: string;
        delete: string;
        confirmDelete: string;
        deleted: string;
        yourAiTutor: string;
        subtitle: string;
        setTitlePlaceholder: string;
        save: string;
        cancel: string;
        typePlaceholder: string;
        send: string;
        thinking: string;
        groups: { today: string; yesterday: string; earlier: string };
        emptyState: {
            greeting: string;
            intro: string;
            starters: {
                speaking: { title: string; description: string; prompt: string };
                writing: { title: string; description: string; prompt: string };
                grammar: { title: string; description: string; prompt: string };
                question: { title: string; description: string; prompt: string };
            };
            orWriteFirst: string;
        };
        selection: {
            saveWord: string;
            saveExpression: string;
            alreadySaved: string;
            saving: string;
            savedToVocabulary: string;
            saveFailed: string;
        };
    };
    readingReview: {
        typeLabels: {
            WORD: string;
            NOMEN_VERB_VERBINDUNG: string;
            REDEWENDUNG: string;
        };
        nothingDue: string;
        nothingDueSubtitle: string;
        goToReading: string;
        sessionFinished: string;
        resultsSummary: (correct: number, total: number, rate: number) => string;
        backToReading: string;
        checkAgain: string;
        cardOf: (current: number, total: number) => string;
        status: string;
        meaning: string;
        showMeaning: string;
    };
    dictionaryPanel: {
        searchPlaceholder: string;
        go: string;
        closeAria: string;
        closePanelAria: string;
        loading: string;
        notFound: (lemma: string) => string;
        flagMissing: string;
        reported: string;
        playPronunciationAria: string;
        playExampleAudioAria: string;
        savedToVocab: string;
        addToVocab: string;
        removedFromVocab: string;
        addedToVocab: string;
        reportThanks: string;
        reportFailed: string;
    };
    grammar: {
        title: string;
        subtitle: string;
        searchPlaceholder: string;
        level: string;
        allLevels: string;
        lessonsCount: (count: number) => string;
        lessonsUnit: string;
        currentLevel: string;
        practice: string;
        review: string;
        notFound: string;
        previous: string;
        next: string;
        pageOf: (page: number, total: number) => string;
        back: string;
        learned: string;
        example: string;
        usageTip: string;
        markLearned: string;
        markNotLearned: string;
        markedLearned: string;
        markedNotLearned: string;
        saving: string;
        watchVideo: string;
        exercises: string;
        checkUnderstanding: (count: number) => string;
        startExercises: string;
        questionOf: (current: number, total: number) => string;
        submitAnswer: string;
        correct: string;
        incorrect: string;
        correctAnswer: string;
        nextQuestion: string;
        seeResults: string;
        resultsScore: (correct: number, total: number) => string;
        retry: string;
        typeAnswer: string;
        true: string;
        false: string;
        notTranslatable: string;
        noLesson: string;
        notFoundLesson: string;
        topicsCount: (count: number) => string;
        completedOf: (learned: number, total: number) => string;
        categoryTestCompleted: string;
        lastScore: (score: number, total: number) => string;
        retakeCategoryTest: string;
        takeCategoryTest: string;
        otherLessons: string;
        categoryNotFound: string;
        topicsInBlock: (count: number) => string;
        categoryTest: {
            noExercises: string;
            questionsFromLessons: (count: number, threshold: number) => string;
            startTest: string;
            retakeTestPrompt: string;
            lastAttempt: (score: number, total: number) => string;
            passedLabel: string;
            notPassedLabel: string;
            completedSuffix: string;
            retakeTest: string;
            markAsComplete: string;
            completedBadge: string;
            passedNeeds: (threshold: number) => string;
            notPassedNeeds: (threshold: number) => string;
            markedComplete: string;
            failedLoadCategory: string;
            failedSaveResult: string;
            failedMarkComplete: string;
        };
    };
    home: {
        heroTitle: string;
        heroSubtitle: string;
        getStarted: string;
        featuresTitle: string;
        learnTitle: string;
        learnDescription: string;
        practiceTitle: string;
        practiceDescription: string;
        trackTitle: string;
        trackDescription: string;
        ctaTitle: string;
        exploreFeatures: string;
    };
    progress: {
        title: string;
        subtitle: string;
        dayStreak: (count: number) => string;
        stats: {
            wordsMastered: string;
            outOfTotal: (total: number) => string;
            dailyWordsLearned: string;
            lessonsCompleted: string;
            activeExpressions: string;
            readingCompleted: string;
            dailyGoal: string;
            dailyGoalNotSet: string;
            dailyGoalSubtitle: (learned: number, goal: number) => string;
        };
        vocabularyMastery: string;
        vocabularyEmpty: string;
        practiceVocabulary: string;
        expressionMastery: string;
        expressionsEmpty: string;
        practiceExpressions: string;
        segments: {
            new: string;
            learning: string;
            familiar: string;
            active: string;
            mastered: string;
        };
        total: (count: number) => string;
        grammar: {
            title: string;
            lessonsLearned: string;
            categoryTestsPassed: string;
            attempted: (count: number) => string;
            notAttempted: string;
            practice: string;
        };
        reading: {
            title: string;
            articlesCompleted: string;
            readArticle: string;
        };
        exam: {
            title: string;
            averageScore: string;
            acrossCompleted: (count: number) => string;
            empty: string;
            practiceMore: string;
            startExamPrep: string;
        };
        milestones: {
            title: string;
            wordsMastered: (count: number) => string;
            toGoUntil: (remaining: number, threshold: number) => string;
            allReached: string;
        };
    };
}

const en: Dictionary = {
    common: {
        iKnow: "I know",
        iDontKnow: "I don't know",
    },
    nav: {
        adminDashboard: "Admin Dashboard",
        dashboard: "Dashboard",
        chatAi: "Chat AI",
        vocabulary: "Vocabulary",
        expressions: "Expressions",
        home: "Home",
        contact: "Contact",
        about: "About",
        login: "Login",
        signup: "Signup",
        profile: "Profile",
        yourProgress: "Your progress",
        updatePassword: "Update Password",
        signOut: "Sign out",
        logout: "Logout",
        darkMode: "Dark Mode 🌙",
        lightMode: "Light Mode ☀️",
        manageReading: "Manage Reading",
        manageExamPrep: "Manage Exam Prep",
        manageGrammar: "Manage Grammar",
        manageExpressions: "Manage Expressions",
        collapseSidebar: "Collapse sidebar",
        expandSidebar: "Expand sidebar",
    },
    profile: {
        title: "Profile",
        edit: "Edit",
        cancel: "Cancel",
        name: "Name",
        email: "Email",
        learningPreferences: "Learning Preferences",
        customizeDaily: "Customize your daily learning experience.",
        learningLevel: "Learning level",
        dailyWordGoal: "Daily word goal",
        words: "words",
        recommendedGoal: "Recommended: 10–15 words per day",
        enableNotification: "Enable Notification",
        preferredLanguage: "Preferred Language",
        saveProfile: "Save Profile",
        updated: "Profile updated!",
        joined: "Joined",
        changePhoto: "Change photo",
        avatarUpdated: "Avatar updated!",
        avatarUploadFailed: "Couldn't upload avatar",
        accountInfo: "Account Information",
    },
    dashboard: {
        welcome: "Welcome to your Dashboard",
        subtitle: "Continue your journey to mastering German — step by step.",
        start: "Start →",
        modules: {
            dailyWords: {
                title: "Daily Words",
                description: "Learn 5 new C1-level words every day with examples and synonyms.",
            },
            grammarLessons: {
                title: "Grammar Lessons",
                description: "Structured grammar explanations with examples and exercises.",
            },
            expressions: {
                title: "Active Expressions",
                description: "Learn Nomen-Verb-Verbindungen and Redewendungen through active recall and production, not just reading.",
            },
            reading: {
                title: "Reading",
                description: "Read articles at your level and learn new words in context.",
            },
            examPrep: {
                title: "Prüfungsvorbereitung",
                description: "Practice real exam-style Leseverstehen tasks, section by section.",
            },
            wordReview: {
                title: "Word Review",
                description: "Review the words and phrases you saved while reading, spaced out over time.",
            },
            vocabularyTrainer: {
                title: "Vocabulary Trainer",
                description: "Add, save, and memorize your own vocabulary list.",
            },
            aiChat: {
                title: "AI Tutor",
                description: "Chat with an intelligent German tutor to practice freely.",
            },
        },
        greeting: {
            morning: (name) => `Good morning, ${name}`,
            afternoon: (name) => `Good afternoon, ${name}`,
            evening: (name) => `Good evening, ${name}`,
            subtitle: "Ready for your next German lesson?",
            streakDays: (count) => `${count} day streak`,
        },
        continueLearning: {
            label: "Continue Learning",
            cta: "Continue →",
            startTitle: "Start Learning",
            startDescription: "Begin today's first learning activity.",
            startCta: "Start Learning →",
            progressOf: (completed, total) => `${completed} of ${total} completed`,
            dailyWordsTitle: "Today's Words",
            dailyWordsDescription: "Finish learning today's new words.",
            vocabReviewTitle: "Vocabulary Review",
            vocabReviewDescription: (count) => `${count} word${count === 1 ? "" : "s"} ready for review`,
            grammarTitle: "Grammar Lesson",
            grammarDescription: "Continue with your next grammar lesson.",
            readingTitle: "Reading",
            readingDescription: "Continue with your next reading text.",
            expressionsTitle: "Active Expressions",
            expressionsDescription: "Practice your active expressions.",
        },
        todaysPlan: {
            title: "Today's plan",
            completedOf: (completed, total) => `${completed} / ${total} completed`,
            dailyWords: "Daily Words",
            vocabReview: "Word Review",
            grammar: "Grammar",
            reading: "Reading",
        },
        review: {
            title: "Review needed",
            wordsReady: (count) => `${count} word${count === 1 ? "" : "s"} ready for review.`,
            expressionsReady: (count) => `${count} expression${count === 1 ? "" : "s"} could use another review.`,
            cta: "Review now →",
            allCaughtUpTitle: "You're all caught up 🎉",
            allCaughtUpSubtitle: "No reviews are waiting right now.",
        },
        focus: {
            title: "Your current focus",
            vocabularyTitle: "Vocabulary",
            vocabularyDescription: "A little more vocabulary practice can help strengthen your recent learning.",
            grammarTitle: "Grammar",
            grammarDescription: "Spending a bit more time on grammar can help round out your progress.",
            readingTitle: "Reading",
            readingDescription: "More reading practice can help build on what you've already learned.",
            expressionsTitle: "Active Expressions",
            expressionsDescription: "Practicing expressions a little more can help make them stick.",
            neutralDescription: "Keep building your German vocabulary.",
            cta: "Practice now →",
        },
        week: {
            title: "This week",
            learningDaysOf: (days, total) => `${days} / ${total} learning days`,
            viewProgress: "View full progress →",
            emptyTitle: "Your week starts here.",
            emptySubtitle: "Complete your first learning activity today.",
        },
        milestone: {
            title: "Milestone",
            reached: (count) => `You've learned ${count} German words.`,
            next: (count) => `Next milestone: ${count} words.`,
        },
        error: {
            message: "We couldn't load your dashboard.",
            retry: "Try again",
        },
        newContent: {
            summary: (total) => `${total} new item${total === 1 ? "" : "s"} since your last visit`,
            grammarLessons: (count) => `${count} grammar lesson${count === 1 ? "" : "s"}`,
            readingArticles: (count) => `${count} reading text${count === 1 ? "" : "s"}`,
            expressions: (count) => `${count} expression${count === 1 ? "" : "s"}`,
        },
    },
    reading: {
        title: "Reading",
        subtitle: "Read articles at your level and tap highlighted words to learn new vocabulary in context.",
        level: "Level:",
        allLevels: "All levels",
        textsUnit: "texts",
        searchPlaceholder: "Search reading texts...",
        currentLevel: "Current level",
        quiz: "Quiz",
        review: "Review",
        learned: "Learned",
        newForYou: (count: number) => `${count} new for you`,
        views: (count: number) => `👁 ${count} views`,
        posted: (date: string) => `Posted ${date}`,
        notFound: "No reading articles found.",
        previous: "Previous",
        next: "Next",
        pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
    },
    dailyWords: {
        title: "Daily Words",
        subtitle: (total: number) => `Your ${total} words for today`,
        loadError: "We couldn't load today's words.",
        loadErrorSubtitle: "Please try again.",
        retry: "Retry",
        emptyTitle: "No new words for today.",
        emptySubtitle: "Check back tomorrow for your next 5 words.",
        savedToast: (word: string) => `"${word}" added to your Vocabulary!`,
        saveFailedToast: "Failed to save word to your Vocabulary.",
        progressFailedToast: "Failed to update progress.",
        header: {
            learnedOf: (learned: number, total: number) => `${learned} / ${total} learned`,
            remaining: (count: number) => `${count} word${count === 1 ? "" : "s"} remaining`,
            progressAria: (learned: number, total: number) => `${learned} of ${total} daily words learned`,
        },
        card: {
            wordOf: (index: number, total: number) => `Word ${index} of ${total}`,
            playAria: (word: string) => `Play pronunciation of ${word}`,
            saving: "Saving...",
            saved: "✓ Saved to Vocabulary",
            save: "+ Save to Vocabulary",
            learned: "Learned",
            markLearned: "✓ I know this",
            previous: "Previous",
            next: "Next",
            previousAria: "Previous word",
            nextAria: "Next word",
        },
        overview: {
            title: (count: number) => `Today's ${count} Words`,
        },
        practice: {
            title: "Quick Practice",
            questionOf: (index: number, total: number) => `${index} / ${total}`,
            prompt: (meaning: string) => `Which word means "${meaning}"?`,
            correct: "✓ Correct",
            incorrect: (word: string) => `✗ It was "${word}"`,
            finish: "Finish",
            next: "Next",
            answerOptionsAria: "Answer options",
        },
        completion: {
            title: "Daily Words complete!",
            subtitle: (total: number) => `You've learned ${total} words today.`,
            review: "Review today's words",
        },
    },
    readingArticle: {
        back: "← Back to Reading",
        noArticleSelected: "No article selected.",
        articleNotFound: "Article not found.",
        views: (count: number) => `👁 ${count} views`,
        posted: (date: string) => `Posted ${date}`,
        learned: "Learned",
        markLearned: "Mark as learned",
        markNotLearned: "Mark as not learned",
        markedLearned: "Marked as learned!",
        markedNotLearned: "Marked as not learned.",
        saving: "Saving...",
        plural: "Plural: ",
        literal: "Literal: ",
        meaning: "Meaning: ",
        saved: "Saved ✓",
        save: "Save",
        savedToReview: (lemma: string) => `Saved "${lemma}" to your review list.`,
        keyVocabulary: "Key vocabulary",
        keyVocabularySubtitle: "The key words for this article.",
        quiz: {
            title: "Quiz",
            ready: "Ready to check your understanding? Start the quiz for this article.",
            loadingQuiz: "Loading quiz...",
            start: "Start quiz",
            noQuiz: "This article has no quiz yet.",
            questionOf: (current: number, total: number) => `Question ${current} of ${total}`,
            correct: "Correct!",
            incorrect: "Not quite.",
            correctAnswer: "Correct answer: ",
            addedToReview: (lemma: string) => `Added "${lemma}" to your review list.`,
            seeResults: "See results",
            nextQuestion: "Next question",
            checking: "Checking...",
            submitAnswer: "Submit answer",
            comprehension: "Comprehension",
            vocabInContext: "Vocab in context",
            goToArticle: "Go to article",
        },
    },
    vocabulary: {
        title: "My Vocabulary",
        subtitle: "Build your word bank, track mastery, and practice recall and context together.",
        practiceCta: "Continue practicing",
        addNew: "Add word",
        searchPlaceholder: "Search by word, meaning or example...",
        sourceTabs: { myWords: "My words", fromReading: "From reading", fromAiTutor: "From AI Tutor" },
        filters: { level: "Level", all: "All", mastery: "Progress", bookmarked: "Bookmarked", bookmarkedOnly: "Bookmarked" },
        mastery: { NEW: "New", LEARNING: "Learning", FAMILIAR: "Familiar", MASTERED: "Mastered" },
        continueLearning: {
            title: "Continue learning",
            subtitleReady: (count: number) => `You have ${count} words ready to practice.`,
            subtitleCaughtUp: "You're all caught up!",
            seeAll: "See all",
        },
        allWords: { title: "All vocabulary", count: (n: number) => `${n} words` },
        empty: { title: "No vocabulary found", subtitle: "Try changing your search or filters." },
        card: {
            recall: "Erkennen",
            context: "Kontext",
            practice: "Practice",
            bookmarkAdd: "Bookmark this word",
            bookmarkRemove: "Remove bookmark",
            editAria: "Edit",
            deleteAria: "Delete",
            playAudioAria: "Play pronunciation",
        },
        confirmDeleteTitle: "Delete this word?",
        confirmDelete: "Are you sure you want to delete this word?",
        deleteAction: "Delete",
        cancelAction: "Cancel",
        deleted: "Vocabulary deleted!",
        deleteFailed: "Failed to delete vocabulary.",
        previous: "Previous",
        next: "Next",
        pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
        modal: {
            addTitle: "Add new word",
            editTitle: "Edit word",
            word: "Word",
            article: "Article",
            articleNone: "None",
            meaning: "Meaning",
            example: "Example",
            generateExample: "Generate with AI",
            generatingExample: "Generating...",
            generateExampleFailed: "Failed to generate an example.",
            cancel: "Cancel",
            save: "Save",
            saving: "Saving...",
            added: "Word added!",
            addFailed: "Failed to add word.",
            updated: "Word updated!",
            updateFailed: "Failed to update word.",
        },
        detail: {
            back: "Back to vocabulary",
            notFound: "Word not found",
            overallLabel: "Overall progress",
            meaning: "Meaning",
            example: "Example",
            synonyms: "Synonyms",
            practiceThis: "Practice this word",
        },
        practice: {
            noWords: "No words to practice right now",
            noWordsSubtitle: "Add new words to your vocabulary, or come back once you have more to review.",
            goToVocabulary: "Go to My Vocabulary",
            stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
            itemOf: (current: number, total: number) => `${current} / ${total}`,
            flipPrompt: "Tap the card to reveal the meaning",
            knewIt: "I knew it",
            didntKnowIt: "I didn't know it",
            contextPromptCloze: "Fill in the missing word",
            contextPromptMeaning: "Which meaning is correct?",
            next: "Next",
            sessionComplete: "Session complete",
            wordsPracticed: "Words practiced",
            recallAccuracy: "Recall accuracy",
            contextAccuracy: "Context accuracy",
            practiceAgain: "Practice again",
            backToVocabulary: "Back to vocabulary",
        },
    },
    chat: {
        newChat: "New Chat",
        newChatToast: "New chat is initiated!",
        chatHistory: "Conversations",
        rename: "Rename",
        delete: "Delete",
        confirmDelete: "Are you sure to delete all chat in this session!",
        deleted: "Session deleted!",
        yourAiTutor: "AI Tutor",
        subtitle: "Practice conversational German with an AI tutor.",
        setTitlePlaceholder: "Set title...",
        save: "Save",
        cancel: "Cancel",
        typePlaceholder: "Write something in German...",
        send: "Send",
        thinking: "AI is thinking…",
        groups: { today: "Today", yesterday: "Yesterday", earlier: "Earlier" },
        emptyState: {
            greeting: "Guten Tag! 👋",
            intro: "Ich bin dein Deutsch-Tutor. Übe Deutsch, stelle Fragen oder schreibe einfach mit mir.",
            starters: {
                speaking: {
                    title: "Sprechen",
                    description: "Führe ein Gespräch auf Deutsch.",
                    prompt: "Lass uns auf Deutsch über meinen Alltag sprechen. Stell mir Fragen dazu.",
                },
                writing: {
                    title: "Schreiben",
                    description: "Verbessere deine deutschen Texte.",
                    prompt: "Ich möchte meine deutschen Schreibfähigkeiten üben. Gib mir ein Thema zum Schreiben.",
                },
                grammar: {
                    title: "Grammatik",
                    description: "Übe Grammatik mit mir.",
                    prompt: "Kannst du mir helfen, deutsche Grammatik zu üben? Erkläre mir etwas und teste mich.",
                },
                question: {
                    title: "Frage stellen",
                    description: "Frag mich alles zum Deutschlernen.",
                    prompt: "Ich habe eine Frage zum Deutschlernen.",
                },
            },
            orWriteFirst: "Oder schreibe einfach deine erste Nachricht ...",
        },
        selection: {
            saveWord: "Save word",
            saveExpression: "Save expression",
            alreadySaved: "Already in Vocabulary",
            saving: "Saving...",
            savedToVocabulary: "Saved to Vocabulary",
            saveFailed: "Couldn't save this item. Please try again.",
        },
    },
    readingReview: {
        typeLabels: {
            WORD: "Word",
            NOMEN_VERB_VERBINDUNG: "Nomen-Verb-Verbindung",
            REDEWENDUNG: "Redewendung",
        },
        nothingDue: "Nothing due for review",
        nothingDueSubtitle: "Words you save while reading show up here once they're due for review.",
        goToReading: "Go to Reading",
        sessionFinished: "Review session finished",
        resultsSummary: (correct: number, total: number, rate: number) =>
            `${correct} of ${total} correct (${rate}%)`,
        backToReading: "Back to Reading",
        checkAgain: "Check again",
        cardOf: (current: number, total: number) => `Card ${current} of ${total}`,
        status: "Status: ",
        meaning: "Meaning:",
        showMeaning: "Show meaning",
    },
    dictionaryPanel: {
        searchPlaceholder: "Search a word...",
        go: "Go",
        closeAria: "Close",
        closePanelAria: "Close dictionary panel",
        loading: "Loading...",
        notFound: (lemma: string) => `No dictionary entry found for "${lemma}".`,
        flagMissing: "Flag as missing",
        reported: "Reported ✓",
        playPronunciationAria: "Play pronunciation",
        playExampleAudioAria: "Play example audio",
        savedToVocab: "✓ Saved to vocab",
        addToVocab: "+ Add to vocab",
        removedFromVocab: "Removed from vocab.",
        addedToVocab: "Added to vocab.",
        reportThanks: "Thanks — we'll look into it.",
        reportFailed: "Failed to report this word.",
    },
    grammar: {
        title: "Grammar Lessons",
        subtitle: "Learn German grammar step by step with explanations, examples and interactive practice.",
        searchPlaceholder: "Search grammar lessons...",
        level: "Level:",
        allLevels: "All levels",
        lessonsCount: (count: number) => `${count} lesson${count === 1 ? "" : "s"}`,
        lessonsUnit: "lessons",
        currentLevel: "Current level",
        practice: "Practice",
        review: "Review",
        notFound: "No grammar lessons found.",
        previous: "Previous",
        next: "Next",
        pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
        back: "← Back to Grammar Lessons",
        learned: "Learned",
        example: "Example: ",
        usageTip: "Usage tip: ",
        markLearned: "Mark as learned",
        markNotLearned: "Mark as not learned",
        markedLearned: "Marked as learned!",
        markedNotLearned: "Marked as not learned.",
        saving: "Saving...",
        watchVideo: "▶ Watch explainer video",
        exercises: "Exercises",
        checkUnderstanding: (count: number) =>
            `Check your understanding with ${count} quick question${count > 1 ? "s" : ""}.`,
        startExercises: "Start exercises",
        questionOf: (current: number, total: number) => `Question ${current} of ${total}`,
        submitAnswer: "Submit answer",
        correct: "Correct!",
        incorrect: "Not quite.",
        correctAnswer: "Correct answer: ",
        nextQuestion: "Next question",
        seeResults: "See results",
        resultsScore: (correct: number, total: number) => `${correct} / ${total} correct`,
        retry: "Retry exercises",
        typeAnswer: "Type your answer",
        true: "True",
        false: "False",
        notTranslatable: "A Persian translation is not available at this level; showing the original content.",
        noLesson: "No lesson selected.",
        notFoundLesson: "Lesson not found.",
        topicsCount: (count) => `${count} topic${count === 1 ? "" : "s"}`,
        completedOf: (learned, total) => `${learned}/${total} completed`,
        categoryTestCompleted: "Completed",
        lastScore: (score, total) => `Last score: ${score}/${total}`,
        retakeCategoryTest: "Retake category test →",
        takeCategoryTest: "Take category test →",
        otherLessons: "Other lessons",
        categoryNotFound: "Category not found.",
        topicsInBlock: (count) => `Covers ${count} topic${count === 1 ? "" : "s"} in this block.`,
        categoryTest: {
            noExercises: "No exercises available yet in this category's lessons.",
            questionsFromLessons: (count, threshold) =>
                `${count} random question${count === 1 ? "" : "s"} from this category's lessons. Needs ${threshold}% to pass.`,
            startTest: "Start category test",
            retakeTestPrompt: "Retake category test",
            lastAttempt: (score, total) => `Last attempt: ${score} / ${total} —`,
            passedLabel: "Passed",
            notPassedLabel: "Not passed",
            completedSuffix: " · Completed",
            retakeTest: "Retake test",
            markAsComplete: "Mark as complete",
            completedBadge: "✓ Completed",
            passedNeeds: (threshold) => `Passed! (needs ${threshold}%)`,
            notPassedNeeds: (threshold) => `Not passed yet — needs ${threshold}% to pass.`,
            markedComplete: "Category marked as complete!",
            failedLoadCategory: "Failed to load this category.",
            failedSaveResult: "Failed to save your test result.",
            failedMarkComplete: "Failed to mark this category complete.",
        },
    },
    home: {
        heroTitle: "Learn German the Smart Way",
        heroSubtitle:
            "DeutschBridge makes mastering German simple, fun, and effective. Start your learning journey today!",
        getStarted: "Get Started",
        featuresTitle: "Why Choose DeutschBridge?",
        learnTitle: "Learn",
        learnDescription:
            "Interactive lessons for all levels, from beginner to advanced, to master German at your pace.",
        practiceTitle: "Practice",
        practiceDescription:
            "Exercises designed to improve reading, writing, and speaking skills with real-world examples.",
        trackTitle: "Track",
        trackDescription:
            "Monitor your learning progress easily and stay motivated to reach your German goals.",
        ctaTitle: "Ready to Start Learning German?",
        exploreFeatures: "Explore Features",
    },
    progress: {
        title: "Your Progress",
        subtitle: "Track your German learning journey",
        dayStreak: (count) => `${count} day streak`,
        stats: {
            wordsMastered: "Words Mastered",
            outOfTotal: (total) => `Out of ${total} total`,
            dailyWordsLearned: "Daily Words Learned",
            lessonsCompleted: "Lessons Completed",
            activeExpressions: "Active Expressions",
            readingCompleted: "Reading Completed",
            dailyGoal: "Daily Goal",
            dailyGoalNotSet: "Not set",
            dailyGoalSubtitle: (learned, goal) => `${learned}/${goal} words today`,
        },
        vocabularyMastery: "Vocabulary mastery",
        vocabularyEmpty: "Add words to your vocabulary to start tracking mastery.",
        practiceVocabulary: "Practice vocabulary",
        expressionMastery: "Expression mastery",
        expressionsEmpty: "No expressions published yet.",
        practiceExpressions: "Practice expressions",
        segments: {
            new: "New",
            learning: "Learning",
            familiar: "Familiar",
            active: "Active",
            mastered: "Mastered",
        },
        total: (count) => `${count} total`,
        grammar: {
            title: "Grammar",
            lessonsLearned: "Lessons learned",
            categoryTestsPassed: "Category tests passed",
            attempted: (count) => `${count} attempted so far`,
            notAttempted: "No category test attempted yet",
            practice: "Practice grammar",
        },
        reading: {
            title: "Reading",
            articlesCompleted: "Articles completed",
            readArticle: "Read an article",
        },
        exam: {
            title: "Exam readiness",
            averageScore: "average score",
            acrossCompleted: (count) => `Across ${count} completed exercise${count === 1 ? "" : "s"}`,
            empty: "No exam exercises completed yet. Try one to see how ready you are.",
            practiceMore: "Practice more",
            startExamPrep: "Start exam prep",
        },
        milestones: {
            title: "Words mastered milestones",
            wordsMastered: (count) => `${count} words mastered`,
            toGoUntil: (remaining, threshold) => `${remaining} to go until ${threshold}`,
            allReached: "every milestone reached!",
        },
    },
};

const fa: Dictionary = {
    common: {
        iKnow: "بلدم",
        iDontKnow: "بلد نیستم",
    },
    nav: {
        adminDashboard: "پنل مدیریت",
        dashboard: "داشبورد",
        chatAi: "چت هوش مصنوعی",
        vocabulary: "واژگان",
        expressions: "عبارات کاربردی",
        home: "خانه",
        contact: "تماس با ما",
        about: "درباره ما",
        login: "ورود",
        signup: "ثبت‌نام",
        profile: "پروفایل",
        yourProgress: "پیشرفت شما",
        updatePassword: "تغییر رمز عبور",
        signOut: "خروج",
        logout: "خروج",
        darkMode: "حالت تاریک 🌙",
        lightMode: "حالت روشن ☀️",
        manageReading: "مدیریت مطالب خواندن",
        manageExamPrep: "مدیریت آمادگی آزمون",
        manageGrammar: "مدیریت دستور زبان",
        manageExpressions: "مدیریت عبارات",
        collapseSidebar: "جمع کردن نوار کناری",
        expandSidebar: "باز کردن نوار کناری",
    },
    profile: {
        title: "پروفایل",
        edit: "ویرایش",
        cancel: "انصراف",
        name: "نام",
        email: "ایمیل",
        learningPreferences: "تنظیمات یادگیری",
        customizeDaily: "تجربه یادگیری روزانه خود را شخصی‌سازی کنید.",
        learningLevel: "سطح یادگیری",
        dailyWordGoal: "هدف روزانه کلمات",
        words: "کلمه",
        recommendedGoal: "پیشنهادی: ۱۰ تا ۱۵ کلمه در روز",
        enableNotification: "فعال‌سازی اعلان‌ها",
        preferredLanguage: "زبان مورد نظر",
        saveProfile: "ذخیره پروفایل",
        updated: "پروفایل به‌روزرسانی شد!",
        joined: "تاریخ عضویت",
        changePhoto: "تغییر عکس",
        avatarUpdated: "عکس پروفایل به‌روزرسانی شد!",
        avatarUploadFailed: "بارگذاری عکس ناموفق بود",
        accountInfo: "اطلاعات حساب کاربری",
    },
    dashboard: {
        welcome: "به داشبورد خود خوش آمدید",
        subtitle: "مسیر تسلط بر زبان آلمانی خود را قدم به قدم ادامه دهید.",
        start: "← شروع",
        modules: {
            dailyWords: {
                title: "کلمات روزانه",
                description: "هر روز ۵ کلمه جدید در سطح C1 را همراه با مثال و مترادف بیاموزید.",
            },
            grammarLessons: {
                title: "دروس گرامر",
                description: "توضیحات ساختاریافته گرامر همراه با مثال و تمرین.",
            },
            expressions: {
                title: "عبارات کاربردی",
                description: "ترکیبات اسم-فعل و اصطلاحات را با یادآوری فعال و تولید جمله بیاموزید، نه فقط با خواندن.",
            },
            reading: {
                title: "مطالعه",
                description: "مقالاتی متناسب با سطح خود را بخوانید و کلمات جدید را در بافت جمله بیاموزید.",
            },
            examPrep: {
                title: "آمادگی آزمون",
                description: "تمرین‌های واقعی سبک آزمون Leseverstehen را بخش به بخش انجام دهید.",
            },
            wordReview: {
                title: "مرور کلمات",
                description: "کلماتی را که هنگام مطالعه ذخیره کرده‌اید، به‌مرور زمان مرور کنید.",
            },
            vocabularyTrainer: {
                title: "تمرین واژگان",
                description: "فهرست واژگان شخصی خود را اضافه، ذخیره و حفظ کنید.",
            },
            aiChat: {
                title: "مربی هوش مصنوعی",
                description: "برای تمرین آزادانه با یک مربی هوشمند آلمانی گفتگو کنید.",
            },
        },
        greeting: {
            morning: (name) => `صبح بخیر، ${name}`,
            afternoon: (name) => `ظهر بخیر، ${name}`,
            evening: (name) => `عصر بخیر، ${name}`,
            subtitle: "برای درس بعدی زبان آلمانی خود آماده‌اید؟",
            streakDays: (count) => `${count} روز پیاپی`,
        },
        continueLearning: {
            label: "ادامه یادگیری",
            cta: "← ادامه",
            startTitle: "شروع یادگیری",
            startDescription: "اولین فعالیت یادگیری امروز خود را شروع کنید.",
            startCta: "← شروع یادگیری",
            progressOf: (completed, total) => `${completed} از ${total} انجام شد`,
            dailyWordsTitle: "کلمات امروز",
            dailyWordsDescription: "یادگیری کلمات جدید امروز را به پایان برسانید.",
            vocabReviewTitle: "مرور واژگان",
            vocabReviewDescription: (count) => `${count} کلمه آماده مرور است`,
            grammarTitle: "درس گرامر",
            grammarDescription: "درس گرامر بعدی خود را ادامه دهید.",
            readingTitle: "مطالعه",
            readingDescription: "متن مطالعه بعدی خود را ادامه دهید.",
            expressionsTitle: "عبارات کاربردی",
            expressionsDescription: "عبارات کاربردی خود را تمرین کنید.",
        },
        todaysPlan: {
            title: "برنامه امروز",
            completedOf: (completed, total) => `${completed} / ${total} انجام شد`,
            dailyWords: "کلمات روزانه",
            vocabReview: "مرور کلمات",
            grammar: "گرامر",
            reading: "مطالعه",
        },
        review: {
            title: "نیاز به مرور",
            wordsReady: (count) => `${count} کلمه آماده مرور است.`,
            expressionsReady: (count) => `${count} عبارت نیاز به مرور دوباره دارد.`,
            cta: "← اکنون مرور کنید",
            allCaughtUpTitle: "همه چیز به‌روز است 🎉",
            allCaughtUpSubtitle: "در حال حاضر موردی برای مرور وجود ندارد.",
        },
        focus: {
            title: "تمرکز فعلی شما",
            vocabularyTitle: "واژگان",
            vocabularyDescription: "کمی تمرین بیشتر واژگان می‌تواند یادگیری اخیر شما را تقویت کند.",
            grammarTitle: "گرامر",
            grammarDescription: "کمی زمان بیشتر برای گرامر می‌تواند پیشرفت شما را کامل‌تر کند.",
            readingTitle: "مطالعه",
            readingDescription: "تمرین بیشتر مطالعه می‌تواند به آنچه قبلاً یاد گرفته‌اید کمک کند.",
            expressionsTitle: "عبارات کاربردی",
            expressionsDescription: "تمرین بیشتر عبارات کاربردی می‌تواند به ماندگاری آن‌ها کمک کند.",
            neutralDescription: "به ساختن واژگان آلمانی خود ادامه دهید.",
            cta: "← اکنون تمرین کنید",
        },
        week: {
            title: "این هفته",
            learningDaysOf: (days, total) => `${days} / ${total} روز یادگیری`,
            viewProgress: "← مشاهده پیشرفت کامل",
            emptyTitle: "هفته شما از اینجا شروع می‌شود.",
            emptySubtitle: "اولین فعالیت یادگیری امروز خود را انجام دهید.",
        },
        milestone: {
            title: "نقطه عطف",
            reached: (count) => `شما ${count} کلمه آلمانی یاد گرفته‌اید.`,
            next: (count) => `نقطه عطف بعدی: ${count} کلمه.`,
        },
        error: {
            message: "بارگذاری داشبورد شما ممکن نشد.",
            retry: "تلاش مجدد",
        },
        newContent: {
            summary: (total) => `${total} مورد جدید از آخرین بازدید شما`,
            grammarLessons: (count) => `${count} درس گرامر`,
            readingArticles: (count) => `${count} متن مطالعه`,
            expressions: (count) => `${count} عبارت`,
        },
    },
    reading: {
        title: "مطالعه",
        subtitle: "مقالاتی متناسب با سطح خود را بخوانید و برای یادگیری واژگان جدید در بافت جمله، روی کلمات هایلایت‌شده ضربه بزنید.",
        level: "سطح:",
        allLevels: "همه سطوح",
        textsUnit: "متن",
        searchPlaceholder: "جستجوی متن‌های مطالعه...",
        currentLevel: "سطح فعلی",
        quiz: "آزمون",
        review: "مرور",
        learned: "آموخته شده",
        newForYou: (count: number) => `${count} کلمه جدید برای شما`,
        views: (count: number) => `👁 ${count} بازدید`,
        posted: (date: string) => `تاریخ انتشار ${date}`,
        notFound: "مقاله‌ای یافت نشد.",
        previous: "قبلی",
        next: "بعدی",
        pageOf: (page: number, total: number) => `صفحه ${page} از ${total}`,
    },
    dailyWords: {
        title: "واژه‌های روزانه",
        subtitle: (total: number) => `${total} واژه امروز شما`,
        loadError: "واژه‌های امروز بارگذاری نشد.",
        loadErrorSubtitle: "لطفاً دوباره تلاش کنید.",
        retry: "تلاش مجدد",
        emptyTitle: "واژه جدیدی برای امروز نیست.",
        emptySubtitle: "فردا برای ۵ واژه بعدی خود سر بزنید.",
        savedToast: (word: string) => `«${word}» به واژگان شما افزوده شد!`,
        saveFailedToast: "ذخیره واژه در واژگان شما ممکن نشد.",
        progressFailedToast: "به‌روزرسانی پیشرفت ممکن نشد.",
        header: {
            learnedOf: (learned: number, total: number) => `${learned} / ${total} آموخته شده`,
            remaining: (count: number) => `${count} واژه باقی مانده`,
            progressAria: (learned: number, total: number) => `${learned} از ${total} واژه روزانه آموخته شده`,
        },
        card: {
            wordOf: (index: number, total: number) => `واژه ${index} از ${total}`,
            playAria: (word: string) => `پخش تلفظ ${word}`,
            saving: "در حال ذخیره...",
            saved: "✓ در واژگان ذخیره شد",
            save: "+ ذخیره در واژگان",
            learned: "آموخته شده",
            markLearned: "✓ این را می‌دانم",
            previous: "قبلی",
            next: "بعدی",
            previousAria: "واژه قبلی",
            nextAria: "واژه بعدی",
        },
        overview: {
            title: (count: number) => `${count} واژه امروز`,
        },
        practice: {
            title: "تمرین سریع",
            questionOf: (index: number, total: number) => `${index} / ${total}`,
            prompt: (meaning: string) => `کدام واژه به معنی «${meaning}» است؟`,
            correct: "✓ درست",
            incorrect: (word: string) => `✗ جواب درست «${word}» بود`,
            finish: "پایان",
            next: "بعدی",
            answerOptionsAria: "گزینه‌های پاسخ",
        },
        completion: {
            title: "واژه‌های روزانه کامل شد!",
            subtitle: (total: number) => `شما امروز ${total} واژه یاد گرفتید.`,
            review: "مرور واژه‌های امروز",
        },
    },
    readingArticle: {
        back: "→ بازگشت به مطالعه",
        noArticleSelected: "مقاله‌ای انتخاب نشده است.",
        articleNotFound: "مقاله یافت نشد.",
        views: (count: number) => `👁 ${count} بازدید`,
        posted: (date: string) => `تاریخ انتشار ${date}`,
        learned: "آموخته شده",
        markLearned: "علامت‌گذاری به‌عنوان آموخته‌شده",
        markNotLearned: "علامت‌گذاری به‌عنوان نیاموخته",
        markedLearned: "به‌عنوان آموخته‌شده علامت‌گذاری شد!",
        markedNotLearned: "به‌عنوان نیاموخته علامت‌گذاری شد.",
        saving: "در حال ذخیره...",
        plural: "جمع: ",
        literal: "معنی تحت‌اللفظی: ",
        meaning: "معنی: ",
        saved: "ذخیره شد ✓",
        save: "ذخیره",
        savedToReview: (lemma: string) => `«${lemma}» به فهرست مرور شما اضافه شد.`,
        keyVocabulary: "واژگان کلیدی",
        keyVocabularySubtitle: "کلمات کلیدی این مقاله.",
        quiz: {
            title: "آزمون",
            ready: "آماده‌اید درک خود را بسنجید؟ آزمون این مقاله را شروع کنید.",
            loadingQuiz: "در حال بارگذاری آزمون...",
            start: "شروع آزمون",
            noQuiz: "این مقاله هنوز آزمونی ندارد.",
            questionOf: (current: number, total: number) => `سوال ${current} از ${total}`,
            correct: "درست است!",
            incorrect: "درست نیست.",
            correctAnswer: "پاسخ درست: ",
            addedToReview: (lemma: string) => `«${lemma}» به فهرست مرور شما اضافه شد.`,
            seeResults: "مشاهده نتیجه",
            nextQuestion: "سوال بعدی",
            checking: "در حال بررسی...",
            submitAnswer: "ثبت پاسخ",
            comprehension: "درک مطلب",
            vocabInContext: "واژگان در بافت جمله",
            goToArticle: "رفتن به مقاله",
        },
    },
    vocabulary: {
        title: "واژگان من",
        subtitle: "دایره واژگان خود را بسازید، تسلط را پیگیری کنید و یادآوری و کاربرد را با هم تمرین کنید.",
        practiceCta: "ادامه تمرین",
        addNew: "افزودن واژه",
        searchPlaceholder: "جستجو بر اساس واژه، معنی یا مثال...",
        sourceTabs: { myWords: "واژه‌های من", fromReading: "از بخش مطالعه", fromAiTutor: "از مربی هوش مصنوعی" },
        filters: { level: "سطح", all: "همه", mastery: "پیشرفت", bookmarked: "نشان‌شده", bookmarkedOnly: "نشان‌شده" },
        mastery: { NEW: "جدید", LEARNING: "در حال یادگیری", FAMILIAR: "آشنا", MASTERED: "مسلط" },
        continueLearning: {
            title: "ادامه یادگیری",
            subtitleReady: (count: number) => `شما ${count} واژه آماده تمرین دارید.`,
            subtitleCaughtUp: "همه چیز به‌روز است!",
            seeAll: "مشاهده همه",
        },
        allWords: { title: "همه واژگان", count: (n: number) => `${n} واژه` },
        empty: { title: "واژه‌ای یافت نشد", subtitle: "جستجو یا فیلترهای خود را تغییر دهید." },
        card: {
            recall: "شناخت",
            context: "کاربرد",
            practice: "تمرین",
            bookmarkAdd: "نشان کردن این واژه",
            bookmarkRemove: "حذف نشان",
            editAria: "ویرایش",
            deleteAria: "حذف",
            playAudioAria: "پخش تلفظ",
        },
        confirmDeleteTitle: "این واژه حذف شود؟",
        confirmDelete: "آیا مطمئن هستید که می‌خواهید این کلمه را حذف کنید؟",
        deleteAction: "حذف",
        cancelAction: "لغو",
        deleted: "واژه حذف شد!",
        deleteFailed: "حذف واژه ناموفق بود.",
        previous: "قبلی",
        next: "بعدی",
        pageOf: (page: number, total: number) => `صفحه ${page} از ${total}`,
        modal: {
            addTitle: "افزودن واژه جدید",
            editTitle: "ویرایش واژه",
            word: "کلمه",
            article: "حرف تعریف",
            articleNone: "هیچ‌کدام",
            meaning: "معنی",
            example: "مثال",
            generateExample: "تولید با هوش مصنوعی",
            generatingExample: "در حال تولید...",
            generateExampleFailed: "تولید مثال ناموفق بود.",
            cancel: "انصراف",
            save: "ذخیره",
            saving: "در حال ذخیره...",
            added: "واژه اضافه شد!",
            addFailed: "افزودن واژه ناموفق بود.",
            updated: "واژه ویرایش شد!",
            updateFailed: "ویرایش واژه ناموفق بود.",
        },
        detail: {
            back: "بازگشت به واژگان",
            notFound: "واژه یافت نشد",
            overallLabel: "پیشرفت کلی",
            meaning: "معنی",
            example: "مثال",
            synonyms: "مترادف‌ها",
            practiceThis: "تمرین این واژه",
        },
        practice: {
            noWords: "در حال حاضر واژه‌ای برای تمرین نیست",
            noWordsSubtitle: "واژه جدیدی به فهرست خود اضافه کنید یا بعداً که واژه بیشتری برای مرور دارید برگردید.",
            goToVocabulary: "رفتن به واژگان من",
            stepOf: (current: number, total: number) => `مرحله ${current} از ${total}`,
            itemOf: (current: number, total: number) => `${current} / ${total}`,
            flipPrompt: "برای نمایش معنی روی کارت ضربه بزنید",
            knewIt: "می‌دانستم",
            didntKnowIt: "نمی‌دانستم",
            contextPromptCloze: "کلمه جا افتاده را پر کنید",
            contextPromptMeaning: "کدام معنی درست است؟",
            next: "بعدی",
            sessionComplete: "جلسه به پایان رسید",
            wordsPracticed: "واژه‌های تمرین‌شده",
            recallAccuracy: "دقت شناخت",
            contextAccuracy: "دقت کاربرد",
            practiceAgain: "تمرین دوباره",
            backToVocabulary: "بازگشت به واژگان",
        },
    },
    chat: {
        newChat: "گفتگوی جدید",
        newChatToast: "گفتگوی جدید آغاز شد!",
        chatHistory: "گفتگوها",
        rename: "تغییر نام",
        delete: "حذف",
        confirmDelete: "آیا مطمئن هستید که می‌خواهید تمام گفتگوهای این جلسه را حذف کنید؟",
        deleted: "جلسه حذف شد!",
        yourAiTutor: "مربی هوش مصنوعی",
        subtitle: "مکالمه آلمانی را با یک مربی هوش مصنوعی تمرین کنید.",
        setTitlePlaceholder: "تعیین عنوان...",
        save: "ذخیره",
        cancel: "لغو",
        typePlaceholder: "چیزی به آلمانی بنویسید...",
        send: "ارسال",
        thinking: "هوش مصنوعی در حال فکر کردن است…",
        groups: { today: "امروز", yesterday: "دیروز", earlier: "پیش‌تر" },
        emptyState: {
            greeting: "سلام! 👋",
            intro: "من مربی آلمانی تو هستم. آلمانی تمرین کن، سؤال بپرس یا فقط با من بنویس.",
            starters: {
                speaking: {
                    title: "صحبت کردن",
                    description: "یک گفتگو به آلمانی داشته باش.",
                    prompt: "بیا درباره روز روزمره‌ام به آلمانی صحبت کنیم. درباره‌اش از من سؤال بپرس.",
                },
                writing: {
                    title: "نوشتن",
                    description: "متن‌های آلمانی خودت را بهتر کن.",
                    prompt: "می‌خواهم مهارت نوشتاری آلمانی‌ام را تمرین کنم. یک موضوع برای نوشتن به من بده.",
                },
                grammar: {
                    title: "گرامر",
                    description: "گرامر را با من تمرین کن.",
                    prompt: "می‌توانی به من در تمرین گرامر آلمانی کمک کنی؟ چیزی را توضیح بده و من را امتحان کن.",
                },
                question: {
                    title: "سؤال بپرس",
                    description: "هر چیزی درباره یادگیری آلمانی از من بپرس.",
                    prompt: "یک سؤال درباره یادگیری آلمانی دارم.",
                },
            },
            orWriteFirst: "یا فقط اولین پیامت را بنویس ...",
        },
        selection: {
            saveWord: "ذخیره واژه",
            saveExpression: "ذخیره عبارت",
            alreadySaved: "قبلاً در واژگان ذخیره شده",
            saving: "در حال ذخیره...",
            savedToVocabulary: "در واژگان ذخیره شد",
            saveFailed: "ذخیره این مورد ممکن نشد. دوباره تلاش کنید.",
        },
    },
    readingReview: {
        typeLabels: {
            WORD: "کلمه",
            NOMEN_VERB_VERBINDUNG: "ترکیب اسم-فعل",
            REDEWENDUNG: "اصطلاح",
        },
        nothingDue: "چیزی برای مرور نیست",
        nothingDueSubtitle: "کلماتی که هنگام مطالعه ذخیره می‌کنید، پس از رسیدن زمان مرورشان، اینجا نمایش داده می‌شوند.",
        goToReading: "رفتن به مطالعه",
        sessionFinished: "جلسه مرور به پایان رسید",
        resultsSummary: (correct: number, total: number, rate: number) =>
            `${correct} از ${total} درست (${rate}%)`,
        backToReading: "بازگشت به مطالعه",
        checkAgain: "بررسی دوباره",
        cardOf: (current: number, total: number) => `کارت ${current} از ${total}`,
        status: "وضعیت: ",
        meaning: "معنی:",
        showMeaning: "نمایش معنی",
    },
    dictionaryPanel: {
        searchPlaceholder: "جستجوی یک کلمه...",
        go: "برو",
        closeAria: "بستن",
        closePanelAria: "بستن پنل دیکشنری",
        loading: "در حال بارگذاری...",
        notFound: (lemma: string) => `مدخلی برای «${lemma}» در دیکشنری یافت نشد.`,
        flagMissing: "گزارش به‌عنوان مفقود",
        reported: "گزارش شد ✓",
        playPronunciationAria: "پخش تلفظ",
        playExampleAudioAria: "پخش صدای مثال",
        savedToVocab: "✓ به واژگان اضافه شد",
        addToVocab: "+ افزودن به واژگان",
        removedFromVocab: "از واژگان حذف شد.",
        addedToVocab: "به واژگان اضافه شد.",
        reportThanks: "ممنون — بررسی می‌کنیم.",
        reportFailed: "گزارش این کلمه ناموفق بود.",
    },
    grammar: {
        title: "دروس گرامر",
        subtitle: "گرامر آلمانی را قدم به قدم همراه با توضیحات، مثال و تمرین تعاملی بیاموزید.",
        searchPlaceholder: "جستجوی دروس گرامر...",
        level: "سطح:",
        allLevels: "همه سطوح",
        lessonsCount: (count: number) => `${count} درس`,
        lessonsUnit: "درس",
        currentLevel: "سطح فعلی",
        practice: "تمرین",
        review: "مرور",
        notFound: "درس گرامری یافت نشد.",
        previous: "قبلی",
        next: "بعدی",
        pageOf: (page: number, total: number) => `صفحه ${page} از ${total}`,
        back: "→ بازگشت به دروس گرامر",
        learned: "آموخته شده",
        example: "مثال: ",
        usageTip: "نکته کاربردی: ",
        markLearned: "علامت‌گذاری به‌عنوان آموخته‌شده",
        markNotLearned: "علامت‌گذاری به‌عنوان نیاموخته",
        markedLearned: "به‌عنوان آموخته‌شده علامت‌گذاری شد!",
        markedNotLearned: "به‌عنوان نیاموخته علامت‌گذاری شد.",
        saving: "در حال ذخیره...",
        watchVideo: "▶ مشاهده ویدیوی آموزشی",
        exercises: "تمرین‌ها",
        checkUnderstanding: (count: number) => `درک خود را با ${count} سوال کوتاه بررسی کنید.`,
        startExercises: "شروع تمرین‌ها",
        questionOf: (current: number, total: number) => `سوال ${current} از ${total}`,
        submitAnswer: "ثبت پاسخ",
        correct: "درست است!",
        incorrect: "درست نیست.",
        correctAnswer: "پاسخ درست: ",
        nextQuestion: "سوال بعدی",
        seeResults: "مشاهده نتیجه",
        resultsScore: (correct: number, total: number) => `${correct} از ${total} درست`,
        retry: "تکرار تمرین‌ها",
        typeAnswer: "پاسخ خود را بنویسید",
        true: "درست",
        false: "نادرست",
        notTranslatable: "ترجمه فارسی برای این سطح موجود نیست؛ محتوا به زبان اصلی نمایش داده می‌شود.",
        noLesson: "درسی انتخاب نشده است.",
        notFoundLesson: "درس یافت نشد.",
        topicsCount: (count) => `${count} موضوع`,
        completedOf: (learned, total) => `${learned}/${total} تکمیل‌شده`,
        categoryTestCompleted: "تکمیل‌شده",
        lastScore: (score, total) => `آخرین نمره: ${score}/${total}`,
        retakeCategoryTest: "← تکرار آزمون دسته",
        takeCategoryTest: "← شرکت در آزمون دسته",
        otherLessons: "سایر درس‌ها",
        categoryNotFound: "این دسته یافت نشد.",
        topicsInBlock: (count) => `این بخش شامل ${count} موضوع است.`,
        categoryTest: {
            noExercises: "هنوز تمرینی در درس‌های این دسته موجود نیست.",
            questionsFromLessons: (count, threshold) =>
                `${count} سوال تصادفی از درس‌های این دسته. برای قبولی به ${threshold}% نیاز دارید.`,
            startTest: "شروع آزمون دسته",
            retakeTestPrompt: "تکرار آزمون دسته",
            lastAttempt: (score, total) => `آخرین تلاش: ${score} از ${total} —`,
            passedLabel: "قبول شدید",
            notPassedLabel: "قبول نشدید",
            completedSuffix: " · تکمیل‌شده",
            retakeTest: "تکرار آزمون",
            markAsComplete: "علامت‌گذاری به‌عنوان تکمیل‌شده",
            completedBadge: "✓ تکمیل‌شده",
            passedNeeds: (threshold) => `قبول شدید! (نیاز به ${threshold}%)`,
            notPassedNeeds: (threshold) => `هنوز قبول نشده‌اید — برای قبولی به ${threshold}% نیاز دارید.`,
            markedComplete: "این دسته به‌عنوان تکمیل‌شده علامت‌گذاری شد!",
            failedLoadCategory: "بارگذاری این دسته با خطا مواجه شد.",
            failedSaveResult: "ذخیره نتیجه آزمون با خطا مواجه شد.",
            failedMarkComplete: "علامت‌گذاری این دسته به‌عنوان تکمیل‌شده با خطا مواجه شد.",
        },
    },
    home: {
        heroTitle: "زبان آلمانی را هوشمندانه یاد بگیرید",
        heroSubtitle:
            "دویچ‌بریج یادگیری زبان آلمانی را ساده، سرگرم‌کننده و مؤثر می‌کند. همین امروز سفر یادگیری خود را آغاز کنید!",
        getStarted: "شروع کنید",
        featuresTitle: "چرا دویچ‌بریج را انتخاب کنیم؟",
        learnTitle: "یادگیری",
        learnDescription:
            "دروس تعاملی برای همه سطوح، از مبتدی تا پیشرفته، برای تسلط بر زبان آلمانی با سرعت خودتان.",
        practiceTitle: "تمرین",
        practiceDescription:
            "تمرین‌هایی طراحی‌شده برای بهبود مهارت‌های خواندن، نوشتن و صحبت‌کردن با مثال‌های واقعی.",
        trackTitle: "پیگیری",
        trackDescription:
            "پیشرفت یادگیری خود را به‌راحتی دنبال کنید و برای رسیدن به اهداف زبان آلمانی خود انگیزه داشته باشید.",
        ctaTitle: "آماده‌اید یادگیری زبان آلمانی را شروع کنید؟",
        exploreFeatures: "مشاهده امکانات",
    },
    progress: {
        title: "پیشرفت شما",
        subtitle: "سفر یادگیری زبان آلمانی خود را دنبال کنید",
        dayStreak: (count) => `${count} روز متوالی`,
        stats: {
            wordsMastered: "واژه‌های تسلط‌یافته",
            outOfTotal: (total) => `از مجموع ${total}`,
            dailyWordsLearned: "واژه‌های روزانه آموخته‌شده",
            lessonsCompleted: "درس‌های تکمیل‌شده",
            activeExpressions: "عبارات فعال",
            readingCompleted: "مطالعه تکمیل‌شده",
            dailyGoal: "هدف روزانه",
            dailyGoalNotSet: "تنظیم نشده",
            dailyGoalSubtitle: (learned, goal) => `${learned}/${goal} واژه امروز`,
        },
        vocabularyMastery: "تسلط بر واژگان",
        vocabularyEmpty: "برای پیگیری میزان تسلط، واژه‌ای به واژگان خود اضافه کنید.",
        practiceVocabulary: "تمرین واژگان",
        expressionMastery: "تسلط بر عبارات",
        expressionsEmpty: "هنوز عبارتی منتشر نشده است.",
        practiceExpressions: "تمرین عبارات",
        segments: {
            new: "جدید",
            learning: "در حال یادگیری",
            familiar: "آشنا",
            active: "فعال",
            mastered: "مسلط",
        },
        total: (count) => `مجموع ${count}`,
        grammar: {
            title: "گرامر",
            lessonsLearned: "درس‌های آموخته‌شده",
            categoryTestsPassed: "آزمون‌های دسته قبول‌شده",
            attempted: (count) => `تاکنون ${count} بار تلاش شده`,
            notAttempted: "هنوز آزمون دسته‌ای انجام نشده است",
            practice: "تمرین گرامر",
        },
        reading: {
            title: "مطالعه",
            articlesCompleted: "مقالات تکمیل‌شده",
            readArticle: "خواندن یک مقاله",
        },
        exam: {
            title: "آمادگی آزمون",
            averageScore: "میانگین نمره",
            acrossCompleted: (count) => `در ${count} تمرین تکمیل‌شده`,
            empty: "هنوز هیچ تمرین آزمونی انجام نشده است. یکی را امتحان کنید تا میزان آمادگی خود را ببینید.",
            practiceMore: "تمرین بیشتر",
            startExamPrep: "شروع آمادگی آزمون",
        },
        milestones: {
            title: "نقاط عطف واژه‌های تسلط‌یافته",
            wordsMastered: (count) => `${count} واژه تسلط‌یافته`,
            toGoUntil: (remaining, threshold) => `${remaining} واژه تا رسیدن به ${threshold}`,
            allReached: "به همه نقاط عطف رسیدید!",
        },
    },
};

export const dictionaries: Record<AppLanguage, Dictionary> = { en, fa };
