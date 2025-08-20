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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://t333.watch';
  
  return {
    title: `${config.appName} | Multi-Stream Viewer for Twitch`,
    description: config.appDescription,
    keywords: "Twitch, multi-stream, stream viewer, roleplay, esports, IRL, collaborations, live streaming, synchronized viewing, stream packs",
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
      url: baseUrl,
      title: `${config.appName} | Multi-Stream Viewer for Twitch`,
      description: config.appDescription,
      siteName: 't333.watch',
      images: [
        {
          url: `${baseUrl}/t3logo.png`,
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
      images: [`${baseUrl}/t3logo.png`],
      creator: '@t333watch',
    },
    alternates: {
      canonical: baseUrl,
    },
    other: {
      'theme-color': '#9146ff',
      'msapplication-TileColor': '#9146ff',
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "t333.watch",
    "description": "Multi-stream viewer for Twitch - Watch multiple streams simultaneously",
    "url": "https://t333.watch",
    "applicationCategory": "Entertainment",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "t333.watch"
    },
    "featureList": [
      "Multi-stream viewing",
      "Twitch integration",
      "Stream synchronization",
      "Custom stream packs",
      "Real-time chat"
    ]
  };

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
