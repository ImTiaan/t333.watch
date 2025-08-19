import Link from 'next/link';
import PackForm from '@/components/packs/PackForm';

export default function NewPackSimplePage() {
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
      
      <div className="bg-[#18181b] rounded-lg p-6 border border-[#2d2d3a]">
        <h1 className="text-2xl font-bold mb-6">Create New Pack (Simple)</h1>
        
        <PackForm />
      </div>
    </div>
  );
}
