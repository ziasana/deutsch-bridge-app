package com.deutschbridge.backend.service;


import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class CookieService {
    private static final String ACCESS_TOKEN = "access_token";
    private static final String  REFRESH_TOKEN= "refresh_token";

    public Cookie createAccessToken(String token){
         return this.create(ACCESS_TOKEN, token);
     }

    public Cookie createRefreshToken(String token){
        return this.create(REFRESH_TOKEN, token);
    }

    public Cookie create(String name,String token)
    {
        Cookie cookie = new Cookie(name,token);
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
        cookie.setSecure(false);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        return cookie;
    }

    public String extractAccessToken(HttpServletRequest request){
         return  extractTokenFromCookie(ACCESS_TOKEN, request);
    }

    public String extractRefreshToken(HttpServletRequest request){
        return  extractTokenFromCookie(REFRESH_TOKEN, request);
    }

    public String extractTokenFromCookie(String name, HttpServletRequest request)
    {
        String token = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if (name.equals(c.getName())) {
                    token = c.getValue();
                }
            }
        }
        return token;
    }

    public Cookie delete(String name)
    {
        Cookie cookie = new Cookie(name, "");
        cookie.setMaxAge(0);
        cookie.setSecure(false);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        return cookie;
    }
}
