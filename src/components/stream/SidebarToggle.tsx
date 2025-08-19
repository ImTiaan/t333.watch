'use client';

interface SidebarToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

/**
 * A toggle button for the stream sidebar
 * Shows when the sidebar is closed
 */
export default function SidebarToggle({ isOpen, onClick }: SidebarToggleProps) {
  if (isOpen) return null;
  
  return (
    <button
      onClick={onClick}
      className="fixed top-1/2 right-0 transform -translate-y-1/2 bg-[#18181b] text-white p-2 rounded-l-md shadow-lg hover:bg-[#2d2d3a] transition-colors z-10"
      title="Open Stream Sidebar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    </button>
  );
}