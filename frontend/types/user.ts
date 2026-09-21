export interface UserType{
    email?: string,
    password?: string
    username?: string
    role?: string
}

export interface ResetPasswordType{
    password?: string
    token: string | undefined | null
}

export interface UserProfileType{
    email?: string,
    displayName?: string
    learningLevel?: string
    dailyGoalWords?: number
    notificationsEnabled?: boolean
    preferredLanguage?: string
    role?: string
    avatarUrl?: string | null
    createdAt?: string | null
    onboardingCompleted?: boolean
    learningReasons?: string[]
    currentLevelUnknown?: boolean
    targetLevel?: string | null
    focusAreas?: string[]
    examType?: string | null
    examLevel?: string | null
    examDate?: string | null
}
