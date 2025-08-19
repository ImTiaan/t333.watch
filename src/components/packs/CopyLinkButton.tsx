'use client';

import { useState, useEffect } from 'react';
import analytics, { EventCategory, SocialEvents } from '@/lib/analytics';

interface CopyLinkButtonProps {
  url: string;
  packId?: string;
  packTitle?: string;
  className?: string;
  variant?: 'default' | 'icon' | 'primary';
  onCopied?: () => void;
}

export default function CopyLinkButton({
  url,
  packId,
  packTitle,
  className = '',
  variant = 'default',
  onCopied
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [copySupported, setCopySupported] = useState(true);

  // Check if clipboard API is supported
  useEffect(() => {
    setCopySupported(
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    );
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      
      // Track the copy event
      analytics.trackEvent(EventCategory.SOCIAL, SocialEvents.COPY_LINK, {
        packId: packId || 'unknown',
        packTitle: packTitle || 'unknown',
        url
      });
      
      // Call the onCopied callback if provided
      if (onCopied) {
        onCopied();
      }
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          
          // Track the copy event
          analytics.trackEvent(EventCategory.SOCIAL, SocialEvents.COPY_LINK, {
            packId: packId || 'unknown',
            packTitle: packTitle || 'unknown',
            url,
            method: 'fallback'
          });
          
          if (onCopied) {
            onCopied();
          }
        }
      } catch (err) {
        console.error('Fallback copy method failed:', err);
      }
      
      document.body.removeChild(textarea);
    }
  };

  // If clipboard API is not supported, don't render the button
  if (!copySupported) {
    return null;
  }

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <button
        onClick={handleCopy}
        className={`p-2 rounded-full transition-colors ${
          copied
            ? 'bg-green-500 text-white'
            : 'bg-[#2d2d3a] text-white hover:bg-[#9146FF]'
        } ${className}`}
        title={copied ? 'Copied!' : 'Copy link to clipboard'}
        aria-label={copied ? 'Copied!' : 'Copy link to clipboard'}
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        )}
      </button>
    );
  }

  // Primary variant (more prominent)
  if (variant === 'primary') {
    return (
      <button
        onClick={handleCopy}
        className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
          copied
            ? 'bg-green-500 text-white'
            : 'bg-[#9146FF] text-white hover:bg-[#7a2df0]'
        } ${className}`}
        aria-label={copied ? 'Copied!' : 'Copy link to clipboard'}
      >
        {copied ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Copied!</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>Copy Link</span>
          </>
        )}
      </button>
    );
  }

  // Default variant
  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 border transition-colors rounded flex items-center gap-2 ${
        copied
          ? 'border-green-500 bg-green-500/10 text-green-500'
          : 'border-[#2d2d3a] text-white hover:bg-[#2d2d3a]'
      } ${className}`}
      aria-label={copied ? 'Copied!' : 'Copy link to clipboard'}
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
}