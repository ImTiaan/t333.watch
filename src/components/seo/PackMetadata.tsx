'use client';

import Head from 'next/head';
import { useEffect, useState } from 'react';

interface PackMetadataProps {
  packId: string;
  packTitle: string;
  packDescription?: string;
  packThumbnail?: string;
  streams?: string[];
}

/**
 * Component that adds Open Graph and Twitter Card metadata for pack pages
 * This ensures rich previews when links are shared on social media platforms
 */
export default function PackMetadata({
  packId,
  packTitle,
  packDescription = 'Watch multiple Twitch streams simultaneously',
  packThumbnail,
  streams = []
}: PackMetadataProps) {
  const [origin, setOrigin] = useState('');
  
  // Set the origin when the component mounts
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  
  // Generate the canonical URL for this pack
  const canonicalUrl = `${origin}/viewer?pack=${packId}`;
  
  // Generate a description that includes stream names if available
  const fullDescription = streams && streams.length > 0
    ? `${packDescription}. Featuring: ${streams.slice(0, 3).join(', ')}${streams.length > 3 ? ` and ${streams.length - 3} more` : ''}`
    : packDescription;
  
  // Use the provided thumbnail or a default one
  const thumbnailUrl = packThumbnail || `${origin}/api/og?title=${encodeURIComponent(packTitle)}&streams=${encodeURIComponent(streams.slice(0, 4).join(','))}`;
  
  return (
    <Head>
      {/* Basic metadata */}
      <title>{packTitle} | t333.watch</title>
      <meta name="description" content={fullDescription} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph metadata */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={`${packTitle} | t333.watch`} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={thumbnailUrl} />
      
      {/* Twitter Card metadata */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${packTitle} | t333.watch`} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={thumbnailUrl} />
      
      {/* Additional metadata */}
      <meta property="og:site_name" content="t333.watch" />
      <meta name="twitter:site" content="@t333watch" />
    </Head>
  );
}