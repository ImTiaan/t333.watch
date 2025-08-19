import { NextRequest, NextResponse } from 'next/server';
import { getTrendingPacks } from '@/lib/supabase';

// GET /api/packs/trending - Get trending packs
export async function GET(request: NextRequest) {
  try {
    // Get the limit from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;
    
    // Get trending packs
    const packs = await getTrendingPacks(limit);
    
    return NextResponse.json({ packs });
  } catch (error) {
    console.error('Error getting trending packs:', error);
    return NextResponse.json({ error: 'Failed to get trending packs' }, { status: 500 });
  }
}