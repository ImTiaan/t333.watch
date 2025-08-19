'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type SortOption = 'newest' | 'oldest' | 'popular' | 'alphabetical';

interface SortOptionsProps {
  onChange?: (option: SortOption) => void;
  className?: string;
}

export default function SortOptions({ onChange, className = '' }: SortOptionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the sort option from the URL or default to 'newest'
  const [sortOption, setSortOption] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'newest'
  );
  
  // Update the URL when the sort option changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sortOption);
    
    // Replace the current URL with the new one
    router.replace(`?${params.toString()}`, { scroll: false });
    
    // Call the onChange callback if provided
    if (onChange) {
      onChange(sortOption);
    }
  }, [sortOption, router, searchParams, onChange]);
  
  const options: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'alphabetical', label: 'Alphabetical' },
  ];
  
  return (
    <div className={`flex items-center ${className}`}>
      <label htmlFor="sort-select" className="text-sm text-gray-300 mr-2">
        Sort by:
      </label>
      <select
        id="sort-select"
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value as SortOption)}
        className="twitch-select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}