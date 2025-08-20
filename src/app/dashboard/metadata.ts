import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | t333.watch',
  description: 'Manage your stream packs, create new multi-stream experiences, and customize your viewing preferences.',
  openGraph: {
    title: 'Dashboard | t333.watch',
    description: 'Manage your stream packs, create new multi-stream experiences, and customize your viewing preferences.',
    url: 'https://t333.watch/dashboard',
    siteName: 't333.watch',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://t333.watch'}/t3logo.png`,
        width: 1200,
        height: 630,
        alt: 't333.watch Dashboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard | t333.watch',
    description: 'Manage your stream packs, create new multi-stream experiences, and customize your viewing preferences.',
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || 'https://t333.watch'}/t3logo.png`],
    creator: '@t333watch',
  },
};