import { createClient } from '@supabase/supabase-js';
import { wrapSupabaseWithPerformanceTracking } from './supabasePerformance';
import { twitchApi } from './twitch-api';

// Types for our database tables
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          twitch_id: string;
          login: string;
          display_name: string;
          premium_flag: boolean;
          stripe_customer_id: string | null;
          profile_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          twitch_id: string;
          login: string;
          display_name: string;
          premium_flag?: boolean;
          stripe_customer_id?: string | null;
          profile_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          twitch_id?: string;
          login?: string;
          display_name?: string;
          premium_flag?: boolean;
          stripe_customer_id?: string | null;
          profile_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      packs: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          tags: string[] | null;
          visibility: 'public' | 'private';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          tags?: string[] | null;
          visibility?: 'public' | 'private';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          tags?: string[] | null;
          visibility?: 'public' | 'private';
          created_at?: string;
          updated_at?: string;
        };
      };
      pack_streams: {
        Row: {
          id: string;
          pack_id: string;
          twitch_channel: string;
          order: number;
          offset_seconds: number;
        };
        Insert: {
          id?: string;
          pack_id: string;
          twitch_channel: string;
          order?: number;
          offset_seconds?: number;
        };
        Update: {
          id?: string;
          pack_id?: string;
          twitch_channel?: string;
          order?: number;
          offset_seconds?: number;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          event_type: 'pack_live' | 'trending';
          payload: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: 'pack_live' | 'trending';
          payload: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: 'pack_live' | 'trending';
          payload?: any;
          created_at?: string;
        };
      };

    };
  };
};

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Wrap with performance tracking in development mode
export const supabase = process.env.NODE_ENV === 'development'
  ? wrapSupabaseWithPerformanceTracking(supabaseClient)
  : supabaseClient;

// Helper functions for working with the database

// Users
export async function getUser(twitchId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('twitch_id', twitchId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createUser(userData: Database['public']['Tables']['users']['Insert']) {
  // Add profile_image_url to the user data if it's not already included
  if (!userData.profile_image_url && userData.twitch_id) {
    try {
      // We can't get the profile image directly without a token
      // The profile image will be updated when the user logs in
      // and we have their access token
      console.log('Profile image will be updated on next login');
    } catch (error) {
      console.error('Error handling profile image:', error);
    }
  }

  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUser(id: string, userData: Database['public']['Tables']['users']['Update']) {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Packs
export async function getPack(id: string) {
  const { data, error } = await supabase
    .from('packs')
    .select(`
      *,
      pack_streams(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserPacks(userId: string) {
  const { data, error } = await supabase
    .from('packs')
    .select(`
      *,
      pack_streams(*)
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createPack(packData: Database['public']['Tables']['packs']['Insert']) {
  const { data, error } = await supabase
    .from('packs')
    .insert(packData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePack(id: string, packData: Database['public']['Tables']['packs']['Update']) {
  const { data, error } = await supabase
    .from('packs')
    .update(packData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deletePack(id: string) {
  const { error } = await supabase
    .from('packs')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Pack Streams
export async function addStreamToPack(streamData: Database['public']['Tables']['pack_streams']['Insert']) {
  const { data, error } = await supabase
    .from('pack_streams')
    .insert(streamData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function removeStreamFromPack(id: string) {
  const { error } = await supabase
    .from('pack_streams')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Get public packs with sorting options
export async function getPublicPacks(
  options: {
    sort?: 'newest' | 'oldest' | 'popular' | 'alphabetical';
    limit?: number;
    offset?: number;
    tag?: string;
    search?: string;
  } = {}
) {
  const {
    sort = 'newest',
    limit = 20,
    offset = 0,
    tag,
    search,
  } = options;
  
  let query = supabase
    .from('packs')
    .select(`
      *,
      pack_streams(*),
      owner:users!packs_owner_id_fkey(
        display_name,
        profile_image_url
      )
    `)
    .eq('visibility', 'public')
    .range(offset, offset + limit - 1);
  
  // Apply sorting
  switch (sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'popular':
      // For now, we'll just sort by created_at as a placeholder
      // In the future, this would be based on view count or other popularity metrics
      query = query.order('created_at', { ascending: false });
      break;
    case 'alphabetical':
      query = query.order('title', { ascending: true });
      break;
  }
  
  // Apply tag filter if provided
  if (tag) {
    query = query.contains('tags', [tag]);
  }
  
  // Apply search filter if provided
  if (search) {
    // Search in both title and tags
    query = query.or(`title.ilike.%${search}%,tags.cs.{${search}}`);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

// Trending Packs
export async function getTrendingPacks(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('packs')
      .select(`
        *,
        pack_streams(count)
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching trending packs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTrendingPacks:', error);
    throw error;
  }
}