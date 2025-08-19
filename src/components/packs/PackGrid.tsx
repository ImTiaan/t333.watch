'use client';

import { useState } from 'react';
import PackCard from './PackCard';

interface Stream {
  id: string;
  twitch_channel: string;
  order: number;
  offset_seconds: number;
}

interface Pack {
  id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  visibility: 'public' | 'private';
  owner_id: string;
  created_at: string;
  updated_at: string;
  pack_streams: Stream[];
}

interface PackGridProps {
  packs: Pack[];
  currentUserId?: string;
  emptyMessage?: string;
  onDelete?: (id: string) => void;
}

export default function PackGrid({
  packs,
  currentUserId,
  emptyMessage = 'No packs found',
  onDelete,
}: PackGridProps) {
  const [localPacks, setLocalPacks] = useState<Pack[]>(packs);
  
  // Handle delete
  const handleDelete = (id: string) => {
    setLocalPacks(localPacks.filter((pack) => pack.id !== id));
    if (onDelete) {
      onDelete(id);
    }
  };
  
  // If there are no packs, show an empty state
  if (localPacks.length === 0) {
    return (
      <div className="bg-[#18181b] rounded-lg p-8 text-center">
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {localPacks.map((pack) => (
        <PackCard
          key={pack.id}
          pack={pack}
          isOwner={currentUserId === pack.owner_id}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}