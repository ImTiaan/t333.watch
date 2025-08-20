import { NextRequest, NextResponse } from 'next/server';
import { getPack, addStreamToPack, getUser, createUser } from '@/lib/supabase';
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
    } catch {
      // User doesn't exist, create a new one
      try {
        user = await createUser({
          twitch_id: userInfo.id,
          login: userInfo.login,
          display_name: userInfo.display_name,
          premium_flag: false,
        });
        console.log('Created new user in Supabase');
      } catch (createError) {
        console.error('Error creating user in Supabase:', createError);
        return null;
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

// POST /api/packs/[id]/streams - Add a stream to a pack
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user
    const user = await getAuthenticatedUser(request);
    
    // Check if the user is authenticated
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the pack ID from the URL
    const { id } = params;
    
    // Get the pack
    const pack = await getPack(id);
    
    // Check if the pack exists
    if (!pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }
    
    // Check if the user is the owner of the pack
    if (pack.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get the request body
    const body = await request.json();
    
    // Validate the request body
    if (!body.channel) {
      return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
    }
    
    // Get the current order of streams in the pack
    const currentOrder = pack.pack_streams ? pack.pack_streams.length : 0;
    
    // Add the stream to the pack
    const stream = await addStreamToPack({
      pack_id: id,
      twitch_channel: body.channel,
      order: body.order || currentOrder,
      offset_seconds: body.offset_seconds || 0,
    });
    
    return NextResponse.json({ stream }, { status: 201 });
  } catch {
    console.error('Error adding stream to pack');
    return NextResponse.json({ error: 'Failed to add stream to pack' }, { status: 500 });
  }
}