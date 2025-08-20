import { Metadata, ResolvingMetadata } from 'next';

interface Props {
  params: object;
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get the pack ID from the search params
  const packId = searchParams.pack as string;
  
  // If no pack ID, return default metadata
  if (!packId) {
    return {
      title: 't333.watch | Multi-Stream Viewer for Twitch',
      description: 'Watch multiple Twitch streams simultaneously in a customizable grid layout.',
      openGraph: {
        title: 't333.watch | Multi-Stream Viewer for Twitch',
        description: 'Watch multiple Twitch streams simultaneously in a customizable grid layout.',
        url: 'https://t333.watch/viewer',
        siteName: 't333.watch',
        images: [
          {
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/og`,
            width: 1200,
            height: 630,
            alt: 't333.watch Multi-Stream Viewer',
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 't333.watch | Multi-Stream Viewer for Twitch',
        description: 'Watch multiple Twitch streams simultaneously in a customizable grid layout.',
        images: [`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/og`],
        creator: '@t333watch',
      },
    };
  }
  
  try {
    // Fetch the pack data
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/packs/${packId}`, { next: { revalidate: 60 } });
    
    if (!response.ok) {
      throw new Error('Failed to fetch pack data');
    }
    
    const data = await response.json();
    const pack = data.pack;
    
    // Extract streams from the pack
    const streams = pack.pack_streams?.map((s: any) => s.twitch_channel) || []; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    // Generate a description that includes stream names if available
    const description = streams && streams.length > 0
      ? `Watch ${streams.slice(0, 3).join(', ')}${streams.length > 3 ? ` and ${streams.length - 3} more` : ''} simultaneously on t333.watch`
      : pack.description || 'Watch multiple Twitch streams simultaneously on t333.watch';
    
    // Generate the Open Graph image URL
    const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/viewer/opengraph-image?pack=${packId}`;
    
    // Return the metadata
    return {
      title: `${pack.title} | t333.watch`,
      description,
      openGraph: {
        title: `${pack.title} | t333.watch`,
        description,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/viewer?pack=${packId}`,
        siteName: 't333.watch',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${pack.title} - t333.watch Pack`,
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${pack.title} | t333.watch`,
        description,
        images: [ogImageUrl],
        creator: '@t333watch',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    
    // Return default metadata if there's an error
    return {
      title: 't333.watch | Multi-Stream Viewer for Twitch',
      description: 'Watch multiple Twitch streams simultaneously in a customizable grid layout.',
      openGraph: {
        title: 't333.watch | Multi-Stream Viewer for Twitch',
        description: 'Watch multiple Twitch streams simultaneously in a customizable grid layout.',
        url: 'https://t333.watch/viewer',
        siteName: 't333.watch',
        images: [
          {
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/og`,
            width: 1200,
            height: 630,
            alt: 't333.watch Multi-Stream Viewer',
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 't333.watch | Multi-Stream Viewer for Twitch',
        description: 'Watch multiple Twitch streams simultaneously in a customizable grid layout.',
        images: [`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/og`],
        creator: '@t333watch',
      },
    };
  }
}