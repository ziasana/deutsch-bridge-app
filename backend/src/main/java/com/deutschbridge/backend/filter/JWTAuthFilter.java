package com.deutschbridge.backend.filter;

import com.deutschbridge.backend.model.AuthUser;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.service.CookieService;
import com.deutschbridge.backend.service.CustomUserDetailsService;
import com.deutschbridge.backend.util.JWTUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JWTAuthFilter extends OncePerRequestFilter {

   private final JWTUtil jwtUtil;
   private final CustomUserDetailsService customUserDetailsService;
   private final CookieService cookieService;

    public JWTAuthFilter(JWTUtil jwtUtil, CustomUserDetailsService customUserDetailsService, CookieService cookieService) {
        this.jwtUtil = jwtUtil;
        this.customUserDetailsService = customUserDetailsService;
        this.cookieService = cookieService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException
    {

        String path = request.getRequestURI();
        // Skip JWT check for login or public endpoints
        if (path.startsWith("/api/auth/login")
                || path.startsWith("/api/auth/refresh")
                || path.startsWith("/req/signup/verify")
                || path.startsWith("/api/auth/forgot-password")
                || path.startsWith("/api/auth/reset-password")
                || path.startsWith("/req/reset-password")
                || path.startsWith("/api/auth/register")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token= cookieService.extractAccessToken(request);
        if (token == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            return; // stop filter chain
        }

        String email="";
        try {
            email = jwtUtil.extractEmail(token);
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            return;
        }

      // String autHeader= request.getHeader("Authorization");
        //extract data from header and get username from token
       /*  if(autHeader != null && autHeader.startsWith("Bearer ")) {
            token = autHeader.substring(7);
            username= jwtUtil.extractUsernameOrEmail(token);
        }*/

        if(email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            //check if user exist in DB and not expired
            UserDetails userDetails  = customUserDetailsService.loadUserByUsername(email);
            if (!jwtUtil.validateToken(email, userDetails, token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
           else
           {
               UsernamePasswordAuthenticationToken authToken= new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
               authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
               SecurityContextHolder.getContext().setAuthentication(authToken);
           }
        }

        filterChain.doFilter(request, response);
    }
}
