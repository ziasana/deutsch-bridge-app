"use client";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-gray-300 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
        <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
          Laden...
        </p>
      </div>
    </div>
  );
}
