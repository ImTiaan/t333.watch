'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { twitchApi } from '@/lib/twitch-api';
import { config } from '@/lib/config';
import { getUser, createUser } from '@/lib/supabase';
import Cookies from 'js-cookie';
import analytics, { EventCategory, AuthEvents } from '@/lib/analytics';

// Define the user type
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  email?: string;
  premium_flag?: boolean;
}

// Define the auth context type
interface AuthContextType {
  user: TwitchUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  getAccessToken: async () => null,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TwitchUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a token in localStorage
        const token = localStorage.getItem('twitch_access_token');
        
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // Also ensure the token is in cookies for server-side access
        Cookies.set('twitch_access_token', token, {
          expires: 7, // 7 days
          path: '/',
          sameSite: 'Lax'
        });
        
        // Set the token in the API client
        twitchApi.setAccessToken(token);
        
        // Get the user info
        const userInfo = await twitchApi.getUser();
        
        // Create or update user in Supabase
        try {
          // Try to get existing user
          const dbUser = await getUser(userInfo.id);
          console.log('User already exists in Supabase');
          // Add premium flag to user info
          (userInfo as TwitchUser).premium_flag = dbUser.premium_flag;
          console.log('User premium status:', dbUser.premium_flag);
        } catch (error) {
          // User doesn't exist, create a new one
          try {
            await createUser({
              twitch_id: userInfo.id,
              display_name: userInfo.display_name,
              premium_flag: false,
              profile_image_url: userInfo.profile_image_url,
            });
            console.log('Created new user in Supabase');
            // New user is not premium
            (userInfo as TwitchUser).premium_flag = false;
          } catch (createError) {
            console.error('Error creating user in Supabase:', createError);
            // Continue anyway - we'll try again next time
          }
        }
        
        // Track successful login/authentication
        analytics.trackEvent(EventCategory.AUTH, AuthEvents.LOGIN, {
          method: 'token_validation',
          userId: userInfo.id,
          username: userInfo.display_name,
          isPremium: (userInfo as TwitchUser).premium_flag || false,
          timestamp: new Date().toISOString()
        });
        
        setUser(userInfo);
      } catch (error) {
        console.error('Authentication error:', error);
        
        // Track authentication error
        analytics.trackEvent(EventCategory.AUTH, AuthEvents.AUTH_ERROR, {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        
        // Clear invalid token
        localStorage.removeItem('twitch_access_token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Force a re-check when the component is focused (e.g., after redirect)
  useEffect(() => {
    const handleFocus = () => {
      const token = localStorage.getItem('twitch_access_token');
      if (token && !user) {
        // If we have a token but no user, try to fetch user info again
        const checkAuth = async () => {
          try {
            // Also ensure the token is in cookies for server-side access
            Cookies.set('twitch_access_token', token, {
              expires: 7, // 7 days
              path: '/',
              sameSite: 'Lax'
            });
            
            twitchApi.setAccessToken(token);
            const userInfo = await twitchApi.getUser();
            
            // Create or update user in Supabase
            try {
              // Try to get existing user
              const dbUser = await getUser(userInfo.id);
              console.log('User already exists in Supabase');
              // Add premium flag to user info
              (userInfo as TwitchUser).premium_flag = dbUser.premium_flag;
              console.log('User premium status:', dbUser.premium_flag);
            } catch (error) {
              // User doesn't exist, create a new one
              try {
                await createUser({
                  twitch_id: userInfo.id,
                  display_name: userInfo.display_name,
                  premium_flag: false,
                  profile_image_url: userInfo.profile_image_url,
                });
                console.log('Created new user in Supabase');
                // New user is not premium
                (userInfo as TwitchUser).premium_flag = false;
              } catch (createError) {
                console.error('Error creating user in Supabase:', createError);
                // Continue anyway - we'll try again next time
              }
            }
            
            // Track token refresh event
            analytics.trackEvent(EventCategory.AUTH, AuthEvents.TOKEN_REFRESH, {
              userId: userInfo.id,
              username: userInfo.display_name,
              isPremium: (userInfo as TwitchUser).premium_flag || false,
              timestamp: new Date().toISOString()
            });
            
            setUser(userInfo);
          } catch (error) {
            console.error('Authentication error on focus:', error);
            
            // Track authentication error on focus
            analytics.trackEvent(EventCategory.AUTH, AuthEvents.AUTH_ERROR, {
              context: 'focus',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            });
            
            localStorage.removeItem('twitch_access_token');
          }
        };
        checkAuth();
      }
    };

    // Check immediately (for when returning from auth callback)
    handleFocus();
    
    // Add event listener for when the window regains focus
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  // Login function - redirects to Twitch OAuth
  const login = () => {
    // Track login attempt
    analytics.trackEvent(EventCategory.AUTH, AuthEvents.LOGIN, {
      method: 'twitch_oauth',
      timestamp: new Date().toISOString()
    });
    
    const { clientId, redirectUri } = config.twitch;
    
    // Define the scopes we need - ensure we have all necessary scopes
    const scopes = [
      'user:read:email',
      'user:read:follows',
      'channel:read:subscriptions',
      'user:read:subscriptions',
      'chat:read',
      'chat:edit',
    ].join(' ');
    
    // Clear any existing tokens to ensure a fresh login
    localStorage.removeItem('twitch_access_token');
    Cookies.remove('twitch_access_token', { path: '/' });
    
    // Build the OAuth URL
    const authUrl = new URL('https://id.twitch.tv/oauth2/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scopes);
    authUrl.searchParams.append('force_verify', 'true'); // Force re-authentication
    
    // Generate a random state value for security
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('twitch_auth_state', state);
    authUrl.searchParams.append('state', state);
    
    console.log('Redirecting to Twitch OAuth:', authUrl.toString());
    
    // Redirect to Twitch
    window.location.href = authUrl.toString();
  };

  // Logout function
  const logout = () => {
    // Track logout event if user was logged in
    if (user) {
      analytics.trackEvent(EventCategory.AUTH, AuthEvents.LOGOUT, {
        userId: user.id,
        username: user.display_name,
        timestamp: new Date().toISOString()
      });
    }
    
    localStorage.removeItem('twitch_access_token');
    Cookies.remove('twitch_access_token', { path: '/' });
    setUser(null);
  };

  // Get access token function
  const getAccessToken = async (): Promise<string | null> => {
    // First try to get the token from localStorage
    const token = localStorage.getItem('twitch_access_token');
    if (token) {
      console.log('Token found in localStorage');
      // Also ensure it's in cookies for consistency
      Cookies.set('twitch_access_token', token, {
        expires: 7, // 7 days
        path: '/',
        sameSite: 'Lax'
      });
      return token;
    }
    
    // If not in localStorage, try to get it from cookies
    const cookieToken = Cookies.get('twitch_access_token');
    if (cookieToken) {
      console.log('Token found in cookies, syncing to localStorage');
      // Sync back to localStorage for consistency
      localStorage.setItem('twitch_access_token', cookieToken);
      return cookieToken;
    }
    
    console.warn('No token found in localStorage or cookies');
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}