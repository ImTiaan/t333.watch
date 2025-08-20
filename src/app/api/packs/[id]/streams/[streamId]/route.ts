import { NextRequest, NextResponse } from 'next/server';
import { getPack, removeStreamFromPack, getUser, createUser } from '@/lib/supabase';
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
      try {
        user = await createUser({
          twitch_id: userInfo.id,
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

// DELETE /api/packs/[id]/streams/[streamId] - Remove a stream from a pack
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; streamId: string } }
) {
  try {
    // Get the authenticated user
    const user = await getAuthenticatedUser(request);
    
    // Check if the user is authenticated
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the pack ID and stream ID from the URL
    const { id, streamId } = params;
    
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
    
    // Remove the stream from the pack
    await removeStreamFromPack(streamId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing stream from pack:', error);
    return NextResponse.json({ error: 'Failed to remove stream from pack' }, { status: 500 });
  }
}