export type ApiResponse<T> = { message: string; data: T };

/** Backend enum: EN | DE | PR (Persian). Sent as Accept-Language. */
export type PreferredLanguage = 'EN' | 'DE' | 'PR';

export interface UserProfile {
  displayName: string;
  email: string;
  learningLevel: string | null;
  dailyGoalWords: number | null;
  notificationsEnabled: boolean;
  preferredLanguage: PreferredLanguage | null;
  role: string;
  avatarUrl: string | null;
  createdAt: string | null;
  onboardingCompleted: boolean;
  learningReasons: string[];
  currentLevelUnknown: boolean;
  targetLevel: string | null;
  focusAreas: string[];
  examType: string | null;
  examLevel: string | null;
  examDate: string | null;
}

export interface MobileAuthData {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}
