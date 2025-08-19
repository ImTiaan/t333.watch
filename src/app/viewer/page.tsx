'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { config } from '@/lib/config';
import { canAddMoreStreams, getMaxStreams } from '@/lib/premium';
import ChannelSelector from '@/components/stream/ChannelSelector';
import UpgradeModal from '@/components/premium/UpgradeModal';
import StreamSidebar from '@/components/stream/StreamSidebar';
import SidebarToggle from '@/components/stream/SidebarToggle';
import { getGridTemplateStyles, getGridArea, getPlaceholderCount } from '@/lib/gridUtils';
import performanceMonitor from '@/lib/performance';
import StreamPerformanceTracker from '@/components/stream/StreamPerformanceTracker';
import { StreamPerformanceWarning } from '@/components/ui/PerformanceWarning';
import StreamQualityManager, { StreamQuality } from '@/components/stream/StreamQualityManager';
import PackMetadata from '@/components/seo/PackMetadata';
import ShareModal from '@/components/packs/ShareModal';
import analytics, { EventCategory, StreamEvents, PerformanceEvents } from '@/lib/analytics';

// Define the Twitch Embed type
declare global {
  interface Window {
    Twitch?: {
      Embed: new (
        elementId: string,
        options: {
          width: string | number;
          height: string | number;
          channel?: string;
          video?: string;
          collection?: string;
          parent: string[];
          autoplay?: boolean;
          muted?: boolean;
          allowfullscreen?: boolean;
          layout?: string;
          theme?: string;
          time?: string;
          // Auth options
          auth?: {
            token: string;
            clientId: string;
          };
        }
      ) => {
        addEventListener: (event: string, callback: Function) => void;
        removeEventListener: (event: string, callback: Function) => void;
        getPlayer: () => {
          setMuted: (muted: boolean) => void;
          getMuted: () => boolean;
          setVolume: (volume: number) => void;
          getVolume: () => number;
          play: () => void;
          pause: () => void;
          setQuality: (quality: string) => void;
          setChannel: (channel: string) => void;
        };
      };
    };
  }
}

// Define the stream type
interface Stream {
  id: string;
  channel: string;
  muted: boolean;
  playerId: string;
  embed?: any;
  isPrimary?: boolean;
}

// Helper function to determine grid layout based on stream count
function getGridTemplateClass(streamCount: number): string {
  switch (streamCount) {
    case 0:
      return 'grid-cols-1';
    case 1:
      return 'grid-cols-1';
    case 2:
      return 'grid-cols-2';
    case 3:
      return 'grid-cols-3';
    case 4:
      return 'grid-cols-2 grid-rows-2';
    case 5:
      return 'grid-cols-3';
    case 6:
      return 'grid-cols-3 grid-rows-2';
    case 7:
      return 'grid-cols-4';
    case 8:
      return 'grid-cols-4 grid-rows-2';
    case 9:
      return 'grid-cols-3 grid-rows-3';
    default:
      return 'grid-cols-4';
  }
}

// Loading component to display while the viewer is loading
function ViewerLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e10]">
      <div className="bg-[#18181b] p-8 rounded-lg border border-[#2d2d3a] max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Loading streams...</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9146FF]"></div>
        </div>
      </div>
    </div>
  );
}

