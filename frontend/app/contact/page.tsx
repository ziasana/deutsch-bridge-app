"use client";
import * as React from 'react';
import { ArrowRight } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-accent/60 to-background flex items-center justify-center px-4 py-12">
            <div
                aria-hidden
                className="absolute -right-10 -top-10 size-40 opacity-40 [background-image:radial-gradient(var(--border)_1.5px,transparent_1.5px)] [background-size:12px_12px]"
            />
            <div
                aria-hidden
                className="absolute -left-10 bottom-0 size-40 opacity-40 [background-image:radial-gradient(var(--border)_1.5px,transparent_1.5px)] [background-size:12px_12px]"
            />

            <div className="relative w-full max-w-xl bg-card rounded-2xl shadow-card p-8 sm:p-12">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight text-foreground mb-3">
                    Contact Us
                </h1>
                <p className="text-lg text-foreground/70 mb-8">
                    Have a question or feedback? Send us a message.
                </p>

                <form className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-foreground font-semibold mb-2 text-sm">
                            Name
                        </label>
                        <input
                            type="text"
                            placeholder="Your name"
                            className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-foreground font-semibold mb-2 text-sm">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-foreground font-semibold mb-2 text-sm">
                            Message
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Write your message..."
                            className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full rounded-full bg-primary text-primary-foreground font-semibold py-3.5 flex items-center justify-center gap-2 hover:bg-primary/90 transition"
                    >
                        Send Message
                        <ArrowRight className="size-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
