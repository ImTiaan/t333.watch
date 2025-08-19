'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ClientSortOptions from './ClientSortOptions';

interface SearchAndFilterSectionProps {
  initialSearchQuery?: string;
  initialTag?: string;
}

export default function SearchAndFilterSection({
  initialSearchQuery = '',
  initialTag = ''
}: SearchAndFilterSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    
    // Keep the tag parameter if it exists
    if (initialTag) {
      params.set('tag', initialTag);
    }
    
    router.push(`/discover?${params.toString()}`);
  };
  
  return (
    <div className="bg-[#18181b] border border-[#2d2d3a] rounded-lg p-4 mb-8">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="w-full md:w-1/2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search packs..."
              className="twitch-input flex-grow"
            />
            <button type="submit" className="twitch-button">
              Search
            </button>
          </form>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Client-side sort options component */}
          <div className="w-full md:w-auto">
            <ClientSortOptions />
          </div>
        </div>
      </div>
      
      {/* Active filters display */}
      {(initialTag || initialSearchQuery) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {initialTag && (
            <div className="bg-[#9146FF]/20 text-[#9146FF] px-3 py-1 rounded-full text-sm flex items-center">
              Tag: {initialTag}
              <Link href={`/discover${initialSearchQuery ? `?search=${initialSearchQuery}` : ''}`} className="ml-2 hover:text-white">
                &times;
              </Link>
            </div>
          )}
          
          {initialSearchQuery && (
            <div className="bg-[#9146FF]/20 text-[#9146FF] px-3 py-1 rounded-full text-sm flex items-center">
              Search: {initialSearchQuery}
              <Link href={`/discover${initialTag ? `?tag=${initialTag}` : ''}`} className="ml-2 hover:text-white">
                &times;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}