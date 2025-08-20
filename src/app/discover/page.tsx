import { cookies } from 'next/headers';
import { twitchApi } from '@/lib/twitch-api';
import { getUser, getPublicPacks, createUser, supabase } from '@/lib/supabase';
import DiscoverPageClient from '@/components/packs/DiscoverPageClient';

// Force dynamic rendering because this page uses cookies
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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
      
      // Update the user's profile image if it has changed
      if (user && userInfo.profile_image_url && user.profile_image_url !== userInfo.profile_image_url) {
        await supabase
          .from('users')
          .update({ profile_image_url: userInfo.profile_image_url })
          .eq('id', user.id);
        
        // Update the local user object
        user.profile_image_url = userInfo.profile_image_url;
      }
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
  
  // Get all public packs
  const packs = await getPublicPacks({
    sort: 'newest',
    limit: 100, // Get more packs since filtering will be done client-side
  });
  
  return (
    <DiscoverPageClient 
      initialPacks={packs} 
      userId={user?.id}
    />
  );
}