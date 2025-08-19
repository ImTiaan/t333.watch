'use client';

import SimplifiedPackCard from './SimplifiedPackCard';

interface SimplifiedPackGridProps {
  packs: Array<{
    id: string;
    title: string;
    description: string | null;
    tags: string[] | null;
    owner_id: string;
    owner?: {
      display_name: string;
      profile_image_url?: string | null;
    };
  }>;
  emptyMessage?: string;
}

export default function SimplifiedPackGrid({ 
  packs, 
  emptyMessage = "No packs found" 
}: SimplifiedPackGridProps) {
  if (!packs || packs.length === 0) {
    return (
      <div className="bg-[#18181b] border border-[#2d2d3a] rounded-lg p-8 text-center text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {packs.map((pack) => (
        <SimplifiedPackCard key={pack.id} pack={pack} />
      ))}
    </div>
  );
}