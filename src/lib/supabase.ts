import { createClient } from '@supabase/supabase-js';

// Types for our database tables
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          twitch_id: string;
          display_name: string;
          premium_flag: boolean;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          twitch_id: string;
          display_name: string;
          premium_flag?: boolean;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          twitch_id?: string;
          display_name?: string;
          premium_flag?: boolean;
          stripe_customer_id?: string | null;
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
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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

// Trending Packs
export async function getTrendingPacks(limit = 10) {
  const { data, error } = await supabase
    .from('packs')
    .select(`
      *,
      pack_streams(*)
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}