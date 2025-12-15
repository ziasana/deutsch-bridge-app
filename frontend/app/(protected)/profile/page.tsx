"use client";

import { useState } from "react";
import { Card, CardContent } from "@/componenets/Card";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import { Label } from "@/componenets/Label";

export default function UserProfile() {
    const [editing, setEditing] = useState(false);

    const [profile, setProfile] = useState({
        name: "John Doe",
        email: "john.doe@example.com",
        username: "johndoe",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="mx-auto max-w-3xl space-y-8">

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
                                    {profile.name}
                                </p>
                                <p className="text-sm text-gray-500">@{profile.username}</p>
                            </div>
                        </div>

                        {/* Profile form */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label>Name</Label>
                                <Input
                                    name="name"
                                    value={profile.name}
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
                                    disabled={!editing}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label>Email</Label>
                                <Input
                                    name="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                    disabled={!editing}
                                />
                            </div>
                        </div>

                        {editing && (
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="secondary" onClick={() => setEditing(false)}>
                                    Cancel
                                </Button>
                                <Button>Save Profile</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ================= LEARNING PREFERENCES ================= */}
                <Card className="rounded-2xl shadow-lg">
                    <CardContent className="p-6 space-y-6">
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
                            <select className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option>A2</option>
                                <option>B1</option>
                                <option>B2</option>
                                <option selected>C1</option>
                            </select>
                        </div>

                        {/* Daily goal */}
                        <div>
                            <Label>Daily word goal</Label>
                            <div className="mt-2 flex flex-wrap gap-3">
                                {[5, 10, 15].map((n) => (
                                    <button
                                        key={n}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                                    >
                                        {n} words
                                    </button>
                                ))}
                                <input
                                    type="number"
                                    placeholder="Custom"
                                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                                />
                            </div>
                        </div>

                        {/* Focus areas */}
                        <div>
                            <Label>Focus areas</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {[
                                    "Vocabulary",
                                    "Grammar",
                                    "Speaking",
                                    "Business German",
                                    "Exam Prep",
                                ].map((item) => (
                                    <span
                                        key={item}
                                        className="cursor-pointer rounded-full border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                                    >
                    {item}
                  </span>
                                ))}
                            </div>
                        </div>

                        {/* Reminder */}
                        <div>
                            <Label>Daily reminder</Label>
                            <div className="mt-2 flex gap-6">
                                {["Morning", "Afternoon", "Evening"].map((time) => (
                                    <label key={time} className="flex items-center gap-2 text-sm">
                                        <input type="radio" name="reminder" />
                                        {time}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button>Save learning settings</Button>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
