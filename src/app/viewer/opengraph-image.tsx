import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image(req: NextRequest) {
  try {
    // Get the searchParams from the request URL
    const { searchParams } = new URL(req.url);
    
    // Get the pack ID from the searchParams
    const packId = searchParams.get('pack');
    
    if (!packId) {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              backgroundColor: '#0e0e10',
              color: 'white',
              padding: '40px',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              t333.watch
            </div>
            <div
              style={{
                fontSize: '24px',
                marginTop: '20px',
              }}
            >
              Watch multiple Twitch streams simultaneously
            </div>
          </div>
        ),
        { ...size }
      );
    }
    
    // Fetch the pack data
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/packs/${packId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch pack data');
    }
    
    const data = await response.json();
    const pack = data.pack;
    
    // Extract streams from the pack
    const streams = pack.pack_streams?.map((s: any) => s.twitch_channel) || [];
    
    // Generate the image
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#0e0e10',
            color: 'white',
            padding: '40px',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4l-4 4v-4H5a1 1 0 0 1-1-1V5z"
                fill="#9146FF"
                stroke="#9146FF"
                strokeWidth="2"
              />
            </svg>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                marginLeft: '10px',
              }}
            >
              t333.watch
            </span>
          </div>
          
          {/* Pack title */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '30px',
              maxWidth: '80%',
            }}
          >
            {pack.title}
          </div>
          
          {/* Stream grid preview */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '20px',
              maxWidth: '80%',
            }}
          >
            {streams.slice(0, 4).map((stream: string, index: number) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#18181b',
                  borderRadius: '8px',
                  padding: '20px',
                  width: '280px',
                  height: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #2d2d3a',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#9146FF',
                  }}
                >
                  {stream}
                </div>
              </div>
            ))}
            
            {/* Show placeholder for additional streams */}
            {streams.length > 4 && (
              <div
                style={{
                  backgroundColor: '#18181b',
                  borderRadius: '8px',
                  padding: '20px',
                  width: '280px',
                  height: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #2d2d3a',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#9146FF',
                  }}
                >
                  +{streams.length - 4} more
                </div>
              </div>
            )}
            
            {/* Show empty placeholders if less than 4 streams */}
            {streams.length < 4 &&
              Array.from({ length: 4 - streams.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  style={{
                    backgroundColor: '#18181b',
                    borderRadius: '8px',
                    padding: '20px',
                    width: '280px',
                    height: '160px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #2d2d3a',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      color: '#2d2d3a',
                    }}
                  >
                    Empty
                  </div>
                </div>
              ))}
          </div>
          
          {/* Footer */}
          <div
            style={{
              marginTop: '40px',
              fontSize: '24px',
              color: '#9146FF',
            }}
          >
            Watch multiple Twitch streams simultaneously
          </div>
        </div>
      ),
      { ...size }
    );
  } catch (error) {
    // If there's an error, return a simple error image
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#0e0e10',
            color: 'white',
            padding: '40px',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            t333.watch
          </div>
          <div
            style={{
              fontSize: '24px',
              marginTop: '20px',
            }}
          >
            Watch multiple Twitch streams simultaneously
          </div>
        </div>
      ),
      { ...size }
    );
  }
}