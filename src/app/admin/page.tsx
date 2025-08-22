import { redirect } from 'next/navigation';
import { requireAdmin } from '@/middleware/auth';
import { cookies } from 'next/headers';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  // Check admin authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('twitch_access_token')?.value;
  
  if (!token) {
    redirect('/auth/login');
  }

  try {
    // Create a mock request object for middleware
    const mockRequest = {
      headers: new Headers({
        'Cookie': `twitch_access_token=${token}`
      })
    } as any;

    const authResult = await requireAdmin(mockRequest);
    
    if ('error' in authResult) {
      redirect('/dashboard');
    }

    return (
      <div className="min-h-screen bg-[#0e0e10]">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Subscription analytics and platform metrics</p>
          </div>
          
          <AdminDashboard />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Admin authentication error:', error);
    redirect('/dashboard');
  }
}

export const metadata = {
  title: 'Admin Dashboard - t333.watch',
  description: 'Admin dashboard for subscription analytics and platform metrics',
};