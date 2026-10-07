import type { Focus, Level, Reason } from '@/features/onboarding/plan';

/**
 * Copy for everything before the app proper: welcome pitch, login, sign-up, password reset and the
 * learning-plan setup. English is the default; the setup switches to Persian once the learner picks it.
 */
type Choice = { label: string; description: string };

export const entryEn = {
  common: { back: 'Back', next: 'Next', brand: 'Deutsch Bridge' },
  welcome: {
    slides: [
      {
        title: 'Learn German – step by step!',
        subtitle: 'Grammar, vocabulary and reading – interactive and right in your hand.',
      },
      {
        title: 'Your personal AI tutor',
        subtitle: 'Practise conversations, ask questions and get clear feedback instantly.',
      },
      {
        title: 'Ready for the exam',
        subtitle: 'Train real exam tasks and track your progress every day.',
      },
    ],
    register: 'Sign up',
    registerHint: 'Create a new account',
    login: 'Log in',
    loginHint: 'Log in with an existing account',
    page: (n: number, total: number) => `Page ${n} of ${total}`,
  },
  auth: {
    email: 'Email',
    password: 'Password',
    login: 'Log in',
    forgot: 'Forgot password?',
    noAccount: 'No account yet?',
    signUp: 'Sign up',
    googleLogin: 'Continue with Google',
    googleSignUp: 'Sign up with Google',
    forgotTitle: 'Forgot your password?',
    forgotSubtitle: "We'll email you a link to reset it.",
    sentTitle: 'Email sent ✉️',
    sentBody: 'Check your inbox and follow the link to set a new password.',
    sendLink: 'Send link',
    backToLogin: 'Back to login',
    errors: {
      emailRequired: 'Please enter your email address.',
      emailInvalid: 'Please enter a valid email address.',
      nameMin: 'The name must be at least 3 characters long.',
      nameMax: 'The name can be at most 30 characters long.',
      passwordRequired: 'Please enter your password.',
      passwordMin: 'The password must be at least 6 characters long.',
    },
    serverErrors: {
      network: 'No connection. Please check your internet and try again.',
      server: 'The server is having trouble right now. Please try again in a moment.',
      mailUnavailable:
        "We couldn't send the verification email right now. Please try again in a moment.",
    },
    strength: {
      levels: ['Too short', 'Weak', 'Medium', 'Strong', 'Very strong'],
      hint: (level: string) => `Password strength: ${level}`,
    },
    google: {
      unavailable: 'Google sign-in is not available in this version of the app.',
      notConfigured: 'Google sign-in has not been set up yet.',
      noToken: 'Google did not return a sign-in token.',
      noPlayServices: 'Google Play Services are not available.',
      failed: 'Google sign-in failed. Please try again.',
    },
  },
  register: {
    introTitle: 'Create your profile',
    introBold: 'now!',
    introSub: 'With a profile you save your progress and keep learning for free.',
    haveAccount: 'Already have an account?',
    logIn: 'Log in',
    name: { title: "What's your name?", label: 'Name' },
    email: { title: "What's your email?", label: 'Email' },
    password: { title: 'Choose your password', label: 'Password' },
    start: 'Get started',
  },
  onboarding: {
    signOut: 'Log out',
    signOutTitle: 'Log out?',
    signOutMessage: 'Do you really want to log out?',
    done: 'Done',
    setup: 'Setup',
    step: (n: number, total: number) => `Step ${n} of ${total}`,
    banner: "Account created – let's personalise your German learning.",
    steps: {
      language: {
        title: 'In which language should we explain German?',
        subtitle: 'Choose the language you prefer for explanations and translations.',
      },
      reason: {
        title: 'Why are you learning German?',
        subtitle: 'Your goal helps us personalise your learning.',
      },
      currentLevel: {
        title: 'How good is your German right now?',
        subtitle: 'Pick the level that best describes your German today.',
      },
      targetLevel: {
        title: 'Which level do you want to reach?',
        subtitle: "We'll shape your learning path around this goal.",
      },
      dailyWords: {
        title: 'How many new words do you want to learn per day?',
        subtitle: 'Choose a pace that is realistic for you.',
      },
      focus: {
        title: 'What do you want to improve?',
        subtitle: (max: number) => `Choose up to ${max} areas.`,
      },
      exam: {
        title: 'Which exam are you preparing for?',
        subtitle: "That way we can match the exercises to your exam's format.",
      },
    },
    languageNote:
      'German stays your learning language – this only changes the language of grammar tips, word meanings and instructions.',
    languages: {
      EN: { label: 'English', description: 'German explanations with English support' },
      PR: { label: 'فارسی', description: 'German explanations and translations in Persian' },
    } as Record<'EN' | 'PR', Choice>,
    notSure: {
      label: 'Not sure',
      description: "We'll suggest a starting point and adjust it as you learn.",
    },
    notSureLink: 'Not sure which level you are?',
    targetNote: (level: string) =>
      `Your target level should be higher than your current level (${level}).`,
    wordsPerDay: 'words/day',
    wordsPerDayLabel: (n: number, pace: string) => `${n} words per day, ${pace}`,
    examLevelQ: 'Which level are you preparing for?',
    examDateQ: 'Do you already have an exam date?',
    notYet: 'Not yet',
    yes: 'Yes',
    examDate: 'Exam date',
    examDatePlaceholder: 'DD.MM.YYYY',
    dateFormat: 'Please enter the date as DD.MM.YYYY.',
    datePast: 'The exam date must be in the future.',
    exams: { OTHER: 'Other' },
    pace: { 5: 'Relaxed', 10: 'Balanced', 15: 'Focused', 20: 'Intensive' } as Record<
      number,
      string
    >,
    words: (n: number) => `${n} words`,
    reasons: {
      WORK: { label: 'Work & career', description: 'Improve my German at work' },
      EVERYDAY_LIFE: {
        label: 'Everyday life',
        description: 'Communicate more confidently day to day',
      },
      STUDY: { label: 'Studies', description: 'Prepare to study in German' },
      COMMUNICATION: { label: 'Communication', description: 'Speak and understand better' },
      EXAM: { label: 'Exam preparation', description: 'Study for a German exam' },
      LIVING_IN_GERMANY: {
        label: 'Living in Germany',
        description: 'Feel more at home in Germany',
      },
      PERSONAL_INTEREST: {
        label: 'Personal interest',
        description: 'I simply enjoy learning German',
      },
    } as Record<Reason, Choice>,
    levels: {
      A1: { label: 'A1 · Beginner', description: 'I know simple words and sentences.' },
      A2: { label: 'A2 · Elementary', description: 'I can manage familiar everyday situations.' },
      B1: { label: 'B1 · Intermediate', description: 'I can hold many everyday conversations.' },
      B2: { label: 'B2 · Upper intermediate', description: 'I can talk about complex topics.' },
      C1: { label: 'C1 · Advanced', description: 'I express myself fluently.' },
      C2: {
        label: 'C2 · Proficient',
        description: 'I understand almost everything and express myself precisely.',
      },
    } as Record<Level, Choice>,
    focus: {
      VOCABULARY: { label: 'Vocabulary', description: 'Learn and remember more words' },
      GRAMMAR: { label: 'Grammar', description: 'Get more confident with sentence structure' },
      SPEAKING: { label: 'Speaking', description: 'Express myself with more confidence' },
      LISTENING: { label: 'Listening', description: 'Understand spoken German better' },
      READING: { label: 'Reading', description: 'Understand texts more easily' },
      WRITING: { label: 'Writing', description: 'Write more clearly and correctly' },
      EXPRESSIONS: { label: 'Expressions', description: 'Learn natural expressions' },
      EXAM: { label: 'Exam skills', description: 'Practise exam tasks' },
    } as Record<Focus, Choice>,
    complete: {
      title: 'Your learning plan is ready!',
      working: (level: string) => `You are working towards ${level}.`,
      focusHint: "Here's what we'll focus on:",
      goal: 'Your daily word goal',
      start: 'Start learning',
    },
  },
};

