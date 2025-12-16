"use client";

import {useState} from "react";
import { Card, CardContent } from "@/componenets/Card";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import { Label } from "@/componenets/Label";
import useAuthStore from "@/store/useAuthStore";
import {updatePassword} from "@/services/userService";
import {toast, ToastContainer} from "react-toastify";
import Loading from "@/componenets/Loading";
import {UserType} from "@/types/user";

interface UserPassword {
    password: string;
    confirmPassword: string;
}
const initialValue: UserPassword = {password: "", confirmPassword: ""};
export default function UserProfile() {
    const [isLoading, setIsLoading] = useState(false);
    const {userProfile} = useAuthStore();
    const [passwordData, setPasswordData] = useState<UserPassword>(initialValue);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if(passwordData.password=="" || passwordData.confirmPassword==""){
            toast.error("Passwords is empty.");
        }
        if(passwordData.password!==passwordData.confirmPassword){
            toast.error("Passwords don't match");
        }
        if(passwordData.password.length < 6)
            toast.error("Passwords should be at least 6 characters");

        const newPassword: UserType = {
            username: userProfile?.username,
            password:passwordData.password
        };
        updatePassword(newPassword)
            .then((data) => {
                if (data?.status == 200) {
                    toast.success("Password updated!");
                    setPasswordData(initialValue);
                }
            })
            .catch((err) => {
                toast(err?.data.message);
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
                                Update Password
                            </h1>
                        </div>

                        {/* Profile form */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            <div >
                                <Label>Password</Label>
                                <Input
                                    required
                                    name="password"
                                    type="password"
                                    value={passwordData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <Label>Password Confirmation</Label>
                                <Input
                                    required
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>

                                <div className="flex pt-4">
                                    <Button onClick={handleSubmit}> {isLoading? "Saving...": "Save"}</Button>
                                </div>


                        </div>
                    </CardContent>


                </Card>

            </div>
        </div>
    );
}
