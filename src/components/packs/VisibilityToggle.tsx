'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import analytics, { EventCategory, PackEvents } from '@/lib/analytics';

interface VisibilityToggleProps {
  packId?: string;
  initialVisibility: 'public' | 'private';
  onVisibilityChange?: (visibility: 'public' | 'private') => void;
}

export default function VisibilityToggle({
  packId,
  initialVisibility,
  onVisibilityChange
}: VisibilityToggleProps) {
  const [visibility, setVisibility] = useState<'public' | 'private'>(initialVisibility);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggleVisibility = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newVisibility = visibility === 'public' ? 'private' : 'public';
      
      // If we have a packId, update the visibility on the server
      if (packId) {
        const response = await fetch(`/api/packs/${packId}/visibility`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ visibility: newVisibility }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update visibility');
        }
        
        // Track the visibility change
        analytics.trackEvent(
          EventCategory.PACK,
          PackEvents.UPDATE_PACK,
          {
            packId,
            action: 'visibility_change',
            newVisibility
          }
        );
        
        // Refresh the page to update the UI
        router.refresh();
      }
      
      // Update local state
      setVisibility(newVisibility);
      
      // Call the callback if provided
      if (onVisibilityChange) {
        onVisibilityChange(newVisibility);
      }
    } catch (err) {
      console.error('Error updating pack visibility:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <button
          onClick={toggleVisibility}
          disabled={isLoading}
          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9146FF] ${
            visibility === 'public' ? 'bg-[#9146FF]' : 'bg-[#3a3a3d]'
          }`}
          aria-pressed={visibility === 'public'}
          aria-label={`Pack visibility: ${visibility}`}
        >
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
              visibility === 'public' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="ml-2 text-sm">
          {visibility === 'public' ? 'Public' : 'Private'}
        </span>
        {isLoading && (
          <div className="ml-2 twitch-loading" />
        )}
      </div>
      
      {error && (
        <p className="text-[#f43e37] text-xs mt-1">{error}</p>
      )}
      
      <p className="text-xs text-gray-400 mt-1">
        {visibility === 'public' 
          ? 'Anyone can discover and view this pack' 
          : 'Only you can view this pack'}
      </p>
    </div>
  );
}