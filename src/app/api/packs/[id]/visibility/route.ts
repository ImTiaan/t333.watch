import { NextRequest, NextResponse } from 'next/server';
import { getPack } from '@/lib/supabase';

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