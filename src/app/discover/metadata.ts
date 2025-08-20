import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Packs | t333.watch',
  description: 'Discover and explore public stream packs created by the community. Find new streamers and multi-stream experiences.',
  openGraph: {
    title: 'Discover Packs | t333.watch',
    description: 'Discover and explore public stream packs created by the community. Find new streamers and multi-stream experiences.',
    url: 'https://t333.watch/discover',
    siteName: 't333.watch',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://t333.watch'}/t3logo.png`,
        width: 1200,
        height: 630,
        alt: 't333.watch Discover Packs',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover Packs | t333.watch',
    description: 'Discover and explore public stream packs created by the community. Find new streamers and multi-stream experiences.',
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || 'https://t333.watch'}/t3logo.png`],
    creator: '@t333watch',
  },
};