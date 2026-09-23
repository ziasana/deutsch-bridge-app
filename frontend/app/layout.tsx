
import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import {DarkModeProvider} from "@/componenets/DarkModeProvider";
import {I18nProvider} from "@/componenets/I18nProvider";
import AppChrome from "@/componenets/layout/AppChrome";
import PremiumUpsellModal from "@/componenets/PremiumUpsellModal";
import Providers from "./providers";
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
  title: "DeutschBridge",
  description: "Learn German the smart way with DeutschBridge.",
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
      <Providers>
        <I18nProvider>
          <DarkModeProvider>
              <AppChrome>{children}</AppChrome>
              <ToastContainer position="top-right" hideProgressBar closeOnClick pauseOnHover newestOnTop />
              <PremiumUpsellModal />
          </DarkModeProvider>
        </I18nProvider>
      </Providers>
      </body>
    </html>
  );
}
