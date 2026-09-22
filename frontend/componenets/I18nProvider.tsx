"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import useAuthStore from "@/store/useAuthStore";
import { AppLanguage, Dictionary, dictionaries, toAppLanguage } from "@/lib/i18n/translations";

const I18nContext = createContext<{ language: AppLanguage; dir: "ltr" | "rtl"; t: Dictionary }>({
    language: "en",
    dir: "ltr",
    t: dictionaries.en,
});

export function I18nProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const preferredLanguage = useAuthStore((state) => state.userProfile?.preferredLanguage);
    const language = toAppLanguage(preferredLanguage);
    const dir: "ltr" | "rtl" = language === "fa" ? "rtl" : "ltr";

    useEffect(() => {
        document.documentElement.lang = language === "fa" ? "fa" : "en";
        document.documentElement.dir = dir;
        document.documentElement.classList.toggle("font-fa", language === "fa");
    }, [language, dir]);

    const value = useMemo(() => ({ language, dir, t: dictionaries[language] }), [language, dir]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    return useContext(I18nContext);
}
