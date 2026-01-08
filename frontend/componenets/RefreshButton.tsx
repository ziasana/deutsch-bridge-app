import { ArrowPathIcon } from "@heroicons/react/24/outline";
type Props = {
    onClick: () => void;
}
export default function RefreshButton({onClick}: Readonly<Props>) {
    return (
        <button onClick={onClick} className="rounded-full p-2 hover:bg-gray-100">
            <ArrowPathIcon className="h-5 w-5 text-gray-600 hover:animate-spin" />
        </button>
    );
}
