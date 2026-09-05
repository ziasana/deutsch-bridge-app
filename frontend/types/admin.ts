export interface AdminUser {
    id: string;
    email: string;
    displayName?: string;
    username?: string;
    role: string;
    verified: boolean;
}

export interface AdminUpdateUserPayload {
    displayName?: string;
    role?: string;
    verified?: boolean;
}
