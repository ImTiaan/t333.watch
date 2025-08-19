'use client';

import SortOptions, { SortOption } from './SortOptions';

interface ClientSortOptionsProps {
  initialSort?: SortOption;
  onChange?: (option: SortOption) => void;
  className?: string;
}

export default function ClientSortOptions({
  initialSort,
  onChange,
  className
}: ClientSortOptionsProps) {
  return (
    <SortOptions
      onChange={onChange}
      className={className}
    />
  );
}