// components/ContentList.tsx

'use client';

import { useState } from 'react';
import { ContentItem, SourceType } from '@/lib/types';
import ContentItemComponent from './ContentItem';
import FilterBar from './FilterBar';

interface ContentListProps {
  items: ContentItem[];
  title: string;
}

export default function ContentList({ items, title }: ContentListProps) {
  const [filters, setFilters] = useState<{ sourceType?: SourceType }>({});

  // 应用筛选
  const filteredItems = filters.sourceType
    ? items.filter(item => item.sourceType === filters.sourceType)
    : items;

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          共 {filteredItems.length} 条内容
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar onFilterChange={setFilters} />

      {/* Content Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <ContentItemComponent key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-gray-500">暂无符合条件的内容</p>
        </div>
      )}
    </div>
  );
}
