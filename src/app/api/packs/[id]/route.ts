import { NextRequest, NextResponse } from 'next/server';
import { getPack, updatePack, deletePack, getUser, createUser } from '@/lib/supabase';
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

// GET /api/packs/[id] - Get a specific pack
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
    
    return NextResponse.json({ pack });
  } catch (error) {
    console.error('Error getting pack:', error);
    return NextResponse.json({ error: 'Failed to get pack' }, { status: 500 });
  }
}

// PUT /api/packs/[id] - Update a pack
export async function PUT(
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
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Update the pack
    const updatedPack = await updatePack(id, {
      title: body.title,
      description: body.description || null,
      tags: body.tags || null,
      visibility: body.visibility || 'private',
    });
    
    return NextResponse.json({ pack: updatedPack });
  } catch (error) {
    console.error('Error updating pack:', error);
    return NextResponse.json({ error: 'Failed to update pack' }, { status: 500 });
  }
}

// DELETE /api/packs/[id] - Delete a pack
export async function DELETE(
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
    
    // Delete the pack
    await deletePack(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pack:', error);
    return NextResponse.json({ error: 'Failed to delete pack' }, { status: 500 });
  }
}