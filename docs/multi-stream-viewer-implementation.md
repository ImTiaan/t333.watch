# Multi-Stream Viewer Implementation

## Overview

The multi-stream viewer is the core feature of t333.watch, allowing users to watch multiple Twitch streams simultaneously in a responsive grid layout. This document outlines the technical implementation details using the Twitch Embed IFrame API.

## Technical Architecture

### 1. Twitch Embed IFrame API Integration

```javascript
// Core player component architecture
class TwitchPlayerManager {
  constructor(containerId, channel, quality = 'auto', muted = true) {
    this.player = new Twitch.Player(containerId, {
      channel,
      width: '100%',
      height: '100%',
      quality,
      muted,
      parent: ['t333.watch']
    });
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.player.addEventListener(Twitch.Player.READY, () => {
      console.log('Player ready');
    });
    
    this.player.addEventListener(Twitch.Player.PLAY, () => {
      // Track play state for analytics
    });
  }
  
  setMuted(muted) {
    this.player.setMuted(muted);
  }
  
  // Additional methods for volume control, quality settings, etc.
}
```

### 2. Responsive Grid Layout System

```javascript
// Grid layout manager
const GridLayoutManager = {
  calculateLayout(streamCount) {
    // Determine optimal grid layout based on stream count
    switch(streamCount) {
      case 1:
        return { rows: 1, cols: 1 };
      case 2:
        return { rows: 1, cols: 2 };
      case 3:
        return { rows: 1, cols: 3 };
      case 4:
        return { rows: 2, cols: 2 };
      case 5:
      case 6:
        return { rows: 2, cols: 3 };
      case 7:
      case 8:
      case 9:
        return { rows: 3, cols: 3 };
      default:
        // For premium users with more than 9 streams
        // Implement scrollable grid or pagination
        return { rows: 3, cols: 3 };
    }
  },
  
  applyLayout(containerElement, layout) {
    containerElement.style.display = 'grid';
    containerElement.style.gridTemplateRows = `repeat(${layout.rows}, 1fr)`;
    containerElement.style.gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
    containerElement.style.gap = '8px';
  }
};
```

### 3. Audio Control System

```javascript
// Audio control manager
class AudioManager {
  constructor() {
    this.players = new Map(); // Map of player IDs to TwitchPlayerManager instances
    this.activeAudioPlayerId = null;
  }
  
  registerPlayer(playerId, playerManager) {
    this.players.set(playerId, playerManager);
    
    // Initially mute all players
    playerManager.setMuted(true);
  }
  
  setActiveAudio(playerId) {
    // Mute previous active player if exists
    if (this.activeAudioPlayerId && this.players.has(this.activeAudioPlayerId)) {
      this.players.get(this.activeAudioPlayerId).setMuted(true);
    }
    
    // Unmute new active player
    if (this.players.has(playerId)) {
      this.players.get(playerId).setMuted(false);
      this.activeAudioPlayerId = playerId;
    }
  }
  
  // Optional: "Follow audio to mouse" experimental feature
  enableFollowAudioToMouse() {
    // Implementation for automatically switching audio to the stream
    // the user is currently hovering over
  }
}
```

### 4. Performance Optimization

```javascript
// Performance optimization strategies
const PerformanceOptimizer = {
  // Lazy load players that are offscreen
  setupLazyLoading(playerContainers) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const containerId = entry.target.id;
        if (entry.isIntersecting) {
          // Initialize player when container becomes visible
          this.initializePlayer(containerId);
        } else {
          // Optionally pause or unload player when not visible
          this.pausePlayer(containerId);
        }
      });
    }, { threshold: 0.1 });
    
    playerContainers.forEach(container => {
      observer.observe(container);
    });
  },
  
  // Adjust quality based on number of active streams
  adjustQualityForStreamCount(players, streamCount) {
    let targetQuality = 'auto';
    
    if (streamCount > 4) {
      targetQuality = 'medium';
    }
    if (streamCount > 6) {
      targetQuality = 'low';
    }
    
    players.forEach(player => {
      player.setQuality(targetQuality);
    });
  },
  
  // Monitor and report performance metrics
  monitorPerformance() {
    // Track FPS, memory usage, etc.
    // Alert user if performance is degrading
  }
};
```

## Frontend Implementation

### React Component Structure

```jsx
// StreamGrid.jsx
import React, { useState, useEffect, useRef } from 'react';
import TwitchPlayer from './TwitchPlayer';

const StreamGrid = ({ channels, isPremium }) => {
  const [activeAudioChannel, setActiveAudioChannel] = useState(null);
  const gridRef = useRef(null);
  
  // Apply limit based on premium status
  const maxChannels = isPremium ? 9 : 3;
  const displayChannels = channels.slice(0, maxChannels);
  
  useEffect(() => {
    if (gridRef.current && displayChannels.length > 0) {
      const layout = GridLayoutManager.calculateLayout(displayChannels.length);
      GridLayoutManager.applyLayout(gridRef.current, layout);
    }
    
    // Set first channel as default audio source if none active
    if (!activeAudioChannel && displayChannels.length > 0) {
      setActiveAudioChannel(displayChannels[0]);
    }
  }, [displayChannels, activeAudioChannel]);
  
  const handleAudioToggle = (channel) => {
    setActiveAudioChannel(channel);
  };
  
  return (
    <div className="stream-grid" ref={gridRef}>
      {displayChannels.map(channel => (
        <TwitchPlayer
          key={channel}
          channel={channel}
          muted={channel !== activeAudioChannel}
          onAudioToggle={() => handleAudioToggle(channel)}
        />
      ))}
      
      {!isPremium && channels.length > maxChannels && (
        <div className="premium-upgrade-overlay">
          <p>Upgrade to Premium to watch more than 3 streams</p>
          <button>Upgrade Now</button>
        </div>
      )}
    </div>
  );
};

export default StreamGrid;
```

