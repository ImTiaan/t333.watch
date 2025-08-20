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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://t333.watch';
  
  return {
    title: `${config.appName} | Multi-Stream Viewer for Twitch`,
    description: config.appDescription,
    keywords: "Twitch, multi-stream, stream viewer, roleplay, esports, IRL, collaborations, watch multiple streams",
    authors: [{ name: 't333.watch' }],
    creator: 't333.watch',
    publisher: 't333.watch',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/t3logo.png', type: 'image/png', sizes: '32x32' },
        { url: '/t3logo.png', type: 'image/png', sizes: '16x16' },
      ],
      shortcut: [
        { url: '/t3logo.png', type: 'image/png' }
      ],
      apple: [
        { url: '/t3logo.png', type: 'image/png', sizes: '180x180' },
      ],
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      title: `${config.appName} | Multi-Stream Viewer for Twitch`,
      description: config.appDescription,
      siteName: config.appName,
      images: [
        {
          url: `${siteUrl}/t3logo.png`,
          width: 1200,
          height: 630,
          alt: 't333.watch - Multi-Stream Viewer for Twitch',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${config.appName} | Multi-Stream Viewer for Twitch`,
      description: config.appDescription,
      images: [`${siteUrl}/t3logo.png`],
      creator: '@t333watch',
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://t333.watch';
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": config.appName,
    "description": config.appDescription,
    "url": siteUrl,
    "applicationCategory": "Entertainment",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": config.subscription.price,
      "priceCurrency": config.subscription.currency
    },
    "featureList": [
      "Multi-stream viewing",
      "Twitch integration",
      "Custom layouts",
      "Stream synchronization"
    ]
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
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
