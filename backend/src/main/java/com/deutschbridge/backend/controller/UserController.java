package com.deutschbridge.backend.controller;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class UserController {


    @GetMapping("/welcome")
    public ResponseEntity <String> welcome() {
        return ResponseEntity.ok().body("Welcome");
    }

    @GetMapping("/user")
    public ResponseEntity <String> user() {
        return ResponseEntity.ok().body("Welcome to the user API");
    }



}
