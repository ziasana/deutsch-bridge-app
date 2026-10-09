"use client";

/** The closing screen of a session: a gradient hero with an emoji and a headline; the caller adds the text and buttons. */
export function FinishCard({ emoji, title, children }: Readonly<{ emoji: string; title: string; children: React.ReactNode }>) {
    return (
        <div className="overflow-hidden rounded-3xl bg-card text-center shadow-card ring-1 ring-border/60">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/70 px-6 py-8 text-white">
                <span aria-hidden="true" className="absolute -end-8 -top-10 size-36 rounded-full bg-white/10" />
                <p className="anim-pop relative text-5xl" aria-hidden="true">{emoji}</p>
                <h2 className="relative mt-3 text-2xl font-extrabold">{title}</h2>
            </div>
            <div className="p-6 sm:p-8">{children}</div>
        </div>
    );
}
