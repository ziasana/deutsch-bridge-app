import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Privacy Policy",
  description: "How DeutschCertify handles your data: account details, learning progress, cookies and AI features.",
  path: "/privacy",
});

const EMAIL = "info@deutschcertify.com";

export default function PrivacyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-12 text-foreground/80">
      <h1 className="text-3xl font-bold text-foreground md:text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-foreground/60">Last updated: November 2026</p>

      <div className="mt-8 space-y-8 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground">Who we are</h2>
          <p className="mt-2">DeutschCertify (deutschcertify.com) is a German learning and exam-preparation website. For privacy questions, or to use any of your rights below, write to <a className="text-primary underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">What data we process</h2>
          <ul className="mt-2 list-disc space-y-2 ps-6">
            <li><strong>Account data:</strong> your email address and a securely hashed password, or your Google account identifier if you sign in with Google, plus the profile choices you make (for example learning level and goals).</li>
            <li><strong>Learning data:</strong> your progress, answers, exam attempts, bookmarks and written or spoken practice that you submit, so we can show your results and continue where you stopped.</li>
            <li><strong>AI features:</strong> messages and texts you send to the AI tutor are transmitted to a third-party AI service provider to generate the response. Do not enter sensitive personal information.</li>
            <li><strong>Contact messages:</strong> what you write to us when you get in touch.</li>
            <li><strong>Technical data:</strong> standard server logs such as IP address, browser type and request time, used to run and secure the service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">Why we process it</h2>
          <p className="mt-2">To provide your account and the learning features you ask for (contract), to keep the service secure and fix errors (legitimate interest), and to answer your messages. We do not sell your data and we do not use it for advertising.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">Cookies and local storage</h2>
          <p className="mt-2">We use only what is needed to run the site: a sign-in session cookie that keeps you logged in, and browser storage for your preferences such as language and dark mode. We do not use analytics or advertising cookies.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">Sharing and service providers</h2>
          <p className="mt-2">Our hosting provider, the AI provider described above and Google (if you choose Google sign-in) process data on our behalf or as needed for those features. We share data with authorities only when legally required.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">How long we keep it</h2>
          <p className="mt-2">We keep your data while your account exists. When you delete your account, we remove your personal data except what we must keep by law.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">Your rights</h2>
          <p className="mt-2">You can ask us for access to, correction, deletion or a copy of your data, object to processing, and complain to your data protection authority. Contact us at <a className="text-primary underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">Changes</h2>
          <p className="mt-2">If we change how we handle data, we will update this page and the date above.</p>
        </section>
      </div>
    </main>
  );
}
