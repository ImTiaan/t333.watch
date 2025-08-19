import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { twitchApi } from '@/lib/twitch-api';
import { getUser, getPack, createUser } from '@/lib/supabase';
import PackStreamManager from '@/components/packs/PackStreamManager';
import SharePackSection from '@/components/packs/SharePackSection';

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

export default async function PackDetailsPage({ params }: PageProps) {
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
  
  // Check if the user is the owner of the pack
  const isOwner = pack.owner_id === user.id;
  
  // If the pack is private and the user is not the owner, redirect to dashboard
  if (pack.visibility === 'private' && !isOwner) {
    redirect('/dashboard/packs');
  }
  
  // Format the date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <Link href="/dashboard/packs" className="text-[#9146FF] hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to My Packs
        </Link>
      </div>
      
      {/* Pack header */}
      <div className="bg-[#18181b] rounded-lg p-6 border border-[#2d2d3a] mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{pack.title}</h1>
            {pack.description && (
              <p className="text-gray-300 mt-2">{pack.description}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mt-4">
              {pack.tags && pack.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs bg-[#2d2d3a] text-white px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
              
              <span className={`text-xs px-2 py-1 rounded-full ${
                pack.visibility === 'public'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-[#2d2d3a] text-white'
              }`}>
                {pack.visibility === 'public' ? 'Public' : 'Private'}
              </span>
            </div>
            
            <p className="text-gray-400 text-sm mt-4">
              Created on {formatDate(pack.created_at)}
            </p>
          </div>
          
          {isOwner && (
            <div className="flex gap-2">
              <Link
                href={`/dashboard/packs/${params.id}/edit`}
                className="px-4 py-2 border border-[#2d2d3a] rounded text-white hover:bg-[#2d2d3a]"
              >
                Edit Details
              </Link>
              <Link
                href={`/viewer?pack=${params.id}`}
                className="twitch-button"
              >
                Watch Now
              </Link>
            </div>
          )}
        </div>
        
        {/* Share section */}
        <SharePackSection packId={params.id} />
      </div>
      
      {/* Stream manager (only for owner) */}
      {isOwner && (
        <div className="bg-[#18181b] rounded-lg p-6 border border-[#2d2d3a]">
          <PackStreamManager
            packId={params.id}
            initialStreams={pack.pack_streams || []}
          />
        </div>
      )}
      
      {/* Stream list (for non-owners) */}
      {!isOwner && pack.pack_streams && pack.pack_streams.length > 0 && (
        <div className="bg-[#18181b] rounded-lg p-6 border border-[#2d2d3a]">
          <h2 className="text-xl font-bold mb-4">Streams in this Pack</h2>
          <div className="space-y-2">
            {pack.pack_streams.map((stream: { id: string; twitch_channel: string; order: number }) => (
              <div
                key={stream.id}
                className="bg-[#0e0e10] border border-[#2d2d3a] rounded-lg p-4 flex items-center"
              >
                <div className="w-8 h-8 bg-[#2d2d3a] rounded-full flex items-center justify-center text-xs mr-3">
                  {stream.order + 1}
                </div>
                <div className="font-medium">{stream.twitch_channel}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Link
              href={`/viewer?pack=${params.id}`}
              className="twitch-button"
            >
              Watch All Streams
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}