// components/CategoryCard.tsx

import Link from 'next/link';
import { ContentItem } from '@/lib/types';

interface CategoryCardProps {
  title: string;
  category: string;
  items: ContentItem[];
  count: number;
}

export default function CategoryCard({ title, category, items, count }: CategoryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">共 {count} 条</span>
        </div>
      </div>

      {/* Content List */}
      <div className="p-4 space-y-3">
        {items.length > 0 ? (
          items.slice(0, 5).map(item => (
            <div key={item.id} className="group">
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-700 hover:text-blue-600 line-clamp-2"
              >
                {item.titleZh || item.title}
              </a>
              <div className="mt-1 text-xs text-gray-500">
                {item.sourceName} · {formatDate(item.publishedAt)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            暂无内容
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <Link
          href={`/${category}`}
          className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          查看更多 →
        </Link>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}
