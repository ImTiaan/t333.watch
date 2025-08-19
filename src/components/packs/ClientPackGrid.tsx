'use client';

import SimplifiedPackGrid from './SimplifiedPackGrid';

interface ClientPackGridProps {
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

export default function ClientPackGrid({ 
  packs, 
  emptyMessage 
}: ClientPackGridProps) {
  return (
    <SimplifiedPackGrid 
      packs={packs} 
      emptyMessage={emptyMessage} 
    />
  );
}