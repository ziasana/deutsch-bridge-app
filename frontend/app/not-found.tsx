import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/componenets/brand/Logo";

export default function NotFound() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-[#16324f] px-6 py-10 text-center text-white shadow-card ring-1 ring-white/10 sm:px-10">
                <div className="flex justify-center">
                    <Logo />
                </div>

                <p className="mt-8 text-7xl font-bold tracking-tight text-[#f2b544]">404</p>
                <span aria-hidden="true" className="mx-auto mt-3 block h-0.5 w-8 rounded-full bg-[#f2b544]" />

                <h1 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">Seite nicht gefunden</h1>
                <p className="mt-2 text-sm leading-relaxed text-[#b9c7d6]">
                    Die Seite, die du suchst, existiert nicht oder wurde verschoben.
                    <br />
                    Page not found – it doesn’t exist or has been moved.
                </p>

                <Link
                    href="/"
                    className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f2b544] px-6 py-2.5 text-sm font-semibold text-[#16324f] transition hover:bg-[#f5c46a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Zur Startseite
                </Link>
            </div>
        </main>
    );
}
