import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://t333.watch';
  
  try {
    // Fetch public packs for sitemap
    const { data: packs } = await supabase
      .from('packs')
      .select('id, updated_at')
      .eq('visibility', 'public')
      .order('updated_at', { ascending: false })
      .limit(1000); // Limit to prevent huge sitemaps

    const staticPages = [
      {
        url: `${baseUrl}/`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 1.0
      },
      {
        url: `${baseUrl}/discover`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'hourly',
        priority: 0.9
      },
      {
        url: `${baseUrl}/viewer`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 0.8
      }
    ];

    const packPages = (packs || []).map((pack: { id: string; updated_at: string }) => ({
      url: `${baseUrl}/viewer?pack=${pack.id}`,
      lastModified: pack.updated_at,
      changeFrequency: 'weekly',
      priority: 0.7
    }));

    const allPages = [...staticPages, ...packPages];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return basic sitemap on error
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/discover</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

    return new NextResponse(basicSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });
  }
}