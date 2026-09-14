"use client";
import Image from "next/image";
import { useI18n } from "@/componenets/I18nProvider";

export default function HomePage() {
  const { t } = useI18n();

  return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-indigo-500 to-purple-600 text-white dark:from-gray-800 dark:to-gray-700 dark:text-gray-100">
          <div className="container mx-auto px-6 py-24 flex flex-col-reverse md:flex-row items-center gap-10">
            {/* Text Content */}
            <div className="md:w-1/2 flex flex-col gap-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {t.home.heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-white/90 dark:text-gray-300">
                {t.home.heroSubtitle}
              </p>

              <button className="bg-white dark:bg-gray-900 dark:border dark:border-gray-700 text-indigo-600 dark:text-indigo-400 font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                {t.home.getStarted}
              </button>
            </div>

            {/* Illustration */}
            <div className="md:w-1/2 flex justify-center">
              <Image
                  src="/undraw_focused_m9bj.svg"
                  alt="German learning illustration"
                  width={500}
                  height={400}
                  className="w-90 h-auto drop-shadow-xl dark:opacity-90"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
            {t.home.featuresTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl dark:hover:shadow-gray-700 transition transform hover:-translate-y-1">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {t.home.learnTitle}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t.home.learnDescription}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl dark:hover:shadow-gray-700 transition transform hover:-translate-y-1">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {t.home.practiceTitle}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t.home.practiceDescription}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl dark:hover:shadow-gray-700 transition transform hover:-translate-y-1">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {t.home.trackTitle}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t.home.trackDescription}
              </p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="bg-indigo-600 dark:bg-gray-800 text-white dark:text-gray-100 py-16 text-center transition">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            {t.home.ctaTitle}
          </h3>
          <button className="bg-white dark:bg-gray-900 dark:border dark:border-gray-700 text-indigo-600 dark:text-indigo-400 font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            {t.home.exploreFeatures}
          </button>
        </section>
      </main>
  );
}
