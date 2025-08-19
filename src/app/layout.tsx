import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { config } from "@/lib/config";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Generate metadata dynamically from config
export function generateMetadata(): Metadata {
  return {
    title: `${config.appName} | Multi-Stream Viewer for Twitch`,
    description: config.appDescription,
    keywords: "Twitch, multi-stream, stream viewer, roleplay, esports, IRL, collaborations",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} bg-[#0e0e10] text-white antialiased`}
      >
        <AuthProvider>
          <AnalyticsProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
