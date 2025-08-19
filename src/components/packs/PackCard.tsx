'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface PackCardProps {
  pack: Pack;
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

export default function PackCard({ pack, isOwner = false, onDelete }: PackCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Format the date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/packs/${pack.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete pack');
      }
      
      onDelete(pack.id);
      router.refresh();
    } catch (error) {
      console.error('Error deleting pack:', error);
      alert('Failed to delete pack. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };
  
  // Handle view
  const handleView = () => {
    router.push(`/viewer?pack=${pack.id}`);
  };
  
  return (
    <div className="bg-[#18181b] rounded-lg overflow-hidden border border-[#2d2d3a] hover:border-[#9146FF] transition-colors">
      {/* Card header */}
      <div className="p-4 border-b border-[#2d2d3a]">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-white truncate">{pack.title}</h3>
          <div className="flex items-center">
            {pack.visibility === 'private' && (
              <span className="text-xs bg-[#2d2d3a] text-white px-2 py-1 rounded-full">
                Private
              </span>
            )}
          </div>
        </div>
        {pack.description && (
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{pack.description}</p>
        )}
      </div>
      
      {/* Card content */}
      <div className="p-4">
        {/* Streams */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Streams</h4>
          <div className="space-y-2">
            {pack.pack_streams && pack.pack_streams.length > 0 ? (
              pack.pack_streams.slice(0, 3).map((stream) => (
                <div key={stream.id} className="flex items-center">
                  <div className="w-8 h-8 bg-[#2d2d3a] rounded-full flex items-center justify-center text-xs">
                    {stream.order + 1}
                  </div>
                  <div className="ml-2 text-white">{stream.twitch_channel}</div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No streams added yet</p>
            )}
            
            {pack.pack_streams && pack.pack_streams.length > 3 && (
              <p className="text-gray-500 text-sm">
                +{pack.pack_streams.length - 3} more streams
              </p>
            )}
          </div>
        </div>
        
        {/* Tags */}
        {pack.tags && pack.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {pack.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-[#2d2d3a] text-white px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Created date */}
        <div className="text-xs text-gray-500">
          Created {formatDate(pack.created_at)}
        </div>
      </div>
      
      {/* Card actions */}
      <div className="p-4 border-t border-[#2d2d3a] flex justify-between">
        <button
          onClick={handleView}
          className="twitch-button-secondary text-sm py-1 px-3"
        >
          Watch Now
        </button>
        
        {isOwner && (
          <div className="flex gap-2">
            {showConfirmDelete ? (
              <>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="text-sm py-1 px-3 border border-[#2d2d3a] rounded hover:bg-[#2d2d3a]"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="text-sm py-1 px-3 bg-red-500 text-white rounded hover:bg-red-600"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/dashboard/packs/${pack.id}/edit`}
                  className="text-sm py-1 px-3 border border-[#2d2d3a] rounded hover:bg-[#2d2d3a]"
                >
                  Edit
                </Link>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="text-sm py-1 px-3 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}