"use client";

interface AdminSearchInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

/** The free-text search input shared by every admin table (see AdminTableControls, which pairs it with
 * a page-size selector) and by pickers that only need the search box on its own, like the notification
 * broadcast's specific-user picker. */
export default function AdminSearchInput({ label, value, onChange, placeholder }: Readonly<AdminSearchInputProps>) {
    const input = (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
    );

    if (!label) return input;

    return (
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            {label}
            {input}
        </label>
    );
}