// Viewer content component that uses searchParams
function ViewerContent() {
  const { isAuthenticated, isLoading, user, getAccessToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [newChannel, setNewChannel] = useState('');
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [isLoadingPack, setIsLoadingPack] = useState(false);
  const [packTitle, setPackTitle] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<StreamQuality>('auto');
  const [packDescription, setPackDescription] = useState<string | null>(null);
  const [streamChannels, setStreamChannels] = useState<string[]>([]);
// State to track if we're viewing a public pack
const [isPublicPack, setIsPublicPack] = useState(false);

// State to control the share modal
const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  
  // Initialize performance monitoring when component mounts
  useEffect(() => {
    // Start performance monitoring
    performanceMonitor.start();
    
    // Log initial page load performance
    performanceMonitor.logMetric({
      context: 'Page Load',
      details: {
        page: 'viewer',
        url: window.location.href
      }
    });
    
    // Configure summary logging interval (every 30 seconds)
    performanceMonitor.configureSummaryInterval(30000);
    
    // Clean up when component unmounts
    return () => {
      performanceMonitor.stop();
    };
  }, []);

  // Check if the pack is public before requiring authentication
  useEffect(() => {
    const packId = searchParams.get('pack');
    if (!packId) {
      // If no pack ID, require authentication
      if (!isLoading && !isAuthenticated) {
        router.push('/');
      }
      return;
    }

    // Check if the pack is public
    const checkPackVisibility = async () => {
      try {
        const response = await fetch(`/api/packs/${packId}/visibility`);
        if (response.ok) {
          const data = await response.json();
          if (data.visibility === 'public') {
            setIsPublicPack(true);
          } else if (!isAuthenticated && !isLoading) {
            // If pack is private and user is not authenticated, redirect to home
            router.push('/');
          }
        } else if (!isAuthenticated && !isLoading) {
          // If error fetching pack or pack doesn't exist, redirect if not authenticated
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking pack visibility:', error);
        if (!isAuthenticated && !isLoading) {
          router.push('/');
        }
      }
    };

    checkPackVisibility();
  }, [isLoading, isAuthenticated, router, searchParams]);

  // Load pack if pack ID is provided in URL
  useEffect(() => {
    const packId = searchParams.get('pack');
    if (!packId) return;
    
    // Allow loading if authenticated or viewing a public pack
    if (!isAuthenticated && !isPublicPack) return;
    
    const loadPack = async () => {
      setIsLoadingPack(true);
      try {
        const response = await fetch(`/api/packs/${packId}`);
        if (!response.ok) {
          throw new Error('Failed to load pack');
        }
        
        const data = await response.json();
        const pack = data.pack;
        
        // Set pack title
        setPackTitle(pack.title);
        
        // Add streams from the pack
        if (pack.pack_streams && pack.pack_streams.length > 0) {
          const packStreams = pack.pack_streams
            .sort((a: any, b: any) => a.order - b.order)
            .map((stream: any, index: number) => ({
              id: Date.now() + '-' + stream.twitch_channel,
              channel: stream.twitch_channel,
              muted: true, // All streams start muted except the first one
              playerId: `twitch-player-${Date.now()}-${stream.twitch_channel}`,
              isPrimary: index === 0, // First stream is primary by default
            }));
          
          setStreams(packStreams);
          
          // Set the first stream as active audio
          setActiveAudioIndex(0);
        }
      } catch (error) {
        console.error('Error loading pack:', error);
      } finally {
        setIsLoadingPack(false);
      }
    };
    
    loadPack();
  }, [searchParams, isAuthenticated, isPublicPack]);

  // We're removing the automatic click handler as it was causing infinite loops
  // Instead, we'll rely on the manual "Start All Streams" button

  // Initialize Twitch embeds when streams change
  useEffect(() => {
    console.log("Initializing Twitch embeds with streams:", streams.map(s => `${s.channel} (isPrimary: ${s.isPrimary})`));
    
    // Load the Twitch embed script if not already loaded
    if (!document.getElementById('twitch-embed-script')) {
      const script = document.createElement('script');
      script.id = 'twitch-embed-script';
      script.src = 'https://embed.twitch.tv/embed/v1.js';
      script.async = true;
      document.body.appendChild(script);
      
      // Wait for script to load before initializing embeds
      script.onload = initializeEmbeds;
      return;
    }
    
    // Initialize embeds if script is already loaded
    if (window.Twitch) {
      initializeEmbeds();
    }
    
    async function initializeEmbeds() {
      if (!window.Twitch) return;
      
      console.log("Starting embed initialization for streams:",
        streams.map(s => `${s.channel} (isPrimary: ${s.isPrimary}, playerId: ${s.playerId})`));
      
      for (const stream of streams) {
        // Skip if embed already exists
        if (embedRefs.current[stream.playerId]) {
          console.log(`Embed for ${stream.channel} already exists, skipping initialization`);
          continue;
        }
        
        // Create container element if it doesn't exist
        let containerElement = document.getElementById(stream.playerId);
        if (!containerElement) {
          console.log(`Container element for ${stream.channel} (${stream.playerId}) not found`);
          continue;
        }
        
        try {
          // Create embed options
          const embedOptions: any = {
            width: '100%',
            height: '100%',
            channel: stream.channel,
            parent: [window.location.hostname],
            muted: stream.muted,
            layout: 'video',
            allowfullscreen: true,
            autoplay: true,
          };
          
          // Add auth token if authenticated
          if (isAuthenticated) {
            // Get the access token
            const token = await getAccessToken();
            
            if (token) {
              embedOptions.auth = {
                token,
                clientId: config.twitch.clientId
              };
            }
          }
          
          // Add type guard to ensure window.Twitch is defined
          if (!window.Twitch) return;
          
          // Create the embed
          const embed = new window.Twitch.Embed(stream.playerId, embedOptions);
          
          // Store embed reference
          embedRefs.current[stream.playerId] = embed;
          
          // Add event listener for ready
          embed.addEventListener('ready', () => {
            const player = embed.getPlayer();
            player.setMuted(stream.muted);
          });
        } catch (error) {
          console.error('Error initializing Twitch embed:', error);
        }
      }
      
      // Apply audio settings - but don't call setActiveAudio which would cause an infinite loop
      if (activeAudioIndex !== null) {
        // Just update the players directly without changing state
        streams.forEach((stream, i) => {
          const embed = embedRefs.current[stream.playerId];
          if (embed && embed.getPlayer) {
            const player = embed.getPlayer();
            if (player) {
              player.setMuted(i !== activeAudioIndex);
            }
          }
        });
      }
    }
    
    // Cleanup function
    return () => {
      // We don't need to explicitly destroy Twitch embeds
      // They will be garbage collected when their container elements are removed
    };
  }, [streams, activeAudioIndex, getAccessToken]);

  // Add a new stream
  const addStream = (channelName?: string) => {
    // Track interaction start
    performanceMonitor.trackInteractionStart('add-stream');
    
    const channelToAdd = channelName || newChannel;
    if (!channelToAdd) {
      performanceMonitor.trackInteractionEnd('add-stream');
      return;
    }
    
    // Track analytics event - attempt to add stream
    analytics.trackStreamEvent(StreamEvents.ADD_STREAM, {
      channel: channelToAdd,
      currentCount: streams.length,
      isPremium: user?.premium_flag || false
    });
    
    // Check if we've reached the absolute maximum streams
    const maxStreams = getMaxStreams(user);
    if (streams.length >= maxStreams) {
      // Track max streams reached event
      analytics.trackStreamEvent(StreamEvents.MAX_STREAMS_REACHED, {
        maxStreams,
        isPremium: user?.premium_flag || false,
        attemptedChannel: channelToAdd
      });
      
      alert(`Maximum of ${maxStreams} streams reached. Please remove a stream before adding a new one.`);
      performanceMonitor.trackInteractionEnd('add-stream');
      return;
    }
    
    // Check if we've reached the free tier limit and user is not premium
    if (!canAddMoreStreams(user, streams.length)) {
      // Track premium feature prompt event
      analytics.trackEvent(EventCategory.FEATURE, 'premium_feature_prompt', {
        feature: 'additional_streams',
        currentCount: streams.length,
        maxFreeStreams: 3,
        attemptedChannel: channelToAdd
      });
      
      // Show upgrade modal
      setIsUpgradeModalOpen(true);
      performanceMonitor.trackInteractionEnd('add-stream');
      return;
    }

    // Check if the channel is already in the streams
    const isChannelAlreadyAdded = streams.some(
      stream => stream.channel.toLowerCase() === channelToAdd.toLowerCase().trim()
    );

    if (isChannelAlreadyAdded) {
      alert(`Channel "${channelToAdd}" is already in your viewer.`);
      performanceMonitor.trackInteractionEnd('add-stream');
      return;
    }
    
    // Log performance metric for stream count
    performanceMonitor.logMetric({
      context: 'Stream Count',
      details: {
        count: streams.length + 1,
        action: 'add',
        channel: channelToAdd
      }
    });
    
    // Generate new playerIds for all existing streams to ensure consistency
    const newStreams = streams.map((stream, i) => {
      const newPlayerId = `twitch-player-${Date.now()}-${i}-${stream.channel}`;
      return {
        ...stream,
        playerId: newPlayerId
      };
    });
    
    // Generate a unique player ID for the new stream
    const newPlayerId = `twitch-player-${Date.now()}-${newStreams.length}-${channelToAdd}`;
    
    // Add the new stream
    const newStream: Stream = {
      id: Date.now().toString(),
      channel: channelToAdd.toLowerCase().trim(),
      muted: streams.length > 0, // Mute all streams except the first one
      playerId: newPlayerId,
      isPrimary: streams.length === 0, // First stream is primary by default
    };

    // Clear the embedRefs to force recreation of Twitch embed instances
    embedRefs.current = {};
    
    // Update the streams state with the new array plus the new stream
    setStreams([...newStreams, newStream]);
    setNewChannel('');
    
    // Set the active audio to the first stream if not already set
    if (activeAudioIndex === null && streams.length === 0) {
      setActiveAudioIndex(0);
    }
    
    // Track interaction end
    performanceMonitor.trackInteractionEnd('add-stream');
  };

  // Remove a stream
  const removeStream = (id: string) => {
    // Track interaction start
    performanceMonitor.trackInteractionStart('remove-stream');
    
    const index = streams.findIndex(stream => stream.id === id);
    if (index === -1) {
      performanceMonitor.trackInteractionEnd('remove-stream');
      return;
    }

    // Get the channel name for logging
    const channelName = streams[index].channel;
    
    // Track analytics event - remove stream
    analytics.trackStreamEvent(StreamEvents.REMOVE_STREAM, {
      channel: channelName,
      streamIndex: index,
      isPrimary: streams[index].isPrimary,
      currentCount: streams.length
    });

    // Check if we're removing the primary stream
    const isPrimaryRemoved = streams[index].isPrimary;

    // Create a new array without the removed stream
    let newStreams = [...streams];
    newStreams.splice(index, 1);
    
    // Log performance metric for stream count
    performanceMonitor.logMetric({
      context: 'Stream Count',
      details: {
        count: newStreams.length,
        action: 'remove',
        channel: channelName
      }
    });
    
    // If the primary stream was removed and there are still streams,
    // set the first stream as primary
    if (isPrimaryRemoved && newStreams.length > 0) {
      newStreams[0] = {
        ...newStreams[0],
        isPrimary: true
      };
    }
    
    // Generate new playerIds for all remaining streams to force recreation
    newStreams = newStreams.map((stream, i) => {
      const newPlayerId = `twitch-player-${Date.now()}-${i}-${stream.channel}`;
      return {
        ...stream,
        playerId: newPlayerId
      };
    });
    
    // Clear the embedRefs to force recreation of Twitch embed instances
    embedRefs.current = {};
    
    // Update active audio index if needed
    if (activeAudioIndex === index) {
      setActiveAudioIndex(newStreams.length > 0 ? 0 : null);
    } else if (activeAudioIndex !== null && activeAudioIndex > index) {
      setActiveAudioIndex(activeAudioIndex - 1);
    }
    
    // Update the streams state
    setStreams(newStreams);
    
    // Track interaction end
    performanceMonitor.trackInteractionEnd('remove-stream');
  };


  // Set a stream as primary and also set its audio as active
  const setPrimaryStream = (id: string) => {
    // Track interaction start
    performanceMonitor.trackInteractionStart('set-primary-stream');
    
    console.log(`Setting stream ${id} as primary`);
    
    // Find the index of the stream we want to make primary
    const streamIndex = streams.findIndex(stream => stream.id === id);
    if (streamIndex === -1) {
      console.error(`Stream with id ${id} not found`);
      performanceMonitor.trackInteractionEnd('set-primary-stream');
      return;
    }
    
    // Track analytics event - set primary stream
    analytics.trackStreamEvent(StreamEvents.SET_PRIMARY, {
      channel: streams[streamIndex].channel,
      streamIndex,
      totalStreams: streams.length
    });
    
    // Find the stream we want to make primary
    const streamToMakePrimary = streams[streamIndex];
    console.log(`Making stream ${streamToMakePrimary.channel} primary`);
    
    // Find the current primary stream index
    const currentPrimaryIndex = streams.findIndex(stream => stream.isPrimary);
    
    // Determine which stream should have active audio (the new primary stream)
    const audioIndex = streamIndex;
    setActiveAudioIndex(audioIndex);
    
    // Create a new array with updated isPrimary, muted flags, and new playerIds
    // This forces recreation of the Twitch embeds to prevent black screens
    const newStreams = streams.map((stream, i) => {
      // Generate a new playerId for each stream to force recreation
      const newPlayerId = `twitch-player-${Date.now()}-${i}-${stream.channel}`;
      
      return {
        ...stream,
        // Update isPrimary flag - only the selected stream is primary
        isPrimary: i === streamIndex,
        // Update muted flag - only the primary stream has audio
        muted: i !== audioIndex,
        // Update playerId to force recreation of the Twitch embed
        playerId: newPlayerId
      };
    });
    
    // Log the updated streams array
    console.log('Updated streams array:', newStreams.map(s =>
      `${s.channel}: isPrimary=${s.isPrimary}, muted=${s.muted}, playerId=${s.playerId}`
    ));
    
    // Log performance metric for primary stream change
    performanceMonitor.logMetric({
      context: 'Primary Stream',
      details: {
        channel: streamToMakePrimary.channel,
        previousPrimary: currentPrimaryIndex !== -1 ? streams[currentPrimaryIndex].channel : 'none',
        streamCount: streams.length
      }
    });
    
    // Clear the embedRefs to force recreation of Twitch embed instances
    embedRefs.current = {};
    
    // Update the streams state with the new array - single state update
    // that handles both primary status and audio changes
    setStreams(newStreams);
    
    // Track interaction end
    performanceMonitor.trackInteractionEnd('set-primary-stream');
  };

  // Reference to store Twitch embed instances
  const embedRefs = useRef<{ [key: string]: any }>({});

  // Set active audio by controlling the Twitch player
  const setActiveAudio = (index: number) => {
    // Track interaction start
    performanceMonitor.trackInteractionStart('set-active-audio');
    
    if (index < 0 || index >= streams.length) {
      performanceMonitor.trackInteractionEnd('set-active-audio');
      return;
    }
    
    // Get the channel name for logging
    const channelName = streams[index].channel;
    
    // Update active audio index
    setActiveAudioIndex(index);
    
    // Track analytics event - change active audio
    analytics.trackStreamEvent(StreamEvents.CHANGE_AUDIO, {
      channel: channelName,
      streamIndex: index,
      isPrimary: streams[index].isPrimary || false,
      totalStreams: streams.length
    });
    
    // Log performance metric for audio change
    performanceMonitor.logMetric({
      context: 'Audio Change',
      details: {
        channel: channelName,
        streamIndex: index,
        streamCount: streams.length
      }
    });
    
    // We don't need to regenerate playerIds here since we're just changing audio
    // and not repositioning streams in the grid
    const newStreams = streams.map((stream, i) => ({
      ...stream,
      muted: i !== index,
    }));
    
    // Update the actual players if they exist
    streams.forEach((stream, i) => {
      const embed = embedRefs.current[stream.playerId];
      if (embed && embed.getPlayer) {
        const player = embed.getPlayer();
        if (player) {
          player.setMuted(i !== index);
        }
      }
    });
    
    // Log the updated streams array to verify isPrimary flags are preserved
    console.log('setActiveAudio - Updated streams:', newStreams.map(s =>
      `${s.channel}: isPrimary=${s.isPrimary}, muted=${s.muted}`
    ));
    
    setStreams(newStreams);
    
    // Track interaction end
    performanceMonitor.trackInteractionEnd('set-active-audio');
  };
  
  // Function to handle quality changes for all streams
  const handleQualityChange = (quality: StreamQuality) => {
    setCurrentQuality(quality);
    
    // Track quality change
    analytics.trackPerformanceEvent(PerformanceEvents.AUTO_QUALITY_CHANGE, {
      previousQuality: currentQuality,
      newQuality: quality,
      streamCount: streams.length,
      isPremium: user?.premium_flag || false
    });
    
    // Apply quality change to all stream players
    Object.keys(embedRefs.current).forEach(playerId => {
      const embed = embedRefs.current[playerId];
      if (embed && embed.getPlayer) {
        try {
          const player = embed.getPlayer();
          if (player && player.setQuality) {
            player.setQuality(quality);
          }
        } catch (error) {
          console.error('Error setting quality:', error);
        }
      }
    });
  };

  // Show loading state while checking authentication or loading pack
  if (isLoading || isLoadingPack) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e10]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9146FF]"></div>
      </div>
    );
  }

  // Allow viewing if authenticated or viewing a public pack
  if (!isAuthenticated && !isPublicPack) {
    return null;
  }

  return (
    <div className="container mx-auto p-2 relative">
      {/* Pack title only shown if viewing a saved pack */}
      {packTitle && (
        <div className="mb-2">
          <h2 className="text-xl font-bold">{packTitle}</h2>
          <p className="text-gray-400 text-sm">Viewing saved pack</p>
        </div>
      )}

      {/* Stream Grid */}
      {streams.length > 0 && (
        <div className="space-y-4">
          {/* Debug info - hidden in production */}
          {/*
          <div className="p-2 bg-gray-800 text-xs text-gray-300 rounded">
            <p>Streams: {streams.length}</p>
            <p>Grid Template: {getGridTemplateStyles(streams.length).gridTemplateAreas}</p>
            <p>Streams: {streams.map(s => s.channel).join(', ')}</p>
          </div>
          */}
          
          <div
            className="grid gap-4"
            style={{
              gridTemplateAreas: getGridTemplateStyles(streams.length).gridTemplateAreas,
              gridTemplateColumns: getGridTemplateStyles(streams.length).gridTemplateColumns,
              gridTemplateRows: getGridTemplateStyles(streams.length).gridTemplateRows,
            }}
          >
            {streams.map((stream, index) => {
              const isPrimary = stream.isPrimary || false;
              
              // Calculate the grid area based on whether this is the primary stream
              // This ensures the primary stream is always in the primary position
              // We need to use a different approach to ensure the primary stream is always in the primary position
              let gridArea;
              if (isPrimary) {
                gridArea = 'primary';
              } else {
                // For secondary streams, we need to calculate the secondary index
                // Count how many secondary streams come before this one
                let secondaryIndex = 0;
                for (let i = 0; i < streams.length; i++) {
                  const s = streams[i];
                  if (s.id === stream.id) {
                    break;
                  }
                  if (!s.isPrimary) {
                    secondaryIndex++;
                  }
                }
                gridArea = `secondary${secondaryIndex + 1}`;
              }
              
              // Log the grid area assignment
              console.log(`Stream ${stream.channel} (id: ${stream.id}): isPrimary=${isPrimary}, gridArea=${gridArea}, index=${index}`);
              
              // Add a key that includes the isPrimary status to force re-render when it changes
              const streamKey = `${stream.id}-${isPrimary ? 'primary' : 'secondary'}`;
              
              return (
                <div
                  key={streamKey}
                  className={`bg-black relative rounded overflow-hidden aspect-video ${isPrimary ? 'primary-stream' : 'secondary-stream'}`}
                  style={{ gridArea }}
                >
                  <div
                    id={stream.playerId}
                    className="absolute inset-0 w-full h-full"
                  ></div>
                  
                  {/* Stream Controls Overlay */}
                  <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-center">
                    <div className="text-white font-medium truncate">{stream.channel}</div>
                    <div className="flex gap-2">
                      {!isPrimary && (
                        <button
                          onClick={() => setPrimaryStream(stream.id)}
                          className="p-1 rounded bg-black/50 hover:bg-[#9146FF]/70"
                          title="Make Primary Stream"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => setActiveAudio(index)}
                        className={`p-1 rounded ${activeAudioIndex === index ? 'bg-[#9146FF]' : 'bg-black/50 hover:bg-black/70'}`}
                        title={activeAudioIndex === index ? 'Active Audio' : 'Set as Active Audio'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 01-1.414-2.536m-1.414 2.536a9 9 0 01-2.758-6.036m2.758 6.036a9 9 0 002.758 6.036" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeStream(stream.id)}
                        className="p-1 rounded bg-black/50 hover:bg-red-500/70"
                        title="Remove Stream"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Primary Stream is indicated by the purple border */}
                  
                  {/* Stream Performance Tracker (invisible component) */}
                  <StreamPerformanceTracker
                    streamId={stream.id}
                    playerId={stream.playerId}
                    embed={embedRefs.current[stream.playerId]}
                    isVisible={true}
                  />
                </div>
              );
            })}
            
            {/* Add placeholder slots to fill the grid */}
            {Array.from({ length: getPlaceholderCount(streams.length) }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="bg-[#18181b] border-2 border-dashed border-[#2d2d3a] rounded flex items-center justify-center aspect-video"
                style={{ gridArea: `secondary${streams.length + index + 1}` }}
              >
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-[#9146FF] hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Action Buttons - Fixed Position */}
      <div className="fixed right-6 bottom-6 flex flex-col gap-3 z-10">
        {/* Save as Pack Button - Only shown if not viewing a saved pack */}
        {!packTitle && (
          <button
            className="bg-[#9146FF] text-white p-3 rounded-full shadow-lg hover:bg-[#7a2df0] transition-colors"
            title="Save as Pack"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>
        )}
        
        {/* Share Button */}
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="bg-[#9146FF] text-white p-3 rounded-full shadow-lg hover:bg-[#7a2df0] transition-colors"
          title="Share"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
        
        {/* Add Stream Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="bg-[#9146FF] text-white p-3 rounded-full shadow-lg hover:bg-[#7a2df0] transition-colors"
          title="Add Stream"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
      
      {/* Sidebar Toggle */}
      <SidebarToggle onClick={() => setIsSidebarOpen(true)} isOpen={isSidebarOpen} />
      
      {/* Stream Sidebar */}
      <StreamSidebar
        onAddStream={addStream}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(false)}
      />
      
      {/* Empty State */}
      {streams.length === 0 && (
        <div className="bg-[#18181b] border border-[#2d2d3a] rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#9146FF] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">No Streams Added</h2>
          <p className="text-gray-400 mb-6">
            Add Twitch channels to start watching multiple streams simultaneously.
          </p>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="twitch-button mx-auto"
          >
            Add Stream
          </button>
        </div>
      )}
      
      {/* Performance Warning for Stream Count */}
      <StreamPerformanceWarning
        streamCount={streams.length}
        isPremium={user?.premium_flag || false}
      />
      
      {/* Stream Quality Manager - Automatically adjusts quality based on performance */}
      <StreamQualityManager
        streamCount={streams.length}
        onQualityChange={handleQualityChange}
      />
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
      
      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        packId={searchParams.get('pack') || undefined}
        packTitle={packTitle || 'Twitch Stream Pack'}
        packDescription={packDescription || 'Watch multiple Twitch streams simultaneously'}
        streams={streams.map(s => s.channel)}
      />
    </div>
  );
}

// Main export component that wraps ViewerContent in a Suspense boundary
export default function Viewer() {
  return (
    <Suspense fallback={<ViewerLoading />}>
      <ViewerContent />
    </Suspense>
  );
}