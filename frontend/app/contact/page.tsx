"use client";
import * as React from 'react';

export default function ContactPage() {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-xl bg-card rounded-[10px] shadow-card p-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                    Contact Us
                </h1>
                <p className="text-foreground/60 mb-6">
                    Have a question or feedback? Send us a message.
                </p>

                <form className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-foreground/70">
                            Name
                        </label>
                        <input
                            type="text"
                            placeholder="Your name"
                            className="mt-1 w-full rounded-lg border border-border bg-muted px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-foreground/70">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            className="mt-1 w-full rounded-lg border border-border bg-muted px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-medium text-foreground/70">
                            Message
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Write your message..."
                            className="mt-1 w-full rounded-lg border border-border bg-muted px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-lg hover:bg-primary/90 transition"
                    >
                        Send Message
                    </button>
                </form>
            </div>
        </div>
    );
}
