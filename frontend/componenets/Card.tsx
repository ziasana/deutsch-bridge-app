import React from 'react'
import clsx from 'clsx'

export function Card({
                         children,
                         className,
                     }: Readonly<{
    children: React.ReactNode
    className?: string
}>) {
    return (
        <div
            className={clsx(
                'rounded-[10px] bg-white shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] transition dark:bg-gray-900 dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)]',
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
                           }: Readonly<{
    children: React.ReactNode
    className?: string
}>) {
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
                            }: Readonly<{
    children: React.ReactNode
    className?: string
}>) {
    return (
        <div className={clsx('px-6 py-5', className)}>{children}</div>
    )
}

export function CardFooter({
                               children,
                               className,
                           }: Readonly<{
    children: React.ReactNode
    className?: string
}>) {
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
