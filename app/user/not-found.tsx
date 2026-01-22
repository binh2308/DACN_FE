import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description:
    "The page you are looking for doesn’t exist or may have been moved. Go back to the homepage.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold text-gray-500 tracking-widest uppercase">
          Error 404
        </p>

        <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-gray-900">
          Oops! Page not found.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
          Your page could not be found. It might have been removed, renamed, or
          did not exist in the first place.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition"
          >
            ← Back Home
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition"
          >
            Contact support
          </Link>
        </div>
      </div>
    </main>
  );
}
