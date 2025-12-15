import React from 'react'
import clsx from 'clsx'

export function Card({
                         children,
                         className,
                     }: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={clsx(
                'rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition dark:bg-gray-900 dark:ring-gray-800',
                className
            )}
        >
            {children}
        </div>
    )
}

export function CardHeader({
                               children,
                               className,
                           }: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={clsx(
                'border-b border-gray-200 px-6 py-4 dark:border-gray-800',
                className
            )}
        >
            {children}
        </div>
    )
}

export function CardContent({
                                children,
                                className,
                            }: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={clsx('px-6 py-5', className)}>{children}</div>
    )
}

export function CardFooter({
                               children,
                               className,
                           }: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={clsx(
                'border-t border-gray-200 px-6 py-4 dark:border-gray-800',
                className
            )}
        >
            {children}
        </div>
    )
}
