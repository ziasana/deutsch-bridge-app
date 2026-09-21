"use client";

import {ChangeEvent, useRef, useState} from "react";
import { Card, CardContent } from "@/componenets/ui/card";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import { Label } from "@/componenets/Label";
import useAuthStore from "@/store/useAuthStore";
import {updateProfile, uploadAvatar} from "@/services/userService";
import { toast } from "@/lib/toast";
import Loading from "@/componenets/Loading";
import {UserProfileType} from "@/types/user";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { useI18n } from "@/componenets/I18nProvider";
import { Bell, Calendar, Camera, ChevronDown, GraduationCap, Target, Pencil, Sparkles, UserRound } from "lucide-react";

const CARD_HOVER = "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";

const FIELD_CLASS =
    "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground/50 disabled:shadow-none";
const SELECT_CLASS = `${FIELD_CLASS} appearance-none pe-10`;
const FIELD_LABEL_CLASS = "mb-2";

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

export default function UserProfile() {
    const levels: string[] = ["A1","A2", "B1", "B2", "C1", "C2"];
    const WORD_GOALS = [5, 10, 15, 20];
    const [isLoading, setIsLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const { userProfile, updateUserProfile } = useAuthStore();
    const { t, language } = useI18n();

    const [profile, setProfile] = useState<UserProfileType>({
        displayName: userProfile?.displayName,
        email: userProfile?.email,
        learningLevel: userProfile?.learningLevel,
        dailyGoalWords: userProfile?.dailyGoalWords,
        notificationsEnabled:userProfile?.notificationsEnabled,
        preferredLanguage:userProfile?.preferredLanguage,
        avatarUrl: userProfile?.avatarUrl,
        createdAt: userProfile?.createdAt,
    });

    const [enabled, setEnabled] = useState(profile.notificationsEnabled);

    const joinedLabel = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString(language === "fa" ? "fa-IR" : "en-US", {
              month: "long",
              year: "numeric",
          })
        : null;

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };
    const handleChangeNotification = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.checked; // boolean
        setEnabled(value);
        setProfile({ ...profile, notificationsEnabled: !enabled });
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
                setEditing(!editing)
            })
            .catch((err) => {
                toast.error(err?.response.data.message)
                console.log(err);
            })
            .finally(() => setIsLoading(false));
    }

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

    return (
        <div className="px-6 py-10">
            <div className="mx-auto max-w-6xl">
                {isLoading && <Loading />}

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">{t.profile.title}</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* ================= SUMMARY ================= */}
                    <Card className={`lg:col-span-1 ${CARD_HOVER}`}>
                        <CardContent className="flex flex-col items-center text-center">
                            <div className="relative">
                                {resolveUploadUrl(profile.avatarUrl) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={resolveUploadUrl(profile.avatarUrl)!}
                                        alt={profile.displayName ?? "avatar"}
                                        className="h-24 w-24 rounded-full object-cover ring-4 ring-accent"
                                    />
                                ) : (
                                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-accent-foreground ring-4 ring-accent">
                                        {getInitials(profile.displayName, profile.email)}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => avatarInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    title={t.profile.changePhoto}
                                    className="absolute bottom-0 end-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-60"
                                >
                                    <Camera className="size-4" />
                                    <span className="sr-only">{t.profile.changePhoto}</span>
                                </button>

                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={handleAvatarSelected}
                                />
                            </div>

                            <p className="mt-4 text-lg font-semibold text-foreground">
                                {profile.displayName || "—"}
                            </p>
                            <p className="text-sm text-foreground/60">{profile.email}</p>

                            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                                {userProfile?.role && (
                                    <Badge variant="secondary" className="capitalize">
                                        {userProfile.role.toLowerCase()}
                                    </Badge>
                                )}
                                {joinedLabel && (
                                    <span className="inline-flex items-center gap-1 text-xs text-foreground/50">
                                        <Calendar className="size-3.5" />
                                        {t.profile.joined} {joinedLabel}
                                    </span>
                                )}
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3 w-full">
                                <div className="rounded-xl bg-accent p-4">
                                    <GraduationCap className="mx-auto size-5 text-accent-foreground" />
                                    <p className="mt-2 text-lg font-bold text-foreground">
                                        {profile.learningLevel || "—"}
                                    </p>
                                    <p className="text-xs text-foreground/60">{t.profile.learningLevel}</p>
                                </div>
                                <div className="rounded-xl bg-accent p-4">
                                    <Target className="mx-auto size-5 text-accent-foreground" />
                                    <p className="mt-2 text-lg font-bold text-foreground">
                                        {profile.dailyGoalWords ?? "—"}
                                    </p>
                                    <p className="text-xs text-foreground/60">{t.profile.dailyWordGoal}</p>
                                </div>
                            </div>

                            <div
                                className="mt-4 flex items-center justify-center gap-1"
                                title={profile.preferredLanguage === "PR" ? "فارسی" : "English"}
                            >
                                {profile.preferredLanguage === "PR" ? (
                                    <>
                                        <span className="text-2xl leading-none" role="img" aria-label="Iran">🇮🇷</span>
                                        <span className="text-2xl leading-none" role="img" aria-label="Afghanistan">🇦🇫</span>
                                    </>
                                ) : (
                                    <span className="text-2xl leading-none" role="img" aria-label="English">🇬🇧</span>
                                )}
                            </div>

                            <Button
                                className="mt-4 w-full flex items-center justify-center gap-2"
                                onClick={() => setEditing(!editing)}
                            >
                                <Pencil className="size-4" />
                                {editing ? t.profile.cancel : t.profile.edit}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* ================= FORM ================= */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardContent>
                                <div className="flex items-center gap-3 border-b border-border pb-4">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                                        <UserRound className="size-4.5 text-accent-foreground" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {t.profile.accountInfo}
                                    </h2>
                                </div>

                                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <Label className={FIELD_LABEL_CLASS}>{t.profile.name}</Label>
                                        <Input
                                            name="displayName"
                                            value={profile.displayName}
                                            onChange={handleChange}
                                            disabled={!editing}
                                            className={FIELD_CLASS}
                                        />
                                    </div>

                                    <div>
                                        <Label className={FIELD_LABEL_CLASS}>{t.profile.email}</Label>
                                        <Input
                                            name="email"
                                            value={profile.email}
                                            onChange={handleChange}
                                            disabled
                                            className={FIELD_CLASS}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-border pb-4">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                                        <Sparkles className="size-4.5 text-accent-foreground" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {t.profile.learningPreferences}
                                        </h2>
                                        <p className="text-sm text-foreground/60">
                                            {t.profile.customizeDaily}
                                        </p>
                                    </div>
                                </div>

                                {/* Learning level */}
                                <div>
                                    <Label className={FIELD_LABEL_CLASS}>{t.profile.learningLevel}</Label>
                                    <div className="relative w-full sm:w-60">
                                        <select
                                            value={profile.learningLevel}
                                            name="learningLevel"
                                            disabled={!editing}
                                            onChange={handleChange}
                                            className={SELECT_CLASS}
                                        >
                                            {levels.map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
                                    </div>
                                </div>

                                <div>
                                    {/* Presets */}
                                    <Label className={FIELD_LABEL_CLASS}>{t.profile.dailyWordGoal}</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {WORD_GOALS.map((n) => {
                                            const isSelected = profile.dailyGoalWords === n;

                                            return (
                                                <button
                                                    key={n}
                                                    disabled={!editing}
                                                    type="button"
                                                    onClick={() =>
                                                        setProfile((p) => ({...p, dailyGoalWords: n}))
                                                    }
                                                    className={`rounded-xl px-4 py-2 text-sm font-medium transition border disabled:cursor-not-allowed ${
                                                        isSelected
                                                            ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                                            : "border-border bg-card text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                                                    }`}
                                                >
                                                    {n} {t.profile.words}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <p className="mt-2 text-xs text-foreground/50">
                                        {t.profile.recommendedGoal}
                                    </p>
                                </div>

                                {/* Reminder */}
                                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                                            <Bell className="size-4.5 text-accent-foreground" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/80">{t.profile.enableNotification}</span>
                                    </div>
                                    <label className="inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            disabled={!editing}
                                            name="notificationsEnabled"
                                            checked={enabled}
                                            onChange={handleChangeNotification}
                                            className="sr-only"
                                        />

                                        {/* Toggle UI */}
                                        <div
                                            className={`h-6 w-11 shrink-0 rounded-full transition ${
                                                enabled ? "bg-primary" : "bg-muted"
                                            } ${!editing ? "opacity-60" : ""}`}
                                        >
                                            <div
                                                className={`mt-0.5 size-5 rounded-full bg-white shadow-sm transition transform ${
                                                    enabled ? "translate-x-5.5" : "translate-x-0.5"
                                                }`}
                                            />
                                        </div>
                                    </label>
                                </div>

                                {/* Preferred language */}
                                <div>
                                    <Label className={FIELD_LABEL_CLASS}>{t.profile.preferredLanguage}</Label>
                                    <div className="relative w-full sm:w-60">
                                        <select
                                            value={profile.preferredLanguage}
                                            name="preferredLanguage"
                                            disabled={!editing}
                                            onChange={handleChange}
                                            className={SELECT_CLASS}
                                        >
                                            {languages.map((item) => (
                                                <option key={item.name} value={item.value}>
                                                    {item.value === "PR" ? "فارسی" : item.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
                                    </div>
                                </div>

                                {editing && (
                                    <div className="flex justify-end gap-3 border-t border-border pt-5">
                                        <Button variant="secondary" onClick={() => setEditing(false)}>
                                            {t.profile.cancel}
                                        </Button>
                                        <Button onClick={handleSubmit}>{t.profile.saveProfile}</Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
