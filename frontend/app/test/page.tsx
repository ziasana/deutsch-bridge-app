"use client";
import * as React from 'react';
import {useEffect} from "react";
import {getTest} from "@/services/userService";
import {useRouter} from "next/navigation";
import {UserType} from "@/types/user";


export default function Testpage (){
const router = useRouter();
const testData:UserType ={
  email:"al@gmail.com"
    }
    useEffect(() => {
        getTest(testData).then((data)=> {
            console.log(data);
        })
    }, [router]);
    return (
        <div>

        </div>
    );
};