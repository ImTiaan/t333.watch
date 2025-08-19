# t333.watch Technical Challenges & Solutions

## Overview

This document outlines the key technical challenges in implementing t333.watch and provides detailed solutions for addressing them. These challenges have been identified based on the architecture plan and the specific requirements of the multi-stream viewer platform.

## 1. Performance with Multiple Streams

### Challenge

Loading and playing multiple Twitch streams simultaneously can be resource-intensive for users' browsers, potentially causing performance issues such as:

- High CPU and memory usage
- Reduced frame rates
- Audio synchronization problems
- Bandwidth constraints
- Browser tab crashes

This is especially critical when users want to watch 4+ streams simultaneously (premium feature).

### Solution

#### 1.1 Adaptive Quality Management

```javascript
// streamQualityManager.js
class StreamQualityManager {
  constructor(players) {
    this.players = players; // Array of TwitchPlayerManager instances
    this.qualityLevels = ['160p', '360p', '480p', '720p', '1080p', 'auto'];
    this.performanceMetrics = {
      fps: 60,
      memoryUsage: 0,
      cpuUsage: 0
    };
  }
  
  // Set quality based on number of active streams
  setQualityByStreamCount() {
    const streamCount = this.players.length;
    
    // Default quality strategy based on stream count
    let targetQuality = 'auto';
    
    if (streamCount > 3) {
      targetQuality = '720p';
    }
    if (streamCount > 6) {
      targetQuality = '480p';
    }
    if (streamCount > 8) {
      targetQuality = '360p';
    }
    
    this.players.forEach(player => {
      player.setQuality(targetQuality);
    });
    
    return targetQuality;
  }
  
  // Dynamically adjust quality based on performance metrics
  monitorAndAdjustQuality() {
    // Start monitoring performance
    this.performanceMonitorId = setInterval(() => {
      this.updatePerformanceMetrics();
      
      // If performance is degrading, reduce quality
      if (this.isPerformanceDegrading()) {
        this.reduceQuality();
      }
      
      // If we have headroom, consider increasing quality for active stream
      if (this.hasPerformanceHeadroom() && this.activePlayer) {
        this.increaseQualityForActiveStream();
      }
    }, 5000); // Check every 5 seconds
  }
  
  // Update performance metrics
  updatePerformanceMetrics() {
    // Measure FPS
    if (window.requestAnimationFrame) {
      let lastTime = performance.now();
      let frames = 0;
      
      const countFrames = (time) => {
        frames++;
        if (time - lastTime >= 1000) {
          this.performanceMetrics.fps = frames;
          frames = 0;
          lastTime = time;
        }
        window.requestAnimationFrame(countFrames);
      };
      
      window.requestAnimationFrame(countFrames);
    }
    
    // Get memory usage if available
    if (window.performance && window.performance.memory) {
      this.performanceMetrics.memoryUsage = 
        window.performance.memory.usedJSHeapSize / 
        window.performance.memory.jsHeapSizeLimit;
    }
    
    // Approximate CPU usage by measuring task duration
    const startTime = performance.now();
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }
    const endTime = performance.now();
    
    // Normalize to get a value between 0-1
    // Higher value means more CPU load (slower execution)
    this.performanceMetrics.cpuUsage = 
      Math.min((endTime - startTime) / 100, 1);
  }
  
  // Check if performance is degrading
  isPerformanceDegrading() {
    return (
      this.performanceMetrics.fps < 30 ||
      this.performanceMetrics.memoryUsage > 0.8 ||
      this.performanceMetrics.cpuUsage > 0.8
    );
  }
  
  // Check if we have performance headroom
  hasPerformanceHeadroom() {
    return (
      this.performanceMetrics.fps > 55 &&
      this.performanceMetrics.memoryUsage < 0.5 &&
      this.performanceMetrics.cpuUsage < 0.5
    );
  }
  
  // Reduce quality for all streams
  reduceQuality() {
    this.players.forEach(player => {
      const currentQuality = player.getQuality();
      const currentIndex = this.qualityLevels.indexOf(currentQuality);
      
      if (currentIndex > 0) {
        // Move one step down in quality
        player.setQuality(this.qualityLevels[currentIndex - 1]);
      }
    });
  }
  
  // Increase quality for active stream only
  increaseQualityForActiveStream() {
    const currentQuality = this.activePlayer.getQuality();
    const currentIndex = this.qualityLevels.indexOf(currentQuality);
    
    if (currentIndex < this.qualityLevels.length - 1) {
      // Move one step up in quality
      this.activePlayer.setQuality(this.qualityLevels[currentIndex + 1]);
    }
  }
  
  // Set active player (the one user is currently watching/listening to)
  setActivePlayer(player) {
    this.activePlayer = player;
    
    // Prioritize quality for active stream
    if (this.players.length > 3) {
      // Reduce quality for non-active streams
      this.players.forEach(p => {
        if (p !== player) {
          const currentQuality = p.getQuality();
          const currentIndex = this.qualityLevels.indexOf(currentQuality);
          
          if (currentIndex > 1) { // Don't go below 360p
            p.setQuality(this.qualityLevels[currentIndex - 1]);
          }
        }
      });
      
      // Increase quality for active stream if possible
      const activeQuality = player.getQuality();
      const activeIndex = this.qualityLevels.indexOf(activeQuality);
      
      if (activeIndex < this.qualityLevels.length - 1) {
        player.setQuality(this.qualityLevels[activeIndex + 1]);
      }
    }
  }
  
  // Stop monitoring
  stopMonitoring() {
    if (this.performanceMonitorId) {
      clearInterval(this.performanceMonitorId);
    }
  }
}
#### 1.2 Lazy Loading & Resource Management

```javascript
// streamResourceManager.js
class StreamResourceManager {
  constructor(containerElement) {
    this.containerElement = containerElement;
    this.streamContainers = [];
    this.activeStreams = new Set();
    this.observer = null;
  }
  
