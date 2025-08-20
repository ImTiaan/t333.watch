import { NextRequest, NextResponse } from 'next/server';
import { getUserPacks, createPack, getUser, createUser, supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { twitchApi } from '@/lib/twitch-api';

// Helper function to get the authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Get the access token from request headers or cookies
    let token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    // If no token in headers, try cookies
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('twitch_access_token')?.value;
    }
    
    if (!token) {
      return null;
    }
    
    // Set the token in the API client
    twitchApi.setAccessToken(token);
    
    // Get the user info
    const userInfo = await twitchApi.getUser();
    
    // Get or create the user in the database
    let user = null;
    try {
      user = await getUser(userInfo.id);
      
      // Update the user's profile image if it has changed
      if (user && userInfo.profile_image_url && user.profile_image_url !== userInfo.profile_image_url) {
        await supabase
          .from('users')
          .update({ profile_image_url: userInfo.profile_image_url })
          .eq('id', user.id);
        
        // Update the local user object
        user.profile_image_url = userInfo.profile_image_url;
      }
    } catch (error) {
      // User doesn't exist, create a new one
      user = await createUser({
        twitch_id: userInfo.id,
        display_name: userInfo.display_name,
        premium_flag: false,
        profile_image_url: userInfo.profile_image_url,
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

// GET /api/packs - Get all packs for the current user
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const user = await getAuthenticatedUser(request);
    
    // Check if the user is authenticated
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user's packs
    const packs = await getUserPacks(user.id);
    
    return NextResponse.json({ packs });
  } catch {
    console.error('Error getting packs');
    return NextResponse.json({ error: 'Failed to get packs' }, { status: 500 });
  }
}

// POST /api/packs - Create a new pack
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const user = await getAuthenticatedUser(request);
    
    // Check if the user is authenticated
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the request body
    const body = await request.json();
    
    // Validate the request body
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Check if a pack with the same title was recently created by this user
    // This helps prevent duplicate submissions
    const { data: existingPacks } = await supabase
      .from('packs')
      .select('id, created_at')
      .eq('owner_id', user.id)
      .eq('title', body.title)
      .order('created_at', { ascending: false })
      .limit(1);
    
    // If a pack with the same title was created in the last minute, return that pack
    if (existingPacks && existingPacks.length > 0) {
      const existingPack = existingPacks[0];
      const createdAt = new Date(existingPack.created_at);
      const now = new Date();
      const diffInSeconds = (now.getTime() - createdAt.getTime()) / 1000;
      
      // If the pack was created less than 60 seconds ago, return it instead of creating a new one
      if (diffInSeconds < 60) {
        console.log('Preventing duplicate pack creation');
        return NextResponse.json({ pack: existingPack }, { status: 201 });
      }
    }
    
    // Create the pack
    const pack = await createPack({
      owner_id: user.id,
      title: body.title,
      description: body.description || null,
      tags: body.tags || null,
      visibility: body.visibility || 'private',
    });
    
    return NextResponse.json({ pack }, { status: 201 });
  } catch (error) {
    console.error('Error creating pack:', error);
    return NextResponse.json({ error: 'Failed to create pack' }, { status: 500 });
  }
}