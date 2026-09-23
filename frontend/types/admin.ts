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