  // Initialize with stream containers
  initialize(streamContainers) {
    this.streamContainers = streamContainers;
    this.setupIntersectionObserver();
  }
  
  // Set up intersection observer to detect visible streams
  setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const streamId = entry.target.dataset.streamId;
          
          if (entry.isIntersecting) {
            // Stream is visible
            this.activateStream(streamId);
          } else {
            // Stream is not visible
            this.deactivateStream(streamId);
          }
        });
      },
      {
        root: this.containerElement,
        threshold: 0.1 // 10% visibility is enough to count as "visible"
      }
    );
    
    // Start observing all stream containers
    this.streamContainers.forEach(container => {
      this.observer.observe(container);
    });
  }
  
  // Activate a stream (load and play)
  activateStream(streamId) {
    if (!this.activeStreams.has(streamId)) {
      this.activeStreams.add(streamId);
      
      // Find the container
      const container = this.streamContainers.find(
        c => c.dataset.streamId === streamId
      );
      
      if (container) {
        // If the player hasn't been initialized yet
        if (!container.playerInitialized) {
          // Initialize the player
          const channel = container.dataset.channel;
          const player = new TwitchPlayerManager(
            container.id,
            channel,
            'auto',
            true // Start muted
          );
          
          container.playerInstance = player;
          container.playerInitialized = true;
        } else if (container.playerInstance) {
          // If player exists but was paused, resume
          container.playerInstance.play();
        }
      }
    }
  }
  
  // Deactivate a stream (pause or unload)
  deactivateStream(streamId) {
    if (this.activeStreams.has(streamId)) {
      this.activeStreams.delete(streamId);
      
      // Find the container
      const container = this.streamContainers.find(
        c => c.dataset.streamId === streamId
      );
      
      if (container && container.playerInstance) {
        // Pause the player to save resources
        container.playerInstance.pause();
        
        // Optionally, completely unload players that have been offscreen for a while
        if (this.streamContainers.length > 6) {
          // Only unload if we have many streams to save resources
          setTimeout(() => {
            // Check if still inactive after 30 seconds
            if (!this.activeStreams.has(streamId)) {
              container.playerInstance.dispose();
              container.playerInitialized = false;
              container.playerInstance = null;
            }
          }, 30000);
        }
      }
    }
  }
  
  // Clean up resources
  dispose() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.streamContainers.forEach(container => {
      if (container.playerInstance) {
        container.playerInstance.dispose();
      }
    });
    
    this.activeStreams.clear();
  }
}
```

#### 1.3 User Warnings and Recommendations

```jsx
// PerformanceWarning.jsx
import React, { useState, useEffect } from 'react';

const PerformanceWarning = ({ streamCount, isPremium }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [warningLevel, setWarningLevel] = useState('info');
  const [warningMessage, setWarningMessage] = useState('');
  
  useEffect(() => {
    // Determine if warning should be shown based on stream count
    if (streamCount > 6) {
      setShowWarning(true);
      setWarningLevel('warning');
      setWarningMessage(
        'Watching many streams simultaneously may affect performance. ' +
        'Consider closing some streams if you experience lag.'
      );
    } else if (streamCount > 3) {
      setShowWarning(true);
      setWarningLevel('info');
      setWarningMessage(
        'Tip: You can click on a stream to make it the active audio source.'
      );
    } else {
      setShowWarning(false);
    }
  }, [streamCount]);
  
  // Don't render anything if no warning
  if (!showWarning) {
    return null;
  }
  
  return (
    <div className={`performance-warning ${warningLevel}`}>
      <span className="warning-icon">
        {warningLevel === 'warning' ? '⚠️' : 'ℹ️'}
      </span>
      <span className="warning-message">{warningMessage}</span>
      {warningLevel === 'warning' && (
        <button 
          className="optimize-button"
          onClick={() => {
            // Trigger quality optimization
            window.dispatchEvent(new CustomEvent('optimize-stream-quality'));
          }}
        >
          Optimize Quality
        </button>
      )}
    </div>
  );
};

export default PerformanceWarning;
```

## 2. VOD Synchronization

### Challenge

Synchronizing multiple VOD (Video on Demand) playbacks presents several challenges:

- Different VODs may have different start times relative to the actual event
- Playback drift can occur over time due to buffering or network issues
- User interactions with individual players can break synchronization
- Determining the correct offset between streams can be difficult

### Solution

#### 2.1 Global Timeline Controller

```javascript
// vodSyncController.js
class VODSyncController {
  constructor() {
    this.players = []; // Array of TwitchPlayerManager instances
    this.offsets = new Map(); // Map of player IDs to time offsets (in seconds)
    this.globalTimestamp = 0; // Current global timeline position
    this.isPlaying = false; // Global playing state
    this.syncInterval = null; // Interval for periodic sync
    this.driftThreshold = 1.0; // Maximum allowed drift in seconds
    this.lastSyncTime = 0; // Last time we performed a sync
  }
  
