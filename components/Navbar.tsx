// components/Navbar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: '首页', path: '/' },
  { label: 'AI 技术', path: '/ai-tech' },
  { label: '智能体技术', path: '/agent-tech' },
  { label: '图形技术', path: '/graphics-tech' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">AI Tech Daily</span>
            <span className="text-sm text-gray-500">技术日报</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.path
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
