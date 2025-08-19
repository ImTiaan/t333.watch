'use client';

import { useState, useEffect } from 'react';
import { twitchApi } from '@/lib/twitch-api';

interface Channel {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

interface ChannelSelectorProps {
  onChannelSelect: (channelName: string) => void;
}

export default function ChannelSelector({ onChannelSelect }: ChannelSelectorProps) {
  const [followedChannels, setFollowedChannels] = useState<Channel[]>([]);
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'followed' | 'search'>('followed');

  // Fetch followed channels on mount
  useEffect(() => {
    const fetchFollowedChannels = async () => {
      try {
        setIsLoading(true);
        
        // Try to get all followed channels first
        try {
          const channels = await twitchApi.getFollowedChannels();
          setFollowedChannels(channels);
          return;
        } catch (error) {
          console.error('Error fetching all followed channels, falling back to live streams:', error);
        }
        
        // Fallback to just live streams if getting all followed channels fails
        const streams = await twitchApi.getFollowedStreams();
        
        // Extract unique channels from streams
        const channels = streams.map(stream => ({
          id: stream.user_id,
          login: stream.user_login,
          display_name: stream.user_name,
          profile_image_url: stream.thumbnail_url.replace('{width}', '50').replace('{height}', '50')
        }));
        
        setFollowedChannels(channels);
      } catch (error) {
        console.error('Error fetching followed channels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowedChannels();
  }, []);

  // Search for channels
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(true);
      const results = await twitchApi.searchChannels(searchQuery);
      
      // Transform the results to match our Channel interface
      const channels = results.map(channel => ({
        id: channel.id,
        login: channel.broadcaster_login,
        display_name: channel.display_name,
        profile_image_url: channel.thumbnail_url
      }));
      
      setSearchResults(channels);
    } catch (error) {
      console.error('Error searching channels:', error);
      // Fallback to filtering followed channels if API search fails
      const results = followedChannels.filter(channel =>
        channel.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.login.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#18181b] border border-[#2d2d3a] rounded-lg p-4">
      <div className="flex mb-4">
        <button
          className={`flex-1 py-2 px-4 ${activeTab === 'followed' ? 'bg-[#9146FF] text-white' : 'bg-[#2d2d3a] text-gray-300'} rounded-l`}
          onClick={() => setActiveTab('followed')}
        >
          Followed Channels
        </button>
        <button
          className={`flex-1 py-2 px-4 ${activeTab === 'search' ? 'bg-[#9146FF] text-white' : 'bg-[#2d2d3a] text-gray-300'} rounded-r`}
          onClick={() => setActiveTab('search')}
        >
          Search Channels
        </button>
      </div>

      {activeTab === 'search' && (
        <div className="mb-4 flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a channel"
            className="flex-grow bg-[#0e0e10] text-white border border-[#2d2d3a] rounded-l px-4 py-2 focus:outline-none focus:border-[#9146FF]"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="twitch-button rounded-l-none"
          >
            Search
          </button>
        </div>
      )}

      <div className="max-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9146FF]"></div>
          </div>
        ) : activeTab === 'followed' ? (
          followedChannels.length > 0 ? (
            <ul className="divide-y divide-[#2d2d3a]">
              {followedChannels.map(channel => (
                <li 
                  key={channel.id}
                  className="py-2 px-1 hover:bg-[#2d2d3a] cursor-pointer flex items-center"
                  onClick={() => onChannelSelect(channel.login)}
                >
                  <img 
                    src={channel.profile_image_url} 
                    alt={channel.display_name} 
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span className="text-white">{channel.display_name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center py-4">No followed channels found.</p>
          )
        ) : (
          searchResults.length > 0 ? (
            <ul className="divide-y divide-[#2d2d3a]">
              {searchResults.map(channel => (
                <li 
                  key={channel.id}
                  className="py-2 px-1 hover:bg-[#2d2d3a] cursor-pointer flex items-center"
                  onClick={() => onChannelSelect(channel.login)}
                >
                  <img 
                    src={channel.profile_image_url} 
                    alt={channel.display_name} 
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span className="text-white">{channel.display_name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center py-4">
              {searchQuery ? 'No channels found matching your search.' : 'Enter a channel name to search.'}
            </p>
          )
        )}
      </div>
    </div>
  );
}