"use client";

import {ChangeEvent, useRef, useEffect, useState} from "react";
import { Label } from "@/componenets/Label";
import useAuthStore from "@/store/useAuthStore";
import {updateProfile, uploadAvatar} from "@/services/userService";
import { toast } from "@/lib/toast";
import Loading from "@/componenets/Loading";
import {UserProfileType} from "@/types/user";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { useI18n } from "@/componenets/I18nProvider";
import NotificationSettingsCard from "@/componenets/notifications/NotificationSettingsCard";
import { Bell, Calendar, Camera, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD_CLASS =
    "w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-foreground/[0.04] disabled:text-foreground/55";

const NAV = [
    { id: "account", icon: UserRound },
    { id: "learning", icon: Sparkles },
    { id: "notifications", icon: Bell },
] as const;

type LanguageOption = {
    name: string;
    value: string;
};

const languages: LanguageOption[] = [
    { name: "English", value: "EN" },
    { name: "Persian", value: "PR" },
];

function getInitials(name?: string | null, email?: string | null): string {
    return (name ?? email ?? "?")
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

/** One settings row: what it is on the left, the control on the right. */
function Row({ label, hint, children }: Readonly<{ label: string; hint?: string; children: React.ReactNode }>) {
    return (
        <div className="grid gap-3 py-5 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8">
            <div>
                <Label className="!text-foreground">{label}</Label>
                {hint && <p className="mt-0.5 text-xs text-foreground/55">{hint}</p>}
            </div>
            <div>{children}</div>
        </div>
    );
}

/** Segmented control: one row of options, the chosen one raised. */
function Segmented<T extends string | number>({ options, value, onChange, label }: Readonly<{ options: { value: T; label: string }[]; value: T | undefined; onChange: (v: T) => void; label: string }>) {
    return (
        <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg bg-foreground/[0.06] p-1">
            {options.map((o) => (
                <button
                    key={String(o.value)}
                    type="button"
                    aria-pressed={value === o.value}
                    onClick={() => onChange(o.value)}
                    className={cn(
                        "cursor-pointer rounded-md px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        value === o.value ? "bg-card text-foreground shadow-sm" : "text-foreground/60 hover:text-foreground",
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export default function UserProfile() {
    const levels: string[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const WORD_GOALS = [5, 10, 15, 20];
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
        const [activeSection, setActiveSection] = useState<(typeof NAV)[number]["id"]>("account");
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const { userProfile, updateUserProfile } = useAuthStore();
    const { t, language } = useI18n();

    const [profile, setProfile] = useState<UserProfileType>({
        displayName: userProfile?.displayName,
        email: userProfile?.email,
        learningLevel: userProfile?.learningLevel,
        dailyGoalWords: userProfile?.dailyGoalWords,
        preferredLanguage: userProfile?.preferredLanguage,
        avatarUrl: userProfile?.avatarUrl,
        createdAt: userProfile?.createdAt,
    });

    // What can actually be saved: unsaved changes show a bar at the bottom instead of a separate "edit mode".
    const EDITABLE = ["displayName", "learningLevel", "dailyGoalWords", "preferredLanguage"] as const;
    const dirty = EDITABLE.some((key) => profile[key] !== userProfile?.[key]);

    useEffect(() => {
        const sections = NAV.map((n) => document.getElementById(n.id)).filter((el): el is HTMLElement => el !== null);
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                if (visible) setActiveSection(visible.target.id as (typeof NAV)[number]["id"]);
            },
            { rootMargin: "-20% 0px -65% 0px" },
        );
        sections.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const joinedLabel = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString(language === "fa" ? "fa-IR" : "en-US", {
              month: "long",
              year: "numeric",
          })
        : null;

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        updateProfile(profile)
            .then((data) => {
                if (data?.status == 200) {
                    toast.success(t.profile.updated);
                    // Merge onto the existing store state rather than replacing it — `profile`
                    // only carries the fields this form edits, so replacing outright would wipe
                    // onboardingCompleted/role/etc. and (via the protected-layout guard) bounce
                    // the user straight to the onboarding wizard right after saving.
                    updateUserProfile({ ...userProfile, ...profile });
                }
            })
            .catch((err) => {
                toast.error(err?.response.data.message)
                console.log(err);
            })
            .finally(() => setIsLoading(false));
    }

    const discardChanges = () =>
        setProfile((p) => ({
            ...p,
            displayName: userProfile?.displayName,
            learningLevel: userProfile?.learningLevel,
            dailyGoalWords: userProfile?.dailyGoalWords,
            preferredLanguage: userProfile?.preferredLanguage,
        }));

    const handleAvatarSelected = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        setUploadingAvatar(true);
        uploadAvatar(file)
            .then((res) => {
                const avatarUrl = res.data.data;
                const nextProfile = { ...profile, avatarUrl };
                setProfile(nextProfile);
                updateUserProfile({ ...userProfile, ...nextProfile });
                toast.success(t.profile.avatarUpdated);
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message ?? t.profile.avatarUploadFailed);
                console.error(err);
            })
            .finally(() => setUploadingAvatar(false));
    };

    const initials = getInitials(profile.displayName, profile.email);
    const avatarSrc = resolveUploadUrl(profile.avatarUrl);
    const navLabel: Record<(typeof NAV)[number]["id"], string> = {
        account: t.profile.accountInfo,
        learning: t.profile.learningPreferences,
        notifications: t.notifications.settings.title,
    };

    const avatar = (size: string, text: string) =>
        avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt={profile.displayName ?? "avatar"} className={cn(size, "shrink-0 rounded-full object-cover")} />
        ) : (
            <div className={cn(size, text, "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary")}>{initials}</div>
        );

    const card = "scroll-mt-6 rounded-[10px] bg-card shadow-card";
    const cardHeader = (title: string, description?: string) => (
        <div className="border-b border-border/60 px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-foreground/60">{description}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
            {isLoading && <Loading />}
            
            <div className="mx-auto max-w-5xl">
                <h1 className="text-2xl font-bold text-foreground">{t.profile.title}</h1>

                <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
                    {/* Side navigation: who you are, and the sections of this page */}
                    <aside className="lg:sticky lg:top-6 lg:self-start">
                        <div className="flex items-center gap-3 lg:pb-5">
                            {avatar("size-12", "text-base")}
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{profile.displayName || "—"}</p>
                                <p className="truncate text-xs text-foreground/55">{profile.email}</p>
                            </div>
                        </div>
                        <nav aria-label={t.profile.title} className="mt-4 flex gap-1 overflow-x-auto lg:mt-0 lg:flex-col lg:overflow-visible">
                            {NAV.map(({ id, icon: Icon }) => (
                                <a
                                    key={id}
                                    href={`#${id}`}
                                    onClick={() => setActiveSection(id)}
                                    aria-current={activeSection === id ? "true" : undefined}
                                    className={cn(
                                        "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                        activeSection === id ? "bg-primary/10 text-primary" : "text-foreground/65 hover:bg-foreground/[0.05] hover:text-foreground",
                                    )}
                                >
                                    <Icon className="size-4" aria-hidden="true" />
                                    {navLabel[id]}
                                </a>
                            ))}
                        </nav>
                    </aside>

                    <div className="space-y-6">
                        {/* Account */}
                        <section id="account" className={card}>
                            {cardHeader(t.profile.accountInfo)}
                            <div className="divide-y divide-border/60 px-6">
                                <Row label={t.profile.changePhoto}>
                                    <div className="flex items-center gap-4">
                                        {avatar("size-16", "text-xl")}
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => avatarInputRef.current?.click()}
                                                disabled={uploadingAvatar}
                                                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60"
                                            >
                                                <Camera className="size-4" aria-hidden="true" />
                                                {t.profile.changePhoto}
                                            </button>
                                            <p className="mt-1 text-xs text-foreground/55">JPG, PNG or WebP</p>
                                        </div>
                                        <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarSelected} />
                                    </div>
                                </Row>
                                <Row label={t.profile.name}>
                                    <input name="displayName" value={profile.displayName ?? ""} onChange={handleChange} className={cn(FIELD_CLASS, "sm:max-w-sm")} />
                                </Row>
                                <Row label={t.profile.email}>
                                    <input name="email" value={profile.email ?? ""} onChange={handleChange} disabled className={cn(FIELD_CLASS, "sm:max-w-sm")} />
                                </Row>
                                {(userProfile?.role || joinedLabel) && (
                                    <Row label={userProfile?.role ? "Account" : t.profile.joined}>
                                        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/70">
                                            {userProfile?.role && <span className="capitalize">{userProfile.role.toLowerCase()}</span>}
                                            {joinedLabel && (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar className="size-3.5" aria-hidden="true" />
                                                    {t.profile.joined} {joinedLabel}
                                                </span>
                                            )}
                                        </p>
                                    </Row>
                                )}
                            </div>
                        </section>

                        {/* Learning preferences */}
                        <section id="learning" className={card}>
                            {cardHeader(t.profile.learningPreferences, t.profile.customizeDaily)}
                            <div className="divide-y divide-border/60 px-6">
                                <Row label={t.profile.learningLevel}>
                                    <Segmented
                                        label={t.profile.learningLevel}
                                        options={levels.map((l) => ({ value: l, label: l }))}
                                        value={profile.learningLevel}
                                        onChange={(v) => setProfile((p) => ({ ...p, learningLevel: v }))}
                                    />
                                </Row>
                                <Row label={t.profile.dailyWordGoal} hint={t.profile.recommendedGoal}>
                                    <Segmented
                                        label={t.profile.dailyWordGoal}
                                        options={WORD_GOALS.map((n) => ({ value: n, label: `${n} ${t.profile.words}` }))}
                                        value={profile.dailyGoalWords}
                                        onChange={(v) => setProfile((p) => ({ ...p, dailyGoalWords: v }))}
                                    />
                                </Row>
                                <Row label={t.profile.preferredLanguage}>
                                    <Segmented
                                        label={t.profile.preferredLanguage}
                                        options={languages.map((l) => ({ value: l.value, label: l.value === "PR" ? "🇮🇷 فارسی" : `🇬🇧 ${l.name}` }))}
                                        value={profile.preferredLanguage}
                                        onChange={(v) => setProfile((p) => ({ ...p, preferredLanguage: v }))}
                                    />
                                </Row>
                            </div>
                        </section>

                        <div id="notifications" className="scroll-mt-6">
                            <NotificationSettingsCard />
                        </div>
                    </div>
                </div>

                {/* Unsaved changes: replaces the old edit mode */}
                {dirty && (
                    <div role="region" aria-label="Unsaved changes" className="anim-fade-up fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-[10px] border border-border bg-card px-4 py-3 shadow-xl">
                        <p className="text-sm font-medium text-foreground">{language === "fa" ? "تغییرات ذخیره نشده" : "You have unsaved changes"}</p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={discardChanges}
                                className="cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium text-foreground/70 transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            >
                                {t.profile.cancel}
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            >
                                {t.profile.saveProfile}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
