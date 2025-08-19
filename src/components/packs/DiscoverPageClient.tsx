'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ClientPackGrid from './ClientPackGrid';
import SearchAndFilterSection from './SearchAndFilterSection';

type SortOption = 'newest' | 'oldest' | 'popular' | 'alphabetical';

interface Pack {
  id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  owner_id: string;
  owner?: {
    display_name: string;
    profile_image_url?: string | null;
  };
  created_at: string;
}

interface DiscoverPageClientProps {
  initialPacks: Pack[];
  userId?: string;
}

export default function DiscoverPageClient({ initialPacks, userId }: DiscoverPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packs, setPacks] = useState<Pack[]>(initialPacks);
  const [filteredPacks, setFilteredPacks] = useState<Pack[]>(initialPacks);
  
  // Get search parameters
  const sortParam = searchParams.get('sort') || 'newest';
  const sort = ['newest', 'oldest', 'popular', 'alphabetical'].includes(sortParam)
    ? sortParam as SortOption
    : 'newest';
  
  const tag = searchParams.get('tag') || '';
  const searchQuery = searchParams.get('search') || '';
  
  // Filter and sort packs when parameters change
  useEffect(() => {
    let result = [...packs];
    
    // Apply tag filter
    if (tag) {
      result = result.filter(pack => 
        pack.tags && pack.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(pack => 
        pack.title.toLowerCase().includes(query) || 
        (pack.tags && pack.tags.some(t => t.toLowerCase().includes(query)))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'popular':
          // For now, just sort by created_at as a placeholder
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredPacks(result);
  }, [packs, tag, searchQuery, sort]);
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Discover Packs</h1>
        {userId && (
          <Link href="/dashboard/packs/new" className="twitch-button">
            Create Your Own Pack
          </Link>
        )}
      </div>
      
      {/* Search and filter section */}
      <SearchAndFilterSection 
        initialSearchQuery={searchQuery} 
        initialTag={tag} 
      />
      
      {/* Packs section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          {searchQuery ? `Search Results for "${searchQuery}"` :
           tag ? `Packs Tagged with "${tag}"` :
           sort === 'popular' ? 'Popular Packs' :
           sort === 'newest' ? 'Newest Packs' :
           sort === 'oldest' ? 'Oldest Packs' :
           'All Packs'}
        </h2>
        
        <ClientPackGrid
          packs={filteredPacks}
          emptyMessage={
            searchQuery || tag 
              ? "No packs match your search criteria. Try different keywords or filters."
              : "No packs available at the moment. Check back later or create your own!"
          }
        />
      </div>
    </div>
  );
}