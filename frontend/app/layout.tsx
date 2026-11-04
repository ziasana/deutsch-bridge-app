
import type { Metadata, Viewport } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import {DarkModeProvider} from "@/componenets/DarkModeProvider";
import {I18nProvider} from "@/componenets/I18nProvider";
import AppChrome from "@/componenets/layout/AppChrome";
import PremiumUpsellModal from "@/componenets/PremiumUpsellModal";
import Providers from "./providers";
import JsonLd from "@/componenets/seo/JsonLd";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo";
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://deutschcertify.com"),
  title: { default: "DeutschCertify", template: "%s | DeutschCertify" },
  description: "Learn German the smart way and pass your exam with DeutschCertify.",
  openGraph: {
    type: "website",
    siteName: "DeutschCertify",
    title: "DeutschCertify",
    description: "Learn German the smart way and pass your exam with DeutschCertify.",
    url: "/",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  verification: { google: "UJnAxHAfBgmC4B3iLW10yYmFXV4wzrALGXZDwyIL_pA" },
};

export const viewport: Viewport = {
  themeColor: "#16324F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${poppins.variable} ${geistMono.variable} antialiased`}
      >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/favicon-512.png` },
            { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, publisher: { "@id": `${SITE_URL}/#organization` }, inLanguage: "en" },
          ],
        }}
      />
      <Providers>
        <I18nProvider>
          <DarkModeProvider>
              <AppChrome>{children}</AppChrome>
              <ToastContainer position="top-right" style={{ top: "calc(4rem + 15px)" }} hideProgressBar closeOnClick pauseOnHover newestOnTop />
              <PremiumUpsellModal />
          </DarkModeProvider>
        </I18nProvider>
      </Providers>
      </body>
    </html>
  );
}
