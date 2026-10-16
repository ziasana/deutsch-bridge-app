"use client";

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

export default function FaqList({ items }: Readonly<{ items: { question: string; answer: string }[] }>) {
    return (
        <div className="flex flex-col gap-3">
            {items.map((item, index) => (
                <Disclosure key={item.question} defaultOpen={index === 0}>
                    {({ open }) => (
                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                            <DisclosureButton className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start font-semibold text-foreground">
                                {item.question}
                                <ChevronDown className={`size-5 shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`} />
                            </DisclosureButton>
                            <DisclosurePanel className="px-5 pb-4 text-sm text-foreground/70">{item.answer}</DisclosurePanel>
                        </div>
                    )}
                </Disclosure>
            ))}
        </div>
    );
}
