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

export type FeatureType = "AI_CHAT" | "AI_CORRECTION" | "AI_EXAMPLE" | "AI_SYNONYM";

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
