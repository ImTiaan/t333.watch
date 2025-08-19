'use client';

import { useRouter } from 'next/navigation';

interface CreatePackButtonProps {
  className?: string;
}

export default function CreatePackButton({ className }: CreatePackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to the new pack page
    router.push('/dashboard/packs/new');
  };

  return (
    <button
      onClick={handleClick}
      className={className || 'twitch-button'}
    >
      Create New Pack
    </button>
  );
}