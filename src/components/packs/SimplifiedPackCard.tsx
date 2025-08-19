'use client';

import Link from 'next/link';
import Image from 'next/image';

interface SimplifiedPackCardProps {
  pack: {
    id: string;
    title: string;
    description: string | null;
    tags: string[] | null;
    owner_id: string;
    owner?: {
      display_name: string;
      profile_image_url?: string | null;
    };
  };
}

export default function SimplifiedPackCard({ pack }: SimplifiedPackCardProps) {
  return (
    <Link 
      href={`/viewer?pack=${pack.id}`}
      className="twitch-card block hover:border-[#9146FF] transition-all duration-200"
    >
      <div className="p-4">
        {/* Header with creator info */}
        <div className="flex items-center mb-3">
          {pack.owner?.profile_image_url ? (
            <Image
              src={pack.owner.profile_image_url}
              alt={pack.owner.display_name || 'Creator'}
              width={32}
              height={32}
              className="rounded-full mr-2"
              unoptimized={true}
            />
          ) : (
            <div className="w-8 h-8 bg-[#3a3a3d] rounded-full mr-2 flex items-center justify-center text-xs">
              {(pack.owner?.display_name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm text-gray-300">
            {pack.owner?.display_name || 'Unknown Creator'}
          </span>
        </div>
        
        {/* Pack title */}
        <h3 className="text-lg font-bold mb-1 line-clamp-1">{pack.title}</h3>
        
        {/* Pack description */}
        {pack.description && (
          <p className="text-sm text-gray-300 mb-3 line-clamp-2">
            {pack.description}
          </p>
        )}
        
        {/* Tags */}
        {pack.tags && pack.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {pack.tags.map((tag) => (
              <Link
                key={tag}
                href={`/discover?tag=${encodeURIComponent(tag)}`}
                className="bg-[#2d2d3a] hover:bg-[#3d3d4a] text-gray-300 px-2 py-0.5 rounded-full text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}