```jsx
// TwitchPlayer.jsx
import React, { useEffect, useRef } from 'react';

const TwitchPlayer = ({ channel, muted, onAudioToggle }) => {
  const playerRef = useRef(null);
  const playerInstance = useRef(null);
  
  useEffect(() => {
    if (playerRef.current && !playerInstance.current) {
      // Initialize Twitch player
      playerInstance.current = new TwitchPlayerManager(
        playerRef.current.id,
        channel,
        'auto',
        muted
      );
    }
    
    return () => {
      // Cleanup player on unmount
      if (playerInstance.current) {
        // Cleanup logic
      }
    };
  }, [channel]);
  
  useEffect(() => {
    // Update mute state when it changes
    if (playerInstance.current) {
      playerInstance.current.setMuted(muted);
    }
  }, [muted]);
  
  return (
    <div className="twitch-player-container">
      <div 
        id={`twitch-player-${channel}`} 
        ref={playerRef} 
        className="twitch-player"
      />
      <div className="player-controls">
        <button 
          className={`audio-toggle ${!muted ? 'active' : ''}`}
          onClick={onAudioToggle}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <div className="channel-info">
          <span className="channel-name">{channel}</span>
        </div>
      </div>
    </div>
  );
};

export default TwitchPlayer;
```

## VOD Implementation (Phase 2+)

For VOD playback, we'll extend the player implementation to support:

```javascript
// VOD player with sync capabilities
class SyncedVODManager {
  constructor(players) {
    this.players = players; // Array of TwitchPlayerManager instances
    this.globalTimestamp = 0;
    this.offsets = new Map(); // Map of player IDs to time offsets
    this.syncInterval = null;
  }
  
  // Set global timestamp and sync all players
  seekToGlobalTime(timestamp) {
    this.globalTimestamp = timestamp;
    this.syncAllPlayers();
  }
  
  // Set offset for a specific player
  setPlayerOffset(playerId, offsetSeconds) {
    this.offsets.set(playerId, offsetSeconds);
    this.syncPlayer(playerId);
  }
  
  // Sync a specific player to global time + its offset
  syncPlayer(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;
    
    const offset = this.offsets.get(playerId) || 0;
    const targetTime = this.globalTimestamp + offset;
    
    player.seek(targetTime);
  }
  
  // Sync all players to global time + their offsets
  syncAllPlayers() {
    this.players.forEach(player => {
      const offset = this.offsets.get(player.id) || 0;
      const targetTime = this.globalTimestamp + offset;
      player.seek(targetTime);
    });
  }
  
  // Start periodic sync to prevent drift
  startPeriodicSync(intervalMs = 30000) {
    this.syncInterval = setInterval(() => {
      this.syncAllPlayers();
    }, intervalMs);
  }
  
  // Stop periodic sync
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  // Check for drift and warn if significant
  checkForDrift() {
    const drifts = this.players.map(player => {
      const offset = this.offsets.get(player.id) || 0;
      const expectedTime = this.globalTimestamp + offset;
      const actualTime = player.getCurrentTime();
      return Math.abs(actualTime - expectedTime);
    });
    
    const maxDrift = Math.max(...drifts);
    return maxDrift > 1.0; // Return true if drift > 1 second
  }
}
```

## Mobile Optimizations

For mobile devices, we'll implement:

1. Responsive layout that adapts to smaller screens
2. Swipe gestures to navigate between streams
3. Picture-in-Picture mode for premium users

```javascript
// Mobile-specific optimizations
const MobileOptimizer = {
  setupSwipeNavigation(container, channels, activeIndex, setActiveIndex) {
    let startX = 0;
    
    container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });
    
    container.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      
      // Threshold for swipe detection
      if (Math.abs(diff) > 50) {
        if (diff > 0 && activeIndex < channels.length - 1) {
          // Swipe left - next channel
          setActiveIndex(activeIndex + 1);
        } else if (diff < 0 && activeIndex > 0) {
          // Swipe right - previous channel
          setActiveIndex(activeIndex - 1);
        }
      }
    });
  },
  
  setupPictureInPicture(videoElement) {
    // Only available for premium users
    if (document.pictureInPictureEnabled) {
      videoElement.addEventListener('click', () => {
        if (document.pictureInPictureElement !== videoElement) {
          videoElement.requestPictureInPicture();
        } else {
          document.exitPictureInPicture();
        }
      });
    }
  }
};
```

## Technical Considerations

1. **Browser Support**: The implementation will target modern browsers (Chrome, Firefox, Safari, Edge) with fallbacks for older browsers where possible.

2. **Bandwidth Management**: We'll implement adaptive quality settings based on the number of active streams and available bandwidth.

3. **Error Handling**: Robust error handling for stream loading failures, API errors, and network issues.

4. **Accessibility**: Keyboard navigation, screen reader support, and WCAG 2.1 compliance.

5. **Analytics**: Track player performance, stream quality, and user interactions for optimization.

## Testing Strategy

1. **Unit Tests**: Test individual components and utility functions.
2. **Integration Tests**: Test the interaction between components.
3. **Performance Tests**: Measure load times, memory usage, and CPU utilization.
4. **Cross-browser Testing**: Ensure compatibility across major browsers.
5. **Mobile Testing**: Test on various mobile devices and screen sizes.

## Future Enhancements

1. **AI-powered auto-sync** for VODs based on audio fingerprinting.
2. **Scene change detection** for smart navigation between key moments.
3. **Custom layouts** allowing users to resize and reposition streams.
4. **Stream highlights** automatically generated from multi-POV content.