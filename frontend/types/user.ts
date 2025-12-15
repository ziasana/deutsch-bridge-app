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