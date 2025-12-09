package com.deutschbridge.backend.filter;

import com.deutschbridge.backend.service.CustomUserService;
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
   private final CustomUserService customUserService;

    public JWTAuthFilter(JWTUtil jwtUtil, CustomUserService customUserService) {
        this.jwtUtil = jwtUtil;
        this.customUserService = customUserService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String autHeader= request.getHeader("Authorization");

        String token=null;
        String username=null;
        //extract data from header and get username from token
        if(autHeader != null && autHeader.startsWith("Bearer ")) {
            token = autHeader.substring(7);
            username= jwtUtil.extractUsernameOrEmail(token);
        }

        if(username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            //check if user exist in DB and not expired
            UserDetails userDetails = customUserService.loadUserByUsername(username);
           if( jwtUtil.validateToken(username, userDetails, token))
           {
               UsernamePasswordAuthenticationToken authToken= new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
               authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
               SecurityContextHolder.getContext().setAuthentication(authToken);
           }
        }

        filterChain.doFilter(request, response);
    }
}
