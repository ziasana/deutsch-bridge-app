// components/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: Readonly <ButtonProps>) {
  const base = "px-4 py-2 rounded-lg font-semibold transition";
  const styles =
    variant === "primary"
      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
      : "bg-card border border-border text-foreground hover:bg-accent hover:text-accent-foreground";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
