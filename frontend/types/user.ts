export interface UserType{
    email?: string,
    password?: string
    username?: string
    role?: string
}

export interface ResetPasswordType{
    password?: string
    token?: string
}

export interface UserProfileType{
    email?: string,
    password?: string
    username?: string
    displayName?: string
    learningLevel?: string
    dailyGoalWords?: number
    notificationsEnabled?: boolean
}
