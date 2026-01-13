import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="text-center max-w-md">
                <h1 className="text-7xl font-extrabold text-blue-600">404</h1>

                <h2 className="mt-4 text-2xl font-semibold text-gray-800">
                    Page not found
                </h2>

                <p className="mt-2 text-gray-500">
                    Sorry, the page you are looking for doesn’t exist or has been moved.
                </p>

                <div className="mt-6">
                    <Link
                        href="/"
                        className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 transition"
                    >
                        Go back home
                    </Link>
                </div>
            </div>
        </div>
    );
}
