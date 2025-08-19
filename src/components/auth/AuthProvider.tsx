'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { twitchApi } from '@/lib/twitch-api';
import { config } from '@/lib/config';
import { getUser, createUser } from '@/lib/supabase';
import Cookies from 'js-cookie';

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
            });
            console.log('Created new user in Supabase');
            // New user is not premium
            (userInfo as TwitchUser).premium_flag = false;
          } catch (createError) {
            console.error('Error creating user in Supabase:', createError);
            // Continue anyway - we'll try again next time
          }
        }
        
        setUser(userInfo);
      } catch (error) {
        console.error('Authentication error:', error);
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
                });
                console.log('Created new user in Supabase');
                // New user is not premium
                (userInfo as TwitchUser).premium_flag = false;
              } catch (createError) {
                console.error('Error creating user in Supabase:', createError);
                // Continue anyway - we'll try again next time
              }
            }
            
            setUser(userInfo);
          } catch (error) {
            console.error('Authentication error on focus:', error);
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
    const { clientId, redirectUri } = config.twitch;
    
    // Define the scopes we need
    const scopes = [
      'user:read:email',
      'user:read:follows',
      'channel:read:subscriptions',
    ].join(' ');
    
    // Build the OAuth URL
    const authUrl = new URL('https://id.twitch.tv/oauth2/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scopes);
    
    // Generate a random state value for security
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('twitch_auth_state', state);
    authUrl.searchParams.append('state', state);
    
    // Redirect to Twitch
    window.location.href = authUrl.toString();
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('twitch_access_token');
    Cookies.remove('twitch_access_token', { path: '/' });
    setUser(null);
  };

  // Get access token function
  const getAccessToken = async (): Promise<string | null> => {
    // First try to get the token from localStorage
    const token = localStorage.getItem('twitch_access_token');
    if (token) return token;
    
    // If not in localStorage, try to get it from cookies
    return Cookies.get('twitch_access_token') || null;
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