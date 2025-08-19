import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#18181b] border-t border-[#2d2d3a] py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} t333.watch. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              t333.watch is not affiliated with Twitch.
            </p>
          </div>
          <div className="flex gap-6">
            <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}