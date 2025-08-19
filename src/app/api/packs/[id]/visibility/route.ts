import { NextRequest, NextResponse } from 'next/server';
import { getPack, updatePack, getUser } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { twitchApi } from '@/lib/twitch-api';

// Helper function to get the authenticated user
async function getAuthenticatedUser() {
  try {
    // Get the access token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('twitch_access_token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Set the token in the API client
    twitchApi.setAccessToken(token);
    
    // Get the user info
    const userInfo = await twitchApi.getUser();
    
    // Get the user from the database
    const user = await getUser(userInfo.id);
    
    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

// GET /api/packs/[id]/visibility - Get the visibility of a pack
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the pack ID from the URL
    const { id } = params;
    
    // Get the pack
    const pack = await getPack(id);
    
    // Check if the pack exists
    if (!pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }
    
    // Return the visibility
    return NextResponse.json({ visibility: pack.visibility });
  } catch (error) {
    console.error('Error getting pack visibility:', error);
    return NextResponse.json({ error: 'Failed to get pack visibility' }, { status: 500 });
  }
}

// PATCH /api/packs/[id]/visibility - Update the visibility of a pack
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user
    const user = await getAuthenticatedUser();
    
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get the new visibility from the request body
    const body = await request.json();
    
    // Validate the visibility
    if (!body.visibility || !['public', 'private'].includes(body.visibility)) {
      return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
    }
    
    // Update the pack visibility
    const updatedPack = await updatePack(id, { visibility: body.visibility });
    
    // Return the updated pack
    return NextResponse.json({ pack: updatedPack });
  } catch (error) {
    console.error('Error updating pack visibility:', error);
    return NextResponse.json({ error: 'Failed to update pack visibility' }, { status: 500 });
  }
}