interface StepHeaderProps {
    title: string;
    subtitle?: string;
}

export default function StepHeader({ title, subtitle }: StepHeaderProps) {
    return (
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-foreground/60">{subtitle}</p>}
        </div>
    );
}
