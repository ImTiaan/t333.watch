import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { twitchApi } from '@/lib/twitch-api';
import { getUser, getPack, createUser } from '@/lib/supabase';
import PackForm from '@/components/packs/PackForm';

// Force dynamic rendering because this page uses cookies
export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

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
          login: userInfo.login,
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
  } catch {
    console.error('Error getting authenticated user');
    return null;
  }
}

export default async function EditPackPage({ params }: PageProps) {
  // Get the authenticated user
  const user = await getAuthenticatedUser();
  
  // If not authenticated, redirect to login
  if (!user) {
    redirect('/');
  }
  
  // Get the pack
  const pack = await getPack(params.id);
  
  // If the pack doesn't exist, show 404
  if (!pack) {
    notFound();
  }
  
  // If the user is not the owner of the pack, redirect to dashboard
  if (pack.owner_id !== user.id) {
    redirect('/dashboard/packs');
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <Link href={`/dashboard/packs/${params.id}`} className="text-[#9146FF] hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Pack Details
        </Link>
      </div>
      
      <div className="bg-[#18181b] rounded-lg p-6 border border-[#2d2d3a]">
        <h1 className="text-2xl font-bold mb-6">Edit Pack</h1>
        
        <PackForm
          initialData={{
            id: pack.id,
            title: pack.title,
            description: pack.description || '',
            tags: pack.tags || [],
            visibility: pack.visibility,
          }}
        />
      </div>
    </div>
  );
}