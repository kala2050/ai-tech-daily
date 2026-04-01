// components/FilterBar.tsx

'use client';

import { useState } from 'react';
import { SourceType } from '@/lib/types';

interface FilterBarProps {
  onFilterChange: (filters: { sourceType?: SourceType }) => void;
}

const SOURCE_FILTERS = [
  { label: '全部', value: undefined },
  { label: '学术', value: 'academic' as SourceType },
  { label: '工业', value: 'industry' as SourceType },
  { label: '媒体', value: 'media' as SourceType },
];

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeFilter, setActiveFilter] = useState<number>(0);

  const handleFilterClick = (index: number) => {
    setActiveFilter(index);
    onFilterChange({ sourceType: SOURCE_FILTERS[index].value });
  };

  return (
    <div className="flex items-center gap-2 py-4">
      <span className="text-sm text-gray-500">来源：</span>
      <div className="flex items-center gap-1">
        {SOURCE_FILTERS.map((filter, index) => (
          <button
            key={index}
            onClick={() => handleFilterClick(index)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeFilter === index
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
