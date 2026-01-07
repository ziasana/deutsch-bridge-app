package com.deutschbridge.backend.context;

public class LanguageContext {
    private LanguageContext() {

    }
    private static final ThreadLocal<String> CURRENT_LANGUAGE = new ThreadLocal<>();

    // Set language for current request
    public static void set(String language) {
        CURRENT_LANGUAGE.set(language);
    }

    // Get language for current request
    public static String get() {
        return CURRENT_LANGUAGE.get();
    }

    // Clear after request is finished
    public static void clear() {
        CURRENT_LANGUAGE.remove();
    }
}
