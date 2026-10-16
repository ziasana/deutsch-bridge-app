interface SectionHeadingProps {
    badge?: string;
    title: string;
    subtitle?: string;
    align?: "center" | "start";
}

export default function SectionHeading({ badge, title, subtitle, align = "center" }: Readonly<SectionHeadingProps>) {
    const centered = align === "center";
    return (
        <div className={`flex max-w-2xl flex-col gap-3 ${centered ? "mx-auto items-center text-center" : "items-start"}`}>
            {badge && (
                <span className="w-fit rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">{badge}</span>
            )}
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
            {subtitle && <p className="text-lg text-foreground/70">{subtitle}</p>}
        </div>
    );
}
