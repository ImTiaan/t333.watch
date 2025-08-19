'use client';

import { useState, useEffect } from 'react';
import CopyLinkButton from './CopyLinkButton';
import analytics, { EventCategory, SocialEvents } from '@/lib/analytics';
import Image from 'next/image';

interface SharePackSectionProps {
  packId: string;
  packTitle?: string;
  packDescription?: string;
  packThumbnail?: string;
}

export default function SharePackSection({
  packId,
  packTitle = 'Twitch Stream Pack',
  packDescription = 'Watch multiple Twitch streams simultaneously',
  packThumbnail
}: SharePackSectionProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Generate the share URL when the component mounts
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    setShareUrl(`${origin}/viewer?pack=${packId}`);
  }, [packId]);
  
  // Handle social media sharing
  const handleShare = (platform: 'twitter' | 'facebook' | 'reddit' | 'discord') => {
    // Track the share event
    analytics.trackEvent(EventCategory.SOCIAL, SocialEvents.SOCIAL_SHARE, {
      platform,
      packId,
      packTitle
    });
    
    // Construct the share URL based on the platform
    let shareLink = '';
    
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out this Twitch stream pack: ${packTitle}`)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'reddit':
        shareLink = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`Check out this Twitch stream pack: ${packTitle}`)}`;
        break;
      case 'discord':
        // For Discord, we'll copy a formatted message to clipboard
        const discordMessage = `**${packTitle}**\n${packDescription}\n${shareUrl}`;
        navigator.clipboard.writeText(discordMessage);
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 2000);
        return; // Don't open a new window for Discord
    }
    
    // Open the share link in a new window
    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer');
    }
  };

  // Generate the Open Graph image URL
  const ogImageUrl = packThumbnail || `${typeof window !== 'undefined' ? window.location.origin : ''}/viewer/opengraph-image?pack=${packId}`;

  return (
    <div className="mt-6 pt-6 border-t border-[#2d2d3a]">
      <h2 className="text-lg font-medium mb-3">Share this Pack</h2>
      
      {/* URL input and copy button */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-grow bg-[#0e0e10] text-white border border-[#2d2d3a] rounded px-4 py-2 focus:outline-none focus:border-[#9146FF]"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <CopyLinkButton
          url={shareUrl}
          packId={packId}
          packTitle={packTitle}
          variant="primary"
        />
      </div>
      
      {/* Social media sharing buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => handleShare('twitter')}
          className="flex items-center gap-2 px-3 py-2 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded hover:bg-[#1DA1F2]/20 transition-colors"
          aria-label="Share on Twitter"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
          <span>Twitter</span>
        </button>
        
        <button
          onClick={() => handleShare('facebook')}
          className="flex items-center gap-2 px-3 py-2 bg-[#1877F2]/10 text-[#1877F2] rounded hover:bg-[#1877F2]/20 transition-colors"
          aria-label="Share on Facebook"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Facebook</span>
        </button>
        
        <button
          onClick={() => handleShare('reddit')}
          className="flex items-center gap-2 px-3 py-2 bg-[#FF4500]/10 text-[#FF4500] rounded hover:bg-[#FF4500]/20 transition-colors"
          aria-label="Share on Reddit"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
          </svg>
          <span>Reddit</span>
        </button>
        
        <div className="relative">
          <button
            onClick={() => handleShare('discord')}
            className="flex items-center gap-2 px-3 py-2 bg-[#5865F2]/10 text-[#5865F2] rounded hover:bg-[#5865F2]/20 transition-colors"
            aria-label="Copy for Discord"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
            </svg>
            <span>Discord</span>
          </button>
          
          {/* Discord copy tooltip */}
          {showTooltip && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded shadow-lg">
              Copied for Discord!
            </div>
          )}
        </div>
      </div>
      
      {/* Preview toggle button */}
      <button 
        onClick={() => setShowPreview(!showPreview)}
        className="text-sm text-[#9146FF] hover:underline mb-4 flex items-center"
      >
        {showPreview ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Hide social media preview
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Show social media preview
          </>
        )}
      </button>
      
      {/* Social media preview */}
      {showPreview && (
        <div className="mb-4 border border-[#2d2d3a] rounded-lg overflow-hidden">
          <div className="bg-[#1c1c24] p-3 border-b border-[#2d2d3a]">
            <h3 className="text-sm font-medium">Preview on social media</h3>
          </div>
          <div className="p-4 bg-[#18181b]">
            <div className="max-w-md mx-auto border border-[#2d2d3a] rounded-lg overflow-hidden bg-white text-black">
              {/* Image preview */}
              <div className="relative w-full h-40 bg-[#0e0e10]">
                <Image 
                  src={ogImageUrl}
                  alt={packTitle}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="opacity-90"
                />
              </div>
              
              {/* Content preview */}
              <div className="p-3">
                <div className="text-xs text-gray-500 mb-1">t333.watch</div>
                <div className="text-sm font-medium mb-1">{packTitle} | t333.watch</div>
                <div className="text-xs text-gray-700">{packDescription}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* SEO and Open Graph metadata explanation */}
      <div className="mt-4 text-sm text-gray-400">
        <p>When shared, this link includes metadata for rich previews on social media platforms.</p>
      </div>
    </div>
  );
}