export type EntryDictionary = typeof entryEn;

export const entryFa: EntryDictionary = {
  common: { back: 'بازگشت', next: 'بعدی', brand: 'Deutsch Bridge' },
  welcome: {
    slides: [
      {
        title: 'آلمانی را قدم‌به‌قدم یاد بگیرید!',
        subtitle: 'گرامر، واژگان و خواندن – تعاملی و همیشه در دسترس شما.',
      },
      {
        title: 'معلم هوش مصنوعی شخصی شما',
        subtitle: 'مکالمه تمرین کنید، سؤال بپرسید و فوراً بازخورد روشن بگیرید.',
      },
      {
        title: 'آماده برای آزمون',
        subtitle: 'تمرین‌های واقعی آزمون را حل کنید و هر روز پیشرفتتان را دنبال کنید.',
      },
    ],
    register: 'ثبت‌نام',
    registerHint: 'ساخت حساب کاربری جدید',
    login: 'ورود',
    loginHint: 'ورود با حساب کاربری موجود',
    page: (n, total) => `صفحه ${n} از ${total}`,
  },
  auth: {
    email: 'ایمیل',
    password: 'گذرواژه',
    login: 'ورود',
    forgot: 'گذرواژه را فراموش کرده‌اید؟',
    noAccount: 'هنوز حساب ندارید؟',
    signUp: 'ثبت‌نام',
    googleLogin: 'ادامه با گوگل',
    googleSignUp: 'ثبت‌نام با گوگل',
    forgotTitle: 'گذرواژه را فراموش کرده‌اید؟',
    forgotSubtitle: 'پیوند بازنشانی را برایتان ایمیل می‌کنیم.',
    sentTitle: 'ایمیل ارسال شد ✉️',
    sentBody: 'صندوق ورودی خود را بررسی کنید و با پیوند ایمیل، گذرواژه‌ای جدید بسازید.',
    sendLink: 'ارسال پیوند',
    backToLogin: 'بازگشت به ورود',
    errors: {
      emailRequired: 'لطفاً ایمیل خود را وارد کنید.',
      emailInvalid: 'لطفاً یک ایمیل معتبر وارد کنید.',
      nameMin: 'نام باید حداقل ۳ نویسه باشد.',
      nameMax: 'نام می‌تواند حداکثر ۳۰ نویسه باشد.',
      passwordRequired: 'لطفاً گذرواژه خود را وارد کنید.',
      passwordMin: 'گذرواژه باید حداقل ۶ نویسه باشد.',
    },
    serverErrors: {
      network: 'اتصال برقرار نیست. اینترنت خود را بررسی کنید و دوباره تلاش کنید.',
      server: 'سرور در حال حاضر مشکل دارد. لطفاً کمی بعد دوباره تلاش کنید.',
      mailUnavailable: 'ارسال ایمیل تأیید در حال حاضر ممکن نشد. لطفاً کمی بعد دوباره تلاش کنید.',
    },
    strength: {
      levels: ['خیلی کوتاه', 'ضعیف', 'متوسط', 'قوی', 'خیلی قوی'],
      hint: (level) => `قدرت گذرواژه: ${level}`,
    },
    google: {
      unavailable: 'ورود با گوگل در این نسخه از برنامه در دسترس نیست.',
      notConfigured: 'ورود با گوگل هنوز راه‌اندازی نشده است.',
      noToken: 'گوگل نشانه ورود را برنگرداند.',
      noPlayServices: 'خدمات Google Play در دسترس نیست.',
      failed: 'ورود با گوگل ناموفق بود. لطفاً دوباره تلاش کنید.',
    },
  },
  register: {
    introTitle: 'پروفایل خود را',
    introBold: 'همین حالا بسازید!',
    introSub: 'با داشتن پروفایل، پیشرفت خود را ذخیره می‌کنید و رایگان به یادگیری ادامه می‌دهید.',
    haveAccount: 'قبلاً حساب ساخته‌اید؟',
    logIn: 'ورود',
    name: { title: 'نام شما چیست؟', label: 'نام' },
    email: { title: 'ایمیل شما چیست؟', label: 'ایمیل' },
    password: { title: 'گذرواژه خود را انتخاب کنید', label: 'گذرواژه' },
    start: 'شروع',
  },
  onboarding: {
    signOut: 'خروج',
    signOutTitle: 'خروج از حساب؟',
    signOutMessage: 'آیا واقعاً می‌خواهید از حساب خود خارج شوید؟',
    done: 'پایان',
    setup: 'راه‌اندازی',
    step: (n, total) => `مرحله ${n} از ${total}`,
    banner: 'حساب ساخته شد – بیایید یادگیری آلمانی را برای شما شخصی‌سازی کنیم.',
    steps: {
      language: {
        title: 'آلمانی را به چه زبانی برایتان توضیح دهیم؟',
        subtitle: 'زبانی را انتخاب کنید که ترجیح می‌دهید توضیحات و ترجمه‌ها به آن باشند.',
      },
      reason: {
        title: 'چرا آلمانی یاد می‌گیرید؟',
        subtitle: 'هدف شما به ما کمک می‌کند یادگیری را برایتان شخصی‌سازی کنیم.',
      },
      currentLevel: {
        title: 'سطح فعلی آلمانی شما چقدر است؟',
        subtitle: 'سطحی را انتخاب کنید که آلمانی امروز شما را بهتر توصیف می‌کند.',
      },
      targetLevel: {
        title: 'می‌خواهید به کدام سطح برسید؟',
        subtitle: 'مسیر یادگیری شما را بر اساس این هدف می‌سازیم.',
      },
      dailyWords: {
        title: 'روزانه چند واژه جدید می‌خواهید یاد بگیرید؟',
        subtitle: 'سرعتی را انتخاب کنید که برایتان واقع‌بینانه است.',
      },
      focus: {
        title: 'می‌خواهید چه چیزی را بهتر کنید؟',
        subtitle: (max) => `تا ${max} بخش انتخاب کنید.`,
      },
      exam: {
        title: 'برای کدام آزمون آماده می‌شوید؟',
        subtitle: 'به این ترتیب تمرین‌ها را با قالب آزمون شما هماهنگ می‌کنیم.',
      },
    },
    languageNote:
      'آلمانی زبان یادگیری شما می‌ماند – این فقط زبان نکته‌های گرامر، معنی واژه‌ها و راهنماها را تغییر می‌دهد.',
    languages: {
      EN: { label: 'English', description: 'توضیحات آلمانی با پشتیبانی انگلیسی' },
      PR: { label: 'فارسی', description: 'توضیحات و ترجمه‌های آلمانی به فارسی' },
    },
    notSure: {
      label: 'مطمئن نیستم',
      description: 'یک نقطه شروع پیشنهاد می‌دهیم و همراه با یادگیری شما آن را تنظیم می‌کنیم.',
    },
    notSureLink: 'مطمئن نیستید سطح شما چیست؟',
    targetNote: (level) => `سطح هدف باید بالاتر از سطح فعلی شما (${level}) باشد.`,
    wordsPerDay: 'واژه در روز',
    wordsPerDayLabel: (n, pace) => `${n} واژه در روز، ${pace}`,
    examLevelQ: 'برای کدام سطح آماده می‌شوید؟',
    examDateQ: 'آیا تاریخ آزمون مشخصی دارید؟',
    notYet: 'هنوز نه',
    yes: 'بله',
    examDate: 'تاریخ آزمون',
    examDatePlaceholder: 'DD.MM.YYYY',
    dateFormat: 'لطفاً تاریخ را به شکل DD.MM.YYYY وارد کنید.',
    datePast: 'تاریخ آزمون باید در آینده باشد.',
    exams: { OTHER: 'سایر' },
    pace: { 5: 'آرام', 10: 'متعادل', 15: 'متمرکز', 20: 'فشرده' },
    words: (n) => `${n} واژه`,
    reasons: {
      WORK: { label: 'کار و شغل', description: 'آلمانی‌ام را در محل کار بهتر کنم' },
      EVERYDAY_LIFE: {
        label: 'زندگی روزمره',
        description: 'در زندگی روزمره با اعتمادبه‌نفس بیشتر ارتباط بگیرم',
      },
      STUDY: { label: 'تحصیل', description: 'برای تحصیل به زبان آلمانی آماده شوم' },
      COMMUNICATION: { label: 'ارتباط', description: 'بهتر صحبت کنم و بفهمم' },
      EXAM: { label: 'آمادگی برای آزمون', description: 'برای یک آزمون آلمانی درس بخوانم' },
      LIVING_IN_GERMANY: {
        label: 'زندگی در آلمان',
        description: 'در آلمان احساس راحتی بیشتری کنم',
      },
      PERSONAL_INTEREST: { label: 'علاقه شخصی', description: 'فقط از یادگیری آلمانی لذت می‌برم' },
    },
    levels: {
      A1: { label: 'A1 · مبتدی', description: 'واژه‌ها و جمله‌های ساده را می‌دانم.' },
      A2: {
        label: 'A2 · مقدماتی',
        description: 'در موقعیت‌های آشنای روزمره از پس کارها برمی‌آیم.',
      },
      B1: { label: 'B1 · متوسط', description: 'می‌توانم بسیاری از گفتگوهای روزمره را انجام دهم.' },
      B2: { label: 'B2 · متوسط پیشرفته', description: 'می‌توانم درباره موضوعات پیچیده صحبت کنم.' },
      C1: { label: 'C1 · پیشرفته', description: 'روان خودم را بیان می‌کنم.' },
      C2: { label: 'C2 · مسلط', description: 'تقریباً همه‌چیز را می‌فهمم و دقیق بیان می‌کنم.' },
    },
    focus: {
      VOCABULARY: { label: 'واژگان', description: 'واژه‌های بیشتری یاد بگیرم و به خاطر بسپارم' },
      GRAMMAR: { label: 'گرامر', description: 'در ساختار جمله مطمئن‌تر شوم' },
      SPEAKING: { label: 'صحبت کردن', description: 'با اعتمادبه‌نفس بیشتر خودم را بیان کنم' },
      LISTENING: { label: 'شنیداری', description: 'آلمانی گفتاری را بهتر بفهمم' },
      READING: { label: 'خواندن', description: 'متن‌ها را راحت‌تر بفهمم' },
      WRITING: { label: 'نوشتن', description: 'روشن‌تر و درست‌تر بنویسم' },
      EXPRESSIONS: { label: 'عبارات', description: 'عبارت‌های طبیعی یاد بگیرم' },
      EXAM: { label: 'مهارت‌های آزمون', description: 'تمرین سؤال‌های آزمون' },
    },
    complete: {
      title: 'برنامه یادگیری شما آماده است!',
      working: (level) => `شما در مسیر رسیدن به سطح ${level} هستید.`,
      focusHint: 'تمرکز ما روی این موارد خواهد بود:',
      goal: 'هدف روزانه واژه‌های شما',
      start: 'شروع یادگیری',
    },
  },
};
