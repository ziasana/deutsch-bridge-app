"use client";

import {ChangeEvent, useEffect, useState} from "react";
import Link from "next/link";
import { Card, CardContent } from "@/componenets/ui/card";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import { Label } from "@/componenets/Label";
import CircularProgress from "@/componenets/CircularProgress";
import { ActivityChart } from "@/componenets/activity-chart";
import useAuthStore from "@/store/useAuthStore";
import {updateProfile} from "@/services/userService";
import {getOverview, getStreak} from "@/services/userProgressService";
import {OverviewResponse, StreakResponse} from "@/types/userProgress";
import {toast, ToastContainer} from "react-toastify";
import Loading from "@/componenets/Loading";
import {UserProfileType} from "@/types/user";
import Image from "next/image";
import { useI18n } from "@/componenets/I18nProvider";
import { Award, ChevronRight, Flame, GraduationCap, Target, Pencil } from "lucide-react";

const CARD_HOVER = "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";

type LanguageOption = {
    name: string;
    value: string;
};

const languages: LanguageOption[] = [
    { name: "English", value: "EN" },
    { name: "Persian", value: "PR" },
];

export default function UserProfile() {
    const levels: string[] = ["A1","A2", "B1", "B2", "C1", "C2"];
    const WORD_GOALS = [5, 10, 15, 20];
    const [isLoading, setIsLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const { userProfile, updateUserProfile } = useAuthStore();
    const { t } = useI18n();

    const [profile, setProfile] = useState<UserProfileType>({
        displayName: userProfile?.displayName,
        email: userProfile?.email,
        learningLevel: userProfile?.learningLevel,
        dailyGoalWords: userProfile?.dailyGoalWords,
        notificationsEnabled:userProfile?.notificationsEnabled,
        preferredLanguage:userProfile?.preferredLanguage,
    });

    const [enabled, setEnabled] = useState(profile.notificationsEnabled);

    const [overview, setOverview] = useState<OverviewResponse | null>(null);
    const [streak, setStreak] = useState<StreakResponse | null>(null);

    useEffect(() => {
        getOverview()
            .then((res) => setOverview(res.data))
            .catch((err) => console.error(err));

        getStreak()
            .then((res) => setStreak(res.data))
            .catch((err) => console.error(err));
    }, []);

    const grammarPercent = overview?.grammar.total ? (overview.grammar.learned / overview.grammar.total) * 100 : 0;
    const expressionsPercent = overview?.expressions.total ? (overview.expressions.learned / overview.expressions.total) * 100 : 0;

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
                    updateUserProfile(profile);
                }
                setEditing(!editing)
            })
            .catch((err) => {
                toast.error(err?.response.data.message)
                console.log(err);
            })
            .finally(() => setIsLoading(false));
    }

    return (
        <div className="px-6 py-10">
            <div className="mx-auto max-w-6xl">
                {isLoading && <Loading />}
                <ToastContainer/>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* ================= SUMMARY ================= */}
                    <Card className={`lg:col-span-1 ${CARD_HOVER}`}>
                        <CardContent className="flex flex-col items-center text-center">
                            <Image
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
                                alt="avatar"
                                width={96}
                                height={96}
                                className="h-24 w-24 rounded-full object-cover ring-4 ring-accent"
                            />

                            <p className="mt-4 text-lg font-semibold text-foreground">
                                {profile.displayName || "—"}
                            </p>
                            <p className="text-sm text-foreground/60">{profile.email}</p>

                            {userProfile?.role && (
                                <Badge variant="secondary" className="mt-3 capitalize">
                                    {userProfile.role.toLowerCase()}
                                </Badge>
                            )}

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

                            <Button
                                className="mt-6 w-full flex items-center justify-center gap-2"
                                onClick={() => setEditing(!editing)}
                            >
                                <Pencil className="size-4" />
                                {editing ? t.profile.cancel : t.profile.edit}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* ================= FORM ================= */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Card className={CARD_HOVER}>
                                <CardContent className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent">
                                            <Award className="size-6 text-accent-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">
                                                {overview?.totalLearned ?? "-"}
                                            </p>
                                            <span className="text-sm text-foreground/60">Words Mastered</span>
                                        </div>
                                    </div>
                                    <Link href="/dashboard/vocabulary" className="text-primary">
                                        <ChevronRight className="size-5" />
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className={CARD_HOVER}>
                                <CardContent className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent">
                                            <Flame className="size-6 text-accent-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">
                                                {streak?.currentStreak ?? "-"}
                                            </p>
                                            <span className="text-sm text-foreground/60">Day Streak</span>
                                        </div>
                                    </div>
                                    <Link href="/user-progress" className="text-foreground/50">
                                        <ChevronRight className="size-5" />
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Progress overview */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-foreground">Progress Overview</h3>
                                <Link href="/user-progress">
                                    <Button className="text-sm px-3 py-1.5">View all</Button>
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Card className={CARD_HOVER}>
                                    <CardContent className="flex items-center gap-4">
                                        <CircularProgress
                                            value={grammarPercent}
                                            size={84}
                                            color="var(--chart-1)"
                                            trackColor="var(--muted)"
                                            showLabel
                                        />
                                        <div>
                                            <span className="text-sm text-foreground/60">Class</span>
                                            <p className="text-base font-semibold text-foreground">Grammar Lessons</p>
                                            <span className="text-sm text-foreground/60">Total Lessons</span>
                                            <p className="text-base font-semibold text-foreground">
                                                {overview?.grammar.learned ?? 0} / {overview?.grammar.total ?? 0}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={CARD_HOVER}>
                                    <CardContent className="flex items-center gap-4">
                                        <CircularProgress
                                            value={expressionsPercent}
                                            size={84}
                                            color="var(--chart-3)"
                                            trackColor="var(--muted)"
                                            showLabel
                                        />
                                        <div>
                                            <span className="text-sm text-foreground/60">Class</span>
                                            <p className="text-base font-semibold text-foreground">Active Expressions</p>
                                            <span className="text-sm text-foreground/60">Total Expressions</span>
                                            <p className="text-base font-semibold text-foreground">
                                                {overview?.expressions.learned ?? 0} / {overview?.expressions.total ?? 0}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <ActivityChart />

                        <Card>
                            <CardContent>
                                <h1 className="text-xl font-semibold text-foreground">
                                    {t.profile.title}
                                </h1>

                                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label>{t.profile.name}</Label>
                                        <Input
                                            name="displayName"
                                            value={profile.displayName}
                                            onChange={handleChange}
                                            disabled={!editing}
                                        />
                                    </div>

                                    <div>
                                        <Label>{t.profile.email}</Label>
                                        <Input
                                            name="email"
                                            value={profile.email}
                                            onChange={handleChange}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground">
                                        {t.profile.learningPreferences}
                                    </h2>
                                    <p className="mt-1 text-sm text-foreground/60">
                                        {t.profile.customizeDaily}
                                    </p>
                                </div>

                                {/* Learning level */}
                                <div>
                                    <Label>{t.profile.learningLevel}</Label>
                                    <select
                                        value={profile.learningLevel}
                                        name="learningLevel"
                                        disabled={!editing}
                                        onChange={handleChange}
                                        className="mt-2 w-60 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        {levels.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    {/* Presets */}
                                    <Label>{t.profile.dailyWordGoal}</Label>
                                    <div className="mt-3 flex gap-3">
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
                                                    className={`rounded-md px-3 py-2 text-sm font-medium transition border ${
                                                        isSelected
                                                            ? "bg-primary border-primary text-primary-foreground"
                                                            : "border-border text-foreground/70 hover:bg-accent hover:text-accent-foreground"
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
                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <span className="text-sm text-foreground/80">{t.profile.enableNotification}</span>
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
                                            className={`w-12 h-7 rounded-full transition ${
                                                enabled ? "bg-primary" : "bg-muted"
                                            }`}
                                        >
                                            <div
                                                className={`w-5 h-5 mt-1 bg-white rounded-full transition transform ${
                                                    enabled ? "translate-x-6" : "translate-x-1"
                                                }`}
                                            />
                                        </div>
                                    </label>
                                </div>

                                {/* Preferred language */}
                                <div>
                                    <Label>{t.profile.preferredLanguage}</Label>
                                    <select
                                        value={profile.preferredLanguage}
                                        name="preferredLanguage"
                                        disabled={!editing}
                                        onChange={handleChange}
                                        className="mt-2 w-60 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        {languages.map((item) => (
                                            <option key={item.name} value={item.value}>
                                                {item.value === "PR" ? "فارسی" : item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {editing && (
                                    <div className="flex justify-end gap-3 pt-4">
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
