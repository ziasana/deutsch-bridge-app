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
      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
      {...rest} // rest includes placeholder, disabled, etc.
    />
  );
}
