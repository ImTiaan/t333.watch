# Packs System Implementation

## Overview

The Packs system is a core feature of t333.watch that allows users to save, share, and discover collections of streams. This document outlines the technical implementation details of the Packs system, including database schema, API endpoints, and frontend components.

## Database Schema

The Packs system will be implemented using PostgreSQL via Supabase with the following schema:

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  twitch_id VARCHAR NOT NULL UNIQUE,
  display_name VARCHAR NOT NULL,
  premium_flag BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by Twitch ID
CREATE INDEX idx_users_twitch_id ON users(twitch_id);
```

### Packs Table

```sql
CREATE TABLE packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  visibility VARCHAR NOT NULL CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups and filtering
CREATE INDEX idx_packs_owner_id ON packs(owner_id);
CREATE INDEX idx_packs_visibility ON packs(visibility);
CREATE INDEX idx_packs_tags ON packs USING GIN(tags);
```

### Pack_Streams Table

```sql
CREATE TABLE pack_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  twitch_channel VARCHAR NOT NULL,
  display_order INTEGER NOT NULL,
  offset_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by pack_id
CREATE INDEX idx_pack_streams_pack_id ON pack_streams(pack_id);
```

### Pack_Followers Table (Phase 2+)

```sql
CREATE TABLE pack_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pack_id, user_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_pack_followers_pack_id ON pack_followers(pack_id);
CREATE INDEX idx_pack_followers_user_id ON pack_followers(user_id);
```

### Notifications Table (Phase 2+)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL CHECK (event_type IN ('pack_live', 'trending', 'followed_update')),
  payload JSONB NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by user_id
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
```

## Supabase Real-time Updates

We'll leverage Supabase's real-time capabilities to provide instant updates when Packs are modified:

```javascript
// Subscribe to changes on a specific pack
const packSubscription = supabase
  .from(`packs:id=eq.${packId}`)
  .on('UPDATE', payload => {
    // Update pack details in UI
    updatePackDetails(payload.new);
  })
  .on('DELETE', payload => {
    // Handle pack deletion
    navigateToHome();
  })
  .subscribe();

// Subscribe to changes on streams within a pack
const streamsSubscription = supabase
  .from(`pack_streams:pack_id=eq.${packId}`)
  .on('INSERT', payload => {
    // Add new stream to UI
    addStreamToGrid(payload.new);
  })
  .on('UPDATE', payload => {
    // Update stream details in UI
    updateStreamInGrid(payload.new);
  })
  .on('DELETE', payload => {
    // Remove stream from UI
    removeStreamFromGrid(payload.old.id);
  })
  .subscribe();
```

## API Endpoints

The following RESTful API endpoints will be implemented to support the Packs system:

### Packs Endpoints

```
GET /api/packs
- Query parameters: visibility, tags, owner_id, limit, offset
- Returns: List of packs matching criteria

GET /api/packs/:id
- Returns: Detailed pack information including streams

POST /api/packs
- Body: { title, description, tags, visibility, streams }
- Returns: Created pack

PUT /api/packs/:id
- Body: { title, description, tags, visibility }
- Returns: Updated pack

DELETE /api/packs/:id
- Returns: Success status

GET /api/packs/trending
- Query parameters: limit, offset, tags
- Returns: List of trending packs based on algorithm

GET /api/packs/user/:userId
- Returns: List of packs created by a specific user

POST /api/packs/:id/clone
- Returns: New cloned pack (premium only)

POST /api/packs/:id/follow
- Returns: Follow status (premium only)

DELETE /api/packs/:id/follow
- Returns: Unfollow status
```

### Pack Streams Endpoints

```
POST /api/packs/:packId/streams
- Body: { twitch_channel, display_order }
- Returns: Created stream

PUT /api/packs/:packId/streams/:streamId
- Body: { display_order, offset_seconds }
- Returns: Updated stream

DELETE /api/packs/:packId/streams/:streamId
- Returns: Success status

PUT /api/packs/:packId/streams/reorder
- Body: { streamIds } (array of stream IDs in new order)
- Returns: Success status
```

### Notifications Endpoints (Phase 2+)

```
GET /api/notifications
- Query parameters: limit, offset, read
- Returns: List of notifications for current user

PUT /api/notifications/:id/read
- Returns: Updated notification

PUT /api/notifications/read-all
- Returns: Success status
```
## API Implementation (Node.js with Express)

