# Twitch OAuth Integration Implementation

## Overview

Twitch OAuth integration is a critical component of t333.watch, enabling user authentication, access to followed channels, and interaction with the Twitch API. This document outlines the technical implementation details of the Twitch OAuth integration, including authentication flow, token management, user profile synchronization, and handling API rate limits.

## Authentication Flow

### 1. OAuth 2.0 Authorization Code Flow

t333.watch will implement the OAuth 2.0 Authorization Code Flow for secure authentication with Twitch:

```javascript
// auth.routes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../utils/supabaseClient');

// Environment variables
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://t333.watch/auth/callback';

// Step 1: Redirect to Twitch authorization page
router.get('/login', (req, res) => {
  const scopes = [
    'user:read:email',
    'user:read:follows',
    'channel:read:subscriptions'
  ].join(' ');
  
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scopes}`;
  
  res.redirect(authUrl);
});

// Step 2: Handle callback from Twitch
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/login?error=missing_code');
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      }
    });
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Get user info from Twitch
    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Client-Id': TWITCH_CLIENT_ID
      }
    });
    
    const twitchUser = userResponse.data.data[0];
    
    // Check if user exists in our database
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('twitch_id', twitchUser.id)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw fetchError;
    }
    
    let userId;
    
    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          display_name: twitchUser.display_name,
          updated_at: new Date()
        })
        .eq('twitch_id', twitchUser.id)
        .select()
        .single();
      
      if (error) throw error;
      userId = data.id;
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          twitch_id: twitchUser.id,
          display_name: twitchUser.display_name,
          premium_flag: false
        })
        .select()
        .single();
      
      if (error) throw error;
      userId = data.id;
    }
    
    // Store tokens in secure storage
    await storeTokens(userId, access_token, refresh_token, expires_in);
    
    // Create session
    const { error: sessionError } = await supabase.auth.admin.createSession({
      user_id: userId,
      expires_in: 60 * 60 * 24 * 7 // 7 days
    });
    
    if (sessionError) throw sessionError;
    
    // Redirect to dashboard or original destination
    const destination = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(destination);
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect('/login?error=auth_failed');
  }
});

// Logout route
router.get('/logout', async (req, res) => {
  await supabase.auth.signOut();
  res.redirect('/');
});

module.exports = router;
```

### 2. Frontend Authentication Components

```jsx
// LoginButton.jsx
import React from 'react';

const LoginButton = () => {
  return (
    <a 
      href="/auth/login" 
      className="twitch-login-button"
    >
      <svg className="twitch-icon" viewBox="0 0 24 24">
        {/* Twitch logo SVG */}
      </svg>
      Login with Twitch
    </a>
  );
};

export default LoginButton;
```

```jsx
// AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  
  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Get user details
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (!error) {
          setUser(userData);
          setIsPremium(userData.premium_flag);
        }
      }
      
      setLoading(false);
    };
    
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Get user details
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!error) {
            setUser(userData);
            setIsPremium(userData.premium_flag);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsPremium(false);
        }
      }
    );
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, loading, isPremium }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

## Token Management

### 1. Secure Token Storage

Tokens will be stored securely in the database with encryption:

```javascript
// tokenManager.js
const crypto = require('crypto');
const { supabase } = require('./supabaseClient');

// Encryption key from environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16; // For AES, this is always 16

// Encrypt token
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc', 
    Buffer.from(ENCRYPTION_KEY, 'hex'), 
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Decrypt token
function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc', 
    Buffer.from(ENCRYPTION_KEY, 'hex'), 
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Store tokens in database
async function storeTokens(userId, accessToken, refreshToken, expiresIn) {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
  
  const encryptedAccessToken = encrypt(accessToken);
  const encryptedRefreshToken = encrypt(refreshToken);
  
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
}

// Get tokens for a user
async function getTokens(userId) {
  const { data, error } = await supabase
    .from('user_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  
  return {
    accessToken: decrypt(data.access_token),
    refreshToken: decrypt(data.refresh_token),
    expiresAt: new Date(data.expires_at)
  };
}

module.exports = {
  storeTokens,
  getTokens
};
```

### 2. Token Refresh Mechanism