  // Add a player to the controller
  addPlayer(player, initialOffset = 0) {
    this.players.push(player);
    this.offsets.set(player.id, initialOffset);
    
    // Listen for player events
    player.addEventListener('play', () => this.handlePlayerPlay(player));
    player.addEventListener('pause', () => this.handlePlayerPause(player));
    player.addEventListener('seek', (time) => this.handlePlayerSeek(player, time));
    
    // Initial sync
    this.syncPlayer(player);
  }
  
  // Remove a player from the controller
  removePlayer(player) {
    const index = this.players.indexOf(player);
    if (index !== -1) {
      this.players.splice(index, 1);
      this.offsets.delete(player.id);
    }
  }
  
  // Set offset for a specific player
  setPlayerOffset(player, offsetSeconds) {
    this.offsets.set(player.id, offsetSeconds);
    this.syncPlayer(player);
  }
  
  // Get current offset for a player
  getPlayerOffset(player) {
    return this.offsets.get(player.id) || 0;
  }
  
  // Handle player play event
  handlePlayerPlay(sourcePlayer) {
    // Update global state
    this.isPlaying = true;
    this.globalTimestamp = sourcePlayer.getCurrentTime() - this.getPlayerOffset(sourcePlayer);
    
    // Sync all other players
    this.players.forEach(player => {
      if (player !== sourcePlayer) {
        const targetTime = this.globalTimestamp + this.getPlayerOffset(player);
        player.seek(targetTime);
        player.play();
      }
    });
    
    // Start periodic sync
    this.startPeriodicSync();
  }
  
  // Handle player pause event
  handlePlayerPause(sourcePlayer) {
    // Update global state
    this.isPlaying = false;
    this.globalTimestamp = sourcePlayer.getCurrentTime() - this.getPlayerOffset(sourcePlayer);
    
    // Pause all other players
    this.players.forEach(player => {
      if (player !== sourcePlayer) {
        player.pause();
      }
    });
    
    // Stop periodic sync
    this.stopPeriodicSync();
  }
  
  // Handle player seek event
  handlePlayerSeek(sourcePlayer, time) {
    // Update global timestamp
    this.globalTimestamp = time - this.getPlayerOffset(sourcePlayer);
    
    // Sync all other players
    this.players.forEach(player => {
      if (player !== sourcePlayer) {
        const targetTime = this.globalTimestamp + this.getPlayerOffset(player);
        player.seek(targetTime);
      }
    });
  }
  
  // Seek to a specific global timestamp
  seekToGlobalTime(timestamp) {
    this.globalTimestamp = timestamp;
    
    // Sync all players to new timestamp
    this.players.forEach(player => {
      const targetTime = this.globalTimestamp + this.getPlayerOffset(player);
      player.seek(targetTime);
    });
  }
  
