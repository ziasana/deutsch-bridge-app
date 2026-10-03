interface FieldMessageProps {
    id: string;
    error?: string;
    hint?: string;
}

/** Validation error (red) or, when the field is valid, an optional hint (grey) shown under a form field. */
export default function FieldMessage({ id, error, hint }: Readonly<FieldMessageProps>) {
    if (error) {
        return (
            <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-destructive">
                {error}
            </p>
        );
    }
    if (!hint) return null;
    return (
        <p id={id} className="mt-1.5 text-sm text-foreground/50">
            {hint}
        </p>
    );
}
