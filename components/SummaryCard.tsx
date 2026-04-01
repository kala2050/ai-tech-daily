// components/SummaryCard.tsx

import { Summary } from '@/lib/types';

interface SummaryCardProps {
  summary: Summary;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  if (!summary) return null;

  const sections = [
    { label: 'AI 技术', content: summary.aiTech, icon: '🤖' },
    { label: '智能体技术', content: summary.agentTech, icon: '🦾' },
    { label: '图形技术', content: summary.graphicsTech, icon: '🎨' },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">今日摘要</h2>
        <span className="text-xs text-gray-500">
          由 {summary.model} 生成
        </span>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.label} className="flex gap-3">
            <span className="text-lg flex-shrink-0">{section.icon}</span>
            <div>
              <span className="font-medium text-gray-800">{section.label}：</span>
              <span className="text-gray-600">{section.content}</span>
            </div>
          </div>
        ))}

        {summary.trend && (
          <div className="mt-4 pt-4 border-t border-blue-100">
            <div className="flex gap-3">
              <span className="text-lg">📈</span>
              <div>
                <span className="font-medium text-gray-800">趋势点评：</span>
                <span className="text-gray-600">{summary.trend}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
