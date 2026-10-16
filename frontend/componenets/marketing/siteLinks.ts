import type { Marketing } from "@/lib/i18n/marketing";

export interface SiteLink {
    href: string;
    title: string;
    description?: string;
}

/** The public site's grouped navigation, shared by the navbar and the footer so they never drift apart. */
export function getExamLinks(m: Marketing): SiteLink[] {
    return [
        { href: "/exams/telc", title: m.nav.telc.title, description: m.nav.telc.description },
        { href: "/exams/dtz", title: m.nav.dtz.title, description: m.nav.dtz.description },
        { href: "/exams", title: m.nav.examsAll.title, description: m.nav.examsAll.description },
    ];
}

/** Content types that have a live sample on /learn; everything else (the AI tutor) is described on /features. */
const LEARN_TABS = new Set(["grammar", "redemittel", "reading", "expressions"]);

export function getLearnLinks(m: Marketing): SiteLink[] {
    return [
        { href: "/learn", title: m.nav.tryFree },
        ...m.nav.learnItems.map((item) => ({
            href: LEARN_TABS.has(item.id) ? `/learn/${item.id}` : `/features#${item.id}`,
            title: item.title,
            description: item.description,
        })),
        { href: "/features", title: m.nav.learnAll },
    ];
}
