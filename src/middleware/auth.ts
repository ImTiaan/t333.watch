import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { twitchApi } from '@/lib/twitch-api';
import { getUser, createUser } from '@/lib/supabase';
import { isPremium } from '@/lib/premium';

export interface AuthenticatedUser {
  id: string;
  login: string;
  twitch_id: string;
  display_name: string;
  premium_flag: boolean;
  stripe_customer_id: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error?: string;
}

/**
 * Get the authenticated user from request headers or cookies
 * This function handles both token validation and user creation/updates
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthResult> {
  try {
    // Get the access token from request headers or cookies
    let token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    // If no token in headers, try cookies
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('twitch_access_token')?.value;
    }
    
    if (!token) {
      return { user: null, error: 'No authentication token provided' };
    }
    
    // Set the token in the API client
    twitchApi.setAccessToken(token);
    
    // Get the user info from Twitch
    const userInfo = await twitchApi.getUser();
    
    if (!userInfo || !userInfo.id) {
      return { user: null, error: 'Invalid token or user not found' };
    }
    
    // Get or create the user in the database
    let user: AuthenticatedUser | null = null;
    try {
      user = await getUser(userInfo.id);
      
      // Update the user's profile image if it has changed
      if (user && userInfo.profile_image_url && user.profile_image_url !== userInfo.profile_image_url) {
        const { updateUser } = await import('@/lib/supabase');
        await updateUser(user.id, { profile_image_url: userInfo.profile_image_url });
        
        // Update the local user object
        user.profile_image_url = userInfo.profile_image_url;
      }
    } catch {
      // User doesn't exist, create a new one
      try {
        user = await createUser({
          twitch_id: userInfo.id,
          login: userInfo.login,
          display_name: userInfo.display_name,
          premium_flag: false,
          profile_image_url: userInfo.profile_image_url,
        });
        console.log('Created new user in database:', userInfo.id);
      } catch (createError) {
        console.error('Error creating user in database:', createError);
        return { user: null, error: 'Failed to create user account' };
      }
    }
    
    return { user };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Verify that a user has premium status
 * This function performs server-side verification of premium status
 */
export function verifyPremiumStatus(user: AuthenticatedUser | null): boolean {
  if (!user) return false;
  
  // Server-side premium verification
  // Convert AuthenticatedUser to TwitchUser format for isPremium function
  const twitchUser = {
    id: user.id,
    login: user.login,
    display_name: user.display_name,
    profile_image_url: user.profile_image_url || '',
    premium_flag: user.premium_flag
  };
  return isPremium(twitchUser);
}

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<{ user: AuthenticatedUser; error?: never } | { user?: never; error: Response }> {
  const { user, error } = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ error: error || 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }
  
  return { user };
}

/**
 * Middleware to require premium status
 * Returns 403 if user is not premium
 */
export async function requirePremium(request: NextRequest): Promise<{ user: AuthenticatedUser; error?: never } | { user?: never; error: Response }> {
  const authResult = await requireAuth(request);
  
  if ('error' in authResult) {
    return authResult;
  }
  
  const { user } = authResult;
  
  if (!verifyPremiumStatus(user)) {
    return {
      error: new Response(
        JSON.stringify({ 
          error: 'Premium subscription required',
          code: 'PREMIUM_REQUIRED',
          upgradeUrl: '/dashboard/subscription/upgrade'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }
  
  return { user };
}

/**
 * Check if a user owns a resource (like a pack)
 * Returns 403 if user doesn't own the resource
 */
export function requireOwnership(user: AuthenticatedUser, resourceOwnerId: string): { error?: Response } {
  if (user.id !== resourceOwnerId) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Access denied: You do not own this resource' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }
  
  return {};
}

/**
 * Validate premium feature usage limits
 * For example, checking stream count limits
 */
export function validatePremiumLimits(user: AuthenticatedUser | null, feature: string, currentUsage: number): { allowed: boolean; error?: string } {
  const hasPremium = verifyPremiumStatus(user);
  
  switch (feature) {
    case 'streams':
      const maxStreams = hasPremium ? 9 : 3;
      if (currentUsage >= maxStreams) {
        return {
          allowed: false,
          error: hasPremium 
            ? `Premium users can watch up to ${maxStreams} streams`
            : `Free users can watch up to ${maxStreams} streams. Upgrade to premium for more.`
        };
      }
      break;
      
    case 'packs':
      if (!hasPremium && currentUsage >= 5) {
        return {
          allowed: false,
          error: 'Free users can save up to 5 packs. Upgrade to premium for unlimited packs.'
        };
      }
      break;
      
    case 'pack_streams':
      const maxPackStreams = hasPremium ? 9 : 3;
      if (currentUsage > maxPackStreams) {
        return {
          allowed: false,
          error: hasPremium 
            ? `Premium users can save up to ${maxPackStreams} streams per pack`
            : `Free users can save up to ${maxPackStreams} streams per pack. Upgrade to premium for more.`
        };
      }
      break;
      
    default:
      return { allowed: true };
  }
  
  return { allowed: true };
}

/**
 * Cache user premium status for performance
 * This helps reduce database queries for premium verification
 */
const premiumStatusCache = new Map<string, { status: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedPremiumStatus(userId: string): boolean | null {
  const cached = premiumStatusCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.status;
  }
  return null;
}

export function setCachedPremiumStatus(userId: string, status: boolean): void {
  premiumStatusCache.set(userId, {
    status,
    timestamp: Date.now()
  });
}

/**
 * Clear premium status cache for a user
 * Should be called when subscription status changes
 */
export function clearPremiumStatusCache(userId: string): void {
  premiumStatusCache.delete(userId);
}

/**
 * Enhanced premium verification with caching
 */
export function verifyPremiumStatusCached(user: AuthenticatedUser | null): boolean {
  if (!user) return false;
  
  // Check cache first
  const cached = getCachedPremiumStatus(user.id);
  if (cached !== null) {
    return cached;
  }
  
  // Verify and cache result
  const status = verifyPremiumStatus(user);
  setCachedPremiumStatus(user.id, status);
  
  return status;
}