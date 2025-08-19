'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChannelSelector from '@/components/stream/ChannelSelector';

interface Stream {
  id: string;
  twitch_channel: string;
  order: number;
  offset_seconds: number;
}

interface PackStreamManagerProps {
  packId: string;
  initialStreams?: Stream[];
}

export default function PackStreamManager({
  packId,
  initialStreams = [],
}: PackStreamManagerProps) {
  const router = useRouter();
  const [streams, setStreams] = useState<Stream[]>(initialStreams);
  const [newChannel, setNewChannel] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add a stream to the pack
  const addStream = async (channelName?: string) => {
    const channelToAdd = channelName || newChannel;
    if (!channelToAdd) return;
    
    // Check if the channel is already in the streams
    const isChannelAlreadyAdded = streams.some(
      (stream) => stream.twitch_channel.toLowerCase() === channelToAdd.toLowerCase().trim()
    );
    
    if (isChannelAlreadyAdded) {
      setError(`Channel "${channelToAdd}" is already in this pack.`);
      return;
    }
    
    setIsAdding(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/packs/${packId}/streams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: channelToAdd.toLowerCase().trim(),
          order: streams.length,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add stream');
      }
      
      const { stream } = await response.json();
      
      setStreams([...streams, stream]);
      setNewChannel('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsAdding(false);
    }
  };
  
  // Remove a stream from the pack
  const removeStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/packs/${packId}/streams/${streamId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove stream');
      }
      
      setStreams(streams.filter((stream) => stream.id !== streamId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };
  
  // Reorder streams
  const moveStream = (streamId: string, direction: 'up' | 'down') => {
    const index = streams.findIndex((stream) => stream.id === streamId);
    if (index === -1) return;
    
    const newStreams = [...streams];
    
    if (direction === 'up' && index > 0) {
      // Swap with the previous stream
      [newStreams[index - 1], newStreams[index]] = [newStreams[index], newStreams[index - 1]];
    } else if (direction === 'down' && index < streams.length - 1) {
      // Swap with the next stream
      [newStreams[index], newStreams[index + 1]] = [newStreams[index + 1], newStreams[index]];
    } else {
      return; // No change needed
    }
    
    // Update order property
    newStreams.forEach((stream, i) => {
      stream.order = i;
    });
    
    setStreams(newStreams);
    
    // TODO: Update order in the database
    // This would require a new API endpoint to update stream order
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Manage Streams</h2>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {/* Stream list */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Current Streams</h3>
        
        {streams.length === 0 ? (
          <p className="text-gray-400">No streams added yet. Add some streams below.</p>
        ) : (
          <div className="space-y-2">
            {streams.map((stream) => (
              <div
                key={stream.id}
                className="bg-[#18181b] border border-[#2d2d3a] rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#2d2d3a] rounded-full flex items-center justify-center text-xs mr-3">
                    {stream.order + 1}
                  </div>
                  <div>
                    <div className="font-medium">{stream.twitch_channel}</div>
                    {stream.offset_seconds > 0 && (
                      <div className="text-xs text-gray-400">
                        Offset: {stream.offset_seconds}s
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveStream(stream.id, 'up')}
                    disabled={stream.order === 0}
                    className="p-1 rounded hover:bg-[#2d2d3a] disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveStream(stream.id, 'down')}
                    disabled={stream.order === streams.length - 1}
                    className="p-1 rounded hover:bg-[#2d2d3a] disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeStream(stream.id)}
                    className="p-1 rounded hover:bg-red-500/20 text-red-500"
                    title="Remove stream"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add stream form */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add Stream</h3>
        
        {/* Manual channel input */}
        <div className="flex w-full max-w-md mb-4">
          <input
            type="text"
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
            placeholder="Enter Twitch channel name"
            className="flex-grow bg-[#0e0e10] text-white border border-[#2d2d3a] rounded-l px-4 py-2 focus:outline-none focus:border-[#9146FF]"
            onKeyDown={(e) => e.key === 'Enter' && addStream()}
            disabled={isAdding}
          />
          <button
            onClick={() => addStream()}
            className="twitch-button rounded-l-none"
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add'}
          </button>
        </div>
        
        {/* Channel selector */}
        <div className="w-full max-w-md">
          <p className="text-white text-sm mb-2">Or select from:</p>
          <ChannelSelector onChannelSelect={(channel) => {
            addStream(channel);
          }} />
        </div>
      </div>
    </div>
  );
}