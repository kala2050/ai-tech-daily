// components/ContentItem.tsx

import { ContentItem as ContentItemType } from '@/lib/types';

interface ContentItemProps {
  item: ContentItemType;
  showSummary?: boolean;
}

const SOURCE_TYPE_LABELS = {
  academic: '学术',
  industry: '工业',
  media: '媒体',
};

const SOURCE_TYPE_COLORS = {
  academic: 'bg-blue-100 text-blue-700',
  industry: 'bg-green-100 text-green-700',
  media: 'bg-orange-100 text-orange-700',
};

export default function ContentItem({ item, showSummary = true }: ContentItemProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 优先显示中文内容
  const displayTitle = item.titleZh || item.title;
  const displaySummary = item.summaryZh || item.summary;

  return (
    <article className="group p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
      {/* Title */}
      <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
          {displayTitle}
        </a>
      </h3>

      {/* Summary */}
      {showSummary && displaySummary && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">
          {displaySummary}
        </p>
      )}

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Meta Info */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded ${SOURCE_TYPE_COLORS[item.sourceType]}`}>
            {SOURCE_TYPE_LABELS[item.sourceType]}
          </span>
          <span>{item.sourceName}</span>
        </div>
        <time>{formatDate(item.publishedAt)}</time>
      </div>

      {/* Action */}
      <div className="mt-3 flex items-center justify-end">
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          查看原文 →
        </a>
      </div>
    </article>
  );
}
