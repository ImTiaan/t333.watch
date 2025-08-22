'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Header() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  const pathname = usePathname();

  // Check if a link is active
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  return (
    <header className="bg-[#18181b] border-b border-[#2d2d3a] py-3 px-6 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/t3logo.png"
              alt="t333.watch"
              width={240}
              height={80}
              className="h-16 w-auto"
              priority
            />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="w-32 h-10 bg-[#3a3a3d] rounded animate-pulse"></div>
        ) : isAuthenticated ? (
          <div className="flex items-center gap-6">
            <nav>
              <ul className="flex gap-6">
                {/* Dashboard Icon */}
                <li className="relative group">
                  <Link
                    href="/dashboard"
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${isActive('/dashboard') ? 'bg-[#9146FF]/20 text-[#9146FF]' : 'text-white hover:bg-[#2d2d3a] hover:text-[#9146FF]'}`}
                    aria-label="Dashboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-[#18181b] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Dashboard</span>
                  </Link>
                </li>
                
                {/* Viewer Icon */}
                <li className="relative group">
                  <Link
                    href="/viewer"
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${isActive('/viewer') ? 'bg-[#9146FF]/20 text-[#9146FF]' : 'text-white hover:bg-[#2d2d3a] hover:text-[#9146FF]'}`}
                    aria-label="Stream Viewer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-[#18181b] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Stream Viewer</span>
                  </Link>
                </li>
                
                {/* My Packs Icon */}
                <li className="relative group">
                  <Link
                    href="/dashboard/packs"
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${isActive('/dashboard/packs') ? 'bg-[#9146FF]/20 text-[#9146FF]' : 'text-white hover:bg-[#2d2d3a] hover:text-[#9146FF]'}`}
                    aria-label="My Packs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-[#18181b] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">My Packs</span>
                  </Link>
                </li>
                
                {/* Discover Icon */}
                <li className="relative group">
                  <Link
                    href="/discover"
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${isActive('/discover') ? 'bg-[#9146FF]/20 text-[#9146FF]' : 'text-white hover:bg-[#2d2d3a] hover:text-[#9146FF]'}`}
                    aria-label="Discover"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-[#18181b] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Discover</span>
                  </Link>
                </li>
                
                {/* Premium/Upgrade Icon */}
                <li className="relative group">
                  <Link
                    href="/dashboard/subscription"
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${isActive('/dashboard/subscription') ? 'bg-[#9146FF]/20 text-[#9146FF]' : 'text-white hover:bg-[#2d2d3a] hover:text-[#9146FF]'}`}
                    aria-label={user?.premium_flag ? "Premium Status" : "Upgrade to Premium"}
                  >
                    {user?.premium_flag ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l.707.707L15.414 4a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-2-2A1 1 0 0110 6.414l1.293 1.293L14.586 4 13.414 2.879l-1.707-.707A1 1 0 0112 2z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                        <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                      </svg>
                    )}
                    <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-[#18181b] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {user?.premium_flag ? "Premium" : "Upgrade"}
                    </span>
                  </Link>
                </li>
                
                {/* Admin Dashboard Icon - Only show for admin users */}
                {user?.admin_flag && (
                  <li className="relative group">
                    <Link
                      href="/admin"
                      className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${isActive('/admin') ? 'bg-red-500/20 text-red-400' : 'text-white hover:bg-[#2d2d3a] hover:text-red-400'}`}
                      aria-label="Admin Dashboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-[#18181b] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Admin
                      </span>
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {user?.profile_image_url && (
                  <img 
                    src={user.profile_image_url} 
                    alt={user.display_name} 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-white">{user?.display_name}</span>
              </div>
              <button 
                onClick={logout}
                className="twitch-button-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={login}
            className="twitch-button"
          >
            Login with Twitch
          </button>
        )}
      </div>
    </header>
  );
}