  // Sync a specific player to global timeline
  syncPlayer(player) {
    const targetTime = this.globalTimestamp + this.getPlayerOffset(player);
    player.seek(targetTime);
    
    if (this.isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }
  
  // Sync all players to global timeline
  syncAllPlayers() {
    this.players.forEach(player => {
      this.syncPlayer(player);
    });
    
    this.lastSyncTime = Date.now();
  }
  
  // Start periodic sync to prevent drift
  startPeriodicSync(intervalMs = 30000) {
    this.stopPeriodicSync(); // Clear any existing interval
    
    this.syncInterval = setInterval(() => {
      // Only perform sync if playing
      if (this.isPlaying) {
        // Check for drift first
        const driftDetected = this.checkForDrift();
        
        if (driftDetected) {
          // If drift detected, perform a full sync
          this.syncAllPlayers();
        }
      }
    }, intervalMs);
  }
  
  // Stop periodic sync
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  // Check for drift and return true if significant drift detected
  checkForDrift() {
    if (this.players.length <= 1) {
      return false;
    }
    
    const drifts = this.players.map(player => {
      const expectedTime = this.globalTimestamp + this.getPlayerOffset(player);
      const actualTime = player.getCurrentTime();
      return Math.abs(actualTime - expectedTime);
    });
    
    const maxDrift = Math.max(...drifts);
    return maxDrift > this.driftThreshold;
  }
  
  // Get drift information for UI display
  getDriftInfo() {
    return this.players.map(player => {
      const expectedTime = this.globalTimestamp + this.getPlayerOffset(player);
      const actualTime = player.getCurrentTime();
      const drift = actualTime - expectedTime;
      
      return {
        playerId: player.id,
        channelName: player.getChannelName(),
        drift,
        isDrifting: Math.abs(drift) > this.driftThreshold
      };
    });
  }
  
  // Create a timestamped link for sharing
  createTimestampedLink(baseUrl) {
    // Round to nearest second
    const timestamp = Math.round(this.globalTimestamp);
    return `${baseUrl}?t=${timestamp}`;
  }
  
  // Parse a timestamped link and seek to that time
  parseTimestampedLink(url) {
    try {
      const parsedUrl = new URL(url);
      const timestamp = parsedUrl.searchParams.get('t');
      
      if (timestamp) {
        // Convert to number and seek
        const time = parseFloat(timestamp);
        if (!isNaN(time)) {
          this.seekToGlobalTime(time);
          return true;
        }
      }
    } catch (error) {
      console.error('Error parsing timestamped link:', error);
    }
    
    return false;
  }
  
  // Clean up resources
  dispose() {
    this.stopPeriodicSync();
    this.players = [];
    this.offsets.clear();
  }
}
```
#### 2.2 Offset Adjustment UI

```jsx
// VODOffsetControls.jsx
import React, { useState, useEffect } from 'react';

const VODOffsetControls = ({ 
  syncController, 
  player, 
  channelName 
}) => {
  const [offset, setOffset] = useState(0);
  const [isDrifting, setIsDrifting] = useState(false);
  const [driftAmount, setDriftAmount] = useState(0);
  
  // Initialize offset from controller
  useEffect(() => {
    if (syncController && player) {
      const initialOffset = syncController.getPlayerOffset(player);
      setOffset(initialOffset);
    }
  }, [syncController, player]);
  
  // Check for drift periodically
  useEffect(() => {
    if (!syncController || !player) return;
    
    const checkDrift = () => {
      const driftInfo = syncController.getDriftInfo();
      const playerDrift = driftInfo.find(d => d.playerId === player.id);
      
      if (playerDrift) {
        setIsDrifting(playerDrift.isDrifting);
        setDriftAmount(playerDrift.drift);
      }
    };
    
    // Check immediately
    checkDrift();
    
    // Then check every 5 seconds
    const intervalId = setInterval(checkDrift, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [syncController, player]);
  
  // Handle offset change
  const handleOffsetChange = (newOffset) => {
    if (syncController && player) {
      // Update local state
      setOffset(newOffset);
      
      // Update controller
      syncController.setPlayerOffset(player, newOffset);
    }
  };
  
  // Handle fine adjustment buttons
  const adjustOffset = (seconds) => {
    handleOffsetChange(offset + seconds);
  };
  
  // Fix drift automatically
  const fixDrift = () => {
    if (syncController && player && isDrifting) {
      // Calculate new offset that would eliminate drift
      const newOffset = offset - driftAmount;
      handleOffsetChange(newOffset);
    }
  };
  
  return (
    <div className="vod-offset-controls">
      <div className="channel-info">
        <span className="channel-name">{channelName}</span>
        {isDrifting && (
          <span className="drift-warning">
            Drift detected: {driftAmount.toFixed(2)}s
            <button 
              className="fix-drift-button"
              onClick={fixDrift}
            >
              Fix
            </button>
          </span>
        )}
      </div>
      
      <div className="offset-controls">
        <span className="offset-label">Offset:</span>
        <div className="offset-buttons">
          <button onClick={() => adjustOffset(-5)}>-5s</button>
          <button onClick={() => adjustOffset(-1)}>-1s</button>
          <input
            type="number"
            value={offset}
            onChange={(e) => handleOffsetChange(parseFloat(e.target.value))}
            step="0.5"
          />
          <button onClick={() => adjustOffset(1)}>+1s</button>
          <button onClick={() => adjustOffset(5)}>+5s</button>
        </div>
      </div>
    </div>
  );
};

export default VODOffsetControls;
```

#### 2.3 Global Timeline UI

```jsx
// GlobalTimelineControls.jsx
import React, { useState, useEffect, useRef } from 'react';

const GlobalTimelineControls = ({ syncController }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const timelineRef = useRef(null);
  const isDraggingRef = useRef(false);
  
  // Update current time and playing state
  useEffect(() => {
    if (!syncController) return;
    
    const updateTime = () => {
      if (!isDraggingRef.current) {
        setCurrentTime(syncController.globalTimestamp);
        setIsPlaying(syncController.isPlaying);
      }
    };
    
    // Update immediately
    updateTime();
    
    // Then update every 250ms
    const intervalId = setInterval(updateTime, 250);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [syncController]);
  
  // Calculate duration based on longest VOD
  useEffect(() => {
    if (!syncController || !syncController.players.length) return;
    
    const calculateDuration = () => {
      const durations = syncController.players.map(player => {
        const playerDuration = player.getDuration();
        const playerOffset = syncController.getPlayerOffset(player);
        return playerDuration + playerOffset;
      });
      
      setDuration(Math.max(...durations));
    };
    
    // Calculate immediately
    calculateDuration();
    
    // Recalculate when players change
    const intervalId = setInterval(calculateDuration, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [syncController]);
  
  // Handle play/pause
  const togglePlayPause = () => {
    if (!syncController) return;
    
    if (isPlaying) {
      // Pause all players
      syncController.players.forEach(player => player.pause());
    } else {
      // Play all players
      syncController.players.forEach(player => player.play());
    }
  };
  
  // Handle timeline click/drag
  const handleTimelineInteraction = (e) => {
    if (!syncController || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    
    // Update local state immediately for responsive UI
    setCurrentTime(newTime);
    
    // Seek all players
    syncController.seekToGlobalTime(newTime);
  };
  
  // Handle timeline drag start
  const handleDragStart = () => {
    isDraggingRef.current = true;
  };
  
  // Handle timeline drag end
  const handleDragEnd = (e) => {
    handleTimelineInteraction(e);
    isDraggingRef.current = false;
  };
  
  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    return [
      h > 0 ? h.toString().padStart(2, '0') : null,
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };
  
  // Generate shareable link with current timestamp
  const generateShareLink = () => {
    if (!syncController) return;
    
    const baseUrl = window.location.href.split('?')[0];
    const link = syncController.createTimestampedLink(baseUrl);
    setShareUrl(link);
    
    // Copy to clipboard
    navigator.clipboard.writeText(link)
      .then(() => {
        // Show toast notification
        alert('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
  };
  
  return (
    <div className="global-timeline-controls">
      <div className="time-display">
        <span className="current-time">{formatTime(currentTime)}</span>
        <span className="duration-separator">/</span>
        <span className="duration">{formatTime(duration)}</span>
      </div>
      
      <div 
        className="timeline"
        ref={timelineRef}
        onClick={handleTimelineInteraction}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div 
          className="progress-bar"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      
      <div className="playback-controls">
        <button 
          className="play-pause-button"
          onClick={togglePlayPause}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <button 
          className="share-button"
          onClick={generateShareLink}
        >
          🔗 Share at current time
        </button>
        
        {shareUrl && (
          <div className="share-url">
            <input 
              type="text" 
              value={shareUrl} 
              readOnly 
              onClick={(e) => e.target.select()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalTimelineControls;
```

## 3. Twitch API Limitations

### Challenge

Working with the Twitch API presents several challenges:

- Rate limits (800 requests per minute per token)
- Token expiration and refresh requirements
- API changes and deprecations
- Limited webhook functionality
- Caching requirements to avoid excessive API calls
### Solution

#### 3.1 Token Management System

```javascript
// twitchTokenManager.js
const axios = require('axios');
const crypto = require('crypto');
const { supabase } = require('./supabaseClient');
const Redis = require('ioredis');

// Connect to Redis
const redis = new Redis(process.env.REDIS_URL);

// Environment variables
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Encryption/decryption functions
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

class TwitchTokenManager {
  constructor() {
    this.appAccessToken = null;
    this.appTokenExpiry = 0;
    this.tokenRefreshLock = false;
  }
  
  // Get a valid app access token (client credentials flow)
  async getAppAccessToken() {
    // Check if we have a valid token in memory
    const now = Math.floor(Date.now() / 1000);
    if (this.appAccessToken && now < this.appTokenExpiry - 300) {
      return this.appAccessToken;
    }
    
    // Check if we have a valid token in Redis
    const cachedToken = await redis.get('twitch:app_access_token');
    if (cachedToken) {
      const tokenData = JSON.parse(cachedToken);
      if (now < tokenData.expires_at - 300) {
        this.appAccessToken = tokenData.token;
        this.appTokenExpiry = tokenData.expires_at;
        return this.appAccessToken;
      }
    }
    
    // Prevent multiple simultaneous token refreshes
    if (this.tokenRefreshLock) {
      // Wait for the lock to be released
      await new Promise(resolve => {
        const checkLock = () => {
          if (!this.tokenRefreshLock) {
            resolve();
          } else {
            setTimeout(checkLock, 100);
          }
        };
        checkLock();
      });
      
      // Try again now that the lock is released
      return this.getAppAccessToken();
    }
    
    try {
      this.tokenRefreshLock = true;
      
      // Get a new token from Twitch
      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: TWITCH_CLIENT_ID,
          client_secret: TWITCH_CLIENT_SECRET,
          grant_type: 'client_credentials'
        }
      });
      
      const { access_token, expires_in } = response.data;
      
      // Calculate expiry time
      const expiresAt = now + expires_in;
      
      // Store in memory
      this.appAccessToken = access_token;
      this.appTokenExpiry = expiresAt;
      
      // Store in Redis
      await redis.set('twitch:app_access_token', JSON.stringify({
        token: access_token,
        expires_at: expiresAt
      }), 'EX', expires_in);
      
      return access_token;
    } catch (error) {
      console.error('Error getting app access token:', error);
      throw new Error('Failed to get app access token');
    } finally {
      this.tokenRefreshLock = false;
    }
  }
  
  // Get a valid user access token
  async getUserAccessToken(userId) {
    try {
      // Get encrypted tokens from database
      const { data, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      // Decrypt tokens
      const accessToken = decrypt(data.access_token);
      const refreshToken = decrypt(data.refresh_token);
      const expiresAt = new Date(data.expires_at).getTime() / 1000;
      
      // Check if token is expired or about to expire
      const now = Math.floor(Date.now() / 1000);
      if (now >= expiresAt - 300) {
        // Token is expired or about to expire, refresh it
        return this.refreshUserToken(userId, refreshToken);
      }
      
      return accessToken;
    } catch (error) {
      console.error('Error getting user access token:', error);
      throw new Error('Failed to get user access token');
    }
  }
  
  // Refresh a user's access token
  async refreshUserToken(userId, refreshToken) {
    try {
      // Get a new token from Twitch
      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: TWITCH_CLIENT_ID,
          client_secret: TWITCH_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }
      });
      
      const { access_token, refresh_token, expires_in } = response.data;
      
      // Calculate expiry time
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = new Date((now + expires_in) * 1000);
      
      // Encrypt tokens
      const encryptedAccessToken = encrypt(access_token);
      const encryptedRefreshToken = encrypt(refresh_token);
      
      // Update database
      const { error } = await supabase
        .from('user_tokens')
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: expiresAt.toISOString()
        })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return access_token;
    } catch (error) {
      console.error('Error refreshing user token:', error);
      
      // If refresh fails, we need to remove the token and require re-authentication
      await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', userId);
      
      throw new Error('Failed to refresh user token, re-authentication required');
    }
  }
  
  // Store new tokens for a user
  async storeUserTokens(userId, accessToken, refreshToken, expiresIn) {
    try {
      // Calculate expiry time
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = new Date((now + expiresIn) * 1000);
      
      // Encrypt tokens
      const encryptedAccessToken = encrypt(accessToken);
      const encryptedRefreshToken = encrypt(refreshToken);
      
      // Store in database
      const { error } = await supabase
        .from('user_tokens')
        .upsert({
          user_id: userId,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error storing user tokens:', error);
      throw new Error('Failed to store user tokens');
    }
  }
  
  // Revoke a user's tokens
  async revokeUserTokens(userId) {
    try {
      // Get encrypted tokens from database
      const { data, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No tokens found, nothing to revoke
          return;
        }
        throw error;
      }
      
      // Decrypt access token
      const accessToken = decrypt(data.access_token);
      
      // Revoke token with Twitch
      await axios.post('https://id.twitch.tv/oauth2/revoke', null, {
        params: {
          client_id: TWITCH_CLIENT_ID,
          token: accessToken
        }
      });
      
      // Delete from database
      await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error revoking user tokens:', error);
      // Still try to delete from database even if Twitch revocation fails
      await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', userId);
    }
  }
}

module.exports = new TwitchTokenManager();
```

#### 3.2 API Client with Rate Limiting and Caching

```javascript
// twitchApiClient.js
const axios = require('axios');
const tokenManager = require('./twitchTokenManager');
const Redis = require('ioredis');

// Connect to Redis
const redis = new Redis(process.env.REDIS_URL);

// Environment variables
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;

class TwitchApiClient {
  constructor() {
    this.clientId = TWITCH_CLIENT_ID;
    this.baseUrl = 'https://api.twitch.tv/helix';
    this.rateLimitRemaining = 800;
    this.rateLimitReset = 0;
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }
  
  // Add a request to the queue
  async queueRequest(method, endpoint, params = {}, data = null, useAppToken = true, userId = null) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        method,
        endpoint,
        params,
        data,
        useAppToken,
        userId,
        resolve,
        reject
      });
      
      // Start processing the queue if not already processing
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }
  
  // Process the request queue
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      // Check if we need to wait for rate limit reset
      const now = Math.floor(Date.now() / 1000);
      if (this.rateLimitRemaining <= 5 && now < this.rateLimitReset) {
        const waitTime = (this.rateLimitReset - now) * 1000;
        console.log(`Rate limit almost reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Get the next request
      const request = this.requestQueue.shift();
      
      try {
        // Execute the request
        const result = await this.executeRequest(
          request.method,
          request.endpoint,
          request.params,
          request.data,
          request.useAppToken,
          request.userId
        );
        
        // Resolve the promise
        request.resolve(result);
      } catch (error) {
        // Reject the promise
        request.reject(error);
      }
    } finally {
      this.isProcessingQueue = false;
      
      // Continue processing the queue if there are more requests
      if (this.requestQueue.length > 0) {
        this.processQueue();
      }
    }
  }
  
  // Execute a request with proper headers and error handling
  async executeRequest(method, endpoint, params = {}, data = null, useAppToken = true, userId = null) {
    try {
      // Get the appropriate token
      let token;
      if (useAppToken) {
        token = await tokenManager.getAppAccessToken();
      } else if (userId) {
        token = await tokenManager.getUserAccessToken(userId);
      } else {
        throw new Error('Either useAppToken must be true or userId must be provided');
      }
      
      // Make the request
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Client-Id': this.clientId
        },
        params,
        data
      });
      
      // Update rate limit info
      this.rateLimitRemaining = parseInt(response.headers['ratelimit-remaining'] || '800');
      this.rateLimitReset = parseInt(response.headers['ratelimit-reset'] || '0');
      
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 429) {
          // Rate limited, wait and retry
          const retryAfter = parseInt(error.response.headers['retry-after'] || '1');
          console.log(`Rate limited, retrying after ${retryAfter} seconds`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.executeRequest(method, endpoint, params, data, useAppToken, userId);
        } else if (error.response.status === 401 && !useAppToken && userId) {
          // Token might be invalid, try to refresh and retry
          try {
            await tokenManager.getUserAccessToken(userId); // This will refresh if needed
            return this.executeRequest(method, endpoint, params, data, useAppToken, userId);
          } catch (refreshError) {
            throw new Error('Authentication failed, re-login required');
          }
        }
        
        throw new Error(`Twitch API error: ${error.response.status} ${error.response.data.message || error.response.statusText}`);
      }
      
      throw error;
    }
  }
  
  // Get user information
  async getUsers(userIds = [], userLogins = [], userId = null) {
    // Generate cache key
    const cacheKey = `twitch:users:${userIds.join(',')}-${userLogins.join(',')}`;
    
    // Check cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Build params
    const params = {};
    if (userIds.length > 0) {
      params.id = userIds;
    }
    if (userLogins.length > 0) {
      params.login = userLogins;
    }
    
    // Make request
    const data = await this.queueRequest('GET', '/users', params, null, !userId, userId);
    
    // Cache for 1 hour
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);
    
    return data;
  }
  
  // Get streams information
  async getStreams(userIds = [], userLogins = [], gameIds = [], type = 'all', first = 20) {
    // Generate cache key
    const cacheKey = `twitch:streams:${userIds.join(',')}-${userLogins.join(',')}-${gameIds.join(',')}-${type}-${first}`;
    
    // Check cache, but with a short TTL since stream status changes frequently
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Build params
    const params = { first };
    if (userIds.length > 0) {
      params.user_id = userIds;
    }
    if (userLogins.length > 0) {
      params.user_login = userLogins;
    }
    if (gameIds.length > 0) {
      params.game_id = gameIds;
    }
    if (type !== 'all') {
      params.type = type;
    }
    
    // Make request
    const data = await this.queueRequest('GET', '/streams', params);
    
    // Cache for 1 minute
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 60);
    
    return data;
  }
  
  // Get followed channels for a user
  async getFollowedChannels(userId) {
    // This requires a user token
    if (!userId) {
      throw new Error('userId is required for getFollowedChannels');
    }
    
    // Generate cache key
    const cacheKey = `twitch:followed:${userId}`;
    
    // Check cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Get user's Twitch ID
    const userData = await this.getUsers([], [], userId);
    const twitchUserId = userData.data[0].id;
    
    // Make request
    const data = await this.queueRequest(
      'GET',
      '/users/follows',
      { from_id: twitchUserId, first: 100 },
      null,
      false,
      userId
    );
    
    // If we have follows, get the channel details
    if (data.data.length > 0) {
      const followedIds = data.data.map(follow => follow.to_id);
      
      // Get channel details
      const channelsData = await this.getUsers(followedIds, [], userId);
      
      // Merge data
      data.channels = channelsData.data;
    } else {
      data.channels = [];
    }
    
    // Cache for 15 minutes
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 900);
    
    return data;
  }
  
  // Check if channels are live
  async checkLiveChannels(channelLogins) {
    if (!channelLogins || channelLogins.length === 0) {
      return { data: [] };
    }
    
    // Split into chunks of 100 (Twitch API limit)
    const chunks = [];
    for (let i = 0; i < channelLogins.length; i += 100) {
      chunks.push(channelLogins.slice(i, i + 100));
    }
    
    // Get stream data for each chunk
    const results = [];
    
    for (const chunk of chunks) {
      const data = await this.getStreams([], chunk);
      results.push(...data.data);
    }
    
    return { data: results };
  }
}

module.exports = new TwitchApiClient();
```

## 4. Scaling Considerations

### Challenge

As the user base grows, the platform will face scaling challenges:

- Increased database load
- Higher API request volume
- More concurrent streams
- Greater cache requirements
- Potential for service disruptions

### Solution

#### 4.1 Database Scaling Strategy

```javascript
// Database optimization techniques

// 1. Efficient indexing
// Create indexes for common query patterns
// Example: Index on pack visibility and tags for discovery queries
CREATE INDEX idx_packs_visibility_tags ON packs(visibility) INCLUDE (tags);

// 2. Connection pooling
// Configure Supabase connection pool
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const pool = new Pool({
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// 3. Query optimization
// Use specific columns instead of SELECT *
async function getPackSummary(packId) {
  const { data, error } = await supabase
    .from('packs')
    .select('id, title, description, tags, owner_id, view_count')
    .eq('id', packId)
    .single();
  
  return { data, error };
}

// 4. Pagination for large result sets
async function getPublicPacks(page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  
  const { data, error, count } = await supabase
    .from('packs')
    .select('id, title, description, tags, owner_id, view_count', { count: 'exact' })
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);
  
  return { data, error, count, totalPages: Math.ceil(count / pageSize) };
}

// 5. Database sharding (for future scale)
// Implement application-level sharding based on user ID
function getUserShard(userId) {
  // Simple hash-based sharding
  const hash = userId.split('-')[0]; // Use first part of UUID
  const shardNumber = parseInt(hash, 16) % SHARD_COUNT;
  return `shard_${shardNumber}`;
}
```

#### 4.2 Caching Strategy

```javascript
// cacheManager.js
const Redis = require('ioredis');

// Connect to Redis
const redis = new Redis(process.env.REDIS_URL);

class CacheManager {
  constructor() {
    this.defaultTTL = 3600; // 1 hour in seconds
  }
  
  // Set cache with TTL
  async set(key, value, ttl = this.defaultTTL) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttl);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }
  
  // Get from cache
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  // Delete from cache
  async delete(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }
  
  // Clear cache by pattern
  async clearPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache clear pattern error:', error);
      return false;
    }
  }
  
  // Cache with automatic invalidation
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    // Try to get from cache first
    const cachedData = await this.get(key);
    if (cachedData !== null) {
      return cachedData;
    }
    
    // If not in cache, fetch fresh data
    const freshData = await fetchFn();
    
    // Store in cache
    await this.set(key, freshData, ttl);
    
    return freshData;
  }
  
  // Multi-level caching strategy
  async getOrSetMultiLevel(key, fetchFn, options = {}) {
    const {
      l1TTL = 60, // 1 minute for L1 (memory) cache
      l2TTL = this.defaultTTL, // Default for L2 (Redis) cache
      bypassL1 = false
    } = options;
    
    // Check L1 cache (memory) if not bypassed
    if (!bypassL1 && this.memoryCache[key] && this.memoryCache[key].expiry > Date.now()) {
      return this.memoryCache[key].data;
    }
    
    // Check L2 cache (Redis)
    const l2Data = await this.get(key);
    if (l2Data !== null) {
      // Update L1 cache
      if (!bypassL1) {
        this.memoryCache[key] = {
          data: l2Data,
          expiry: Date.now() + l1TTL * 1000
        };
      }
      return l2Data;
    }
    
    // Fetch fresh data
    const freshData = await fetchFn();
    
    // Update L2 cache
    await this.set(key, freshData, l2TTL);
    
    // Update L1 cache
    if (!bypassL1) {
      this.memoryCache[key] = {
        data: freshData,
        expiry: Date.now() + l1TTL * 1000
      };
    }
    
    return freshData;
  }
  
  // Memory cache for frequently accessed data
  memoryCache = {};
  
  // Clear expired items from memory cache
  cleanMemoryCache() {
    const now = Date.now();
    Object.keys(this.memoryCache).forEach(key => {
      if (this.memoryCache[key].expiry < now) {
        delete this.memoryCache[key];
      }
    });
  }
  
  // Start periodic cleaning of memory cache
  startMemoryCacheCleaning(intervalMs = 60000) {
    setInterval(() => this.cleanMemoryCache(), intervalMs);
  }
}

module.exports = new CacheManager();
```

#### 4.3 Load Balancing and Horizontal Scaling

```javascript
// Fly.io configuration for horizontal scaling
// fly.toml

[env]
  PORT = "8080"
  NODE_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 2
  processes = ["app"]

[services.concurrency]
  hard_limit = 25
  soft_limit = 20

[metrics]
  port = 9091
  path = "/metrics"

# Scale up based on CPU and memory usage
[metrics.rules]
  [[metrics.rules.scale]]
    metric = "cpu"
    operator = ">"
    value = 70
    period = "1m"
    scale_up = 1
    scale_down = 0

  [[metrics.rules.scale]]
    metric = "memory"
    operator = ">"
    value = 80
    period = "1m"
    scale_up = 1
    scale_down = 0
```

#### 4.4 Error Handling and Circuit Breaking

```javascript
// circuitBreaker.js
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.monitorInterval = options.monitorInterval || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.services = new Map();
    
    // Start monitoring
    this.startMonitoring();
  }
  
  // Register a service
  registerService(serviceName, options = {}) {
    this.services.set(serviceName, {
      failureThreshold: options.failureThreshold || this.failureThreshold,
      resetTimeout: options.resetTimeout || this.resetTimeout,
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0
    });
  }
  
  // Execute a function with circuit breaker protection
  async execute(serviceName, fn) {
    // Get service state
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not registered`);
    }
    
    // Check if circuit is open
    if (service.state === 'OPEN') {
      // Check if reset timeout has elapsed
      const now = Date.now();
      if (now - service.lastFailureTime >= service.resetTimeout) {
        // Transition to half-open
        service.state = 'HALF_OPEN';
      } else {
        // Circuit is still open
        throw new Error(`Circuit for ${serviceName} is open`);
      }
    }
    
    try {
      // Execute the function
      const result = await fn();
      
      // Success, reset failure count
      if (service.state === 'HALF_OPEN') {
        // Transition back to closed
        service.state = 'CLOSED';
      }
      service.failureCount = 0;
      
      return result;
    } catch (error) {
      // Increment failure count
      service.failureCount++;
      service.lastFailureTime = Date.now();
      
      // Check if threshold exceeded
      if (service.failureCount >= service.failureThreshold) {
        // Open the circuit
        service.state = 'OPEN';
      }
      
      throw error;
    }
  }
  
  // Start monitoring services
  startMonitoring() {
    setInterval(() => {
      const now = Date.now();
      
      // Check each service
      this.services.forEach((service, serviceName) => {
        // If circuit is open and reset timeout has elapsed
        if (service.state === 'OPEN' && now - service.lastFailureTime >= service.resetTimeout) {
          // Transition to half-open
          service.state = 'HALF_OPEN';
          console.log(`Circuit for ${serviceName} transitioned to HALF_OPEN`);
        }
      });
    }, this.monitorInterval);
  }
  
  // Get service state
  getServiceState(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not registered`);
    }
    
    return {
      state: service.state,
      failureCount: service.failureCount,
      lastFailureTime: service.lastFailureTime
    };
  }
}

module.exports = new CircuitBreaker();
```

## 5. Security Considerations

### Challenge

Implementing a secure platform that handles user authentication, API tokens, and payment processing requires addressing several security concerns:

- Secure storage of API tokens
- Protection against common web vulnerabilities
- Secure payment processing
- Data privacy compliance

### Solution

#### 5.1 Secure Token Storage

As shown in the Token Management System above, we use encryption for storing sensitive tokens:

```javascript
// Encryption/decryption functions
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');