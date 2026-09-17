// components/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  required?: boolean;
  type?: string;
}

export default function Input({
  type = "text",
  required = true, // default value
  ...rest
}: Readonly<InputProps>) {
  return (
    <input
      type={type}
      required={required}
      className="w-full mt-2 px-4 py-3 rounded-lg border border-border bg-muted text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
      {...rest} // rest includes placeholder, disabled, etc.
    />
  );
}
