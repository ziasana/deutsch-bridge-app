"use client";
import Image from "next/image";
import { useI18n } from "@/componenets/I18nProvider";

export default function HomePage() {
  const { t } = useI18n();

  return (
      <main className="bg-background transition-colors duration-300">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">
          <div className="container mx-auto px-6 py-24 flex flex-col-reverse md:flex-row items-center gap-10">
            {/* Text Content */}
            <div className="md:w-1/2 flex flex-col gap-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {t.home.heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/90">
                {t.home.heroSubtitle}
              </p>

              <button className="w-fit bg-card text-primary font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-card/90 transition">
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
                  className="w-90 h-auto drop-shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            {t.home.featuresTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card */}
            <div className="bg-card rounded-[10px] shadow-card p-8 hover:shadow-lg transition transform hover:-translate-y-1">
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                {t.home.learnTitle}
              </h3>
              <p className="text-foreground/60">
                {t.home.learnDescription}
              </p>
            </div>

            <div className="bg-card rounded-[10px] shadow-card p-8 hover:shadow-lg transition transform hover:-translate-y-1">
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                {t.home.practiceTitle}
              </h3>
              <p className="text-foreground/60">
                {t.home.practiceDescription}
              </p>
            </div>

            <div className="bg-card rounded-[10px] shadow-card p-8 hover:shadow-lg transition transform hover:-translate-y-1">
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                {t.home.trackTitle}
              </h3>
              <p className="text-foreground/60">
                {t.home.trackDescription}
              </p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="bg-primary text-primary-foreground py-16 text-center transition">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            {t.home.ctaTitle}
          </h3>
          <button className="bg-card text-primary font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-card/90 transition">
            {t.home.exploreFeatures}
          </button>
        </section>
      </main>
  );
}
