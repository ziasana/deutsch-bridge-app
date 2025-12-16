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
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {UpdatePasswordFormData, updatePasswordSchema} from "@/schema/updatePasswordSchema";
import {useFormErrorToast} from "@/hook/useFormErrorToast";


export default function UserProfile() {
    const [isLoading, setIsLoading] = useState(false);
    const {userProfile} = useAuthStore();

    const {
        reset,
        register,
        handleSubmit,
        formState: { errors, isSubmitted },
    } = useForm<UpdatePasswordFormData>({
        resolver: zodResolver(updatePasswordSchema),
        mode: "onSubmit", // validate on submit
    });

    const onSubmit = async (data: UpdatePasswordFormData) => {
        setIsLoading(true);
        const newPassword: UserType = {
            username: userProfile?.username,
            password: data.password
        };
        updatePassword(newPassword)
            .then((data) => {
                if (data?.status == 200) {
                    toast.success("Password updated!");
                    reset();
                }
            })
            .catch((err) => {
                toast.error(err?.response.data.message)
                console.error(err);
            })
            .finally(() => setIsLoading(false));
    };
    useFormErrorToast(errors, isSubmitted);

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
                        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            <div >
                                <Label>Password</Label>
                                <Input
                                    required
                                    type="password"
                                    {...register("password")}
                                />
                            </div>
                            <div>
                                <Label>Password Confirmation</Label>
                                <Input
                                    required
                                    type="password"
                                    {...register("password_confirmation")}
                                />
                            </div>

                                <div className="flex pt-4">
                                    <Button> {isLoading? "Saving...": "Save"}</Button>
                                </div>
                        </form>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
