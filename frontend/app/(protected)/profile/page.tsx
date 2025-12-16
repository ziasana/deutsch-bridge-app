"use client";

import {useState} from "react";
import { Card, CardContent } from "@/componenets/Card";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import { Label } from "@/componenets/Label";
import useAuthStore from "@/store/useAuthStore";
import {updateProfile} from "@/services/userService";
import {toast, ToastContainer} from "react-toastify";
import Loading from "@/componenets/Loading";
import {UserProfileType} from "@/types/user";

export default function UserProfile() {
    const levels: string[] = ["A1","A2", "B1", "B2", "C1", "C2"];
    const WORD_GOALS = [5, 10, 15, 20];
    const [isLoading, setIsLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const { userProfile, updateUserProfile } = useAuthStore();

    const [profile, setProfile] = useState<UserProfileType>({
        displayName: userProfile?.displayName,
        email: userProfile?.email,
        username: userProfile?.username,
        learningLevel: userProfile?.learningLevel,
        dailyGoalWords: userProfile?.dailyGoalWords,
        notificationsEnabled:userProfile?.notificationsEnabled
    });

    const [enabled, setEnabled] = useState(profile.notificationsEnabled);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };
    const handleChangeNotification = (e) => {
        const value = e.target.checked; // boolean
        setEnabled(value);
        setProfile({ ...profile, notificationsEnabled: !enabled });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        console.log("profile", profile);

        updateProfile(profile)
            .then((data) => {
                if (data?.status == 200) {
                    toast.success("Profile updated!");
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="mx-auto max-w-3xl space-y-8">
                {isLoading && <Loading />}
                <ToastContainer/>
                {/* ================= PROFILE ================= */}
                <Card className="rounded-2xl shadow-lg">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                Profile
                            </h1>
                            <Button  onClick={() => setEditing(!editing)}>
                                {editing ? "Cancel" : "Edit"}
                            </Button>
                        </div>

                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                            <img
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
                                alt="avatar"
                                className="h-20 w-20 rounded-full object-cover"
                            />
                            <div>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    {profile.displayName}
                                </p>
                                <p className="text-sm text-gray-500">@{profile.username}</p>
                            </div>
                        </div>

                        {/* Profile form */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label>Name</Label>
                                <Input
                                    name="displayName"
                                    value={profile.displayName}
                                    onChange={handleChange}
                                    disabled={!editing}
                                />
                            </div>

                            <div>
                                <Label>Username</Label>
                                <Input
                                    name="username"
                                    value={profile.username}
                                    onChange={handleChange}
                                    disabled
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label>Email</Label>
                                <Input
                                    name="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                    disabled
                                />
                            </div>

                        </div>
                    </CardContent>

                    <CardContent className="p-6 space-y-6 pb-10">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Learning Preferences
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Customize your daily learning experience.
                            </p>
                        </div>

                        {/* Learning level */}
                        <div>
                            <Label>Learning level</Label>
                            <select
                                value={profile.learningLevel}
                                name="learningLevel"
                                disabled={!editing}
                                onChange={handleChange} className="mt-2 w-60 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                {levels.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>

                            {/* Presets */}

                            <Label>Daily word goal</Label>
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
                                            className={`
          rounded-md px-3 py-2 text-sm font-medium transition
          border
          ${
                                                isSelected
                                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                                            }
          dark:${
                                                isSelected
                                                    ? "bg-indigo-500 border-indigo-500 text-white"
                                                    : "border-gray-700 text-gray-200 hover:bg-gray-200"
                                            }
        `}
                                        >
                                            {n} {"words"}
                                        </button>
                                    );
                                })}
                            </div>

                            <p className="mt-2 text-xs text-gray-500">
                                Recommended: 10–15 words per day
                            </p>

                        </div>


                        {/* Reminder */}
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <span className="text-sm">Enable Notification</span>
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
                                        enabled ? "bg-indigo-500" : "bg-gray-300"
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

                        {editing && (
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="secondary" onClick={() => setEditing(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit}>Save Profile</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
