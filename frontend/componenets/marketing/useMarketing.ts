"use client";

import { useI18n } from "@/componenets/I18nProvider";
import { marketingDictionaries } from "@/lib/i18n/marketing";

/** Copy for the public pages, in the visitor's language (English until a profile says otherwise). */
export function useMarketing() {
    const { language, dir } = useI18n();
    return { m: marketingDictionaries[language], language, dir };
}
