'use client';

import Link from 'next/link';
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
    <header className="bg-[#18181b] border-b border-[#2d2d3a] p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-white">
            <span className="text-[#9146FF]">t333</span>.watch
          </Link>
        </div>
        
        {isLoading ? (
          <div className="w-32 h-10 bg-[#3a3a3d] rounded animate-pulse"></div>
        ) : isAuthenticated ? (
          <div className="flex items-center gap-6">
            <nav>
              <ul className="flex gap-6">
                <li>
                  <Link 
                    href="/dashboard" 
                    className={`text-white hover:text-[#9146FF] transition-colors ${isActive('/dashboard') ? 'font-bold text-[#9146FF]' : ''}`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/viewer" 
                    className={`text-white hover:text-[#9146FF] transition-colors ${isActive('/viewer') ? 'font-bold text-[#9146FF]' : ''}`}
                  >
                    Viewer
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/packs"
                    className={`text-white hover:text-[#9146FF] transition-colors ${isActive('/dashboard/packs') ? 'font-bold text-[#9146FF]' : ''}`}
                  >
                    My Packs
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/discover" 
                    className={`text-white hover:text-[#9146FF] transition-colors ${isActive('/discover') ? 'font-bold text-[#9146FF]' : ''}`}
                  >
                    Discover
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/subscription"
                    className={`text-white hover:text-[#9146FF] transition-colors ${isActive('/dashboard/subscription') ? 'font-bold text-[#9146FF]' : ''}`}
                  >
                    {user?.premium_flag ? (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#9146FF]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Premium
                      </span>
                    ) : (
                      'Upgrade'
                    )}
                  </Link>
                </li>
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