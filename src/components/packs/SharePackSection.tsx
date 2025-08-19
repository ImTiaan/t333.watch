'use client';

import { useState } from 'react';
import CopyLinkButton from './CopyLinkButton';

interface SharePackSectionProps {
  packId: string;
}

export default function SharePackSection({ packId }: SharePackSectionProps) {
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/viewer?pack=${packId}`;

  return (
    <div className="mt-6 pt-6 border-t border-[#2d2d3a]">
      <h2 className="text-lg font-medium mb-3">Share this Pack</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-grow bg-[#0e0e10] text-white border border-[#2d2d3a] rounded px-4 py-2 focus:outline-none focus:border-[#9146FF]"
        />
        <CopyLinkButton url={shareUrl} />
      </div>
    </div>
  );
}