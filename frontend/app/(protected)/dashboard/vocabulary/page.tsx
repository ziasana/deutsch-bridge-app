"use client";

import {ToastContainer} from "react-toastify";
import * as React from "react";
import useAuthStore from "@/store/useAuthStore";
import {UserType} from "@/types/user";
import {useEffect, useState} from "react";
import {getTest} from "@/services/userService";
import {useRouter} from "next/navigation";

export default function VocabularyPage() {
    const [data, setData] = useState("");
    const router = useRouter();
    const {user} = useAuthStore();
    const testData:UserType ={
        email:"al@gmail.com"
    }
    useEffect(() => {
        getTest(testData).then((data)=> {
            setData(data.data)
            console.log(data);
        })
    }, [router]);
    return (
        <div>
            <div>
                <h1>Welcome, {user?.username}</h1>
                <h1>User: {data}</h1>
            </div>
            <ToastContainer/>
            <h1>Vocabulary</h1>
        </div>

    );
}