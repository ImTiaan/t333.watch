import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

/**
 * API route to exchange authorization code for access token
 * This runs on the server to keep the client secret secure
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authorization code from the request body
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { message: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Exchange the code for an access token
    const tokenUrl = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams({
      client_id: config.twitch.clientId,
      client_secret: config.twitch.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.twitch.redirectUri,
    });

    const response = await fetch(`${tokenUrl}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Twitch token exchange error:', errorData);
      
      return NextResponse.json(
        { message: 'Failed to exchange code for token' },
        { status: response.status }
      );
    }

    // Return the token response to the client
    const tokenData = await response.json();
    
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('Token exchange error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}