'use client';

import { useState } from 'react';

interface CopyLinkButtonProps {
  url: string;
}

export default function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-2 border border-[#2d2d3a] rounded text-white hover:bg-[#2d2d3a]"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}