```javascript
// tokenRefresher.js
const axios = require('axios');
const { getTokens, storeTokens } = require('./tokenManager');

// Environment variables
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

// Get a valid access token, refreshing if necessary
async function getValidAccessToken(userId) {
  try {
    const { accessToken, refreshToken, expiresAt } = await getTokens(userId);
    
    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expirationBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (now.getTime() + expirationBuffer >= expiresAt.getTime()) {
      // Token is expired or about to expire, refresh it
      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: TWITCH_CLIENT_ID,
          client_secret: TWITCH_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }
      });
      
      const { access_token, refresh_token, expires_in } = response.data;
      
      // Store new tokens
      await storeTokens(userId, access_token, refresh_token, expires_in);
      
      return access_token;
    }
    
    // Token is still valid
    return accessToken;
  } catch (error) {
    console.error('Error getting valid access token:', error);
    throw new Error('Failed to get valid access token');
  }
}

module.exports = {
  getValidAccessToken
};
```

## User Profile Synchronization

### 1. Database Schema for User Tokens

```sql
CREATE TABLE user_tokens (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
```

### 2. Profile Synchronization Service

```javascript
// profileSync.js
const axios = require('axios');
const { getValidAccessToken } = require('./tokenRefresher');
const { supabase } = require('./supabaseClient');

// Environment variables
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;

// Sync user profile with Twitch
async function syncUserProfile(userId) {
  try {
    // Get valid access token
    const accessToken = await getValidAccessToken(userId);
    
    // Get user info from Twitch
    const response = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': TWITCH_CLIENT_ID
      }
    });
    
    const twitchUser = response.data.data[0];
    
    // Update user in database
    const { error } = await supabase
      .from('users')
      .update({
        display_name: twitchUser.display_name,
        profile_image_url: twitchUser.profile_image_url,
        updated_at: new Date()
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    return twitchUser;
  } catch (error) {
    console.error('Error syncing user profile:', error);
    throw new Error('Failed to sync user profile');
  }
}

// Get user's followed channels
async function getFollowedChannels(userId) {
  try {
    // Get valid access token
    const accessToken = await getValidAccessToken(userId);
    
    // Get user's Twitch ID
    const { data: user, error } = await supabase
      .from('users')
      .select('twitch_id')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    // Get followed channels from Twitch
    const response = await axios.get('https://api.twitch.tv/helix/users/follows', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': TWITCH_CLIENT_ID
      },
      params: {
        from_id: user.twitch_id,
        first: 100 // Maximum allowed by Twitch API
      }
    });
    
    // Get channel details for followed channels
    const followedIds = response.data.data.map(follow => follow.to_id);
    
    if (followedIds.length === 0) {
      return [];
    }
    
    // Split into chunks of 100 (Twitch API limit)
    const chunks = [];
    for (let i = 0; i < followedIds.length; i += 100) {
      chunks.push(followedIds.slice(i, i + 100));
    }
    
    // Get channel details for each chunk
    const channelsData = [];
    
    for (const chunk of chunks) {
      const channelsResponse = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': TWITCH_CLIENT_ID
        },
        params: {
          id: chunk
        }
      });
      
      channelsData.push(...channelsResponse.data.data);
    }
    
    return channelsData;
  } catch (error) {
    console.error('Error getting followed channels:', error);
    throw new Error('Failed to get followed channels');
  }
}

module.exports = {
  syncUserProfile,
  getFollowedChannels
};
```

## API Rate Limit Handling

### 1. Rate Limit Middleware

```javascript
// rateLimitMiddleware.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Connect to Redis
const redisClient = new Redis(process.env.REDIS_URL);

// Create rate limiter for Twitch API requests
const twitchApiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'twitch-api-limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 800, // Twitch API limit is 800 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests to Twitch API, please try again later'
});

module.exports = {
  twitchApiLimiter
};
```

### 2. Twitch API Client with Rate Limit Handling

