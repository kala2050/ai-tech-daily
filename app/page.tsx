import { readLatestData } from '@/lib/storage';
import CategoryCard from '@/components/CategoryCard';
import SummaryCard from '@/components/SummaryCard';
import RefreshButton from '@/components/RefreshButton';
import { LatestData } from '@/lib/types';

// 禁用静态生成，使用动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CATEGORY_INFO = {
  'ai-tech': { title: 'AI 技术', description: '大模型、深度学习、NLP 等' },
  'agent-tech': { title: '智能体技术', description: 'Agent、多智能体、RAG 等' },
  'graphics-tech': { title: '图形技术', description: '渲染、GPU、视觉计算等' },
};

export default async function HomePage() {
  const data: LatestData = await readLatestData();

  const updateTime = new Date(data.updatedAt).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Tech Daily</h1>
            <p className="mt-2 text-gray-600">
              每日自动采集 AI、智能体、图形技术领域的最新进展
            </p>
          </div>
          <RefreshButton />
        </div>
        <p className="mt-2 text-sm text-gray-500">更新时间：{updateTime}</p>
      </div>

      {/* Summary Card */}
      {data.summary && <SummaryCard summary={data.summary} />}

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(data.categories).map(([category, info]) => (
          <CategoryCard
            key={category}
            title={CATEGORY_INFO[category as keyof typeof CATEGORY_INFO].title}
            category={category}
            items={info.items}
            count={info.count}
          />
        ))}
      </div>
    </div>
  );
}
