"use client";

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
    label: string;
}

export default function ToggleSwitch({ checked, onChange, disabled, label }: Readonly<ToggleSwitchProps>) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                checked ? "bg-primary" : "bg-muted border border-border"
            }`}
        >
            <span
                className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
                    checked ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1"
                }`}
            />
        </button>
    );
}