```javascript
// twitchApiClient.js
const axios = require('axios');
const { getValidAccessToken } = require('./tokenRefresher');
const Redis = require('ioredis');

// Environment variables
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;

// Connect to Redis
const redisClient = new Redis(process.env.REDIS_URL);

// Create Twitch API client
class TwitchApiClient {
  constructor() {
    this.clientId = TWITCH_CLIENT_ID;
    this.baseUrl = 'https://api.twitch.tv/helix';
    this.rateLimitRemaining = 800; // Default Twitch API limit
    this.rateLimitReset = 0;
  }
  
  // Get headers with valid access token
  async getHeaders(userId) {
    const accessToken = await getValidAccessToken(userId);
    
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': this.clientId
    };
  }
  
  // Make API request with rate limit handling
  async request(method, endpoint, userId, params = {}, data = null) {
    try {
      // Check if we're rate limited
      const now = Math.floor(Date.now() / 1000);
      
      if (this.rateLimitRemaining <= 5 && now < this.rateLimitReset) {
        const waitTime = (this.rateLimitReset - now) * 1000;
        console.log(`Rate limit almost reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Get headers with valid token
      const headers = await this.getHeaders(userId);
      
      // Make request
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers,
        params,
        data
      });
      
      // Update rate limit info from headers
      this.rateLimitRemaining = parseInt(response.headers['ratelimit-remaining'] || '800');
      this.rateLimitReset = parseInt(response.headers['ratelimit-reset'] || '0');
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        // Rate limited, wait and retry
        const retryAfter = parseInt(error.response.headers['retry-after'] || '1');
        console.log(`Rate limited, retrying after ${retryAfter} seconds`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.request(method, endpoint, userId, params, data);
      }
      
      throw error;
    }
  }
  
  // Get user's followed channels with caching
  async getFollowedChannels(userId) {
    // Check cache first
    const cacheKey = `followed-channels:${userId}`;
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Get user's Twitch ID
    const { data: user } = await supabase
      .from('users')
      .select('twitch_id')
      .eq('id', userId)
      .single();
    
    // Get followed channels from Twitch
    const data = await this.request('GET', '/users/follows', userId, {
      from_id: user.twitch_id,
      first: 100
    });
    
    // Get channel details
    const followedIds = data.data.map(follow => follow.to_id);
    
    if (followedIds.length === 0) {
      return [];
    }
    
    // Split into chunks of 100 (Twitch API limit)
    const chunks = [];
    for (let i = 0; i < followedIds.length; i += 100) {
      chunks.push(followedIds.slice(i, i + 100));
    }
    
    // Get channel details for each chunk
    const channelsData = [];
    
    for (const chunk of chunks) {
      const channelsResponse = await this.request('GET', '/users', userId, {
        id: chunk
      });
      
      channelsData.push(...channelsResponse.data);
    }
    
    // Cache results for 15 minutes
    await redisClient.set(cacheKey, JSON.stringify(channelsData), 'EX', 15 * 60);
    
    return channelsData;
  }
  
  // Check if channels are live
  async getLiveChannels(userId, channelNames) {
    if (!channelNames || channelNames.length === 0) {
      return [];
    }
    
    // Split into chunks of 100 (Twitch API limit)
    const chunks = [];
    for (let i = 0; i < channelNames.length; i += 100) {
      chunks.push(channelNames.slice(i, i + 100));
    }
    
    // Get stream data for each chunk
    const streamsData = [];
    
    for (const chunk of chunks) {
      const params = {
        user_login: chunk
      };
      
      const streamsResponse = await this.request('GET', '/streams', userId, params);
      streamsData.push(...streamsResponse.data);
    }
    
    return streamsData;
  }
}

module.exports = new TwitchApiClient();
```

## API Endpoints for Twitch Integration

```javascript
// twitch.routes.js
const express = require('express');
const router = express.Router();
const { twitchApiLimiter } = require('../middleware/rateLimitMiddleware');
const twitchApiClient = require('../utils/twitchApiClient');
const auth = require('../middleware/auth');

// Get user's followed channels
router.get('/followed-channels', auth, twitchApiLimiter, async (req, res) => {
  try {
    const channels = await twitchApiClient.getFollowedChannels(req.user.id);
    res.json(channels);
  } catch (error) {
    console.error('Error getting followed channels:', error);
    res.status(500).json({ error: 'Failed to get followed channels' });
  }
});

// Check if channels are live
router.post('/live-channels', auth, twitchApiLimiter, async (req, res) => {
  try {
    const { channels } = req.body;
    
    if (!channels || !Array.isArray(channels)) {
      return res.status(400).json({ error: 'Invalid channels parameter' });
    }
    
    const liveChannels = await twitchApiClient.getLiveChannels(req.user.id, channels);
    res.json(liveChannels);
  } catch (error) {
    console.error('Error checking live channels:', error);
    res.status(500).json({ error: 'Failed to check live channels' });
  }
});

