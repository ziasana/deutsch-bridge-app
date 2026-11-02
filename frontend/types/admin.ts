export type AccountType = "BASIC" | "PREMIUM";

export interface AdminUser {
    id: string;
    email: string;
    displayName?: string;
    username?: string;
    role: string;
    verified: boolean;
    accountType: AccountType;
    avatarUrl?: string | null;
    enabled: boolean;
}

export interface AdminCreateUserPayload {
    displayName: string;
    email: string;
    password: string;
    role?: string;
}

export interface AdminBulkDeleteUsersRowResult {
    id: string;
    email: string | null;
    success: boolean;
    errorMessage: string | null;
}

export interface AdminBulkDeleteUsersResult {
    totalCount: number;
    successCount: number;
    failureCount: number;
    rows: AdminBulkDeleteUsersRowResult[];
}

export interface AdminUpdateUserPayload {
    displayName?: string;
    role?: string;
    verified?: boolean;
}

export type FeatureType = "AI_CHAT" | "AI_CORRECTION" | "AI_WRITING_FEEDBACK" | "AI_EXAMPLE" | "AI_SYNONYM";

export interface PremiumSetting {
    enabled: boolean;
}

export interface FeatureLimit {
    featureType: FeatureType;
    accountType: AccountType;
    dailyLimit: number;
    enabled: boolean;
}

export interface FeatureLimitUpdatePayload {
    featureType: FeatureType;
    accountType: AccountType;
    dailyLimit?: number;
    enabled?: boolean;
}

export interface AdminAuditLogEntry {
    id: string;
    adminEmail: string;
    action: string;
    details: string;
    createdAt: string;
}

export type EmailTestType = "TEST" | "VERIFICATION" | "PASSWORD_RESET";

export type EmailErrorCategory =
    | "INVALID_RECIPIENT"
    | "AUTHENTICATION_FAILED"
    | "CONNECTION_FAILED"
    | "TIMEOUT"
    | "TLS_ERROR"
    | "SENDER_REJECTED"
    | "UNKNOWN";

export interface EmailSendLogEntry {
    id: string;
    recipientEmail: string;
    registeredUser: boolean;
    emailType: EmailTestType;
    status: "SUCCESS" | "FAILED";
    errorCategory: EmailErrorCategory | null;
    errorMessage: string | null;
    errorDetail: string | null;
    smtpHost: string | null;
    smtpPort: number | null;
    fromAddress: string | null;
    durationMs: number;
    sentByAdminEmail: string;
    createdAt: string;
}

export interface EmailConfig {
    host: string | null;
    port: number | null;
    username: string | null;
    fromAddress: string | null;
    fromName: string | null;
}
