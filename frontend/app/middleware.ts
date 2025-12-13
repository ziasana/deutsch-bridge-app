import {NextRequest, NextResponse} from "next/server";


const protectedRoutes= ["/dashboard", "/update-profile"];

export function middleware(req: NextRequest) {
    const token= req.cookies.get("jwt")?.value;

    if(protectedRoutes.some((path) => req.nextUrl.password.startsWith(path))){
        //no authenticated redirect to login
        if(!token){
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    //allow access
    return  NextResponse.next();
}

export const config={
    matcher: ["/dashboard/:path*", "/update-profile"],
}