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
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
