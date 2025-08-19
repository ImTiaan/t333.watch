import { NextRequest, NextResponse } from 'next/server';
import { getUserPacks, createPack, getUser, createUser } from '@/lib/supabase';
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
    } catch (error) {
      // User doesn't exist, create a new one
      user = await createUser({
        twitch_id: userInfo.id,
        display_name: userInfo.display_name,
        premium_flag: false,
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
  } catch (error) {
    console.error('Error getting packs:', error);
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