import Link from 'next/link';
import { cookies } from 'next/headers';
import { twitchApi } from '@/lib/twitch-api';
import { getUser, getTrendingPacks, createUser } from '@/lib/supabase';
import PackGrid from '@/components/packs/PackGrid';

// Force dynamic rendering because this page uses cookies
export const dynamic = 'force-dynamic';

async function getAuthenticatedUser() {
  try {
    // Get the access token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('twitch_access_token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Set the token in the API client
    twitchApi.setAccessToken(token);
    
    // Get the user info
    const userInfo = await twitchApi.getUser();
    
    // Get the user from the database or create if not exists
    let user = null;
    try {
      user = await getUser(userInfo.id);
    } catch (error) {
      // User doesn't exist in the database yet, create them
      try {
        user = await createUser({
          twitch_id: userInfo.id,
          display_name: userInfo.display_name,
          premium_flag: false,
        });
        console.log('Created new user in Supabase');
      } catch (createError) {
        console.error('Error creating user in Supabase:', createError);
        return null;
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

export default async function DiscoverPage() {
  // Get the authenticated user (optional)
  const user = await getAuthenticatedUser();
  
  // Get trending packs (limit to 20)
  const packs = await getTrendingPacks(20);
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Discover Packs</h1>
        {user && (
          <Link href="/dashboard/packs/new" className="twitch-button">
            Create Your Own Pack
          </Link>
        )}
      </div>
      
      {/* Featured section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Trending Packs</h2>
        <p className="text-gray-300 mb-6">
          Discover popular packs created by the community. Watch multiple streams together for a better viewing experience.
        </p>
        
        <PackGrid
          packs={packs}
          currentUserId={user?.id}
          emptyMessage="No trending packs available at the moment. Check back later or create your own!"
        />
      </div>
      
      {/* Categories section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Popular Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Roleplay', icon: '🎭', description: 'Multiple POVs of RP servers and storylines' },
            { name: 'Esports', icon: '🏆', description: 'Tournament streams with player and caster perspectives' },
            { name: 'IRL', icon: '📱', description: 'Events, conventions, and real-life streams' },
            { name: 'Gaming', icon: '🎮', description: 'Multiplayer games and collaborations' },
            { name: 'Music', icon: '🎵', description: 'Concerts, festivals, and music streams' },
            { name: 'TTRPG', icon: '🎲', description: 'D&D and other tabletop roleplaying games' },
          ].map((category) => (
            <div
              key={category.name}
              className="bg-[#18181b] rounded-lg p-6 border border-[#2d2d3a] hover:border-[#9146FF] transition-colors"
            >
              <div className="text-4xl mb-2">{category.icon}</div>
              <h3 className="text-xl font-bold mb-1">{category.name}</h3>
              <p className="text-gray-400 text-sm">{category.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* About section */}
      <div className="bg-[#18181b] rounded-lg p-6 border border-[#2d2d3a]">
        <h2 className="text-xl font-bold mb-4">About t333.watch</h2>
        <p className="text-gray-300 mb-4">
          t333.watch is a platform for watching multiple Twitch streams simultaneously.
          Create and share packs of your favorite streamers, or discover packs created by others.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-[#0e0e10] p-4 rounded-lg">
            <h3 className="font-bold mb-2">Watch Together</h3>
            <p className="text-gray-400 text-sm">
              View multiple streams at once, with synchronized audio control.
            </p>
          </div>
          <div className="bg-[#0e0e10] p-4 rounded-lg">
            <h3 className="font-bold mb-2">Create & Share</h3>
            <p className="text-gray-400 text-sm">
              Build your own packs and share them with friends or the community.
            </p>
          </div>
          <div className="bg-[#0e0e10] p-4 rounded-lg">
            <h3 className="font-bold mb-2">Discover New Content</h3>
            <p className="text-gray-400 text-sm">
              Find new streamers and perspectives through curated packs.
            </p>
          </div>
        </div>
        
        {!user && (
          <div className="mt-8 text-center">
            <Link href="/" className="twitch-button">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}