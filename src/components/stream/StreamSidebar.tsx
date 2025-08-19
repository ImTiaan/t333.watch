'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import ChannelSelector from './ChannelSelector';

interface StreamSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddStream: (channelName: string) => void;
}

/**
 * A sidebar for adding streams to the viewer
 * Contains a form for adding streams and a list of followed channels
 */
export default function StreamSidebar({ isOpen, onToggle, onAddStream }: StreamSidebarProps) {
  const { isAuthenticated, user } = useAuth();
  const [newChannel, setNewChannel] = useState('');

  const handleAddStream = () => {
    if (!newChannel) return;
    onAddStream(newChannel);
    setNewChannel('');
  };

  return (
    <div
      className={`fixed top-16 right-0 h-[calc(100%-80px)] w-80 bg-[#18181b] shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex justify-between items-center p-4 border-b border-[#2d2d3a]">
        <h2 className="text-xl font-bold text-white">Add Stream</h2>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-[#2d2d3a] text-gray-400 hover:text-white"
          title="Close Sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
        {/* Manual Channel Input */}
        <div className="mb-6">
          <label htmlFor="channel-input" className="block text-sm font-medium text-gray-400 mb-2">
            Enter Twitch Channel Name
          </label>
          <div className="flex">
            <input
              id="channel-input"
              type="text"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              placeholder="e.g., shroud, pokimane"
              className="flex-grow bg-[#0e0e10] text-white border border-[#2d2d3a] rounded-l px-4 py-2 focus:outline-none focus:border-[#9146FF]"
              onKeyDown={(e) => e.key === 'Enter' && handleAddStream()}
            />
            <button
              onClick={handleAddStream}
              className="twitch-button rounded-l-none"
              disabled={!newChannel}
            >
              Add
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2d2d3a]"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-[#18181b] text-gray-400 text-sm">OR</span>
          </div>
        </div>

        {/* Followed Channels */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            {isAuthenticated ? 'Select from your followed channels' : 'Select from popular channels'}
          </h3>
          <ChannelSelector onChannelSelect={(channel) => {
            onAddStream(channel);
          }} />
        </div>

        {/* Tips */}
        <div className="mt-6 p-3 bg-[#0e0e10] rounded border border-[#2d2d3a]">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Tips</h4>
          <ul className="text-xs text-gray-400 space-y-2">
            <li>• Click the star icon to make a stream primary (larger)</li>
            <li>• Click the speaker icon to enable audio for a stream</li>
            <li>• Only one stream can have audio at a time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}