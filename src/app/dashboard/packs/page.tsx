import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { twitchApi } from '@/lib/twitch-api';
import { getUser, getUserPacks, createUser } from '@/lib/supabase';
import PackGrid from '@/components/packs/PackGrid';
import CreatePackButton from '@/components/packs/CreatePackButton';

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

export default async function PacksPage() {
  // Get the authenticated user
  const user = await getAuthenticatedUser();
  
  // If not authenticated, redirect to login
  if (!user) {
    redirect('/');
  }
  
  // Get the user's packs
  const packs = await getUserPacks(user.id);
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Packs</h1>
        <CreatePackButton />
      </div>
      
      <div className="mb-12">
        <PackGrid
          packs={packs}
          currentUserId={user.id}
          emptyMessage="You haven't created any packs yet. Create your first pack to get started!"
        />
      </div>
      
      <div className="bg-[#18181b] rounded-lg p-6 border border-[#2d2d3a]">
        <h2 className="text-xl font-bold mb-4">About Packs</h2>
        <p className="text-gray-300 mb-4">
          Packs are collections of Twitch streams that you can save and share with others.
          Create packs for your favorite streamers, events, or topics.
        </p>
        
        <h3 className="text-lg font-medium mb-2">With Packs, you can:</h3>
        <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
          <li>Group multiple streams together for easy access</li>
          <li>Share your favorite streamers with friends</li>
          <li>Watch multiple perspectives of the same event</li>
          <li>Create public packs that others can discover</li>
          <li>Save private packs for your personal use</li>
        </ul>
        
        {!user.premium_flag && (
          <div className="mt-6 bg-[#9146FF]/10 border border-[#9146FF] rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-[#9146FF]">Upgrade to Premium</h3>
            <p className="text-gray-300 mb-4">
              Premium users can create unlimited packs and access advanced features like VOD synchronization.
            </p>
            <Link href="/premium" className="twitch-button">
              Upgrade Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}