```javascript
// packs.controller.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabaseClient');
const auth = require('../middleware/auth');
const premium = require('../middleware/premium');

// Get all packs (with filtering)
router.get('/', async (req, res) => {
  try {
    const { visibility, tags, owner_id, limit = 20, offset = 0 } = req.query;
    
    let query = supabase
      .from('packs')
      .select(`
        *,
        owner:users(id, display_name),
        streams:pack_streams(*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters if provided
    if (visibility) {
      query = query.eq('visibility', visibility);
    }
    
    if (tags && tags.length) {
      query = query.contains('tags', tags);
    }
    
    if (owner_id) {
      query = query.eq('owner_id', owner_id);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific pack
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('packs')
      .select(`
        *,
        owner:users(id, display_name),
        streams:pack_streams(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Increment view count
    await supabase
      .from('packs')
      .update({ view_count: data.view_count + 1 })
      .eq('id', id);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new pack
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, tags, visibility, streams } = req.body;
    const userId = req.user.id;
    
    // Check if user is premium if trying to save more than 3 streams
    if (streams && streams.length > 3) {
      const { data: user } = await supabase
        .from('users')
        .select('premium_flag')
        .eq('id', userId)
        .single();
      
      if (!user.premium_flag) {
        return res.status(403).json({ 
          error: 'Premium subscription required to save more than 3 streams' 
        });
      }
    }
    
    // Create pack
    const { data: pack, error: packError } = await supabase
      .from('packs')
      .insert({
        owner_id: userId,
        title,
        description,
        tags,
        visibility
      })
      .select()
      .single();
    
    if (packError) throw packError;
    
    // Add streams if provided
    if (streams && streams.length) {
      const streamsToInsert = streams.map((stream, index) => ({
        pack_id: pack.id,
        twitch_channel: stream.twitch_channel,
        display_order: index,
        offset_seconds: stream.offset_seconds || 0
      }));
      
      const { error: streamsError } = await supabase
        .from('pack_streams')
        .insert(streamsToInsert);
      
      if (streamsError) throw streamsError;
    }
    
    res.status(201).json(pack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a pack
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, visibility } = req.body;
    const userId = req.user.id;
    
    // Check if user owns the pack
    const { data: pack } = await supabase
      .from('packs')
      .select('owner_id')
      .eq('id', id)
      .single();
    
    if (pack.owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this pack' });
    }
    
    const { data, error } = await supabase
      .from('packs')
      .update({
        title,
        description,
        tags,
        visibility,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a pack
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user owns the pack
    const { data: pack } = await supabase
      .from('packs')
      .select('owner_id')
      .eq('id', id)
      .single();
    
    if (pack.owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this pack' });
    }
    
    const { error } = await supabase
      .from('packs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clone a pack (premium only)
router.post('/:id/clone', auth, premium, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get original pack
    const { data: originalPack, error: packError } = await supabase
      .from('packs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (packError) throw packError;
    
    // Create new pack
    const { data: newPack, error: newPackError } = await supabase
      .from('packs')
      .insert({
        owner_id: userId,
        title: `${originalPack.title} (Clone)`,
        description: originalPack.description,
        tags: originalPack.tags,
        visibility: 'private' // Default to private for clones
      })
      .select()
      .single();
    
    if (newPackError) throw newPackError;
    
    // Get original streams
    const { data: originalStreams, error: streamsError } = await supabase
      .from('pack_streams')
      .select('*')
      .eq('pack_id', id);
    
    if (streamsError) throw streamsError;
    
    // Clone streams
    if (originalStreams.length) {
      const streamsToInsert = originalStreams.map(stream => ({
        pack_id: newPack.id,
        twitch_channel: stream.twitch_channel,
        display_order: stream.display_order,
        offset_seconds: stream.offset_seconds
      }));
      
      const { error: insertStreamsError } = await supabase
        .from('pack_streams')
        .insert(streamsToInsert);
      
      if (insertStreamsError) throw insertStreamsError;
    }
    
    // Increment original pack's save count
    await supabase
      .from('packs')
      .update({ save_count: originalPack.save_count + 1 })
      .eq('id', id);
    
    res.status(201).json(newPack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trending packs
router.get('/trending', async (req, res) => {
  try {
    const { limit = 20, offset = 0, tags } = req.query;
    
    let query = supabase.rpc('get_trending_packs', { 
      limit_val: limit,
      offset_val: offset
    });
    
    if (tags && tags.length) {
      // Apply tags filter after RPC call
      const { data: allTrending } = await query;
      const filtered = allTrending.filter(pack => 
        pack.tags.some(tag => tags.includes(tag))
      );
      
      return res.json(filtered.slice(offset, offset + limit));
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Trending Algorithm Implementation (SQL Function)

```sql
-- Create a function to calculate trending score and return sorted packs
CREATE OR REPLACE FUNCTION get_trending_packs(limit_val INTEGER, offset_val INTEGER)
RETURNS SETOF packs AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM packs p
  WHERE p.visibility = 'public'
  ORDER BY 
    -- Trending algorithm: 
    -- 1 point per view (decaying over time)
    -- 5 points per share
    -- 10 points per save
    (p.view_count * 1.0 * EXP(-0.1 * EXTRACT(EPOCH FROM (NOW() - p.updated_at)) / 86400)) + 
    (p.share_count * 5.0) + 
    (p.save_count * 10.0) DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;
```
## Frontend Components

### Pack Card Component

```jsx
// PackCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const PackCard = ({ pack, onClone, isPremium }) => {
  const handleShare = async () => {
    try {
      // Create share URL
      const shareUrl = `${window.location.origin}/pack/${pack.id}`;
      
      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: pack.title,
          text: pack.description || `Check out this stream pack: ${pack.title}`,
          url: shareUrl
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        // Show toast notification
        toast.success('Link copied to clipboard!');
      }
      
      // Update share count in database
      await fetch(`/api/packs/${pack.id}/share`, { method: 'POST' });
    } catch (error) {
      console.error('Error sharing pack:', error);
    }
  };
  
  return (
    <div className="pack-card">
      <div className="pack-card-thumbnails">
        {pack.streams && pack.streams.slice(0, 3).map(stream => (
          <div key={stream.id} className="pack-thumbnail">
            <img 
              src={`https://static-cdn.jtvnw.net/previews-ttv/live_user_${stream.twitch_channel}-320x180.jpg`} 
              alt={`${stream.twitch_channel} thumbnail`}
              onError={(e) => {
                e.target.src = '/images/placeholder-thumbnail.jpg';
              }}
            />
          </div>
        ))}
        
        {pack.streams && pack.streams.length > 3 && (
          <div className="more-streams-badge">
            +{pack.streams.length - 3} more
          </div>
        )}
      </div>
      
      <div className="pack-card-content">
        <h3 className="pack-title">
          <Link to={`/pack/${pack.id}`}>{pack.title}</Link>
        </h3>
        
        <div className="pack-meta">
          <span className="pack-owner">by {pack.owner.display_name}</span>
          <span className="pack-views">{pack.view_count} views</span>
        </div>
        
        <div className="pack-tags">
          {pack.tags && pack.tags.map(tag => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="pack-card-actions">
        <Link to={`/pack/${pack.id}`} className="btn btn-primary">
          Open
        </Link>
        
        <button onClick={handleShare} className="btn btn-secondary">
          Share
        </button>
        
        {isPremium ? (
          <button onClick={() => onClone(pack.id)} className="btn btn-outline">
            Clone
          </button>
        ) : (
          <button 
            onClick={() => toast.info('Upgrade to Premium to clone packs')} 
            className="btn btn-outline btn-disabled"
          >
            Clone
          </button>
        )}
      </div>
    </div>
  );
};

export default PackCard;
```

### Pack Editor Component

```jsx
// PackEditor.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useUser } from '../hooks/useUser';

const PackEditor = () => {
  const { id } = useParams(); // If editing existing pack
  const navigate = useNavigate();
  const { user, isPremium } = useUser();
  
  const [pack, setPack] = useState({
    title: '',
    description: '',
    tags: [],
    visibility: 'public',
    streams: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newChannel, setNewChannel] = useState('');
  const [followedChannels, setFollowedChannels] = useState([]);
  
  // Fetch existing pack if editing
  useEffect(() => {
    if (id) {
      fetchPack();
    }
    
    // Fetch user's followed channels from Twitch
    fetchFollowedChannels();
  }, [id]);
  
  const fetchPack = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/packs/${id}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      // Format data for editor
      setPack({
        title: data.title,
        description: data.description || '',
        tags: data.tags || [],
        visibility: data.visibility,
        streams: data.streams.sort((a, b) => a.display_order - b.display_order)
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFollowedChannels = async () => {
    try {
      const response = await fetch('/api/twitch/followed-channels');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setFollowedChannels(data);
    } catch (error) {
      console.error('Error fetching followed channels:', error);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPack(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setPack(prev => ({ ...prev, tags }));
  };
  
  const handleAddStream = () => {
    if (!newChannel) return;
    
    // Check if channel already exists in pack
    if (pack.streams.some(s => s.twitch_channel.toLowerCase() === newChannel.toLowerCase())) {
      setError('This channel is already in the pack');
      return;
    }
    
    // Check premium limit
    if (!isPremium && pack.streams.length >= 3) {
      setError('Upgrade to Premium to add more than 3 streams');
      return;
    }
    
    // Add new stream
    setPack(prev => ({
      ...prev,
      streams: [
        ...prev.streams,
        {
          id: `temp-${Date.now()}`, // Temporary ID for new streams
          twitch_channel: newChannel,
          display_order: prev.streams.length,
          offset_seconds: 0
        }
      ]
    }));
    
    setNewChannel('');
    setError(null);
  };
  
  const handleRemoveStream = (index) => {
    setPack(prev => ({
      ...prev,
      streams: prev.streams.filter((_, i) => i !== index)
    }));
  };
  
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(pack.streams);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update display_order values
    const updatedStreams = items.map((item, index) => ({
      ...item,
      display_order: index
    }));
    
    setPack(prev => ({ ...prev, streams: updatedStreams }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const payload = {
        title: pack.title,
        description: pack.description,
        tags: pack.tags,
        visibility: pack.visibility,
        streams: pack.streams.map(s => ({
          twitch_channel: s.twitch_channel,
          offset_seconds: s.offset_seconds || 0
        }))
      };
      
      const url = id ? `/api/packs/${id}` : '/api/packs';
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      // Navigate to the pack view
      navigate(`/pack/${data.id}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && id) {
    return <div className="loading">Loading pack...</div>;
  }
  
  return (
    <div className="pack-editor">
      <h1>{id ? 'Edit Pack' : 'Create New Pack'}</h1>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Pack Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={pack.title}
            onChange={handleInputChange}
            required
            maxLength={100}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            name="description"
            value={pack.description}
            onChange={handleInputChange}
            maxLength={500}
            rows={3}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={pack.tags.join(', ')}
            onChange={handleTagsChange}
            placeholder="e.g. esports, valorant, tournament"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="visibility">Visibility</label>
          <select
            id="visibility"
            name="visibility"
            value={pack.visibility}
            onChange={handleInputChange}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Streams</label>
          
          <div className="add-stream-form">
            <input
              type="text"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              placeholder="Enter Twitch channel name"
              list="followed-channels"
            />
            <datalist id="followed-channels">
              {followedChannels.map(channel => (
                <option key={channel.id} value={channel.login}>
                  {channel.display_name}
                </option>
              ))}
            </datalist>
            <button 
              type="button" 
              onClick={handleAddStream}
              disabled={!newChannel}
            >
              Add Stream
            </button>
          </div>
          
          {!isPremium && pack.streams.length >= 3 && (
            <div className="premium-notice">
              Upgrade to Premium to add more than 3 streams
            </div>
          )}
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="streams">
              {(provided) => (
                <div
                  className="streams-list"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {pack.streams.map((stream, index) => (
                    <Draggable
                      key={stream.id || `new-${index}`}
                      draggableId={stream.id || `new-${index}`}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          className="stream-item"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <div className="stream-order">{index + 1}</div>
                          <div className="stream-channel">{stream.twitch_channel}</div>
                          <button
                            type="button"
                            className="remove-stream"
                            onClick={() => handleRemoveStream(index)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !pack.title || pack.streams.length === 0}
          >
            {loading ? 'Saving...' : id ? 'Update Pack' : 'Create Pack'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PackEditor;
```

### Pack Viewer Component

```jsx
// PackViewer.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StreamGrid from '../components/StreamGrid';
import { useUser } from '../hooks/useUser';

const PackViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isPremium } = useUser();
  
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
  useEffect(() => {
    fetchPack();
    if (user) {
      checkFollowStatus();
    }
  }, [id, user]);
  
  const fetchPack = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/packs/${id}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setPack(data);
      setIsOwner(user && data.owner_id === user.id);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const checkFollowStatus = async () => {
    try {
      const response = await fetch(`/api/packs/${id}/follow/status`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setIsFollowing(data.following);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };
  
  const handleFollow = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/pack/${id}` } });
      return;
    }
    
    if (!isPremium) {
      // Show premium upgrade modal
      return;
    }
    
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/packs/${id}/follow`, { method });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error following pack:', error);
    }
  };
  
  const handleClone = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/pack/${id}` } });
      return;
    }
    
    if (!isPremium) {
      // Show premium upgrade modal
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/packs/${id}/clone`, { method: 'POST' });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      // Navigate to the cloned pack
      navigate(`/pack/${data.id}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleShare = async () => {
    try {
      // Create share URL
      const shareUrl = `${window.location.origin}/pack/${id}`;
      
      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: pack.title,
          text: pack.description || `Check out this stream pack: ${pack.title}`,
          url: shareUrl
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        // Show toast notification
        toast.success('Link copied to clipboard!');
      }
      
      // Update share count in database
      await fetch(`/api/packs/${id}/share`, { method: 'POST' });
    } catch (error) {
      console.error('Error sharing pack:', error);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading pack...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!pack) {
    return <div className="not-found">Pack not found</div>;
  }
  
  return (
    <div className="pack-viewer">
      <div className="pack-header">
        <div className="pack-info">
          <h1 className="pack-title">{pack.title}</h1>
          
          <div className="pack-meta">
            <span className="pack-owner">by {pack.owner.display_name}</span>
            <span className="pack-views">{pack.view_count} views</span>
          </div>
          
          {pack.description && (
            <p className="pack-description">{pack.description}</p>
          )}
          
          <div className="pack-tags">
            {pack.tags && pack.tags.map(tag => (
              <Link key={tag} to={`/discover?tags=${tag}`} className="tag">
                {tag}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="pack-actions">
          {isOwner && (
            <Link to={`/pack/${id}/edit`} className="btn btn-primary">
              Edit
            </Link>
          )}
          
          <button onClick={handleShare} className="btn btn-secondary">
            Share
          </button>
          
          {!isOwner && (
            <>
              <button 
                onClick={handleFollow} 
                className={`btn ${isFollowing ? 'btn-outline' : 'btn-secondary'}`}
                disabled={!isPremium}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
              
              <button 
                onClick={handleClone} 
                className="btn btn-outline"
                disabled={!isPremium}
              >
                Clone
              </button>
              
              {!isPremium && (
                <div className="premium-notice">
                  Premium required for Follow/Clone
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="pack-content">
        <StreamGrid 
          channels={pack.streams.map(s => s.twitch_channel)} 
          isPremium={isPremium}
        />
      </div>
    </div>
  );
};

export default PackViewer;
```

## Technical Considerations

1. **Performance Optimization**:
   - Implement pagination for API endpoints that return lists
   - Use Supabase's real-time capabilities selectively to avoid excessive updates
   - Cache frequently accessed data in Redis (Upstash)

2. **Security Considerations**:
   - Implement proper authentication middleware for protected routes
   - Validate user permissions for pack operations
   - Sanitize user input to prevent SQL injection and XSS attacks

3. **Scalability**:
   - Design database indexes for common query patterns
   - Implement efficient trending algorithm that can scale with growing data
   - Use connection pooling for database connections

4. **Error Handling**:
   - Implement comprehensive error handling for API endpoints
   - Log errors with appropriate context for debugging
   - Return user-friendly error messages

## Testing Strategy

1. **Unit Tests**:
   - Test individual components and utility functions
   - Test API endpoints with mock requests and responses
   - Test database queries with test data

2. **Integration Tests**:
   - Test the interaction between components
   - Test API endpoints with real database connections
   - Test real-time updates with Supabase

3. **End-to-End Tests**:
   - Test complete user flows (create, view, edit, delete packs)
   - Test premium features with mock subscriptions
   - Test sharing and social features

## Future Enhancements (Phase 2+)

1. **Advanced Pack Discovery**:
   - Implement personalized recommendations based on user behavior
   - Add category-based browsing
   - Implement search functionality with full-text search

2. **Enhanced Social Features**:
   - Allow users to comment on packs
   - Implement notifications for pack updates
   - Add user profiles with followed and created packs

3. **Analytics Dashboard**:
   - Provide pack owners with view statistics
   - Track engagement metrics
   - Visualize trending data