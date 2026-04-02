// app/ai-tech/page.tsx

import { readCategoryData } from '@/lib/storage';
import ContentList from '@/components/ContentList';

// 禁用静态生成，使用动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AITechPage() {
  const data = await readCategoryData('ai-tech');

  return (
    <ContentList
      items={data.items}
      title="AI 技术 - 最新进展"
    />
  );
}