// Get channel information
router.get('/channels', auth, twitchApiLimiter, async (req, res) => {
  try {
    const { login } = req.query;
    
    if (!login) {
      return res.status(400).json({ error: 'Missing login parameter' });
    }
    
    const logins = Array.isArray(login) ? login : [login];
    
    const channels = await twitchApiClient.request('GET', '/users', req.user.id, {
      login: logins
    });
    
    res.json(channels.data);
  } catch (error) {
    console.error('Error getting channel information:', error);
    res.status(500).json({ error: 'Failed to get channel information' });
  }
});

module.exports = router;
```

## Frontend Integration

### 1. Twitch API Hook

```jsx
// useTwitchApi.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export function useTwitchApi() {
  const { user } = useAuth();
  const [followedChannels, setFollowedChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch followed channels
  const fetchFollowedChannels = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/twitch/followed-channels');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setFollowedChannels(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Check if channels are live
  const checkLiveChannels = async (channels) => {
    if (!user || !channels || channels.length === 0) return [];
    
    try {
      const response = await fetch('/api/twitch/live-channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ channels })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      return data;
    } catch (error) {
      console.error('Error checking live channels:', error);
      return [];
    }
  };
  
  // Get channel information
  const getChannelInfo = async (logins) => {
    if (!user || !logins || logins.length === 0) return [];
    
    try {
      const queryParams = new URLSearchParams();
      
      if (Array.isArray(logins)) {
        logins.forEach(login => queryParams.append('login', login));
      } else {
        queryParams.append('login', logins);
      }
      
      const response = await fetch(`/api/twitch/channels?${queryParams}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      return data;
    } catch (error) {
      console.error('Error getting channel info:', error);
      return [];
    }
  };
  
  // Load followed channels on mount
  useEffect(() => {
    if (user) {
      fetchFollowedChannels();
    }
  }, [user]);
  
  return {
    followedChannels,
    loading,
    error,
    fetchFollowedChannels,
    checkLiveChannels,
    getChannelInfo
  };
}
```

### 2. Login Component

```jsx
// Login.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginButton from '../components/LoginButton';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { from } = location.state || { from: { pathname: '/dashboard' } };
  
  // Store the return URL in session
  React.useEffect(() => {
    if (from.pathname !== '/dashboard') {
      sessionStorage.setItem('returnTo', from.pathname);
    }
  }, [from]);
  
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img src="/images/logo.svg" alt="t333.watch logo" />
        </div>
        
        <h1>Welcome to t333.watch</h1>
        <p>The ultimate multi-stream viewer for Twitch</p>
        
        <div className="login-actions">
          <LoginButton />
        </div>
        
        <div className="login-info">
          <p>By logging in, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

## Technical Considerations

1. **Security**:
   - Use HTTPS for all API requests
   - Store tokens securely with encryption
   - Implement proper session management
   - Use secure cookies with HttpOnly and SameSite flags

2. **Performance**:
   - Cache API responses to reduce Twitch API calls
   - Implement token refresh mechanism to avoid unnecessary logins
   - Use connection pooling for database connections

3. **Error Handling**:
   - Implement comprehensive error handling for API requests
   - Handle token expiration and refresh failures gracefully
   - Provide user-friendly error messages

4. **Compliance**:
   - Follow Twitch API Terms of Service
   - Implement proper rate limiting
   - Handle user data according to privacy regulations

## Testing Strategy

1. **Unit Tests**:
   - Test token encryption/decryption
   - Test API client functions
   - Test authentication middleware

2. **Integration Tests**:
   - Test authentication flow with mock Twitch responses
   - Test token refresh mechanism
   - Test rate limiting

3. **End-to-End Tests**:
   - Test complete login flow
   - Test followed channels retrieval
   - Test live channel checking

## Future Enhancements

1. **Enhanced Authentication**:
   - Implement PKCE (Proof Key for Code Exchange) for added security
   - Add support for multiple Twitch accounts
   - Implement social login options

2. **Advanced Permissions**:
   - Request additional scopes based on user actions
   - Implement granular permission management
   - Add support for channel subscriptions and bits

3. **Webhook Integration**:
   - Subscribe to Twitch webhooks for real-time updates
   - Implement EventSub for stream status changes
   - Add notifications for followed channels going live