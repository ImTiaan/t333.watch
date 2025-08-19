import { NextRequest, NextResponse } from 'next/server';
import { getPublicPacks } from '@/lib/supabase';

// GET /api/packs/public - Get public packs with sorting and filtering options
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') as 'newest' | 'oldest' | 'popular' | 'alphabetical' || 'newest';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string) : 0;
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;
    
    // Get public packs
    const packs = await getPublicPacks({
      sort,
      limit,
      offset,
      tag: tag as string | undefined,
      search: search as string | undefined,
    });
    
    return NextResponse.json({ packs });
  } catch (error) {
    console.error('Error getting public packs:', error);
    return NextResponse.json({ error: 'Failed to get public packs' }, { status: 500 });
  }
}