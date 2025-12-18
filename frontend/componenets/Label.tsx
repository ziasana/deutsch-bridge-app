import { ReactNode } from 'react'


interface LabelProps {
    htmlFor?: string
    children: ReactNode
    className?: string
}


export function Label({ htmlFor, children, className = '' }: Readonly<LabelProps>) {
    return (
        <label
            htmlFor={htmlFor}
            className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
        >
            {children}
        </label>
    )
}